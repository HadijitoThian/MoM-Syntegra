-- Bump default plan price (Rp 59,000 → Rp 79,000) and trial length (7d → 14d)
-- to match the public landing page positioning. Existing rows are unchanged.

ALTER TABLE subscriptions
  ALTER COLUMN amount_idr SET DEFAULT 79000;

ALTER TABLE users
  ALTER COLUMN trial_ends_at SET DEFAULT (now() + INTERVAL '14 days');
