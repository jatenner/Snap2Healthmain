import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * Check if the OpenAI API key is valid
 */
export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key is not configured'
      }, { status: 400 });
    }
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey
    });
    
    // Try to list models as a simple test
    const models = await openai.models.list();
    
    return NextResponse.json({
      success: true,
      model: process.env.OPENAI_MODEL_GPT_VISION || 'gpt-4o',
      modelsCount: models.data?.length || 0
    });
  } catch (error: any) {
    console.error('[API] OpenAI API check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'OpenAI API check failed'
    }, { status: 500 });
  }
} 