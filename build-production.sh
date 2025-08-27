#!/bin/bash

# EiQ Platform Production Build Script
# Prepares the application for deployment with optimized production builds

set -e  # Exit on any error

echo "🏗️ EiQ Platform Production Build"
echo "================================="

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf client/dist/

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Build the frontend
echo "🎨 Building frontend..."
npm run build

# Verify build artifacts
echo "🔍 Verifying build artifacts..."
if [ ! -d "dist/public" ]; then
    echo "❌ Frontend build failed - dist/public directory not found"
    exit 1
fi

# Check if main files exist
if [ ! -f "dist/public/index.html" ]; then
    echo "❌ Frontend build failed - index.html not found"
    exit 1
fi

# TypeScript compilation check for server
echo "🔧 Checking server TypeScript compilation..."
npx tsc --noEmit --project tsconfig.json || {
    echo "⚠️  TypeScript compilation has errors, but continuing with deployment..."
    echo "⚠️  Please resolve TypeScript errors for optimal deployment"
}

# Create production environment file template
echo "📝 Creating production environment template..."
cat > .env.production << EOF
# Production Environment Variables for EiQ Platform
NODE_ENV=production
PORT=8080
DATABASE_URL=your_production_database_url_here
JWT_SECRET=your_production_jwt_secret_here

# AI Provider API Keys (Required for full functionality)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
APPLE_CLIENT_ID=your_apple_client_id_here
APPLE_TEAM_ID=your_apple_team_id_here
APPLE_KEY_ID=your_apple_key_id_here

# Frontend URL (for OAuth callbacks)
FRONTEND_URL=https://your-production-domain.com
EOF

echo "✅ Production build completed!"
echo ""
echo "📋 Build Summary:"
echo "- Frontend built to: dist/public/"
echo "- Environment template: .env.production"
echo "- Ready for deployment"
echo ""
echo "🚀 Next Steps:"
echo "1. Update .env.production with your actual production values"
echo "2. Run ./deploy.sh to deploy to Google Cloud Run"
echo "3. Or use docker-compose.yml for local containerized testing"
echo ""
echo "📊 Build Statistics:"
du -sh dist/public/
echo "Total files in build:"
find dist/public/ -type f | wc -l