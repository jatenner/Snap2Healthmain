import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

// API route to get meal details by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const mealId = params.id;
  
  if (!mealId) {
    return NextResponse.json({ error: 'Meal ID is required' }, { status: 400 });
  }
  
  try {
    const supabase = createClient();
    
    // Get the current session for auth check
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Query the meals table for the specified meal
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('id', mealId)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching meal:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
      }
      
      return NextResponse.json({ error: 'Failed to fetch meal data' }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }
    
    // For debugging, log the structure of the nutritional data
    console.log('[API] Meal retrieved. Nutritional data check:', {
      has_nutrients: !!data.nutrients,
      has_calories: data.calories !== null && data.calories !== undefined,
      calories_type: typeof data.calories,
      calories_value: data.calories,
      has_macronutrients: Array.isArray(data.macronutrients),
      macronutrients_count: Array.isArray(data.macronutrients) ? data.macronutrients.length : 0,
      has_micronutrients: Array.isArray(data.micronutrients),
      micronutrients_count: Array.isArray(data.micronutrients) ? data.micronutrients.length : 0
    });
    
    // Return the meal data
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in meal API route:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 