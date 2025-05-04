# Snap2Health Troubleshooting Guide

This document provides solutions for common issues that might occur with the Snap2Health application.

## Common Issues

### App Keeps Reloading or Refreshing

If the app appears to be in a reload loop or keeps refreshing the page:

1. **Run the fix script:**
   ```bash
   npm run fix
   ```
   This script automatically fixes most common issues.

2. **Clear your browser cache:**
   - **Chrome/Edge**: Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - **Firefox**: Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - **Safari**: Press `Option+Cmd+E` to clear cache, then reload the page

3. **Use the clean server start:**
   ```bash
   npm run dev:stable
   ```

4. If the issue persists, try opening the app in an incognito/private browsing window.

### Authentication Issues

If you're having trouble logging in or staying logged in:

1. **Clear your browser cookies:**
   - Go to your browser settings and clear cookies for localhost or your app domain
   - Alternatively, use incognito/private browsing mode

2. **Use test credentials:**
   - For the demo, use: `test@example.com` with password `password123`

3. If you're still having issues, restart the server with:
   ```bash
   npm run dev:stable
   ```

### Image Analysis Not Working

If the food analysis feature isn't working correctly:

1. **Make sure your profile is complete:**
   - Go to your profile page and ensure all required fields are filled out
   - The analysis requires your weight, height, age and gender to provide accurate results

2. **Check your internet connection:**
   - The analysis requires a stable internet connection to work properly

3. **Try using a smaller image** or a different image format (JPEG or PNG).

4. **Make sure you're logged in** - image analysis requires authentication.

## Stable Running Instructions

For the most stable experience, we recommend:

### For Development

1. **Clean Start:**
   ```bash
   npm run dev:stable
   ```

   This script:
   - Kills any processes using the required ports
   - Cleans the build cache
   - Starts the server with proper settings

2. **Standard Development:**
   ```bash
   npm run dev:clean
   ```

   This script:
   - Cleans the .next directory
   - Starts the Next.js development server

### For Production

1. **Clean Production Build:**
   ```bash
   npm run clean-build
   npm run start
   ```

2. **One Command Production:**
   ```bash
   npm run start:stable
   ```

## Port Conflicts

If you see errors about port 3000 being in use:

1. **Use our port cleanup script:**
   ```bash
   npm run kill-ports
   ```

2. **If still having issues:**
   - Restart your computer to clear all processes
   - Check for other apps that might be using port 3000
   - Try changing the port in your .env.local file: `PORT=3001`

## Next.js Build Issues

If you encounter build errors:

1. **Clean the build cache:**
   ```bash
   npm run clean
   ```

2. **Check for dependency issues:**
   ```bash
   npm install
   ```

3. **Try forcing a clean build:**
   ```bash
   rm -rf node_modules/.next
   npm install
   npm run build
   ```

## Technical Support

If you continue to experience issues:

1. **Check the console for errors:**
   - Open browser developer tools (F12 or Right-click > Inspect)
   - Go to the Console tab and check for red error messages

