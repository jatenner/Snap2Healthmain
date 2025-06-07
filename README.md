# Snap2Health 🍎📸

AI-powered meal analysis and nutrition tracking application that transforms food photos into actionable nutrition insights.

## ✨ Features

- **AI-Powered Analysis**: Uses OpenAI GPT-4o vision to analyze meal photos
- **Personalized Nutrition**: Tailored insights based on user profile and goals
- **Meal History**: Day-by-day organization of analyzed meals
- **Modern UI**: Dark theme with responsive design
- **Real-time Analysis**: Fast meal processing under 10 seconds
- **Custom Branding**: Professional Snap2Health logo and design

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL + Storage)
- **AI**: OpenAI GPT-4o Vision API
- **Styling**: Tailwind CSS, Radix UI
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jatenner/Snap2Healthmain.git
   cd snap2health
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
snap2health/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── components/        # React components
│   ├── lib/              # Utility functions
│   ├── upload/           # Upload page
│   ├── meal-history/     # History page
│   └── analysis/         # Analysis results
├── public/               # Static assets
├── utils/               # Helper utilities
└── prisma/             # Database schema
```

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Set up the meals table with proper RLS policies
3. Configure storage bucket for meal images
4. Add your Supabase credentials to `.env.local`

### OpenAI Setup
1. Get an OpenAI API key
2. Ensure GPT-4o vision access
3. Add your API key to `.env.local`

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Manual Build
```bash
npm run build
npm start
```

## 📱 Usage

1. **Upload a meal photo** on the upload page
2. **Wait for AI analysis** (typically under 10 seconds)
3. **View detailed nutrition insights** including:
   - Macronutrients and micronutrients
   - Personalized daily value percentages
   - Health benefits and concerns
   - Expert recommendations
4. **Browse meal history** organized by day
5. **Track nutrition progress** over time

## 🎯 Key Features

### AI Analysis
- Food identification and portion estimation
- Comprehensive nutrient breakdown
- Personalized recommendations based on user profile
- Health insights and metabolic impact

### User Experience
- Drag-and-drop image upload
- Real-time analysis progress
- Mobile-responsive design
- Dark theme interface

### Data Management
- Secure image storage in Supabase
- Meal history with search and filtering
- User profile management
- Privacy-focused design

## 🔒 Security

- Environment variables for sensitive data
- Supabase Row Level Security (RLS)
- Secure API key management
- No sensitive data in repository

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.

---

Built with ❤️ for better nutrition tracking

<!-- ✅ ALL MODULE RESOLUTION ISSUES FIXED - PRODUCTION BUILD SUCCESSFUL -->
# Railway deployment with environment variables

<!-- Railway deployment trigger with env vars -->
# Force Railway redeployment with FORCE_DEV_MODE

<!-- Railway deployment trigger with FORCE_DEV_MODE bypass enabled -->
<!-- Deployment timestamp: 2024-01-XX -->
