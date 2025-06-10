import { v4 as uuidv4 } from 'uuid';

/**
 * API Utilities
 * Shared functions for API routes and data handling
 */

/**
 * Checks if a string is a valid UUID v4
 */
export const isValidUUID = (str: string): boolean => {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Extract JSON from a string, including handling markdown code blocks
 */
export const extractJSON = (text: string): any => {
  if (!text) {
    console.error("Cannot extract JSON: text is null or empty");
    return null;
  }

  console.log("Attempting to extract JSON from text");
  
  // Step 1: Try to directly parse as JSON first (in case it's already clean JSON)
  try {
    return JSON.parse(text.trim());
  } catch (error) {
    console.log("Direct parse failed, trying to extract from markdown");
  }
  
  // Step 2: Remove markdown code block syntax
  try {
    let processedText = text.replace(/```(?:json)?[\s\n]*([\s\S]*?)```/g, '$1');
    processedText = processedText.trim();
    
    // Try to parse the cleaned text
    return JSON.parse(processedText);
  } catch (error) {
    console.error("Failed to parse cleaned text, trying more aggressive cleanup");
  }

  // Step 3: Look for JSON object pattern
  try {
    const jsonPattern = /{[\s\S]*}/;
    const match = text.match(jsonPattern);
    if (match) {
      const possibleJson = match[0];
      console.log("Found JSON-like object, attempting to parse");
      try {
        return JSON.parse(possibleJson);
      } catch (e) {
        console.error("Failed to parse JSON object:", e);
      }
    }
  } catch (error) {
    console.error("Failed to extract JSON object");
  }

  // Step 4: Try to extract a sample structure for common format
  console.log("Using manual extraction as fallback");
  try {
    return extractStructuredData(text);
  } catch (e) {
    console.error("Failed to extract structured data:", e);
    return null;
  }
};

/**
 * Extract structured data from text when JSON parsing fails
 */
const extractStructuredData = (text: string): any => {
  // For health review data
  if (text.includes("What You're Doing Well") || 
      text.includes("Areas for Improvement") || 
      text.includes("Smart Suggestions")) {
    
    const extractListItems = (section: string): string[] => {
      const sectionRegex = new RegExp(`${section}[:\\s]*(.*?)(?=(?:What You're Doing Well|Areas for Improvement|Smart Suggestions|$))`, 's');
      const match = text.match(sectionRegex);
      
      if (match && match[1]) {
        return match[1]
          .split(/\n\s*[-•*]\s*/)
          .map(item => item.trim())
          .filter(Boolean);
      }
      return [];
    };
    
    return {
      whatYoureDoingWell: extractListItems("What You're Doing Well"),
      whereYouCanImprove: extractListItems("Areas for Improvement"),
      gptSuggestions: extractListItems("Smart Suggestions")
    };
  }
  
  // Generic fallback
  return {
    error: "Could not parse response",
    rawText: text.substring(0, 500) + (text.length > 500 ? '...' : '')
  };
};

/**
 * Convert 'meal-{timestamp}' format to a proper UUID
 */
export const convertToUUID = (id: string): string => {
  if (isValidUUID(id)) return id;
  
  // Check if it's in the 'meal-timestamp' format
  if (id?.startsWith('meal-')) {
    // Create a deterministic UUID from the meal ID to ensure consistency
    const timestamp = id.replace('meal-', '');
    const namespacedId = `snap2health-meal-${timestamp}`;
    
    // Simple UUID v4 generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      // Use the timestamp part to generate a deterministic but UUID-valid string
      const r = (parseInt(timestamp) % 16) | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  // If it's neither a valid UUID nor in meal-timestamp format, generate a new UUID
  return crypto.randomUUID ? crypto.randomUUID() : 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
};

/**
 * Generate a valid UUID v4
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * Parse JSON safely from GPT response, handling markdown code blocks
 */
export function safeParseJSON(text: string): any {
  try {
    // Handle markdown code blocks from GPT
    if (text.includes('```json')) {
      // Extract JSON content between triple backticks
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1].trim());
      }
    }
    
    // Handle plain JSON
    return JSON.parse(text);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
}

