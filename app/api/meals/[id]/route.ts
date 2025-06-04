import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getLocalMealById, shouldUseLocalStorage } from '../../../../src/utils/localStorageMeals';
import { safeJsonParse } from '../../analyze-meal/json-fix';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const mealId = params.id;
  
  if (!mealId) {
    return NextResponse.json(
      { error: 'Meal ID is required' },
      { status: 400 }
    );
  }
  
  try {
    // Check if we're in auth bypass mode
    // if (shouldUseLocalStorage()) {
    //   // For auth bypass mode, we don't actually fetch from localStorage here (that's client-side)
    //   // Instead we just return a 404 so the client will check localStorage
    //   return NextResponse.json(
    //     { error: 'Meal not found' },
    //     { status: 404 }
    //   );
    // }
    
    // Create authenticated Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[api/meals/id] Error getting session:', sessionError);
      return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
    }

    // In development mode, allow access without session for testing
    if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Unauthorized - You must be logged in to view meals' },
        { status: 401 }
      );
    }
    
    // Create admin client to bypass RLS policies for read operations
    const { createClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    const userId = session?.user?.id;
    console.log(`[api/meals/id] Fetching meal ${mealId} for user ${userId || 'development-mode'}`);
    
    // Fetch the meal from Supabase using admin client
    let query = supabaseAdmin
      .from('meals')
      .select('*')
      .eq('id', mealId);
    
    // In production, filter by user_id for security
    if (session && userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.single();
    
    if (error) {
      console.error('[api/meals/id] Database error:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Meal not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Error fetching meal' },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      );
    }
    
    // Process the meal data to match expected format
    let analysisData = null;
    try {
      if (data.analysis_data) {
        analysisData = typeof data.analysis_data === 'string' ? 
          JSON.parse(data.analysis_data) : data.analysis_data;
      } else if (data.analysis) {
        analysisData = typeof data.analysis === 'string' ? 
          JSON.parse(data.analysis) : data.analysis;
      }
    } catch (e) {
      console.error('Error parsing analysis data:', e);
    }
    
    // Extract nutrition values from macronutrients array if not available at top level
    const extractMacroValue = (name: string, macronutrients: any[]) => {
      if (!Array.isArray(macronutrients)) return 0;
      const macro = macronutrients.find(m => 
        m.name?.toLowerCase().includes(name.toLowerCase()) || 
        m.name === name
      );
      return macro?.amount || 0;
    };
    
    const macronutrients = data.macronutrients || (analysisData as any)?.macronutrients || [];
    
    // Format the response to match the expected structure
    const formattedData = {
      id: data.id,
      user_id: data.user_id,
      mealName: data.meal_name || 'Untitled Meal',
      description: data.meal_description || (analysisData as any)?.mealDescription || 'A delicious and nutritious meal',
      imageUrl: data.image_url, // Support both formats
      caption: data.meal_name,
      goal: (analysisData as any)?.goal || data.goal || 'General Wellness',
      image_url: data.image_url,
      
      // Create nutrition object that matches frontend expectations
      nutrition: {
        calories: data.calories || (analysisData as any)?.calories || 0,
        protein: data.protein || (analysisData as any)?.protein || 0,
        fat: data.fat || (analysisData as any)?.fat || 0,
        carbs: data.carbs || (analysisData as any)?.carbs || 0,
        fiber: data.fiber || (analysisData as any)?.fiber || extractMacroValue('fiber', macronutrients),
        sugar: data.sugar || (analysisData as any)?.sugar || extractMacroValue('sugar', macronutrients),
        sodium: data.sodium || (analysisData as any)?.sodium || extractMacroValue('sodium', macronutrients)
      },
      
      // Top-level nutrition values for backward compatibility
      calories: data.calories || (analysisData as any)?.calories || 0,
      protein: data.protein || (analysisData as any)?.protein || 0,
      fat: data.fat || (analysisData as any)?.fat || 0,
      carbs: data.carbs || (analysisData as any)?.carbs || 0,
      fiber: data.fiber || (analysisData as any)?.fiber,
      
      macronutrients: data.macronutrients || (analysisData as any)?.macronutrients || [],
      micronutrients: data.micronutrients || (analysisData as any)?.micronutrients || [],
      ingredients: data.ingredients || (analysisData as any)?.ingredients || [],
      foodItems: data.foods_identified || (analysisData as any)?.foods || (analysisData as any)?.foods_identified || [],
      foods: data.foods_identified || (analysisData as any)?.foods || (analysisData as any)?.foods_identified || [],
      benefits: data.benefits || (analysisData as any)?.benefits || [],
      concerns: data.concerns || (analysisData as any)?.concerns || [],
      suggestions: data.suggestions || (analysisData as any)?.suggestions || [],
      recommendations: data.expert_recommendations || (analysisData as any)?.expert_recommendations || (analysisData as any)?.expertRecommendations || [],
      aiInsights: data.personalized_health_insights || (analysisData as any)?.personalized_health_insights || (analysisData as any)?.personalizedHealthInsights || 'AI analysis insights for this meal.',
      personalizedHealthInsights: data.personalized_health_insights || (analysisData as any)?.personalized_health_insights || (analysisData as any)?.personalizedHealthInsights,
      expertRecommendations: data.expert_recommendations || (analysisData as any)?.expert_recommendations || (analysisData as any)?.expertRecommendations || [],
      metabolicInsights: data.metabolic_insights || (analysisData as any)?.metabolic_insights || (analysisData as any)?.metabolicInsights,
      mealStory: data.meal_story || (analysisData as any)?.meal_story || (analysisData as any)?.mealStory,
      nutritionalNarrative: data.nutritional_narrative || (analysisData as any)?.nutritional_narrative || (analysisData as any)?.nutritionalNarrative,
      timeOfDayOptimization: data.time_of_day_optimization || (analysisData as any)?.time_of_day_optimization || (analysisData as any)?.timeOfDayOptimization,
      healthScore: data.health_score || (analysisData as any)?.health_score || (analysisData as any)?.healthScore || 0,
      healthRating: data.health_score || (analysisData as any)?.health_score || (analysisData as any)?.healthScore || 0,
      visualAnalysis: data.visual_analysis || (analysisData as any)?.visual_analysis || (analysisData as any)?.visualAnalysis,
      cookingMethod: data.cooking_method || (analysisData as any)?.cooking_method || (analysisData as any)?.cookingMethod,
      culturalContext: data.cultural_context || (analysisData as any)?.cultural_context || (analysisData as any)?.culturalContext,
      createdAt: data.created_at,
      created_at: data.created_at,
      analysis: analysisData
    };
    
    // Return the meal data
    return NextResponse.json(formattedData);
  } catch (error: any) {
    console.error('[api/meals/id] Error:', error);
    
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 