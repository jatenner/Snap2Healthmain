-- ============================================================================
-- Recurring Habits Migration
-- Allows users to set daily repeating intake items (e.g., morning coffee).
-- Auto-logged by the system each day without manual input.
-- ============================================================================

CREATE TABLE IF NOT EXISTS recurring_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preset_id UUID REFERENCES quick_add_presets(id) ON DELETE SET NULL,

  -- What to log (either from preset or custom)
  name TEXT NOT NULL,
  intake_type TEXT NOT NULL DEFAULT 'drink',
  calories INTEGER DEFAULT 0,
  protein DOUBLE PRECISION DEFAULT 0,
  carbs DOUBLE PRECISION DEFAULT 0,
  fat DOUBLE PRECISION DEFAULT 0,
  macronutrients JSONB DEFAULT '[]',
  micronutrients JSONB DEFAULT '[]',
  water_ml DOUBLE PRECISION,

  -- Schedule
  time_of_day TIME NOT NULL DEFAULT '08:00',  -- When to log it
  frequency TEXT NOT NULL DEFAULT 'daily',     -- 'daily', 'weekdays', 'weekends'
  active BOOLEAN NOT NULL DEFAULT true,

  -- Tracking
  last_logged_date DATE,                       -- Prevents double-logging
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_habits_user
  ON recurring_habits(user_id, active);

ALTER TABLE recurring_habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own habits"
  ON recurring_habits FOR ALL USING (auth.uid() = user_id);
