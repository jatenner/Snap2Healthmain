<<<<<<< HEAD
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
=======
# Snap2Health

> A Next.js app that lets users snap a meal photo (or type a description) and instantly receive a research‑backed nutritional breakdown plus goal‑specific suggestions powered by GPT-4o.

## Features

- 📸 Upload food images or enter text descriptions
- 🧠 GPT-4o Vision analysis for accurate food recognition
- 🥦 Comprehensive nutrition breakdown (macros, micros, vitamins)
- 🔬 Personalized health insights based on user goals
- 🔒 User authentication via Supabase
- 📱 Responsive design for all devices

## Tech stack

| Layer | Choice | Notes |
|-------|--------|-------|
|Frontend|Next.js 13 **/app** router| TypeScript, React Server Components, Tailwind + shadcn/ui |
|Auth & DB|Supabase| Row‑level security; `meals`, `users`, `goals` tables |
|AI|OpenAI GPT‑4o | Vision + Text; streamed JSON responses |
|Deployment|Vercel| Serverless edge functions (route handlers) |
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)

## Getting Started

### Prerequisites

<<<<<<< HEAD
- Node.js 18.x or higher
- npm or yarn
=======
- Node.js 18+
- npm or pnpm
- Supabase CLI (for database migrations)
- OpenAI API key
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)

### Installation

1. Clone the repository:
<<<<<<< HEAD
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
=======

```bash
git clone https://github.com/yourusername/snap2health.git
cd snap2health
```

2. Install dependencies:

```bash
npm install
# or
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Edit `.env.local` and add your API keys:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
OPENAI_API_KEY=xxxxx
OPENAI_MODEL_GPT_VISION=gpt-4o
OPENAI_MODEL_GPT_TEXT=gpt-4o
```

5. Start the development server:

```bash
npm run dev
# or
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

1. Start your local Supabase instance:

```bash
supabase start
```

2. Apply migrations:

```bash
supabase db push
```

## Project Structure

```
snap2health/
├─ .vscode/
├─ .env.example
├─ README.md
├─ supabase/
│  ├─ migrations/
│  └─ seed/
├─ src/
│  ├─ app/
│  │  ├─ (auth)/login/page.tsx
│  │  ├─ upload/page.tsx
│  │  └─ meal-analysis/page.tsx
│  ├─ components/
│  │  ├─ NutrientCard.tsx
│  │  ├─ NutrientGroup.tsx
│  │  └─ HealthImpact.tsx
│  ├─ lib/
│  │  ├─ supabaseClient.ts
│  │  ├─ gpt/
│  │  │  ├─ visionPrompt.ts
│  │  │  ├─ nutritionPrompt.ts
│  │  │  └─ validator.ts
│  │  └─ utils.ts
│  └─ api/
│     ├─ analyze/route.ts
│     └─ auth/[...supabase].ts
└─ package.json
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Made with ☕ + 🌴 in 2025. 
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
