import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { storeInSession } from '@/lib/session';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const mealName = formData.get('mealName') as string;
    const goal = formData.get('goal') as string;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert the file to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    const dataURI = `data:${image.type};base64,${base64Image}`;

    // Analyze the meal with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this food image nutritionally. 
                     ${mealName ? `This is: ${mealName}.` : ''}
                     ${goal ? `My goal is: ${goal}.` : ''}
                     
                     Respond with a JSON object containing:
                     - calories (number)
                     - macronutrients (array of objects with name and amount)
                     - micronutrients (array of objects with name and amount)
                     - benefits (array of strings)
                     - concerns (array of strings)
                     - suggestions (array of strings for improvements)
                     
                     Keep the response succinct and focused on nutritional insights.`
            },
            {
              type: "image_url",
              image_url: { url: dataURI }
            }
          ]
        }
      ],
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

    // Parse the response
    const analysisText = completion.choices[0]?.message?.content || "{}";
    let analysis;
    
    try {
      analysis = JSON.parse(analysisText);
    } catch (e) {
      console.error("Failed to parse OpenAI response:", e);
      analysis = {};
    }

    // Store data in session
    const mealData = {
      imageUrl: dataURI,
      mealName,
      goal,
      analysis
    };
    
    await storeInSession('mealData', mealData);
    
    // Return successful response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
} 