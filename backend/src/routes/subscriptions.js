import express from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';
import {
  createSnapTransaction,
  createTopupTransaction,
  verifySignature,
  isPaidStatus,
  PLAN_AMOUNT_IDR,
  TOPUP_AMOUNT_IDR,
  TOPUP_MINUTES,
} from '../midtrans.js';
import { addBonusMinutes, resetBasePeriod } from '../quota.js';

const router = express.Router();

// ──────────────────────────────────────────────
// Subscription checkout
// ──────────────────────────────────────────────
router.post('/checkout', requireAuth, async (req, res) => {
  if (!process.env.MIDTRANS_SERVER_KEY) {
    return res.status(503).json({ error: 'payments_not_configured' });
  }
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'user_not_found' });

  const orderId = `mom-${user.id.slice(0, 8)}-${Date.now()}`;
  await pool.query(
    `INSERT INTO subscriptions (user_id, midtrans_order_id, status, amount_idr)
     VALUES ($1, $2, 'pending', $3)`,
    [user.id, orderId, PLAN_AMOUNT_IDR],
  );

  try {
    const snap = await createSnapTransaction({ orderId, user });
    res.json({
      snap_token: snap.token,
      redirect_url: snap.redirect_url,
      client_key: process.env.MIDTRANS_CLIENT_KEY,
      sandbox: process.env.MIDTRANS_PRODUCTION !== 'true',
    });
  } catch (err) {
    console.error('[checkout] midtrans failed:', err.message);
    res.status(502).json({ error: 'midtrans_failed', detail: err.message });
  }
});

// ──────────────────────────────────────────────
// Top-up checkout
// ──────────────────────────────────────────────
router.post('/topup', requireAuth, async (req, res) => {
  if (!process.env.MIDTRANS_SERVER_KEY) {
    return res.status(503).json({ error: 'payments_not_configured' });
  }
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'user_not_found' });

  const orderId = `topup-${user.id.slice(0, 8)}-${Date.now()}`;
  await pool.query(
    `INSERT INTO topup_purchases (user_id, midtrans_order_id, status, minutes_added, amount_idr)
     VALUES ($1, $2, 'pending', $3, $4)`,
    [user.id, orderId, TOPUP_MINUTES, TOPUP_AMOUNT_IDR],
  );

  try {
    const snap = await createTopupTransaction({ orderId, user });
    res.json({
      snap_token: snap.token,
      redirect_url: snap.redirect_url,
      client_key: process.env.MIDTRANS_CLIENT_KEY,
      sandbox: process.env.MIDTRANS_PRODUCTION !== 'true',
    });
  } catch (err) {
    console.error('[topup] midtrans failed:', err.message);
    res.status(502).json({ error: 'midtrans_failed', detail: err.message });
  }
});

// ──────────────────────────────────────────────
// Unified webhook (subscription + topup, dispatched by order_id prefix)
// ──────────────────────────────────────────────
router.post('/webhook', express.json(), async (req, res) => {
  const body = req.body || {};
  if (!verifySignature(body)) {
    console.warn('[webhook] signature mismatch for', body.order_id);
    return res.status(401).json({ error: 'invalid_signature' });
  }

  const orderId = body.order_id || '';
  try {
    if (orderId.startsWith('topup-')) {
      await handleTopupCallback(body);
    } else {
      await handleSubscriptionCallback(body);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[webhook] handler error:', err.message);
    res.status(500).json({ error: 'webhook_failed' });
  }
});

async function handleSubscriptionCallback(body) {
  const { order_id, transaction_status, fraud_status } = body;
  const { rows } = await pool.query(
    'SELECT * FROM subscriptions WHERE midtrans_order_id = $1',
    [order_id],
  );
  const sub = rows[0];
  if (!sub) return;

  if (isPaidStatus(transaction_status, fraud_status)) {
    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 30);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE subscriptions
            SET status = 'paid', period_start = $1, period_end = $2, raw_callback = $3
          WHERE id = $4`,
        [periodStart, periodEnd, body, sub.id],
      );
      await client.query(
        `UPDATE users
            SET subscription_status = 'active',
                subscription_ends_at = $1,
                base_audio_seconds_used = 0,
                quota_period_start = now()
          WHERE id = $2`,
        [periodEnd, sub.user_id],
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else if (['cancel', 'deny', 'expire', 'failure'].includes(transaction_status)) {
    await pool.query(
      `UPDATE subscriptions SET status = $1, raw_callback = $2 WHERE id = $3`,
      [transaction_status, body, sub.id],
    );
  } else {
    await pool.query(
      `UPDATE subscriptions SET raw_callback = $1 WHERE id = $2`,
      [body, sub.id],
    );
  }
}

async function handleTopupCallback(body) {
  const { order_id, transaction_status, fraud_status } = body;
  const { rows } = await pool.query(
    'SELECT * FROM topup_purchases WHERE midtrans_order_id = $1',
    [order_id],
  );
  const t = rows[0];
  if (!t) return;

  if (isPaidStatus(transaction_status, fraud_status)) {
    // Idempotency: don't credit twice if Midtrans retries.
    if (t.status === 'paid') {
      await pool.query(
        `UPDATE topup_purchases SET raw_callback = $1 WHERE id = $2`,
        [body, t.id],
      );
      return;
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE topup_purchases SET status = 'paid', raw_callback = $1 WHERE id = $2`,
        [body, t.id],
      );
      await client.query(
        `UPDATE users SET bonus_audio_seconds = bonus_audio_seconds + $1 WHERE id = $2`,
        [t.minutes_added * 60, t.user_id],
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else if (['cancel', 'deny', 'expire', 'failure'].includes(transaction_status)) {
    await pool.query(
      `UPDATE topup_purchases SET status = $1, raw_callback = $2 WHERE id = $3`,
      [transaction_status, body, t.id],
    );
  } else {
    await pool.query(
      `UPDATE topup_purchases SET raw_callback = $1 WHERE id = $2`,
      [body, t.id],
    );
  }
}

router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT subscription_status, trial_ends_at, subscription_ends_at,
            base_audio_seconds_used, bonus_audio_seconds
       FROM users WHERE id = $1`,
    [req.userId],
  );
  res.json(rows[0] || {});
});

export default router;
