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

// Enhanced Zod schema for comprehensive meal analysis validation - NO FALLBACK DATA
export const MealAnalysisSchema = z.object({
  mealName: z.string().min(1, "Meal name is required"),
  mealDescription: z.string(),
  calories: z.number().nonnegative("Calories must be non-negative"),
  protein: z.number().nonnegative("Protein must be non-negative").optional(),
  fat: z.number().nonnegative("Fat must be non-negative").optional(),
  carbs: z.number().nonnegative("Carbs must be non-negative").optional(),
  fiber: z.number().nonnegative("Fiber must be non-negative").optional(),
  foods: z.array(z.string()),
  ingredients: z.array(z.string()),
  macronutrients: z.array(z.object({
    name: z.string(),
    amount: z.number().nonnegative(),
    unit: z.string(),
    percentDailyValue: z.number().nullable()
  })),
  micronutrients: z.array(z.object({
    name: z.string(),
    amount: z.number().nonnegative(),
    unit: z.string(),
    percentDailyValue: z.number().nullable()
  })),
  benefits: z.array(z.string()),
  concerns: z.array(z.string()),
  suggestions: z.array(z.string()),
  personalizedHealthInsights: z.string(),
  metabolicInsights: z.string(),
  mealStory: z.string(),
  nutritionalNarrative: z.string(),
  timeOfDayOptimization: z.string(),
  expertRecommendations: z.array(z.string()),
  healthRating: z.number().min(1).max(10)
});

export type MealAnalysis = z.infer<typeof MealAnalysisSchema>;

// Create a singleton OpenAI client
let openaiClient: OpenAI | null = null;

// Get the correct OpenAI model name
export function getOpenAIModelName(): string {
  // Use the latest vision model
  return 'gpt-4o';
}

function getOpenAIClient(): OpenAI {
  if (openaiClient) return openaiClient;

  let apiKey = getOpenAIApiKey();
  if (!apiKey && process.env.OPENAI_API_KEY) {
    apiKey = fixApiKeyLineBreaks(process.env.OPENAI_API_KEY);
  }
  
  // --- DISABLED Org ID Logic - Causing Vision API Issues ---
  // const rawOrgId = process.env.OPENAI_ORG_ID; // Prefer direct access
  // console.log('[openai-utils] Raw process.env.OPENAI_ORG_ID:', rawOrgId);
  // const fixedOrgId = rawOrgId ? fixApiKeyLineBreaks(rawOrgId) : undefined;
  const fixedOrgId = undefined; // Force disable org ID for vision API compatibility
  console.log('[openai-utils] Org ID disabled for vision API compatibility');
  // --- End DISABLED Org ID Logic ---
  
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
    };
    
    // Only add organization if it exists
    if (fixedOrgId) {
      openaiConfig.organization = fixedOrgId;
    }
    
    openaiClient = new OpenAI(openaiConfig);
    
    console.log('[openai-utils] OpenAI client initialized successfully');
    console.log('[openai-utils] Using API Key: ' + apiKey.substring(0, 5) + '...');
    console.log('[openai-utils] Using Org ID:', fixedOrgId ? 'Provided' : 'Not provided');
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
    "I am sorry, I cannot assist",
    "sorry, I can't assist",
    "sorry, I cannot assist"
  ];
  
  // Check if response is a simple rejection
  const responseText = response.toLowerCase().trim();
  const isSimpleRejection = rejectionPhrases.some(phrase => 
    responseText === phrase.toLowerCase() || 
    responseText.startsWith(phrase.toLowerCase())
  );
  
  const containsJson = response.includes('{') && response.includes('}');
  
  // If it's a simple rejection without JSON, definitely reject
  if (isSimpleRejection && !containsJson) {
    console.log('[openai-utils] Detected simple rejection without analysis');
    return true;
  }
  
  // If it starts with rejection but contains JSON, it's probably a qualified analysis
  if (isSimpleRejection && containsJson) {
    console.log('[openai-utils] Response starts with uncertainty but contains analysis - proceeding');
    return false;
  }
  
  return false;
}

