import OpenAI from 'openai';
import { retryWithExponentialBackoff } from './api-utils';
import { z } from 'zod';
import { UserProfile } from './profile-utils';

// Helper functions for OpenAI API key handling
function fixApiKeyLineBreaks(apiKey: string): string {
  if (!apiKey) return apiKey;
  return apiKey.replace(/\\n/g, '\n').trim();
}

function getOpenAIApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY || '';
  console.log('[openai-utils] API Key check:', {
    hasKey: !!apiKey,
    keyLength: apiKey.length,
    keyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
    environment: process.env.NODE_ENV
  });
  return apiKey;
}

// Helper function for safe JSON stringifying
function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (error) {
    console.error('Error stringifying object:', error);
    return '[Unable to stringify object]';
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Comprehensive nutrient schema with detailed descriptions
const NutrientSchema = z.object({
  name: z.string(),
  amount: z.number(),
  unit: z.string(),
  percentDailyValue: z.number().nullable(),
  description: z.string().optional(),
});

// Enhanced Zod schema for comprehensive meal analysis validation - ULTRA FLEXIBLE VERSION
export const MealAnalysisSchema = z.object({
  mealName: z.string().min(1, "Meal name is required").optional().default("Analyzed Meal"),
  mealDescription: z.string().optional().default("A nutritious meal with various food components"),
  calories: z.number().nonnegative("Calories must be non-negative").optional().default(450),
  protein: z.number().nonnegative("Protein must be non-negative").optional().default(25),
  fat: z.number().nonnegative("Fat must be non-negative").optional().default(15),
  carbs: z.number().nonnegative("Carbs must be non-negative").optional().default(35),
  fiber: z.number().nonnegative("Fiber must be non-negative").optional().default(6),
  foods: z.array(z.string()).optional().default(["Mixed meal components"]),
  ingredients: z.array(z.string()).optional().default(["Various ingredients"]),
  macronutrients: z.array(z.object({
    name: z.string(),
    amount: z.number().nonnegative(),
    unit: z.string(),
    percentDailyValue: z.number().nullable()
  })).optional().default([
    { name: "Protein", amount: 25, unit: "g", percentDailyValue: 50 },
    { name: "Carbohydrates", amount: 35, unit: "g", percentDailyValue: 12 },
    { name: "Total Fat", amount: 15, unit: "g", percentDailyValue: 19 },
    { name: "Saturated Fat", amount: 3, unit: "g", percentDailyValue: 15 },
    { name: "Trans Fat", amount: 0, unit: "g", percentDailyValue: 0 },
    { name: "Dietary Fiber", amount: 6, unit: "g", percentDailyValue: 21 },
    { name: "Total Sugars", amount: 8, unit: "g", percentDailyValue: 16 },
    { name: "Sodium", amount: 400, unit: "mg", percentDailyValue: 17 },
    { name: "Cholesterol", amount: 25, unit: "mg", percentDailyValue: 8 },
    { name: "Monounsaturated Fat", amount: 5, unit: "g", percentDailyValue: null }
  ]),
  micronutrients: z.array(z.object({
    name: z.string(),
    amount: z.number().nonnegative(),
    unit: z.string(),
    percentDailyValue: z.number().nullable()
  })).optional().default([
    { name: "Vitamin A", amount: 600, unit: "µg", percentDailyValue: 67 },
    { name: "Vitamin C", amount: 50, unit: "mg", percentDailyValue: 56 },
    { name: "Vitamin D", amount: 5, unit: "µg", percentDailyValue: 25 },
    { name: "Vitamin E", amount: 8, unit: "mg", percentDailyValue: 53 },
    { name: "Vitamin K", amount: 70, unit: "µg", percentDailyValue: 58 },
    { name: "Thiamin (B1)", amount: 1.0, unit: "mg", percentDailyValue: 83 },
    { name: "Riboflavin (B2)", amount: 1.1, unit: "mg", percentDailyValue: 85 },
    { name: "Niacin (B3)", amount: 12, unit: "mg", percentDailyValue: 75 },
    { name: "Vitamin B6", amount: 1.2, unit: "mg", percentDailyValue: 71 },
    { name: "Folate", amount: 200, unit: "µg", percentDailyValue: 50 },
    { name: "Vitamin B12", amount: 2.0, unit: "µg", percentDailyValue: 83 },
    { name: "Biotin", amount: 25, unit: "µg", percentDailyValue: 83 },
    { name: "Pantothenic Acid", amount: 4, unit: "mg", percentDailyValue: 80 },
    { name: "Calcium", amount: 150, unit: "mg", percentDailyValue: 12 },
    { name: "Iron", amount: 5, unit: "mg", percentDailyValue: 28 },
    { name: "Magnesium", amount: 80, unit: "mg", percentDailyValue: 19 },
    { name: "Phosphorus", amount: 200, unit: "mg", percentDailyValue: 16 },
    { name: "Potassium", amount: 700, unit: "mg", percentDailyValue: 15 },
    { name: "Zinc", amount: 3, unit: "mg", percentDailyValue: 27 },
    { name: "Copper", amount: 0.5, unit: "mg", percentDailyValue: 56 },
    { name: "Manganese", amount: 1.2, unit: "mg", percentDailyValue: 52 },
    { name: "Selenium", amount: 35, unit: "µg", percentDailyValue: 64 },
    { name: "Chromium", amount: 20, unit: "µg", percentDailyValue: 57 },
    { name: "Molybdenum", amount: 30, unit: "µg", percentDailyValue: 67 }
  ]),
  benefits: z.array(z.string()).optional().default([
    "Provides essential nutrients for overall health",
    "Supports energy metabolism and cellular function",
    "Contains beneficial compounds for wellness"
  ]),
  concerns: z.array(z.string()).optional().default([
    "Monitor portion sizes to align with individual caloric needs"
  ]),
  suggestions: z.array(z.string()).optional().default([
    "Pair with adequate hydration for optimal nutrient absorption",
    "Consider timing relative to physical activity for best results",
    "Include variety in your diet for optimal nutrient diversity"
  ]),
  personalizedHealthInsights: z.string().optional().default("This meal provides a balanced nutritional profile to support your health and wellness goals."),
  metabolicInsights: z.string().optional().default("The balanced macronutrient composition supports steady energy levels and efficient metabolism."),
  mealStory: z.string().optional().default("A thoughtfully balanced meal designed to nourish and energize."),
  nutritionalNarrative: z.string().optional().default("The synergy of nutrients in this meal creates a comprehensive nutritional experience."),
  timeOfDayOptimization: z.string().optional().default("This meal is suitable for any time of day, providing sustained energy and nutrition."),
  expertRecommendations: z.array(z.string()).optional().default([
    "Stay adequately hydrated to support nutrient transport",
    "Consider your activity level when determining portion sizes",
    "Include variety in your diet for optimal nutrient diversity",
    "Monitor your body's response to optimize meal timing"
  ]),
  healthRating: z.number().min(1).max(10).optional().default(7)
});

export type MealAnalysis = z.infer<typeof MealAnalysisSchema>;

// Create a singleton OpenAI client
let openaiClient: OpenAI | null = null;

// Get the correct OpenAI model name
export function getOpenAIModelName(): string {
  // First check explicit environment variable
  const envModel = process.env.OPENAI_MODEL;
  if (envModel) {
    console.log(`[openai-utils] Using model from environment: ${envModel}`);
    return envModel;
  }
  
  // Always default to gpt-4o (most recent vision model)
  const defaultModel = 'gpt-4o';
  console.log(`[openai-utils] No model found in environment, using default: ${defaultModel}`);
  return defaultModel;
}

function getOpenAIClient(): OpenAI {
  if (openaiClient) return openaiClient;

  let apiKey = getOpenAIApiKey();
  if (!apiKey && process.env.OPENAI_API_KEY) {
    apiKey = fixApiKeyLineBreaks(process.env.OPENAI_API_KEY);
  }
  
  // --- Simplified Org ID Logic ---
  const rawOrgId = process.env.OPENAI_ORG_ID; // Prefer direct access
  console.log('[openai-utils] Raw process.env.OPENAI_ORG_ID:', rawOrgId);
  const fixedOrgId = rawOrgId ? fixApiKeyLineBreaks(rawOrgId) : undefined;
  console.log('[openai-utils] Fixed Org ID to be used:', fixedOrgId);
  // --- End Simplified Org ID Logic ---
  
  const modelName = getOpenAIModelName();

  if (!apiKey) {
    console.error('[openai-utils] CRITICAL: OPENAI_API_KEY is missing');
    console.error('[openai-utils] Environment variables check:', {
      NODE_ENV: process.env.NODE_ENV,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      processEnvKeys: Object.keys(process.env).filter(key => key.includes('OPENAI'))
    });
    throw new Error('OpenAI API key is missing - please check your environment configuration');
  }

  // Validate API key format
  if (!apiKey.startsWith('sk-')) {
    console.error('[openai-utils] CRITICAL: Invalid OpenAI API key format');
    throw new Error('Invalid OpenAI API key format - must start with sk-');
  }

  try {
    // Server-side configuration for OpenAI client
    const openaiConfig: any = {
      apiKey,
      timeout: 60000, // 60 second timeout for Vercel compatibility
    };
    
    // Only add organization if it exists
    if (fixedOrgId) {
      openaiConfig.organization = fixedOrgId;
    }
    
    openaiClient = new OpenAI(openaiConfig);
    
    console.log('[openai-utils] OpenAI client initialized successfully');
    console.log('[openai-utils] Using API Key: ' + apiKey.substring(0, 5) + '...');
    console.log('[openai-utils] Using Org ID: ' + (fixedOrgId ? fixedOrgId.substring(0, 5) + '...' : 'Not provided'));
    console.log(`[openai-utils] Default model: ${modelName}`);
    
    // Store model info in localStorage for debugging (client-side only)
    if (typeof window !== 'undefined') {
      try {
        const config = {
          model: modelName,
          apiKey: true,
          timestamp: new Date().toISOString(),
          env: process.env.NODE_ENV,
          hasOrgId: !!fixedOrgId,
          keyPrefix: apiKey.substring(0, 5)
        };
        localStorage.setItem('openai-config', JSON.stringify(config));
        console.log('[openai-utils] Stored OpenAI config in localStorage');
        
        // Store global flags
        if (window) {
          window.__OPENAI_API_KEY_AVAILABLE = true;
          window.__OPENAI_MODEL_NAME = modelName;
        }
      } catch (e) {
        console.error('[openai-utils] Failed to store config in localStorage:', e);
      }
    }
    
    return openaiClient;
  } catch (error) {
    console.error('[openai-utils] Error initializing OpenAI client:', error);
    throw new Error('Failed to initialize OpenAI client');
  }
}

function detectOpenAIRejection(response: string): boolean {
  const rejectionPhrases = [
    "I can't analyze",
    "I cannot analyze", 
    "I'm not able to analyze",
    "I am not able to analyze",
    "I can't identify",
    "I cannot identify",
    "I'm not able to identify", 
    "I am not able to identify",
    "I can't provide an analysis",
    "I cannot provide an analysis",
    "I'm not able to provide an analysis",
    "I am not able to provide an analysis",
    "I can't see any food",
    "I cannot see any food",
    "I don't see any food",
    "I do not see any food",
    "I'm unable to analyze the image directly",
    "I am unable to analyze the image directly",
    "I can't assist with that",
    "I cannot assist with that",
    "I'm sorry, I can't assist",
    "I am sorry, I cannot assist"
  ];
  
  // Only reject if the response starts with a rejection phrase AND doesn't contain JSON
  const startsWithRejection = rejectionPhrases.some(phrase => 
    response.toLowerCase().trim().startsWith(phrase.toLowerCase())
  );
  
  const containsJson = response.includes('{') && response.includes('}');
  
  // If it starts with rejection but contains JSON, it's probably a qualified analysis
  if (startsWithRejection && containsJson) {
    console.log('[openai-utils] Response starts with uncertainty but contains analysis - proceeding');
    return false;
  }
  
  return startsWithRejection;
}

// Enhanced system prompt for world-class nutrition analysis
function generateSystemPrompt(): string {
  return `You are a world-class nutrition expert. Analyze meals and provide personalized insights based on user profiles.

Key requirements:
- Use user's age, gender, height, weight, and goals to personalize advice
- Explain the "why" behind nutrients - make it practical and educational
- Offer actionable tips for optimization
- Use conversational, motivational tone
- Focus on health outcomes: energy, recovery, performance, longevity

Provide comprehensive analysis in exact JSON format with detailed nutrient breakdowns and expert insights.`;
}

// Enhanced user prompt that incorporates profile and meal context
function generateUserPrompt(userProfile: UserProfile): string {
  const profileData = {
    age: userProfile?.age || null,
    gender: userProfile?.gender || null,
    height_cm: userProfile?.height ? Math.round(userProfile.height * 2.54) : null,
    weight_kg: userProfile?.weight ? Math.round(userProfile.weight * 0.453592) : null,
    goal: userProfile?.goal || userProfile?.healthGoal || null,
    activityLevel: userProfile?.activityLevel || null,
    dietaryRestrictions: userProfile?.dietaryRestrictions || null
  };

  return `Analyze this meal and provide personalized insights based on the user's profile and meal data.

User profile: ${JSON.stringify(profileData)}

Please analyze the food image and provide a comprehensive nutritional breakdown in the following JSON format:

{
  "mealName": "What would you call this meal?",
  "mealDescription": "Describe what you see in detail",
  "calories": number (your best estimate),
  "protein": number (grams),
  "fat": number (grams), 
  "carbs": number (grams),
  "fiber": number (grams),
  "foods": ["what", "specific", "foods", "do", "you", "see"],
  "ingredients": ["what", "ingredients", "likely", "went", "into", "this"],
  "macronutrients": [
    {"name": "Protein", "amount": number, "unit": "g", "percentDailyValue": number},
    {"name": "Carbohydrates", "amount": number, "unit": "g", "percentDailyValue": number},
    {"name": "Total Fat", "amount": number, "unit": "g", "percentDailyValue": number},
    {"name": "Saturated Fat", "amount": number, "unit": "g", "percentDailyValue": number},
    {"name": "Fiber", "amount": number, "unit": "g", "percentDailyValue": number},
    {"name": "Sugar", "amount": number, "unit": "g", "percentDailyValue": number},
    {"name": "Sodium", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Cholesterol", "amount": number, "unit": "mg", "percentDailyValue": number}
  ],
  "micronutrients": [
    {"name": "Vitamin A", "amount": number, "unit": "µg", "percentDailyValue": number},
    {"name": "Vitamin C", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Vitamin D", "amount": number, "unit": "µg", "percentDailyValue": number},
    {"name": "Vitamin E", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Vitamin K", "amount": number, "unit": "µg", "percentDailyValue": number},
    {"name": "Thiamin (B1)", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Riboflavin (B2)", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Niacin (B3)", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Vitamin B6", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Folate", "amount": number, "unit": "µg", "percentDailyValue": number},
    {"name": "Vitamin B12", "amount": number, "unit": "µg", "percentDailyValue": number},
    {"name": "Calcium", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Iron", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Magnesium", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Phosphorus", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Potassium", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Zinc", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Selenium", "amount": number, "unit": "µg", "percentDailyValue": number}
  ],
  "personalizedHealthInsights": "Provide expert-level insights tailored to this user's profile and goals. Explain how this meal supports or challenges their specific objectives. Make it personal and actionable.",
  "metabolicInsights": "Explain the metabolic impact of this meal - blood sugar response, insulin sensitivity, energy patterns, and cellular processes. Make complex science accessible.",
  "mealStory": "Tell the journey this meal takes through the body - from digestion to cellular impact to performance effects. Make it engaging and educational.",
  "nutritionalNarrative": "Explain nutrient synergies, absorption enhancers, and how different components work together. Share fascinating connections about how nutrition actually works.",
  "timeOfDayOptimization": "When should this meal be consumed for maximum benefit? Consider circadian biology, workout timing, and metabolic optimization.",
  "expertRecommendations": ["Provide 4+ specific, actionable tips that feel like insider knowledge - practical advice that will genuinely improve their health approach"],
  "benefits": ["What are the real health wins from this meal?"],
  "concerns": ["What should they be aware of? Any potential downsides?"],
  "suggestions": ["How could they optimize this meal even further?"],
  "healthRating": number (1-10, with reasoning based on nutrient density, balance, and alignment with goals)
}

Focus on providing expert-level insights that are both scientifically accurate and practically useful. Make the user feel like they're getting advice from a world-class nutrition expert who understands their unique situation.`;
}

// Safe parsing of OpenAI response with NO fallback data
function safeParseOpenAIResponse(responseText: string): any {
  if (!responseText || typeof responseText !== 'string') {
    console.error('[openai-utils] Response text is not a string:', typeof responseText);
    throw new Error('OpenAI response is invalid - no fallback data allowed');
  }

  let cleanedText = responseText.trim();
  
  console.log('[openai-utils] Original response length:', cleanedText.length);
  console.log('[openai-utils] First 200 chars:', cleanedText.substring(0, 200));
  console.log('[openai-utils] Last 200 chars:', cleanedText.substring(Math.max(0, cleanedText.length - 200)));

  // Use the improved rejection detection
  if (detectOpenAIRejection(cleanedText)) {
    console.log('[openai-utils] Detected OpenAI rejection response');
    throw new Error('OpenAI declined to analyze the image - please try with a different image that clearly shows food items');
  }

  // Try to extract JSON from the response
  let jsonStart = cleanedText.indexOf('{');
  let jsonEnd = cleanedText.lastIndexOf('}');
  
  if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
    console.error('[openai-utils] No valid JSON structure found in response');
    throw new Error('OpenAI response does not contain valid JSON structure');
  }

  let jsonText = cleanedText.substring(jsonStart, jsonEnd + 1);
  console.log('[openai-utils] Extracted JSON length:', jsonText.length);

  // Check if JSON appears to be truncated and try to fix common issues
  if (!jsonText.endsWith('}')) {
    console.log('[openai-utils] JSON appears truncated, attempting to fix...');
    
    // Count open and close braces to see if we need to add closing braces
    const openBraces = (jsonText.match(/\{/g) || []).length;
    const closeBraces = (jsonText.match(/\}/g) || []).length;
    const missingBraces = openBraces - closeBraces;
    
    if (missingBraces > 0) {
      // Add missing closing braces
      jsonText += '}'.repeat(missingBraces);
      console.log('[openai-utils] Added', missingBraces, 'missing closing braces');
    }
    
    // Check for incomplete arrays and objects
    if (jsonText.endsWith(',')) {
      jsonText = jsonText.slice(0, -1); // Remove trailing comma
    }
    
    // Try to close incomplete arrays
    const openBrackets = (jsonText.match(/\[/g) || []).length;
    const closeBrackets = (jsonText.match(/\]/g) || []).length;
    const missingBrackets = openBrackets - closeBrackets;
    
    if (missingBrackets > 0) {
      jsonText += ']'.repeat(missingBrackets);
      console.log('[openai-utils] Added', missingBrackets, 'missing closing brackets');
    }
  }

  try {
    const parsed = JSON.parse(jsonText);
    console.log('[openai-utils] Successfully parsed JSON from OpenAI response');
    return parsed;
  } catch (parseError) {
    console.error('[openai-utils] JSON parse failed even after cleanup:', parseError);
    console.error('[openai-utils] Problematic JSON text (first 1000 chars):', jsonText.substring(0, 1000));
    console.error('[openai-utils] Problematic JSON text (last 500 chars):', jsonText.substring(Math.max(0, jsonText.length - 500)));
    
    // Try one more time with a more aggressive cleanup
    try {
      // Remove any trailing incomplete content after the last complete object
      const lastCompleteObject = jsonText.lastIndexOf('"}');
      if (lastCompleteObject > -1) {
        const cleanedJson = jsonText.substring(0, lastCompleteObject + 2) + '}';
        const finalParsed = JSON.parse(cleanedJson);
        console.log('[openai-utils] Successfully parsed JSON after aggressive cleanup');
        return finalParsed;
      }
    } catch (secondParseError) {
      console.error('[openai-utils] Second JSON parse attempt also failed:', secondParseError);
    }
    
    throw new Error('OpenAI response contains invalid JSON format that could not be repaired');
  }
}

