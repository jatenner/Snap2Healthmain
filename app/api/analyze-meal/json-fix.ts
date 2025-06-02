/**
 * Enhanced JSON utilities for meal analysis
 */

/**
 * Safe JSON parsing with comprehensive fallback handling
 */
export function safeJsonParse(
  text: string, 
  fallback: any = {}, 
  options = { removeMarkdown: true }
): any {
  if (!text || typeof text !== 'string') {
    console.error('[json-fix] Invalid input text for JSON parsing');
    throw new Error('Invalid OpenAI response - no fallback data allowed');
  }

  let cleanedText = text.trim();
  console.log('[json-fix] Starting JSON parse, original length:', cleanedText.length);

  // Remove markdown if requested
  if (options.removeMarkdown) {
    if (cleanedText.includes('```json')) {
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/\s*```/g, '');
      console.log('[json-fix] Removed markdown JSON blocks');
    } else if (cleanedText.includes('```')) {
      cleanedText = cleanedText.replace(/```\s*/g, '').replace(/\s*```/g, '');
      console.log('[json-fix] Removed markdown blocks');
    }
  }

  // Check if response looks truncated
  if (cleanedText.length > 100) {
    const lastChar = cleanedText[cleanedText.length - 1];
    if (lastChar !== '}' && lastChar !== ']') {
      console.warn('[json-fix] Response appears truncated, last char:', lastChar);
      
      // Try to find the last complete object
      let lastCompleteObjectEnd = cleanedText.lastIndexOf('}');
      if (lastCompleteObjectEnd > 0) {
        // Count opening and closing braces to find balanced structure
        let braceCount = 0;
        let validEnd = -1;
        let inString = false;
        let escapeNext = false;
        
        for (let i = 0; i <= lastCompleteObjectEnd; i++) {
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
            if (char === '{') braceCount++;
            if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                validEnd = i;
              }
            }
          }
        }
        
        if (validEnd > 0 && validEnd < cleanedText.length) {
          cleanedText = cleanedText.substring(0, validEnd + 1);
          console.log('[json-fix] Truncated response recovered, new length:', cleanedText.length);
        } else {
          console.error('[json-fix] Could not recover truncated response, brace count:', braceCount);
          throw new Error('OpenAI response is truncated and cannot be recovered - no fallback data allowed');
        }
      } else {
        console.error('[json-fix] No valid JSON structure found');
        throw new Error('OpenAI response contains no valid JSON structure - no fallback data allowed');
      }
    }
  }

  // Remove any leading/trailing text that's not JSON
  const jsonStart = cleanedText.indexOf('{');
  const jsonEnd = cleanedText.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    const originalLength = cleanedText.length;
    cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
    if (originalLength !== cleanedText.length) {
      console.log('[json-fix] Extracted JSON from position', jsonStart, 'to', jsonEnd);
    }
  }

  // Additional cleanup for common issues
  cleanedText = cleanedText
    .replace(/,\s*}/g, '}')  // Remove trailing commas
    .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
    .replace(/'/g, '"')      // Replace single quotes with double quotes
    .replace(/\n/g, ' ')     // Replace newlines with spaces
    .replace(/\s+/g, ' ');   // Normalize whitespace

  console.log('[json-fix] Final cleaned text length:', cleanedText.length);
  
  try {
    const parsed = JSON.parse(cleanedText);
    console.log('[json-fix] Successfully parsed JSON');
    
    // Validate the parsed object has minimum required fields
    if (!isValidMealAnalysis(parsed)) {
      console.error('[json-fix] Parsed object missing required fields');
      console.log('[json-fix] Available fields:', Object.keys(parsed));
      throw new Error('OpenAI response missing required nutritional data - no fallback data allowed');
    }
    
    return parsed;
    
  } catch (error) {
    console.error('[json-fix] JSON parse failed after cleanup:', error);
    console.error('[json-fix] Problem text:', cleanedText.substring(0, 200) + '...');
    
    // NO FALLBACK DATA - throw error instead
    throw new Error('Unable to parse OpenAI response as valid JSON - no fallback data allowed');
  }
}

/**
 * Check if the parsed object contains minimum required meal analysis fields
 */
function isValidMealAnalysis(obj: any): boolean {
  const requiredFields = [
    'mealName', 'calories', 'protein', 'fat', 'carbs',
    'macronutrients', 'micronutrients', 'benefits', 'concerns'
  ];
  
  return requiredFields.every(field => 
    obj.hasOwnProperty(field) && 
    obj[field] !== null && 
    obj[field] !== undefined &&
    (typeof obj[field] !== 'string' || obj[field].trim().length > 0)
  );
}

export function createFallbackMealResponse() {
  throw new Error('Fallback meal responses are not allowed - only real OpenAI analysis permitted');
}
