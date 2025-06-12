import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { mealId } = await request.json();
    
    console.log(`[flexible-lookup] Starting flexible lookup for meal ID: ${mealId}`);
    
    if (!mealId) {
      return NextResponse.json({ error: 'Meal ID is required' }, { status: 400 });
    }

    // Create admin client to bypass RLS policies
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

    // Strategy 1: Try exact match first
    console.log(`[flexible-lookup] Strategy 1: Exact match for ${mealId}`);
    let { data, error } = await supabaseAdmin
      .from('meals')
      .select('*')
      .eq('id', mealId)
      .single();

    if (data && !error) {
      console.log(`[flexible-lookup] ✅ Found meal with exact match`);
      return NextResponse.json(formatMealData(data));
    }

    // Strategy 2: Try case-insensitive search
    console.log(`[flexible-lookup] Strategy 2: Case-insensitive search`);
    ({ data, error } = await supabaseAdmin
      .from('meals')
      .select('*')
      .ilike('id', mealId)
      .single());

    if (data && !error) {
      console.log(`[flexible-lookup] ✅ Found meal with case-insensitive match`);
      return NextResponse.json(formatMealData(data));
    }

    // Strategy 3: Try partial match (for truncated IDs)
    console.log(`[flexible-lookup] Strategy 3: Partial match search`);
    ({ data, error } = await supabaseAdmin
      .from('meals')
      .select('*')
      .ilike('id', `${mealId}%`)
      .limit(1)
      .single());

    if (data && !error) {
      console.log(`[flexible-lookup] ✅ Found meal with partial match`);
      return NextResponse.json(formatMealData(data));
    }

    // Strategy 4: Try searching by meal name if it looks like a name
    if (mealId.length > 36 || mealId.includes(' ')) {
      console.log(`[flexible-lookup] Strategy 4: Search by meal name`);
      ({ data, error } = await supabaseAdmin
        .from('meals')
        .select('*')
        .ilike('meal_name', `%${mealId}%`)
        .limit(1)
        .single());

      if (data && !error) {
        console.log(`[flexible-lookup] ✅ Found meal by name match`);
        return NextResponse.json(formatMealData(data));
      }
    }

    // Strategy 5: Try recent meals if all else fails
    console.log(`[flexible-lookup] Strategy 5: Get most recent meal as fallback`);
    ({ data, error } = await supabaseAdmin
      .from('meals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single());

    if (data && !error) {
      console.log(`[flexible-lookup] ⚠️ Using most recent meal as fallback`);
      return NextResponse.json({
        ...formatMealData(data),
        _fallback: true,
        _originalId: mealId,
        _message: 'Original meal not found, showing most recent meal instead'
      });
    }

    // If nothing works, return a helpful error
    console.log(`[flexible-lookup] ❌ No meal found with any strategy`);
    return NextResponse.json({
      error: 'Meal not found',
      searchedId: mealId,
      suggestions: [
        'Check if the meal ID is correct',
        'Try uploading a new meal for analysis',
        'Contact support if this issue persists'
      ]
    }, { status: 404 });

  } catch (error) {
    console.error('[flexible-lookup] Error:', error);
    return NextResponse.json({
      error: 'Internal server error during meal lookup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function formatMealData(data: any) {
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

  return {
    id: data.id,
    user_id: data.user_id,
    mealName: data.meal_name || data.name || 'Untitled Meal',
    description: data.meal_description || (analysisData as any)?.mealDescription || 'A delicious and nutritious meal',
    imageUrl: data.image_url,
    caption: data.meal_name || data.name,
    goal: (analysisData as any)?.goal || data.goal || 'General Wellness',
    image_url: data.image_url,
    
    // Nutrition data
    calories: data.calories || (analysisData as any)?.calories || 0,
    protein: data.protein || (analysisData as any)?.protein || 0,
    fat: data.fat || (analysisData as any)?.fat || 0,
    carbs: data.carbs || (analysisData as any)?.carbs || 0,
    fiber: data.fiber || (analysisData as any)?.fiber || extractMacroValue('fiber', macronutrients),
    
    macronutrients: data.macronutrients || (analysisData as any)?.macronutrients || [],
    micronutrients: data.micronutrients || (analysisData as any)?.micronutrients || [],
    ingredients: data.ingredients || (analysisData as any)?.ingredients || [],
    foods: data.foods_identified || (analysisData as any)?.foods || [],
    benefits: data.benefits || (analysisData as any)?.benefits || [],
    concerns: data.concerns || (analysisData as any)?.concerns || [],
    suggestions: data.suggestions || (analysisData as any)?.suggestions || [],
    
    // Advanced analysis fields
    personalizedHealthInsights: data.personalized_insights || (analysisData as any)?.personalizedHealthInsights || 'Personalized insights for this meal.',
    metabolicInsights: data.metabolic_insights || (analysisData as any)?.metabolicInsights || 'Metabolic analysis of this meal.',
    nutritionalNarrative: data.nutritional_narrative || (analysisData as any)?.nutritionalNarrative || 'Nutritional breakdown of this meal.',
    timeOfDayOptimization: data.time_optimization || (analysisData as any)?.timeOfDayOptimization || 'Optimal timing for this meal.',
    mealStory: data.meal_story || (analysisData as any)?.mealStory || 'The story of this meal.',
    expertRecommendations: data.expert_recommendations || (analysisData as any)?.expertRecommendations || [],
    healthRating: data.health_rating || (analysisData as any)?.healthRating || 7,
    
    // Analysis object for compatibility
    analysis: {
      calories: data.calories || (analysisData as any)?.calories || 0,
      totalCalories: data.calories || (analysisData as any)?.calories || 0,
      macronutrients: data.macronutrients || (analysisData as any)?.macronutrients || [],
      micronutrients: data.micronutrients || (analysisData as any)?.micronutrients || [],
      personalizedHealthInsights: data.personalized_insights || (analysisData as any)?.personalizedHealthInsights,
      metabolicInsights: data.metabolic_insights || (analysisData as any)?.metabolicInsights,
      nutritionalNarrative: data.nutritional_narrative || (analysisData as any)?.nutritionalNarrative,
      timeOfDayOptimization: data.time_optimization || (analysisData as any)?.timeOfDayOptimization,
      mealStory: data.meal_story || (analysisData as any)?.mealStory,
      expertRecommendations: data.expert_recommendations || (analysisData as any)?.expertRecommendations || [],
      suggestions: data.suggestions || (analysisData as any)?.suggestions || [],
      benefits: data.benefits || (analysisData as any)?.benefits || [],
      concerns: data.concerns || (analysisData as any)?.concerns || [],
      healthRating: data.health_rating || (analysisData as any)?.healthRating || 7
    },
    
    created_at: data.created_at,
    updated_at: data.updated_at
  };
} 