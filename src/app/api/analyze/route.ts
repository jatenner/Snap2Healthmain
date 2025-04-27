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

export async function POST(request: NextRequest) {
  try {
    // Get form data with image and goal
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const textDescription = formData.get('description') as string | null;
    const goalId = formData.get('goalId') as string | null;
    const userId = formData.get('userId') as string | null;
    const imageUrl = formData.get('imageUrl') as string | null;

    // Log what we received for debugging
    console.log('Analyze request received with:');
    console.log('- Image file:', imageFile ? `${imageFile.name} (${imageFile.size} bytes)` : 'None');
    console.log('- Image URL:', imageUrl || 'None');
    console.log('- User ID:', userId || 'None');
    console.log('- Goal ID:', goalId || 'None');

    // Ensure we have an image
    if (!imageFile && !imageUrl) {
      return NextResponse.json(
        { 
          error: 'Please provide a food image.',
          errorType: 'missing_input'
        },
        { status: 400 }
      );
    }

    // Ensure we have a user ID for storing the record
    if (!userId) {
      console.warn('No user ID provided for meal analysis');
      // We'll still analyze but won't store the record
    }

    // Ensure we have a goal (default to General Wellness if missing)
    const userGoal = goalId || 'General Wellness';
    
    let visionResponse;
    let caption = "My meal";
    let ingredients = [];
    let validatedAnalysis: SanitizedAnalysis = {
      calories: 0,
      macronutrients: [],
      micronutrients: []
    };
    
    // Only attempt AI analysis if OpenAI API key is available
    if (openaiApiKey) {
      try {
        // Handle image input - either file or URL
        let imageInput;
        
        if (imageFile) {
          // Convert image file to base64
          try {
            const arrayBuffer = await imageFile.arrayBuffer();
            if (!arrayBuffer) {
              throw new Error('Failed to get array buffer from image file');
            }
            const buffer = Buffer.from(arrayBuffer);
            const base64Image = buffer.toString('base64');
            
            if (!base64Image || base64Image.length === 0) {
              throw new Error('Failed to convert image to base64');
            }
            
            imageInput = {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            };
          } catch (conversionError) {
            console.error('Error converting image to base64:', conversionError);
            throw new Error(`Image conversion error: ${conversionError.message}`);
          }
        } else if (imageUrl) {
          // Use the provided image URL
          if (!imageUrl.startsWith('http')) {
            throw new Error('Invalid image URL format. URL must start with http:// or https://');
          }
          
          imageInput = {
            type: 'image_url',
            image_url: {
              url: imageUrl,
            },
          };
        } else {
          throw new Error('No image file or URL provided');
        }

        // Call GPT-4o Vision to analyze the image
        try {
          console.log('Calling OpenAI Vision API...');
          visionResponse = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL_GPT_VISION || 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: generateVisionPrompt(userGoal) },
                  imageInput,
                ],
              },
            ],
            response_format: { type: 'json_object' },
          });
        } catch (visionError: any) {
          console.error('OpenAI Vision API error:', visionError);
          throw new Error(`Vision API error: ${visionError.message || 'Unknown vision API error'}`);
        }

        // Parse Vision API response
        let visionContent;
        try {
          if (!visionResponse?.choices?.[0]?.message?.content) {
            throw new Error('Empty response from Vision API');
          }
          visionContent = JSON.parse(visionResponse.choices[0].message.content);
          
          if (!visionContent) {
            throw new Error('Failed to parse Vision API response');
          }
        } catch (parseError) {
          console.error('Error parsing Vision API response:', parseError);
          visionContent = { 
            caption: caption || "My meal", 
            ingredients: []
          };
        }
        
        caption = visionContent.caption || "My meal";
        ingredients = visionContent.ingredients || [];

        // Call GPT-4o for nutrition analysis
        try {
          console.log('Calling OpenAI for nutrition analysis...');
          const nutritionResponse = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL_GPT_TEXT || 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: generateNutritionPrompt(caption, ingredients, userGoal),
              },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2, // Lower temperature for more factual responses
          });
          
          // Parse and validate nutrition analysis
          if (!nutritionResponse?.choices?.[0]?.message?.content) {
            throw new Error('Empty response from Nutrition API');
          }
          
          const nutritionContent = JSON.parse(nutritionResponse.choices[0].message.content);
          
          try {
            // Validate the core analysis
            const parsedAnalysis = NutritionAnalysisSchema.parse(nutritionContent);
            
            // Ensure required fields exist even if validation passes
            validatedAnalysis = {
              calories: parsedAnalysis.calories || 0,
              macronutrients: parsedAnalysis.macronutrients || [],
              micronutrients: parsedAnalysis.micronutrients || [],
              ...parsedAnalysis
            };
          } catch (validationError) {
            console.error('Validation error:', validationError);
            // Continue with default values and capture details
            validatedAnalysis = {
              calories: nutritionContent.calories || 0,
              macronutrients: Array.isArray(nutritionContent.macronutrients) ? nutritionContent.macronutrients : [],
              micronutrients: Array.isArray(nutritionContent.micronutrients) ? nutritionContent.micronutrients : [],
              validationError: String(validationError)
            };
          }
        } catch (nutritionError) {
          console.error('OpenAI Nutrition API error:', nutritionError);
          validatedAnalysis = {
            calories: 0,
            macronutrients: [],
            micronutrients: [],
            error: `Nutrition analysis error: ${nutritionError.message}`
          };
        }
      } catch (aiError: any) {
        console.error('AI analysis error:', aiError);
        // Continue with default values if AI analysis fails
        validatedAnalysis = {
          calories: 0,
          macronutrients: [],
          micronutrients: [],
          error: `AI analysis error: ${aiError.message}`
        };
      }
    } else {
      console.log('Skipping AI analysis - OPENAI_API_KEY not provided');
      validatedAnalysis = {
        calories: 0,
        macronutrients: [],
        micronutrients: [],
        error: 'OpenAI API key not provided'
      };
    }

    // Store in Supabase if we have a user ID and image URL
    // We'll store the record even if AI analysis fails
    let savedMealId = null;
    
    if (userId && imageUrl) {
      try {
        console.log('Saving meal to database with image URL:', imageUrl);
        console.log('User ID:', userId);
        
        // Validate required fields
        if (!userId) {
          throw new Error('User ID is required to save meal record');
        }
        
        if (!imageUrl) {
          throw new Error('Image URL is required to save meal record');
        }
        
        // Ensure the meals table exists
        const tableExists = await ensureMealsTableExists();
        console.log('Meals table exists check result:', tableExists);
        
        if (!tableExists) {
          throw new Error('Meals table does not exist and could not be created');
        }
        
        // Use a consistent timestamp for the record
        // Ensure we have a valid date
        let timestamp;
        try {
          // Use ISO string with proper timezone handling
          const now = new Date();
          
          // Ensure date is valid before converting to ISO string
          if (isNaN(now.getTime())) {
            console.warn('Generated an invalid date, using fallback mechanism');
            // Fallback to explicit ISO string creation
            const d = new Date();
            timestamp = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}T${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}.${String(d.getUTCMilliseconds()).padStart(3, '0')}Z`;
          } else {
            timestamp = now.toISOString();
          }
          
          // Double-check the timestamp is valid by creating a new Date from it
          const testDate = new Date(timestamp);
          if (isNaN(testDate.getTime())) {
            console.warn(`Generated invalid ISO string: ${timestamp}, using Unix timestamp approach`);
            // Ultimate fallback: use Unix timestamp and convert to ISO
            timestamp = new Date(Date.now()).toISOString();
          }
          console.log('Using timestamp:', timestamp);
        } catch (dateError) {
          console.error('Error generating timestamp:', dateError);
          // Last resort fallback
          timestamp = new Date(Date.now()).toISOString();
        }
        
        // Ensure we have at least a default caption
        const finalCaption = caption || "My meal";
        
        // Ensure goals are standardized
        const validGoals = ['Weight Loss', 'Muscle Gain', 'Heart Health', 'Diabetes Management', 'General Wellness'];
        const finalGoal = validGoals.includes(userGoal) ? userGoal : 'General Wellness';
        
        // Ensure validatedAnalysis has all required fields
        if (!validatedAnalysis.calories) {
          console.warn('Missing calories in analysis, setting default value');
          validatedAnalysis.calories = 0;
        }
        
        if (!validatedAnalysis.macronutrients || !Array.isArray(validatedAnalysis.macronutrients)) {
          console.warn('Missing macronutrients in analysis, setting default empty array');
          validatedAnalysis.macronutrients = [];
        }
        
        if (!validatedAnalysis.micronutrients || !Array.isArray(validatedAnalysis.micronutrients)) {
          console.warn('Missing micronutrients in analysis, setting default empty array');
          validatedAnalysis.micronutrients = [];
        }
        
        // Make sure we have valid JSON for the analysis field
        let analysisJson = validatedAnalysis;
        try {
          // Sanitize the analysis data
          analysisJson = sanitizeAnalysisData(validatedAnalysis);
          
          // Test that the analysis data is valid JSON by stringifying and parsing it
          const testJson = JSON.stringify(analysisJson);
          JSON.parse(testJson);
        } catch (jsonError) {
          console.error('Invalid JSON in analysis data:', jsonError);
          // Provide a simplified valid structure if the analysis is invalid
          analysisJson = {
            calories: validatedAnalysis.calories || 0,
            macronutrients: Array.isArray(validatedAnalysis.macronutrients) ? validatedAnalysis.macronutrients : [],
            micronutrients: Array.isArray(validatedAnalysis.micronutrients) ? validatedAnalysis.micronutrients : []
          };
        }
        
        // Create meal data with or without AI analysis
        const mealData = {
          user_id: userId,
          goal: finalGoal,
          caption: finalCaption,
          analysis: analysisJson,
          image_url: imageUrl,
          created_at: timestamp, // Explicitly set creation timestamp
          ingredients: ingredients || [] // Save ingredients list separately for easier access, ensure it's an array
        };
        
        console.log('Inserting meal record:', JSON.stringify(mealData, null, 2));
        
        // Insert directly with the Supabase client
        const { data: insertedMeal, error: insertError } = await supabase
          .from('meals')
          .insert(mealData)
          .select();
        
        if (insertError) {
          console.error('Error inserting meal:', insertError.message);
          console.error('Error code:', insertError.code);
          console.error('Error details:', insertError.details || 'No details available');
          console.error('Meal data that failed:', JSON.stringify(mealData, null, 2));
          
          // Check specifically for JSON validation errors which can happen with complex analysis data
          if (insertError.message?.includes('invalid input syntax for type json') || 
              insertError.message?.includes('malformed JSON')) {
            console.error('JSON validation error detected. Simplifying analysis data...');
            
            // Create a simplified version of the meal data with minimal validated analysis
            const simplifiedMealData = {
              ...mealData,
              analysis: {
                calories: typeof mealData.analysis.calories === 'number' ? mealData.analysis.calories : 0,
                macronutrients: Array.isArray(mealData.analysis.macronutrients) ? 
                  mealData.analysis.macronutrients.slice(0, 3) : [],
                micronutrients: Array.isArray(mealData.analysis.micronutrients) ? 
                  mealData.analysis.micronutrients.slice(0, 3) : []
              }
            };
            
            console.log('Attempting insertion with simplified data...');
            const { data: simplifiedInsertedMeal, error: simplifiedInsertError } = await supabase
              .from('meals')
              .insert(simplifiedMealData)
              .select();
              
            if (simplifiedInsertError) {
              console.error('Still failed with simplified data:', simplifiedInsertError);
              throw new Error(`Database error: ${simplifiedInsertError.message}`);
            } else if (simplifiedInsertedMeal && simplifiedInsertedMeal.length > 0) {
              savedMealId = simplifiedInsertedMeal[0].id;
              console.log('Successfully inserted meal with simplified data, ID:', savedMealId);
            }
          } else {
            // If direct insertion fails, try the REST API approach
            console.log('Attempting direct REST API insert as fallback');
            
            // Get session for proper authorization
            let authHeaders = {};
            if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
              authHeaders = {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
              };
            } else {
              throw new Error('Missing Supabase ANON key for API fallback');
            }
            
            try {
              const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/meals`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...authHeaders,
                  'Prefer': 'return=representation'
                },
                body: JSON.stringify(mealData)
              });
              
              if (response.ok) {
                const responseData = await response.json();
                console.log('Successfully inserted meal via REST API:', responseData);
                
                // Set the saved meal ID if available
                if (responseData && responseData.length > 0) {
                  savedMealId = responseData[0].id;
                  console.log('Meal inserted with ID:', savedMealId);
                } else {
                  console.warn('Response data missing from successful insert');
                }
              } else {
                let errorMessage = 'Failed to insert meal via REST API';
                try {
                  const errorData = await response.json();
                  console.error('REST API error details:', errorData);
                  errorMessage = `Database insertion failed: ${JSON.stringify(errorData)}`;
                } catch (parseError) {
                  console.error('Error parsing REST API error response');
                }
                throw new Error(errorMessage);
              }
            } catch (restApiError) {
              console.error('REST API insertion failed:', restApiError);
              throw restApiError;
            }
          }
        } else {
          // Successfully inserted with Supabase client
          if (insertedMeal && insertedMeal.length > 0) {
            savedMealId = insertedMeal[0].id;
            console.log('Meal inserted with ID:', savedMealId);
          } else {
            console.warn('Inserted meal data missing from successful insert');
          }
        }
      } catch (dbError: any) {
        console.error('Database error:', dbError);
        // Return specific error information rather than continuing silently
        return NextResponse.json(
          {
            error: 'Failed to save meal record to database',
            errorType: 'database_error',
            details: dbError.message || 'Unknown database error',
            partialSuccess: true,
            caption,
            ingredients: ingredients || [],
            analysis: validatedAnalysis,
            imageUrl,
            goal: userGoal,
            timestamp: new Date().toISOString(),
            aiAnalysis: !!openaiApiKey
          },
          { status: 500 }
        );
      }
    } else {
      // Log why we're not saving to the database
      if (!userId) {
        console.warn('Not saving to database: Missing user ID');
      }
      if (!imageUrl) {
        console.warn('Not saving to database: Missing image URL');
      }
    }

    // Return the analysis results
    return NextResponse.json(
      {
        caption,
        ingredients: ingredients || [],
        analysis: validatedAnalysis,
        imageUrl,
        goal: userGoal,
        mealId: savedMealId,
        savedToDatabase: !!savedMealId,
        timestamp: new Date().toISOString(), // Include timestamp in response
        aiAnalysis: !!openaiApiKey
      },
      { status: savedMealId ? 201 : 200 }
    );
  } catch (error: any) {
    return createErrorResponse(error);
  }
} 