/**
 * Clean up GPT response to make it valid JSON
 */
export function cleanGPTResponse(response: string): string {
  // Remove markdown code blocks
  if (response.includes('```json')) {
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      return jsonMatch[1].trim();
    }
  }
  
  // If no code blocks, return as is
  return response;
}

/**
 * Formats meal data from analysis for storage in the database
 * @param analysisResult - Raw analysis result from the AI
 * @param options - Additional options (imageUrl, userId, mealId)
 * @returns Formatted meal data
 */
export function formatMealForStorage(
  analysisResult: any, 
  options: { 
    imageUrl?: string; 
    userId?: string; 
    mealId?: string;
  }
) {
  const { imageUrl = '', userId = 'anonymous', mealId = '' } = options;
  
  // Ensure we have a valid analysis result object
  const analysis = analysisResult || {};
  
  // Extract fields from analysis result with robust fallbacks
  const mealName = analysis.mealName || analysis.meal_name || 'Unnamed Meal';
  const calories = typeof analysis.calories === 'number' ? analysis.calories : 
                  (typeof analysis.analysis?.calories === 'number' ? analysis.analysis.calories : 0);
  
  // Define nutrient type
  type Nutrient = {
    name: string;
    amount: number;
    unit: string;
    [key: string]: any;
  };
  
  // Define food item type
  type FoodItem = {
    name: string;
    [key: string]: any;
  };
  
  // Ensure macronutrients is an array with required properties
  let macronutrients: Nutrient[] = [];
  if (Array.isArray(analysis.macronutrients)) {
    macronutrients = analysis.macronutrients;
  } else if (Array.isArray(analysis.analysis?.macronutrients)) {
    macronutrients = analysis.analysis.macronutrients;
  } else {
    // Provide default macronutrients if missing
    macronutrients = [
      { name: "Protein", amount: 0, unit: "g" },
      { name: "Carbohydrates", amount: 0, unit: "g" },
      { name: "Fat", amount: 0, unit: "g" },
      { name: "Fiber", amount: 0, unit: "g" }
    ];
  }
  
  // Ensure micronutrients is an array
  let micronutrients: Nutrient[] = [];
  if (Array.isArray(analysis.micronutrients)) {
    micronutrients = analysis.micronutrients;
  } else if (Array.isArray(analysis.analysis?.micronutrients)) {
    micronutrients = analysis.analysis.micronutrients;
  }
  
  // Ensure foods is an array
  let foods: FoodItem[] = [];
  if (Array.isArray(analysis.foods)) {
    foods = analysis.foods;
  } else if (Array.isArray(analysis.analysis?.foods)) {
    foods = analysis.analysis.foods;
  } else if (typeof analysis.mealContents === 'string') {
    try {
      const parsed = JSON.parse(analysis.mealContents);
      foods = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      foods = [{ name: analysis.mealContents || "Unknown food" }];
    }
  } else if (Array.isArray(analysis.mealContents)) {
    foods = analysis.mealContents.map((item: any) => {
      if (typeof item === 'string') {
        return { name: item };
      }
      return item;
    });
  }
  
  // Extract insights with fallbacks
  const insights = analysis.insights || analysis.analysis?.insights || '';
  
  // Extract goal with fallbacks
  const goal = analysis.goal || analysis.analysis?.goal || 'General Health';
  
  // Ensure we have a valid UUID for the meal ID
  const finalMealId = mealId ? (isValidUUID(mealId) ? mealId : convertToUUID(mealId)) : generateUUID();
  
  // Format data according to database schema with proper type safety
  return {
    meal_name: mealName,
    name: mealName,
    mealName: mealName,
    calories,
    macronutrients,
    micronutrients,
    foods,
    insights,
    goal,
    user_id: userId,
    image_url: imageUrl,
    id: finalMealId,
    uuid: finalMealId,
    analysis: {
      ...analysis,
      calories,
      macronutrients,
      micronutrients,
      foods
    },
    // Let database handle timestamps with proper EST timezone
    // created_at and updated_at will be set by database DEFAULT NOW()
  };
}

