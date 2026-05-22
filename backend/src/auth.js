import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
const EXPIRES_IN = '30d';

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

import { pool } from './db.js';

export async function requireActiveSubscription(req, res, next) {
  const { rows } = await pool.query(
    `SELECT subscription_status, trial_ends_at, subscription_ends_at
       FROM users WHERE id = $1`,
    [req.userId],
  );
  const u = rows[0];
  if (!u) return res.status(401).json({ error: 'user_not_found' });
  const now = new Date();
  const trialActive = u.subscription_status === 'trial' && u.trial_ends_at && new Date(u.trial_ends_at) > now;
  const paidActive = u.subscription_status === 'active' && u.subscription_ends_at && new Date(u.subscription_ends_at) > now;
  if (!trialActive && !paidActive) {
    return res.status(402).json({ error: 'subscription_required' });
  }
  next();
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing_token' });
  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ error: 'invalid_token' });
  }
}
