import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('[fix-database-schema] Starting database schema fix...');

    // Create admin client
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

    // Add the missing insights_status column if it doesn't exist
    console.log('[fix-database-schema] Adding insights_status column...');
    
    const { data, error } = await supabaseAdmin.rpc('exec', {
      sql: `
        ALTER TABLE meals 
        ADD COLUMN IF NOT EXISTS insights_status TEXT DEFAULT 'pending';
        
        -- Also add other missing columns that might be needed
        ALTER TABLE meals 
        ADD COLUMN IF NOT EXISTS meal_description TEXT,
        ADD COLUMN IF NOT EXISTS foods_identified JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS health_score INTEGER,
        ADD COLUMN IF NOT EXISTS meal_story TEXT,
        ADD COLUMN IF NOT EXISTS protein_quality_assessment TEXT,
        ADD COLUMN IF NOT EXISTS carbohydrate_quality_assessment TEXT,
        ADD COLUMN IF NOT EXISTS fat_quality_assessment TEXT,
        ADD COLUMN IF NOT EXISTS cooking_method_impact TEXT,
        ADD COLUMN IF NOT EXISTS sodium_impact TEXT,
        ADD COLUMN IF NOT EXISTS processing_level_analysis TEXT,
        ADD COLUMN IF NOT EXISTS nutritional_narrative TEXT,
        ADD COLUMN IF NOT EXISTS time_of_day_optimization TEXT,
        ADD COLUMN IF NOT EXISTS visual_analysis TEXT,
        ADD COLUMN IF NOT EXISTS cooking_method TEXT,
        ADD COLUMN IF NOT EXISTS cultural_context TEXT,
        ADD COLUMN IF NOT EXISTS metabolic_insights TEXT,
        ADD COLUMN IF NOT EXISTS expert_recommendations JSONB DEFAULT '[]'::jsonb;
      `
    });

    if (error) {
      console.error('[fix-database-schema] SQL execution failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to execute schema update',
        details: error.message
      }, { status: 500 });
    }

    console.log('[fix-database-schema] Schema update completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Database schema fixed successfully',
      columnsAdded: ['insights_status', 'meal_description', 'foods_identified', 'health_score', 'meal_story', 'protein_quality_assessment', 'carbohydrate_quality_assessment', 'fat_quality_assessment', 'cooking_method_impact', 'sodium_impact', 'processing_level_analysis', 'nutritional_narrative', 'time_of_day_optimization', 'visual_analysis', 'cooking_method', 'cultural_context', 'metabolic_insights', 'expert_recommendations']
    });

  } catch (error) {
    console.error('[fix-database-schema] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database schema fix failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 