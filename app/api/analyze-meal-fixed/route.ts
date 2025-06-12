import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('[analyze-meal-fixed] 🚀 Starting meal analysis...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const mealName = (formData.get('mealName') as string) || 'Analyzed Meal';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('[analyze-meal-fixed] File received:', file.name, file.type, file.size);

    // Convert file to base64 for OpenAI
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';
    const imageData = `data:${mimeType};base64,${base64}`;
    
    console.log('[analyze-meal-fixed] Image converted to base64, length:', imageData.length);

    // Upload to Supabase Storage
    const fileName = `fixed/${uuidv4()}.${file.type.split('/')[1] || 'jpg'}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('meal-images')
      .upload(fileName, arrayBuffer, { contentType: file.type });

    if (uploadError) {
      console.error('[analyze-meal-fixed] Upload failed:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('meal-images')
      .getPublicUrl(fileName);

    console.log('[analyze-meal-fixed] Image uploaded to:', publicUrl);

    // OpenAI Vision Analysis
    console.log('[analyze-meal-fixed] Starting OpenAI vision analysis...');
    
    let analysisResult: any;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a nutrition expert. Analyze food images and return comprehensive nutrition data in valid JSON format. Always respond with valid JSON only, no markdown or explanations."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this meal image and return nutrition data in this exact JSON format:
{
  "mealName": "descriptive name for this meal",
  "mealDescription": "what you see in the image",
  "calories": 400,
  "protein": 25,
  "carbs": 45,
  "fat": 15,
  "fiber": 6,
  "macronutrients": [
    {"name": "Protein", "amount": 25, "unit": "g", "percentDailyValue": 50},
    {"name": "Carbohydrates", "amount": 45, "unit": "g", "percentDailyValue": 15},
    {"name": "Total Fat", "amount": 15, "unit": "g", "percentDailyValue": 19},
    {"name": "Dietary Fiber", "amount": 6, "unit": "g", "percentDailyValue": 21},
    {"name": "Sodium", "amount": 300, "unit": "mg", "percentDailyValue": 13},
    {"name": "Sugar", "amount": 8, "unit": "g", "percentDailyValue": 16}
  ],
  "micronutrients": [
    {"name": "Vitamin C", "amount": 20, "unit": "mg", "percentDailyValue": 22},
    {"name": "Iron", "amount": 3, "unit": "mg", "percentDailyValue": 17},
    {"name": "Calcium", "amount": 120, "unit": "mg", "percentDailyValue": 12},
    {"name": "Potassium", "amount": 500, "unit": "mg", "percentDailyValue": 11},
    {"name": "Vitamin A", "amount": 200, "unit": "µg", "percentDailyValue": 22},
    {"name": "Vitamin D", "amount": 2, "unit": "µg", "percentDailyValue": 10},
    {"name": "Folate", "amount": 60, "unit": "µg", "percentDailyValue": 15},
    {"name": "Magnesium", "amount": 80, "unit": "mg", "percentDailyValue": 19}
  ],
  "foods": ["specific", "foods", "you", "identify"],
  "ingredients": ["main", "ingredients", "in", "meal"],
  "benefits": ["key health benefits"],
  "concerns": ["any nutritional concerns"],
  "suggestions": ["optimization tips"],
  "healthRating": 7
}

CRITICAL: Return ONLY valid JSON. No explanations, no markdown, just the JSON object.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData,
                  detail: "low"
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      });

      const responseText = completion.choices[0]?.message?.content;
      console.log('[analyze-meal-fixed] OpenAI response length:', responseText?.length);
      console.log('[analyze-meal-fixed] Response preview:', responseText?.substring(0, 100));

      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      let cleanedResponse = responseText.trim();
      
      // Remove markdown code blocks if present
      if (cleanedResponse.includes('```')) {
        cleanedResponse = cleanedResponse
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();
      }

      // Extract JSON from response
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
      }

      analysisResult = JSON.parse(cleanedResponse);
      console.log('[analyze-meal-fixed] ✅ Successfully parsed OpenAI response');
      console.log('[analyze-meal-fixed] Meal name from AI:', analysisResult.mealName);

    } catch (openaiError) {
      console.error('[analyze-meal-fixed] ❌ OpenAI failed:', openaiError);
      throw new Error(`OpenAI analysis failed: ${openaiError instanceof Error ? openaiError.message : 'Unknown error'}`);
    }

    // Save to database
    const mealId = uuidv4();
    const mealRecord = {
      id: mealId,
      user_id: '11111111-1111-1111-1111-111111111111', // Development user ID
      name: analysisResult.mealName,
      caption: analysisResult.mealName,
      meal_name: analysisResult.mealName,
      description: analysisResult.mealDescription,
      meal_type: 'analyzed',
      goal: 'General Wellness',
      image_url: publicUrl,
      calories: analysisResult.calories,
      protein: analysisResult.protein,
      fat: analysisResult.fat,
      carbs: analysisResult.carbs,
      macronutrients: analysisResult.macronutrients,
      micronutrients: analysisResult.micronutrients,
      ingredients: analysisResult.ingredients || [],
      foods_identified: analysisResult.foods || [],
      benefits: analysisResult.benefits || [],
      concerns: analysisResult.concerns || [],
      suggestions: analysisResult.suggestions || [],
      analysis: analysisResult,
      personalized_insights: 'Real AI analysis completed successfully.',
      tags: [],
      foods: analysisResult.foods || [],
      raw_analysis: analysisResult
    };

    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from('meals')
      .insert([mealRecord])
      .select('id')
      .single();

    if (insertError) {
      console.error('[analyze-meal-fixed] Database error:', insertError);
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
    }

    const actualMealId = insertedData?.id || mealId;

    console.log('[analyze-meal-fixed] 🎉 Analysis complete:', actualMealId);

    return NextResponse.json({
      success: true,
      mealId: actualMealId,
      id: actualMealId,
      mealName: analysisResult.mealName,
      name: analysisResult.mealName,
      description: analysisResult.mealDescription,
      calories: analysisResult.calories,
      macronutrients: analysisResult.macronutrients,
      micronutrients: analysisResult.micronutrients,
      imageUrl: publicUrl,
      analysis: analysisResult,
      message: 'Real AI analysis completed successfully'
    });

  } catch (error) {
    console.error('[analyze-meal-fixed] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Analysis failed',
      success: false
    }, { status: 500 });
  }
} 