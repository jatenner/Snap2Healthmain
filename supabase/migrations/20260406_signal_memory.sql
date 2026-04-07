-- Signal Memory: Persistent longitudinal signal tracking
-- Tracks recurring deficiencies, timing issues, and drivers across sessions.
-- Written by insight-builder after each /api/today call.
-- Read by recommendation-engine for priority boosting and recurrence classification.

CREATE TABLE IF NOT EXISTS signal_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_id TEXT NOT NULL,              -- e.g., "deficiency_magnesium", "timing_caffeine_afternoon"
  category TEXT NOT NULL,               -- "deficiency", "timing", "score", "pattern", "biometric"

  -- Longitudinal tracking
  first_seen DATE NOT NULL,
  last_seen DATE NOT NULL,
  times_triggered INTEGER DEFAULT 1,
  times_improved INTEGER DEFAULT 0,     -- how many times the metric improved after this signal appeared

  -- Rolling status
  days_present_last_14 INTEGER DEFAULT 1,
  days_total_last_14 INTEGER DEFAULT 1,
  current_status TEXT DEFAULT 'new',    -- "new", "recurring", "persistent", "improving", "resolved"
  trend TEXT DEFAULT 'stable',          -- "worsening", "stable", "improving"

  -- Latest values for trend detection
  recent_values JSONB,                  -- last N metric values (newest first)

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, signal_id)
);

CREATE INDEX IF NOT EXISTS idx_signal_memory_user ON signal_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_signal_memory_status ON signal_memory(user_id, current_status);

-- RLS
ALTER TABLE signal_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY signal_memory_user_select ON signal_memory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY signal_memory_user_insert ON signal_memory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY signal_memory_user_update ON signal_memory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY signal_memory_user_delete ON signal_memory FOR DELETE USING (auth.uid() = user_id);
