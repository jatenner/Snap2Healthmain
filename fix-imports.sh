#!/bin/bash

echo "🔍 Checking for deprecated Supabase auth-helpers imports..."

# Search for any remaining deprecated imports
DEPRECATED_IMPORTS=$(grep -r "@supabase/auth-helpers-nextjs" . --exclude-dir=node_modules --exclude-dir=.next --exclude="*.sh" 2>/dev/null)

if [ -z "$DEPRECATED_IMPORTS" ]; then
    echo "✅ No deprecated Supabase auth-helpers imports found!"
    echo "🚀 Your app is ready for production deployment."
else
    echo "⚠️  Found deprecated imports that need to be updated:"
    echo "$DEPRECATED_IMPORTS"
    echo ""
    echo "📝 Replace with:"
    echo "  - createRouteHandlerClient → createClient from '@/lib/supabase/server'"
    echo "  - createClientComponentClient → createBrowserClient from '@supabase/ssr'"
    echo "  - createServerComponentClient → createClient from '@/lib/supabase/server'"
fi

echo ""
echo "🔧 Environment check:"
if [ -f ".env.local" ]; then
    echo "✅ .env.local found"
else
    echo "❌ .env.local missing - copy from .env.example"
fi

echo "📦 Package status:"
if npm list @supabase/ssr > /dev/null 2>&1; then
    echo "✅ @supabase/ssr installed"
else
    echo "❌ @supabase/ssr missing - run 'npm install @supabase/ssr'"
fi

if npm list autoprefixer > /dev/null 2>&1; then
    echo "✅ autoprefixer installed"
else
    echo "❌ autoprefixer missing - run 'npm install autoprefixer'"
fi 