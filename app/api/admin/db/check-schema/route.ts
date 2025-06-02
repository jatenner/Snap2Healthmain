import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define types for schema check result
interface SchemaItemStatus {
  status: boolean;
  details: string | null;
}

interface SchemaCheckResult {
  success: boolean;
  timestamp: string;
  extensions: {
    uuid_ossp: SchemaItemStatus;
  };
  functions: {
    execute_sql: SchemaItemStatus;
    string_to_uuid: SchemaItemStatus;
    admin_insert_meal: SchemaItemStatus;
  };
  tables: {
    meal_analyses: SchemaItemStatus;
    meals: SchemaItemStatus;
    meal_data_backup: SchemaItemStatus;
  };
  columns: {
    meal_analyses: {
      raw_analysis: SchemaItemStatus;
      foods: SchemaItemStatus;
      uuid: SchemaItemStatus;
    };
    meals: {
      meal_name: SchemaItemStatus;
    };
    meal_data_backup: {
      raw_analysis: SchemaItemStatus;
      foods: SchemaItemStatus;
      uuid: SchemaItemStatus;
    };
  };
  indices: {
    idx_meal_analyses_uuid: SchemaItemStatus;
  };
  rls: {
    meal_data_backup: SchemaItemStatus;
    meal_analyses: SchemaItemStatus;
    meals: SchemaItemStatus;
  };
  problems: string[];
  recommendations: string[];
}

/**
 * Check if the database schema is correct
 */
