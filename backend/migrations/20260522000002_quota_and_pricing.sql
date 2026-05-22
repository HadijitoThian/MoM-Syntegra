-- Quota tracking + top-up purchases + pricing bump to Rp 59,000.

ALTER TABLE users
  ADD COLUMN base_audio_seconds_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN bonus_audio_seconds INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN quota_period_start TIMESTAMP NOT NULL DEFAULT now();

CREATE TABLE topup_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  midtrans_order_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  minutes_added INTEGER NOT NULL,
  amount_idr INTEGER NOT NULL,
  raw_callback JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_topups_user ON topup_purchases(user_id);

-- Pricing bump for new subscription rows
ALTER TABLE subscriptions ALTER COLUMN amount_idr SET DEFAULT 59000;