2. **Try accessing the app's debug page:**
   - Go to: [http://localhost:3000/dev-debug](http://localhost:3000/dev-debug)
   - This page shows detailed information about your environment

3. **Contact support with:**
   - Screenshots of any error messages
   - Steps to reproduce the issue
   - Your browser and operating system information

## Useful Commands

Here's a summary of the most useful commands:

| Command | Description |
|---------|-------------|
| `npm run fix` | Fix common app issues automatically |
| `npm run dev:stable` | Start dev server with clean environment |
| `npm run kill-ports` | Kill processes using ports 3000-3010 |
| `npm run clean` | Clean build and module caches |
| `npm run start:stable` | Start production server with clean env |

## Table of Contents
1. [Quick-Fix Commands](#quick-fix-commands)
2. [Typing and Input Issues](#typing-and-input-issues)
3. [Authentication Problems](#authentication-problems)
4. [UI Glitches and Rendering Issues](#ui-glitches-and-rendering-issues)
5. [API and Data Problems](#api-and-data-problems)
6. [Performance Issues](#performance-issues)
7. [Server and Port Conflicts](#server-and-port-conflicts)
8. [Complete Recovery Guide](#complete-recovery-guide)

## Quick-Fix Commands

Use these commands to fix specific issues:

| Issue | Command | Description |
|-------|---------|-------------|
| **Typing Issues** | `npm run fix-typing-issues` | Fixes input field and typing problems |
| **All Issues** | `npm run fix-all` | Fixes all known issues automatically |
| **Authentication** | `npm run fix-auth` | Resets authentication state |
| **Analysis Issues** | `npm run fix-analysis` | Fixes food analysis functionality |
| **Server Conflicts** | `npm run kill-ports` | Kills conflicting port processes |
| **Emergency Mode** | `npm run emergency` | Starts the emergency server on port 3999 |
| **Complete Reset** | `npm run complete-repair` | Complete app repair and restart |

## Typing and Input Issues

### Symptoms
- Can't type in input fields
- Text disappears while typing
- Input fields glitch or flicker
- Keystrokes not registering
- Form submission doesn't work

### Solution

1. **Quick Fix**: Run our specialized typing fix script:
   ```
   npm run fix-typing-issues
   ```

2. **Manual Steps**:
   - Open emergency server: `npm run emergency`
   - Navigate to http://localhost:3999/fix-typing
   - Follow on-screen instructions to repair input fields
   - Click "Fix Everything" to perform a comprehensive repair
   - Test typing in the test fields to confirm the fix worked
   - Click "Exit and Restart App" when done

3. **Deeper Fixes**:
   - Clear browser cache and cookies
   - Try a different browser
   - Run full app repair: `npm run complete-repair`

4. **Common Causes**:
   - Service worker conflicts
   - Event listener leaks
   - DOM element corruption
   - CSS animation issues
   - Browser input method conflicts

## Authentication Problems

### Symptoms
- "Not authenticated" errors
- Login page redirects in loops
- Can't log in or sign up
- Session expired messages

### Solution

1. **Quick Fix**:
   ```
   npm run fix-auth
   ```

2. **Manual Steps**:
   - Open http://localhost:3999/auth-reset.html
   - Click "Reset Authentication"
   - Follow on-screen instructions
   - Try logging in again

3. **If problems persist**:
   - Clear browser cookies and localStorage
   - Check browser console for specific errors
   - Try with a different browser

## UI Glitches and Rendering Issues

### Symptoms
- Elements overlapping
- Styles not applying
- Components flickering
- Broken layouts

### Solution

1. **Quick Fix**:
   ```
   npm run fix-all
   ```

2. **Manual Steps**:
   - Run `npm run emergency`
   - Open http://localhost:3999/reset.html
   - Click "Reset All Caches"
   - Follow the prompts

3. **Additional Steps**:
   - Check console for CSS errors
   - Verify styles are loading properly
   - Check for browser extensions that might interfere

## API and Data Problems

### Symptoms
- "Failed to fetch" errors
- Data not loading
- 404 errors for API endpoints
- Empty data responses

### Solution

1. **Quick Fix**:
   ```
   npm run fix-analysis
   ```

2. **Manual Steps**:
   - Verify backend services are running
   - Check network tab for API errors
   - Clear browser cache
   - Restart the application: `npm run start:clean`

## Performance Issues

### Symptoms
- App feels slow or unresponsive
- High CPU/memory usage
- Laggy animations
- Long loading times

### Solution

1. **Quick Fix**:
   ```
   npm run deep-clean && npm run reliable-dev
   ```

2. **Manual Steps**:
   - Close other applications and tabs
   - Clear browser cache and application storage
   - Restart in performance mode: `npm run reliable-start`

## Server and Port Conflicts

### Symptoms
- "Port already in use" errors
- Can't start development server
- App crashes on startup
- Multiple instances running

### Solution

1. **Quick Fix**:
   ```
   npm run kill-ports:force && npm run reliable-dev
   ```

2. **Manual Steps**:
   - Kill Node.js processes: `pkill -f node` or `taskkill /f /im node.exe`
   - Use a different port: `npm run reliable-dev` (uses port 3001)
   - Check for other applications using the same ports

## Complete Recovery Guide

If all else fails, follow these steps for a complete recovery:

1. Kill all related processes:
   ```
   npm run kill-ports:force
   ```

2. Clean all caches and build artifacts:
   ```
   npm run deep-clean
   ```

3. Run the full repair script:
   ```
   npm run fix-all
   ```

4. Start the emergency server:
   ```
   npm run emergency
   ```

5. Open the reset page:
   ```
   npm run fix-typing
   ```

6. Follow all on-screen instructions to repair the app

7. If issues persist, try reinstalling the application:
   ```
   npm run super-reset
   ```

## Advanced Diagnostics

For detailed diagnostics, run:
```
node scripts/diagnostics.js
```

This will generate a report of potential issues and provide specific fix commands.

---

For more help, consult the full documentation or reach out to the development team. 