-- Initial schema for Syntegra MoM
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMP DEFAULT (now() + INTERVAL '7 days'),
  subscription_ends_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  last_login TIMESTAMP
);

CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  duration_seconds INTEGER NOT NULL,
  audio_url TEXT,
  transcript TEXT,
  summary JSONB,
  mind_map_mermaid TEXT,
  flagged_moments JSONB,
  email_sent_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_meetings_user_created ON meetings(user_id, created_at DESC);

CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_prt_user ON password_reset_tokens(user_id);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  midtrans_order_id TEXT UNIQUE,
  status TEXT,
  amount_idr INTEGER NOT NULL DEFAULT 49000,
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  raw_callback JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_subs_user ON subscriptions(user_id);
