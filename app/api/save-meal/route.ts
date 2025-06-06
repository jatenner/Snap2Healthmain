import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserIdFromSession } from '@/lib/auth';

// Explicitly mark this route as dynamic to prevent build errors
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get user ID from session
    const { userId, error: authError } = await getUserIdFromSession(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - You must be logged in to save a meal' },
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