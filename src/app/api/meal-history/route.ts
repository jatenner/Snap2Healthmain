import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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
    
    // Otherwise query the real database
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
    const processedMeals = meals.map(meal => {
      try {
        // If analysis_json exists but analysis doesn't, convert it
        if (meal.analysis_json && !meal.analysis) {
          meal.analysis = JSON.stringify(meal.analysis_json);
        }
        
        // Ensure analysis is in string format for consistent frontend handling
        if (meal.analysis && typeof meal.analysis !== 'string') {
          meal.analysis = JSON.stringify(meal.analysis);
        }
        
        return meal;
      } catch (e) {
        console.error('Error processing meal data:', e);
        // Return original meal if processing fails
        return meal;
      }
    });
    
    return NextResponse.json({ meals: processedMeals });
  } catch (error: any) {
    console.error('Unexpected error in meal history API:', error);
    return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 });
  }
} 