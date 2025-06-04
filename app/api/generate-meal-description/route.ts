import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI();

export async function POST(request: NextRequest) {
  try {
    const { mealName, ingredients } = await request.json();
    
    if (!mealName) {
      return NextResponse.json({ error: 'Missing meal name' }, { status: 400 });
    }
    
    // Create a prompt for generating a meal description
    const ingredientsList = ingredients && Array.isArray(ingredients) 
      ? ingredients.join(', ') 
      : 'various ingredients';
    
    const prompt = `
      Create a detailed, appetizing description for a dish called "${mealName}" 
      that contains ${ingredientsList}.
      
      The description should:
      - Be 1-2 sentences long
      - Describe the appearance and flavors
      - Highlight key ingredients
      - Be appetizing and professional
      - Not include nutritional information
      
      Return only the description text, without quotation marks or additional commentary.
    `;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a professional food writer creating accurate, appealing food descriptions.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 150,
    });
    
    // Extract the generated description
    const description = response.choices?.[0]?.message?.content?.trim();
    
    if (!description) {
      return NextResponse.json({ 
        error: 'Failed to generate description',
        description: `A delicious serving of ${mealName} with ${ingredientsList}.`
      }, { status: 500 });
    }
    
    // Return the generated description
    return NextResponse.json({ description });
    
  } catch (error) {
    console.error('Error generating meal description:', error);
    return NextResponse.json({ 
      error: 'Error generating description',
      description: 'A delicious meal prepared with fresh ingredients.'
    }, { status: 500 });
  }
}

// Make the route dynamic to prevent caching
export const dynamic = 'force-dynamic'; 