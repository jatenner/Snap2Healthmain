-- ============================================================================
-- User Sensitivity Profiles Migration
-- Stores persistent, evolving sensitivity data learned from correlations.
-- Updated after each correlation computation.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_sensitivity_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Top sensitivities: [{variable, score, confidence, direction, dataPoints}]
  sensitivities JSONB NOT NULL DEFAULT '[]',

  -- Compound patterns: [{variables: [...], outcome, strength, description}]
  compound_patterns JSONB DEFAULT '[]',

  -- Top factors (sorted by impact)
  top_positive_factors JSONB DEFAULT '[]',
  top_negative_factors JSONB DEFAULT '[]',

  -- AI-generated natural language summary
  profile_summary TEXT,

  -- Tracking
  last_correlation_at TIMESTAMPTZ,
  correlation_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_sensitivity_profiles_user_id
  ON user_sensitivity_profiles(user_id);

ALTER TABLE user_sensitivity_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sensitivity profile"
  ON user_sensitivity_profiles FOR ALL USING (auth.uid() = user_id);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_sensitivity_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sensitivity_profiles ON user_sensitivity_profiles;
CREATE TRIGGER trigger_update_sensitivity_profiles
  BEFORE UPDATE ON user_sensitivity_profiles
  FOR EACH ROW EXECUTE FUNCTION update_sensitivity_profiles_updated_at();
