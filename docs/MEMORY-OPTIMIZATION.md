# Memory & Cache Optimization Guide

## Overview

This document outlines the memory and cache optimization strategies implemented in the Snap2Health app to address:

1. Server-side memory issues resulting in "Killed: 9" errors
2. Client-side browser cache quota errors (QuotaExceededError)
3. Login page crashes and authentication memory leaks

## Server-Side Memory Optimizations

We've implemented three server configurations with varying memory requirements:

1. **Standard Configuration**: Uses approximately 3-4GB RAM
2. **Lightweight Configuration**: Uses approximately 2GB RAM
3. **Ultra-Lightweight Configuration**: Uses approximately 1.5GB RAM

These can be selected using:

```bash
# Standard mode
npm run dev
# or
npm run start

# Lightweight mode
npm run dev:light
# or
npm run start:light

# Ultra-lightweight mode
npm run dev:ultra-light
# or
npm run start:ultra-light
```

The adaptive startup script will automatically choose the best configuration based on available memory:

```bash
node scripts/adaptive-start.js
```

## Client-Side Cache & Authentication Fixes

### Cache Management System

We've implemented a comprehensive cache management system to prevent QuotaExceededError issues:

1. **Automatic Cache Cleanup**: Periodically removes old caches while preserving essential ones
2. **Cache Monitoring**: Background component that monitors and prevents cache overflow
3. **Storage Inspection**: Tools to detect when browser storage is nearly full
4. **Emergency Cache Clearing**: Methods to clear all caches when issues are detected

### Authentication Resilience

The authentication system has been enhanced to handle API failures gracefully:

1. **Improved Profile API**: Returns 200 status with fallback data instead of 401 errors
2. **Session Retention**: Maintains session even when profile fetching fails
3. **Local Auth Fallback**: Allows login via cookie/localStorage when Supabase is unavailable
4. **Auth Recovery Tools**: A dedicated page (/auth-fix) for users to recover from auth problems

## Authentication Recovery Page

The new `/auth-fix` page provides several tools for users experiencing authentication issues:

1. **Clear Browser Caches**: Fixes QuotaExceededError issues
2. **Clear Auth Data**: Resets authentication state, fixing corrupt tokens
3. **Use Local Auth**: Bypasses the authentication service completely (emergency option)
4. **Fix All Issues**: Comprehensive fix that addresses both caches and authentication data

This page is accessible from:
- The login page "Having trouble signing in?" link
- Directly via /auth-fix URL
- The 404 page

## Memory Usage Monitoring

We've added tools to monitor memory usage in development:

```bash
# Run with memory monitoring
npm run dev:monitor

# View current memory usage
npm run memory-check
```

## Known Issues and Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| Server Killed | "Killed: 9" in terminal | Use `npm run dev:light` or `npm run dev:ultra-light` |
| Browser Cache Error | "QuotaExceededError" in console | Visit `/auth-fix` and use "Clear Browser Caches" |
| Login Loop | Continuous redirects to login | Visit `/auth-fix` and use "Fix All Issues" |
| Profile API Failures | "Error fetching from custom profile API" | Use local auth via `/auth-fix` page |

## Deployment Considerations

For Vercel deployments:
- The Edge runtime is preferred for lower memory usage
- Set `NEXT_PUBLIC_DEFAULT_LIGHT_MODE=true` to enable lightweight mode by default
- Consider adding a higher memory limit in Vercel settings

For local development:
- Use the adaptive start script: `node scripts/adaptive-start.js`
- For severely memory-constrained environments, add `NODE_OPTIONS='--max-old-space-size=1536'` to your commands

## Implementation Details

The key files for these optimizations are:

- `src/lib/cache-manager.ts`: Core cache management utilities
- `src/components/CacheMonitor.tsx`: Client-side cache monitoring component
- `app/(auth)/login/page.tsx`: Optimized login page with cache management
- `app/(auth)/login/auth-workaround.ts`: Memory-efficient local authentication
- `app/layout.tsx`: Root layout with cache monitoring
- Various server configuration files for different memory profiles

## Troubleshooting

If you encounter memory issues:

1. **Server-Side Memory Issues**:
   - Use a lighter server configuration (`npm run start:light` or `npm run start:ultra-light`)
   - Check for memory leaks using the monitoring tools
   - Reduce the number of concurrent processes

2. **Browser Cache Errors**:
   - Clear browser caches manually using the browser developer tools
   - Use the emergency cache reset page at `/clear-cache.html` or `/reset.html`
   - Restart the browser if issues persist