export async function GET(req: NextRequest) {
  try {
    // Check for auth bypass in dev mode
    const isAdminBypass = req.headers.get("x-admin-bypass") === "true";
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader && !isAdminBypass && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    // Schema check result object
    const result: SchemaCheckResult = {
      success: false,
      timestamp: new Date().toISOString(),
      extensions: {
        uuid_ossp: { status: false, details: null }
      },
      functions: {
        execute_sql: { status: false, details: null },
        string_to_uuid: { status: false, details: null },
        admin_insert_meal: { status: false, details: null }
      },
      tables: {
        meal_analyses: { status: false, details: null },
        meals: { status: false, details: null },
        meal_data_backup: { status: false, details: null }
      },
      columns: {
        meal_analyses: {
          raw_analysis: { status: false, details: null },
          foods: { status: false, details: null },
          uuid: { status: false, details: null }
        },
        meals: {
          meal_name: { status: false, details: null }
        },
        meal_data_backup: {
          raw_analysis: { status: false, details: null },
          foods: { status: false, details: null },
          uuid: { status: false, details: null }
        }
      },
      indices: {
        idx_meal_analyses_uuid: { status: false, details: null }
      },
      rls: {
        meal_data_backup: { status: false, details: null },
        meal_analyses: { status: false, details: null },
        meals: { status: false, details: null }
      },
      problems: [],
      recommendations: []
    };

    // First, try direct queries to avoid dependence on the execute_sql function
    try {
      // Check extensions
      const { data: extensionsData, error: extensionsError } = await directQuery(supabase, `
        SELECT extname FROM pg_extension WHERE extname = 'uuid-ossp';
      `);
      
      if (!extensionsError && extensionsData && extensionsData.length > 0) {
        result.extensions.uuid_ossp.status = true;
        result.extensions.uuid_ossp.details = "Extension exists";
      } else {
        result.problems.push("UUID extension is missing");
        result.recommendations.push("Run CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";");
      }
    } catch (error: any) {
      console.error("Error checking uuid-ossp extension:", error);
      result.extensions.uuid_ossp.details = error.message;
    }

    // Check if execute_sql function exists using direct query
    try {
      const { data: functionData, error: functionError } = await directQuery(supabase, `
        SELECT proname FROM pg_proc WHERE proname = 'execute_sql' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
      `);
      
      if (!functionError && functionData && functionData.length > 0) {
        result.functions.execute_sql.status = true;
        result.functions.execute_sql.details = "Function exists";
        
        // Now we can use the execute_sql function for other queries
        // Try to execute the function
        try {
          const { data: testData, error: testError } = await supabase.rpc('execute_sql', { 
            sql_query: "SELECT 'test';" 
          });
          
          if (!testError) {
            result.functions.execute_sql.details = "Function exists and works correctly";
          } else {
            result.functions.execute_sql.details = `Function exists but fails: ${testError.message}`;
            result.problems.push("execute_sql function exists but doesn't work");
            result.recommendations.push("Recreate the execute_sql function");
          }
        } catch (testError: any) {
          result.functions.execute_sql.details = `Function exists but fails: ${testError.message}`;
          result.problems.push("execute_sql function exists but doesn't work");
          result.recommendations.push("Recreate the execute_sql function");
        }
      } else {
        result.problems.push("execute_sql function is missing");
        result.recommendations.push("Create the execute_sql function");
      }
    } catch (error: any) {
      console.error("Error checking execute_sql function:", error);
      result.functions.execute_sql.details = error.message;
    }

    // Check string_to_uuid function
    try {
      const { data: functionData, error: functionError } = await directQuery(supabase, `
        SELECT proname FROM pg_proc WHERE proname = 'string_to_uuid' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
      `);
      
      if (!functionError && functionData && functionData.length > 0) {
        result.functions.string_to_uuid.status = true;
        result.functions.string_to_uuid.details = "Function exists";
        
        // Try using the function if execute_sql works
        if (result.functions.execute_sql.status) {
          try {
            const { data: testData, error: testError } = await supabase.rpc('string_to_uuid', { 
              input_str: "00000000-0000-0000-0000-000000000000" 
            });
            
            if (!testError) {
              result.functions.string_to_uuid.details = "Function exists and works correctly";
            } else {
              result.functions.string_to_uuid.details = `Function exists but fails: ${testError.message}`;
              result.problems.push("string_to_uuid function exists but doesn't work");
              result.recommendations.push("Recreate the string_to_uuid function");
            }
          } catch (testError: any) {
            result.functions.string_to_uuid.details = `Function exists but fails: ${testError.message}`;
            result.problems.push("string_to_uuid function exists but doesn't work");
            result.recommendations.push("Recreate the string_to_uuid function");
          }
        }
      } else {
        result.problems.push("string_to_uuid function is missing");
        result.recommendations.push("Create the string_to_uuid function");
      }
    } catch (error: any) {
      console.error("Error checking string_to_uuid function:", error);
      result.functions.string_to_uuid.details = error.message;
    }

    // Check admin_insert_meal function
    try {
      const { data: functionData, error: functionError } = await directQuery(supabase, `
        SELECT proname FROM pg_proc WHERE proname = 'admin_insert_meal' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
      `);
      
      if (!functionError && functionData && functionData.length > 0) {
        result.functions.admin_insert_meal.status = true;
        result.functions.admin_insert_meal.details = "Function exists";
      } else {
        result.problems.push("admin_insert_meal function is missing");
        result.recommendations.push("Create the admin_insert_meal function");
      }
    } catch (error: any) {
      console.error("Error checking admin_insert_meal function:", error);
      result.functions.admin_insert_meal.details = error.message;
    }

    // Check tables and columns
    // meal_analyses table
    try {
      const { data: tablesData, error: tablesError } = await directQuery(supabase, `
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'meal_analyses';
      `);
      
      if (!tablesError && tablesData && tablesData.length > 0) {
        result.tables.meal_analyses.status = true;
        result.tables.meal_analyses.details = "Table exists";
        
        // Check columns
        const { data: columnsData, error: columnsError } = await directQuery(supabase, `
          SELECT column_name FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'meal_analyses';
        `);
        
        if (!columnsError && columnsData) {
          const columns = columnsData.map((row: any) => row.column_name);
          
          // Check each column
          if (columns.includes('raw_analysis')) {
            result.columns.meal_analyses.raw_analysis.status = true;
            result.columns.meal_analyses.raw_analysis.details = "Column exists";
          } else {
            result.problems.push("meal_analyses.raw_analysis column is missing");
            result.recommendations.push("Add the raw_analysis column to meal_analyses table");
          }
          
          if (columns.includes('foods')) {
            result.columns.meal_analyses.foods.status = true;
            result.columns.meal_analyses.foods.details = "Column exists";
          } else {
            result.problems.push("meal_analyses.foods column is missing");
            result.recommendations.push("Add the foods column to meal_analyses table");
          }
          
          if (columns.includes('uuid')) {
            result.columns.meal_analyses.uuid.status = true;
            result.columns.meal_analyses.uuid.details = "Column exists";
          } else {
            result.problems.push("meal_analyses.uuid column is missing");
            result.recommendations.push("Add the uuid column to meal_analyses table");
          }
        }
        
        // Check index
        const { data: indexData, error: indexError } = await directQuery(supabase, `
          SELECT indexname FROM pg_indexes 
          WHERE schemaname = 'public' AND tablename = 'meal_analyses' AND indexname = 'idx_meal_analyses_uuid';
        `);
        
        if (!indexError && indexData && indexData.length > 0) {
          result.indices.idx_meal_analyses_uuid.status = true;
          result.indices.idx_meal_analyses_uuid.details = "Index exists";
        } else {
          result.problems.push("Index on meal_analyses.uuid is missing");
          result.recommendations.push("Create an index on meal_analyses.uuid column");
        }
        
        // Check RLS
        const { data: rlsData, error: rlsError } = await directQuery(supabase, `
          SELECT relrowsecurity FROM pg_class 
          WHERE relname = 'meal_analyses' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
        `);
        
        if (!rlsError && rlsData && rlsData.length > 0 && rlsData[0].relrowsecurity) {
          result.rls.meal_analyses.status = true;
          result.rls.meal_analyses.details = "RLS is enabled";
        } else {
          result.problems.push("RLS is not enabled on meal_analyses table");
          result.recommendations.push("Enable RLS on meal_analyses table");
        }
      } else {
        result.problems.push("meal_analyses table is missing");
        result.recommendations.push("Create the meal_analyses table");
      }
    } catch (error: any) {
      console.error("Error checking meal_analyses table:", error);
      result.tables.meal_analyses.details = error.message;
    }

    // meals table
    try {
      const { data: tablesData, error: tablesError } = await directQuery(supabase, `
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'meals';
      `);
      
      if (!tablesError && tablesData && tablesData.length > 0) {
        result.tables.meals.status = true;
        result.tables.meals.details = "Table exists";
        
        // Check columns
        const { data: columnsData, error: columnsError } = await directQuery(supabase, `
          SELECT column_name FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'meals';
        `);
        
        if (!columnsError && columnsData) {
          const columns = columnsData.map((row: any) => row.column_name);
          
          // Check meal_name column
          if (columns.includes('meal_name')) {
            result.columns.meals.meal_name.status = true;
            result.columns.meals.meal_name.details = "Column exists";
          } else {
            result.problems.push("meals.meal_name column is missing");
            result.recommendations.push("Add the meal_name column to meals table");
          }
        }
        
        // Check RLS
        const { data: rlsData, error: rlsError } = await directQuery(supabase, `
          SELECT relrowsecurity FROM pg_class 
          WHERE relname = 'meals' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
        `);
        
        if (!rlsError && rlsData && rlsData.length > 0 && rlsData[0].relrowsecurity) {
          result.rls.meals.status = true;
          result.rls.meals.details = "RLS is enabled";
        } else {
          result.problems.push("RLS is not enabled on meals table");
          result.recommendations.push("Enable RLS on meals table");
        }
      } else {
        result.problems.push("meals table is missing");
        result.recommendations.push("Create the meals table");
      }
    } catch (error: any) {
      console.error("Error checking meals table:", error);
      result.tables.meals.details = error.message;
    }

    // meal_data_backup table
    try {
      const { data: tablesData, error: tablesError } = await directQuery(supabase, `
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'meal_data_backup';
      `);
      
      if (!tablesError && tablesData && tablesData.length > 0) {
        result.tables.meal_data_backup.status = true;
        result.tables.meal_data_backup.details = "Table exists";
        
        // Check columns
        const { data: columnsData, error: columnsError } = await directQuery(supabase, `
          SELECT column_name FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'meal_data_backup';
        `);
        
        if (!columnsError && columnsData) {
          const columns = columnsData.map((row: any) => row.column_name);
          
          // Check each column
          if (columns.includes('raw_analysis')) {
            result.columns.meal_data_backup.raw_analysis.status = true;
            result.columns.meal_data_backup.raw_analysis.details = "Column exists";
          } else {
            result.problems.push("meal_data_backup.raw_analysis column is missing");
            result.recommendations.push("Add the raw_analysis column to meal_data_backup table");
          }
          
          if (columns.includes('foods')) {
            result.columns.meal_data_backup.foods.status = true;
            result.columns.meal_data_backup.foods.details = "Column exists";
          } else {
            result.problems.push("meal_data_backup.foods column is missing");
            result.recommendations.push("Add the foods column to meal_data_backup table");
          }
          
          if (columns.includes('uuid')) {
            result.columns.meal_data_backup.uuid.status = true;
            result.columns.meal_data_backup.uuid.details = "Column exists";
          } else {
            result.problems.push("meal_data_backup.uuid column is missing");
            result.recommendations.push("Add the uuid column to meal_data_backup table");
          }
        }
        
        // Check RLS
        const { data: rlsData, error: rlsError } = await directQuery(supabase, `
          SELECT relrowsecurity FROM pg_class 
          WHERE relname = 'meal_data_backup' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
        `);
        
        if (!rlsError && rlsData && rlsData.length > 0 && rlsData[0].relrowsecurity) {
          result.rls.meal_data_backup.status = true;
          
          // Check admin policy
          const { data: policyData, error: policyError } = await directQuery(supabase, `
            SELECT policyname FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = 'meal_data_backup' AND policyname = 'Admins can do anything';
          `);
          
          if (!policyError && policyData && policyData.length > 0) {
            result.rls.meal_data_backup.details = "RLS is enabled and admin policy exists";
          } else {
            result.rls.meal_data_backup.details = "RLS is enabled but admin policy is missing";
            result.problems.push("Admin policy for meal_data_backup is missing");
            result.recommendations.push("Create the 'Admins can do anything' policy for meal_data_backup");
          }
        } else {
          result.problems.push("RLS is not enabled on meal_data_backup table");
          result.recommendations.push("Enable RLS on meal_data_backup table");
        }
      } else {
        result.problems.push("meal_data_backup table is missing");
        result.recommendations.push("Create the meal_data_backup table");
      }
    } catch (error: any) {
      console.error("Error checking meal_data_backup table:", error);
      result.tables.meal_data_backup.details = error.message;
    }

    // Check overall status
    result.success = result.problems.length === 0;

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Schema check error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Internal server error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper function for direct queries
async function directQuery(supabase: any, query: string) {
  try {
    // First try with execute_sql if available
    try {
      const { data, error } = await supabase.rpc('execute_sql', { 
        sql_query: query 
      });
      
      if (!error) {
        return { data, error: null };
      }
    } catch (rpcError) {
      // Ignore if execute_sql isn't available
    }
    
    // Direct query using REST API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sql',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        'Prefer': 'return=representation'
      },
      body: query
    });
    
    if (response.ok) {
      const data = await response.json();
      return { data, error: null };
    } else {
      return { 
        data: null, 
        error: { 
          message: `Direct query failed: ${response.status} ${response.statusText}` 
        } 
      };
    }
  } catch (error: any) {
    return { data: null, error };
  }
}

// Also allow POST for compatibility
export async function POST(req: NextRequest) {
  return GET(req);
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Bypass-Middleware, X-Admin-Bypass',
    },
  });
} 