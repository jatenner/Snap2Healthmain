import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import sharp from 'sharp';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Enhanced User Learning System for Adaptive Analysis
class AdaptiveAnalysisEngine {
  private userId: string;
  private supabase: any;

  constructor(userId: string, supabase: any) {
    this.userId = userId;
    this.supabase = supabase;
  }

  // Get user's dietary patterns and preferences
  async getUserLearningProfile() {
    const { data: profile } = await this.supabase
      .from('user_learning_profile')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (!profile) {
      // Create new learning profile
      const { data: newProfile } = await this.supabase
        .from('user_learning_profile')
        .insert({
          user_id: this.userId,
          dietary_preferences: {},
          health_goals: {},
          food_sensitivities: {},
          past_insights: {},
          learning_data: {
            analysis_corrections: [],
            preferred_foods: [],
            eating_patterns: {},
            accuracy_feedback: []
          }
        })
        .select()
        .single();
      return newProfile;
    }

    return profile;
  }

  // Analyze user's meal history to understand patterns
  async analyzeUserPatterns() {
    const { data: meals } = await this.supabase
      .from('meals')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!meals || meals.length === 0) {
      return {
        commonFoods: [],
        portionPreferences: {},
        cuisinePreferences: [],
        nutritionalPatterns: {},
        mealTimingPatterns: {}
      };
    }

    // Extract patterns from meal history
    const commonFoods = this.extractCommonFoods(meals);
    const portionPreferences = this.analyzePortionPreferences(meals);
    const cuisinePreferences = this.identifyCuisinePreferences(meals);
    const nutritionalPatterns = this.analyzeNutritionalPatterns(meals);
    const mealTimingPatterns = this.analyzeMealTiming(meals);

