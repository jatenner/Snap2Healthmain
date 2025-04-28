import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { storeInSession } from '@/lib/session';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  console.log("API route called: /api/analyze-meal");
  
  try {
    // Log API key presence (not the actual key)
    console.log("OpenAI API Key present:", !!process.env.OPENAI_API_KEY);
    console.log("OpenAI Client initialized:", !!openai);
    
    // Parse the form data
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const mealName = formData.get('mealName') as string;
    const goal = formData.get('goal') as string;

    // Log the form data details
    console.log("Form data received:", {
      imagePresent: !!image,
      imageType: image?.type,
      imageSize: image?.size,
      mealName: mealName || 'Not provided',
      goal: goal || 'Not provided'
    });

    if (!image) {
      console.error("Error: No image provided in the request");
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert the file to base64
    console.log("Converting image to base64...");
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    const dataURI = `data:${image.type};base64,${base64Image}`;
    console.log("Image converted to base64 successfully. URI length:", dataURI.length);

    console.log("Sending request to OpenAI...");
    // Call OpenAI with detailed error handling
    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL_GPT_VISION || "gpt-4o",
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
      
      console.log("OpenAI response received successfully");
      // Parse the response
      const analysisText = completion.choices[0]?.message?.content;
      console.log("Analysis text received:", !!analysisText);
      
      if (!analysisText) {
        throw new Error("Empty response from OpenAI");
      }
      
      let analysis;
      try {
        analysis = JSON.parse(analysisText);
        console.log("Analysis parsed successfully:", Object.keys(analysis));
      } catch (e) {
        console.error("Failed to parse OpenAI response:", e);
        console.log("Raw response:", analysisText);
        analysis = {
          error: "Could not parse analysis",
          rawResponse: analysisText
        };
      }

      // Store data in session
      const mealData = {
        imageUrl: dataURI,
        mealName,
        goal,
        analysis
      };
      
      console.log("Storing data in session...");
      await storeInSession('mealData', mealData);
      console.log("Data stored in session successfully");
      
      // Return successful response
      return NextResponse.json({ success: true });
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError);
      // Check for specific OpenAI error types
      if (openaiError.status === 429) {
        return NextResponse.json(
          { error: "OpenAI rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      } else if (openaiError.status === 400) {
        return NextResponse.json(
          { error: `OpenAI request error: ${openaiError.message}` },
          { status: 400 }
        );
      } else {
        throw openaiError; // Re-throw to be caught by outer handler
      }
    }
  } catch (error) {
    // Detailed error logging for the outer try/catch
    console.error("Error processing request:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    // Send a helpful error message
    let errorMessage = "Failed to process image";
    if (error.message) {
      errorMessage += `: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 