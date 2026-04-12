/**
 * Image Analyzer — GPT-4o Vision meal analysis
 *
 * Extracted from the analyze-meal god file.
 * Handles: OpenAI call, retry logic, JSON parsing.
 */

import OpenAI from 'openai';

const NUTRITION_JSON_SCHEMA = `{
  "mealName": "descriptive name",
  "mealDescription": "1-2 sentence overview of what this meal is and its nutritional character",
  "consumptionType": "meal" | "beverage" | "supplement" | "snack",
  "calories": number, "protein": number, "carbs": number, "fat": number,
  "macronutrients": [
    {"name": "Protein", "amount": number, "unit": "g", "percentDailyValue": number},
    {"name": "Total Carbohydrates", "amount": number, "unit": "g", "percentDailyValue": number},
    {"name": "Total Fat", "amount": number, "unit": "g", "percentDailyValue": number},
    {"name": "Saturated Fat", "amount": number, "unit": "g", "percentDailyValue": number},
    {"name": "Fiber", "amount": number, "unit": "g", "percentDailyValue": number},
    {"name": "Sugar", "amount": number, "unit": "g", "percentDailyValue": number},
    {"name": "Sodium", "amount": number, "unit": "mg", "percentDailyValue": number},
    {"name": "Caffeine", "amount": number, "unit": "mg"},
    {"name": "Alcohol", "amount": number, "unit": "g"}
  ],
  "micronutrients": [25 vitamins/minerals with amount, unit, percentDailyValue],
  "foods": ["identified items"], "ingredients": ["main ingredients"],
  "benefits": ["specific benefit with mechanism — e.g. 'High leucine content supports muscle protein synthesis via mTOR signaling, especially effective within 2 hours of training'"],
  "concerns": ["specific concern with metabolic context — e.g. 'Refined carbs without fiber will spike blood glucose and insulin; pair with fat or vinegar to blunt the glycemic response'"],
  "suggestions": ["specific actionable upgrade — e.g. 'Add 100g spinach for magnesium (supports HRV and deep sleep) and folate at negligible caloric cost'"],
  "healthRating": number
}`;

const SYSTEM_PROMPT = "You are an elite performance nutritionist trained by Peter Attia and Andrew Huberman. Analyze images of food, beverages, or supplements. This includes meals, drinks (coffee, alcohol, smoothies, juice), supplement bottles/pills, protein shakes, and anything consumable. If you see a supplement bottle or label, read the label and extract the nutrient amounts. Assume the user consumed everything shown. Return comprehensive nutrition data in valid JSON format. For benefits and concerns, think like a longevity-focused physician: reference specific mechanisms (mTOR, AMPK, glycemic load, inflammatory pathways, sleep architecture, HRV impact, gut microbiome). For suggestions, give specific actionable upgrades with the expected physiological benefit. Never give generic advice like 'eat more vegetables'. Be precise and science-grounded.";

/**
 * Parse GPT response text into a JSON object.
 * Handles markdown code fences and raw JSON.
 */
export function parseGPTResponse(responseContent: string): any {
  if (!responseContent) throw new Error('Empty response from OpenAI API');

  if (responseContent.includes('ERROR') ||
      responseContent.includes("I can't see") ||
      responseContent.includes("I cannot see") ||
      responseContent.includes("unable to view")) {
    throw new Error('OpenAI Vision API cannot process the image');
  }

  let clean = responseContent.trim();
  if (clean.includes('```')) {
    const m = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (m?.[1]) clean = m[1];
  }

  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON object found in response');
  return JSON.parse(jsonMatch[0]);
}

/**
 * Analyze a food image using GPT-4o Vision.
 * Returns parsed nutrition JSON.
 */
export async function analyzeImageWithGPT(base64Image: string, userProfile: any = {}): Promise<any> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 3,
    timeout: 60000,
  });

  if (!base64Image.startsWith('data:image/')) {
    throw new Error('Invalid image format - must be data:image URL');
  }

  let lastError: any;
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image. It may show a meal, beverage, supplement, or any combination. Assume the user consumed ALL of what is shown.

If you see a supplement bottle or label, read the supplement facts panel and extract the exact nutrient amounts listed.

Provide comprehensive nutrition data in JSON format matching this structure:
${NUTRITION_JSON_SCHEMA}

IMPORTANT:
- For coffee/tea: estimate caffeine content (typical cup = 95mg caffeine)
- For alcohol: estimate grams of alcohol (one beer ~14g, one glass wine ~14g, one shot ~14g)
- For supplements: read the label if visible and extract exact amounts
- Caffeine and Alcohol amounts should be 0 if not present
- Omega-3, Tryptophan, Choline: estimate if food sources are present, 0 if not
- Benefits: 3-5 benefits that CITE THE ACTUAL NUMBERS from your analysis. Example: 'This meal delivers 42g protein (84% DV) — the high leucine content from eggs and chicken activates mTOR signaling for muscle protein synthesis, especially effective within 2 hours of resistance training.' Always include the specific gram/mg amount and % DV from this meal.
- Concerns: 2-4 concerns that reference THIS meal's actual amounts. Example: 'The 38g sugar (mostly from the sauce) will produce a significant glucose spike — with only 4g fiber, there is minimal glycemic buffering. Consider that this meal's 1,200mg sodium (52% DV) also promotes fluid retention that can elevate resting heart rate overnight.' Always cite the numbers.
- Suggestions: 2-3 upgrades referencing what THIS meal is missing. Example: 'This meal has 0mg omega-3 — adding 100g salmon or 15g walnuts would provide ~1.5g EPA/DHA to support anti-inflammatory pathways and HRV.' Always name a specific food, amount, and what it would change about this meal's nutritional profile.
- For micronutrients: ONLY include nutrients that are meaningfully present (amount > 0). Do NOT pad with zeros. A meal with 5 real micronutrients is better than 25 where 20 are zero.

Daily Values for calculations:
Protein: 50g, Carbs: 300g, Fat: 65g, Saturated Fat: 20g, Fiber: 25g, Sodium: 2300mg, Vitamin A: 900mcg, Vitamin C: 90mg, Vitamin D: 20mcg, Calcium: 1000mg, Iron: 18mg, Potassium: 4700mg, Magnesium: 400mg, Phosphorus: 1250mg, Zinc: 11mg, B1: 1.2mg, B2: 1.3mg, B3: 16mg, B6: 1.7mg, B12: 2.4mcg, Folate: 400mcg, Vitamin E: 15mg, Vitamin K: 120mcg, Choline: 550mg

Return ONLY valid JSON.`
              },
              { type: "image_url", image_url: { url: base64Image, detail: "high" } }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.1,
      });

      return parseGPTResponse(completion.choices[0]?.message?.content || '');

    } catch (error: any) {
      lastError = error;
      if (error.code === 'insufficient_quota' || error.code === 'invalid_api_key') break;
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  if (lastError?.code === 'insufficient_quota') throw new Error('OpenAI API quota exceeded. Please check your billing.');
  if (lastError?.code === 'invalid_api_key') throw new Error('Invalid OpenAI API key. Please check configuration.');
  if (lastError?.message?.includes('timeout')) throw new Error('Analysis is taking longer than expected. Please try with a smaller image or try again.');
  throw new Error(`OpenAI analysis failed: ${lastError?.message || 'Unknown error'}`);
}
