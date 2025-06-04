import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserIdFromSession } from '../../../../lib/auth';

/**
 * Execute SQL statements with admin privileges
 */
export async function POST(req: NextRequest) {
  try {
    console.log("[Execute SQL API] Processing SQL execution request");
    
    // Check if the request has the correct content type
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: "Invalid content type. Expected application/json" },
        { status: 400, headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }}
      );
    }
    
    // Parse the request body
    const body = await req.json();
    const sql = body.sql || body.sql_query;
    
    if (!sql) {
      return NextResponse.json(
        { error: "Missing SQL query in request body" },
        { status: 400, headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }}
      );
    }
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Missing Supabase credentials" },
        { status: 500, headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }}
      );
    }
    
    // Execute the SQL
    try {
      const result = await executeDirectSQL(supabaseUrl, supabaseKey, sql);
      return NextResponse.json(result, { headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }});
    } catch (error: any) {
      console.error("SQL execution error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500, headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }}
      );
    }
  } catch (error: any) {
    console.error("General error in execute-sql endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500, headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }}
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Bypass-Middleware',
    },
  });
}

// SQL statement to create the execute_sql function if it doesn't exist
const CREATE_EXECUTE_SQL_FUNCTION = `
  CREATE OR REPLACE FUNCTION public.execute_sql(sql_query text)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  DECLARE
    result jsonb;
  BEGIN
    EXECUTE sql_query;
    result := jsonb_build_object('success', true, 'message', 'SQL executed successfully');
    RETURN result;
  EXCEPTION WHEN OTHERS THEN
    result := jsonb_build_object(
      'success', false, 
      'message', 'Error executing SQL', 
      'error', SQLERRM, 
      'errorcode', SQLSTATE
    );
    RETURN result;
  END;
  $$;
`;

// Direct query execution function (for when RPC isn't available)
async function executeDirectQuery(supabaseUrl: string, serviceKey: string, sql: string) {
  try {
    console.log('Attempting direct query execution');
    
    // Try direct SQL execution against the Postgres endpoint
    try {
      // First try using a POST request to the REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          sql_query: sql
        })
      });
      
      if (response.ok) {
        return { success: true, data: await response.json() };
      }
      
      const responseText = await response.text();
      console.log('REST API query failed:', response.status, response.statusText);
      console.log('Error details:', responseText);
      throw new Error(`Direct query execution failed: ${response.statusText}`);
    } catch (directError) {
      console.log('REST API execution error:', directError);
      
      // Try alternative direct SQL method
      console.log('Attempting direct SQL with alternative method...');
      const pgResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sql',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Prefer': 'return=representation'
        },
        body: sql
      });
      
      if (!pgResponse.ok) {
        console.log('Alternative direct SQL failed:', pgResponse.status);
        throw new Error(`Direct query execution failed: ${pgResponse.statusText}`);
      }
      
      return { success: true, data: await pgResponse.json() };
    }
  } catch (error) {
    console.error('Direct SQL execution error:', error);
    throw error;
  }
}

// Direct SQL execution function
async function executeDirectSQL(supabaseUrl: string, serviceKey: string, sql: string): Promise<any> {
  try {
    console.log(`Executing SQL: ${sql.substring(0, 50)}...`);
    
    // Try multiple methods to execute the SQL
    
    // Method 1: Using direct fetch to the REST API endpoint
    try {
      console.log('Trying method 1: REST API endpoint');
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          sql_query: sql
        })
      });
      
      if (response.ok) {
        console.log('Method 1 succeeded');
        return { success: true, method: 'rpc-api', data: await response.json() };
      }
      
      console.log(`Method 1 failed: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.error('Method 1 error:', error);
    }
    
    // Method 2: Using direct SQL endpoint
    try {
      console.log('Trying method 2: Direct SQL endpoint');
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sql',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Prefer': 'return=representation'
        },
        body: sql
      });
      
      if (response.ok) {
        console.log('Method 2 succeeded');
        return { success: true, method: 'direct-sql-api', data: await response.json() };
      }
      
      console.log(`Method 2 failed: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.error('Method 2 error:', error);
    }
    
    // Method 3: Using Postgres Management API
    try {
      console.log('Trying method 3: Postgres Management API');
      const response = await fetch(`${supabaseUrl}/pg/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey
        },
        body: JSON.stringify({
          query: sql,
          database: 'postgres',
          schema: 'public'
        })
      });
      
      if (response.ok) {
        console.log('Method 3 succeeded');
        return { success: true, method: 'pg-management-api', data: await response.json() };
      }
      
      console.log(`Method 3 failed: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.error('Method 3 error:', error);
    }
    
    // Method 4: Using Supabase client
    try {
      console.log('Trying method 4: Supabase client');
      const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false }
      });
      
      // Try using the execute_sql function if it exists
      const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
      
      if (!error) {
        console.log('Method 4 succeeded');
        return { success: true, method: 'supabase-client', data };
      }
      
      console.log(`Method 4 failed: ${error.message}`);
    } catch (error) {
      console.error('Method 4 error:', error);
    }
    
    // All methods failed
    throw new Error('All SQL execution methods failed');
  } catch (error: any) {
    console.error('SQL execution error:', error);
    throw error;
  }
}

/**
 * Create helper functions in the database if they don't exist
 */
