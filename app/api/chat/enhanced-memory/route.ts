import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Enhanced user memory and learning system
class UserMemorySystem {
  private userId: string;
  private supabase: any;

  constructor(userId: string, supabase: any) {
    this.userId = userId;
    this.supabase = supabase;
  }

  // Analyze user's eating patterns and trends
  async analyzeEatingPatterns() {
    const { data: meals } = await this.supabase
      .from('meals')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()) // Last 60 days
      .order('created_at', { ascending: false });

    if (!meals || meals.length < 5) {
      return { status: 'insufficient_data', recommendations: ['Track more meals for personalized insights'] };
    }

    // Analyze patterns
    const patterns = {
      avgCalories: this.calculateAverage(meals, 'calories'),
      avgProtein: this.calculateAverage(meals, 'protein'),
      avgCarbs: this.calculateAverage(meals, 'carbs'),
      avgFat: this.calculateAverage(meals, 'fat'),
      mealFrequency: this.calculateMealFrequency(meals),
      commonFoods: this.extractCommonFoods(meals),
      nutritionTrends: this.analyzeTrends(meals),
      deficiencies: this.identifyDeficiencies(meals),
      strengths: this.identifyStrengths(meals)
    };

    return patterns;
  }

  // Learn from user feedback and corrections
  async learnFromFeedback(mealId: string, feedback: any) {
    const { data: existingLearning } = await this.supabase
      .from('user_learning_data')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    const learningData = existingLearning?.learning_data || {};
    
    // Update learning based on feedback
    if (feedback.type === 'correction') {
      learningData.corrections = learningData.corrections || [];
      learningData.corrections.push({
        mealId,
        originalAnalysis: feedback.original,
        correctedAnalysis: feedback.corrected,
        timestamp: new Date().toISOString()
      });
    }

    if (feedback.type === 'preference') {
      learningData.preferences = learningData.preferences || {};
      learningData.preferences[feedback.category] = feedback.value;
    }

    // Save updated learning data
    await this.supabase
      .from('user_learning_data')
      .upsert({
        user_id: this.userId,
        learning_data: learningData,
        updated_at: new Date().toISOString()
      });

    return learningData;
  }

  // Generate personalized coaching insights
  async generatePersonalizedInsights(currentMeal?: any) {
    const patterns = await this.analyzeEatingPatterns();
    const { data: userGoals } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', this.userId)
      .single();

    const insights = {
      patterns,
      recommendations: this.generateRecommendations(patterns, userGoals),
      trends: this.analyzeLongTermTrends(patterns),
      alerts: this.generateHealthAlerts(patterns),
      achievements: this.identifyAchievements(patterns)
    };

    return insights;
  }

  // Analyze conversation patterns to understand user preferences
  async analyzeConversationPatterns() {
    const { data: conversations } = await this.supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (!conversations || conversations.length === 0) {
      return { topics: [], preferences: {}, communicationStyle: 'unknown' };
    }

    const topics = this.extractTopics(conversations);
    const preferences = this.extractPreferences(conversations);
    const communicationStyle = this.determineCommunicationStyle(conversations);

    return { topics, preferences, communicationStyle };
  }

  // Helper methods
  private calculateAverage(meals: any[], field: string): number {
    const values = meals.map(meal => meal[field] || 0).filter(val => val > 0);
    return values.length > 0 ? Math.round(values.reduce((sum, val) => sum + val, 0) / values.length) : 0;
  }

  private calculateMealFrequency(meals: any[]): string {
    const daysWithMeals = new Set(meals.map(meal => 
      new Date(meal.created_at).toDateString()
    )).size;
    
    const totalDays = Math.min(60, Math.ceil((Date.now() - new Date(meals[meals.length - 1]?.created_at).getTime()) / (24 * 60 * 60 * 1000)));
    const frequency = daysWithMeals / totalDays;
    
    if (frequency > 0.8) return 'very_consistent';
    if (frequency > 0.5) return 'consistent';
    if (frequency > 0.3) return 'moderate';
    return 'inconsistent';
  }

  private extractCommonFoods(meals: any[]): string[] {
    const foodCounts = new Map();
    
    meals.forEach(meal => {
      const foods = meal.ingredients || [];
      foods.forEach((food: string) => {
        foodCounts.set(food, (foodCounts.get(food) || 0) + 1);
      });
    });

    return Array.from(foodCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([food]) => food);
  }

  private analyzeTrends(meals: any[]): any {
    // Analyze trends over time (last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recent = meals.filter(meal => new Date(meal.created_at) > thirtyDaysAgo);
    const previous = meals.filter(meal => {
      const date = new Date(meal.created_at);
      return date > sixtyDaysAgo && date <= thirtyDaysAgo;
    });

    if (recent.length < 3 || previous.length < 3) {
      return { status: 'insufficient_data' };
    }

    return {
      calories: this.calculateTrend(recent, previous, 'calories'),
      protein: this.calculateTrend(recent, previous, 'protein'),
      carbs: this.calculateTrend(recent, previous, 'carbs'),
      fat: this.calculateTrend(recent, previous, 'fat')
    };
  }

  private calculateTrend(recent: any[], previous: any[], field: string): any {
    const recentAvg = this.calculateAverage(recent, field);
    const previousAvg = this.calculateAverage(previous, field);
    
    if (previousAvg === 0) return { trend: 'unknown', change: 0 };
    
    const percentChange = ((recentAvg - previousAvg) / previousAvg) * 100;
    
    return {
      trend: percentChange > 10 ? 'increasing' : percentChange < -10 ? 'decreasing' : 'stable',
      change: Math.round(percentChange),
      recentAvg,
      previousAvg
    };
  }

  private identifyDeficiencies(meals: any[]): string[] {
    const deficiencies = [];
    const avgProtein = this.calculateAverage(meals, 'protein');
    const avgCalories = this.calculateAverage(meals, 'calories');
    
    // Basic deficiency checks
    if (avgProtein < 50) deficiencies.push('Low protein intake');
    if (avgCalories < 1200) deficiencies.push('Very low calorie intake');
    
    // Check micronutrient patterns
    const micronutrientCounts = new Map();
    meals.forEach(meal => {
      const micros = meal.micronutrients || [];
      micros.forEach((micro: any) => {
        if (micro.percentDailyValue < 20) {
          micronutrientCounts.set(micro.name, (micronutrientCounts.get(micro.name) || 0) + 1);
        }
      });
    });

    // Identify consistently low micronutrients
    micronutrientCounts.forEach((count, nutrient) => {
      if (count > meals.length * 0.7) {
        deficiencies.push(`Low ${nutrient}`);
      }
    });

    return deficiencies;
  }

  private identifyStrengths(meals: any[]): string[] {
    const strengths = [];
    const avgProtein = this.calculateAverage(meals, 'protein');
    
    if (avgProtein > 80) strengths.push('Excellent protein intake');
    if (this.calculateMealFrequency(meals) === 'very_consistent') {
      strengths.push('Very consistent tracking');
    }

    return strengths;
  }

  private generateRecommendations(patterns: any, userGoals: any): string[] {
    const recommendations = [];
    
    if (patterns.deficiencies?.includes('Low protein intake')) {
      recommendations.push('Increase protein to 1.6-2.2g per kg body weight');
    }
    
    if (patterns.mealFrequency === 'inconsistent') {
      recommendations.push('Aim to track meals daily for better insights');
    }
    
    return recommendations;
  }

  private analyzeLongTermTrends(patterns: any): any {
    // Analyze long-term trends and provide insights
    return {
      direction: 'improving', // placeholder
      keyMetrics: ['protein', 'consistency'],
      timeframe: '60_days'
    };
  }

  private generateHealthAlerts(patterns: any): string[] {
    const alerts = [];
    
    if (patterns.avgCalories < 1000) {
      alerts.push('⚠️ Very low calorie intake detected');
    }
    
    return alerts;
  }

  private identifyAchievements(patterns: any): string[] {
    const achievements = [];
    
    if (patterns.mealFrequency === 'very_consistent') {
      achievements.push('🏆 Tracking Champion - 30+ days consistent');
    }
    
    return achievements;
  }

  private extractTopics(conversations: any[]): string[] {
    const topics = new Set<string>();
    
    conversations.forEach(conv => {
      const content = conv.content.toLowerCase();
      if (content.includes('protein')) topics.add('protein');
      if (content.includes('weight')) topics.add('weight_management');
      if (content.includes('energy')) topics.add('energy_levels');
      // Add more topic extraction logic
    });
    
    return Array.from(topics);
  }

  private extractPreferences(conversations: any[]): any {
    // Extract user preferences from conversations
    return {
      responseLength: 'detailed', // based on user feedback
      focusAreas: ['nutrition', 'performance']
    };
  }

  private determineCommunicationStyle(conversations: any[]): string {
    // Analyze how user prefers to communicate
    return 'detailed'; // placeholder
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, action, data } = await request.json();
    
    if (!user_id) {
      return NextResponse.json({
        error: 'User ID required'
      }, { status: 400 });
    }

    const memorySystem = new UserMemorySystem(user_id, supabaseAdmin);

    switch (action) {
      case 'analyze_patterns':
        const patterns = await memorySystem.analyzeEatingPatterns();
        return NextResponse.json({ patterns });

      case 'learn_feedback':
        const learning = await memorySystem.learnFromFeedback(data.mealId, data.feedback);
        return NextResponse.json({ learning });

      case 'generate_insights':
        const insights = await memorySystem.generatePersonalizedInsights(data.currentMeal);
        return NextResponse.json({ insights });

      case 'conversation_analysis':
        const conversationPatterns = await memorySystem.analyzeConversationPatterns();
        return NextResponse.json({ conversationPatterns });

      default:
        return NextResponse.json({
          error: 'Invalid action'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Enhanced memory system error:', error);
    return NextResponse.json({
      error: 'Memory system failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 