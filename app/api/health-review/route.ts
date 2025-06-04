import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Make the route dynamic to prevent caching
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('[HealthReview] Starting health review generation...');
  
  try {
    const supabase = createClient();
    
    // Parse meal ID from query parameter
    const { searchParams } = new URL(request.url);
    const mealId = searchParams.get('mealId');
    
    if (!mealId) {
      console.log('[HealthReview] No meal ID provided');
      return NextResponse.json({ error: 'Meal ID is required' }, { status: 400 });
    }
    
    console.log(`[HealthReview] Processing meal ID: ${mealId}`);
    
    // Try to get user ID from Supabase auth session
    let userId: string | null = null;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      userId = user?.id || null;
      console.log(`[HealthReview] User authentication status: ${userId ? 'Authenticated' : 'Anonymous'}`);
      
      if (authError) {
        console.log('[HealthReview] Auth error:', authError.message);
      }
    } catch (authError) {
      console.log('[HealthReview] Auth check failed:', authError);
      // Continue without authentication for development
    }
    
    // Use development mode fallback if no authenticated user
    if (!userId) {
      userId = 'development-mode';
      console.log('[HealthReview] Using development mode fallback');
    }
    
    // Fetch meal data from database
    console.log(`[HealthReview] Fetching meal data for ID: ${mealId}, User: ${userId}`);
    
    const { data: meal, error: mealError } = await supabase
      .from('meals')
      .select('*')
      .eq('id', mealId)
      .eq('user_id', userId)
      .single();
    
    if (mealError) {
      console.error('[HealthReview] Error fetching meal:', mealError);
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }
    
    if (!meal) {
      console.log('[HealthReview] No meal found for the given ID and user');
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }
    
    console.log(`[HealthReview] Found meal: ${meal.meal_name || 'Unnamed meal'}`);
    
    // Generate health review based on meal data
    const healthReview = generateHealthReview(meal);
    
    console.log('[HealthReview] Health review generated successfully');
    
    return NextResponse.json({
      success: true,
      healthReview,
      mealId: meal.id,
      mealName: meal.meal_name
    });
    
  } catch (error) {
    console.error('[HealthReview] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateHealthReview(meal: any) {
  const analysis = meal.analysis || {};
  const calories = analysis.calories || 0;
  const protein = analysis.protein || 0;
  const carbs = analysis.carbs || 0;
  const fat = analysis.fat || 0;
  
  // Generate a simple health review
  const healthReview = {
    overall_score: calculateHealthScore(calories, protein, carbs, fat),
    strengths: generateStrengths(analysis),
    improvements: generateImprovements(analysis),
    recommendations: generateRecommendations(analysis),
    nutrition_breakdown: {
      calories,
      protein,
      carbohydrates: carbs,
      fat
    }
  };
  
  return healthReview;
}

function calculateHealthScore(calories: number, protein: number, carbs: number, fat: number): number {
  // Simple scoring algorithm (can be made more sophisticated)
  let score = 50; // Base score
  
  // Adjust based on macronutrient balance
  const totalMacros = protein + carbs + fat;
  if (totalMacros > 0) {
    const proteinRatio = protein / totalMacros;
    const carbRatio = carbs / totalMacros;
    const fatRatio = fat / totalMacros;
    
    // Ideal ratios (rough estimates)
    if (proteinRatio >= 0.15 && proteinRatio <= 0.35) score += 15;
    if (carbRatio >= 0.45 && carbRatio <= 0.65) score += 15;
    if (fatRatio >= 0.20 && fatRatio <= 0.35) score += 15;
  }
  
  // Adjust based on calorie range (assuming 400-800 cal meals are good)
  if (calories >= 300 && calories <= 800) score += 5;
  
  return Math.min(100, Math.max(0, score));
}

function generateStrengths(analysis: any): string[] {
  const strengths = [];
  
  if (analysis.benefits && Array.isArray(analysis.benefits)) {
    strengths.push(...analysis.benefits.slice(0, 3));
  }
  
  if (analysis.protein && analysis.protein > 20) {
    strengths.push('Good protein content for muscle maintenance');
  }
  
  if (analysis.micronutrients && Array.isArray(analysis.micronutrients)) {
    strengths.push('Rich in essential vitamins and minerals');
  }
  
  return strengths.length > 0 ? strengths : ['Provides essential nutrients'];
}

function generateImprovements(analysis: any): string[] {
  const improvements = [];
  
  if (analysis.concerns && Array.isArray(analysis.concerns)) {
    improvements.push(...analysis.concerns.slice(0, 3));
  }
  
  if (analysis.suggestions && Array.isArray(analysis.suggestions)) {
    improvements.push(...analysis.suggestions.slice(0, 2));
  }
  
  return improvements.length > 0 ? improvements : ['Consider adding more vegetables'];
}

function generateRecommendations(analysis: any): string[] {
  const recommendations = [];
  
  if (analysis.expert_recommendations && Array.isArray(analysis.expert_recommendations)) {
    recommendations.push(...analysis.expert_recommendations.slice(0, 4));
  }
  
  // Add some default recommendations if none exist
  if (recommendations.length === 0) {
    recommendations.push(
      'Maintain portion control',
      'Stay hydrated throughout the day',
      'Consider timing of meals with physical activity'
    );
  }
  
  return recommendations;
}