# Vercel Deployment Guide for Snap2Health

This guide outlines the steps to properly deploy Snap2Health to Vercel, ensuring that authentication works correctly.

## Prerequisites

- Vercel CLI installed (`npm i -g vercel`)
- A Vercel account
- A Supabase account and project
- Git repository linked to Vercel

## Common Issues and Fixes

The main issues encountered in production are:

1. **Authentication failures** - Users can't sign in or sessions don't persist
2. **API route errors** - Dynamic API routes don't work properly
3. **File upload issues** - Images can't be uploaded or processed
4. **Caching problems** - Stale data shows due to improper cache headers

## Deployment Steps

### 1. Prepare the Application

Run our automated deployment preparation script:

```bash
npm run deploy:vercel
```

This script:
- Validates and fixes component files
- Sets proper Next.js configuration
- Ensures API routes are correctly set up as dynamic
- Builds the application

### 2. Configure Environment Variables

Make sure these environment variables are set in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `NEXT_PUBLIC_AUTH_BYPASS` - Set to "false" in production
- `NEXT_PUBLIC_BUILD_TIMESTAMP` - Will be set automatically
- `NEXT_PUBLIC_API_BASE_URL` - Set to your production domain
- `NEXT_PUBLIC_ENV` - Set to "production"

### 3. Deploy to Vercel

Deploy using our optimized script:

```bash
npm run deploy:vercel
```

Or manually:

```bash
vercel --prod
```

### 4. Verify Deployment

Check these after deployment:

1. **Authentication** - Test login and protected routes
2. **API Routes** - Test image upload and analysis
3. **SEO/Sharing** - Validate OpenGraph tags
4. **Performance** - Check Lighthouse scores

### 5. Troubleshooting

If issues persist:

#### Authentication Issues

- Check middleware.ts for proper route protection
- Verify Supabase environment variables
- Clear browser cache and local storage

#### API Route Errors

- Add `export const dynamic = "force-dynamic";` to top of route files
- Update next.config.js with proper headers

#### File Upload Issues

- Check CORS settings in middleware.ts
- Verify storage permissions in Supabase

#### Deployment Fixes

For quick fixes to common issues:

```bash
# Fix the FoodAnalysis component issue
node vercel-deploy.js

# Redeploy with forced settings
npm run deploy:vercel
```

## Maintenance

Regular maintenance should include:

1. **Update dependencies** - Keep Next.js and Supabase libraries updated
2. **Check for stale caches** - Run cache bust if needed
3. **Monitor authentication** - Watch for session timeouts

## Support

For ongoing support or questions, refer to:
- The Snap2Health GitHub repository
- Supabase documentation for auth issues
- Next.js documentation for deployment 