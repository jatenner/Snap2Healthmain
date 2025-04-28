import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateVisionPrompt } from '../../../lib/gpt/visionPrompt';
import { generateNutritionPrompt } from '../../../lib/gpt/nutritionPrompt';
import { NutritionAnalysisSchema } from '../../../lib/gpt/validator';
import { supabase } from '../../../lib/supabaseClient';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { getUserIdFromSession } from '../../../lib/auth';
import { analyzeMealImage } from '../../../lib/openai';

// Set up OpenAI client if API key is available
const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Process and optionally upload image to storage
async function processImage({ file, imageUrl, userId }: { file: File | null, imageUrl: string | null, userId: string | null }) {
  if (!file && !imageUrl) {
    throw new Error('Either file or imageUrl must be provided');
  }
  
  // If we have a direct image URL, use it without uploading
  if (imageUrl) {
    return {
      uploadedImageUrl: imageUrl,
      imageSize: 0 // Size unknown for external URLs
    };
  }
  
  // If we have a file, upload it to Supabase storage
  if (file) {
    try {
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }
      
      if (!userId) {
        throw new Error('User ID is required for file uploads');
      }
      
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
      const fileExt = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      
      // CRITICAL: Match exact path format from the RLS policy
      // Format: users/[userId]/[filename]
      const filePath = `users/${userId}/${timestamp}-${randomId}.${fileExt}`;
      
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const { data, error } = await supabaseAdmin.storage
        .from('meal-images')
        .upload(filePath, buffer, {
          contentType: file.type,
          cacheControl: '3600',
          // CRITICAL: Include metadata that matches RLS policy expectations
          metadata: {
            user_id: userId,
            timestamp: timestamp.toString(),
            filename: file.name
          }
        });
      
      if (error) {
        console.error('[processImage] Error uploading to Supabase:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabaseAdmin.storage
        .from('meal-images')
        .getPublicUrl(data.path);
        
      return {
        uploadedImageUrl: publicUrlData.publicUrl,
        imageSize: file.size
      };
    } catch (error: any) {
      console.error('[processImage] Error processing file:', error);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }
  
  throw new Error('Image processing failed - no valid source');
}

// Analyze the image using OpenAI Vision and get nutritional data
async function analyzeImageWithOpenAI(imageUrl: string, goal: string) {
  if (!openai) {
    throw new Error('OpenAI API key is missing or invalid');
  }

  try {
    // Call Vision API to identify the food
    console.log('[analyzeImageWithOpenAI] Calling Vision API...');
    const visionResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_GPT_VISION || 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: generateVisionPrompt(goal) },
            { 
              type: 'image_url',
              image_url: { url: imageUrl }
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    });
    
    if (!visionResponse?.choices?.[0]?.message?.content) {
      throw new Error('Vision API returned no content');
    }
    
    const visionData = JSON.parse(visionResponse.choices[0].message.content);
    const caption = visionData.caption || 'Food image';
    const ingredients = visionData.ingredients || [];
    
    console.log('[analyzeImageWithOpenAI] Vision API identified:', caption);
    console.log('[analyzeImageWithOpenAI] Ingredients found:', ingredients.length);
    
    // Get nutrition data using the identified food and ingredients
    console.log('[analyzeImageWithOpenAI] Getting nutrition data...');
    const nutritionResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_GPT_TEXT || 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: generateNutritionPrompt(caption, ingredients, goal),
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });
    
    if (!nutritionResponse?.choices?.[0]?.message?.content) {
      throw new Error('Nutrition API returned no content');
    }
    
    const analysis = JSON.parse(nutritionResponse.choices[0].message.content);
    
    // Format the analysis data for display
    const formattedAnalysis = JSON.stringify({
      caption,
      ingredients,
      analysis: analysis,
      success: true,
      timestamp: new Date().toISOString()
    });
    
    return { analysis, formattedAnalysis };
  } catch (error: any) {
    console.error('[analyzeImageWithOpenAI] Analysis error:', error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

// Helper function to create an error response
function createErrorResponse(error: any) {
  console.error('[api/analyze] Error:', error);
  
  const status = error.status || 500;
  const message = error.message || 'An unexpected error occurred';
  
  return NextResponse.json(
    { error: message, success: false },
    { status }
  );
}

// Interface for the analyze function parameters
interface AnalyzeMealParams {
  userId: string;
  imageSource: File | string;
  goal: string;
  skipDatabaseSave?: boolean;
}

// Function to analyze a meal and save it to the database
async function analyzeMealAndSave({
  userId,
  imageSource,
  goal = 'balanced',
  skipDatabaseSave = false
}: AnalyzeMealParams) {
  // Generate a unique ID for this meal
  const mealId = uuidv4();
  
  // Generate the analysis using OpenAI
  const analysisResult = await analyzeMealImage(
    imageSource,
    goal
  );
  
  // If we should skip database saving (for auth bypass mode)
  if (skipDatabaseSave) {
    return {
      mealId,
      caption: analysisResult.caption || 'Analyzed meal',
      analysis: analysisResult.analysis,
      ingredients: analysisResult.ingredients || [],
      savedToDatabase: false
    };
  }
  
  // Otherwise save to the database
  try {
    // Insert the meal into the database
    const { data, error } = await supabase
      .from('meals')
      .insert([
        {
          id: mealId,
          user_id: userId,
          image_url: imageSource,
          caption: analysisResult.caption || 'Analyzed meal',
          analysis: analysisResult.analysis,
          ingredients: analysisResult.ingredients || [],
          goal
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('[api/analyze] Database error:', error);
      throw new Error('Failed to save meal to database');
    }
    
    return {
      mealId,
      caption: analysisResult.caption || 'Analyzed meal',
      analysis: analysisResult.analysis,
      ingredients: analysisResult.ingredients || [],
      savedToDatabase: true
    };
  } catch (error) {
    console.error('[api/analyze] Error saving to database:', error);
    
    // Even if database save fails, return the analysis
    return {
      mealId,
      caption: analysisResult.caption || 'Analyzed meal',
      analysis: analysisResult.analysis,
      ingredients: analysisResult.ingredients || [],
      savedToDatabase: false,
      error: 'Failed to save to database, but analysis was successful'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const imageUrl = formData.get('imageUrl') as string || null;
    const goal = formData.get('goal') as string || 'balanced';
    
    if (!imageFile && !imageUrl) {
      return createErrorResponse(new Error('No image provided'));
    }
    
    // Log what we received for debugging
    console.log('[analyze] Image file received:', !!imageFile, imageFile ? `(${imageFile.name}, ${imageFile.size} bytes)` : '');
    console.log('[analyze] Image URL received:', !!imageUrl, imageUrl ? `(${imageUrl.substring(0, 50)}...)` : '');
    
    // Check if we're in auth bypass mode
    const isAuthBypass = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true';
    let userId: string | null = null;
    
    // If not in auth bypass mode, get the real user ID
    if (!isAuthBypass) {
      const { userId: resolvedUserId } = await getUserIdFromSession(request);
      
      if (!resolvedUserId) {
        return NextResponse.json({ message: 'Unauthorized - User not found' }, { status: 401 });
      }
      
      userId = resolvedUserId;
    } else {
      // For auth bypass, we'll use a test user ID
      userId = 'test-user-bypass';
      console.log('[analyze] Using bypass auth mode with test user ID');
    }
    
    // Only use one source of image data - prioritize file over URL
    const imageSource = imageFile || imageUrl;
    
    if (!imageSource) {
      return createErrorResponse(new Error('Invalid image data'));
    }
    
    if (typeof imageUrl === 'string' && imageUrl.startsWith('blob:')) {
      return createErrorResponse(new Error('Blob URLs cannot be processed by the server. Please use a file upload.'));
    }
    
    const result = await analyzeMealAndSave({
      userId,
      imageSource,
      goal,
      skipDatabaseSave: isAuthBypass // Skip DB save in bypass mode
    });
    
    // Create a unique ID for the meal - we'll use this for localStorage in bypass mode
    // and for database reference in normal mode
    const mealId = result.mealId || uuidv4();
    
    // Return comprehensive data for the frontend
    return NextResponse.json({
      mealId,
      mealContents: result.caption,
      analysisResult: result.analysis,
      ingredients: result.ingredients || [],
      success: true,
      message: 'Analysis completed successfully'
    });
  } catch (error: any) {
    return createErrorResponse(error);
  }
} 