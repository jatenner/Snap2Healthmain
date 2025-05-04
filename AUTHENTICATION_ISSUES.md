# Fixing Authentication Issues in Production

This guide provides solutions for authentication issues with Snap2Health in production.

## Common Authentication Issues

1. **Cannot Sign In**: Users cannot log in or stay logged in after page refreshes
2. **Redirect Loops**: Users get stuck in login/redirect loops
3. **Missing User Data**: Authenticated pages don't show user data
4. **API Authentication Errors**: API calls fail with 401 Unauthorized errors
5. **Upload Issues**: Image uploads fail when authenticated

## Quick Solutions

### 1. Run the Fix Script

The easiest way to fix most authentication issues is to run our production fix script:

```bash
npm run fix-production
npm run clean-build
# Deploy the fixed build
```

### 2. Check Browser Console for Errors

Look for these common error patterns:

- `Error: Dynamic server usage: Page couldn't be rendered statically`
- `Error: Cookies cannot be accessed in pages that do not use middleware`
- `AuthError: Invalid JWT token`

### 3. Clear Browser Cache and Cookies

Have users clear their browser cache and cookies:

1. Press Ctrl+Shift+Delete (Windows/Linux) or Cmd+Shift+Delete (Mac)
2. Select "Cookies and site data" and "Cached images and files"
3. Click "Clear data"

## Technical Fixes

### 1. Next.js Configuration Fixes

The `next.config.js` file should:

1. Mark API routes as dynamic
2. Add cache control headers
3. Configure output as standalone

Key settings:
```js
// Force all API routes to be dynamic
rewrites: async () => {
  return [
    {
      source: '/api/:path*',
      destination: '/api/:path*',
      has: [
        {
          type: 'header',
          key: 'x-skip-static-generation',
          value: 'true'
        }
      ]
    }
  ];
},
// Add special headers for authentication and cache control
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
        { key: 'Pragma', value: 'no-cache' },
        { key: 'Expires', value: '0' },
        { key: 'X-Skip-Static-Generation', value: 'true' }
      ],
    },
    {
      source: '/(dashboard|profile|history|meal-analysis|meal/:path*)',
      headers: [
        { key: 'Cache-Control', value: 'no-store' }
      ],
    }
  ];
}
```

### 2. Middleware Authentication

The `middleware.ts` file ensures proper authentication across the site:

```typescript
// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/history',
  '/meal-analysis',
  '/meal/',
];

// In middleware function:
// Create a Supabase client
const supabase = createMiddlewareClient({ req, res });

// Refresh session if it exists
const {
  data: { session },
} = await supabase.auth.getSession();

// Handle protected routes (redirect to login if not authenticated)
if (isProtectedRoute && !session) {
  const redirectUrl = new URL('/login', req.url);
  redirectUrl.searchParams.set('redirect', 'true');
  return NextResponse.redirect(redirectUrl);
}
```

### 3. API Routes Helper

Use the `src/lib/api-route-helper.ts` helper to ensure all API routes can access authentication:

```typescript
// In your API route:
import { createDynamicResponse } from '@/lib/api-route-helper';

export const dynamic = 'force-dynamic';

export const POST = createDynamicResponse(async (request) => {
  // Handle API request with proper headers
});
```

## Vercel-Specific Settings

For Vercel deployments, ensure:

1. Environment variables are properly set
2. Serverless functions have sufficient memory (at least 1GB)
3. Output is set to 'standalone' in next.config.js

## Testing Authentication

After deploying fixes, test:

1. Login/logout flow
2. Session persistence across page refreshes
3. Protected route access
4. API endpoints that require authentication
5. Image uploads with authentication

If issues persist, check Vercel logs for detailed error information.

## Need More Help?

Contact the development team or refer to the [Next.js Authentication Docs](https://nextjs.org/docs/authentication) and [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs) for additional guidance. 