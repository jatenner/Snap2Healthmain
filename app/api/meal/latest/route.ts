import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Get the meal analysis data from cookies
    const mealDataCookie = cookies().get('meal_analysis_data');
    
    if (!mealDataCookie) {
      return NextResponse.json({
        success: false,
        error: 'No meal analysis data found'
      }, { status: 404 });
    }
    
    // Parse the JSON data from the cookie
    const mealData = JSON.parse(mealDataCookie.value);
    
    // Check if the data has the expected format
    if (!mealData || !mealData.analysis) {
      return NextResponse.json({
        success: false,
        error: 'Invalid meal analysis data'
      }, { status: 400 });
    }
    
    // Return the meal data
    return NextResponse.json({
      success: true,
      mealData
    });
  } catch (error) {
    console.error('Error retrieving meal data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve meal data'
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 