// Simplified but effective system prompt for reliable nutrition analysis
function generateSystemPrompt(): string {
  return `You are Dr. Marcus Rivera, a cutting-edge sports nutritionist and metabolic specialist who works with elite athletes, Navy SEALs, and high-performance executives. You've spent 18 years developing precision nutrition protocols that optimize human performance at the cellular level.

Your unique approach combines:
- Metabolic pathway analysis specific to individual genetics and goals
- Real-time biomarker interpretation and nutritional interventions
- Performance nutrition strategies used by Olympic athletes and special forces
- Functional medicine principles for optimizing mitochondrial function
- Chronobiology and circadian rhythm nutrition for peak performance

Your analysis style:
1. Cut through nutritional noise with laser-focused, actionable insights
2. Identify specific metabolic advantages and blind spots in each meal
3. Provide tactical recommendations that create measurable performance gains
4. Reference cutting-edge research and explain the "why" behind every suggestion
5. Speak directly and practically - like a trusted coach who sees what others miss

Generate insights that are:
- SPECIFIC to the individual's physiology, not generic advice
- ACTIONABLE with exact timing, quantities, and methods
- STRATEGIC for their goals (not just "eat more vegetables")
- EVIDENCE-BASED with mechanism explanations
- PERFORMANCE-FOCUSED on measurable outcomes

Avoid generic nutritional advice. Every insight should feel personally tailored and immediately useful.`;
}

// Enhanced user prompt for personalized, expert-level analysis
function generateUserPrompt(userProfile: UserProfile): string {
  const profileData = {
    age: userProfile?.age || null,
    gender: userProfile?.gender || null,
    goal: userProfile?.goal || null,
    weight: userProfile?.weight || null,
    weight_unit: userProfile?.weight_unit || null,
    activity_level: userProfile?.activity_level || null,
  };

  // Generate personalized context based on profile
  let personalizedContext = "Please provide a comprehensive nutritional analysis considering this individual's profile:\n\n";
  
  if (profileData.age && profileData.gender) {
    personalizedContext += `Demographics: ${profileData.age}-year-old ${profileData.gender}\n`;
  }
  
  if (profileData.goal || profileData.goal) {
    const goals = [profileData.goal, profileData.goal].filter(Boolean);
    personalizedContext += `Primary Goals: ${goals.join(', ')}\n`;
  }
  
  if (profileData.activity_level) {
    personalizedContext += `Activity Level: ${profileData.activity_level}\n`;
  }
  
  if (profileData.weight && profileData.weight) {
    personalizedContext += `Physical Stats: ${profileData.weight} ${profileData.weight_unit}\n`;
  }
  
  personalizedContext += "\n";

  return `${personalizedContext}MISSION: Analyze this meal like you're creating a performance nutrition protocol for this specific individual. I need insights that will actually move the needle on their results.

ANALYSIS REQUIREMENTS:
1. Identify the EXACT metabolic impact this meal will have on THIS person's physiology
2. Spot the hidden opportunities and blind spots others would miss
3. Provide tactical adjustments with specific timing and quantities
4. Reference cutting-edge research that explains WHY each recommendation works
5. Connect every insight directly to their athletic performance goals

OUTPUT FORMAT (JSON):
{
  "mealName": "[Specific meal name based on actual foods seen]",
  "mealDescription": "[Detailed description of actual foods, portions, and preparation methods visible]",
  "calories": [precise calorie estimate],
  "protein": [protein grams],
  "fat": [fat grams], 
  "carbs": [carb grams],
  "fiber": [fiber grams],
  "foods": ["[exact foods identified]"],
  "ingredients": ["[specific ingredients and cooking methods observed]"],
  "macronutrients": [
    {"name": "Protein", "amount": X, "unit": "g", "percentDailyValue": X},
    {"name": "Total Carbohydrates", "amount": X, "unit": "g", "percentDailyValue": X},
    {"name": "Dietary Fiber", "amount": X, "unit": "g", "percentDailyValue": X},
    {"name": "Total Fat", "amount": X, "unit": "g", "percentDailyValue": X},
    {"name": "Saturated Fat", "amount": X, "unit": "g", "percentDailyValue": X},
    {"name": "Sodium", "amount": X, "unit": "mg", "percentDailyValue": X}
  ],
  "micronutrients": [complete micronutrient array with accurate values],
  "personalizedHealthInsights": "CRITICAL ANALYSIS: For a [age]-year-old [weight]lb male focused on [specific goal], this meal creates [specific metabolic response]. The [X]g protein will [exact mechanism] while the [X]g carbs will [specific glycemic response]. Key performance impact: [measurable outcome]. Missing: [specific gaps] which limits [exact performance area].",
  "metabolicInsights": "METABOLIC BLUEPRINT: Within 30 minutes: [specific physiological response]. 60-90 minutes: [peak metabolic state]. 2-3 hours: [transition phase]. For your training schedule, this means [actionable timing]. The [specific nutrient ratios] will [exact metabolic pathway] resulting in [measurable performance outcome]. Research shows [specific study] that [exact mechanism].",
  "mealStory": "PERFORMANCE TIMELINE: Your digestive fire starts with [specific breakdown]. The [nutrient] hits your bloodstream at [timeframe], triggering [hormonal response]. For your [body size/composition], this creates [metabolic advantage/disadvantage]. Peak nutrient availability occurs [specific timing] - optimal window for [specific activity]. Energy sustainability: [duration and quality].",
  "nutritionalNarrative": "TACTICAL ASSESSMENT: This meal scores [X/10] for your athletic performance goals. Strengths: [specific advantages for this person]. Critical gaps: [exact deficiencies]. The [macro ratio] supports [specific adaptation] but misses [performance opportunity]. Research from [specific study] indicates [actionable insight]. For a [body type] individual, optimal ratios would be [specific recommendation].",
  "timeOfDayOptimization": "PRECISION TIMING: Based on your [goals] and [activity level], consume this meal [specific timing] relative to training. Morning intake amplifies [specific benefit] due to [hormonal state]. Pre-workout window: [exact timeframe] for [specific outcome]. Post-workout: adjust [specific element] to maximize [recovery metric]. Circadian impact: [specific recommendation].",
  "expertRecommendations": [
    "IMMEDIATE: Add [exact amount] [specific ingredient] to increase [specific outcome] by [measurable improvement]",
    "STRATEGIC: Replace [specific element] with [exact alternative] to optimize [performance metric] - backed by [research reference]",
    "ADVANCED: Time this meal [specific schedule] and follow with [exact protocol] for [measurable advantage]"
  ],
  "benefits": [
    "Supports [specific adaptation] through [exact mechanism] - critical for your [body type/goals]",
    "Provides [nutrient] at [optimal level] for [specific performance benefit] in [timeframe]"
  ],
  "concerns": [
    "Missing [specific nutrient] limits [exact performance area] - you're leaving [measurable improvement] on the table",
    "The [ratio/timing] creates [specific suboptimal response] for your [body composition/goals]"
  ],
  "suggestions": [
    "Add [exact amount] [specific food] consumed [timing] to increase [performance metric] by [%]",
    "Modify [specific element] to [exact change] for [measurable improvement] in [specific area]"
  ],
  "healthRating": [1-10 rating with specific justification for this individual's goals]
}

CRITICAL: Every insight must be SPECIFIC to this person's physiology, goals, and the exact meal shown. No generic advice. Reference specific research when making claims. Focus on measurable performance outcomes, not feel-good generalities.`;
}