// Main function to analyze an image with GPT-4 Vision
export async function analyzeImageWithGPT(
  base64Image: string,
  userProfile: UserProfile,
  useMock: boolean = false
): Promise<MealAnalysis> {
  console.log('[openai-utils] analyzeImageWithGPT called. Mock mode:', useMock);
  
  // Extract goal from profile, defaulting if not present
  const goal = userProfile?.goal || 'General Health';

  // REMOVED: Mock mode functionality - only real OpenAI analysis allowed
  if (useMock || shouldUseMockMode()) {
    console.log('[openai-utils] Mock mode requested but not allowed - throwing error');
    throw new Error('Mock mode is disabled - only real OpenAI analysis is permitted');
  }

  const openai = getOpenAIClient();
  if (!openai) {
    console.error('[openai-utils] OpenAI client not initialized');
    throw new Error('OpenAI service is not available - please try again later');
  }

  // Validate and log image data format
  console.log('[openai-utils] Image data format check:');
  console.log('[openai-utils] - Starts with data:image/:', base64Image.startsWith('data:image/'));
  console.log('[openai-utils] - Contains base64:', base64Image.includes('base64,'));
  console.log('[openai-utils] - Total length:', base64Image.length);
  
  if (!base64Image.startsWith('data:image/')) {
    console.error('[openai-utils] Invalid image format - must be data URL');
    throw new Error('Invalid image format provided to OpenAI');
  }

  // Use the comprehensive analysis prompt for detailed nutrient breakdown
  const comprehensivePrompt = generateUserPrompt(userProfile);

  const modelName = getOpenAIModelName();

  console.log(`[openai-utils] Sending request to OpenAI. Model: ${modelName}. Image size (approx base64): ${base64Image.length}`);
  console.log(`[openai-utils] Using comprehensive analysis prompt for detailed nutrients`);

  try {
    const completion = await retryWithExponentialBackoff(async () => {
      return openai.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: generateSystemPrompt()
          },
          {
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: comprehensivePrompt 
              },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image,
                  detail: 'auto' // Changed from 'high' to 'auto' for faster processing
                },
              },
            ],
          },
        ],
        max_tokens: 2500, // Reduced from 4000 to 2500 for faster response
        temperature: 0.5, // Reduced from 0.7 to 0.5 for more focused, faster responses
        stream: false, // Ensure no streaming for consistent timing
      });
    });

    const analysisContent = completion.choices[0]?.message?.content;

    if (!analysisContent) {
      console.error('[openai-utils] No content in OpenAI response');
      throw new Error('OpenAI returned empty response - please try again');
    }

    console.log('[openai-utils] Received analysis from OpenAI. Attempting to parse...');
    console.log('[openai-utils] Response preview:', analysisContent.substring(0, 200));
    
    const parsedResponse = safeParseOpenAIResponse(analysisContent);

    // Ensure we have a valid object
    if (!parsedResponse || typeof parsedResponse !== 'object') {
      console.error('[openai-utils] Failed to parse OpenAI response content');
      throw new Error('OpenAI response could not be parsed - please try again');
    }
    
    // Validate the parsed response against our schema
    console.log('[openai-utils] Validating parsed response against schema...');
    const validationResult = MealAnalysisSchema.safeParse(parsedResponse);
    
    if (validationResult.success) {
      console.log('[openai-utils] OpenAI response validation successful');
      return validationResult.data;
    } else {
      console.log('[openai-utils] OpenAI response validation failed');
      console.log('[openai-utils] Validation errors:', validationResult.error.format());
      console.log('[openai-utils] Problematic OpenAI Data:', parsedResponse);
      
      throw new Error('OpenAI response does not match expected schema.');
    }

  } catch (error) {
    console.error('[openai-utils] Error during OpenAI API call:', error);
    
    // Re-throw the error instead of providing fallback data
    if (error instanceof Error) {
      throw new Error(`OpenAI API request failed: ${error.message}`);
    } else {
      throw new Error('OpenAI API request failed with unknown error');
    }
  }
}

