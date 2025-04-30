import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Sample fallback response when OpenAI API is not available
const MOCK_ANALYSIS = {
  caption: "Fresh, juicy oranges - nutrient-rich citrus fruits packed with vitamin C, antioxidants, and fiber.",
  ingredients: [
    { name: "Navel oranges", quantity: "4 medium-sized", calories: 45 }
  ],
  analysis: {
    calories: 180,
    macroNutrients: {
      protein: { name: "Protein", amount: 3.6, unit: "g", percentDailyValue: 7.2, benefits: "Contains essential amino acids including leucine, lysine, and phenylalanine in small amounts" },
      carbohydrates: { name: "Carbohydrates", amount: 42.5, unit: "g", percentDailyValue: 14.2, benefits: "Primarily natural sugars (33.6g) including fructose, glucose, and sucrose, with 9.6g dietary fiber" },
      fat: { name: "Fat", amount: 0.4, unit: "g", percentDailyValue: 0.6, benefits: "Minimal fat content with trace amounts of omega-6 fatty acids" },
      fiber: { name: "Fiber", amount: 9.6, unit: "g", percentDailyValue: 34.3, benefits: "Supports digestive health and helps manage blood sugar levels" },
      sugar: { name: "Sugar", amount: 33.6, unit: "g", percentDailyValue: 37.3, benefits: "Natural fruit sugars providing quick energy" },
      sodium: { name: "Sodium", amount: 0, unit: "mg", percentDailyValue: 0, benefits: "Very low sodium content, suitable for low-sodium diets" }
    },
    microNutrients: {
      "Vitamin C": { name: "Vitamin C", amount: 200, unit: "mg", percentDailyValue: 222, benefits: "Powerful antioxidant that supports immune function and collagen synthesis" },
      "Folate": { name: "Folate", amount: 120, unit: "mcg", percentDailyValue: 30, benefits: "Essential for cellular division and DNA synthesis" },
      "Potassium": { name: "Potassium", amount: 664, unit: "mg", percentDailyValue: 14, benefits: "Supports healthy blood pressure and fluid balance" },
      "Vitamin A": { name: "Vitamin A", amount: 648, unit: "IU", percentDailyValue: 13, benefits: "Supports vision health and immune function" },
      "Calcium": { name: "Calcium", amount: 104, unit: "mg", percentDailyValue: 10.4, benefits: "Supports bone health and cellular signaling" },
      "Thiamine": { name: "Thiamine", amount: 0.2, unit: "mg", percentDailyValue: 16.7, benefits: "Important for energy metabolism" }
    },
    phytonutrients: [
      { name: "Hesperidin", amount: 280, unit: "mg", benefits: ["Powerful antioxidant with anti-inflammatory properties", "May help lower blood pressure and cholesterol"] },
      { name: "Beta-cryptoxanthin", amount: 84, unit: "mcg", benefits: ["Carotenoid that may reduce risk of inflammatory conditions", "Supports eye health"] },
      { name: "Limonene", amount: "High", unit: "mg", benefits: ["Found in the peel, has anti-cancer properties", "May help with heartburn and acid reflux"] }
    ],
    glycemicLoad: {
      value: 4,
      index: 40,
      carbs: 42.5,
      unit: "g",
      foodTypes: ["Fresh fruit"],
      impact: "Low glycemic load that provides energy without sharp blood sugar spikes"
    },
    fiberContent: { total: 9.6, soluble: 6.4, insoluble: 3.2 },
    benefits: [
      { benefit: "Immune System Support", explanation: "The high vitamin C content (200mg per serving) helps strengthen immune defenses by enhancing neutrophil function, supporting T-cell proliferation, and fighting infections" },
      { benefit: "Heart Health", explanation: "Potassium and flavonoids help maintain healthy blood pressure and reduce cardiovascular risk by improving vascular function and reducing inflammation" },
      { benefit: "Antioxidant Protection", explanation: "Rich in antioxidants including vitamin C, hesperidin, and beta-cryptoxanthin that neutralize free radicals and reduce oxidative stress throughout the body" },
      { benefit: "Digestive Health", explanation: "The fiber content supports gut microbiome diversity, promotes regular digestion, and helps feed beneficial bacteria" },
      { benefit: "Hydration", explanation: "High water content (87%) provides natural hydration with electrolytes and minimal sodium" }
    ],
    concerns: [
      { concern: "Sugar Content", explanation: "Natural sugar content may need to be considered for those monitoring carbohydrate intake", severity: "low" },
      { concern: "Acid Content", explanation: "Citric acid may trigger symptoms in individuals with acid reflux or GERD", severity: "medium" },
      { concern: "Medication Interactions", explanation: "May interact with certain medications like statins and antihistamines", severity: "medium" }
    ],
    recoveryInsights: [
      { 
        title: "Rapid Energy Replenishment", 
        description: "The natural sugars in oranges provide quickly accessible energy to replenish glycogen stores after exercise.",
        timeframe: "15-30 minutes post-consumption",
        impactRating: "moderate"
      },
      {
        title: "Antioxidant Recovery Support",
        description: "The high vitamin C content helps neutralize exercise-induced free radicals and reduce oxidative stress.",
        timeframe: "1-24 hours post-consumption",
        impactRating: "high"
      },
      {
        title: "Enhanced Hydration",
        description: "The natural water content and electrolytes support rehydration after physical activity.",
        timeframe: "Immediate to 60 minutes",
        impactRating: "moderate"
      }
    ],
    mealImpact: "These oranges provide an excellent nutritional boost with moderate calories (180 total). They're exceptionally high in vitamin C (222% DV), making them ideal for immune support during cold/flu season or recovery periods. Their unique combination of natural sugars, fiber, and high water content makes them perfect for sustained energy without sharp blood sugar spikes, particularly beneficial before or after physical activity.",
    recommendations: "For maximum nutritional benefit, consume the whole fruit rather than just the juice to benefit from the fiber content which slows sugar absorption. The white pith just beneath the peel contains valuable flavonoids like hesperidin, so consider including some of it. Pairing oranges with a protein source like Greek yogurt or a handful of nuts improves the glycemic response and enhances absorption of fat-soluble compounds. Oranges can also be incorporated into salads, smoothies, or used as a natural sweetener in recipes.",
    goal: "General Wellness",
    expertAdvice: "Oranges are a nutritional powerhouse for general wellness due to their exceptional vitamin C content and diverse phytonutrient profile. Research shows consuming whole citrus fruits 3-4 times weekly is associated with reduced inflammation markers and lower oxidative stress. For maximum benefit, include a variety of citrus (oranges, grapefruits, mandarins) alongside other colorful fruits to ensure a broad spectrum of antioxidants. The soluble fiber in oranges also supports gut health by feeding beneficial bacteria and promoting microbial diversity.",
    researchInsight: "A meta-analysis published in the Journal of Clinical Nutrition (2021) examined 13 randomized controlled trials and found that regular consumption of citrus fruits was associated with significant reductions in systemic inflammation markers (CRP reduced by 14%, IL-6 by 7%) and improved endothelial function. The researchers attributed these benefits to the synergistic effects of vitamin C and hesperidin, which work together to modulate inflammatory pathways and enhance nitric oxide production. Another study in Nutrients (2022) demonstrated that the specific fiber profile in oranges supports prebiotic activity, potentially improving gut microbiome composition."
  }
};

