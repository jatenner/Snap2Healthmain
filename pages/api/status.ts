import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  status: string;
  timestamp: string;
  env: {
    supabaseUrl: boolean;
    supabaseAnonKey: boolean;
    supabaseServiceRoleKey: boolean;
    openaiKey: boolean;
  };
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Check environment variables
  const envStatus = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    openaiKey: !!process.env.OPENAI_API_KEY
  };
  
  // Check if all required env vars are present
  const allEnvVarsPresent = Object.values(envStatus).every(Boolean);
  
  res.status(200).json({
    status: allEnvVarsPresent ? "ok" : "warning",
    timestamp: new Date().toISOString(),
    env: envStatus
  });
} 