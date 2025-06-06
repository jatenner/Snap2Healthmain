import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  console.log('[check-columns] Checking meals table columns...');

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

  try {
    // Try to get table schema by attempting to select from it
    const { data, error } = await supabaseAdmin
      .from('meals')
      .select('*')
      .limit(1);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        message: 'Could not access meals table'
      }, { status: 500 });
    }

    // If we get here, the table exists
    // Let's try to insert a minimal record to see what columns are available
    const testId = 'column-test-' + Date.now();
    
    const { error: insertError } = await supabaseAdmin
      .from('meals')
      .insert([{
        id: testId,
        user_id: 'test-user'
      }]);

    let insertResult = 'success';

    if (insertError) {
      insertResult = insertError.message;
    } else {
      // Clean up test record
      await supabaseAdmin
        .from('meals')
        .delete()
        .eq('id', testId);
    }

    return NextResponse.json({
      success: true,
      message: 'Meals table exists',
      tableExists: true,
      insertTest: insertResult,
      sampleData: data || [],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[check-columns] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to check table structure',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 