-- ============================================================
-- Community Weekly Tasks & Notifications — Supabase SQL Schema
-- Import this file into your Supabase SQL editor
-- ============================================================

-- 1) Weekly tasks created by admin for users with 5000+ XP
CREATE TABLE IF NOT EXISTS weekly_tasks (
  task_id        SERIAL PRIMARY KEY,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL,
  reward_xp      INTEGER NOT NULL DEFAULT 100,
  difficulty     TEXT NOT NULL DEFAULT 'medium'   -- easy, medium, hard
                  CHECK (difficulty IN ('easy', 'medium', 'hard')),
  programming_language_id BIGINT REFERENCES programming_languages(id) ON DELETE SET NULL,
  starter_code   TEXT DEFAULT '',                -- optional starter code
  test_cases     JSONB DEFAULT '[]'::jsonb,      -- JSON array of test cases: [{input: "...", output: "..."}]
  solution_code  TEXT,                           -- actual solution logic
  cover_image    TEXT,                           -- optional cover image URL
  min_xp_required INTEGER NOT NULL DEFAULT 5000, -- users need this much total XP to see the task
  starts_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_by     BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Tracks which users completed which weekly tasks
CREATE TABLE IF NOT EXISTS user_weekly_tasks (
  id             SERIAL PRIMARY KEY,
  user_id        BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  task_id        INTEGER NOT NULL REFERENCES weekly_tasks(task_id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'in_progress'
                  CHECK (status IN ('in_progress', 'completed', 'expired')),
  completed_at   TIMESTAMPTZ,
  xp_awarded     INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, task_id)
);

-- 3) Notifications for users
CREATE TABLE IF NOT EXISTS notifications (
  notification_id  SERIAL PRIMARY KEY,
  user_id          BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type             TEXT NOT NULL DEFAULT 'general'
                    CHECK (type IN ('general', 'weekly_unlock', 'task_complete', 'xp_milestone', 'badge_earned', 'system')),
  title            TEXT NOT NULL,
  message          TEXT NOT NULL,
  is_read          BOOLEAN NOT NULL DEFAULT FALSE,
  metadata         JSONB,                          -- optional extra data (task_id, badge_id, etc.)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_weekly_tasks_active     ON weekly_tasks (is_active, starts_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_weekly_tasks_user  ON user_weekly_tasks (user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user      ON notifications (user_id, is_read, created_at DESC);

-- ============================================================
-- Sample seed data (optional — delete if you don't need it)
-- ============================================================

-- Example weekly tasks (admin-created)
-- INSERT INTO weekly_tasks (title, description, reward_xp, difficulty, min_xp_required, starts_at, expires_at)
-- VALUES
--   ('Debug the Loop',    'Find and fix the bug in the provided Python while-loop snippet.',  200, 'easy',   5000, NOW(), NOW() + INTERVAL '7 days'),
--   ('Refactor Challenge','Refactor the given JavaScript function to use async/await.',        350, 'medium', 5000, NOW(), NOW() + INTERVAL '7 days'),
--   ('Algorithm Sprint',  'Implement a binary search in C++ from scratch.',                   500, 'hard',   5000, NOW(), NOW() + INTERVAL '7 days');
