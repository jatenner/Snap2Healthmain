# Snap2Health Deployment Fixes

This document outlines the changes made to fix deployment and caching issues with the Snap2Health application on Vercel.

## Key Issues Fixed

1. **Browser Caching Issues**
   - UI changes not appearing in production due to aggressive browser caching
   - Images not refreshing after updates

2. **Webpack Caching Issues**
   - ENOENT errors during development
   - Build cache not invalidating properly

3. **Next.js SSR/SSG Issues**
   - Dynamic server usage errors during static page generation
   - Missing modules (ThemeProvider)

4. **Port Usage Issues**
   - Multiple development servers running simultaneously

## Solutions Implemented

### 1. Cache Control

- Added comprehensive cache control headers:
  - In `next.config.js` to cover all routes
  - In `vercel.json` for platform-level cache control
  - In API endpoints with explicit cache control headers
  - In the main layout with proper `httpEquiv` attributes
  - In all image components using cache-busting parameters

- Added build timestamp to all assets:
  - Set `NEXT_PUBLIC_BUILD_TIMESTAMP` in build scripts
  - Added version display in the UI footer
  - Created a `/api/version` endpoint for client-side version checking

### 2. Webpack Improvements

- Disabled webpack caching in development mode
- Added custom babel configuration
- Updated module resolution to avoid ENOENT errors
- Added cache-busting to all static assets

### 3. Next.js Configuration

- Set proper experimental options:
  - Disabled worker threads that can cause issues
  - Fixed memory allocation
  - Set proper CPU limits
- Made output standalone for better Vercel compatibility
- Fixed incorrect imports and usage of `ThemeProvider`

### 4. Development Workflow

- Created `kill-ports.js` script to clear hanging processes
- Added pre-dev hook to ensure clean environment
- Updated build scripts to include cache busting
- Created a browser cache clearing page at `/clear-cache.html`

### 5. Client-Side Fixes

- Added version checking in components to force refresh when needed
- Improved image loading to prevent stale content
- Added client-side cache busting via localStorage

## How to Deploy

1. Push all changes to GitHub
2. In Vercel dashboard:
   - Go to Project Settings
   - Choose "General"
   - Scroll to "Build & Development Settings"
   - Set "Build Command" to: `npm run vercel-build`
   - Click "Save"
3. Redeploy with cache cleared:
   - Click "Deployments" tab
   - Click the three dots next to the latest deployment
   - Select "Redeploy" → "Redeploy with existing Build Cache Cleared"

## Troubleshooting

If you're still experiencing cache issues:

1. Direct users to `/clear-cache.html` to force a cache clear
2. Use the "Kill Ports" script for local development: `npm run kill-ports`
3. Try the "Safe Dev" script for reliable local development: `npm run safe-dev`
4. Check Vercel logs for any ENOENT or Module not found errors, which may indicate remaining cache issues 