// Environment configuration utility for Railway deployment
// This ensures environment variables are properly loaded across all API routes

export const getEnvConfig = () => {
  const config = {
    FORCE_DEV_MODE: process.env.FORCE_DEV_MODE,
    BYPASS_AUTH: process.env.BYPASS_AUTH, 
    NODE_ENV: process.env.NODE_ENV,
    RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
    // Log for debugging Railway deployment
    _debug: {
      hasForceDevMode: !!process.env.FORCE_DEV_MODE,
      hasBypassAuth: !!process.env.BYPASS_AUTH,
      nodeEnv: process.env.NODE_ENV,
      isRailway: !!process.env.RAILWAY_ENVIRONMENT,
      allEnvKeys: Object.keys(process.env).filter(key => 
        key.includes('FORCE') || key.includes('BYPASS') || key.includes('NODE_ENV') || key.includes('RAILWAY')
      )
    }
  };
  
  console.log('[env-config] Railway environment check:', config._debug);
  return config;
};

export const shouldBypassAuth = (): boolean => {
  const env = getEnvConfig();
  
  // For Railway production, be more selective about auth bypass
  const isRailwayProd = !!process.env.RAILWAY_ENVIRONMENT && process.env.NODE_ENV === 'production';
  
  if (isRailwayProd) {
    // On Railway production, only bypass if explicitly set
    const bypass = env.FORCE_DEV_MODE === 'true' || env.BYPASS_AUTH === 'true';
    console.log('[env-config] Railway production - selective auth bypass:', {
      FORCE_DEV_MODE: env.FORCE_DEV_MODE,
      BYPASS_AUTH: env.BYPASS_AUTH,
      willBypass: bypass,
      isRailwayProd: true
    });
    return bypass;
  } else {
    // For local development, keep existing logic
    const bypass = env.FORCE_DEV_MODE === 'true' || 
                   env.BYPASS_AUTH === 'true' || 
                   env.NODE_ENV === 'development' ||
                   true; // TEMPORARY: Force bypass for development
    
    console.log('[env-config] Local development - auth bypass decision:', {
      FORCE_DEV_MODE: env.FORCE_DEV_MODE,
      BYPASS_AUTH: env.BYPASS_AUTH,
      NODE_ENV: env.NODE_ENV,
      willBypass: bypass,
      isLocal: true
    });
    
    return bypass;
  }
}; 