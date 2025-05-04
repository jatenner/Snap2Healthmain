import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    
    // Create a test meal record
    const testMeal = {
      user_id: userId,
      goal: 'Weight Management',
      caption: 'Test Meal',
      image_url: 'https://cyrztlmzanhfybqsakgc.supabase.co/storage/v1/object/public/meal-images/test-image.jpg',
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
    };
    
    // Use a direct API call with headers to bypass RLS
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/meals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testMeal)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to create test meal:', errorData);
      return NextResponse.json({ error: JSON.stringify(errorData) }, { status: response.status });
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Test meal created successfully',
      data
    });
  } catch (err: any) {
    console.error('Error in test-meal endpoint:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 