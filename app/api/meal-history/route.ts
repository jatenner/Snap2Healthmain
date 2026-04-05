import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';

// Explicitly mark this route as dynamic to prevent build errors
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Query the real database
    const { data: meals, error: dbError } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Error fetching meals:', dbError.message);
      return NextResponse.json({ error: 'Database error', details: dbError.message }, { status: 500 });
    }

    // Process meals to ensure analysis is properly formatted
    const processedMeals = meals?.map(meal => {
      try {
        let analysisData = null;

        // Try to parse analysis data from different possible columns
        if (meal.analysis_data) {
          analysisData = typeof meal.analysis_data === 'string' ?
            JSON.parse(meal.analysis_data) : meal.analysis_data;
        } else if (meal.analysis) {
          analysisData = typeof meal.analysis === 'string' ?
            JSON.parse(meal.analysis) : meal.analysis;
        }

        return {
          id: meal.id,
          user_id: meal.user_id,
          mealName: meal.meal_name,
          imageUrl: meal.image_url,
          caption: meal.meal_name,
          created_at: meal.created_at,
          analysis: analysisData,
          calories: analysisData?.calories,
          protein: analysisData?.protein,
          carbs: analysisData?.carbs,
          fat: analysisData?.fat
        };
      } catch (e) {
        console.error('Error processing meal data:', e);
        return {
          id: meal.id,
          user_id: meal.user_id,
          mealName: meal.meal_name || 'Untitled Meal',
          imageUrl: meal.image_url,
          caption: meal.meal_name || 'Untitled Meal',
          created_at: meal.created_at,
          analysis: null
        };
      }
    }) || [];

    return NextResponse.json({
      success: true,
      meals: processedMeals,
      count: processedMeals.length
    });
  } catch (error: any) {
    console.error('Unexpected error in meal history API:', error);
    return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const body = await req.json();
    const { mealData } = body;

    if (!mealData) {
      return NextResponse.json({ success: false, message: 'Meal data is required' }, { status: 400 });
    }

    console.log(`[api/meal-history] Attempting to save meal for user ${userId}`);
    const { data, error } = await supabase
      .from('meals')
      .insert({ ...mealData, user_id: userId })
      .select();

    if (error) {
      console.error('[api/meal-history] Error saving meal:', error.message);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
    console.log('[api/meal-history] Successfully saved meal data');
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (e: any) {
    console.error('[api/meal-history] Unexpected error in POST:', e);
    return NextResponse.json({ success: false, message: e.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
