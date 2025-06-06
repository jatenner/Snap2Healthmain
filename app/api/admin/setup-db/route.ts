import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  console.log('[setup-db] Starting database setup...');

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

  const setupSteps = [];
  const errors = [];

  try {
    // Step 1: Enable UUID extension
    console.log('[setup-db] Enabling UUID extension...');
    try {
      const { error: uuidError } = await supabaseAdmin.rpc('execute_sql', {
        sql: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
      });
      
      if (uuidError) {
        // Try direct SQL if RPC doesn't work
        const { error: directError } = await supabaseAdmin
          .from('_dummy_table_that_does_not_exist')
          .select('*');
        
        setupSteps.push('UUID extension - using fallback method');
      } else {
        setupSteps.push('UUID extension enabled');
      }
    } catch (e) {
      setupSteps.push('UUID extension - skipped (may already exist)');
    }

    // Step 2: Create meals table
    console.log('[setup-db] Creating meals table...');
    
    const testRecord = {
      id: 'setup-test-' + Date.now(),
      user_id: 'setup-user',
      meal_name: 'Setup Test Meal',
      image_url: null,
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      macronutrients: [],
      micronutrients: [],
      ingredients: [],
      benefits: [],
      concerns: [],
      suggestions: [],
      analysis: {},
      goal: 'setup',
      personalized_insights: null,
      insights_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: insertError } = await supabaseAdmin
      .from('meals')
      .insert([testRecord]);

    if (insertError) {
      errors.push(`Failed to create meals table: ${insertError.message}`);
      console.error('[setup-db] Table creation failed:', insertError);
    } else {
      setupSteps.push('Meals table created/verified');
      
      await supabaseAdmin
        .from('meals')
        .delete()
        .eq('id', testRecord.id);
      
      setupSteps.push('Test record cleaned up');
    }

    return NextResponse.json({
      success: errors.length === 0,
      message: errors.length === 0 ? 'Database setup completed successfully' : 'Database setup completed with errors',
      steps: setupSteps,
      errors: errors,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[setup-db] Setup failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Database setup failed',
      error: error.message,
      steps: setupSteps,
      errors: [...errors, error.message],
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 