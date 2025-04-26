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

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase CLI (for database migrations)
- OpenAI API key

### Installation

1. Clone the repository:

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