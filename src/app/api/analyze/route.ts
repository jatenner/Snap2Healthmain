import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateVisionPrompt } from '../../../lib/gpt/visionPrompt';
import { generateNutritionPrompt } from '../../../lib/gpt/nutritionPrompt';
import { NutritionAnalysisSchema } from '../../../lib/gpt/validator';
import { supabase } from '../../../lib/supabaseClient';

// Check for OpenAI API key
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.error('OPENAI_API_KEY is missing in .env.local');
  throw new Error('Missing OpenAI API Key environment variable');
}

// Initialize OpenAI client with proper error handling
const openai = new OpenAI({
  apiKey: openaiApiKey,
});

// Function to ensure the meals table exists
async function ensureMealsTableExists() {
  console.log("Checking and creating meals table if needed");
  try {
    // First check if the table exists
    const { error: checkError } = await supabase
      .from('meals')
      .select('id')
      .limit(1);
      
    if (checkError && checkError.message.includes('does not exist')) {
      console.log("Meals table does not exist. You'll need to create it in the Supabase dashboard");
      console.log("Required table structure:");
      console.log(`
        CREATE TABLE public.meals (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id),
          goal TEXT,
          image_url TEXT,
          caption TEXT,
          analysis JSONB,
          created_at TIMESTAMPTZ DEFAULT now()
        );
        
        -- Enable row level security
        ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
        
        -- Create access policies
        CREATE POLICY "Users can view their own meals"
          ON public.meals
          FOR SELECT
          USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert their own meals"
          ON public.meals
          FOR INSERT
          WITH CHECK (auth.uid() = user_id);
      `);
      
      // As a fallback, try creating a simplified version of the table using the REST API
      try {
        console.log("Attempting to create a basic version of the meals table");
        // We can't directly run SQL using the JavaScript client, so we'll try with a REST POST
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/meals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            table_name: 'meals',
            definition: {
              id: 'uuid primary key default uuid_generate_v4()',
              user_id: 'uuid',
              goal: 'text',
              image_url: 'text',
              caption: 'text',
              analysis: 'jsonb',
              created_at: 'timestamptz default now()'
            }
          })
        });
        
        if (response.ok) {
          console.log("Successfully created meals table via REST API");
          return true;
        } else {
          const errorData = await response.json();
          console.error("Failed to create meals table via REST API:", errorData);
          return false;
        }
      } catch (apiError) {
        console.error("Error creating table via API:", apiError);
        return false;
      }
    } else if (checkError) {
      console.error("Error checking for meals table:", checkError);
      return false;
    } else {
      console.log("Meals table already exists");
      return true;
    }
  } catch (error) {
    console.error("Error in ensureMealsTableExists:", error);
    return false;
  }
}

