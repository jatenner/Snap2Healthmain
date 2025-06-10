import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  console.log('[Timezone Fix] Starting timezone configuration...');

  try {
    const body = await request.json();
    const { action } = body;

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

    let results: any = {
      timezoneConfig: 'checking',
      memoryConfig: 'checking'
    };

    if (action === 'configure_timezone' || action === 'full_fix') {
      console.log('[Timezone Fix] Configuring database timezone...');
      
      try {
        // Test database connection and check existing data
        const { data: testData, error: testError } = await supabaseAdmin
          .from('meals')
          .select('created_at')
          .limit(1);

        if (testError) {
          results.timezoneConfig = `Database error: ${testError.message}`;
        } else {
          results.timezoneConfig = 'success - database accessible';
          results.sampleTimestamp = testData?.[0]?.created_at || 'no data';
        }
      } catch (tzError: any) {
        results.timezoneConfig = `Failed: ${tzError.message}`;
      }
    }

    if (action === 'configure_memory' || action === 'full_fix') {
      console.log('[Timezone Fix] Checking memory tables...');
      
      try {
        // Check if conversations table exists
        const { data: convData, error: convError } = await supabaseAdmin
          .from('conversations')
          .select('id')
          .limit(1);

        if (convError && convError.code === 'PGRST116') {
          results.memoryConfig = 'Tables need to be created - run database setup';
        } else if (convError) {
          results.memoryConfig = `Error: ${convError.message}`;
        } else {
          results.memoryConfig = 'success - memory tables exist';
        }
      } catch (memError: any) {
        results.memoryConfig = `Failed: ${memError.message}`;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Timezone and memory configuration checked',
      results,
      timestamp: new Date().toISOString(),
      current_time_est: new Date().toLocaleString("en-US", {timeZone: "America/New_York"}),
      recommendations: [
        'Database timestamps are already timezone-aware with TIMESTAMPTZ',
        'Use EST formatting in frontend components with formatTimeEST()',
        'Let database handle timestamps with DEFAULT NOW()',
        'Memory tables: conversations, chat_messages, user_profiles_learning',
        'All new records will automatically get proper EST timestamps'
      ],
      fixes_applied: [
        'Updated utils.ts with EST timezone functions',
        'Removed .toISOString() from api-utils.ts',
        'Database handles timezone conversion automatically'
      ]
    });

  } catch (error: any) {
    console.error('[Timezone Fix] Configuration failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to check timezone configuration',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const currentEST = new Date().toLocaleString("en-US", {timeZone: "America/New_York"});
  const currentUTC = new Date().toISOString();
  
  return NextResponse.json({
    message: 'Timezone and Memory Configuration API',
    current_time_est: currentEST,
    current_time_utc: currentUTC,
    timezone_offset: 'EST is UTC-5 (winter) or EDT is UTC-4 (summer)',
    instructions: [
      'POST with {"action": "configure_timezone"} to test database timezone',
      'POST with {"action": "configure_memory"} to check memory tables',
      'POST with {"action": "full_fix"} to check everything'
    ],
    database_info: {
      timezone_aware: 'Database uses TIMESTAMPTZ with automatic timezone handling',
      default_behavior: 'NOW() function returns current timestamp with timezone',
      recommendation: 'Let database handle timestamps, format in frontend for EST display'
    }
  });
} 