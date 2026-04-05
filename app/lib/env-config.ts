// Environment configuration utility

export const getEnvConfig = () => ({
  NODE_ENV: process.env.NODE_ENV,
  RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
});
