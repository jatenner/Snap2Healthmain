import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('[RecentMeals] Fetching recent meals...');

    // Create admin client for database operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the 5 most recent meals
    const { data: meals, error } = await supabaseAdmin
      .from('meals')
      .select('id, name, meal_name, created_at, calories, image_url')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('[RecentMeals] Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch recent meals'
      }, { status: 500 });
    }

    console.log('[RecentMeals] Found', meals?.length || 0, 'recent meals');

    return NextResponse.json(meals || []);

  } catch (error) {
    console.error('[RecentMeals] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
} 