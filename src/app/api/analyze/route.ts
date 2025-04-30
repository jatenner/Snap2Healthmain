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
  
  try {
    // If imageSource is a File, we need to upload it first
    let imageUrl = null;
    if (typeof imageSource !== 'string') {
      try {
        // Upload the file and get the URL
        console.log('[analyzeMealAndSave] Uploading image file to storage...');
        const result = await processImage({
          file: imageSource as File,
          imageUrl: null,
          userId
        });
        imageUrl = result.uploadedImageUrl;
        console.log('[analyzeMealAndSave] Image uploaded successfully:', imageUrl);
      } catch (uploadError: any) {
        console.error('[analyzeMealAndSave] Error uploading image:', uploadError);
        // If upload fails, continue without image URL
      }
    } else {
      // If imageSource is already a string URL, use it directly
      imageUrl = imageSource;
    }
    
    // Generate the analysis using OpenAI
    const analysisResult = await analyzeMealImage(
      imageSource,
      goal
    );
    
    // If we should skip database saving (for auth bypass mode)
    if (skipDatabaseSave) {
      return {
        mealId,
        imageUrl,
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
            image_url: imageUrl,
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
        imageUrl,
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
        imageUrl,
        caption: analysisResult.caption || 'Analyzed meal',
        analysis: analysisResult.analysis,
        ingredients: analysisResult.ingredients || [],
        savedToDatabase: false,
        error: 'Failed to save to database, but analysis was successful'
      };
    }
  } catch (error) {
    console.error('[api/analyze] Analysis failed:', error);
    
    // Create a fallback result with the error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // If we can get an image URL, we'll return it so the frontend can still display something
    let imageUrl = null;
    if (typeof imageSource === 'string') {
      imageUrl = imageSource;
    }
    
    return {
      mealId,
      caption: `Analysis failed: ${errorMessage}`,
      imageUrl: imageUrl,
      analysis: {
        calories: 0,
        macronutrients: [
          { name: "Protein", amount: 0, unit: "g" },
          { name: "Carbohydrates", amount: 0, unit: "g" },
          { name: "Fat", amount: 0, unit: "g" }
        ],
        micronutrients: [],
        benefits: [],
        concerns: [],
        suggestions: ["The analysis failed. Please try again with a clearer image."]
      },
      ingredients: [],
      savedToDatabase: false,
      error: errorMessage
    };
  }
}

// Export the handler function for reuse in the app directory
export async function analyzeMealHandler(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    let imageUrl = formData.get('imageUrl') as string || null;
    const goal = formData.get('goal') as string || 'balanced';
    
    if (!imageFile && !imageUrl) {
      return createErrorResponse(new Error('No image provided'));
    }
    
    // Log what we received for debugging
    console.log('[analyze] Image file received:', !!imageFile, imageFile ? `(${imageFile.name}, ${imageFile.size} bytes)` : '');
    console.log('[analyze] Image URL received:', !!imageUrl, imageUrl ? `(${imageUrl.substring(0, 50)}...)` : '');
    
    // Check if we're in auth bypass mode
    const isAuthBypass = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true';
    let userId: string = 'test-user-bypass'; // Default for auth bypass
    
    // If not in auth bypass mode, get the real user ID
    if (!isAuthBypass) {
      const userIdResult = await getUserIdFromSession(request);
      
      if (!userIdResult || !userIdResult.userId) {
        return NextResponse.json({ message: 'Unauthorized - User not found' }, { status: 401 });
      }
      
      userId = userIdResult.userId;
    } else {
      // For auth bypass, we'll use a test user ID
      console.log('[analyze] Using bypass auth mode with test user ID');
    }

    // First, upload the file to get a static URL
    let uploadedImageUrl = null;
    
    // Handle file uploads
    if (imageFile) {
      try {
        console.log('[analyze] Uploading image file to server...');
        // Create a new FormData object for the upload
        const uploadFormData = new FormData();
        uploadFormData.append('file', imageFile);
        
        // Upload to our server-side API endpoint
        const uploadResponse = await fetch(new URL('/api/upload', request.url).toString(), {
          method: 'POST',
          body: uploadFormData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload image: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }
        
        const uploadResult = await uploadResponse.json();
        
        if (uploadResult.success && uploadResult.fileUrl) {
          uploadedImageUrl = uploadResult.fileUrl;
          console.log('[analyze] Image uploaded successfully:', uploadedImageUrl);
        } else {
          throw new Error(uploadResult.error || 'Failed to upload image');
        }
      } catch (uploadError: any) {
        console.error('[analyze] Error uploading image:', uploadError);
        return createErrorResponse(new Error(`Upload failed: ${uploadError.message}`));
      }
    } else if (imageUrl) {
      // If we have a URL already, check if it's a blob URL
      if (imageUrl.startsWith('blob:')) {
        return createErrorResponse(new Error('Blob URLs cannot be processed by the server. Please upload the file directly.'));
      }
      
      // Use the provided URL
      uploadedImageUrl = imageUrl;
    }
    
    if (!uploadedImageUrl) {
      return createErrorResponse(new Error('Failed to process image'));
    }
    
    try {
      // Use the uploaded URL for analysis
      const result = await analyzeMealAndSave({
        userId,
        imageSource: uploadedImageUrl,
        goal,
        skipDatabaseSave: isAuthBypass
      });
      
      // Create a unique ID for the meal
      const mealId = result.mealId || uuidv4();
      
      // If there was an analysis error, pass it through but don't return an error status
      if (result.error) {
        console.log('[analyze] Analysis completed with warning:', result.error);
      }
      
      // Create the response payload
      const responseJson = {
        success: true,
        mealId,
        mealContents: result.caption,
        analysisResult: result.analysis,
        imageUrl: uploadedImageUrl || result.imageUrl,
      };

      console.log("ANALYZE RESPONSE: Sending image URL:", uploadedImageUrl || result.imageUrl);

      // Return the analysis result
      return NextResponse.json(responseJson);
    } catch (analysisError: any) {
      console.error('[analyze] Unhandled analysis error:', analysisError);
      
      // Create a fallback response with the original image URL if available
      const fallbackImageUrl = uploadedImageUrl;
      
      // Return a parseable response with empty analysis data
      return NextResponse.json({
        mealId: uuidv4(),
        imageUrl: fallbackImageUrl,
        mealContents: "Analysis failed",
        analysisResult: {
          calories: 0,
          macronutrients: [
            { name: "Protein", amount: 0, unit: "g" },
            { name: "Carbohydrates", amount: 0, unit: "g" },
            { name: "Fat", amount: 0, unit: "g" }
          ],
          micronutrients: [],
          benefits: [],
          concerns: [],
          suggestions: ["The analysis failed. Please try again."]
        },
        ingredients: [],
        success: false,
        message: `Error: ${analysisError.message || 'Unknown error'}`
      }, { status: 200 }); // Using 200 status to ensure frontend can handle the response
    }
  } catch (error: any) {
    return createErrorResponse(error);
  }
}

// Export the POST handler that uses the analyzeMealHandler
export async function POST(request: NextRequest) {
  return analyzeMealHandler(request);
} 