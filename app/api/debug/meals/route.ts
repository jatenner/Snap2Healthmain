import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('[debug/meals] Checking meals in database...');
    
    // Get all meals from database
    const { data: allMeals, error } = await supabaseAdmin
      .from('meals')
      .select('id, user_id, meal_name, created_at, calories')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('[debug/meals] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('[debug/meals] Found meals:', allMeals);
    
    return NextResponse.json({
      success: true,
      totalMeals: allMeals?.length || 0,
      meals: allMeals || [],
      message: 'Debug: Recent meals from database'
    });
    
  } catch (error: any) {
    console.error('[debug/meals] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 