# Supabase Configuration Guide

## URL Configuration Setup

1. **Navigate to Supabase Authentication Settings**:
   - Go to your Supabase dashboard: https://supabase.com/dashboard/project/cyrztlmzanhfybqsakgc
   - Click on "Authentication" in the left sidebar
   - Select "URL Configuration"

2. **Set Site URL**:
   - Add your Vercel deployment URL: `https://snap2-healthmain-etaqq1a4p-jonah-tenner-s-projects.vercel.app`
   - Make sure to save the changes

3. **Add Redirect URLs**:
   - Add your Vercel deployment URL: `https://snap2-healthmain-etaqq1a4p-jonah-tenner-s-projects.vercel.app`
   - Add your Vercel deployment URL with common paths:
     - `https://snap2-healthmain-etaqq1a4p-jonah-tenner-s-projects.vercel.app/login`
     - `https://snap2-healthmain-etaqq1a4p-jonah-tenner-s-projects.vercel.app/signup`
     - `https://snap2-healthmain-etaqq1a4p-jonah-tenner-s-projects.vercel.app/api/auth/callback`
   - Save the changes

## Email Authentication Setup

1. Navigate to "Authentication" → "Providers"
2. Ensure "Email" is enabled
3. Configure email templates if needed

## Database Setup

The SQL script you've executed has created:
- `profiles` table with required fields and policies
- `meal_history` table with required fields and policies

## Storage Setup

1. Navigate to "Storage" 
2. Ensure "meal-images" bucket exists and is public

## API Configuration

1. Navigate to "Settings" → "API"
2. Under "Project API keys", copy the anon/public key
3. Make sure this key is set as `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your Vercel environment variables

## JWT Settings

1. Navigate to "Authentication" → "JWT Settings"
2. Set a reasonable expiry time (like 3600 seconds / 1 hour)

## Troubleshooting

If you continue to experience authentication issues:

1. **Clear browser cookies** for your application domain
2. **Check browser console** for specific errors
3. **Verify all environment variables** are correctly set in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - `DATABASE_URL`
   - `NEXT_PUBLIC_APP_ENV` (should be "production")
   - `NEXT_PUBLIC_AUTH_BYPASS` (should be "false")

4. **Re-deploy** your application after making configuration changes
5. **Check Supabase logs** for authentication errors 