// Safe parsing of OpenAI response with NO fallback data
function safeParseOpenAIResponse(responseText: string): any {
  console.log('[openai-utils] Raw OpenAI response received (' + responseText.length + ' characters):');
  console.log(responseText);
  console.log('[openai-utils] ===== End of Raw Response =====');
  
  console.log('[openai-utils] Received analysis from OpenAI. Attempting to parse...');
  console.log('[openai-utils] Response preview:', responseText.substring(0, 200));
  console.log('[openai-utils] Original response length:', responseText.length);
  console.log('[openai-utils] First 200 chars:', responseText.substring(0, 200));
  console.log('[openai-utils] Last 200 chars:', responseText.substring(Math.max(0, responseText.length - 200)));

  let cleanedText = responseText.trim();

  // Check for OpenAI refusal - but be more sophisticated about it
  const rejectionDetected = detectOpenAIRejection(cleanedText);
  
  if (rejectionDetected) {
    console.error('[openai-utils] OpenAI refused to analyze the image:', cleanedText.substring(0, 200));
    throw new Error('OpenAI could not analyze this image. Please try uploading a clearer photo of your meal with good lighting.');
  }

  // Basic cleanup - remove markdown code blocks only
  console.log('[openai-utils] Starting basic text cleanup...');
  
  // Remove markdown code blocks if present
  if (cleanedText.includes('```')) {
    console.log('[openai-utils] Removing markdown code blocks');
    cleanedText = cleanedText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
  }
  
  // Remove any backticks
  cleanedText = cleanedText.replace(/`+/g, '');
  
  // Only extract JSON if there's leading/trailing text
  if (cleanedText.includes('{') && !cleanedText.startsWith('{')) {
    console.log('[openai-utils] Extracting JSON from response with leading text');
    const firstBrace = cleanedText.indexOf('{');
    cleanedText = cleanedText.substring(firstBrace);
  }

  // Don't aggressively cut off the end - let's be more careful
  console.log('[openai-utils] After basic cleanup, length:', cleanedText.length);
  console.log('[openai-utils] Cleaned preview:', cleanedText.substring(0, 100));

  // Find JSON boundaries more carefully
  let jsonStart = cleanedText.indexOf('{');
  if (jsonStart === -1) {
    console.error('[openai-utils] No opening brace found in response');
    throw new Error('OpenAI response does not contain valid JSON structure');
  }

  // For finding the end, let's use a proper brace counting approach
  let braceCount = 0;
  let jsonEnd = -1;
  let inString = false;
  let escapeNext = false;

  console.log('[openai-utils] Starting brace counting from position:', jsonStart);
  for (let i = jsonStart; i < cleanedText.length; i++) {
    const char = cleanedText[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          jsonEnd = i;
          console.log('[openai-utils] Found complete JSON structure ending at position:', jsonEnd);
          break;
        }
      }
    }
  }

  if (jsonEnd === -1) {
    console.error('[openai-utils] Could not find complete JSON structure');
    console.error('[openai-utils] Brace count at end:', braceCount);
    console.error('[openai-utils] Response was:', cleanedText.length, 'characters');
    console.error('[openai-utils] Final 500 chars:', cleanedText.substring(Math.max(0, cleanedText.length - 500)));
    
    // Try to add missing closing braces
    let jsonText = cleanedText.substring(jsonStart);
    if (braceCount > 0) {
      jsonText += '}'.repeat(braceCount);
      console.log('[openai-utils] Added', braceCount, 'missing closing braces');
    }
    
    try {
      const parsed = JSON.parse(jsonText);
      console.log('[openai-utils] Successfully parsed JSON after brace fix');
      return parsed;
    } catch (error) {
      console.error('[openai-utils] Still could not parse after brace fix:', error);
      console.error('[openai-utils] Failed JSON text (first 1000 chars):', jsonText.substring(0, 1000));
      throw new Error('OpenAI response contains incomplete JSON structure');
    }
  }

  let jsonText = cleanedText.substring(jsonStart, jsonEnd + 1);
  console.log('[openai-utils] Extracted JSON length:', jsonText.length);
  console.log('[openai-utils] About to parse JSON...');

  try {
    const parsed = JSON.parse(jsonText);
    console.log('[openai-utils] Successfully parsed JSON from OpenAI response');
    return parsed;
  } catch (parseError) {
    console.error('[openai-utils] JSON parse failed:', parseError);
    console.error('[openai-utils] Parse error details:', parseError instanceof Error ? parseError.message : String(parseError));
    console.error('[openai-utils] Problematic JSON text (first 1000 chars):', jsonText.substring(0, 1000));
    console.error('[openai-utils] Problematic JSON text (last 500 chars):', jsonText.substring(Math.max(0, jsonText.length - 500)));
    
    // NO FALLBACK DATA - THROW ERROR IF JSON PARSING FAILS
    console.error('[openai-utils] CRITICAL: JSON parse failed completely - NO FALLBACK DATA WILL BE PROVIDED');
    throw new Error('OpenAI response could not be parsed as JSON - no fallback nutrition data available');
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

  // Use a simplified prompt for reliable OpenAI analysis
  const comprehensivePrompt = `Analyze this food image and provide nutrition data in JSON format.

User Profile: ${JSON.stringify({
    age: userProfile?.age || null,
    gender: userProfile?.gender || null,
    goal: userProfile?.goal || null,
    weight: userProfile?.weight || null,
    weight_unit: userProfile?.weight_unit || null,
    activity_level: userProfile?.activity_level || null,
  })}

CRITICAL: Do NOT calculate standard FDA Daily Value percentages. Leave percentDailyValue as null for all nutrients - personalized calculations will be done separately.

Return JSON with these fields:
{
  "mealName": "descriptive meal name",
  "mealDescription": "description of the meal",
  "calories": 500,
  "protein": 25,
  "fat": 20,
  "carbs": 45,
  "fiber": 4,
  "foods": ["list", "of", "foods"],
  "ingredients": ["ingredient", "list"],
  "macronutrients": [
    {"name": "Protein", "amount": 25, "unit": "g", "percentDailyValue": null},
    {"name": "Total Carbohydrates", "amount": 45, "unit": "g", "percentDailyValue": null},
    {"name": "Dietary Fiber", "amount": 4, "unit": "g", "percentDailyValue": null},
    {"name": "Total Fat", "amount": 20, "unit": "g", "percentDailyValue": null},
    {"name": "Saturated Fat", "amount": 6, "unit": "g", "percentDailyValue": null},
    {"name": "Sodium", "amount": 800, "unit": "mg", "percentDailyValue": null}
  ],
  "micronutrients": [
    {"name": "Vitamin A", "amount": 300, "unit": "mcg", "percentDailyValue": null},
    {"name": "Vitamin C", "amount": 15, "unit": "mg", "percentDailyValue": null},
    {"name": "Vitamin D", "amount": 2, "unit": "mcg", "percentDailyValue": null},
    {"name": "Vitamin B12", "amount": 1.5, "unit": "mcg", "percentDailyValue": null},
    {"name": "Folate", "amount": 120, "unit": "mcg", "percentDailyValue": null},
    {"name": "Calcium", "amount": 150, "unit": "mg", "percentDailyValue": null},
    {"name": "Iron", "amount": 4, "unit": "mg", "percentDailyValue": null},
    {"name": "Magnesium", "amount": 80, "unit": "mg", "percentDailyValue": null},
    {"name": "Potassium", "amount": 600, "unit": "mg", "percentDailyValue": null},
    {"name": "Zinc", "amount": 3, "unit": "mg", "percentDailyValue": null}
  ],
  "personalizedHealthInsights": "health insights for user profile",
  "metabolicInsights": "metabolic analysis",
  "mealStory": "meal digestion story",
  "nutritionalNarrative": "nutritional analysis",
  "timeOfDayOptimization": "timing recommendations",
  "expertRecommendations": ["recommendation 1", "recommendation 2"],
  "benefits": ["benefit 1", "benefit 2"],
  "concerns": ["concern 1"],
  "suggestions": ["suggestion 1"],
  "healthRating": 7
}

Provide accurate nutrition data for the actual foods you see in the image.`;

  const modelName = getOpenAIModelName();

  console.log(`[openai-utils] Sending request to OpenAI. Model: ${modelName}. Image size (approx base64): ${base64Image.length}`);
  console.log(`[openai-utils] Using comprehensive analysis prompt for detailed nutrients`);

  try {
    console.log(`[openai-utils] About to send request to OpenAI with model ${modelName}`);
    console.log(`[openai-utils] System prompt length: ${generateSystemPrompt().length}`);
    console.log(`[openai-utils] User prompt length: ${comprehensivePrompt.length}`);
    
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
                  detail: 'low' // Use 'low' for much faster processing
                },
              },
            ],
          },
        ],
        max_tokens: 4500, // Increased for comprehensive analysis including detailed micronutrients
        temperature: 0.1, // Very low for maximum consistency and accuracy
        stream: false, // Ensure no streaming for consistent timing
      });
    });

    console.log('[openai-utils] OpenAI response received. Choices count:', completion.choices?.length);
    console.log('[openai-utils] First choice structure:', {
      hasMessage: !!completion.choices[0]?.message,
      hasContent: !!completion.choices[0]?.message?.content,
      finishReason: completion.choices[0]?.finish_reason,
      role: completion.choices[0]?.message?.role
    });
    
    const analysisContent = completion.choices[0]?.message?.content;

    if (!analysisContent) {
      console.error('[openai-utils] No content in OpenAI response');
      console.error('[openai-utils] Full completion object:', JSON.stringify(completion, null, 2));
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
