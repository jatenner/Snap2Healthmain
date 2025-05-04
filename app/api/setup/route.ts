import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    // Create meals table
    const { error: createTableError } = await supabase
      .from('meals')
      .select('id')
      .limit(1);

    let tableCreated = false;
    let createError = null;

    // If table doesn't exist, try to create it
    if (createTableError && createTableError.message.includes('relation "meals" does not exist')) {
      // Table doesn't exist, create it using SQL
      const { error } = await supabase.rpc('create_table', {
        table_definition: `
          CREATE TABLE public.meals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            caption TEXT,
            goal TEXT,
            image_url TEXT,
            analysis JSONB,
            created_at TIMESTAMPTZ DEFAULT now()
          );
        `
      });

      if (error) {
        createError = error;
      } else {
        tableCreated = true;
      }
    } else if (!createTableError) {
      // Table already exists
      tableCreated = true;
    }

    // Test query to fetch meals
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('*')
      .limit(5);

    return NextResponse.json({
      setup: {
        tableCreated,
        createError
      },
      test: {
        meals,
        mealsError
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message || 'Unknown error'
    }, { 
      status: 500 
    });
  }
} 