# Snap2Health Stability Improvements

This document outlines the stability improvements made to the Snap2Health application to address various issues with reload loops, port conflicts, and script loading errors.

## Problems Addressed

1. **Infinite Reload Loops**
   - App constantly refreshing due to emergency scripts
   - Client-side hydration errors causing UI glitches 
   - Conflicting scripts causing page rebuilds

2. **Port Conflicts**
   - Port 3000 remaining occupied after server shutdown
   - Failed server starts due to lingering processes

3. **Script Loading Issues**
   - `404 Not Found` errors for static assets
   - Multiple emergency scripts causing conflicts
   - Issues with static files in the public directory

4. **Authentication Problems**
   - Login page hydration errors
   - LocalStorage/cookie conflicts with authentication data

## Solutions Implemented

### 1. Improved Server Script
- Enhanced `clean-standalone-server.js` with better error handling and caching headers
- Added reliable port cleanup in server startup
- Implemented proper environment variable loading

### 2. Removed Problematic Files
- Deleted all emergency fix scripts (`emergency-fix.js`, etc.)
- Removed `reset.html` and other troublesome scripts
- Cleaned up old `.bak` files from previous fixes

### 3. Simplified Layout and Authentication
- Removed unnecessary scripts from `layout.tsx`
- Simplified `auth-workaround.ts` to use only cookies (not localStorage)
- Fixed hydration issues by removing client-side manipulations

### 4. Optimized NPM Scripts
- Added `dev:stable` for clean startup with port killing
- Improved `clean` script to properly remove all caches
- Updated `kill-ports` to use the improved port killer

### 5. Server Startup Process
- Added proper environment variable loading
- Improved server port cleanup and error handling
- Added cache-busting headers for static files

## How to Use the Stable Server

The most reliable way to run Snap2Health is:

```bash
# Start with clean build and reliable server
npm run dev:stable

# If you encounter any issues
npm run fix
```

## Additional Improvements

1. **Cache Control**
   - Added proper cache control headers in Next.js config
   - Implemented cache busting for static files

2. **Error Recovery**
   - Added graceful error handling throughout the server
   - Improved fallbacks for authentication failures

3. **Development Workflow**
   - Simplified the development workflow with reliable scripts
   - Added clear documentation for common issues

## Remaining Considerations

- If you encounter issues with the login page, try using the local authentication fallback
- For deployment to production, use the `prepare-vercel` script to ensure proper setup
- Always use the stable server commands when developing locally 

# Snap2Health Stability Guide

This document provides guidance on maintaining stability for the Snap2Health application during development and deployment.

## Memory Issues and the "Killed: 9" Error

The "Killed: 9" error occurs when the system terminates a process due to excessive memory usage. This is particularly common on macOS and Linux systems where the kernel's OOM (Out Of Memory) killer stops processes to protect system stability.

We've implemented several solutions to address this issue:

### Recommended Development Approach

For the most stable development experience, use our adaptive configuration:

```bash
# Automatically detects your system memory and uses the optimal configuration
npm run dev:adaptive
```

This script will:
1. Detect your system's available memory
2. Select the appropriate server configuration
3. Clean up any existing processes or stale cache
4. Launch the server with optimized memory settings

### Alternative Configurations

If you prefer to manually choose a configuration, we offer several options based on your available memory:

| Available Memory | Recommended Command | Memory Usage |
|-----------------|---------------------|--------------|
| Less than 2GB   | `npm run dev:ultra-light` | ~1.5GB |
| 2GB - 4GB       | `npm run dev:light` | ~2GB |
| 4GB - 8GB       | `npm run dev:stable` | 3-4GB |
| More than 8GB   | `npm run dev:ultra-stable` | 4-6GB |

### Memory Monitor

We've also provided a standalone memory monitor that can kill processes before they exceed system limits:

```bash
# Automatically monitor and manage Next.js processes
node scripts/memory-monitor.js --auto
```

## Troubleshooting Common Stability Issues

### Server Crashes with "Killed: 9"

If the server is terminated with "Killed: 9", try the following:

1. Switch to a lighter configuration:
   ```bash
   npm run dev:light
   # or for very constrained systems
   npm run dev:ultra-light
   ```

2. Clear caches and temporary files:
   ```bash
   npm run clean
   ```

3. Consider closing other memory-intensive applications while developing.

### Slow Performance or Unresponsive App

If the app becomes slow or unresponsive:

1. Check system memory usage using Activity Monitor (macOS), Task Manager (Windows), or top/htop (Linux)
2. Restart the server with a lighter configuration
3. Clear browser cache and reload

## Detailed Documentation

For more detailed information about memory optimization strategies and available configurations, please refer to:

- [Memory Optimization Guide](./docs/MEMORY-OPTIMIZATION.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

## Best Practices for Stability

1. **Regular cache cleaning**: Periodically run `npm run clean` to clear build artifacts
2. **Minimal browser tabs**: Keep fewer browser tabs open during development
3. **Use production mode for testing**: For comprehensive testing, use `npm run build && npm start`
4. **Monitor system resources**: Keep an eye on memory usage during development

## Need More Help?

If you continue to experience stability issues, please:

1. Check the logs in `memory-monitor.log`
2. Review recent changes to your code that might be causing memory leaks
3. Consult the documentation mentioned above
4. Contact the development team if issues persist 