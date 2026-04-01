// Environment configuration utility
// Auth bypass is ONLY active when explicitly set via environment variables

export const getEnvConfig = () => ({
  FORCE_DEV_MODE: process.env.FORCE_DEV_MODE,
  BYPASS_AUTH: process.env.BYPASS_AUTH,
  NODE_ENV: process.env.NODE_ENV,
  RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
});

export const shouldBypassAuth = (): boolean => {
  const env = getEnvConfig();
  return env.FORCE_DEV_MODE === 'true' || env.BYPASS_AUTH === 'true';
};
