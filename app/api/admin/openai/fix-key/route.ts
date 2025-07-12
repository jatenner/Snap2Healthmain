import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Ensure dynamic runtime to prevent caching
export const dynamic = 'force-dynamic';

/**
 * POST handler for fixing OpenAI API key format and testing functionality
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const results: any = {
      keyStatus: 'checking',
      modelTest: 'pending',
      visionTest: 'pending',
      timestamp: new Date().toISOString()
    };

    // Check if OpenAI API key exists
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      results.keyStatus = 'missing';
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not found in environment variables',
        results
      }, { status: 500 });
    }

    // Validate key format
    if (!apiKey.startsWith('sk-')) {
      results.keyStatus = 'invalid_format';
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key has invalid format - should start with sk-',
        results
      }, { status: 500 });
    }

    // Clean the API key (remove any line breaks or extra whitespace)
    const cleanedKey = apiKey.replace(/\s+/g, '').trim();
    
    results.keyStatus = 'valid';
    results.keyLength = cleanedKey.length;
    results.keyPrefix = cleanedKey.substring(0, 7) + '...';

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: cleanedKey,
      maxRetries: 2,
      timeout: 30000,
    });

    if (action === 'test_basic' || action === 'full_test') {
      console.log('[OpenAI Fix] Testing basic chat completion...');
      
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant. Respond with exactly 'OpenAI API is working correctly.'"
            },
            {
              role: "user",
              content: "Test message"
            }
          ],
          max_tokens: 20,
          temperature: 0,
        });

        const response = completion.choices[0]?.message?.content;
        if (response && response.includes('working correctly')) {
          results.modelTest = 'success';
          results.response = response;
        } else {
          results.modelTest = 'unexpected_response';
          results.response = response;
        }
      } catch (error: any) {
        results.modelTest = 'failed';
        results.modelError = error.message;
        
        // Provide specific error handling
        if (error.code === 'insufficient_quota') {
          results.modelError = 'OpenAI API quota exceeded. Please check your billing.';
        } else if (error.code === 'invalid_api_key') {
          results.modelError = 'Invalid OpenAI API key. Please check your configuration.';
        }
      }
    }

    if (action === 'test_vision' || action === 'full_test') {
      console.log('[OpenAI Fix] Testing vision capabilities...');
      
      try {
        // Create a simple test image (1x1 pixel PNG in base64)
        const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        
        const visionCompletion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "What do you see in this image? Respond with exactly 'Vision test successful.'"
                },
                {
                  type: "image_url",
                  image_url: {
                    url: testImage,
                    detail: "low"
                  }
                }
              ]
            }
          ],
          max_tokens: 20,
          temperature: 0,
        });

        const visionResponse = visionCompletion.choices[0]?.message?.content;
        if (visionResponse) {
          results.visionTest = 'success';
          results.visionResponse = visionResponse;
        } else {
          results.visionTest = 'no_response';
        }
      } catch (error: any) {
        results.visionTest = 'failed';
        results.visionError = error.message;
        
        if (error.code === 'insufficient_quota') {
          results.visionError = 'OpenAI API quota exceeded for vision model.';
        }
      }
    }

    // Return comprehensive results
    return NextResponse.json({
      success: true,
      message: 'OpenAI API configuration tested successfully',
      results,
      recommendations: generateRecommendations(results)
    });

  } catch (error: any) {
    console.error('[OpenAI Fix] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test OpenAI configuration',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET handler for quick status check
 */
export async function GET(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  return NextResponse.json({
    hasApiKey: !!apiKey,
    keyFormat: apiKey ? (apiKey.startsWith('sk-') ? 'valid' : 'invalid') : 'missing',
    keyLength: apiKey ? apiKey.replace(/\s+/g, '').trim().length : 0,
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    timestamp: new Date().toISOString()
  });
}

function generateRecommendations(results: any): string[] {
  const recommendations = [];
  
  if (results.keyStatus === 'missing') {
    recommendations.push('Add OPENAI_API_KEY to your environment variables');
  }
  
  if (results.keyStatus === 'invalid_format') {
    recommendations.push('Ensure your OpenAI API key starts with "sk-"');
  }
  
  if (results.modelTest === 'failed') {
    recommendations.push('Check your OpenAI API key validity and billing status');
  }
  
  if (results.visionTest === 'failed') {
    recommendations.push('Ensure your OpenAI account has access to GPT-4 Vision');
  }
  
  if (results.modelTest === 'success' && results.visionTest === 'success') {
    recommendations.push('✅ OpenAI configuration is working correctly!');
  }
  
  return recommendations;
} 