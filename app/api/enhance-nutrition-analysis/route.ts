import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Enhanced nutrition analysis using GPT-4 for complete and accurate results
export async function POST(request: Request) {
  try {
    const { mealData, imageDescription } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create a comprehensive prompt for nutritional analysis
    const enhancedPrompt = `You are a leading nutrition scientist and registered dietitian with expertise in food composition analysis. Analyze this meal and provide a comprehensive, scientifically accurate nutritional breakdown.

MEAL: ${mealData?.mealName || imageDescription || 'food item'}
CONTEXT: User wants complete nutritional insights with all nutrients included

Please provide a detailed JSON analysis with the following structure:

{
  "mealName": "Clear descriptive name",
  "totalCalories": precise calorie estimate,
  "macronutrients": [
    {
      "name": "Protein",
      "amount": precise amount in grams,
      "unit": "g",
      "percentDailyValue": percentage based on 2000 calorie diet,
      "description": "Clear explanation of this nutrient's benefits",
      "category": "macronutrient"
    }
    // Include: Protein, Carbohydrates, Total Fat, Saturated Fat, Fiber, Sugars, Sodium
  ],
  "vitamins": [
    {
      "name": "Vitamin C",
      "amount": precise amount,
      "unit": "mg",
      "percentDailyValue": percentage based on FDA daily values,
      "description": "Health benefits and importance",
      "category": "vitamin"
    }
    // Include ALL detectable vitamins: A, D, E, K, C, B1, B2, B3, B5, B6, B7, B9, B12, even trace amounts
  ],
  "minerals": [
    {
      "name": "Calcium",
      "amount": precise amount,
      "unit": "mg", 
      "percentDailyValue": percentage based on FDA daily values,
      "description": "Health benefits and importance",
      "category": "mineral"
    }
    // Include ALL detectable minerals: Calcium, Iron, Magnesium, Phosphorus, Potassium, Zinc, Copper, Manganese, Selenium, Iodine, etc.
  ],
  "phytonutrients": [
    {
      "name": "Lycopene",
      "amount": estimated amount,
      "unit": "mg",
      "significance": "health benefit description",
      "foodSource": "where it's found in this meal"
    }
    // Include significant antioxidants and plant compounds
  ],
  "nutritionalHighlights": [
    "Top 5 most nutritionally significant aspects of this meal"
  ],
  "nutritionalGaps": [
    "Important nutrients that are missing or low in this meal"
  ],
  "completenessScore": score out of 100 for how nutritionally complete this meal is,
  "qualityScore": score out of 100 for overall nutritional quality,
  "improvements": [
    "Specific suggestions to make this meal more nutritionally complete"
  ],
  "healthBenefits": [
    "Key health benefits this meal provides"
  ]
}

CRITICAL REQUIREMENTS:
1. Be scientifically accurate - use established USDA food composition data
2. Include ALL detectable nutrients, even small amounts (aim for 25+ nutrients minimum)
3. Provide realistic estimates based on visible portion sizes
4. Calculate accurate daily value percentages using FDA standards
5. Identify specific nutritional gaps and missing nutrients
6. Give actionable suggestions for nutritional improvement
7. Consider nutrient bioavailability and food synergies
8. Account for cooking methods that affect nutrient content
9. Explain the reasoning behind completeness and quality scores
10. Focus on providing insights that rival professional nutrition analysis software

Be comprehensive and complete - this should provide a thorough nutritional picture.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: enhancedPrompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.1, // Low temperature for accuracy
    });

    const analysisText = completion.choices[0]?.message?.content;

    if (!analysisText) {
      throw new Error('No analysis content received from OpenAI');
    }

    // Parse the JSON response
    let enhancedAnalysis;
    try {
      // Extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        enhancedAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not extract JSON from response');
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      // Return a structured response even if parsing fails
      enhancedAnalysis = {
        mealName: mealData?.mealName || 'Analyzed Meal',
        error: 'Could not parse enhanced analysis',
        rawAnalysis: analysisText
      };
    }

    // Combine all nutrients into a single comprehensive list
    const allNutrients = [
      ...(enhancedAnalysis.macronutrients || []),
      ...(enhancedAnalysis.vitamins || []),
      ...(enhancedAnalysis.minerals || [])
    ];

    // Add comprehensive descriptions for better user understanding
    const enhancedNutrients = allNutrients.map(nutrient => ({
      ...nutrient,
      description: nutrient.description || getEnhancedNutrientDescription(nutrient.name)
    }));

    const response = {
      success: true,
      analysis: {
        ...enhancedAnalysis,
        allNutrients: enhancedNutrients,
        totalNutrients: enhancedNutrients.length,
        analysisTimestamp: new Date().toISOString(),
        sourceModel: 'gpt-4o',
        accuracyLevel: 'enhanced'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Enhanced nutrition analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to enhance nutritional analysis', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Enhanced nutrient descriptions for better user understanding
function getEnhancedNutrientDescription(nutrientName: string): string {
  const descriptions: Record<string, string> = {
    // Macronutrients
    'protein': 'Essential building blocks for muscle, immune system, and cellular repair. Critical for recovery and maintaining lean body mass.',
    'carbohydrates': 'Primary energy source for brain and muscle function. Choose complex carbs for sustained energy and stable blood sugar.',
    'total fat': 'Essential for hormone production, vitamin absorption, and cell health. Focus on healthy unsaturated fats.',
    'saturated fat': 'Should be limited to less than 10% of total calories to support cardiovascular health.',
    'fiber': 'Supports digestive health, blood sugar control, and satiety. Most adults need 25-35g daily.',
    'sugars': 'Quick energy source. Natural sugars from whole foods are preferable to added sugars.',
    'sodium': 'Essential for fluid balance but should be limited to 2300mg daily to support heart health.',

    // Vitamins
    'vitamin a': 'Critical for vision, immune function, and cell growth. Important for night vision and skin health.',
    'vitamin c': 'Powerful antioxidant supporting immune function, collagen synthesis, and iron absorption.',
    'vitamin d': 'Essential for bone health, immune function, and mood regulation. Many people are deficient.',
    'vitamin e': 'Antioxidant that protects cell membranes from oxidative damage.',
    'vitamin k': 'Essential for blood clotting and bone metabolism.',
    'vitamin b1': 'Thiamine supports energy metabolism and nervous system function.',
    'vitamin b2': 'Riboflavin is crucial for cellular energy production and metabolic processes.',
    'vitamin b3': 'Niacin supports energy metabolism, brain function, and cardiovascular health.',
    'vitamin b5': 'Pantothenic acid helps convert food into energy and supports hormone production.',
    'vitamin b6': 'Essential for amino acid metabolism, neurotransmitter synthesis, and immune function.',
    'vitamin b7': 'Biotin supports healthy hair, skin, nails, and energy metabolism.',
    'vitamin b9': 'Folate is critical for DNA synthesis, cell division, and preventing birth defects.',
    'vitamin b12': 'Essential for nerve function, red blood cell formation, and energy production.',

    // Minerals
    'calcium': 'Essential for bone and teeth health, muscle function, and nerve transmission.',
    'iron': 'Critical for oxygen transport, energy production, and preventing anemia.',
    'magnesium': 'Essential for over 300 enzymatic reactions, muscle function, and bone health.',
    'phosphorus': 'Works with calcium for bone health and is involved in energy storage and utilization.',
    'potassium': 'Critical for heart function, muscle contractions, and blood pressure regulation.',
    'zinc': 'Essential for immune function, wound healing, protein synthesis, and taste/smell.',
    'copper': 'Important for iron metabolism, connective tissue formation, and antioxidant function.',
    'manganese': 'Essential for bone development, wound healing, and antioxidant enzyme function.',
    'selenium': 'Powerful antioxidant that supports thyroid function and immune health.',
    'iodine': 'Essential for thyroid hormone production and metabolism regulation.',
    'chromium': 'May enhance insulin action and support glucose metabolism.',
    'molybdenum': 'Essential cofactor for enzymes involved in detoxification.'
  };

  const name = nutrientName.toLowerCase();
  
  // Direct match
  if (descriptions[name]) {
    return descriptions[name];
  }

  // Partial matches
  for (const [key, description] of Object.entries(descriptions)) {
    if (name.includes(key) || key.includes(name)) {
      return description;
    }
  }

  return 'Important nutrient that supports optimal health and body function.';
} 