import { pool } from './db.js';

// Plan quotas (seconds)
export const TRIAL_QUOTA_SECONDS = 150 * 60;   // 150 min
export const PAID_QUOTA_SECONDS = 750 * 60;    // 750 min

// Top-up
export const TOPUP_MINUTES = 300;
export const TOPUP_PRICE_IDR = 25000;

// Subscription
export const PLAN_PRICE_IDR = 59000;
export const PLAN_MINUTES = 750;

export function baseQuotaSeconds(user) {
  return user.subscription_status === 'trial' ? TRIAL_QUOTA_SECONDS : PAID_QUOTA_SECONDS;
}

export function quotaSummary(user) {
  const base = baseQuotaSeconds(user);
  const used = user.base_audio_seconds_used || 0;
  const bonus = user.bonus_audio_seconds || 0;
  const remaining = Math.max(0, base - used) + bonus;
  return {
    base_quota_seconds: base,
    base_used_seconds: used,
    bonus_remaining_seconds: bonus,
    total_remaining_seconds: remaining,
  };
}

export async function requireQuota(req, res, next) {
  const { rows } = await pool.query(
    `SELECT subscription_status, base_audio_seconds_used, bonus_audio_seconds
       FROM users WHERE id = $1`,
    [req.userId],
  );
  const u = rows[0];
  if (!u) return res.status(401).json({ error: 'user_not_found' });
  const s = quotaSummary(u);
  if (s.total_remaining_seconds <= 0) {
    return res.status(402).json({ error: 'quota_exhausted', ...s });
  }
  req.quota = s;
  next();
}

// Atomic deduction: burn base first, then bonus. Returns the new state.
export async function deductUsage(userId, secondsUsed) {
  const safeSeconds = Math.max(0, Math.floor(secondsUsed || 0));
  if (safeSeconds === 0) return;

  // Pull current state + plan to know base quota.
  const { rows } = await pool.query(
    `SELECT subscription_status, base_audio_seconds_used, bonus_audio_seconds
       FROM users WHERE id = $1 FOR UPDATE`,
    [userId],
  );
  const u = rows[0];
  if (!u) return;
  const base = u.subscription_status === 'trial' ? TRIAL_QUOTA_SECONDS : PAID_QUOTA_SECONDS;
  const baseRemaining = Math.max(0, base - (u.base_audio_seconds_used || 0));
  const fromBase = Math.min(baseRemaining, safeSeconds);
  const fromBonus = Math.max(0, safeSeconds - fromBase);
  const newBaseUsed = (u.base_audio_seconds_used || 0) + fromBase;
  const newBonus = Math.max(0, (u.bonus_audio_seconds || 0) - fromBonus);

  await pool.query(
    `UPDATE users SET base_audio_seconds_used = $1, bonus_audio_seconds = $2 WHERE id = $3`,
    [newBaseUsed, newBonus, userId],
  );
}

export async function addBonusMinutes(userId, minutes) {
  await pool.query(
    `UPDATE users SET bonus_audio_seconds = bonus_audio_seconds + $1 WHERE id = $2`,
    [Math.floor(minutes * 60), userId],
  );
}

export async function resetBasePeriod(userId) {
  await pool.query(
    `UPDATE users
        SET base_audio_seconds_used = 0,
            quota_period_start = now()
      WHERE id = $1`,
    [userId],
  );
}