3. **Login Page Crashes**:
   - Try using incognito/private browsing mode
   - Clear browser storage and cookies
   - Use the local authentication fallback if Supabase authentication fails

## Common Memory Issues

You may experience the following symptoms that indicate memory problems:

1. Server suddenly stops with a `Killed: 9` message
2. Server becomes unresponsive after extended use
3. App experiences slowdowns or crashes when analyzing multiple images
4. Browser tab crashes when navigating between pages

## Why This Happens

The Snap2Health app uses several resource-intensive features:

- Next.js development server with hot reloading
- Image processing and analysis
- AI/ML models for food recognition
- Complex client-side rendering

These features can consume significant memory, particularly during development when cache and debugging information are maintained.

## Solutions

We've implemented several solutions to address memory issues:

### 1. Use Memory-Optimized Scripts

Choose the right script for your environment:

```bash
# Regular Next.js server (may have memory issues)
npm run dev

# Stable server with memory optimizations
npm run dev:stable

# Ultra-stable server with automatic memory monitoring
npm run dev:ultra-stable

# Lightweight server for very memory-constrained environments
npm run dev:light

# NEW: Ultra-lightweight configuration (~1.5GB max)
npm run dev:ultra-light
```

Memory usage comparison:
- `dev`: 4-6GB+ of RAM
- `dev:stable`: 3-4GB of RAM
- `dev:light`: ~2GB of RAM
- `dev:ultra-light`: ~1.5GB of RAM

The ultra-light version uses custom TypeScript and Next.js configurations that reduce functionality but ensure the app runs even on very memory-constrained systems.

### 2. Manual Memory Management

If you're still experiencing issues, try:

```bash
# Clean all caches and restart
npm run clean

# For extremely memory-constrained systems
npm run dev:ultra-light
```

### 3. Memory Monitor

We've provided a standalone memory monitor that can be used with any server:

```bash
# Start the memory monitor in auto mode
node scripts/memory-monitor.js --auto

# Monitor a specific process ID
node scripts/memory-monitor.js 12345

# Debug mode with more verbose logging
node scripts/memory-monitor.js --auto --debug
```

The memory monitor will:
- Track memory usage of Next.js processes
- Kill processes that exceed memory thresholds
- Log memory usage to memory-monitor.log
- Automatically restart the server when necessary

### 4. OS-Specific Tuning

#### macOS

On macOS, you may need to increase system memory limits:

```bash
# Increase per-process memory limit (temporary)
sudo launchctl limit maxproc 2048 4096

# For M1/M2 Macs with memory pressure issues
sudo sysctl -w vm.compressor_mode=4
```

#### Linux

On Linux systems, adjust your swappiness:

```bash
# Check current swappiness
cat /proc/sys/vm/swappiness

# Set a lower value (requires sudo)
sudo sysctl -w vm.swappiness=10
```

#### Windows

On Windows, ensure you don't have resource-limiting software running and check Task Manager for memory usage.

### 5. Hardware Recommendations

For optimal development experience, we recommend:

- 16GB+ RAM (8GB minimum)
- SSD storage
- Multi-core CPU (4+ cores)
- At least 10GB of free disk space

## Configuration Files

We provide several configuration options:

- `next.config.js` - Standard Next.js config with some memory optimizations
- `next.config.light.js` - Ultra-lightweight config for memory-constrained environments
- `tsconfig.light.json` - Minimal TypeScript checking for development

## Diagnosing Memory Issues

To investigate memory issues:

1. Check the memory-monitor.log file for spikes in usage
2. Run `node --inspect clean-standalone-server.js` and connect Chrome DevTools
3. Use Activity Monitor (macOS), Task Manager (Windows), or top/htop (Linux) to monitor memory

## Serverless Mode

If you continue experiencing memory issues in development, consider using the production build with our lightweight server:

```bash
npm run build
npm run start:light
```

This uses optimized production code with our memory-efficient server.

## Identify Memory-Heavy Features

If you're still facing issues, consider temporarily disabling these memory-intensive features during development:

1. Image analysis (comment out or mock this functionality)
2. Complex animations and transitions
3. Large dataset processing
4. Concurrent API calls

## Need More Help?

If you continue to experience memory issues despite these solutions, consider:

1. Checking for memory leaks in your custom code
2. Disabling browser extensions or other resource-intensive applications
3. Upgrading your development hardware
4. Running the app in a container with dedicated resource limits

For further assistance, please check the error logs in `memory-monitor.log` or contact the development team. 