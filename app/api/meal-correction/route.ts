import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// User correction system for improving AI accuracy
export async function POST(request: NextRequest) {
  try {
    const { createClient: createServerClient } = await import('../../lib/supabase/server');
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }
    
    const userId = session.user.id;
    const body = await request.json();
    const { 
      mealId, 
      corrections, 
      correctionType, 
      feedback,
      originalAnalysis,
      correctedAnalysis 
    } = body;
    
    if (!mealId || !corrections) {
      return NextResponse.json({
        success: false,
        error: 'Meal ID and corrections are required'
      }, { status: 400 });
    }
    
    // Verify meal belongs to user
    const { data: meal, error: mealError } = await supabaseAdmin
      .from('meals')
      .select('*')
      .eq('id', mealId)
      .eq('user_id', userId)
      .single();
    
    if (mealError || !meal) {
      return NextResponse.json({
        success: false,
        error: 'Meal not found or access denied'
      }, { status: 404 });
    }
    
    // Get or create user learning profile
    let { data: learningProfile } = await supabaseAdmin
      .from('user_learning_profile')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!learningProfile) {
      const { data: newProfile } = await supabaseAdmin
        .from('user_learning_profile')
        .insert({
          user_id: userId,
          dietary_preferences: {},
          health_goals: {},
          food_sensitivities: {},
          past_insights: {},
          learning_data: {
            analysis_corrections: [],
            accuracy_feedback: [],
            correction_count: 0
          }
        })
        .select()
        .single();
      learningProfile = newProfile;
    }
    
    // Process corrections
    const correctionEntry = {
      mealId,
      timestamp: new Date().toISOString(),
      correctionType: correctionType || 'general',
      originalAnalysis: originalAnalysis || meal.analysis,
      correctedAnalysis: correctedAnalysis || corrections,
      feedback: feedback || '',
      corrections: corrections,
      userSatisfaction: feedback?.satisfaction || null
    };
    
    // Update learning data
    const updatedLearningData = {
      ...learningProfile.learning_data,
      analysis_corrections: [
        ...(learningProfile.learning_data.analysis_corrections || []),
        correctionEntry
      ],
      correction_count: (learningProfile.learning_data.correction_count || 0) + 1,
      last_correction: new Date().toISOString()
    };
    
    // Learn from specific correction types
    if (correctionType === 'food_identification') {
      updatedLearningData.food_identification_corrections = [
        ...(updatedLearningData.food_identification_corrections || []),
        {
          original: originalAnalysis?.identifiedFoods || [],
          corrected: corrections.identifiedFoods || [],
          timestamp: new Date().toISOString()
        }
      ];
    }
    
    if (correctionType === 'portion_size') {
      updatedLearningData.portion_corrections = [
        ...(updatedLearningData.portion_corrections || []),
        {
          original: originalAnalysis?.calories || 0,
          corrected: corrections.calories || 0,
          portionFeedback: corrections.portionFeedback || '',
          timestamp: new Date().toISOString()
        }
      ];
    }
    
    if (correctionType === 'nutrition_values') {
      updatedLearningData.nutrition_corrections = [
        ...(updatedLearningData.nutrition_corrections || []),
        {
          original: originalAnalysis?.macronutrients || [],
          corrected: corrections.macronutrients || [],
          timestamp: new Date().toISOString()
        }
      ];
    }
    
    // Update user learning profile
    await supabaseAdmin
      .from('user_learning_profile')
      .update({
        learning_data: updatedLearningData,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    // Update the meal record with corrections
    const updatedMealAnalysis = {
      ...meal.analysis,
      userCorrections: correctionEntry,
      correctionHistory: [
        ...(meal.analysis?.correctionHistory || []),
        correctionEntry
      ],
      lastCorrected: new Date().toISOString()
    };
    
    // Apply corrections to meal data
    const updatedMealData = {
      ...meal,
      meal_name: corrections.mealName || meal.meal_name,
      calories: corrections.calories || meal.calories,
      protein: corrections.protein || meal.protein,
      fat: corrections.fat || meal.fat,
      carbs: corrections.carbs || meal.carbs,
      macronutrients: corrections.macronutrients || meal.macronutrients,
      micronutrients: corrections.micronutrients || meal.micronutrients,
      ingredients: corrections.ingredients || meal.ingredients,
      benefits: corrections.benefits || meal.benefits,
      concerns: corrections.concerns || meal.concerns,
      suggestions: corrections.suggestions || meal.suggestions,
      analysis: updatedMealAnalysis,
      updated_at: new Date().toISOString()
    };
    
    const { error: updateError } = await supabaseAdmin
      .from('meals')
      .update(updatedMealData)
      .eq('id', mealId);
    
    if (updateError) {
      console.error('Failed to update meal with corrections:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to save corrections'
      }, { status: 500 });
    }
    
    // Calculate accuracy improvement metrics
    const accuracyMetrics = calculateAccuracyImprovement(
      originalAnalysis,
      correctedAnalysis,
      learningProfile.learning_data
    );
    
    console.log('✅ User correction processed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Corrections saved and learning updated',
      correctionId: correctionEntry.timestamp,
      accuracyMetrics,
      learningStats: {
        totalCorrections: updatedLearningData.correction_count,
        correctionTypes: getCorrectionTypeStats(updatedLearningData.analysis_corrections),
        improvementAreas: identifyImprovementAreas(updatedLearningData.analysis_corrections)
      }
    });
    
  } catch (error) {
    console.error('Meal correction failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process correction',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to retrieve correction history
export async function GET(request: NextRequest) {
  try {
    const { createClient: createServerClient } = await import('../../lib/supabase/server');
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }
    
    const userId = session.user.id;
    const url = new URL(request.url);
    const mealId = url.searchParams.get('mealId');
    
    if (mealId) {
      // Get corrections for specific meal
      const { data: meal } = await supabaseAdmin
        .from('meals')
        .select('analysis')
        .eq('id', mealId)
        .eq('user_id', userId)
        .single();
      
      return NextResponse.json({
        success: true,
        corrections: meal?.analysis?.correctionHistory || []
      });
    } else {
      // Get user's correction history
      const { data: learningProfile } = await supabaseAdmin
        .from('user_learning_profile')
        .select('learning_data')
        .eq('user_id', userId)
        .single();
      
      return NextResponse.json({
        success: true,
        corrections: learningProfile?.learning_data?.analysis_corrections || [],
        stats: {
          totalCorrections: learningProfile?.learning_data?.correction_count || 0,
          correctionTypes: getCorrectionTypeStats(learningProfile?.learning_data?.analysis_corrections || []),
          improvementAreas: identifyImprovementAreas(learningProfile?.learning_data?.analysis_corrections || [])
        }
      });
    }
    
  } catch (error) {
    console.error('Failed to retrieve corrections:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve corrections'
    }, { status: 500 });
  }
}

