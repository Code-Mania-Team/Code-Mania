-- ============================================================
-- Community Monthly Challenges & Notifications — Supabase SQL Schema
-- Import this file into your Supabase SQL editor
-- ============================================================

-- 1) Monthly challenges created by admin for users with 5000+ XP
CREATE TABLE IF NOT EXISTS monthly_tasks (
  task_id        SERIAL PRIMARY KEY,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL,
  reward_xp      INTEGER NOT NULL DEFAULT 100,
  reward_badge   TEXT,
  difficulty     TEXT NOT NULL DEFAULT 'medium'
                  CHECK (difficulty IN ('easy', 'medium', 'hard')),
  language       TEXT NOT NULL DEFAULT 'javascript',
  starter_code   TEXT DEFAULT '',
  test_cases     JSONB DEFAULT '[]'::jsonb,
  solution_code  TEXT,
  min_xp_required INTEGER NOT NULL DEFAULT 5000,
  starts_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_by     BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Tracks which users completed which monthly challenges
CREATE TABLE IF NOT EXISTS user_monthly_tasks (
  id             SERIAL PRIMARY KEY,
  user_id        BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  task_id        INTEGER NOT NULL REFERENCES monthly_tasks(task_id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'in_progress'
                  CHECK (status IN ('in_progress', 'completed', 'expired')),
  completed_at   TIMESTAMPTZ,
  xp_awarded     INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, task_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_tasks_active     ON monthly_tasks (is_active, starts_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_monthly_tasks_user  ON user_monthly_tasks (user_id, status);

-- ============================================================
-- Sample seed data (optional)
-- ============================================================

-- INSERT INTO monthly_tasks (title, description, reward_xp, difficulty, language, starter_code, test_cases, min_xp_required, starts_at, expires_at)
-- VALUES (
--   'Reverse Array',
--   'Write a function that reverses an array.\n\nInput: an array of integers\nOutput: the reversed array',
--   500,
--   'easy',
--   'javascript',
--   'function reverseArray(arr) {\n  // TODO\n}\n',
--   '[{"input":"[1,2,3]","expected_output":"[3,2,1]"},{"input":"[]","expected_output":"[]"}]'::jsonb,
--   0,
--   NOW(),
--   NOW() + INTERVAL '30 days'
-- );
