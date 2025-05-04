import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getUserIdFromSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from session
    const { userId, error: authError } = await getUserIdFromSession(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const { imageUrl, caption, analysis } = await request.json();
    
    // Validate required fields
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }
    
    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis data is required' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Prepare the meal record
    const mealRecord = {
      user_id: userId,
      image_url: imageUrl,
      caption: caption || 'Meal analysis',
      calories: analysis.calories || 0,
      analysis_data: analysis,
      created_at: new Date().toISOString()
    };
    
    // Insert the meal record into the meal_history table
    const { data, error } = await supabase
      .from('meal_history')
      .insert(mealRecord)
      .select()
      .single();
    
    if (error) {
      console.error('Error saving meal to database:', error);
      return NextResponse.json(
        { error: 'Failed to save meal data' },
        { status: 500 }
      );
    }
    
    // Return success response with the saved meal data
    return NextResponse.json({
      message: 'Meal saved successfully',
      mealId: data.id
    });
    
  } catch (error) {
    console.error('Error in save-meal API route:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 