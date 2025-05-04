# Snap2Health Developer Guide

## Common Development Issues & Solutions

This guide contains solutions for common development issues encountered with the Snap2Health application.

### Webpack Cache Errors

If you see errors like:

```
[webpack.cache.PackFileCacheStrategy] Caching failed for pack: Error: ENOENT: no such file or directory...
```

Or:

```
unhandledRejection: [Error: ENOENT: no such file or directory, stat '...' ]
```

These are related to webpack caching issues in Next.js. We've implemented several solutions:

#### Quick Solutions

1. **Use the fix-dev script**:
   ```bash
   npm run fix-dev
   ```
   This script automatically:
   - Removes the `.next` directory
   - Clears webpack caches
   - Kills processes using ports 3000-3010
   - Starts the development server

2. **Clear cache and start dev server**:
   ```bash
   npm run clean-dev
   ```

3. **Manual cleanup**:
   ```bash
   rm -rf .next
   npm run dev
   ```

### Port Already in Use

If you see errors like:

```
Port 3000 is in use, trying 3001 instead.
```

And your dev server keeps trying new ports, you may have zombie Next.js processes running.

#### Solutions:

1. **Use the fix-dev script** (recommended):
   ```bash
   npm run fix-dev
   ```

2. **Manually kill processes**:
   ```bash
   # Find processes using port 3000
   lsof -i :3000
   
   # Kill the process
   kill -9 <PID>
   ```

3. **Killing all Node processes** (use with caution):
   ```bash
   # On macOS/Linux
   pkill -f node
   
   # On Windows
   taskkill /F /IM node.exe
   ```

### Deployment Caching Issues

If you're experiencing issues where changes don't appear in production even after successful deployment:

#### Solutions:

1. **Use force deployment flags**:
   ```bash
   vercel --force --prod
   ```

2. **Purge Vercel's cache**:
   ```bash
   npm run purge-cache
   ```

3. **Run a clean build before deployment**:
   ```bash
   npm run clean-build
   vercel --prod
   ```

4. **Update cache control headers**:
   
   We've added cache control headers in:
   - `vercel.json`
   - `next.config.js`
   
   These should prevent aggressive caching by browsers and CDNs.

### For Users: Clearing Browser Cache

If users report they're still seeing old UI or content even after a successful deployment:

1. **Direct them to the cache cleaner page**:
   - Send them to: `https://your-app-url.com/clear-cache.html`
   - This page will automatically clear their browser's cache for the app

2. **Provide these manual instructions**:
   - **Chrome/Edge**: Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - **Firefox**: Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - **Safari**: Press Option+Cmd+E to clear cache, then reload the page

3. **Add a timestamped query parameter**:
   - Have them go to: `https://your-app-url.com/?t=<current-timestamp>`
   - Example: `https://snap2health.vercel.app/?t=1234567890`

4. **Last resort: Try different browser**:
   - If all else fails, have them try a different browser or incognito/private mode

We've implemented automatic cache busting for images and API calls, but some browsers may still cache HTML and JavaScript files aggressively.

### Debug Information

We've added a debug page that shows information about your environment:

- Visit: [http://localhost:3000/dev-debug](http://localhost:3000/dev-debug)

This page shows:
- System information
- Browser information 
- Cache status
- Buttons for hard reload and clearing browser storage

### Module Resolution Issues

If you see errors about missing modules:

```
Module not found: Can't resolve '@/components/ui/...'
```

1. Check if the import path is correct
2. Run `npm install` to ensure all dependencies are installed
3. Check if the file exists in the location specified

### Configuration Files

We've modified several configuration files to improve development experience:

1. **next.config.js**:
   - Disabled webpack caching in development
   - Added cache control headers
   - Configured fallbacks for Node.js modules

2. **package.json**:
   - Added scripts for clean development and builds
   - Included cache-busting options

3. **vercel.json**:
   - Added cache control headers
   - Configured build settings

### Need More Help?

If you're still experiencing issues:

1. Check the Next.js documentation: [https://nextjs.org/docs](https://nextjs.org/docs)
2. Look at the Vercel deployment logs: [https://vercel.com/dashboard](https://vercel.com/dashboard)
3. Run `npm run fix-dev` to clear all caches and restart with a fresh environment 