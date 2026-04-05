-- ============================================================================
-- Missing Tables Migration
-- These tables are referenced by the application but were not in prior migrations.
-- ============================================================================

-- ============================================================================
-- 1. Profiles Table
-- Referenced by: /api/today, /api/summaries/compute, /api/correlations, /api/profile
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  age INTEGER,
  gender TEXT,
  height DOUBLE PRECISION,
  height_unit TEXT DEFAULT 'in',
  weight DOUBLE PRECISION,
  weight_unit TEXT DEFAULT 'lbs',
  activity_level TEXT DEFAULT 'moderate',
  goal TEXT DEFAULT 'General Wellness',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE USING (auth.uid() = id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at();


-- ============================================================================
-- 2. Correlation Reports Table
-- Referenced by: /api/correlations, /api/today, /api/insights
-- ============================================================================

CREATE TABLE IF NOT EXISTS correlation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_data JSONB NOT NULL,
  total_paired_days INTEGER,
  insight_count INTEGER,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_correlation_reports_user_id
  ON correlation_reports(user_id);

ALTER TABLE correlation_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own correlation reports"
  ON correlation_reports FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own correlation reports"
  ON correlation_reports FOR ALL USING (auth.uid() = user_id);


-- ============================================================================
-- 3. Health Experiments Table
-- Referenced by: /api/experiments, /api/today, experiment-engine.ts
-- ============================================================================

CREATE TABLE IF NOT EXISTS health_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  target_behavior TEXT NOT NULL,
  measurement_field TEXT NOT NULL,
  expected_direction TEXT NOT NULL,
  duration_days INTEGER DEFAULT 7,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  baseline_value DOUBLE PRECISION,
  baseline_n INTEGER,
  status TEXT DEFAULT 'active',
  result JSONB,
  source_correlation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_health_experiments_user_id
  ON health_experiments(user_id);

CREATE INDEX IF NOT EXISTS idx_health_experiments_user_status
  ON health_experiments(user_id, status);

ALTER TABLE health_experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own experiments"
  ON health_experiments FOR ALL USING (auth.uid() = user_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_health_experiments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_health_experiments_updated_at ON health_experiments;
CREATE TRIGGER trigger_update_health_experiments_updated_at
  BEFORE UPDATE ON health_experiments
  FOR EACH ROW EXECUTE FUNCTION update_health_experiments_updated_at();


-- ============================================================================
-- 4. Experiment Daily Logs Table
-- Referenced by: experiment-engine.ts for compliance tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS experiment_daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES health_experiments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  compliant BOOLEAN,
  measurement_value DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(experiment_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_experiment_daily_logs_experiment_id
  ON experiment_daily_logs(experiment_id);

CREATE INDEX IF NOT EXISTS idx_experiment_daily_logs_user_id
  ON experiment_daily_logs(user_id);

ALTER TABLE experiment_daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own experiment logs"
  ON experiment_daily_logs FOR ALL USING (auth.uid() = user_id);
