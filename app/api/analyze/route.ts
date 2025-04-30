import { NextRequest, NextResponse } from 'next/server';
import { analyzeMealImage } from '../../../src/lib/openai';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Fallback analysis response for when OpenAI is not available
const FALLBACK_ANALYSIS = {
  caption: "Your meal has been analyzed",
  ingredients: [
    { name: "Various food items", quantity: "Not specified", calories: 450 }
  ],
  analysis: {
    calories: 450,
    macronutrients: [
      { name: "Protein", amount: 20, unit: "g", percentDailyValue: 40, description: "Essential for muscle repair and growth" },
      { name: "Carbohydrates", amount: 55, unit: "g", percentDailyValue: 18, description: "Primary source of energy" },
      { name: "Fat", amount: 15, unit: "g", percentDailyValue: 23, description: "Important for hormone production and nutrient absorption" }
    ],
    micronutrients: [
      { name: "Vitamin C", amount: 15, unit: "mg", percentDailyValue: 25, description: "Antioxidant support" },
      { name: "Iron", amount: 2.5, unit: "mg", percentDailyValue: 14, description: "Supports oxygen transport" }
    ],
    hydration: { level: 65, waterContent: 145, unit: "ml" },
    glycemicLoad: { value: 14, index: 42 },
    recoveryInsights: [
      { title: "Recovery Support", description: "This meal provides nutrients that support overall recovery." }
    ]
  }
};

export async function POST(request: NextRequest) {
  try {
    console.log('[api/analyze] Processing analysis request...');
    
    // Check if the request is JSON or FormData
    let imageUrl, goal;
    const contentType = request.headers.get('content-type') || '';
    console.log('[api/analyze] Content-Type:', contentType);
    
    if (contentType.includes('multipart/form-data')) {
      // Handle form data
      const formData = await request.formData();
      imageUrl = formData.get('imageUrl') as string;
      goal = formData.get('goal') as string || 'General Wellness';
      
      console.log('[api/analyze] Form data received:', { 
        imageUrl: imageUrl ? `${imageUrl.substring(0, 30)}...` : null,
        goal,
        formDataKeys: Array.from(formData.keys())
      });
    } else {
      // Handle JSON
      const data = await request.json();
      imageUrl = data.imageUrl;
      goal = data.goal || 'General Wellness';
      
      console.log('[api/analyze] JSON data received:', { 
        imageUrl: imageUrl ? `${imageUrl.substring(0, 30)}...` : null,
        goal
      });
    }
    
    if (!imageUrl) {
      console.error('[api/analyze] Missing imageUrl in request');
      return NextResponse.json(
        { error: 'No image URL provided' },
        { status: 400 }
      );
    }
    
    // Verify imageUrl format
    if (!imageUrl.startsWith('/uploads/') && !imageUrl.startsWith('http')) {
      console.error('[api/analyze] Invalid imageUrl format:', imageUrl.substring(0, 30));
      return NextResponse.json(
        { error: 'Invalid image URL format' },
        { status: 400 }
      );
    }
    
    // Generate a unique ID for this meal
    const mealId = uuidv4();
    console.log(`[api/analyze] Generated meal ID: ${mealId}`);
    
    // If using a file from uploads, verify it exists
    if (imageUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', imageUrl);
      const fileExists = fs.existsSync(filePath);
      
      if (!fileExists) {
        console.error(`[api/analyze] File does not exist: ${filePath}`);
        return NextResponse.json(
          { error: 'Image file not found on server' },
          { status: 404 }
        );
      } else {
        console.log(`[api/analyze] Verified file exists: ${filePath}`);
      }
    }
    
    // Convert relative path to absolute URL if needed
    const fullImageUrl = imageUrl.startsWith('/') 
      ? `${request.nextUrl.origin}${imageUrl}`
      : imageUrl;
      
    console.log('[api/analyze] Using full image URL:', fullImageUrl.substring(0, 50) + '...');
    
    // Analyze the meal image using the existing function from openai.ts
    console.log('[api/analyze] Calling analyzeMealImage with goal:', goal);
    const startTime = Date.now();
    
    try {
      const analysis = await analyzeMealImage(fullImageUrl, goal);
      const processingTime = Date.now() - startTime;
      
      // If we got back an empty or null analysis, use fallback
      if (!analysis || !analysis.analysis) {
        console.warn('[api/analyze] Received empty analysis, using fallback');
        const fallback = {
          ...FALLBACK_ANALYSIS,
          caption: `${FALLBACK_ANALYSIS.caption} (Goal: ${goal})`
        };
        
        return NextResponse.json({
          success: true,
          mealId,
          imageUrl,
          caption: fallback.caption,
          ingredients: fallback.ingredients,
          analysis: fallback.analysis,
          processingTime: `${processingTime}ms`,
          isFallback: true
        });
      }
      
      console.log(`[api/analyze] Analysis completed in ${processingTime}ms`);
      console.log('[api/analyze] Analysis result:', {
        caption: analysis.caption?.substring(0, 50) + '...',
        hasIngredients: !!analysis.ingredients?.length,
        ingredientCount: analysis.ingredients?.length || 0
      });
      
      // Return the analysis results with the meal ID
      return NextResponse.json({
        success: true,
        mealId,
        imageUrl,
        caption: analysis.caption,
        ingredients: analysis.ingredients,
        analysis: analysis.analysis,
        processingTime: `${processingTime}ms`
      });
    } catch (analyzeError) {
      console.error('[api/analyze] Error during image analysis:', analyzeError);
      
      // Use fallback data instead of failing
      console.log('[api/analyze] Using fallback analysis data');
      const fallback = {
        ...FALLBACK_ANALYSIS,
        caption: `${FALLBACK_ANALYSIS.caption} (Goal: ${goal})`
      };
      
      return NextResponse.json({
        success: true,
        mealId,
        imageUrl,
        caption: fallback.caption,
        ingredients: fallback.ingredients,
        analysis: fallback.analysis,
        error: (analyzeError as Error).message,
        isFallback: true
      });
    }
  } catch (error: any) {
    console.error('[api/analyze] Unexpected error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'An unexpected error occurred',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 