import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { calculatePersonalizedDV } from '../../lib/profile-utils';
import { generateMealTags } from '../../lib/meal-tagger';
import { computeDailyNutritionSummary } from '../../lib/daily-summaries';
import { analyzeImageWithGPT } from '../../lib/meal-analysis/image-analyzer';
import { generateInsightsInBackground } from '../../lib/meal-analysis/background-insights';
import { validateNutritionEstimate } from '../../lib/nutrition-validation';
import { adjustFoodConfidence } from '../../lib/food-confidence';
import { SYSTEM_DEFAULT_PROFILE, getPersonalizationStatus } from '../../lib/personalization-status';
import { getUserTimezone, getCurrentHourInTimezone } from '../../lib/timezone-utils';
import { rateLimitResponse } from '../../lib/rate-limiter';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // --- Auth ---
    const { createClient: createServerClient } = await import('../../lib/supabase/server');
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // --- Rate limiting ---
    const rlResponse = rateLimitResponse(userId, 'analyzeMeal');
    if (rlResponse) return rlResponse;

    // --- Parse form data ---
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const mealName = (formData.get('mealName') as string) || 'Analyzed Meal';
    const goal = (formData.get('goal') as string) || session?.user?.user_metadata?.defaultGoal || 'General Wellness';

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large. Please try under 10MB.' }, { status: 400 });
    }

    // --- Convert to base64 + upload to storage ---
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || 'image/jpeg';
    const base64Image = `data:${mimeType};base64,${buffer.toString('base64')}`;

    let publicUrl: string;
    try {
      const filename = `meals/${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('meal-images')
        .upload(filename, buffer, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      publicUrl = supabaseAdmin.storage.from('meal-images').getPublicUrl(filename).data.publicUrl;
    } catch {
      publicUrl = base64Image; // fallback to data URL
    }

    // --- GPT-4o Vision analysis ---
    let analysisResult: any;
    let validationResult = { isValid: true, confidenceScore: 100, flags: [] as any[] };
    let personalizationStatus = getPersonalizationStatus(null);

    try {
      const analysisPromise = analyzeImageWithGPT(base64Image, { goal });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Analysis timeout')), 90000)
      );
      analysisResult = await Promise.race([analysisPromise, timeoutPromise]);

      // --- Validate nutrition estimates ---
      validationResult = validateNutritionEstimate(analysisResult);
      if (!validationResult.isValid) {
        return NextResponse.json({
          success: false,
          error: 'Nutrition analysis produced invalid results. Please try again or describe your meal manually.',
          validationFlags: validationResult.flags,
        }, { status: 422 });
      }

      // --- Food confidence adjustment ---
      const foodConf = adjustFoodConfidence({
        baseConfidence: validationResult.confidenceScore,
        mealName: analysisResult?.mealName,
        foods: analysisResult?.foods,
        ingredients: analysisResult?.ingredients,
        calories: analysisResult?.calories || 0,
        consumptionType: analysisResult?.consumptionType,
        macronutrients: analysisResult?.macronutrients,
      });
      validationResult.confidenceScore = foodConf.adjustedConfidence;

      // --- Personalized DV% calculation ---
      if (analysisResult && typeof analysisResult === 'object') {
        const meta = session?.user?.user_metadata || {};
        const profile = {
          age: parseInt(meta.age) || SYSTEM_DEFAULT_PROFILE.age,
          weight: parseInt(meta.weight) || SYSTEM_DEFAULT_PROFILE.weight,
          weight_unit: (meta.weight_unit || SYSTEM_DEFAULT_PROFILE.weight_unit) as 'lb' | 'kg',
          height: parseInt(meta.height) || SYSTEM_DEFAULT_PROFILE.height,
          height_unit: (meta.height_unit || SYSTEM_DEFAULT_PROFILE.height_unit) as 'in' | 'cm',
          gender: meta.gender || SYSTEM_DEFAULT_PROFILE.gender,
          activity_level: meta.activityLevel || SYSTEM_DEFAULT_PROFILE.activity_level,
          goal: meta.defaultGoal || goal || SYSTEM_DEFAULT_PROFILE.goal,
        };
        personalizationStatus = getPersonalizationStatus(meta);

        // Update DV% for macros and micros
        for (const arr of [analysisResult.macronutrients, analysisResult.micronutrients]) {
          if (Array.isArray(arr)) {
            for (const nutrient of arr) {
              nutrient.percentDailyValue = calculatePersonalizedDV(nutrient, profile);
            }
          }
        }
      }
    } catch (err: any) {
      const msg = (err.message || '').toLowerCase();
      let error = 'Meal analysis failed';
      if (msg.includes('rate limit')) error = 'Analysis system is busy. Try again shortly.';
      else if (msg.includes('timeout')) error = 'Analysis took too long. Try a smaller image.';
      else if (msg.includes('quota')) error = 'Analysis service quota exceeded.';
      return NextResponse.json({ success: false, error }, { status: 422 });
    }

    // --- Meal tagging (timezone-aware) ---
    const analysis = analysisResult as any;
    const mealTimeNow = new Date();
    const userTz = getUserTimezone(request.headers);
    const localHour = getCurrentHourInTimezone(userTz);
    const mealTimeLocal = new Date(mealTimeNow);
    mealTimeLocal.setUTCHours(localHour, mealTimeNow.getMinutes(), mealTimeNow.getSeconds());

    const mealTags = generateMealTags({
      calories: analysis?.calories || 0,
      protein: analysis?.protein || 0,
      carbs: analysis?.carbs || 0,
      fat: analysis?.fat || 0,
      macronutrients: analysis?.macronutrients,
      micronutrients: analysis?.micronutrients,
      mealTime: mealTimeLocal,
      ingredients: analysis?.ingredients,
      consumptionType: analysis?.consumptionType,
    });

    const consumptionTypeMap: Record<string, string> = {
      meal: 'meal', snack: 'snack', drink: 'drink', beverage: 'drink',
      alcohol: 'alcohol', supplement: 'supplement', hydration: 'hydration',
    };

    // --- Save to database ---
    const mealRecord: Record<string, any> = {
      user_id: userId,
      meal_name: analysis?.mealName || mealName,
      image_url: publicUrl,
      intake_type: consumptionTypeMap[analysis?.consumptionType] || 'meal',
      calories: analysis?.calories || 0,
      protein: analysis?.protein || 0,
      fat: analysis?.fat || 0,
      carbs: analysis?.carbs || 0,
      macronutrients: Array.isArray(analysis?.macronutrients) ? analysis.macronutrients : [],
      micronutrients: Array.isArray(analysis?.micronutrients) ? analysis.micronutrients : [],
      ingredients: Array.isArray(analysis?.ingredients) ? analysis.ingredients : [],
      benefits: Array.isArray(analysis?.benefits) ? analysis.benefits : [],
      concerns: Array.isArray(analysis?.concerns) ? analysis.concerns : [],
      suggestions: Array.isArray(analysis?.suggestions) ? analysis.suggestions : [],
      analysis: analysisResult || {},
      goal,
      meal_time: mealTimeNow.toISOString(),
      meal_tags: mealTags,
      confidence_score: validationResult.confidenceScore,
      validation_flags: validationResult.flags.length > 0 ? validationResult.flags : null,
    };

    let actualMealId = uuidv4();
    let dbSaveSuccessful = false;

    try {
      const { data, error } = await supabaseAdmin
        .from('meals')
        .insert([mealRecord])
        .select('id')
        .single();

      if (!error && data?.id) {
        actualMealId = data.id;
        dbSaveSuccessful = true;
      }
    } catch {
      // DB save failed — keep the generated ID
    }

    // --- Background tasks (fire-and-forget) ---
    if (dbSaveSuccessful) {
      generateInsightsInBackground(actualMealId, userId, session?.user?.user_metadata || {}, analysis)
        .catch(() => {});
      const localDate = mealTimeNow.toLocaleDateString('en-CA', { timeZone: userTz });
      computeDailyNutritionSummary(userId, localDate, null, userTz)
        .catch(() => {});
    }

    // --- Response ---
    return NextResponse.json({
      success: true,
      mealId: actualMealId,
      id: actualMealId,
      name: analysis?.mealName || mealName,
      calories: analysis?.calories || 0,
      imageUrl: publicUrl,
      image_url: publicUrl,
      foods_identified: analysis?.foods || [],
      ingredients: analysis?.ingredients || [],
      analysis: analysisResult,
      macronutrients: analysis?.macronutrients || [],
      micronutrients: analysis?.micronutrients || [],
      benefits: analysis?.benefits || [],
      concerns: analysis?.concerns || [],
      suggestions: analysis?.suggestions || [],
      meal_description: analysis?.mealDescription || '',
      foods: analysis?.foods || [],
      goal,
      _nutritionSource: 'ai_estimate',
      _insightsSource: 'ai_interpretation',
      confidenceScore: validationResult.confidenceScore,
      validationFlags: validationResult.flags.length > 0 ? validationResult.flags : undefined,
      personalizationStatus,
    });

  } catch (error) {
    const { trackError } = await import('../../lib/error-tracking');
    trackError(error, 'high', { route: '/api/analyze-meal', action: 'meal_analysis' });
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred during meal analysis',
    }, { status: 500 });
  }
}
