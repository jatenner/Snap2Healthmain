# Snap2Health Deployment Troubleshooting

This document provides solutions for common deployment issues with the Snap2Health application.

## Common Issues and Solutions

### FoodAnalysis.tsx Build Error

**Problem:** Build fails with error about unexpected token `div` in FoodAnalysis.tsx.

**Solution:** 
```bash
npm run fix-deployment
```

This script replaces FoodAnalysis.tsx with a compatibility wrapper that re-exports SimpleFoodAnalysis.

### Port Already in Use (EADDRINUSE)

**Problem:** Server fails to start with `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
npm run kill-ports
npm run start:safe
```

Alternatively, use:
```bash
npm run start:fixed
```

### Stuck Loading States / "Analyzing..." Never Completes

**Problem:** App gets stuck on "Analyzing..." and never loads results.

**Solution:**
1. Make sure `emergency-fix.js` and `data-troubleshooter.js` are correctly loaded in `app/layout.tsx`
2. Verify the time-out mechanisms are working by checking browser console
3. If it's happening in production, try:
   ```bash
   npm run fix-deployment
   npm run clean-build
   npm run start:safe
   ```

### Missing Files or Scripts

**Problem:** Build fails due to missing files or scripts.

**Solution:**
```bash
npm run fix-deployment
```

## Complete Fix Process

If you're experiencing multiple issues, follow this process:

1. Kill any running processes:
   ```bash
   npm run kill-ports
   ```

2. Fix deployment issues:
   ```bash
   npm run fix-deployment
   ```

3. Start the server with safe mode:
   ```bash
   npm run start:safe
   ```

Or use the all-in-one command:
```bash
npm run start:fixed
```

## For Vercel Deployment

When deploying to Vercel:

1. Run preparation script:
   ```bash
   npm run prepare-vercel
   ```

2. Deploy using the deploy script:
   ```bash
   npm run deploy
   ```

3. If you encounter caching issues:
   ```bash
   npm run purge-cache
   ```

## Additional Information

- The standalone server automatically attempts to find an available port if 3000 is in use
- Emergency scripts are loaded early in the page lifecycle to fix issues with stuck loading states
- Cache-busting parameters are added to all scripts to prevent browser caching problems 