async function createHelperFunctions(supabase: any) {
  try {
    // Function to check if a column exists
    const checkColumnSql = `
      CREATE OR REPLACE FUNCTION check_column_exists(table_name text, column_name text)
      RETURNS boolean
      LANGUAGE plpgsql
      AS $$
      DECLARE
        column_exists boolean;
      BEGIN
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = $1
          AND column_name = $2
        ) INTO column_exists;
        
        RETURN column_exists;
      END;
      $$;
    `;
    
    // Function to check if an RLS policy exists
    const checkPolicySql = `
      CREATE OR REPLACE FUNCTION check_rls_policy_exists(table_name text, policy_name text)
      RETURNS boolean
      LANGUAGE plpgsql
      AS $$
      DECLARE
        policy_exists boolean;
      BEGIN
        SELECT EXISTS (
          SELECT 1
          FROM pg_policies
          WHERE schemaname = 'public'
          AND tablename = $1
          AND policyname = $2
        ) INTO policy_exists;
        
        RETURN policy_exists;
      END;
      $$;
    `;
    
    // Function to execute arbitrary SQL
    const executeSqlSql = `
      CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
      RETURNS json
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result json;
      BEGIN
        EXECUTE sql_query;
        result := json_build_object('success', true);
        RETURN result;
      EXCEPTION WHEN OTHERS THEN
        result := json_build_object('success', false, 'error', SQLERRM);
        RETURN result;
      END;
      $$;
    `;
    
    // Execute the function creation statements
    await supabase.rpc('execute_sql', { sql_query: checkColumnSql });
    await supabase.rpc('execute_sql', { sql_query: checkPolicySql });
    await supabase.rpc('execute_sql', { sql_query: executeSqlSql });
    
    return true;
  } catch (error) {
    console.error('[API] Error creating helper functions:', error);
    return false;
  }
}

// Allow GET requests for direct calls from browser
export async function GET(req: NextRequest) {
  // Extract SQL from query parameters
  const url = new URL(req.url);
  const sql = url.searchParams.get('sql');
  
  if (!sql) {
    return NextResponse.json(
      { error: "Missing SQL statement in query parameter" },
      { status: 400 }
    );
  }
  
  // Instead of creating a new request, just call the POST handler with the SQL
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Missing Supabase credentials" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    
    // Execute the SQL using the same logic as in POST
    try {
      // First, check if we need to create the execute_sql function
      if (sql.includes('CREATE OR REPLACE FUNCTION') && sql.includes('execute_sql')) {
        console.log("Detected execute_sql creation, using direct API method");
        try {
          const directResult = await executeDirectQuery(supabaseUrl, supabaseKey, sql);
          return NextResponse.json(directResult);
        } catch (directError: any) {
          console.error("Direct execution failed:", directError);
          return NextResponse.json(
            { error: `SQL execution failed: ${directError?.message || 'Unknown error'}` },
            { status: 500 }
          );
        }
      }

      // Try to execute the SQL query using the RPC method
      const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
      
      if (error) {
        console.error("SQL execution error via RPC:", error);
        
        // If the execute_sql function doesn't exist, try to create it
        if (error.message.includes("Could not find the function") || 
            error.code === "PGRST202") {
          console.log("Function execute_sql not found, trying direct execution...");
          
          try {
            // First try to create the execute_sql function
            const createResult = await executeDirectQuery(supabaseUrl, supabaseKey, CREATE_EXECUTE_SQL_FUNCTION);
            console.log("Created execute_sql function:", createResult);
            
            // Try executing the original SQL again using RPC
            console.log("Retrying original SQL execution after creating function");
            const retryResult = await supabase.rpc('execute_sql', { sql_query: sql });
            
            if (retryResult.error) {
              console.error("Retry failed:", retryResult.error);
              
              // As a last resort, try to execute the query directly
              console.log("Attempting direct query execution");
              const directResult = await executeDirectQuery(supabaseUrl, supabaseKey, sql);
              return NextResponse.json(directResult);
            }
            
            return NextResponse.json(retryResult.data);
          } catch (createError) {
            console.error("Error creating execute_sql function:", createError);
            
            // Direct execution as a fallback
            try {
              console.log("Attempting emergency direct query execution...");
              const directResult = await executeDirectQuery(supabaseUrl, supabaseKey, sql);
              return NextResponse.json(directResult);
            } catch (directError: any) {
              console.error("Direct execution failed:", directError);
              return NextResponse.json(
                { error: `SQL execution failed: ${directError?.message || 'Unknown error'}` },
                { status: 500 }
              );
            }
          }
        }
        
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    } catch (error: any) {
      console.error("Critical error during SQL execution:", error);
      
      // Last resort - try direct execution
      try {
        console.log("Attempting emergency query execution for schema changes");
        const result = await executeDirectQuery(supabaseUrl, supabaseKey, sql);
        return NextResponse.json(result);
      } catch (directError: any) {
        console.error("Emergency SQL execution failed:", directError);
        return NextResponse.json(
          { error: error.message || "SQL execution failed" },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error("Request handling error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to get Supabase client with admin privileges
function getAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase credentials");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

// Handler for executing SQL directly with POST
// export async function POST(req: NextRequest) {
//   try {
//     console.log("[Execute SQL API] Processing SQL execution request");
//     
//     // ... rest of existing POST implementation ...
//   }
// } 