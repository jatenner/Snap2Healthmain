// Environment configuration utility for Railway deployment
// This ensures environment variables are properly loaded across all API routes

export const getEnvConfig = () => {
  const config = {
    FORCE_DEV_MODE: process.env.FORCE_DEV_MODE,
    BYPASS_AUTH: process.env.BYPASS_AUTH, 
    NODE_ENV: process.env.NODE_ENV,
    // Log for debugging Railway deployment
    _debug: {
      hasForceDevMode: !!process.env.FORCE_DEV_MODE,
      hasBypassAuth: !!process.env.BYPASS_AUTH,
      nodeEnv: process.env.NODE_ENV,
      allEnvKeys: Object.keys(process.env).filter(key => 
        key.includes('FORCE') || key.includes('BYPASS') || key.includes('NODE_ENV')
      )
    }
  };
  
  console.log('[env-config] Railway environment check:', config._debug);
  return config;
};

export const shouldBypassAuth = (): boolean => {
  const env = getEnvConfig();
  const bypass = env.FORCE_DEV_MODE === 'true' || 
                 env.BYPASS_AUTH === 'true' || 
                 env.NODE_ENV === 'development';
  
  console.log('[env-config] Auth bypass decision:', {
    FORCE_DEV_MODE: env.FORCE_DEV_MODE,
    BYPASS_AUTH: env.BYPASS_AUTH,
    NODE_ENV: env.NODE_ENV,
    willBypass: bypass
  });
  
  return bypass;
}; 