-- ============================================================
-- Weekly Challenge Winners (admin handpicked) — Supabase SQL
-- ============================================================

CREATE TABLE IF NOT EXISTS weekly_task_winners (
  id          SERIAL PRIMARY KEY,
  task_id     INTEGER NOT NULL REFERENCES weekly_tasks(task_id) ON DELETE CASCADE,
  user_id     BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  rank        INTEGER,
  note        TEXT,
  picked_by   BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (task_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_weekly_task_winners_task ON weekly_task_winners (task_id, rank);
