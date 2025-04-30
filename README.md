# Snap2Health

AI-powered nutrition analysis and meal tracking application.

## Overview

Snap2Health allows users to upload images of their meals and receive detailed nutritional analysis, personalized health insights, and recommendations based on their health goals and profile.

## Key Features

- **AI-Powered Image Analysis**: Upload meal photos for instant nutritional breakdown
- **Detailed Nutrition Information**: View comprehensive macro and micronutrient data
- **Health Goal Personalization**: Get recommendations based on your specific health objectives
- **Meal History**: Save and review past meal analyses
- **User Profiles**: Enter height, weight, and other details for personalized insights

## Requirements

- Node.js 16+
- Supabase account (for authentication and storage)
- OpenAI API key (for image analysis)

## Setup Instructions

### 1. Environment Setup

Create a `.env.local` file in the root directory with the following:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL_GPT_VISION=gpt-4o
OPENAI_MODEL_GPT_TEXT=gpt-4o

NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_AUTH_BYPASS=false
```

### 2. Supabase Setup

1. Create a Supabase project
2. Set up authentication (Email authentication)
3. Create database tables:
   - Execute the following SQL to create required tables:

```sql
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  goal TEXT,
  image_url TEXT,
  caption TEXT,
  analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable row level security
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- Create access policies
CREATE POLICY "Users can view their own meals"
  ON public.meals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meals"
  ON public.meals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

4. Create a storage bucket:
   - Name: `meal-images`
   - Make it public
   - Set size limits as needed

### 3. Install Dependencies

```bash
npm install
```

### 4. Development Server

```bash
npm run dev
```

### 5. Production Deployment

#### Build and Start Locally

```bash
npm run prod-deploy
```

#### Deploy to Vercel

1. Push your code to a GitHub repository
2. Connect the repository to Vercel
3. Configure environment variables in the Vercel dashboard
4. Deploy

## Project Structure

- `app/` - Next.js app router-based components
- `src/components/` - Primary React components
- `lib/` - Utility functions and API clients
- `public/` - Static assets

## Implementation Notes

- The application uses Imperial units (inches/pounds) for height/weight in user profiles
- BMI calculations have been updated to work with these units
- Authentication is required in production (AUTH_BYPASS=false)
- OpenAI API integration analyzes food images and provides nutritional data 