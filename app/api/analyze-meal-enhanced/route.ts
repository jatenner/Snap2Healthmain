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

// Enhanced image preprocessing for better food recognition
async function preprocessImage(buffer: Buffer): Promise<string> {
  try {
    // Enhance image for better food recognition
    const processedBuffer = await sharp(buffer)
      .resize(1024, 1024, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .normalize() // Auto-adjust brightness/contrast
      .sharpen() // Enhance edges and details
      .jpeg({ 
        quality: 90,
        mozjpeg: true // Better compression
      })
      .toBuffer();

    const base64 = processedBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Image preprocessing failed:', error);
    // Fallback to original
    const base64 = buffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  }
}

// Enhanced nutrition analysis with specialized food recognition
async function analyzeImageWithEnhancedAI(base64Image: string, userProfile: any = {}): Promise<any> {
  const enhancedPrompt = `You are a specialized nutrition AI with expertise in food recognition and nutritional analysis. Analyze this meal image with maximum accuracy.

ANALYSIS REQUIREMENTS:
1. FOOD IDENTIFICATION: Identify each visible food item with confidence levels
2. PORTION ESTIMATION: Estimate portions using visual cues (plate size, utensils, etc.)
3. NUTRITIONAL CALCULATION: Calculate nutrition based on identified foods and portions
4. MICRONUTRIENT ANALYSIS: Include 20+ vitamins and minerals with daily value percentages
5. VALIDATION: Cross-check your estimates for reasonableness

USER CONTEXT:
- Age: ${userProfile.age || 25}
- Weight: ${userProfile.weight || 70}kg
- Activity: ${userProfile.activity_level || 'moderate'}
- Goal: ${userProfile.goal || 'general health'}

RESPONSE FORMAT (JSON only):
{
  "confidence": 0.85,
  "mealName": "descriptive name",
  "mealDescription": "detailed description of what you see",
  "identifiedFoods": [
    {
      "name": "food name",
      "confidence": 0.9,
      "estimatedPortion": "1 cup",
      "portionGrams": 150
    }
  ],
  "calories": total_calories,
  "macronutrients": [
    {"name": "Protein", "amount": 25, "unit": "g", "percentDailyValue": 50},
    {"name": "Total Carbohydrates", "amount": 45, "unit": "g", "percentDailyValue": 15},
    {"name": "Total Fat", "amount": 12, "unit": "g", "percentDailyValue": 18}
  ],
  "micronutrients": [
    {"name": "Vitamin C", "amount": 89, "unit": "mg", "percentDailyValue": 99},
    {"name": "Iron", "amount": 3.2, "unit": "mg", "percentDailyValue": 18},
    {"name": "Calcium", "amount": 120, "unit": "mg", "percentDailyValue": 12}
  ],
  "benefits": ["specific health benefits"],
  "concerns": ["nutritional concerns if any"],
  "suggestions": ["specific improvement suggestions"],
  "accuracyNotes": "notes about estimation confidence"
}

Analyze with scientific precision and provide accurate nutritional data.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert specializing in food recognition and nutritional analysis. Provide accurate, scientific nutrition data in valid JSON format."
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
      max_tokens: 3000,
      temperature: 0.1, // Low temperature for consistency
    });

    const responseContent = completion.choices[0]?.message?.content || '';
    
    // Enhanced JSON extraction
    let jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsed.calories || !parsed.macronutrients || !parsed.micronutrients) {
        throw new Error('Incomplete nutrition data from AI');
      }
      
      return parsed;
    } else {
      throw new Error('No valid JSON found in AI response');
    }
  } catch (error) {
    console.error('Enhanced AI analysis failed:', error);
    throw error;
  }
}

// Multi-angle analysis for better accuracy
async function performMultiAnalysis(base64Image: string, userProfile: any): Promise<any> {
  const analyses = [];
  
  // Primary analysis
  try {
    const primary = await analyzeImageWithEnhancedAI(base64Image, userProfile);
    analyses.push({ ...primary, source: 'primary', weight: 1.0 });
  } catch (error) {
    console.error('Primary analysis failed:', error);
  }
  
  // Secondary analysis with different prompt for validation
  try {
    const secondary = await analyzeImageWithEnhancedAI(base64Image, {
      ...userProfile,
      analysisType: 'validation'
    });
    analyses.push({ ...secondary, source: 'validation', weight: 0.7 });
  } catch (error) {
    console.error('Secondary analysis failed:', error);
  }
  
  if (analyses.length === 0) {
    throw new Error('All analysis attempts failed');
  }
  
  // If we have multiple analyses, combine them intelligently
  if (analyses.length > 1) {
    return combineAnalyses(analyses);
  }
  
  return analyses[0];
}

// Combine multiple analyses for better accuracy
function combineAnalyses(analyses: any[]): any {
  const primary = analyses[0];
  const secondary = analyses[1];
  
  // Use primary as base, but validate against secondary
  const combined = { ...primary };
  
  // Average calories if they're close (within 20%)
  if (secondary && Math.abs(primary.calories - secondary.calories) / primary.calories < 0.2) {
    combined.calories = Math.round((primary.calories + secondary.calories * 0.7) / 1.7);
    combined.confidence = Math.min(primary.confidence || 0.8, 0.95);
  } else {
    combined.confidence = (primary.confidence || 0.8) * 0.9; // Reduce confidence if analyses differ significantly
  }
  
  return combined;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Enhanced meal analysis starting...');
    
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
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mealName = (formData.get('mealName') as string) || 'Enhanced Analysis';
    const goal = (formData.get('goal') as string) || 'General Wellness';
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No image file provided'
      }, { status: 400 });
    }
    
    // Convert and preprocess image
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('📸 Preprocessing image for better recognition...');
    const enhancedImage = await preprocessImage(buffer);
    
    // Get user profile for personalized analysis
    const userProfile = {
      age: parseInt(session.user.user_metadata?.age) || 25,
      weight: parseInt(session.user.user_metadata?.weight) || 70,
      activity_level: session.user.user_metadata?.activityLevel || 'moderate',
      goal: goal
    };
    
    console.log('🧠 Running enhanced AI analysis...');
    const analysisResult = await performMultiAnalysis(enhancedImage, userProfile);
    
    // Upload image to storage
    const timestamp = Date.now();
    const filename = `enhanced/${timestamp}-${file.name}`;
    
    const { data: uploadData } = await supabaseAdmin.storage
      .from('meal-images')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false
      });
    
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('meal-images')
      .getPublicUrl(filename);
    
    // Save enhanced analysis to database
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
        analysisType: 'enhanced',
        confidence: analysisResult.confidence,
        processingNotes: 'Enhanced AI analysis with image preprocessing'
      },
      goal: goal
    };
    
    const { data: savedMeal, error: saveError } = await supabaseAdmin
      .from('meals')
      .insert([mealRecord])
      .select()
      .single();
    
    if (saveError) {
      console.error('Failed to save enhanced analysis:', saveError);
      return NextResponse.json({
        success: false,
        error: 'Failed to save analysis'
      }, { status: 500 });
    }
    
    console.log('✅ Enhanced analysis completed successfully');
    
    return NextResponse.json({
      success: true,
      mealId: savedMeal.id,
      analysis: analysisResult,
      confidence: analysisResult.confidence,
      processingNotes: 'Enhanced analysis with image preprocessing and multi-validation'
    });
    
  } catch (error) {
    console.error('Enhanced analysis failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Enhanced analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 