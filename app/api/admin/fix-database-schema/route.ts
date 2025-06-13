import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('[fix-database-schema] Checking current meals table schema...');
    
    // Get the current table structure
    const { data: columns, error: schemaError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'meals')
      .eq('table_schema', 'public');
    
    if (schemaError) {
      console.error('[fix-database-schema] Error getting schema:', schemaError);
      return NextResponse.json({ error: 'Failed to get schema', details: schemaError }, { status: 500 });
    }
    
    console.log('[fix-database-schema] Current columns:', columns);
    
    // Expected columns based on the code
    const expectedColumns = [
      'id', 'user_id', 'meal_name', 'image_url', 'calories', 'protein', 'fat', 'carbs',
      'macronutrients', 'micronutrients', 'ingredients', 'benefits', 'concerns', 
      'suggestions', 'analysis', 'personalized_insights', 'goal', 'created_at', 'updated_at'
    ];
    
    const existingColumns = columns?.map(col => col.column_name) || [];
    const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));
    const extraColumns = existingColumns.filter(col => !expectedColumns.includes(col));
    
    return NextResponse.json({
      success: true,
      currentColumns: existingColumns,
      expectedColumns,
      missingColumns,
      extraColumns,
      schemaMatches: missingColumns.length === 0,
      recommendations: missingColumns.length > 0 ? [
        'Some expected columns are missing from the meals table',
        'This may cause database insertion failures',
        'Consider adding missing columns or updating the code to match the schema'
      ] : ['Schema looks good!']
    });
    
  } catch (error) {
    console.error('[fix-database-schema] Error:', error);
    return NextResponse.json({ error: 'Failed to check schema', details: error }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'create_missing_columns') {
      console.log('[fix-database-schema] Creating missing columns...');
      
      // Add missing columns with appropriate types
      const alterQueries = [
        'ALTER TABLE meals ADD COLUMN IF NOT EXISTS meal_name TEXT',
        'ALTER TABLE meals ADD COLUMN IF NOT EXISTS image_url TEXT',
        'ALTER TABLE meals ADD COLUMN IF NOT EXISTS calories INTEGER',
        'ALTER TABLE meals ADD COLUMN IF NOT EXISTS protein REAL',
        'ALTER TABLE meals ADD COLUMN IF NOT EXISTS fat REAL',
        'ALTER TABLE meals ADD COLUMN IF NOT EXISTS carbs REAL',
        'ALTER TABLE meals ADD COLUMN IF NOT EXISTS macronutrients JSONB',
        'ALTER TABLE meals ADD COLUMN IF NOT EXISTS micronutrients JSONB',
        'ALTER TABLE meals ADD COLUMN IF NOT EXISTS ingredients TEXT[]',
        'ALTER TABLE meals ADD COLUMN IF NOT EXISTS benefits TEXT[]',
        'ALTER TABLE meals ADD COLUMN IF NOT EXISTS concerns TEXT[]',
        'ALTER TABLE meals ADD COLUMN IF NOT EXISTS suggestions TEXT[]',
        'ALTER TABLE meals ADD COLUMN IF NOT EXISTS analysis JSONB',
        'ALTER TABLE meals ADD COLUMN IF NOT EXISTS personalized_insights TEXT',
        'ALTER TABLE meals ADD COLUMN IF NOT EXISTS goal TEXT',
        'ALTER TABLE meals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()',
        'ALTER TABLE meals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()'
      ];
      
      const results = [];
      for (const query of alterQueries) {
        try {
          const { error } = await supabaseAdmin.rpc('exec_sql', { sql: query });
          results.push({ query, success: !error, error: error?.message });
        } catch (err) {
          results.push({ query, success: false, error: err });
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Attempted to create missing columns',
        results
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('[fix-database-schema] Error:', error);
    return NextResponse.json({ error: 'Failed to fix schema', details: error }, { status: 500 });
  }
} 