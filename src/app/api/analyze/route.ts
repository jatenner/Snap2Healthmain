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
    console.log('- Image URL type:', imageUrl ? typeof imageUrl : 'N/A');
    console.log('- Image URL length:', imageUrl ? imageUrl.length : 0);
    console.log('- User ID:', userId || 'None');
    console.log('- Goal ID:', goalId || 'None');

    // Validate imageUrl format
    if (imageUrl) {
      console.log('Validating image URL format...');
      try {
        // Check if it's a valid URL
        if (!imageUrl.startsWith('http')) {
          console.warn('Image URL does not start with http:', imageUrl);
        }
        
        // Try parsing as URL
        const url = new URL(imageUrl);
        console.log('Image URL is valid. Host:', url.hostname);
      } catch (e) {
        console.error('Invalid image URL format:', e);
      }
    }

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
        if (imageFile) {
          try {
            const arrayBuffer = await imageFile.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Image = buffer.toString('base64');
            imageContent = {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            };
          } catch (e) {
            console.error('Error converting image:', e);
            throw new Error('Failed to process image file');
          }
        } else if (imageUrl) {
          imageContent = {
            type: 'image_url',
            image_url: {
              url: imageUrl,
            },
          };
        } else {
          throw new Error('No image source available');
        }

        // Call Vision API
        try {
          console.log('Calling Vision API...');
          const visionResponse = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL_GPT_VISION || 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: generateVisionPrompt(userGoal) },
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
              
              // Get nutrition data
              console.log('Getting nutrition data...');
              const nutritionResponse = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL_GPT_TEXT || 'gpt-4o',
                messages: [
                  {
                    role: 'user',
                    content: generateNutritionPrompt(caption, ingredients, userGoal),
                  },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.2,
              });
              
              if (nutritionResponse?.choices?.[0]?.message?.content) {
                try {
                  const nutritionData = JSON.parse(nutritionResponse.choices[0].message.content);
                  analysis = nutritionData;
                } catch (e) {
                  console.error('Error parsing nutrition response:', e);
                }
              }
            } catch (e) {
              console.error('Error parsing vision response:', e);
            }
          }
        } catch (e) {
          console.error('OpenAI API error:', e);
        }
      } catch (e) {
        console.error('Analysis error:', e);
      }
    }

    // Save to database
    let mealId = null;
    if (userId && imageUrl) {
      try {
        console.log('Preparing to save meal to database');
        console.log('- User ID:', userId);
        console.log('- Image URL to save:', imageUrl);
        console.log('- Caption:', caption);
        console.log('- Goal:', userGoal);
        
        // Ensure analysis is valid JSON
        let validAnalysis;
        try {
          validAnalysis = typeof analysis === 'string' ? JSON.parse(analysis) : analysis;
          JSON.stringify(validAnalysis); // Test serialization
        } catch (e) {
          console.error('Error with analysis data:', e);
          validAnalysis = {
            calories: 0,
            macronutrients: [],
            micronutrients: []
          };
        }
        
        // Create record
        const mealData = {
          user_id: userId,
          goal: userGoal,
          caption: caption,
          analysis: validAnalysis,
          image_url: imageUrl,
          created_at: new Date().toISOString(),
          ingredients: ingredients || []
        };
        
        console.log('Saving meal data to database:', JSON.stringify({
          user_id: mealData.user_id,
          goal: mealData.goal,
          caption: mealData.caption,
          image_url: mealData.image_url,
          created_at: mealData.created_at,
        }));
        
        // Insert into database
        const { data, error } = await supabase
          .from('meals')
          .insert(mealData)
          .select();
          
        if (error) {
          console.error('Database insertion error:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          console.error('Error details:', error.details);
          
          // Try simplified version
          console.log('Attempting simplified insertion without analysis data');
          const simpleData = {
            user_id: userId,
            goal: userGoal,
            caption: caption,
            image_url: imageUrl,
            created_at: new Date().toISOString()
          };
          
          const { data: simpleMealData, error: simpleError } = await supabase
            .from('meals')
            .insert(simpleData)
            .select();
            
          if (!simpleError && simpleMealData && Array.isArray(simpleMealData) && simpleMealData.length > 0) {
            mealId = simpleMealData[0].id;
          }
        } else if (data && data.length > 0) {
          mealId = data[0].id;
        }
      } catch (e) {
        console.error('Error saving meal:', e);
      }
    }

    // Return results
    return NextResponse.json({
      caption,
      ingredients,
      analysis,
      imageUrl,
      goal: userGoal,
      mealId,
      savedToDatabase: !!mealId,
      timestamp: new Date().toISOString(),
      aiAnalysis: !!openaiApiKey
    }, { status: 200 });
  } catch (error: any) {
    return createErrorResponse(error);
  }
} 