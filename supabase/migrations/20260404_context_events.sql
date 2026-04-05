-- ============================================================================
-- Context Events Migration
-- Enables subjective logging: energy, stress, mood, symptoms, notes.
-- These feed into daily summaries and the correlation engine.
-- ============================================================================

-- ============================================================================
-- 1. Context Events Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS context_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  -- event_type values: 'energy', 'stress', 'mood', 'symptom', 'note'
  value TEXT,                           -- e.g. 'tired', 'headache', 'great', '3'
  numeric_value DOUBLE PRECISION,       -- normalized 1-10 scale when applicable
  raw_text TEXT,                        -- original user input (for chat-based context)
  source TEXT DEFAULT 'manual',         -- 'manual', 'chat', 'quick_capture'
  event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_context_events_user_time
  ON context_events(user_id, event_time DESC);

CREATE INDEX IF NOT EXISTS idx_context_events_user_type
  ON context_events(user_id, event_type, event_time DESC);

ALTER TABLE context_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own context events"
  ON context_events FOR ALL USING (auth.uid() = user_id);


-- ============================================================================
-- 2. Add context summary columns to daily_nutrition_summaries
-- ============================================================================

ALTER TABLE daily_nutrition_summaries
  ADD COLUMN IF NOT EXISTS avg_energy_level DOUBLE PRECISION;

ALTER TABLE daily_nutrition_summaries
  ADD COLUMN IF NOT EXISTS avg_stress_level DOUBLE PRECISION;

ALTER TABLE daily_nutrition_summaries
  ADD COLUMN IF NOT EXISTS avg_mood_level DOUBLE PRECISION;

ALTER TABLE daily_nutrition_summaries
  ADD COLUMN IF NOT EXISTS symptom_tags TEXT[];

ALTER TABLE daily_nutrition_summaries
  ADD COLUMN IF NOT EXISTS context_event_count INTEGER DEFAULT 0;
