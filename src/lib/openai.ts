import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze a meal image using OpenAI's Vision model
 * This function extracts meal content, nutritional information, and health analysis
 */
export async function analyzeMealImage(imageSource: string | File, goal: string = 'balanced') {
  try {
    console.log('[analyzeMealImage] Analyzing meal with goal:', goal);
    
    // Convert File to Base64 if needed
    let imageData: string;
    
    if (typeof imageSource !== 'string') {
      // It's a File object
      try {
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
      // Regular URL
      imageData = imageSource;
      console.log('[analyzeMealImage] Using URL directly');
    }
    
    // Create the analysis prompt
    const prompt = `Analyze this food image and provide:
1. A brief description of what's in the image (caption)
2. A list of likely ingredients
3. Detailed nutritional analysis with:
   - Estimated calories
   - Macronutrient breakdown (protein, carbs, fats)
   - Key micronutrients
   - Health benefits
   - Potential health concerns

For the health analysis, consider this specific health goal: ${goal}

Return the information in a structured JSON format with these fields:
{
  "caption": "brief description of the meal",
  "ingredients": ["ingredient1", "ingredient2", ...],
  "analysis": {
    "calories": estimated_calories,
    "macronutrients": [
      {"name": "Protein", "amount": amount, "unit": "g"},
      {"name": "Carbohydrates", "amount": amount, "unit": "g"},
      {"name": "Fat", "amount": amount, "unit": "g"}
    ],
    "micronutrients": [
      {"name": "name", "amount": amount, "unit": "unit"}
    ],
    "benefits": ["benefit1", "benefit2", ...],
    "concerns": ["concern1", "concern2", ...],
    "recommendations": "specific recommendations based on the health goal"
  }
}

Make sure to format it as valid JSON.`;

    // Call OpenAI API
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
    
    // Extract JSON from the response (in case there's explanatory text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('[analyzeMealImage] Failed to extract JSON from response');
      throw new Error('Failed to parse analysis results');
    }
    
    const jsonStr = jsonMatch[0];
    
    try {
      // Parse the JSON result
      const analysisResult = JSON.parse(jsonStr);
      
      return {
        caption: analysisResult.caption || 'Food image',
        ingredients: analysisResult.ingredients || [],
        analysis: analysisResult.analysis || {},
      };
    } catch (parseError) {
      console.error('[analyzeMealImage] JSON parse error:', parseError);
      throw new Error('Failed to parse analysis results');
    }
  } catch (error: any) {
    console.error('[analyzeMealImage] OpenAI API error:', error);
    
    if (error.code === 'invalid_api_key') {
      throw { message: 'OpenAI API key is invalid or not provided', status: 401 };
    } else if (error.code === 'rate_limit_exceeded') {
      throw { message: 'Rate limit exceeded. Please try again later', status: 429 };
    }
    
    throw { message: error.message || 'Failed to analyze image', status: 500 };
  }
} 