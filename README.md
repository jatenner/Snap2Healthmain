# Snap2Health App

## Overview

Snap2Health is an AI-powered nutrition app that analyzes food images and provides personalized nutritional insights based on the user's health goals and profile data.

## Stable Launch Guide

To reliably run Snap2Health without any port conflicts or UI glitches:

```bash
# Use our stable development server:
npm run dev:stable

# If you encounter any issues:
npm run fix
```

## Key Features

- **Image Analysis**: Upload or take photos of your meals for instant nutritional analysis
- **Personalized Insights**: Get analysis tailored to your health goals
- **User Profiles**: Store your health data for personalized recommendations
- **Meal History**: Track your meals and nutritional patterns over time

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/snap2health.git
   cd snap2health
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env.local` file with the following:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_APP_ENV=development
   ```

4. Start the development server:
   ```bash
   npm run dev:stable
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Reliable Usage Commands

Snap2Health includes several utility scripts for reliable operation:

- `npm run dev:stable` - Start development server with clean ports and caches (recommended)
- `npm run dev:clean` - Start development server after cleaning .next directory
- `npm run kill-ports` - Kill all processes on ports 3000-3010
- `npm run clean` - Clean all caches (.next, node_modules/.cache)
- `npm run fix` - Run comprehensive fixes for common issues

## Stability Improvements

Recent improvements have addressed several issues:

- Fixed infinite reload loops and emergency script interference
- Resolved port conflicts and server startup issues
- Improved authentication stability with better fallbacks
- Enhanced script loading and asset caching
- Optimized static file delivery and error handling

For more details on stability improvements, see [STABILITY.md](STABILITY.md).

## Deployment

### Vercel Deployment

To prepare for deployment:

```bash
# Prepare the app for Vercel deployment
npm run prepare-vercel

# Deploy to Vercel
vercel --prod
```

## Architecture

- **Frontend**: Next.js 14 with App Router, React and Tailwind CSS
- **Backend**: Next.js API routes, Supabase for authentication and data storage
- **Image Analysis**: AI-powered image processing for nutritional analysis
- **State Management**: Context API and cookies for state persistence

## Folder Structure

- `app/` - Next.js App Router pages and layouts
- `src/components/` - React components
- `src/lib/` - Utility functions and API clients
- `public/` - Static assets
- `scripts/` - Utility scripts for development and deployment
- `app/api/` - API routes

## Troubleshooting

If you encounter any issues:

1. Run `npm run fix` to automatically address common problems
2. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions
3. Ensure you're using the stable scripts (`npm run dev:stable`)
4. Clear your browser cache and restart the development server

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details. 