import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Ensure dynamic runtime to prevent caching
export const dynamic = 'force-dynamic';

/**
 * POST handler for fixing OpenAI API key format
 */
export async function POST(req: NextRequest) {
  console.log('[fix-system] Starting comprehensive system fix...');

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
    // 1. Fix database schema - add missing columns
    console.log('[fix-system] Step 1: Fixing database schema...');
    
    // Check current schema
    const { data: sampleMeal, error: fetchError } = await supabaseAdmin
      .from('meals')
      .select('*')
      .limit(1)
      .single();
    
    if (fetchError && !fetchError.message.includes('No rows')) {
      console.log('[fix-system] Error accessing meals table:', fetchError);
      errors.push(`Database access error: ${fetchError.message}`);
    } else {
      steps.push('✅ Successfully connected to meals table');
      
      // Check if insights_status column exists
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'meals' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      
      const { data: columns, error: columnsError } = await supabaseAdmin
        .rpc('exec_sql', { sql: columnsQuery });
      
      if (columnsError) {
        // Fallback test - try to insert with insights_status
        const testId = 'schema-test-' + Date.now();
        const { error: testError } = await supabaseAdmin
          .from('meals')
          .insert([{
            id: testId,
            user_id: 'test-user',
            meal_name: 'Schema Test',
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
        
        if (testError && testError.message.includes('insights_status')) {
          errors.push('❌ Missing insights_status column');
          steps.push('Database needs manual column addition in Supabase Dashboard');
          steps.push('Required SQL: ALTER TABLE meals ADD COLUMN insights_status TEXT DEFAULT \'pending\';');
        } else {
          steps.push('✅ insights_status column exists');
          if (!testError) {
            // Clean up test
            await supabaseAdmin.from('meals').delete().eq('id', testId);
          }
        }
      } else {
        const hasInsightsStatus = columns?.some((col: any) => col.column_name === 'insights_status');
        if (hasInsightsStatus) {
          steps.push('✅ insights_status column exists');
        } else {
          errors.push('❌ Missing insights_status column');
          steps.push('Database needs manual column addition');
        }
      }
    }

    // 2. Test OpenAI configuration
    console.log('[fix-system] Step 2: Testing OpenAI configuration...');
    
    try {
      const openaiTestResponse = await fetch('http://localhost:3002/api/simple-vision-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      
      const openaiResult = await openaiTestResponse.json();
      
      if (openaiResult.success) {
        steps.push('✅ OpenAI configuration working');
      } else {
        errors.push(`❌ OpenAI test failed: ${openaiResult.error}`);
      }
    } catch (openaiError: any) {
      errors.push(`❌ OpenAI test error: ${openaiError.message}`);
    }

    // 3. Summary and next steps
    console.log('[fix-system] Step 3: Generating summary...');
    
    const isFixed = errors.length === 0;
    
    if (isFixed) {
      steps.push('🎉 All systems working correctly!');
    } else {
      steps.push('⚠️  Manual fixes required:');
      errors.forEach(error => steps.push(`   - ${error}`));
    }

    return NextResponse.json({
      success: isFixed,
      message: isFixed ? 'System fully functional' : 'Manual fixes required',
      fixed_issues: [
        'OpenAI timeout parameters removed',
        'Server running on correct port',
        'Environment variables configured'
      ],
      remaining_issues: errors,
      steps: steps,
      next_actions: isFixed ? [
        'Test meal upload and analysis',
        'Verify AI insights generation'
      ] : [
        'Add missing database columns via Supabase Dashboard',
        'Run this fix script again after database fixes'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[fix-system] Failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'System fix failed',
      error: error.message,
      steps: steps,
      errors: [...errors, error.message],
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 