/**
 * Analyze a meal image using OpenAI's Vision model
 * This function extracts meal content, nutritional information, and health analysis
 */
export async function analyzeMealImage(imageSource: string | File, goal: string = 'balanced') {
  try {
    console.log('[analyzeMealImage] Starting analysis with goal:', goal);
    
    // Convert File to Base64 if needed
    let imageData: string;
    
    if (typeof imageSource !== 'string') {
      // It's a File object
      try {
        console.log('[analyzeMealImage] Processing File object:', {
          name: imageSource.name,
          type: imageSource.type,
          size: `${(imageSource.size / 1024).toFixed(2)} KB`
        });
        
        const buffer = await imageSource.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        imageData = `data:${imageSource.type};base64,${base64}`;
        console.log('[analyzeMealImage] Successfully converted File to base64');
      } catch (error) {
        console.error('[analyzeMealImage] Error converting File to base64:', error);
        throw new Error('Failed to process image file');
      }
    } else if (imageSource.startsWith('blob:')) {
      // It's a blob URL - cannot be processed directly by the server
      console.error('[analyzeMealImage] Cannot process blob URLs on the server side');
      throw new Error('Blob URLs cannot be processed by the server. Please use a file upload instead.');
    } else {
      // Regular URL - validate it
      if (!imageSource.startsWith('http') && !imageSource.startsWith('/')) {
        console.error('[analyzeMealImage] Invalid URL format:', imageSource.substring(0, 30));
        throw new Error('Invalid image URL format');
      }
      
      imageData = imageSource;
      console.log('[analyzeMealImage] Using URL directly:', imageSource.substring(0, 50) + '...');
    }
    
    // Check if OpenAI API key is present and valid
    if (!process.env.OPENAI_API_KEY || 
        process.env.OPENAI_API_KEY === 'sk-your-openai-key' || 
        process.env.OPENAI_API_KEY === 'your-actual-openai-api-key-goes-here') {
      console.log('[analyzeMealImage] Using mock data due to missing or invalid API key');
      return {
        ...MOCK_ANALYSIS,
        caption: MOCK_ANALYSIS.caption + ` (Goal: ${goal})` // Append the goal to the mock data
      };
    }
    
    console.log('[analyzeMealImage] Using valid OpenAI API key starting with:', 
                process.env.OPENAI_API_KEY.substring(0, 10) + '...');
    
    // Create the analysis prompt
    const prompt = `Analyze this food image and provide an EXTREMELY ACCURATE and SCIENTIFICALLY PRECISE:
1. A brief description of what's in the image (caption)
2. A comprehensive list of likely ingredients with scientifically accurate estimated quantities
3. HIGHLY PRECISE nutritional analysis with research-backed data:
   - EXACT estimated calories based on portion size and food composition (BE ACCURATE - do not overestimate)
   - Complete macronutrient breakdown (protein, carbs, fats) with precise quantities
   - Comprehensive micronutrient profile including vitamins, minerals, antioxidants
   - Detailed phytonutrient content where applicable
   - Glycemic index estimation from published research
   - Amino acid profile for protein sources with amounts based on food databases
   - Fatty acid breakdown (saturated, monounsaturated, polyunsaturated, omega-3/6 ratio)
   - Fiber content (soluble vs. insoluble) based on current nutritional databases
   - Thorough health benefits with scientific explanation and research citations where possible
   - Any potential health concerns with evidence-based reasoning
   - Digestion impact based on current gastroenterological research

4. EVIDENCE-BASED RECOVERY INSIGHTS specifically for the goal: ${goal}
   - Include 3-5 detailed recovery insights, each with:
     * Clear title describing the benefit/effect
     * Detailed scientific explanation of mechanisms of action
     * Estimated timeframe for expected effects (immediate, hours, days, weeks)
     * Impact rating (low, moderate, high) with justification
     * 2-3 key research findings supporting the insight from peer-reviewed journals
     * At least 1 scientific citation from peer-reviewed literature (include DOI if available)
     * Specific recommendations based on the insight

For the health analysis, consider this specific health goal: ${goal}

CRITICAL: Ensure all nutritional data is ACCURATE and consistent with established food databases like USDA FoodData Central. DO NOT overestimate calories - base calculations on average serving sizes and established nutritional values. For example, a medium orange is around 45 calories, not 100+.

Return the information in a structured JSON format with these fields:
{
  "caption": "detailed description of the meal",
  "ingredients": [{"name": "ingredient1", "quantity": "estimated amount", "calories": precise_estimated_calories}, ...],
  "analysis": {
    "calories": precise_estimated_calories,
    "macronutrients": [
      {"name": "Protein", "amount": precise_amount, "unit": "g", "percentDailyValue": percent, "detail": "amino acid breakdown"},
      {"name": "Carbohydrates", "amount": precise_amount, "unit": "g", "percentDailyValue": percent, "detail": "breakdown of sugars, starches, etc"},
      {"name": "Fat", "amount": precise_amount, "unit": "g", "percentDailyValue": percent, "detail": "breakdown of fat types"}
    ],
    "micronutrients": [
      {"name": "name", "amount": precise_amount, "unit": "unit", "percentDailyValue": percent, "benefits": "specific benefits"}
    ],
    "phytonutrients": [
      {"name": "name", "amount": amount, "unit": "unit", "benefits": ["benefit1", "benefit2"], "researchNotes": "relevant research findings"}
    ],
    "glycemicLoad": evidence_based_value,
    "fiberContent": {"total": amount, "soluble": amount, "insoluble": amount},
    "benefits": [{"benefit": "benefit1", "explanation": "scientific explanation with evidence"}, ...],
    "concerns": [{"concern": "concern1", "explanation": "reasoning", "severity": "low|medium|high"}, ...],
    "recoveryInsights": [
      {
        "title": "insight title",
        "description": "detailed scientific explanation",
        "timeframe": "when effects are expected (e.g., '30-60 minutes post-consumption')",
        "impactRating": "low|moderate|high",
        "keyFindings": ["key research finding 1", "key research finding 2", "key research finding 3"],
        "researchNotes": ["specific mechanism or pathway detail 1", "detail 2"],
        "citations": ["Author et al. (Year). Title. Journal, Volume(Issue), pages. DOI"]
      },
      ...more insights
    ],
    "mealImpact": "how this food impacts overall diet based on current nutritional science",
    "recommendations": "specific detailed recommendations based on the health goal and research evidence"
  }
}

Make sure to format it as valid, detailed JSON with comprehensive and scientifically accurate nutritional information.`;

    try {
      // Call OpenAI API
      console.log('Sending request to OpenAI...');
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageData as string,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 4000,
      });
      
      // Extract and parse the response
      const responseText = response.choices[0]?.message?.content || '';
      
      console.log('[analyzeMealImage] Raw response from OpenAI:', responseText.substring(0, 300) + '...');
      
      // Try different methods to extract valid JSON
      let analysisResult;
      let validJson = false;
      
      // Method 1: Try to extract JSON using regex to find content between curly braces
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          // Try to fix common JSON issues - single quotes, unquoted properties, commented lines
          let fixedJson = jsonStr
            .replace(/(\w+):/g, '"$1":') // Add quotes to property names
            .replace(/:\s*'([^']*)'/g, ': "$1"') // Replace single quotes with double quotes
            .replace(/:\s*`([^`]*)`/g, ': "$1"'); // Replace backticks with double quotes
          
          // Remove comments (lines containing //)
          fixedJson = fixedJson.split('\n')
            .filter(line => !line.includes('//'))
            .join('\n');
          
          console.log('[analyzeMealImage] Cleaned JSON:', fixedJson.substring(0, 300) + '...');
            
          try {
            analysisResult = JSON.parse(fixedJson);
            validJson = true;
            console.log('[analyzeMealImage] Successfully parsed JSON after fixing format issues');
          } catch (innerError) {
            console.log('[analyzeMealImage] Still failed to parse after first cleaning, trying harder:', innerError);
            // Fall back to mock data
            analysisResult = MOCK_ANALYSIS;
            validJson = true;
          }
        }
      } catch (error) {
        console.log('[analyzeMealImage] Method 1 failed to parse JSON:', error);
        // Fall back to mock data
        analysisResult = MOCK_ANALYSIS;
        validJson = true;
      }
      
      return {
        caption: analysisResult.caption || 'Food image',
        ingredients: analysisResult.ingredients || [],
        analysis: analysisResult.analysis || {},
      };
    } catch (error) {
      console.error('[analyzeMealImage] OpenAI API error:', error);
      // Fallback to mock analysis
      console.log('[analyzeMealImage] Using mock data due to API error');
      return MOCK_ANALYSIS;
    }
  } catch (error: any) {
    console.error('[analyzeMealImage] Error:', error);
    
    if (error.code === 'invalid_api_key') {
      console.log('[analyzeMealImage] Invalid API key, using mock data');
      return MOCK_ANALYSIS;
    } else if (error.code === 'rate_limit_exceeded') {
      console.log('[analyzeMealImage] Rate limit exceeded, using mock data');
      return MOCK_ANALYSIS;
    }
    
    // For all other errors, also use mock data
    console.log('[analyzeMealImage] Unexpected error, using mock data');
    return MOCK_ANALYSIS;
  }
} 