// Helper function to create user-friendly error responses
const createErrorResponse = (error: any) => {
  console.error('Analysis error:', error);
  
  // Determine the type of error and return an appropriate response
  if (error.code === 'invalid_api_key') {
    return NextResponse.json(
      { 
        error: 'OpenAI API key is invalid or expired. Please contact support.',
        errorType: 'api_key',
        details: 'The application cannot connect to the AI service due to authentication issues. Please contact support@snap2health.com for assistance.'
      },
      { status: 401 }
    );
  } else if (error.type === 'invalid_request_error') {
    return NextResponse.json(
      { 
        error: 'There was a problem with the request to the AI service.',
        errorType: 'request_error',
        details: error.message
      },
      { status: 400 }
    );
  } else if (error.type === 'rate_limit_error') {
    return NextResponse.json(
      { 
        error: 'You\'ve reached the limit of AI requests. Please try again in a few minutes.',
        errorType: 'rate_limit',
        details: 'Too many requests in a short period of time. This is temporary and will resolve itself shortly.'
      },
      { status: 429 }
    );
  } else if (error.code === 'model_not_found') {
    return NextResponse.json(
      { 
        error: 'The AI model is currently unavailable. Please try again later.',
        errorType: 'model_error',
        details: 'The requested AI model could not be accessed. This may be a temporary issue.'
      },
      { status: 503 }
    );
  } else {
    // Default error response for unexpected errors
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while analyzing your meal.',
        errorType: 'server_error',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// Updated interface for sanitized analysis data with optional fields
interface SanitizedAnalysis {
  calories: number;
  macronutrients: Array<{
    name: string;
    amount: number;
    unit: string;
    percentDailyValue?: number | null;
    description?: string;
  }>;
  micronutrients: Array<{
    name: string;
    amount: number;
    unit: string;
    percentDailyValue?: number | null;
    description?: string;
  }>;
  benefits?: string[];
  concerns?: string[];
  suggestions?: string[];
  error?: string;
  validationError?: string;
  [key: string]: any; // Allow additional properties
}

// Helper function to create a default nutrient object
function createDefaultNutrient(name: string = ''): any {
  return {
    name: String(name || ''),
    amount: 0,
    unit: 'g',
    percentDailyValue: null,
    description: ''
  };
}

// Helper function to sanitize analysis data for database storage
function sanitizeAnalysisData(analysis: any): SanitizedAnalysis {
  if (!analysis || typeof analysis !== 'object') {
    return {
      calories: 0,
      macronutrients: [],
      micronutrients: []
    };
  }
  
  try {
    // Create a clean copy with only the fields we know are safe
    const sanitized: SanitizedAnalysis = {
      calories: typeof analysis.calories === 'number' ? analysis.calories : 0,
      macronutrients: Array.isArray(analysis.macronutrients) ? 
        analysis.macronutrients.map(m => ({
          name: String(m.name || ''),
          amount: typeof m.amount === 'number' ? m.amount : 0,
          unit: String(m.unit || ''),
          percentDailyValue: typeof m.percentDailyValue === 'number' ? m.percentDailyValue : null,
          description: String(m.description || '')
        })) : [],
      micronutrients: Array.isArray(analysis.micronutrients) ? 
        analysis.micronutrients.map(m => ({
          name: String(m.name || ''),
          amount: typeof m.amount === 'number' ? m.amount : 0,
          unit: String(m.unit || ''),
          percentDailyValue: typeof m.percentDailyValue === 'number' ? m.percentDailyValue : null,
          description: String(m.description || '')
        })) : []
    };
    
    // Optionally add other safe fields if they exist
    if (Array.isArray(analysis.benefits)) {
      sanitized.benefits = analysis.benefits.map(b => String(b || '')).slice(0, 10);
    }
    
    if (Array.isArray(analysis.concerns)) {
      sanitized.concerns = analysis.concerns.map(c => String(c || '')).slice(0, 10);
    }
    
    if (Array.isArray(analysis.suggestions)) {
      sanitized.suggestions = analysis.suggestions.map(s => String(s || '')).slice(0, 10);
    }
    
    // Add error fields if they exist
    if (analysis.error) {
      sanitized.error = String(analysis.error);
    }
    
    if (analysis.validationError) {
      sanitized.validationError = String(analysis.validationError);
    }
    
    // Test JSON stringify to ensure serialization works
    JSON.stringify(sanitized);
    
    return sanitized;
  } catch (error) {
    console.error('Error sanitizing analysis data:', error);
    // Return a minimal valid object
    return {
      calories: 0,
      macronutrients: [],
      micronutrients: []
    };
  }
}

// Function to save meal data to the database
async function saveMealToDatabase({
  userId,
  goal,
  caption,
  ingredients,
  analysis,
  imageUrl,
  formattedAnalysis,
}: {
  userId: string;
  goal: string;
  caption: string;
  ingredients: string[];
  analysis: any;
  imageUrl: string;
  formattedAnalysis?: string;
}): Promise<{ mealId: string; success: boolean }> {
  let mealId = '';
  let success = false;

  try {
    console.log(`[saveMealToDatabase] Attempting to save meal data for user ${userId}`);
    
    // Ensure we have a properly formatted analysis for storage
    // If we have a formattedAnalysis string, use that directly
    // Otherwise, prepare the analysis object for database storage
    let analysisToStore;
    
    if (formattedAnalysis) {
      // If we already have a formatted analysis string, use it directly
      analysisToStore = formattedAnalysis;
    } else if (typeof analysis === 'string') {
      // If analysis is already a string, validate that it's valid JSON
      try {
        JSON.parse(analysis); // Just to validate
        analysisToStore = analysis;
      } catch (e) {
        // If not valid JSON, create a new JSON string
        analysisToStore = JSON.stringify({
          caption,
          ingredients,
          analysis: {
            calories: 0,
            macronutrients: [],
            micronutrients: []
          },
          success: false,
          error: "Invalid analysis JSON string"
        });
      }
    } else {
      // Otherwise convert the analysis object to JSON string
      analysisToStore = JSON.stringify({
        caption,
        ingredients,
        analysis,
        success: true
      });
    }
    
    console.log(`[saveMealToDatabase] Saving to database with analysis length: ${analysisToStore.length}`);

    // Insert the meal into the database
    const { data, error } = await supabase
      .from('meals')
      .insert({
        user_id: userId,
        goal: goal || 'General Wellness',
        image_url: imageUrl,
        caption: caption || '',
        analysis: analysisToStore,
        created_at: new Date().toISOString(),
      })
      .select('id');

    if (error) {
      console.error('[saveMealToDatabase] Error saving meal to database:', error);
      
      // If the analysis is too large, try saving with a truncated version
      if (analysisToStore.length > 10000) {
        console.log('[saveMealToDatabase] Analysis may be too large, trying with truncated version');
        
        const truncatedAnalysis = JSON.stringify({
          caption,
          ingredients: ingredients.slice(0, 20), // Limit ingredients
          analysis: {
            summary: analysis.summary || "Analysis summary unavailable",
            // Include only essential parts of the analysis
            nutrition: analysis.nutrition || {},
            healthScore: analysis.healthScore || 0,
            recommendations: (analysis.recommendations || []).slice(0, 5),
          },
          success: true,
          truncated: true
        });
        
        const { data: retryData, error: retryError } = await supabase
          .from('meals')
          .insert({
            user_id: userId,
            goal: goal || 'General Wellness',
            image_url: imageUrl,
            caption: caption || '',
            analysis: truncatedAnalysis,
            created_at: new Date().toISOString(),
          })
          .select('id');
        
        if (retryError) {
          console.error('[saveMealToDatabase] Error saving meal with truncated analysis:', retryError);
        } else {
          mealId = retryData?.[0]?.id || '';
          success = true;
          console.log(`[saveMealToDatabase] Successfully saved meal with truncated analysis. Meal ID: ${mealId}`);
        }
      }
    } else {
      mealId = data?.[0]?.id || '';
      success = true;
      console.log(`[saveMealToDatabase] Successfully saved meal to database. Meal ID: ${mealId}`);
    }
  } catch (error) {
    console.error('[saveMealToDatabase] Unexpected error saving meal:', error);
    
    // Last resort - save minimal data
    try {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('meals')
        .insert({
          user_id: userId,
          goal: goal || 'General Wellness',
          image_url: imageUrl,
          caption: caption || '',
          analysis: JSON.stringify({ 
            caption, 
            error: "Failed to save complete analysis",
            success: false
          }),
          created_at: new Date().toISOString(),
        })
        .select('id');
      
      if (!fallbackError) {
        mealId = fallbackData?.[0]?.id || '';
        success = true;
        console.log(`[saveMealToDatabase] Saved minimal meal data as fallback. Meal ID: ${mealId}`);
      }
    } catch (finalError) {
      console.error('[saveMealToDatabase] Final attempt to save meal failed:', finalError);
    }
  }

  return { mealId, success };
}

// Function to analyze a meal and save the results
export async function analyzeMealAndSave({
  userId,
  file,
  imageUrl,
  goal = "General Wellness",
}: {
  userId: string;
  file?: File;
  imageUrl?: string;
  goal?: string;
}) {
  try {
    console.log('[analyzeMealAndSave] Starting meal analysis');
    console.log('- User ID:', userId || 'None');
    console.log('- Image file:', file ? `File object (${file.size} bytes)` : 'None');
    console.log('- Image URL:', imageUrl || 'None');
    console.log('- Goal:', goal);

    // Validate inputs
    if (!file && !imageUrl) {
      console.error('[analyzeMealAndSave] No image source provided');
      throw new Error('Please provide a food image file or URL');
    }

    if (!userId) {
      console.warn('[analyzeMealAndSave] No user ID provided - analysis will be performed but not saved');
    }
    
    let caption = "My meal";
    let ingredients: any[] = [];
    let analysis: any = {
      calories: 0,
      macronutrients: [],
      micronutrients: []
    };
    
    // Only attempt AI analysis if OpenAI API key is available
    if (openaiApiKey) {
      try {
        // Convert image for Vision API
        let imageContent;
        if (file) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Image = buffer.toString('base64');
            imageContent = {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            };
            console.log('[analyzeMealAndSave] Successfully converted file to base64 for analysis');
          } catch (e) {
            console.error('[analyzeMealAndSave] Error converting image file:', e);
            throw new Error('Failed to process image file');
          }
        } else if (imageUrl) {
          // Validate URL format
          try {
            new URL(imageUrl);
            imageContent = {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            };
            console.log('[analyzeMealAndSave] Using image URL for analysis');
          } catch (e) {
            console.error('[analyzeMealAndSave] Invalid image URL format:', e);
            throw new Error('Invalid image URL format');
          }
        } else {
          throw new Error('No image source available');
        }

        // Call Vision API
        try {
          console.log('[analyzeMealAndSave] Calling Vision API...');
          const visionResponse = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL_GPT_VISION || 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: generateVisionPrompt(goal) },
                  imageContent,
                ],
              },
            ],
            response_format: { type: 'json_object' },
          });
          
          if (visionResponse?.choices?.[0]?.message?.content) {
            try {
              const visionData = JSON.parse(visionResponse.choices[0].message.content);
              caption = visionData.caption || caption;
              ingredients = visionData.ingredients || [];
              console.log('[analyzeMealAndSave] Vision API identified:', caption);
              console.log('[analyzeMealAndSave] Ingredients found:', ingredients.length);
              
              // Get nutrition data
              console.log('[analyzeMealAndSave] Getting nutrition data...');
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
              
              if (nutritionResponse?.choices?.[0]?.message?.content) {
                try {
                  const nutritionData = JSON.parse(nutritionResponse.choices[0].message.content);
                  analysis = nutritionData;
                  console.log('[analyzeMealAndSave] Successfully parsed nutrition data');
                } catch (e) {
                  console.error('[analyzeMealAndSave] Error parsing nutrition response:', e);
                }
              }
            } catch (e) {
              console.error('[analyzeMealAndSave] Error parsing vision response:', e);
            }
          }
        } catch (e) {
          console.error('[analyzeMealAndSave] OpenAI API error:', e);
        }
      } catch (e) {
        console.error('[analyzeMealAndSave] Analysis error:', e);
      }
    }

    // Save to database if we have a user ID
    let mealId = '';
    let savedToDb = false;
    
    if (userId) {
      // If we have an image URL, use it directly
      // Otherwise, we'd need to upload the file first (not done in this code segment)
      const finalImageUrl = imageUrl || '';
      
      const saveResult = await saveMealToDatabase({
        userId,
        goal,
        caption,
        ingredients,
        analysis: analysis,
        imageUrl: finalImageUrl,
        formattedAnalysis: JSON.stringify({
          caption,
          ingredients,
          analysis: analysis,
          success: true,
          timestamp: new Date().toISOString()
        })
      });
      
      mealId = saveResult.mealId;
      savedToDb = saveResult.success;
      console.log(`[analyzeMealAndSave] Meal saved to database: ${savedToDb}, Meal ID: ${mealId}`);
    } else {
      console.log('[analyzeMealAndSave] Skipping database save - no user ID provided');
    }

    return {
      caption,
      ingredients,
      analysis: analysis,
      imageUrl: imageUrl || '',
      goal,
      mealId,
      timestamp: new Date().toISOString(),
      savedToDatabase: savedToDb,
      aiAnalysis: !!openaiApiKey
    };
  } catch (error: any) {
    console.error('[analyzeMealAndSave] Error:', error);
    throw error;
  }
}

// Restore the POST function
export async function POST(request: NextRequest) {
  try {
    // Get form data with image and goal
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const userGoal = formData.get('goal') as string || 'General Wellness';
    
    // Get user ID from cookies/headers
    let userId: string | null = null;
    
    try {
      // Get user ID from Supabase client
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id || null;
      
      if (!userId) {
        console.error('User not authenticated');
        return NextResponse.json(
          { error: 'User not authenticated', errorType: 'auth_error' },
          { status: 401 }
        );
      }
    } catch (authError) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Authentication error', errorType: 'auth_error' },
        { status: 401 }
      );
    }
    
    // Analyze the meal and save the results
    const result = await analyzeMealAndSave({
      userId,
      file,
      goal: userGoal,
    });
    
    // Return the results
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return createErrorResponse(error);
  }
} 