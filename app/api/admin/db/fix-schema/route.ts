import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with the service role key for full admin access
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function GET() {
  try {
    console.log('Attempting to fix database schema directly via API');
    
    // Use raw SQL to add missing columns to the meals table
    const addFoodsColumn = await supabaseAdmin.rpc('execute_sql', {
      sql_query: `
        ALTER TABLE IF EXISTS public.meals
        ADD COLUMN IF NOT EXISTS foods JSONB DEFAULT '[]'::jsonb;
      `
    });

    // Add other potentially missing columns
    const addRawAnalysisColumn = await supabaseAdmin.rpc('execute_sql', {
      sql_query: `
        ALTER TABLE IF EXISTS public.meals
        ADD COLUMN IF NOT EXISTS raw_analysis JSONB DEFAULT '{}'::jsonb;
      `
    });

    const addDescriptionColumn = await supabaseAdmin.rpc('execute_sql', {
      sql_query: `
        ALTER TABLE IF EXISTS public.meals
        ADD COLUMN IF NOT EXISTS description TEXT;
      `
    });

    const addMealNameColumn = await supabaseAdmin.rpc('execute_sql', {
      sql_query: `
        ALTER TABLE IF EXISTS public.meals
        ADD COLUMN IF NOT EXISTS meal_name VARCHAR;
      `
    });

    // Add other useful columns
    const addUuidColumn = await supabaseAdmin.rpc('execute_sql', {
      sql_query: `
        ALTER TABLE IF EXISTS public.meals
        ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT uuid_generate_v4();
      `
    });

    // Make sure the ID column is UUID type
    const fixIdColumn = await supabaseAdmin.rpc('execute_sql', {
      sql_query: `
        -- First make sure the uuid extension is enabled
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        -- Create a temporary column with the correct UUID type if needed
        DO $$
        BEGIN
          -- Check if ID column needs to be migrated
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'meals' 
            AND column_name = 'id' 
            AND data_type != 'uuid'
          ) THEN
            -- Create a new temporary column
            ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS id_new UUID DEFAULT uuid_generate_v4();
            
            -- Copy data from id to id_new where possible
            UPDATE public.meals SET id_new = id::uuid WHERE id IS NOT NULL;
            
            -- Drop the old id column and rename the new one
            ALTER TABLE public.meals DROP COLUMN id;
            ALTER TABLE public.meals RENAME COLUMN id_new TO id;
            
            -- Make id the primary key
            ALTER TABLE public.meals ADD PRIMARY KEY (id);
          END IF;
        END $$;
      `
    });

    // Create index on the new columns
    const createFoodsIndex = await supabaseAdmin.rpc('execute_sql', {
      sql_query: `
        CREATE INDEX IF NOT EXISTS idx_meals_foods ON public.meals USING gin (foods);
      `
    });

    // Create a 'meals' table if it doesn't exist
    const createMealsTable = await supabaseAdmin.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.meals (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id VARCHAR NOT NULL,
          meal_name VARCHAR,
          image_url VARCHAR,
          calories INTEGER,
          protein DECIMAL,
          fat DECIMAL,
          carbs DECIMAL,
          analysis JSONB DEFAULT '{}'::jsonb,
          macronutrients JSONB DEFAULT '{}'::jsonb,
          micronutrients JSONB DEFAULT '{}'::jsonb,
          foods JSONB DEFAULT '[]'::jsonb,
          raw_analysis JSONB DEFAULT '{}'::jsonb,
          goal VARCHAR,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          uuid UUID DEFAULT uuid_generate_v4(),
          description TEXT
        );
      `
    });

    // Refresh the schema cache
    const refreshSchema = await supabaseAdmin.rpc('execute_sql', {
      sql_query: `NOTIFY pgrst, 'reload schema';`
    });

    // Return the status of all operations
    return NextResponse.json({
      success: true,
      message: 'Database schema updated successfully',
      operations: {
        addFoodsColumn,
        addRawAnalysisColumn,
        addDescriptionColumn,
        addMealNameColumn,
        addUuidColumn,
        fixIdColumn,
        createFoodsIndex,
        createMealsTable,
        refreshSchema
      }
    });
  } catch (error) {
    console.error('Error fixing database schema:', error);
    return NextResponse.json(
      {
        error: 'Failed to update database schema',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}