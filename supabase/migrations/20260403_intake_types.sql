-- ============================================================================
-- Intake Types & Quick-Add Presets Migration
-- Expands the meals table to support all intake types (meal, snack, drink,
-- alcohol, supplement, hydration) and adds a presets table for quick logging.
-- ============================================================================

-- ============================================================================
-- 1. Add intake_type and water_ml to meals table
-- ============================================================================

ALTER TABLE meals ADD COLUMN IF NOT EXISTS intake_type TEXT DEFAULT 'meal';
-- Allowed values: 'meal', 'snack', 'drink', 'alcohol', 'supplement', 'hydration'

ALTER TABLE meals ADD COLUMN IF NOT EXISTS water_ml DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_meals_intake_type
  ON meals(user_id, intake_type, meal_time DESC);


-- ============================================================================
-- 2. Add new aggregation columns to daily_nutrition_summaries
-- ============================================================================

ALTER TABLE daily_nutrition_summaries
  ADD COLUMN IF NOT EXISTS total_water_ml DOUBLE PRECISION DEFAULT 0;

ALTER TABLE daily_nutrition_summaries
  ADD COLUMN IF NOT EXISTS supplement_count INTEGER DEFAULT 0;

ALTER TABLE daily_nutrition_summaries
  ADD COLUMN IF NOT EXISTS alcohol_servings DOUBLE PRECISION DEFAULT 0;


-- ============================================================================
-- 3. Quick-Add Presets Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS quick_add_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  intake_type TEXT NOT NULL,
  calories INTEGER DEFAULT 0,
  protein DOUBLE PRECISION DEFAULT 0,
  carbs DOUBLE PRECISION DEFAULT 0,
  fat DOUBLE PRECISION DEFAULT 0,
  macronutrients JSONB DEFAULT '[]',
  micronutrients JSONB DEFAULT '[]',
  water_ml DOUBLE PRECISION,
  is_global BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE quick_add_presets ENABLE ROW LEVEL SECURITY;

-- Users can see global presets and their own custom presets
CREATE POLICY "Users see global and own presets"
  ON quick_add_presets FOR SELECT
  USING (is_global = true OR auth.uid() = user_id);

-- Users can only manage their own custom presets
CREATE POLICY "Users insert own presets"
  ON quick_add_presets FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_global = false);

CREATE POLICY "Users update own presets"
  ON quick_add_presets FOR UPDATE
  USING (auth.uid() = user_id AND is_global = false);

CREATE POLICY "Users delete own presets"
  ON quick_add_presets FOR DELETE
  USING (auth.uid() = user_id AND is_global = false);


-- ============================================================================
-- 4. Seed Global Presets
-- ============================================================================

