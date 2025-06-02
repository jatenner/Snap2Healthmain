import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// DB setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    console.log('Running emergency database fixes');
    
    // Create extension if missing
    await supabaseAdmin.rpc('execute_sql', {
      sql_query: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
    });
    
    // Create or fix meals table
    const fixMeals = await supabaseAdmin.rpc('execute_sql', {
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
        
        -- Add missing columns if table exists
        ALTER TABLE IF EXISTS public.meals 
          ADD COLUMN IF NOT EXISTS foods JSONB DEFAULT '[]'::jsonb,
          ADD COLUMN IF NOT EXISTS raw_analysis JSONB DEFAULT '{}'::jsonb,
          ADD COLUMN IF NOT EXISTS meal_name VARCHAR,
          ADD COLUMN IF NOT EXISTS description TEXT,
          ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT uuid_generate_v4();
      `
    });
    
    // Ensure we have RLS policies that work
    const fixPolicies = await supabaseAdmin.rpc('execute_sql', {
      sql_query: `
        -- Enable row-level security
        ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        DROP POLICY IF EXISTS "Anyone can view meals" ON public.meals;
        CREATE POLICY "Anyone can view meals" ON public.meals FOR SELECT USING (true);
        
        DROP POLICY IF EXISTS "Anyone can insert meals" ON public.meals;
        CREATE POLICY "Anyone can insert meals" ON public.meals FOR INSERT WITH CHECK (true);
        
        DROP POLICY IF EXISTS "Anyone can update meals" ON public.meals;
        CREATE POLICY "Anyone can update meals" ON public.meals FOR UPDATE USING (true);
      `
    });
    
    // Reload schema
    await supabaseAdmin.rpc('execute_sql', {
      sql_query: `NOTIFY pgrst, 'reload schema';`
    });
    
    return NextResponse.json({
      success: true,
      message: 'Emergency fixes applied successfully'
    });
  } catch (error) {
    console.error('Error applying emergency fixes:', error);
    return NextResponse.json(
      { 
        error: 'Failed to apply emergency fixes',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
