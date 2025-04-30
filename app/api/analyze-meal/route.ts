import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { saveMealToHistory } from '@/lib/meal-data';

export async function POST(request: NextRequest) {
  console.log('API route called: /api/analyze-meal');
  
  try {
    // Check if the OpenAI API key is present
    const openaiApiKey = process.env.OPENAI_API_KEY;
    console.log('OpenAI API Key present:', !!openaiApiKey);
    
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }
    
    // Use FormData to get the uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const mealName = formData.get('mealName') as string || 'Not provided';
    const goal = formData.get('goal') as string || 'Not provided';
    
    console.log('Form data received:', {
      imagePresent: !!file,
      imageType: file?.type,
      imageSize: file?.size,
      mealName,
      goal
    });
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }
    
    // Save the uploaded file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create a unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const filename = `${timestamp}-${randomId}-${file.name}`;
    const uploadDir = process.cwd() + '/public/uploads';
    
    // Ensure the uploads directory exists
    const fs = require('fs');
    const path = require('path');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Write the file
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);
    console.log(`Image saved successfully at: /uploads/${filename}`);
    
    // Convert image to base64 for OpenAI API
    console.log('Converting image to base64...');
    const base64Image = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64Image}`;
    console.log(`Image converted to base64 successfully. URI length: ${dataURI.length}`);
    
    // Call OpenAI API
    console.log('Sending request to OpenAI...');
    const { Configuration, OpenAIApi } = require('openai');
    
    // Initialize the OpenAI client
    const configuration = new Configuration({
      apiKey: openaiApiKey,
    });
    console.log('OpenAI Client initialized:', !!configuration);
    
    const openai = new OpenAIApi(configuration);
    
    // Make API call
    const response = await openai.createChatCompletion({
      model: process.env.OPENAI_MODEL_GPT_VISION || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a professional nutritionist analyzing food images. 
          Use the uploaded image to identify the food items, and provide detailed nutritional information.
          Format your response as a valid JSON object with the following structure:
          {
            "caption": "brief description of what's in the image",
            "ingredients": [{"name": "ingredient name", "quantity": "estimated quantity", "calories": estimated calories}],
            "analysis": {
              "calories": total calories as number,
              "macronutrients": [{"name": "protein", "amount": 20, "unit": "g", "percentDailyValue": 40}, ...],
              "micronutrients": [{"name": "vitamin C", "amount": 15, "unit": "mg", "percentDailyValue": 25}, ...],
              "benefits": ["benefit 1", "benefit 2", ...],
              "concerns": ["concern 1", "concern 2", ...],
              "suggestions": ["suggestion 1", "suggestion 2", ...]
            }
          }`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Analyze this food image. User's health goal: ${goal}` },
            { type: 'image_url', image_url: { url: dataURI } }
          ]
        }
      ],
      max_tokens: 1500
    });
    
    console.log('OpenAI response received successfully');
    
    // Parse the analysis result
    let analysisText = response.data.choices[0].message.content;
    console.log('Analysis text received:', !!analysisText);
    
    let analysisData = null;
    
    try {
      // Extract JSON from the response if it's wrapped in markdown code blocks
      if (analysisText.includes('```json')) {
        analysisText = analysisText.split('```json')[1].split('```')[0].trim();
      } else if (analysisText.includes('```')) {
        analysisText = analysisText.split('```')[1].split('```')[0].trim();
      }
      
      analysisData = JSON.parse(analysisText);
      console.log('Analysis parsed successfully:', Object.keys(analysisData));
    } catch (error) {
      console.error('Error parsing analysis:', error);
      return NextResponse.json(
        { error: 'Failed to parse analysis result' },
        { status: 500 }
      );
    }
    
    // Create the full meal data object
    const mealData = {
      imageUrl: `/uploads/${filename}`,
      mealName: mealName || 'Food Analysis',
      goal: goal || 'General Wellness',
      analysis: analysisData.analysis,
      mealContents: analysisData.ingredients || {}
    };
    
    // Store the analysis in the user's session
    console.log('Storing data in session...');
    
    // Get Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Store meal data in a custom session table or use a cookie
    // Instead of trying to modify the auth session, we'll use a cookie
    const serializedMealData = JSON.stringify(mealData);
    
    // Set cookie with meal data (expires in 24 hours)
    cookies().set({
      name: 'meal_analysis_data',
      value: serializedMealData,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
    });
    
    console.log('Successfully stored mealData in cookie');
    
    // Save meal to history
    try {
      const result = await saveMealToHistory(mealData);
      if (result.success) {
        console.log('Meal saved to history successfully, ID:', result.mealId);
      } else {
        console.warn('Failed to save meal to history');
      }
    } catch (error) {
      console.error('Error saving meal to history:', error);
      // Continue anyway - we'll show the result even if saving fails
    }
    
    console.log('Data stored in session successfully');
    
    // Return success response with the image URL
    return NextResponse.json({
      success: true,
      imageUrl: `/uploads/${filename}`,
      mealName: mealName,
      redirectTo: '/meal-analysis'
    });
  } catch (error: any) {
    console.error('Error processing request:', error.message);
    return NextResponse.json(
      { error: 'Failed to process image: ' + error.message },
      { status: 500 }
    );
  }
} 