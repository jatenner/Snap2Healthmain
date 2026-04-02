-- Phase 1 Foundation: meal timing, meal tags, daily summaries
-- Enables the diet + biometrics feedback loop

-- ============================================================================
-- 1. MEAL ENHANCEMENTS: meal_time + meal_tags
-- ============================================================================

-- Actual meal time (when user ate, not when they uploaded)
ALTER TABLE meals ADD COLUMN IF NOT EXISTS meal_time TIMESTAMPTZ;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS meal_tags TEXT[];

-- Backfill meal_time from created_at for all existing meals
UPDATE meals SET meal_time = created_at WHERE meal_time IS NULL;

-- Default future inserts to use created_at if meal_time not provided
ALTER TABLE meals ALTER COLUMN meal_time SET DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_meals_user_meal_time ON meals(user_id, meal_time DESC);

-- ============================================================================
-- 2. DAILY NUTRITION SUMMARIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_nutrition_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,

  -- Meal counts and timing
  meal_count INTEGER DEFAULT 0,
  first_meal_time TIMESTAMPTZ,
  last_meal_time TIMESTAMPTZ,
  has_late_night_meal BOOLEAN DEFAULT false,  -- meal after 9pm local

  -- Macronutrients
  total_calories DOUBLE PRECISION DEFAULT 0,
  total_protein DOUBLE PRECISION DEFAULT 0,
  total_carbs DOUBLE PRECISION DEFAULT 0,
  total_fat DOUBLE PRECISION DEFAULT 0,
  total_fiber DOUBLE PRECISION DEFAULT 0,
  total_sugar DOUBLE PRECISION DEFAULT 0,
  total_sodium DOUBLE PRECISION DEFAULT 0,

  -- Key micronutrients (accumulated from meals)
  total_vitamin_d DOUBLE PRECISION DEFAULT 0,        -- mcg
  total_vitamin_c DOUBLE PRECISION DEFAULT 0,        -- mg
  total_vitamin_b12 DOUBLE PRECISION DEFAULT 0,      -- mcg
  total_calcium DOUBLE PRECISION DEFAULT 0,          -- mg
  total_iron DOUBLE PRECISION DEFAULT 0,             -- mg
  total_magnesium DOUBLE PRECISION DEFAULT 0,        -- mg
  total_potassium DOUBLE PRECISION DEFAULT 0,        -- mg
  total_zinc DOUBLE PRECISION DEFAULT 0,             -- mg
  total_omega3 DOUBLE PRECISION DEFAULT 0,           -- mg (if detectable)
  total_vitamin_a DOUBLE PRECISION DEFAULT 0,        -- mcg
  total_folate DOUBLE PRECISION DEFAULT 0,           -- mcg
  total_vitamin_e DOUBLE PRECISION DEFAULT 0,        -- mg
  total_vitamin_k DOUBLE PRECISION DEFAULT 0,        -- mcg
  total_selenium DOUBLE PRECISION DEFAULT 0,         -- mcg

  -- % of Daily Value for key nutrients
  pct_dv_protein DOUBLE PRECISION,
  pct_dv_fiber DOUBLE PRECISION,
  pct_dv_vitamin_d DOUBLE PRECISION,
  pct_dv_vitamin_c DOUBLE PRECISION,
  pct_dv_vitamin_b12 DOUBLE PRECISION,
  pct_dv_calcium DOUBLE PRECISION,
  pct_dv_iron DOUBLE PRECISION,
  pct_dv_magnesium DOUBLE PRECISION,
  pct_dv_potassium DOUBLE PRECISION,
  pct_dv_zinc DOUBLE PRECISION,

  -- Timing features
  carbs_after_8pm DOUBLE PRECISION DEFAULT 0,
  sugar_after_8pm DOUBLE PRECISION DEFAULT 0,
  calories_within_2hr_of_sleep DOUBLE PRECISION DEFAULT 0,

  -- Scores
  nutrient_adequacy_score DOUBLE PRECISION,  -- 0-100, what % of key nutrients met
  inflammatory_score DOUBLE PRECISION,       -- higher = more inflammatory diet pattern

  -- Meal tags frequency for the day
  tag_counts JSONB,  -- {"high_sugar": 2, "late_night": 1, "high_protein": 1}

  -- Rolling averages (computed at write time)
  avg_7d_calories DOUBLE PRECISION,
  avg_7d_protein DOUBLE PRECISION,
  avg_7d_fiber DOUBLE PRECISION,
  avg_7d_sugar DOUBLE PRECISION,
  avg_14d_nutrient_adequacy DOUBLE PRECISION,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, summary_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_nutrition_user_date
  ON daily_nutrition_summaries(user_id, summary_date DESC);

