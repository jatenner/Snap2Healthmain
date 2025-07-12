import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('🔧 Starting database schema fix...');
    
    // Step 1: Check current table structure
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'meals')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.error('Error checking columns:', columnsError);
      return NextResponse.json({ error: 'Failed to check table structure' }, { status: 500 });
    }

    console.log('Current columns:', columns);

    // Step 2: Add missing columns using individual ALTER statements
    const fixes = [];
    
    // Check if foods column exists
    const hasFoods = columns?.some(col => col.column_name === 'foods');
    if (!hasFoods) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: 'ALTER TABLE public.meals ADD COLUMN foods TEXT[]'
        });
        if (error) throw error;
        fixes.push('Added foods column');
      } catch (error) {
        console.log('Foods column might already exist or error:', error);
      }
    }

    // Check if raw_analysis column exists
    const hasRawAnalysis = columns?.some(col => col.column_name === 'raw_analysis');
    if (!hasRawAnalysis) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: 'ALTER TABLE public.meals ADD COLUMN raw_analysis TEXT'
        });
        if (error) throw error;
        fixes.push('Added raw_analysis column');
      } catch (error) {
        console.log('Raw_analysis column might already exist or error:', error);
      }
    }

    // Check if description column exists
    const hasDescription = columns?.some(col => col.column_name === 'description');
    if (!hasDescription) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: 'ALTER TABLE public.meals ADD COLUMN description TEXT'
        });
        if (error) throw error;
        fixes.push('Added description column');
      } catch (error) {
        console.log('Description column might already exist or error:', error);
      }
    }

    // Step 3: Fix user_id column type if needed
    const userIdColumn = columns?.find(col => col.column_name === 'user_id');
    if (userIdColumn && userIdColumn.data_type === 'uuid') {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: 'ALTER TABLE public.meals ALTER COLUMN user_id TYPE TEXT'
        });
        if (error) throw error;
        fixes.push('Fixed user_id column type from UUID to TEXT');
      } catch (error) {
        console.log('User_id column type fix error:', error);
      }
    }

    // Step 4: Test with a simple insert
    const testMeal = {
      user_id: 'test-user-' + Date.now(),
      meal_name: 'Test Meal',
      foods: ['Apple', 'Banana'],
      raw_analysis: 'Test analysis',
      description: 'Test description'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('meals')
      .insert(testMeal)
      .select();

    if (insertError) {
      console.error('Test insert failed:', insertError);
      return NextResponse.json({ 
        error: 'Test insert failed', 
        details: insertError.message,
        fixes: fixes 
      }, { status: 500 });
    }

    // Clean up test data
    if (insertData && insertData[0]) {
      await supabase
        .from('meals')
        .delete()
        .eq('id', insertData[0].id);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database schema fixed successfully!',
      fixes: fixes,
      testResult: 'Insert/delete test passed'
    });

  } catch (error) {
    console.error('Schema fix error:', error);
    return NextResponse.json({ 
      error: 'Schema fix failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 