INSERT INTO quick_add_presets (name, intake_type, calories, protein, carbs, fat, macronutrients, micronutrients, water_ml, is_global)
VALUES
  -- Hydration
  ('Glass of Water (250ml)', 'hydration', 0, 0, 0, 0, '[]', '[]', 250, true),
  ('Large Water Bottle (500ml)', 'hydration', 0, 0, 0, 0, '[]', '[]', 500, true),

  -- Drinks (caffeinated)
  ('Black Coffee', 'drink', 5, 0, 0, 0,
   '[{"name":"Caffeine","amount":95,"unit":"mg"}]', '[]', 240, true),
  ('Coffee with Milk', 'drink', 30, 1, 2, 1,
   '[{"name":"Caffeine","amount":95,"unit":"mg"}]', '[{"name":"Calcium","amount":40,"unit":"mg"}]', 240, true),
  ('Green Tea', 'drink', 2, 0, 0, 0,
   '[{"name":"Caffeine","amount":28,"unit":"mg"}]', '[]', 240, true),
  ('Black Tea', 'drink', 2, 0, 0, 0,
   '[{"name":"Caffeine","amount":47,"unit":"mg"}]', '[]', 240, true),
  ('Espresso Shot', 'drink', 3, 0, 0, 0,
   '[{"name":"Caffeine","amount":63,"unit":"mg"}]', '[]', 30, true),

  -- Alcohol
  ('Beer (12oz)', 'alcohol', 153, 2, 13, 0,
   '[{"name":"Alcohol","amount":14,"unit":"g"}]', '[]', null, true),
  ('Light Beer (12oz)', 'alcohol', 103, 1, 6, 0,
   '[{"name":"Alcohol","amount":11,"unit":"g"}]', '[]', null, true),
  ('Glass of Red Wine (5oz)', 'alcohol', 125, 0, 4, 0,
   '[{"name":"Alcohol","amount":14,"unit":"g"}]', '[{"name":"Iron","amount":0.5,"unit":"mg"}]', null, true),
  ('Glass of White Wine (5oz)', 'alcohol', 121, 0, 4, 0,
   '[{"name":"Alcohol","amount":14,"unit":"g"}]', '[]', null, true),
  ('Shot of Spirits (1.5oz)', 'alcohol', 97, 0, 0, 0,
   '[{"name":"Alcohol","amount":14,"unit":"g"}]', '[]', null, true),
  ('Cocktail (mixed drink)', 'alcohol', 200, 0, 15, 0,
   '[{"name":"Alcohol","amount":14,"unit":"g"},{"name":"Sugar","amount":12,"unit":"g"}]', '[]', null, true),

  -- Supplements
  ('Multivitamin', 'supplement', 0, 0, 0, 0, '[]',
   '[{"name":"Vitamin D","amount":25,"unit":"mcg"},{"name":"Vitamin C","amount":90,"unit":"mg"},{"name":"Vitamin B12","amount":2.4,"unit":"mcg"},{"name":"Iron","amount":8,"unit":"mg"},{"name":"Zinc","amount":11,"unit":"mg"},{"name":"Magnesium","amount":120,"unit":"mg"}]',
   null, true),
  ('Vitamin D (2000 IU)', 'supplement', 0, 0, 0, 0, '[]',
   '[{"name":"Vitamin D","amount":50,"unit":"mcg"}]', null, true),
  ('Fish Oil (Omega-3)', 'supplement', 10, 0, 0, 1,
   '[{"name":"Omega-3","amount":1000,"unit":"mg"}]', '[]', null, true),
  ('Magnesium (400mg)', 'supplement', 0, 0, 0, 0, '[]',
   '[{"name":"Magnesium","amount":400,"unit":"mg"}]', null, true),
  ('Protein Shake', 'supplement', 150, 30, 5, 2, '[]', '[]', 300, true),
  ('Creatine (5g)', 'supplement', 0, 0, 0, 0,
   '[{"name":"Creatine","amount":5,"unit":"g"}]', '[]', null, true),

  -- Snacks
  ('Banana', 'snack', 105, 1, 27, 0, '[]',
   '[{"name":"Potassium","amount":422,"unit":"mg"},{"name":"Vitamin B6","amount":0.4,"unit":"mg"},{"name":"Magnesium","amount":32,"unit":"mg"}]',
   null, true),
  ('Apple', 'snack', 95, 0, 25, 0,
   '[{"name":"Fiber","amount":4.4,"unit":"g"}]',
   '[{"name":"Vitamin C","amount":8,"unit":"mg"}]', null, true),
  ('Handful of Almonds (1oz)', 'snack', 164, 6, 6, 14,
   '[{"name":"Fiber","amount":3.5,"unit":"g"}]',
   '[{"name":"Magnesium","amount":76,"unit":"mg"},{"name":"Vitamin E","amount":7.3,"unit":"mg"}]',
   null, true),
  ('Greek Yogurt', 'snack', 100, 17, 6, 1, '[]',
   '[{"name":"Calcium","amount":187,"unit":"mg"},{"name":"Vitamin B12","amount":1.3,"unit":"mcg"}]',
   null, true)
ON CONFLICT DO NOTHING;
