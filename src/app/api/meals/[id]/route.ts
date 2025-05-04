import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromSession } from '../../../../lib/auth';
import { supabase } from '../../../../lib/supabaseClient';
import { getLocalMealById, shouldUseLocalStorage } from '../../../../utils/localStorageMeals';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const mealId = params.id;
  
  if (!mealId) {
    return NextResponse.json(
      { error: 'Meal ID is required' },
      { status: 400 }
    );
  }
  
  try {
    // Check if we're in auth bypass mode
    if (shouldUseLocalStorage()) {
      // For auth bypass mode, we don't actually fetch from localStorage here (that's client-side)
      // Instead we just return a 404 so the client will check localStorage
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      );
    }
    
    // Get the user ID from the session
    const { userId } = await getUserIdFromSession(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - You must be logged in to view meals' },
        { status: 401 }
      );
    }
    
    // Fetch the meal from Supabase
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('id', mealId)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('[api/meals/id] Database error:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Meal not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Error fetching meal' },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      );
    }
    
    // Return the meal data
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[api/meals/id] Error:', error);
    
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 