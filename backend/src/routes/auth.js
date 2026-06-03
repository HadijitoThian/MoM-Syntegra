import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { pool } from '../db.js';
import { signToken, requireAuth } from '../auth.js';
import { sendEmail } from '../email.js';
import { quotaSummary } from '../quota.js';

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    company: u.company,
    subscription_status: u.subscription_status,
    trial_ends_at: u.trial_ends_at,
    subscription_ends_at: u.subscription_ends_at,
    quota: quotaSummary(u),
  };
}

router.post('/signup', async (req, res) => {
  const { email, password, full_name, company } = req.body || {};
  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'invalid_email' });
  if (!password || password.length < 8) return res.status(400).json({ error: 'password_too_short' });

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (existing.rowCount > 0) return res.status(409).json({ error: 'email_taken' });

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, company)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [normalizedEmail, hash, full_name || null, company || null],
  );
  const user = rows[0];
  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'missing_credentials' });

  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

  await pool.query('UPDATE users SET last_login = now() WHERE id = $1', [user.id]);
  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

router.post('/logout', (_req, res) => {
  // JWT is stateless — client just discards the token. Endpoint exists for symmetry.
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
  if (!rows[0]) return res.status(404).json({ error: 'user_not_found' });
  res.json({ user: publicUser(rows[0]) });
});

// Diagnostic: send a test email to the logged-in user and return Resend's response.
// Helps verify FROM_EMAIL + RESEND_API_KEY + verified domain end-to-end.
router.post('/test-email', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT email, full_name FROM users WHERE id = $1', [req.userId]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'user_not_found' });

  const cfg = {
    has_resend_key: !!process.env.RESEND_API_KEY,
    from_email: process.env.FROM_EMAIL || '(default) noreply@syntegra.co.id',
    public_url: process.env.PUBLIC_URL || '(unset)',
    reply_to: process.env.REPLY_TO_EMAIL || '(unset)',
  };

  try {
    const result = await sendEmail({
      to: user.email,
      subject: '✅ Syntegra MoM — Tes Email',
      text: `Halo${user.full_name ? ` ${user.full_name}` : ''},\n\nIni adalah email tes dari Syntegra MoM. Jika Anda menerima ini, konfigurasi email berhasil.\n\nTimestamp: ${new Date().toISOString()}`,
      html: `<p>Halo${user.full_name ? ` ${user.full_name}` : ''},</p><p>Ini adalah email tes dari Syntegra MoM. Jika Anda menerima ini, konfigurasi email berhasil.</p><p style="color:#94a3b8;font-size:12px;">Timestamp: ${new Date().toISOString()}</p>`,
    });
    res.json({ ok: true, config: cfg, result });
  } catch (err) {
    res.status(502).json({ ok: false, config: cfg, error: err.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'missing_email' });

  // Always respond ok to avoid leaking which emails exist.
  const normalized = email.toLowerCase().trim();
  const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [normalized]);
  const user = rows[0];
  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expires],
    );
    const publicUrl = process.env.PUBLIC_URL || 'http://localhost:5173';
    const link = `${publicUrl}/reset-password?token=${rawToken}`;
    try {
      await sendEmail({
        to: normalized,
        subject: 'Reset password Syntegra MoM',
        text: `Klik link berikut untuk reset password Anda (berlaku 1 jam):\n\n${link}\n\nJika Anda tidak meminta ini, abaikan email ini.`,
        html: `<p>Klik link berikut untuk reset password Anda (berlaku 1 jam):</p><p><a href="${link}">${link}</a></p><p>Jika Anda tidak meminta ini, abaikan email ini.</p>`,
      });
    } catch (err) {
      console.error('[forgot-password] email failed:', err.message);
    }
  }
  res.json({ ok: true });
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: 'missing_fields' });
  if (password.length < 8) return res.status(400).json({ error: 'password_too_short' });

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const { rows } = await pool.query(
    `SELECT * FROM password_reset_tokens
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()`,
    [tokenHash],
  );
  const row = rows[0];
  if (!row) return res.status(400).json({ error: 'invalid_or_expired_token' });

  const hash = await bcrypt.hash(password, 10);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, row.user_id]);
    await client.query('UPDATE password_reset_tokens SET used_at = now() WHERE id = $1', [row.id]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  res.json({ ok: true });
});

export default router;
