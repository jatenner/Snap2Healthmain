-- WHOOP Integration Tables for Snap2Health
-- Stores OAuth connections and synced biometric data per user

-- 1. WHOOP Connections (one per user)
CREATE TABLE IF NOT EXISTS whoop_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  whoop_user_id TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_whoop_connections_user_id ON whoop_connections(user_id);

-- 2. WHOOP Sleep Data
CREATE TABLE IF NOT EXISTS whoop_sleep (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  whoop_sleep_id TEXT NOT NULL,
  whoop_cycle_id TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  is_nap BOOLEAN DEFAULT false,
  score_state TEXT,
  -- Score fields (null if not scored)
  sleep_performance_pct DOUBLE PRECISION,
  sleep_consistency_pct DOUBLE PRECISION,
  sleep_efficiency_pct DOUBLE PRECISION,
  respiratory_rate DOUBLE PRECISION,
  -- Stage summary (minutes)
  total_in_bed_minutes INTEGER,
  total_awake_minutes INTEGER,
  total_light_sleep_minutes INTEGER,
  total_slow_wave_sleep_minutes INTEGER,
  total_rem_sleep_minutes INTEGER,
  -- Sleep needed
  baseline_sleep_needed_ms BIGINT,
  need_from_sleep_debt_ms BIGINT,
  need_from_strain_ms BIGINT,
  -- Raw JSON for future use
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, whoop_sleep_id)
);

CREATE INDEX idx_whoop_sleep_user_time ON whoop_sleep(user_id, start_time DESC);

-- 3. WHOOP Recovery Data
CREATE TABLE IF NOT EXISTS whoop_recovery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  whoop_cycle_id TEXT NOT NULL,
  whoop_sleep_id TEXT,
  score_state TEXT,
  -- Score fields
  recovery_score DOUBLE PRECISION,
  resting_heart_rate DOUBLE PRECISION,
  hrv_rmssd_milli DOUBLE PRECISION,
  spo2_pct DOUBLE PRECISION,
  skin_temp_celsius DOUBLE PRECISION,
  user_calibrating BOOLEAN,
  -- Raw JSON
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, whoop_cycle_id)
);

CREATE INDEX idx_whoop_recovery_user_time ON whoop_recovery(user_id, created_at DESC);

-- 4. WHOOP Cycle Data
CREATE TABLE IF NOT EXISTS whoop_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  whoop_cycle_id TEXT NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  timezone_offset TEXT,
  score_state TEXT,
  -- Cycle score fields
  strain DOUBLE PRECISION,
  kilojoule DOUBLE PRECISION,
  average_heart_rate DOUBLE PRECISION,
  max_heart_rate DOUBLE PRECISION,
  -- Raw JSON
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, whoop_cycle_id)
);

CREATE INDEX idx_whoop_cycles_user_time ON whoop_cycles(user_id, start_time DESC);

-- 5. WHOOP Workout Data
CREATE TABLE IF NOT EXISTS whoop_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  whoop_workout_id TEXT NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  timezone_offset TEXT,
  sport_id INTEGER,
  score_state TEXT,
  -- Score fields
  strain DOUBLE PRECISION,
  average_heart_rate DOUBLE PRECISION,
  max_heart_rate DOUBLE PRECISION,
  kilojoule DOUBLE PRECISION,
  distance_meter DOUBLE PRECISION,
  altitude_gain_meter DOUBLE PRECISION,
  altitude_change_meter DOUBLE PRECISION,
  zone_duration_json JSONB,
  -- Raw JSON
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, whoop_workout_id)
);

CREATE INDEX idx_whoop_workouts_user_time ON whoop_workouts(user_id, start_time DESC);

-- Row Level Security: users can only access their own WHOOP data
ALTER TABLE whoop_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE whoop_sleep ENABLE ROW LEVEL SECURITY;
ALTER TABLE whoop_recovery ENABLE ROW LEVEL SECURITY;
ALTER TABLE whoop_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE whoop_workouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own whoop connection"
  ON whoop_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own whoop connection"
  ON whoop_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own whoop connection"
  ON whoop_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own whoop connection"
  ON whoop_connections FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own whoop sleep"
  ON whoop_sleep FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own whoop sleep"
  ON whoop_sleep FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own whoop recovery"
  ON whoop_recovery FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own whoop recovery"
  ON whoop_recovery FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own whoop cycles"
  ON whoop_cycles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own whoop cycles"
  ON whoop_cycles FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own whoop workouts"
  ON whoop_workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own whoop workouts"
  ON whoop_workouts FOR ALL USING (auth.uid() = user_id);

-- Service role bypass for API routes that use service role key
-- (Service role automatically bypasses RLS in Supabase)
