import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    // Check if meals table exists
    const { error: tablesError, data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    const mealsTableExists = tables?.some(t => t.table_name === 'meals');
    
    // Try to get meal records
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Get table structure
    const { data: tableInfo, error: tableInfoError } = await supabase
      .rpc('get_table_info', { table_name: 'meals' })
      .select('*');
    
    // Create table if it doesn't exist
    let createTableResult = null;
    let createTableError = null;
    
    if (!mealsTableExists || tableInfoError) {
      try {
        // Try to create the meals table with proper structure
        const { error } = await supabase.rpc('create_meals_table');
        
        if (error) {
          // Fall back to direct SQL if RPC fails
          const { error: sqlError } = await supabase.rpc('execute_sql', {
            sql_query: `
              CREATE TABLE IF NOT EXISTS meals (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL,
                caption TEXT,
                goal TEXT,
                image_url TEXT,
                analysis JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
              
              CREATE INDEX IF NOT EXISTS meals_user_id_idx ON meals(user_id);
              CREATE INDEX IF NOT EXISTS meals_created_at_idx ON meals(created_at);
            `
          });
          
          if (sqlError) {
            createTableError = sqlError;
          } else {
            createTableResult = "Created meals table with SQL";
          }
        } else {
          createTableResult = "Created meals table with RPC";
        }
      } catch (err) {
        createTableError = err;
      }
    }
    
    // Try inserting a test record if there are no meals
    let testInsertResult = null;
    let testInsertError = null;
    
    if (!meals || meals.length === 0) {
      try {
        const { data: insertData, error: insertError } = await supabase
          .from('meals')
          .insert({
            user_id: '00000000-0000-0000-0000-000000000000', // placeholder ID
            caption: 'Test Meal',
            goal: 'Test',
            image_url: 'https://example.com/test.jpg',
            analysis: { calories: 100, macronutrients: [], micronutrients: [] }
          })
          .select();
          
        if (insertError) {
          testInsertError = insertError;
        } else {
          testInsertResult = insertData;
        }
      } catch (err) {
        testInsertError = err;
      }
    }
    
    return NextResponse.json({
      database: {
        tablesError,
        mealsTableExists,
        tableInfo,
        tableInfoError,
        createTableResult,
        createTableError
      },
      meals: {
        data: meals,
        error: mealsError
      },
      testInsert: {
        result: testInsertResult,
        error: testInsertError
      }
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message || 'Unknown error', 
      stack: err.stack 
    }, { status: 500 });
  }
} 