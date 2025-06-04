import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';
  const url = new URL(request.url);
  const mealId = url.searchParams.get('id');
  
  if (!mealId) {
    return NextResponse.json({ error: 'Meal ID is required' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    
    // Check if this is a development ID (starts with "dev-")
    if (bypassAuth && mealId.startsWith('dev-')) {
      console.log(`Fetching simulated meal data for development ID: ${mealId}`);
      
      // Return simulated data for the development meal ID
      return NextResponse.json({
        id: mealId,
        user_id: '00000000-0000-0000-0000-000000000000',
        goal: 'General Wellness',
        image_url: 'https://cyrztlmzanhfybqsakgc.supabase.co/storage/v1/object/public/meal-images/users/00000000-0000-0000-0000-000000000000/oranges.jpg',
        caption: 'A collection of fresh oranges',
        created_at: new Date().toISOString(),
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
            ],
            suggestions: [
              'Enjoy as a snack between meals',
              'Add to salads for extra vitamin C',
              'Consider pairing with protein for a more balanced snack'
            ],
            // Add recovery insights
            recoveryInsights: [
              {
                title: 'Immune Boost',
                description: 'The high vitamin C content supports immune function, helping your body recover from exercise and stress.'
              },
              {
                title: 'Energy Boost',
                description: 'Natural sugars in oranges provide quick energy, making them a great pre-workout or recovery snack.'
              }
            ],
            // Add hydration data
            hydration: {
              level: 87,
              waterContent: 87,
              unit: 'ml',
              tips: [
                'Oranges are about 87% water, making them excellent for hydration',
                'Eat after a workout to help replenish fluids and electrolytes',
                'Consider adding orange slices to water for natural flavoring'
              ]
            },
            // Add glycemic load data
            glycemicLoad: {
              value: 5,
              index: 43,
              carbs: 12,
              unit: 'g',
              foodTypes: [
                'Fresh whole oranges',
                'Natural fruit sugars',
                'Complex carbohydrates'
              ],
              impact: 'The moderate glycemic index with low overall glycemic load makes oranges a good choice for sustained energy without dramatic blood sugar fluctuations.'
            }
          }
        })
      });
    }
    
    // For regular IDs, query the database
    const cookieStore = cookies();
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Error fetching session:', authError.message);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
    
    if (!session?.user?.id && !bypassAuth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Use placeholder ID in development mode
    const userId = session?.user?.id || (bypassAuth ? '00000000-0000-0000-0000-000000000000' : null);
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not available' }, { status: 400 });
    }
    
    // Query the database for the specific meal
    const { data: meal, error: dbError } = await supabase
      .from('meals')
      .select('*')
      .eq('id', mealId)
      .eq('user_id', userId)
      .single();
    
    if (dbError) {
      console.error('Error fetching meal:', dbError.message);
      return NextResponse.json({ error: 'Database error', details: dbError.message }, { status: 500 });
    }
    
    if (!meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }
    
    return NextResponse.json(meal);
  } catch (error: any) {
    console.error('Unexpected error in meal API:', error);
    return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 });
  }
} 