/**
 * Validate meal analysis data against the expected schema
 */
export function validateMealAnalysisData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check if data exists
  if (!data) {
    errors.push('Meal analysis data is null or undefined');
    return { isValid: false, errors };
  }
  
  // Required fields
  if (!data.mealName) errors.push('Missing mealName field');
  if (typeof data.calories !== 'number') errors.push('Calories field must be a number');
  
  // Validate macronutrients
  if (!Array.isArray(data.macronutrients)) {
    errors.push('Macronutrients must be an array');
  } else if (data.macronutrients.length === 0) {
    errors.push('Macronutrients array is empty');
  } else {
    // Check if required macronutrients are present
    const requiredMacros = ['protein', 'carbs', 'fat'];
    const macroNames = data.macronutrients.map((m: any) => m.name?.toLowerCase());
    
    requiredMacros.forEach(macro => {
      if (!macroNames.includes(macro)) {
        errors.push(`Missing required macronutrient: ${macro}`);
      }
    });
    
    // Validate each macronutrient item
    data.macronutrients.forEach((macro: any, index: number) => {
      if (!macro.name) errors.push(`Macronutrient at index ${index} is missing name`);
      if (typeof macro.amount !== 'number') errors.push(`Macronutrient ${macro.name || `at index ${index}`} is missing amount as number`);
      if (!macro.unit) errors.push(`Macronutrient ${macro.name || `at index ${index}`} is missing unit`);
    });
  }
  
  // Validate micronutrients (if present)
  if (data.micronutrients && !Array.isArray(data.micronutrients)) {
    errors.push('Micronutrients must be an array');
  } else if (data.micronutrients && data.micronutrients.length > 0) {
    // Validate each micronutrient item
    data.micronutrients.forEach((micro: any, index: number) => {
      if (!micro.name) errors.push(`Micronutrient at index ${index} is missing name`);
      if (typeof micro.amount !== 'number') errors.push(`Micronutrient ${micro.name || `at index ${index}`} is missing amount as number`);
      if (!micro.unit) errors.push(`Micronutrient ${micro.name || `at index ${index}`} is missing unit`);
    });
  }
  
  // Check for insights
  if (!data.insights) errors.push('Missing insights field');
  
  return { 
    isValid: errors.length === 0, 
    errors 
  };
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - The function to retry
 * @param options - Options for retrying
 * @returns The result of the function
 */
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const { 
    maxRetries = 3, 
    baseDelayMs = 1000,
    onRetry = (attempt, error) => {
      console.warn(`Retry attempt ${attempt} after error:`, error);
    }
  } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Call the onRetry callback
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }
      
      // Calculate exponential backoff delay
      const delay = baseDelayMs * Math.pow(2, attempt);
      
      // Add jitter to avoid thundering herd
      const jitter = Math.random() * 100;
      
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }
  
  throw lastError || new Error('Maximum retries reached');
}

/**
 * Create a standardized meal analysis schema for database storage
 */
export function createMealAnalysisSchema(data: any): any {
  // Ensure we have at least a basic structure
  const mealData = data || {};
  
  return {
    uuid: mealData.id || mealData.uuid || generateUUID(),
    name: mealData.mealName || 'Analyzed Meal',
    image_url: mealData.imageUrl || mealData.image_url || '',
    calories: mealData.calories || 0,
    macronutrients: JSON.stringify(mealData.macronutrients || []),
    micronutrients: JSON.stringify(mealData.micronutrients || []),
    benefits: JSON.stringify(mealData.benefits || []),
    concerns: JSON.stringify(mealData.concerns || []),
    suggestions: JSON.stringify(mealData.suggestions || []),
    insights: mealData.insights || '',
    goal: mealData.goal || 'General Health',
    raw_analysis: JSON.stringify(data),
    // Let database handle timestamps with proper EST timezone
    // created_at and updated_at will be set by database DEFAULT NOW()
  };
}
