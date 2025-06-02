import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { safeJsonParse } from '@/app/api/analyze-meal/json-fix';

// Initialize Supabase clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Ensure dynamic runtime to prevent caching
export const dynamic = 'force-dynamic';

/**
 * GET handler for retrieving all meals or searching
 */
export async function GET(request: NextRequest) {
  console.log('[api/meals] Processing GET request');
  
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0;
    const search = searchParams.get('search');
    
    // Build the query - start with admin client for full access
    let query = supabaseAdmin.from('meals').select('*');
    
    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (search) {
      query = query.or(`meal_name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    // Add pagination
    query = query.order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Execute the query
    const { data: mealsData, error: mealsError } = await query;
    
    if (mealsError) {
      console.error('[api/meals] Database error from primary table:', mealsError);
      
      // If it's a structure error (like missing column), try backup tables
      if (mealsError.code === 'PGRST204') {
        console.log('[api/meals] Table structure issue, trying backup sources');
        
        // Try getting from meal_analyses
        const { data: analysesData, error: analysesError } = await supabaseAdmin
          .from('meal_analyses')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        
        if (!analysesError && analysesData && analysesData.length > 0) {
          // Map the analyses data to the expected format
          const mappedData = analysesData.map(item => ({
            id: item.uuid || item.id,
            user_id: item.user_id,
            meal_name: 'Analysis Result',
            calories: item.calories || 0,
            analysis: item.analysis || {},
            raw_analysis: item.raw_analysis || {},
            foods: item.foods || [],
            created_at: item.created_at
          }));
          
          return NextResponse.json(mappedData);
        }
        
        // Try getting from meal_data_backup
        const { data: backupData, error: backupError } = await supabaseAdmin
          .from('meal_data_backup')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        
        if (!backupError && backupData && backupData.length > 0) {
          // Map the backup data to the expected format
          const mappedData = backupData.map(item => {
            const parsedData = typeof item.data === 'string' 
              ? safeJsonParse(item.data, {}) 
              : (item.data || {});
              
            return {
              id: item.id,
              user_id: item.user_id,
              meal_name: item.name || 'Backup Meal',
              image_url: item.image_url,
              calories: parsedData.calories || 0,
              analysis: parsedData,
              foods: item.foods || [],
              created_at: item.created_at
            };
          });
          
          return NextResponse.json(mappedData);
        }
      }
      
      // If we got here, return the original error
      return NextResponse.json(
        {
          error: 'Error retrieving meals',
          details: mealsError.message,
          code: mealsError.code
        },
        { status: 500 }
      );
    }
    
    // If no error but also no data, return empty array
    if (!mealsData || mealsData.length === 0) {
      return NextResponse.json([]);
    }
    
    // Return the meals data
    return NextResponse.json(mealsData);
  } catch (error) {
    console.error('[api/meals] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Unexpected error retrieving meals',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating new meals
 */
export async function POST(request: NextRequest) {
  console.log('[api/meals] Processing POST request');
  
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }
    
    // Ensure required fields have defaults
    const mealData = {
      ...body,
      meal_name: body.meal_name || body.mealName || 'Untitled Meal',
      calories: body.calories || 0,
      macronutrients: body.macronutrients || {},
      micronutrients: body.micronutrients || {},
      foods: body.foods || [],
      raw_analysis: body.raw_analysis || body.rawAnalysis || {}
    };
    
    // Insert into the database
    const { data, error } = await supabaseAdmin
      .from('meals')
      .insert(mealData)
      .select('*')
      .single();
    
    if (error) {
      console.error('[api/meals] Error creating meal:', error);
      
      if (error.code === 'PGRST204') {
        // Schema issue, try to insert with only validated fields
        const safeData = {
          user_id: mealData.user_id,
          meal_name: mealData.meal_name,
          calories: mealData.calories,
          image_url: mealData.image_url
        };
        
        const { data: safeInsertData, error: safeError } = await supabaseAdmin
          .from('meals')
          .insert(safeData)
          .select('*')
          .single();
          
        if (!safeError) {
          return NextResponse.json({
            ...safeInsertData,
            _note: 'Limited data saved due to schema constraints'
          });
        }
        
        // If still failing, try backup table
        const { data: backupData, error: backupError } = await supabaseAdmin
          .from('meal_data_backup')
          .insert({
            user_id: mealData.user_id,
            name: mealData.meal_name,
            image_url: mealData.image_url,
            data: mealData
          })
          .select('*')
          .single();
          
        if (!backupError) {
          return NextResponse.json({
            id: backupData.id,
            user_id: backupData.user_id,
            meal_name: backupData.name,
            image_url: backupData.image_url,
            _note: 'Saved to backup table',
            _source: 'meal_data_backup'
          });
        }
      }
      
      return NextResponse.json(
        {
          error: 'Failed to create meal',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('[api/meals] Error processing meal creation:', error);
    return NextResponse.json(
      {
        error: 'Error processing meal creation',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 