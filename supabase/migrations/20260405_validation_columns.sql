-- Add validation metadata columns to meals table
-- These track the confidence and quality of AI-estimated nutrition values.

ALTER TABLE meals ADD COLUMN IF NOT EXISTS confidence_score DOUBLE PRECISION;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS validation_flags JSONB;

COMMENT ON COLUMN meals.confidence_score IS '0-100 confidence in AI nutrition estimate quality. Set by nutrition-validation.ts.';
COMMENT ON COLUMN meals.validation_flags IS 'Array of validation flags (bounds, consistency, impossible value checks).';
