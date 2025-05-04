# Memory Optimization and Server Stability

This document explains the improvements made to address the memory issues and server stability problems in the Snap2Health application.

## Problem Summary

The application was experiencing several issues:

1. **Memory Exhaustion**: The Node.js server was being killed with "Killed: 9" errors due to excessive memory usage, particularly when processing images and during authentication.

2. **Multiple GoTrueClient Instances**: The browser console showed "Multiple GoTrueClient instances detected" warnings, causing authentication conflicts.

3. **Image Analysis Failures**: The meal analysis functionality was not working properly after taking photos.

## Solutions Implemented

### 1. Optimized Image Processing

- **Image Compression**: Added automatic compression of large image data URLs before sending to the API
- **Memory-Aware Processing**: The analyze-image endpoint now checks available memory and returns a simplified response under low memory conditions
- **Timeout Protection**: Added timeouts to prevent long-running image analysis requests from causing server crashes
- **Chunked Request Handling**: Implemented chunked reading of request bodies to limit memory usage for large uploads

### 2. Fixed Authentication Conflicts

- **Centralized Client Management**: Created an authentication client fix script that prevents multiple GoTrueClient instances
- **Storage Conflict Resolution**: Added automatic detection and clearing of conflicting auth storage data
- **Improved State Management**: Enhanced the auth context with better error handling and initialization checks

### 3. Optimized Server Infrastructure

- **Adaptive Server**: Created an adaptive startup script that automatically selects the appropriate server configuration based on available system memory
- **Lightweight Server**: Implemented an ultra-lightweight server with aggressive memory management and monitoring
- **Graceful Degradation**: Added fallback mechanisms for when memory limits are approached
- **Automatic Recovery**: The server can now automatically restart when approaching critical memory limits

### 4. Memory Monitoring and Management

- **Real-time Monitoring**: Added memory usage tracking with threshold-based alerts
- **Manual Garbage Collection**: Implemented explicit garbage collection when memory usage becomes critical
- **Response Size Optimization**: Reduced the size of API responses to minimize memory overhead

## Server Configuration Options

The application now offers several server configurations to accommodate different memory environments:

- **dev:full**: Standard Next.js development server (highest memory usage)
- **dev:stable**: Optimized server with 4GB memory limit
- **dev:light**: Lightweight server with 2GB memory limit
- **dev:ultra-light**: Ultra-lightweight server with 1.5GB memory limit
- **dev:minimal**: Minimal server with 1GB memory limit (most memory-efficient)
- **dev:adaptive**: Automatically selects the best configuration based on available memory (recommended)

## Running the Application

To start the application with automatic memory optimization:

```bash
npm run dev
```

This will use the adaptive server that automatically selects the best configuration for your environment.

For very memory-constrained environments, use:

```bash
npm run dev:minimal
```

## Vercel Deployment Optimizations

For Vercel deployment, we've optimized the build process:

```bash
npm run build:optimized
```

This uses increased memory limits and optimized build settings for Vercel deployment.

## Troubleshooting

If you encounter authentication issues, run:

```bash
npm run fix:auth
```

This will apply all authentication fixes and clear any conflicting states.

If you see "Multiple GoTrueClient instances detected" warnings, run:

```bash
npm run fix:gotrue
```

## Best Practices

1. Regularly restart the development server during long development sessions
2. Use `npm run clean` periodically to clear caches
3. If memory issues persist, try increasingly lightweight configurations
4. For production, ensure at least 2GB of available memory per instance

By implementing these optimizations, we've significantly improved the stability and reliability of the Snap2Health application, particularly in memory-constrained environments. 