function calculateAccuracyImprovement(original: any, corrected: any, learningData: any): any {
  const metrics = {
    calorieAccuracy: 0,
    foodIdentificationAccuracy: 0,
    portionAccuracy: 0,
    overallImprovement: 0
  };
  
  if (original && corrected) {
    // Calculate calorie accuracy
    if (original.calories && corrected.calories) {
      const calorieDiff = Math.abs(original.calories - corrected.calories);
      metrics.calorieAccuracy = Math.max(0, 1 - (calorieDiff / corrected.calories));
    }
    
    // Calculate food identification accuracy
    if (original.identifiedFoods && corrected.identifiedFoods) {
      const originalFoods = original.identifiedFoods.map((f: any) => f.name.toLowerCase());
      const correctedFoods = corrected.identifiedFoods.map((f: any) => f.name.toLowerCase());
      const matches = originalFoods.filter((food: string) => correctedFoods.includes(food));
      metrics.foodIdentificationAccuracy = matches.length / Math.max(correctedFoods.length, 1);
    }
    
    // Calculate overall improvement based on correction history
    const totalCorrections = learningData.correction_count || 0;
    if (totalCorrections > 0) {
      metrics.overallImprovement = Math.min(totalCorrections * 0.05, 0.5); // 5% improvement per correction, max 50%
    }
  }
  
  return metrics;
}

function getCorrectionTypeStats(corrections: any[]): any {
  const stats = {
    food_identification: 0,
    portion_size: 0,
    nutrition_values: 0,
    general: 0
  };
  
  corrections.forEach(correction => {
    const type = correction.correctionType || 'general';
    if (stats.hasOwnProperty(type)) {
      stats[type]++;
    } else {
      stats.general++;
    }
  });
  
  return stats;
}

function identifyImprovementAreas(corrections: any[]): string[] {
  const stats = getCorrectionTypeStats(corrections);
  const areas = [];
  
  if (stats.food_identification > 2) {
    areas.push('Food identification needs improvement');
  }
  
  if (stats.portion_size > 2) {
    areas.push('Portion size estimation needs refinement');
  }
  
  if (stats.nutrition_values > 2) {
    areas.push('Nutritional value calculations need adjustment');
  }
  
  if (corrections.length > 10) {
    areas.push('Overall analysis accuracy improving with user feedback');
  }
  
  return areas.length > 0 ? areas : ['Analysis accuracy is good'];
} 