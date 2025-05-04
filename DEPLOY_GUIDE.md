# Snap2Health Deployment Guide

This guide provides step-by-step instructions for deploying the Snap2Health application to Vercel with memory optimizations and authentication fixes.

## Prerequisites

- GitHub account with access to the Snap2Health repository
- Vercel account linked to your GitHub account
- Supabase project set up with the necessary tables and authentication

## Deployment Steps

### 1. Prepare Your Repository

Ensure your repository includes these key files:

- `lightweight-server.js` - Memory-optimized server
- `scripts/adaptive-start.js` - Automatic server configuration selector
- `public/auth-client-fix.js` - Authentication conflict resolver
- `vercel.json` - Deployment configuration with memory settings

### 2. Configure Environment Variables

Set up the following environment variables in your Vercel project:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://your-vercel-app-url.vercel.app
NODE_ENV=production
```

### 3. Deploy to Vercel

1. Log in to your Vercel dashboard (https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Select the Snap2Health repository
4. Configure the project:
   - Build Command: `npm run vercel-build`
   - Output Directory: `.next`
   - Install Command: `npm install`
   - Framework Preset: Next.js
   - Root Directory: `./`
5. Click "Deploy"

### 4. Optimize for Production

After deployment, you can further optimize by:

1. Enabling the "Memory Optimization" feature in Vercel Functions settings
2. Setting "Maximum Memory" to 1024 MB for regular usage or 3008 MB for large image processing

### 5. Verify Authentication Works

Check that authentication works properly:

1. Visit your deployed app
2. Try signing in with a test account
3. Verify that no "Multiple GoTrueClient instances detected" errors appear in the console
4. Test the image upload and analysis functionality

### 6. Troubleshooting Authentication Issues

If users experience authentication issues:

1. Direct them to `/auth-fix` page for self-service recovery
2. Use the "Fix All Auth Issues" button for comprehensive fixes
3. For persistent issues, try the "Use Local Auth Fallback" option

### 7. Monitoring Server Health

To monitor your deployment:

1. Check the Vercel Logs section for any "Killed: 9" errors
2. Set up Vercel Analytics to track performance
3. Enable error reporting to catch authentication issues

## Production Configurations

The app includes several production configurations:

- `npm run start:adaptive` - Automatically selects the best server configuration
- `npm run start:stable` - Standard server with memory optimizations (4GB)
- `npm run start:light` - Lightweight server for medium environments (2GB)
- `npm run start:ultra-light` - Ultra-lightweight for constrained environments (1.5GB)
- `npm run start:minimal` - Minimal server for very limited resources (1GB)

## Maintenance

Regularly perform these maintenance tasks:

1. Update dependencies regularly: `npm update`
2. Run the authentication fix script as needed: `npm run fix:auth`
3. Clean cache and node modules occasionally: `npm run clean`

## Support Resources

- [Memory Optimization Documentation](./MEMORY-OPTIMIZATION.md)
- [Authentication Fix Documentation](./AUTHENTICATION-FIX.md)
- [Supabase Setup Guide](./SUPABASE_SETUP_GUIDE.md)

## Quick Deployment

For the fastest way to deploy with all fixes:

```bash
# Install dependencies if needed
npm install

# Run the production deployment script
npm run deploy:production
```

This script will:
1. Fix all authentication issues
2. Build the app with correct settings
3. Test the build locally
4. Deploy to Vercel

## Common Issues and Solutions

### Authentication Problems

If users cannot log in or stay logged in:

```bash
npm run fix-production
npm run clean-build
npm run deploy:fixed
```

### Image Upload Issues

If image uploads are failing:

```bash
# Fix API routes
npm run fix-production
npm run clean-build
npm run deploy:fixed
```

### "Loading..." States That Never Complete

If users are stuck with infinite loading:

```bash
# Fixed by the fix-production script
npm run fix-production
npm run clean-build
npm run deploy:fixed
```

## Manual Testing

After deployment, always test:

1. User login and signup
2. Session persistence across page refreshes
3. Image uploads
4. Meal analysis
5. Dashboard and profile views

## Production Environment Variables

Ensure these environment variables are correctly set in your production environment:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_AUTH_ENABLED=true
```

## Local Testing of Production Build

To test the production build locally:

```bash
# Build with all fixes
npm run fix-production && npm run clean-build

# Start the production server
npm run start:production
```

Then visit `http://localhost:3000` to test all features.

## Updating an Existing Deployment

When making updates:

```bash
# Pull latest changes
git pull

# Apply fixes and redeploy
npm run deploy:production
```

## Need More Help?

See the detailed troubleshooting guides:
- [Authentication Issues](./AUTHENTICATION_ISSUES.md)
- [Deployment Troubleshooting](./DEPLOYMENT_TROUBLESHOOTING.md)
- [Production QuickFix](./PRODUCTION_QUICKFIX.md) 