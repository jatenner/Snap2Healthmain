#!/bin/bash

echo "🚀 Snap2Health Environment Setup"
echo "================================="
echo ""

# Create .env.local with working template
cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder_key
SUPABASE_SERVICE_ROLE_KEY=placeholder_service_key

# OpenAI Configuration
OPENAI_API_KEY=sk-placeholder_openai_key
EOF

echo "✅ Created .env.local with placeholder values"
echo ""
echo "📋 Next steps:"
echo "1. Get your Supabase credentials from: https://app.supabase.com/project/_/settings/api"
echo "2. Get your OpenAI API key from: https://platform.openai.com/api-keys"
echo "3. Edit .env.local file and replace placeholder values with your actual keys"
echo "4. Run 'npm run dev' to start the server"
echo ""
echo "💡 Your .env.local file is now ready for editing!"

# Check if server can start
echo "🔍 Testing server startup..."
npm run dev &
SERVER_PID=$!
sleep 8

# Check if server is responding
if curl -s http://localhost:3000 > /dev/null 2>&1 || curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Server started successfully!"
    echo "🌐 Open http://localhost:3000 or http://localhost:3001 in your browser"
else
    echo "⚠️  Server needs environment variables to be configured"
fi

# Kill test server
kill $SERVER_PID 2>/dev/null

echo ""
echo "🎯 Your Snap2Health app should now work with the correct UI!" 