import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// Explicitly mark this route as dynamic to prevent build errors
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';
  
  try {
    // Create Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user from auth state
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Error fetching session:', authError.message);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
    
    // Check if we need to use development mode
    if (!session?.user?.id && !bypassAuth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Use placeholder ID in development mode
    const userId = session?.user?.id || (bypassAuth ? '00000000-0000-0000-0000-000000000000' : null);
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not available' }, { status: 400 });
    }
    
    // If we're in development mode with auth bypass, return fake meal history
    if (bypassAuth && userId === '00000000-0000-0000-0000-000000000000') {
      console.log('Returning simulated meal history for development');
      
      // Create fake meal history with oranges as a default
      const fakeMeals = [
        {
          id: 'dev-1',
          user_id: userId,
          goal: 'General Wellness',
          image_url: 'https://cyrztlmzanhfybqsakgc.supabase.co/storage/v1/object/public/meal-images/users/00000000-0000-0000-0000-000000000000/oranges.jpg',
          caption: 'A collection of fresh oranges',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
          analysis: JSON.stringify({
            caption: 'A collection of fresh oranges',
            ingredients: ['Oranges'],
            analysis: {
              calories: 62,
              macronutrients: [
                {
                  name: 'Carbs',
                  amount: 15.4,
                  unit: 'g',
                  percentDailyValue: 5,
                  description: 'Primary energy source in oranges'
                },
                {
                  name: 'Fiber',
                  amount: 3.1,
                  unit: 'g',
                  percentDailyValue: 11,
                  description: 'Supports digestive health'
                },
                {
                  name: 'Protein',
                  amount: 1.2,
                  unit: 'g',
                  percentDailyValue: 2,
                  description: 'Small amount for tissue repair'
                }
              ],
              micronutrients: [
                {
                  name: 'Vitamin C',
                  amount: 70,
                  unit: 'mg',
                  percentDailyValue: 78,
                  description: 'Powerful antioxidant supporting immune health'
                }
              ],
              benefits: [
                'Rich in vitamin C for immune support',
                'Good source of fiber for digestive health',
                'Contains antioxidants that may reduce inflammation'
              ]
            }
          })
        }
      ];
      
      return NextResponse.json({ meals: fakeMeals });
    }
    
    // Otherwise query the real database using service role to bypass RLS
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
          // For backward compatibility
          calories: analysisData?.calories,
          protein: analysisData?.protein,
          carbs: analysisData?.carbs,
          fat: analysisData?.fat
        };
      } catch (e) {
        console.error('Error processing meal data:', e);
        // Return meal with basic structure if processing fails
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

// Utility to get Supabase client (could be refactored to a shared lib)
function getSupabaseClient(userId?: string) {
  if (userId && userId === 'test-user-bypass' && process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true') {
    // Use anon key for bypass user, assuming RLS allows for this test user
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  }
  // For regular users or when not bypassing, use server client with auth cookies
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, mealData } = body;

    if (!userId || !mealData) {
      return NextResponse.json({ success: false, message: 'User ID and meal data are required' }, { status: 400 });
    }

    const supabase = getSupabaseClient(userId);

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