-- ============================================================================
-- 3. DAILY BIOMETRIC SUMMARIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_biometric_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,

  -- Sleep metrics (from whoop_sleep)
  sleep_score DOUBLE PRECISION,              -- sleep_performance_pct
  sleep_duration_minutes INTEGER,            -- total_in_bed - total_awake
  sleep_efficiency DOUBLE PRECISION,         -- sleep_efficiency_pct
  sleep_consistency DOUBLE PRECISION,        -- sleep_consistency_pct
  deep_sleep_minutes INTEGER,
  rem_sleep_minutes INTEGER,
  light_sleep_minutes INTEGER,
  respiratory_rate DOUBLE PRECISION,
  sleep_start TIMESTAMPTZ,
  sleep_end TIMESTAMPTZ,

  -- Recovery metrics (from whoop_recovery)
  recovery_score DOUBLE PRECISION,
  hrv DOUBLE PRECISION,                     -- hrv_rmssd_milli
  resting_heart_rate DOUBLE PRECISION,
  spo2 DOUBLE PRECISION,
  skin_temp DOUBLE PRECISION,

  -- Cycle metrics (from whoop_cycles)
  strain DOUBLE PRECISION,
  total_kilojoules DOUBLE PRECISION,
  avg_heart_rate DOUBLE PRECISION,
  max_heart_rate DOUBLE PRECISION,

  -- Workout summary (from whoop_workouts)
  workout_count INTEGER DEFAULT 0,
  total_workout_strain DOUBLE PRECISION DEFAULT 0,
  total_workout_kilojoules DOUBLE PRECISION DEFAULT 0,
  workout_types TEXT[],                      -- sport names

  -- Rolling averages (7-day)
  avg_7d_sleep_score DOUBLE PRECISION,
  avg_7d_recovery DOUBLE PRECISION,
  avg_7d_hrv DOUBLE PRECISION,
  avg_7d_rhr DOUBLE PRECISION,
  avg_7d_strain DOUBLE PRECISION,
  avg_7d_respiratory_rate DOUBLE PRECISION,

  -- Baseline (30-day average) and deviation
  baseline_hrv DOUBLE PRECISION,
  baseline_rhr DOUBLE PRECISION,
  baseline_recovery DOUBLE PRECISION,
  baseline_sleep_score DOUBLE PRECISION,

  hrv_deviation DOUBLE PRECISION,            -- today vs baseline (%)
  rhr_deviation DOUBLE PRECISION,
  recovery_deviation DOUBLE PRECISION,
  sleep_deviation DOUBLE PRECISION,

  -- Trajectory (based on 7d avg vs 30d avg)
  -- 'improving', 'stable', 'declining'
  trajectory TEXT,

  -- Day classification
  -- 'good', 'neutral', 'poor' based on recovery + sleep
  day_quality TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, summary_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_biometric_user_date
  ON daily_biometric_summaries(user_id, summary_date DESC);

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE daily_nutrition_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_biometric_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own nutrition summaries"
  ON daily_nutrition_summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own nutrition summaries"
  ON daily_nutrition_summaries FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own biometric summaries"
  ON daily_biometric_summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own biometric summaries"
  ON daily_biometric_summaries FOR ALL USING (auth.uid() = user_id);
