# Snap2Health Vercel Deployment Guide

This guide outlines the process for successfully deploying the Snap2Health application to Vercel with all memory optimizations and authentication fixes.

## Deployment Process

### 1. Fix Module Resolution Issues

We've created a script that fixes module resolution issues in the Vercel deployment environment:

```bash
node scripts/fix-vercel-deployment.js
```

This script:
- Creates missing modules that Vercel might not find during build
- Updates Next.js configuration for proper path resolution
- Ensures all dependencies are properly configured

### 2. Deploy to Vercel

Use one of these methods to deploy:

**Option 1: Vercel CLI (Recommended)**
```bash
npx vercel@latest login
npx vercel@latest --prod
```

**Option 2: GitHub Integration**
1. Connect your GitHub repository to Vercel
2. Configure the following settings:
   - Framework: Next.js
   - Root Directory: `/` (default)
   - Build Command: `npm run vercel-build`
   - Install Command: `npm install`

### 3. Environment Variables

Ensure these environment variables are set in the Vercel dashboard:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `NEXT_PUBLIC_VERCEL_DEPLOYMENT` - Set to `true`
- `NODE_OPTIONS` - Set to `--max-old-space-size=4096 --expose-gc`

## Testing Your Deployment

After deploying, verify these core functionalities:

### 1. Authentication Testing

- **Sign-up flow**: Register a new test user
- **Login flow**: Successfully log in with credentials
- **Session persistence**: Refresh the page while logged in and verify you stay logged in
- **Log out**: Successfully log out

### 2. Meal Analysis Testing

- Take or upload a photo of food
- Verify the analysis processes correctly without timeout errors
- Check that you receive:
  - Meal name identification
  - Calorie count
  - Macronutrient breakdown (protein, carbs, fat)
  - Micronutrient details
  - AI-generated meal overview

### 3. Performance Testing

- **Cold start**: First load of the application should be under 5 seconds
- **Navigation**: Page transitions should be smooth
- **Memory usage**: No browser memory warnings should appear
- **Error handling**: All errors should be gracefully handled with user-friendly messages

### 4. Mobile Responsiveness

- Test on mobile devices or using browser developer tools
- Verify all interfaces adapt correctly to smaller screens
- Ensure touch interactions work properly

## Troubleshooting Common Issues

### Module Resolution Errors

If you see module not found errors in the Vercel logs:
1. Run `node scripts/fix-vercel-deployment.js` locally
2. Commit and push changes
3. Redeploy

### Memory-Related Errors

If you encounter "Killed: 9" or memory-related errors:
1. Check `vercel.json` configuration is correct
2. Ensure `NODE_OPTIONS` includes `--max-old-space-size=4096`
3. Verify your lightweight-server.js is properly optimized

### Authentication Issues

If users have trouble with login:
1. Check browser console for "Multiple GoTrueClient instances" errors
2. Verify auth-client-fix.js is being loaded on the login page
3. Test clearing localStorage and trying again

## Deployment Checklist

- [ ] Run optimization scripts locally and test
- [ ] Fix module resolution issues with fix-vercel-deployment.js
- [ ] Commit and push all changes to GitHub
- [ ] Deploy to Vercel with proper environment variables
- [ ] Verify authentication flows
- [ ] Test meal analysis functionality
- [ ] Check mobile responsiveness
- [ ] Monitor for any memory leaks or performance issues 