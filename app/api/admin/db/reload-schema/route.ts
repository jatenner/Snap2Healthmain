import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with the service role key for full admin access
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// This API route forces a reload of the schema cache
export async function GET() {
  try {
    console.log('Attempting to reload schema cache via API');
    
    // Refresh the database schema cache
    const { data, error } = await supabaseAdmin.rpc('execute_sql', {
      sql_query: `NOTIFY pgrst, 'reload schema';`
    });

    if (error) {
      console.error('Error reloading schema cache:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to reload schema cache',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Schema cache reloaded successfully',
      data
    });
  } catch (error) {
    console.error('Unexpected error reloading schema:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reload schema cache',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