    return {
      commonFoods,
      portionPreferences,
      cuisinePreferences,
      nutritionalPatterns,
      mealTimingPatterns,
      totalMeals: meals.length
    };
  }

  private extractCommonFoods(meals: any[]) {
    const foodCounts = new Map();
    meals.forEach(meal => {
      if (meal.ingredients) {
        meal.ingredients.forEach((ingredient: string) => {
          const count = foodCounts.get(ingredient) || 0;
          foodCounts.set(ingredient, count + 1);
        });
      }
    });
    
    return Array.from(foodCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([food, count]) => ({ food, frequency: count }));
  }

  private analyzePortionPreferences(meals: any[]) {
    const portionData = meals.filter(meal => meal.calories > 0);
    if (portionData.length === 0) return {};

    const avgCalories = portionData.reduce((sum, meal) => sum + meal.calories, 0) / portionData.length;
    const avgProtein = portionData.reduce((sum, meal) => sum + (meal.protein || 0), 0) / portionData.length;
    const avgCarbs = portionData.reduce((sum, meal) => sum + (meal.carbs || 0), 0) / portionData.length;
    const avgFat = portionData.reduce((sum, meal) => sum + (meal.fat || 0), 0) / portionData.length;

    return {
      avgCalories: Math.round(avgCalories),
      avgProtein: Math.round(avgProtein),
      avgCarbs: Math.round(avgCarbs),
      avgFat: Math.round(avgFat),
      portionSize: avgCalories < 300 ? 'small' : avgCalories > 600 ? 'large' : 'medium'
    };
  }

  private identifyCuisinePreferences(meals: any[]) {
    const cuisineKeywords = {
      'Italian': ['pasta', 'pizza', 'tomato', 'basil', 'mozzarella', 'parmesan'],
      'Asian': ['rice', 'soy', 'ginger', 'sesame', 'noodles', 'tofu'],
      'Mexican': ['beans', 'avocado', 'cilantro', 'lime', 'peppers', 'salsa'],
      'Mediterranean': ['olive oil', 'feta', 'olives', 'hummus', 'quinoa', 'chickpeas'],
      'American': ['burger', 'fries', 'chicken', 'beef', 'cheese', 'bacon']
    };

    const cuisineScores = new Map();
    meals.forEach(meal => {
      if (meal.ingredients) {
        Object.entries(cuisineKeywords).forEach(([cuisine, keywords]) => {
          const matches = keywords.filter(keyword => 
            meal.ingredients.some((ingredient: string) => 
              ingredient.toLowerCase().includes(keyword.toLowerCase())
            )
          ).length;
          
          if (matches > 0) {
            cuisineScores.set(cuisine, (cuisineScores.get(cuisine) || 0) + matches);
          }
        });
      }
    });

    return Array.from(cuisineScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cuisine, score]) => ({ cuisine, preference: score }));
  }

  private analyzeNutritionalPatterns(meals: any[]) {
    const validMeals = meals.filter(meal => meal.calories > 0);
    if (validMeals.length === 0) return {};

    const totalCalories = validMeals.reduce((sum, meal) => sum + meal.calories, 0);
    const totalProtein = validMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
    const totalCarbs = validMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
    const totalFat = validMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0);

    return {
      dailyCalorieAvg: Math.round(totalCalories / validMeals.length),
      proteinPercentage: Math.round((totalProtein * 4 / totalCalories) * 100),
      carbPercentage: Math.round((totalCarbs * 4 / totalCalories) * 100),
      fatPercentage: Math.round((totalFat * 9 / totalCalories) * 100),
      macroBalance: this.categorizeMacroBalance(totalProtein, totalCarbs, totalFat, totalCalories)
    };
  }

  private categorizeMacroBalance(protein: number, carbs: number, fat: number, calories: number) {
    const proteinPercent = (protein * 4 / calories) * 100;
    const carbPercent = (carbs * 4 / calories) * 100;
    const fatPercent = (fat * 9 / calories) * 100;

    if (proteinPercent > 30) return 'high-protein';
    if (carbPercent > 55) return 'high-carb';
    if (fatPercent > 35) return 'high-fat';
    if (carbPercent < 30) return 'low-carb';
    return 'balanced';
  }

  private analyzeMealTiming(meals: any[]) {
    const mealTimes = meals.map(meal => {
      const date = new Date(meal.created_at);
      return {
        hour: date.getHours(),
        dayOfWeek: date.getDay(),
        meal
      };
    });

    const hourCounts = new Map();
    mealTimes.forEach(({ hour }) => {
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    const peakHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, count]) => ({ hour, frequency: count }));

    return {
      peakEatingHours: peakHours,
      mealFrequency: meals.length / 7, // meals per week
      preferredMealTimes: this.categorizeMealTimes(peakHours)
    };
  }

  private categorizeMealTimes(peakHours: any[]) {
    const categories = [];
    peakHours.forEach(({ hour }) => {
      if (hour >= 6 && hour <= 9) categories.push('early-breakfast');
      else if (hour >= 10 && hour <= 11) categories.push('late-breakfast');
      else if (hour >= 12 && hour <= 14) categories.push('lunch');
      else if (hour >= 15 && hour <= 17) categories.push('afternoon-snack');
      else if (hour >= 18 && hour <= 20) categories.push('dinner');
      else if (hour >= 21 && hour <= 23) categories.push('late-dinner');
      else categories.push('night-eating');
    });
    return [...new Set(categories)];
  }

  // Generate personalized analysis prompt based on user patterns
  async generatePersonalizedPrompt(userPatterns: any, userProfile: any) {
    const commonFoods = userPatterns.commonFoods.slice(0, 10).map((f: any) => f.food).join(', ');
    const cuisinePrefs = userPatterns.cuisinePreferences.map((c: any) => c.cuisine).join(', ');
    const macroBalance = userPatterns.nutritionalPatterns.macroBalance || 'balanced';
    const portionSize = userPatterns.portionPreferences.portionSize || 'medium';

    return `You are analyzing a meal for a user with specific dietary patterns. Use this personalized context:

USER DIETARY PROFILE:
- Common foods: ${commonFoods}
- Cuisine preferences: ${cuisinePrefs}
- Typical macro balance: ${macroBalance}
- Preferred portion size: ${portionSize}
- Average meal calories: ${userPatterns.portionPreferences.avgCalories || 400}
- Meal frequency: ${Math.round(userPatterns.mealTimingPatterns?.mealFrequency || 3)} meals per week

PERSONALIZED ANALYSIS INSTRUCTIONS:
1. Compare this meal to their typical eating patterns
2. Note if portion size aligns with their preferences (${portionSize} portions)
3. Consider their macro balance preference (${macroBalance})
4. Reference their common foods when making suggestions
5. Provide insights specific to their dietary history

ACCURACY FOCUS:
- Pay special attention to foods they commonly eat
- Use their typical portion sizes as reference points
- Consider their cuisine preferences for ingredient identification
- Factor in their macro balance preferences for nutritional analysis

Provide detailed, personalized analysis that reflects their unique dietary patterns.`;
  }

  // Learn from user corrections
  async learnFromCorrection(mealId: string, originalAnalysis: any, correctedAnalysis: any) {
    const profile = await this.getUserLearningProfile();
    
    const correction = {
      mealId,
      originalAnalysis,
      correctedAnalysis,
      timestamp: new Date().toISOString(),
      correctionType: this.identifyCorrectionType(originalAnalysis, correctedAnalysis)
    };

    const updatedLearningData = {
      ...profile.learning_data,
      analysis_corrections: [...(profile.learning_data.analysis_corrections || []), correction]
    };

    await this.supabase
      .from('user_learning_profile')
      .update({ 
        learning_data: updatedLearningData,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', this.userId);

    return correction;
  }

  private identifyCorrectionType(original: any, corrected: any) {
    const types = [];
    
    if (original.mealName !== corrected.mealName) types.push('meal_identification');
    if (Math.abs(original.calories - corrected.calories) > 50) types.push('calorie_estimation');
    if (original.ingredients?.length !== corrected.ingredients?.length) types.push('ingredient_identification');
    if (original.macronutrients?.length !== corrected.macronutrients?.length) types.push('nutrition_analysis');
    
    return types.length > 0 ? types : ['general_correction'];
  }
}

// Enhanced image preprocessing with multiple techniques
async function enhancedImagePreprocessing(buffer: Buffer): Promise<string[]> {
  try {
    const variations = [];
    
    // Original enhanced version
    const enhanced = await sharp(buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .normalize()
      .sharpen()
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();
    
    variations.push(`data:image/jpeg;base64,${enhanced.toString('base64')}`);
    
    // High contrast version for better food boundaries
    const highContrast = await sharp(buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .normalize()
      .linear(1.2, 0) // Increase contrast
      .sharpen()
      .jpeg({ quality: 90 })
      .toBuffer();
    
    variations.push(`data:image/jpeg;base64,${highContrast.toString('base64')}`);
    
    // Brightened version for dark images
    const brightened = await sharp(buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .modulate({ brightness: 1.1 })
      .normalize()
      .sharpen()
      .jpeg({ quality: 90 })
      .toBuffer();
    
    variations.push(`data:image/jpeg;base64,${brightened.toString('base64')}`);
    
    return variations;
  } catch (error) {
    console.error('Enhanced preprocessing failed:', error);
    const fallback = buffer.toString('base64');
    return [`data:image/jpeg;base64,${fallback}`];
  }
}

// Multi-validation analysis with confidence scoring
async function performAdaptiveAnalysis(
  imageVariations: string[], 
  userPatterns: any, 
  userProfile: any,
  adaptiveEngine: AdaptiveAnalysisEngine
): Promise<any> {
  const analyses = [];
  
  // Generate personalized prompt
  const personalizedPrompt = await adaptiveEngine.generatePersonalizedPrompt(userPatterns, userProfile);
  
  // Analyze with primary image and personalized prompt
  try {
    const primaryAnalysis = await analyzeWithPersonalizedPrompt(
      imageVariations[0], 
      personalizedPrompt, 
      userProfile
    );
    analyses.push({ ...primaryAnalysis, source: 'personalized', weight: 1.0 });
  } catch (error) {
    console.error('Personalized analysis failed:', error);
  }
  
  // Validation analysis with different image preprocessing
  if (imageVariations.length > 1) {
    try {
      const validationAnalysis = await analyzeWithPersonalizedPrompt(
        imageVariations[1], 
        personalizedPrompt, 
        userProfile
      );
      analyses.push({ ...validationAnalysis, source: 'validation', weight: 0.8 });
    } catch (error) {
      console.error('Validation analysis failed:', error);
    }
  }
  
  // Combine analyses with confidence scoring
  if (analyses.length === 0) {
    throw new Error('All adaptive analyses failed');
  }
  
  return combineAnalysesWithConfidence(analyses, userPatterns);
}

async function analyzeWithPersonalizedPrompt(
  base64Image: string, 
  personalizedPrompt: string, 
  userProfile: any
): Promise<any> {
  const enhancedPrompt = `${personalizedPrompt}

ANALYSIS REQUIREMENTS:
1. FOOD IDENTIFICATION: Identify each visible food item with confidence levels
2. PORTION ESTIMATION: Estimate portions using visual cues and user's typical portions
3. NUTRITIONAL CALCULATION: Calculate nutrition based on identified foods and user patterns
4. PERSONALIZED INSIGHTS: Compare to user's typical meals and preferences
5. CONFIDENCE SCORING: Rate confidence in each aspect of the analysis

USER CONTEXT:
- Age: ${userProfile.age || 25}
- Weight: ${userProfile.weight || 70}kg
- Activity: ${userProfile.activity_level || 'moderate'}
- Goal: ${userProfile.goal || 'general health'}

RESPONSE FORMAT (JSON only):
{
  "confidence": 0.85,
  "mealName": "descriptive name",
  "mealDescription": "detailed description",
  "identifiedFoods": [
    {
      "name": "food name",
      "confidence": 0.9,
      "estimatedPortion": "1 cup",
      "portionGrams": 150,
      "reasoning": "why this identification and portion"
    }
  ],
  "calories": total_calories,
  "macronutrients": [
    {"name": "Protein", "amount": 25, "unit": "g", "percentDailyValue": 50, "confidence": 0.8},
    {"name": "Total Carbohydrates", "amount": 45, "unit": "g", "percentDailyValue": 15, "confidence": 0.9},
    {"name": "Total Fat", "amount": 12, "unit": "g", "percentDailyValue": 18, "confidence": 0.7}
  ],
  "micronutrients": [
    {"name": "Vitamin C", "amount": 89, "unit": "mg", "percentDailyValue": 99, "confidence": 0.6}
  ],
  "personalizedInsights": {
    "comparisonToTypical": "how this compares to their usual meals",
    "portionAlignment": "how portion size compares to their preferences",
    "macroAlignment": "how macros align with their patterns",
    "recommendations": ["specific suggestions based on their history"]
  },
  "confidenceBreakdown": {
    "foodIdentification": 0.85,
    "portionEstimation": 0.75,
    "nutritionalAccuracy": 0.80,
    "personalizedRelevance": 0.90
  },
  "benefits": ["health benefits"],
  "concerns": ["nutritional concerns"],
  "suggestions": ["improvement suggestions"]
}

Analyze with maximum personalization and scientific precision.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a personalized nutrition AI that learns from user patterns. Provide accurate, personalized analysis in valid JSON format."
        },
        {
          role: "user",
          content: [
            { type: "text", text: enhancedPrompt },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 4000,
      temperature: 0.1,
    });

    const responseContent = completion.choices[0]?.message?.content || '';
    
    let jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.calories || !parsed.macronutrients) {
        throw new Error('Incomplete nutrition data from personalized AI');
      }
      
      return parsed;
    } else {
      throw new Error('No valid JSON found in personalized AI response');
    }
  } catch (error) {
    console.error('Personalized AI analysis failed:', error);
    throw error;
  }
}

function combineAnalysesWithConfidence(analyses: any[], userPatterns: any): any {
  const primary = analyses[0];
  const secondary = analyses[1];
  
  let combined = { ...primary };
  
  // Calculate overall confidence based on consistency
  if (secondary) {
    const calorieConsistency = Math.abs(primary.calories - secondary.calories) / primary.calories;
    const consistencyScore = 1 - Math.min(calorieConsistency, 0.5);
    
    combined.confidence = Math.min(
      (primary.confidence || 0.8) * consistencyScore,
      0.95
    );
    
    // Average calories if they're consistent
    if (calorieConsistency < 0.2) {
      combined.calories = Math.round((primary.calories + secondary.calories * 0.8) / 1.8);
    }
  }
  
  // Add adaptive insights
  combined.adaptiveInsights = {
    analysisMethod: 'personalized',
    userPatternAlignment: calculatePatternAlignment(combined, userPatterns),
    confidenceFactors: combined.confidenceBreakdown || {},
    improvementSuggestions: generateImprovementSuggestions(combined, userPatterns)
  };
  
  return combined;
}

function calculatePatternAlignment(analysis: any, userPatterns: any): any {
  const alignment = {
    portionSize: 'unknown',
    macroBalance: 'unknown',
    cuisineMatch: 'unknown',
    typicalness: 0
  };
  
  if (userPatterns.portionPreferences?.avgCalories) {
    const calorieDiff = Math.abs(analysis.calories - userPatterns.portionPreferences.avgCalories);
    const relativeDiff = calorieDiff / userPatterns.portionPreferences.avgCalories;
    
    if (relativeDiff < 0.2) alignment.portionSize = 'typical';
    else if (relativeDiff < 0.5) alignment.portionSize = 'somewhat-different';
    else alignment.portionSize = 'very-different';
  }
  
  // Calculate overall typicalness score
  alignment.typicalness = Math.max(0, 1 - (
    (alignment.portionSize === 'typical' ? 0 : 0.3) +
    (alignment.macroBalance === 'typical' ? 0 : 0.2) +
    (alignment.cuisineMatch === 'high' ? 0 : 0.1)
  ));
  
  return alignment;
}

function generateImprovementSuggestions(analysis: any, userPatterns: any): string[] {
  const suggestions = [];
  
  if (analysis.confidence < 0.7) {
    suggestions.push('Consider retaking the photo with better lighting for more accurate analysis');
  }
  
  if (analysis.adaptiveInsights?.userPatternAlignment?.portionSize === 'very-different') {
    suggestions.push('This portion size is quite different from your usual meals - consider if this aligns with your goals');
  }
  
  if (analysis.confidenceBreakdown?.foodIdentification < 0.7) {
    suggestions.push('Some foods were difficult to identify - you can correct the analysis to help improve future accuracy');
  }
  
  return suggestions;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧠 Adaptive meal analysis starting...');
    
    // Get user session
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
    
    // Initialize adaptive analysis engine
    const adaptiveEngine = new AdaptiveAnalysisEngine(userId, supabaseAdmin);
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mealName = (formData.get('mealName') as string) || 'Adaptive Analysis';
    const goal = (formData.get('goal') as string) || 'General Wellness';
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No image file provided'
      }, { status: 400 });
    }
    
    // Convert and preprocess image with multiple variations
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('📸 Creating multiple image variations for analysis...');
    const imageVariations = await enhancedImagePreprocessing(buffer);
    
    // Get user patterns and learning profile
    console.log('🔍 Analyzing user dietary patterns...');
    const userPatterns = await adaptiveEngine.analyzeUserPatterns();
    const userProfile = await adaptiveEngine.getUserLearningProfile();
    
    // Get user profile data
    const profileData = {
      age: parseInt(session.user.user_metadata?.age) || 25,
      weight: parseInt(session.user.user_metadata?.weight) || 70,
      activity_level: session.user.user_metadata?.activityLevel || 'moderate',
      goal: goal
    };
    
    console.log('🎯 Running adaptive AI analysis with personalization...');
    const analysisResult = await performAdaptiveAnalysis(
      imageVariations, 
      userPatterns, 
      profileData,
      adaptiveEngine
    );
    
    // Upload image to storage
    const timestamp = Date.now();
    const filename = `adaptive/${timestamp}-${file.name}`;
    
    const { data: uploadData } = await supabaseAdmin.storage
      .from('meal-images')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false
      });
    
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('meal-images')
      .getPublicUrl(filename);
    
    // Save adaptive analysis to database
    const mealRecord = {
      user_id: userId,
      meal_name: analysisResult.mealName || mealName,
      image_url: publicUrl,
      calories: analysisResult.calories,
      protein: analysisResult.macronutrients?.find((m: any) => m.name.toLowerCase().includes('protein'))?.amount || 0,
      fat: analysisResult.macronutrients?.find((m: any) => m.name.toLowerCase().includes('fat'))?.amount || 0,
      carbs: analysisResult.macronutrients?.find((m: any) => m.name.toLowerCase().includes('carb'))?.amount || 0,
      macronutrients: analysisResult.macronutrients || [],
      micronutrients: analysisResult.micronutrients || [],
      ingredients: analysisResult.identifiedFoods?.map((f: any) => f.name) || [],
      benefits: analysisResult.benefits || [],
      concerns: analysisResult.concerns || [],
      suggestions: analysisResult.suggestions || [],
      analysis: {
        ...analysisResult,
        analysisType: 'adaptive',
        userPatterns: userPatterns,
        adaptiveInsights: analysisResult.adaptiveInsights,
        processingNotes: 'Adaptive AI analysis with personalized learning'
      },
      goal: goal
    };
    
    const { data: savedMeal, error: saveError } = await supabaseAdmin
      .from('meals')
      .insert([mealRecord])
      .select()
      .single();
    
    if (saveError) {
      console.error('Failed to save adaptive analysis:', saveError);
      return NextResponse.json({
        success: false,
        error: 'Failed to save analysis'
      }, { status: 500 });
    }
    
    console.log('✅ Adaptive analysis completed successfully');
    
    return NextResponse.json({
      success: true,
      mealId: savedMeal.id,
      analysis: analysisResult,
      confidence: analysisResult.confidence,
      adaptiveInsights: analysisResult.adaptiveInsights,
      userPatterns: {
        totalMeals: userPatterns.totalMeals,
        commonFoods: userPatterns.commonFoods?.slice(0, 5),
        cuisinePreferences: userPatterns.cuisinePreferences,
        macroBalance: userPatterns.nutritionalPatterns?.macroBalance
      },
      processingNotes: 'Adaptive analysis with personalized learning and pattern recognition'
    });
    
  } catch (error) {
    console.error('Adaptive analysis failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Adaptive analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 