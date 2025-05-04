import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    // Get Supabase URL and key from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: 'Missing Supabase credentials'
      }, { status: 500 });
    }
    
    // Create a service client (for admin operations)
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Try to select from meals to check if it exists
    const { error: checkError } = await supabase
      .from('meals')
      .select('id')
      .limit(1);
    
    // Table creation result
    let tableResult = null;
    
    // Create the table if it doesn't exist
    if (checkError && checkError.message.includes('does not exist')) {
      // Get current user to make sure auth is working
      const { data: userData } = await supabase.auth.getUser();
      
      // Create SQL via the SQL editor in Supabase dashboard
      const sqlUrl = `${supabaseUrl}/rest/v1/`;
      const response = await fetch(`${sqlUrl}sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'params=single-object'
        },
        body: JSON.stringify({
          query: `
            CREATE TABLE IF NOT EXISTS public.meals (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              user_id UUID NOT NULL,
              caption TEXT,
              goal TEXT,
              image_url TEXT,
              analysis JSONB,
              created_at TIMESTAMPTZ DEFAULT now()
            );
            
            CREATE INDEX IF NOT EXISTS meals_user_id_idx ON public.meals(user_id);
            CREATE INDEX IF NOT EXISTS meals_created_at_idx ON public.meals(created_at);
          `
        })
      });
      
      if (!response.ok) {
        tableResult = `Failed to create table: ${await response.text()}`;
      } else {
        tableResult = "Table created successfully";
      }
    } else if (!checkError) {
      tableResult = "Table already exists";
    } else {
      tableResult = `Error checking table: ${checkError.message}`;
    }
    
    // Re-check if table exists after creation attempt
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('*')
      .limit(5);
    
    return NextResponse.json({
      result: tableResult,
      test: {
        meals,
        error: mealsError ? mealsError.message : null
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message || 'Unknown error'
    }, { status: 500 });
  }
} 