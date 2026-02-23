-- Init-Accessibility Database Schema
-- Run via: psql $POSTGRES_URL -f schema.sql
-- Or call GET /api/setup once after deploying to Vercel.

-- ────────────────────────────────────────────────────────────
-- User accessibility preferences (keyed by anonymous UUID)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
  id          SERIAL PRIMARY KEY,
  session_id  VARCHAR(64) UNIQUE NOT NULL,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_session
  ON user_preferences (session_id);

-- ────────────────────────────────────────────────────────────
-- Feedback submitted by users
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(120),
  email      VARCHAR(254),
  category   VARCHAR(64) NOT NULL DEFAULT 'general',
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- Community resources (managed via DB, shown on front-end)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resources (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  tag         VARCHAR(64) NOT NULL DEFAULT 'General',
  url         VARCHAR(512),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
