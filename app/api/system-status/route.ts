import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface ServiceStatus {
  status: string;
  details: string | null;
}

interface EnvironmentVar {
  configured: boolean;
  is_placeholder: boolean;
  preview: string;
}

interface StatusResponse {
  timestamp: string;
  environment: string | undefined;
  services: {
    nextjs: ServiceStatus;
    supabase: ServiceStatus;
    openai: ServiceStatus;
  };
  environment_vars: {
    supabase_url: EnvironmentVar;
    supabase_anon_key: EnvironmentVar;
    supabase_service_key: EnvironmentVar;
    openai_key: EnvironmentVar;
  };
  recommendations: string[];
}

export async function GET() {
  const status: StatusResponse = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      nextjs: { status: 'ok', details: 'running' },
      supabase: { status: 'unknown', details: null },
      openai: { status: 'unknown', details: null }
    },
    environment_vars: {
      supabase_url: {
        configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        is_placeholder: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || false,
        preview: (process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50) || '') + '...'
      },
      supabase_anon_key: {
        configured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        is_placeholder: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes('placeholder') || false,
        preview: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) || '') + '...'
      },
      supabase_service_key: {
        configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        is_placeholder: process.env.SUPABASE_SERVICE_ROLE_KEY?.includes('placeholder') || false,
        preview: (process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || '') + '...'
      },
      openai_key: {
        configured: !!process.env.OPENAI_API_KEY,
        is_placeholder: process.env.OPENAI_API_KEY?.includes('placeholder') || false,
        preview: (process.env.OPENAI_API_KEY?.substring(0, 10) || '') + '...'
      }
    },
    recommendations: []
  };

  // Test Supabase connection if configured
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      // Simple connection test
      const { data, error } = await supabase.from('_temp_connection_test').select('*').limit(1);
      
      if (error && error.code === 'PGRST116') {
        // Table doesn't exist - this is expected, means connection works
        status.services.supabase = { status: 'ok', details: 'Connected successfully' };
      } else if (error) {
        status.services.supabase = { status: 'error', details: error.message };
      } else {
        status.services.supabase = { status: 'ok', details: 'Connected and accessible' };
      }
    } catch (error) {
      status.services.supabase = { 
        status: 'error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  } else {
    status.services.supabase = { 
      status: 'not_configured', 
      details: 'Supabase credentials are placeholder values' 
    };
  }

  // Test OpenAI connection if configured
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('placeholder')) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        status.services.openai = { status: 'ok', details: 'API key valid' };
      } else {
        const errorText = await response.text();
        status.services.openai = { 
          status: 'error', 
          details: `API error: ${response.status} - ${errorText.substring(0, 100)}` 
        };
      }
    } catch (error) {
      status.services.openai = { 
        status: 'error', 
        details: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  } else {
    status.services.openai = { 
      status: 'not_configured', 
      details: 'OpenAI API key is placeholder value' 
    };
  }

  // Generate recommendations
  if (status.environment_vars.supabase_url.is_placeholder) {
    status.recommendations.push('Configure real Supabase credentials in .env.local');
  }
  
  if (status.environment_vars.openai_key.is_placeholder) {
    status.recommendations.push('Configure real OpenAI API key in .env.local');
  }

  if (status.services.supabase.status === 'ok' && status.services.openai.status === 'ok') {
    status.recommendations.push('All services configured! Your app should be fully functional.');
  }

  return NextResponse.json(status, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
} 