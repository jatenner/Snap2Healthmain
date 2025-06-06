import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    
    const supabase = createClient();
    
    // This approach uses the rpc function which can bypass RLS if set up properly
    const { data, error } = await supabase.rpc('add_test_meal', { 
      user_id_param: userId,
      caption_param: 'Test Meal Breakfast',
      goal_param: 'Weight Management',
      image_url_param: 'https://cyrztlmzanhfybqsakgc.supabase.co/storage/v1/object/public/meal-images/users/8751af51-f8f5-4a18-a3cf-53480390635f/1746467896472-dinner3.jpeg',
      analysis_param: JSON.stringify({
        calories: 450,
        macronutrients: [
          { name: 'Protein', amount: 25, unit: 'g' },
          { name: 'Carbs', amount: 45, unit: 'g' },
          { name: 'Fat', amount: 15, unit: 'g' }
        ],
        micronutrients: []
      })
    });
    
    if (error) {
      // If RPC function doesn't exist, fall back to a direct SQL approach
      const timestamp = new Date().toISOString();
      const queryParams = {
        id: `test-meal-${Date.now()}`,
        user_id: userId,
        caption: 'Test Meal Direct SQL',
        goal: 'Test Goal',
        image_url: 'https://cyrztlmzanhfybqsakgc.supabase.co/storage/v1/object/public/meal-images/users/8751af51-f8f5-4a18-a3cf-53480390635f/1746467896472-dinner3.jpeg',
        analysis: JSON.stringify({
          calories: 500,
          macronutrients: [
            { name: 'Protein', amount: 25, unit: 'g' },
            { name: 'Carbs', amount: 50, unit: 'g' },
            { name: 'Fat', amount: 20, unit: 'g' }
          ],
          micronutrients: []
        }),
        created_at: timestamp
      };
      
      console.log("Attempting direct insertion via fetch");
      
      // Try with a standard fetch instead - using your existing user credentials
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/meals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: userId,
          caption: 'Test Meal via Fetch',
          goal: 'Weight Management',
          image_url: 'https://cyrztlmzanhfybqsakgc.supabase.co/storage/v1/object/public/meal-images/users/8751af51-f8f5-4a18-a3cf-53480390635f/1746467896472-dinner3.jpeg',
          analysis: {
            calories: 500,
            macronutrients: [
              { name: 'Protein', amount: 25, unit: 'g' },
              { name: 'Carbs', amount: 50, unit: 'g' },
              { name: 'Fat', amount: 20, unit: 'g' }
            ],
            micronutrients: []
          },
          created_at: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to insert via fetch:', errorData);
        
        return NextResponse.json({
          error: 'Failed to insert test meal. Check server logs for details.',
          details: {
            rpcError: error,
            fetchError: errorData
          }
        }, { status: 500 });
      }
      
      const insertedData = await response.json();
      return NextResponse.json({
        success: true,
        message: 'Test meal created successfully via fetch',
        data: insertedData
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test meal created successfully via RPC',
      data
    });
  } catch (err: any) {
    console.error('Error in add-test-meal endpoint:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 