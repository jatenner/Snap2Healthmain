import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      openAIKeyFormat: process.env.OPENAI_API_KEY ? 
        (process.env.OPENAI_API_KEY.startsWith('sk-') ? 'valid' : 'invalid') : 'missing',
      openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
      openAIModel: process.env.OPENAI_MODEL || 'not set',
      timestamp: new Date().toISOString()
    };

    // Test OpenAI connection (simple ping, no image analysis)
    let openaiStatus = 'not tested';
    if (process.env.OPENAI_API_KEY) {
      try {
        // Import OpenAI directly to test connection
        const OpenAI = (await import('openai')).default;
        const client = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        
        // Simple test - get models (doesn't use quota)
        const response = await client.models.list();
        openaiStatus = response.data.length > 0 ? 'connected' : 'no models';
      } catch (openaiError: any) {
        openaiStatus = `error: ${openaiError.message?.substring(0, 100)}`;
      }
    }

    return NextResponse.json({
      status: 'ok',
      environment: envCheck,
      openaiTest: openaiStatus,
      deploymentTime: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 