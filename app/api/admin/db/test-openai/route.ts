import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    // Get the API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "OpenAI API key is not configured"
      }, { status: 500 });
    }
    
    // Initialize the OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey
    });
    
    // Make a simple API call to check if the key is valid
    try {
      // Test with a simple text completion
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Hello, just checking if OpenAI API is working. Say 'YES' if you receive this message." }
        ],
        max_tokens: 10
      });
      
      const response = completion.choices[0]?.message?.content?.trim();
      
      if (response && (response.includes("YES") || response.includes("yes"))) {
        return NextResponse.json({
          success: true,
          message: "OpenAI API is working correctly"
        });
      } else {
        return NextResponse.json({
          success: false,
          error: "OpenAI API response validation failed",
          response
        });
      }
    } catch (apiError: any) {
      return NextResponse.json({
        success: false,
        error: `OpenAI API error: ${apiError.message}`,
        detail: apiError
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error("Error testing OpenAI API:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error"
    }, { status: 500 });
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Bypass-Middleware, X-Emergency-Recovery',
    },
  });
} 