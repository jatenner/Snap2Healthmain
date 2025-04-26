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

export async function POST(request: NextRequest) {
  try {
    // Get form data with image and goal
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const textDescription = formData.get('description') as string | null;
    const goalId = formData.get('goalId') as string | null;
    const userId = formData.get('userId') as string | null;
    const imageUrl = formData.get('imageUrl') as string | null;

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

    // Ensure we have a goal (default to General Wellness if missing)
    const userGoal = goalId || 'General Wellness';
    
    let visionResponse;
    let caption = "My meal";
    let ingredients = [];
    let validatedAnalysis = {
      calories: 0,
      macronutrients: [],
      micronutrients: []
    };
    
    // Only attempt AI analysis if OpenAI API key is available
    if (openaiApiKey) {
      try {
        // Convert image to base64
        const arrayBuffer = await imageFile?.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');

        // Call GPT-4o Vision to analyze the image
        visionResponse = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL_GPT_VISION || 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: generateVisionPrompt(userGoal) },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          response_format: { type: 'json_object' },
        });

        // Parse Vision API response
        const visionContent = JSON.parse(visionResponse.choices[0].message.content || '{}');
        caption = visionContent.caption || "My meal";
        ingredients = visionContent.ingredients || [];

        // Call GPT-4o for nutrition analysis
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
        const nutritionContent = JSON.parse(nutritionResponse.choices[0].message.content || '{}');
        
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
          // Continue with default values
        }
      } catch (aiError: any) {
        console.error('AI analysis error:', aiError);
        // Continue with default values if AI analysis fails
      }
    } else {
      console.log('Skipping AI analysis - OPENAI_API_KEY not provided');
    }

    // Store in Supabase if we have a user ID and image URL
    // We'll store the record even if AI analysis fails
    if (userId && imageUrl) {
      try {
        console.log('Saving meal to database with image URL:', imageUrl);
        console.log('User ID:', userId);
        
        // Ensure the meals table exists
        const tableExists = await ensureMealsTableExists();
        console.log('Meals table exists check result:', tableExists);
        
        // Create meal data with or without AI analysis
        const mealData = {
          user_id: userId,
          goal: userGoal,
          caption: caption || "My meal",
          analysis: validatedAnalysis,
          image_url: imageUrl,
          created_at: new Date().toISOString(), // Explicitly set creation timestamp
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
          
          // If direct insertion fails, try the REST API approach
          console.log('Attempting direct REST API insert as fallback');
          
          // Get session for proper authorization
          let authHeaders = {};
          if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            authHeaders = {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
            };
          }
          
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
            
            // Return the analysis with the saved ID to help with debugging
            if (responseData && responseData.length > 0) {
              console.log('Meal inserted with ID:', responseData[0].id);
              return NextResponse.json(
                {
                  caption,
                  ingredients: ingredients || [],
                  analysis: validatedAnalysis,
                  imageUrl,
                  goal: userGoal,
                  mealId: responseData[0].id,
                  savedToDatabase: true,
                  aiAnalysis: !!openaiApiKey
                },
                { status: 201 }
              );
            }
          } else {
            const errorData = await response.json();
            console.error('Failed to insert meal via REST API:', errorData);
            throw new Error(`Database insertion failed: ${JSON.stringify(errorData)}`);
          }
        } else {
          console.log('Successfully saved meal to database:', insertedMeal?.[0]?.id);
          return NextResponse.json(
            {
              caption,
              ingredients: ingredients || [],
              analysis: validatedAnalysis,
              imageUrl,
              goal: userGoal,
              mealId: insertedMeal?.[0]?.id,
              savedToDatabase: true,
              aiAnalysis: !!openaiApiKey
            },
            { status: 201 }
          );
        }
      } catch (dbError: any) {
        console.error('Error saving to database:', dbError);
        
        // Return the analysis data even if database storage failed
        return NextResponse.json({
          caption,
          ingredients: ingredients || [],
          analysis: validatedAnalysis,
          imageUrl,
          goal: userGoal,
          savedToDatabase: false,
          databaseError: true
        });
      }
    } else {
      console.log('Missing user ID or image URL - skipping database storage');
      if (!userId) console.log('User ID is missing');
      if (!imageUrl) console.log('Image URL is missing');
      
      // Return analysis data without attempting database storage
      return NextResponse.json({
        caption,
        ingredients: ingredients || [],
        analysis: validatedAnalysis,
        imageUrl,
        goal: userGoal,
        savedToDatabase: false
      });
    }

    // Return the analysis even if database storage was skipped
    return NextResponse.json(
      {
        caption,
        ingredients: ingredients || [],
        analysis: validatedAnalysis,
        imageUrl,
        goal: userGoal,
        savedToDatabase: false,
        aiAnalysis: !!openaiApiKey
      },
      { status: 200 }
    );
  } catch (error: any) {
    return createErrorResponse(error);
  }
} 