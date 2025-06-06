import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

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

export async function POST(req: NextRequest) {
  console.log('[fix-schema] Starting database schema fix...');

  // Create admin Supabase client
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const steps = [];
  const errors = [];

  try {
    // Step 1: Check current table structure
    console.log('[fix-schema] Checking current table structure...');
    
    const { data: sampleData, error: selectError } = await supabaseAdmin
      .from('meals')
      .select('*')
      .limit(1);
    
    if (selectError && !selectError.message.includes('No rows')) {
      errors.push(`Cannot access meals table: ${selectError.message}`);
      throw new Error('Table access failed');
    }
    
    steps.push('✅ Connected to meals table');
    
    // Step 2: Test if insights_status column exists
    console.log('[fix-schema] Testing insights_status column...');
    
    const testId = 'column-test-' + Date.now();
    const { error: insertError } = await supabaseAdmin
      .from('meals')
      .insert([{
        id: testId,
        user_id: 'test-user',
        meal_name: 'Column Test',
        image_url: 'test.jpg',
        calories: 100,
        protein: 10,
        fat: 5,
        carbs: 15,
        macronutrients: [],
        micronutrients: [],
        ingredients: [],
        benefits: [],
        concerns: [],
        suggestions: [],
        analysis: {},
        goal: 'test',
        personalized_insights: 'test',
        insights_status: 'pending'
      }]);
    
    if (insertError) {
      if (insertError.message.includes('insights_status')) {
        steps.push('❌ insights_status column missing');
        
        // Step 3: Use SQL to add the column
        console.log('[fix-schema] Adding insights_status column...');
        
        const alterTableSQL = `
          ALTER TABLE public.meals 
          ADD COLUMN IF NOT EXISTS insights_status TEXT DEFAULT 'pending';
        `;
        
        // Try using RPC function if available
        try {
          const { error: rpcError } = await supabaseAdmin.rpc('exec_sql', { 
            sql: alterTableSQL 
          });
          
          if (rpcError) {
            steps.push('❌ RPC method failed - trying direct SQL approach');
            
            // Alternative approach: Use Supabase SQL editor functionality
            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!
              },
              body: JSON.stringify({ sql: alterTableSQL })
            });
            
            if (!response.ok) {
              throw new Error(`SQL execution failed: ${response.statusText}`);
            }
            
            steps.push('✅ insights_status column added via direct SQL');
          } else {
            steps.push('✅ insights_status column added via RPC');
          }
        } catch (sqlError: any) {
          errors.push(`Failed to add column: ${sqlError.message}`);
          steps.push('⚠️  Manual column addition required');
          steps.push('Please run this SQL in Supabase Dashboard > SQL Editor:');
          steps.push(`ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS insights_status TEXT DEFAULT 'pending';`);
        }
        
        // Step 4: Test the fix
        console.log('[fix-schema] Testing column addition...');
        
        const testId2 = 'column-test-2-' + Date.now();
        const { error: testError2 } = await supabaseAdmin
          .from('meals')
          .insert([{
            id: testId2,
            user_id: 'test-user',
            meal_name: 'Column Test 2',
            image_url: 'test.jpg',
            calories: 100,
            protein: 10,
            fat: 5,
            carbs: 15,
            macronutrients: [],
            micronutrients: [],
            ingredients: [],
            benefits: [],
            concerns: [],
            suggestions: [],
            analysis: {},
            goal: 'test',
            personalized_insights: 'test',
            insights_status: 'completed'
          }]);
        
        if (testError2) {
          if (testError2.message.includes('insights_status')) {
            errors.push('Column addition failed - manual intervention required');
          } else {
            errors.push(`Unexpected error: ${testError2.message}`);
          }
        } else {
          steps.push('✅ Column addition verified - working correctly');
          // Clean up test record
          await supabaseAdmin.from('meals').delete().eq('id', testId2);
        }
        
      } else {
        errors.push(`Unexpected insert error: ${insertError.message}`);
      }
    } else {
      steps.push('✅ insights_status column already exists');
      // Clean up test record
      await supabaseAdmin.from('meals').delete().eq('id', testId);
    }

    const isFixed = errors.length === 0;
    
    return NextResponse.json({
      success: isFixed,
      message: isFixed ? 'Database schema fixed successfully' : 'Manual fixes required',
      steps: steps,
      errors: errors,
      sql_command: isFixed ? null : `ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS insights_status TEXT DEFAULT 'pending';`,
      next_steps: isFixed ? [
        'Database is ready for meal analysis',
        'Test meal upload functionality'
      ] : [
        'Add missing column via Supabase Dashboard > SQL Editor',
        'Run this fix again to verify'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[fix-schema] Failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Schema fix failed',
      error: error.message,
      steps: steps,
      errors: [...errors, error.message],
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}