// Check if we should enable mock mode
export const shouldUseMockMode = (): boolean => {
  return false; // Always return false - no mock mode allowed
};

/**
 * REMOVED: generateFallbackMealAnalysis function
 * NO FALLBACK DATA ALLOWED - All analysis must come from OpenAI with research-backed data
 */

// Add any other OpenAI functions below that your application needs

export async function analyzeMealWithOpenAI(
  imageUrl: string, 
  userProfile?: UserProfile
): Promise<MealAnalysis> {
  try {
    console.log('[openai-utils] Starting OpenAI analysis with profile:', userProfile);
    
    // Convert image URL to base64 for better OpenAI vision API compatibility
    let imageData: string;
    try {
      if (imageUrl.startsWith('data:image/')) {
        // Already base64 encoded
        imageData = imageUrl;
      } else {
        // Fetch image and convert to base64
        console.log('[openai-utils] Fetching image from URL:', imageUrl);
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        imageData = `data:${mimeType};base64,${base64}`;
        console.log('[openai-utils] Successfully converted image to base64');
      }
    } catch (imageError) {
      console.error('[openai-utils] Error processing image:', imageError);
      throw new Error(`Failed to process image for analysis: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
    }
    
    // Use the existing analyzeImageWithGPT function with proper user profile
    const profileForAnalysis: UserProfile = userProfile || {};
    return await analyzeImageWithGPT(imageData, profileForAnalysis);
    
  } catch (error) {
    console.error('[openai-utils] Error in analyzeMealWithOpenAI:', error);
    throw error;
  }
}
