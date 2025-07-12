'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface CoachingInsight {
  id: string;
  type: 'recommendation' | 'alert' | 'achievement' | 'trend';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  timestamp: Date;
}

interface UserPatterns {
  avgCalories: number;
  avgProtein: number;
  mealFrequency: string;
  trends: any;
  deficiencies: string[];
  strengths: string[];
}

export default function RealTimeCoach({ userId }: { userId: string }) {
  const [insights, setInsights] = useState<CoachingInsight[]>([]);
  const [patterns, setPatterns] = useState<UserPatterns | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCoach, setShowCoach] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserPatterns();
      generateRealTimeInsights();
    }
  }, [userId]);

  const loadUserPatterns = async () => {
    try {
      const response = await fetch('/api/chat/enhanced-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          action: 'analyze_patterns'
        })
      });

      const data = await response.json();
      setPatterns(data.patterns);
    } catch (error) {
      console.error('Failed to load user patterns:', error);
    }
  };

  const generateRealTimeInsights = async () => {
    try {
      const response = await fetch('/api/chat/enhanced-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          action: 'generate_insights'
        })
      });

      const data = await response.json();
      const generatedInsights = transformInsightsToCoaching(data.insights);
      setInsights(generatedInsights);
      setLoading(false);
    } catch (error) {
      console.error('Failed to generate insights:', error);
      setLoading(false);
    }
  };

  const transformInsightsToCoaching = (rawInsights: any): CoachingInsight[] => {
    const coachingInsights: CoachingInsight[] = [];

    // Transform recommendations
    rawInsights.recommendations?.forEach((rec: string, index: number) => {
      coachingInsights.push({
        id: `rec-${index}`,
        type: 'recommendation',
        title: 'Nutrition Recommendation',
        message: rec,
        priority: 'medium',
        actionable: true,
        timestamp: new Date()
      });
    });

    // Transform alerts
    rawInsights.alerts?.forEach((alert: string, index: number) => {
      coachingInsights.push({
        id: `alert-${index}`,
        type: 'alert',
        title: 'Health Alert',
        message: alert,
        priority: 'high',
        actionable: true,
        timestamp: new Date()
      });
    });

    // Transform achievements
    rawInsights.achievements?.forEach((achievement: string, index: number) => {
      coachingInsights.push({
        id: `achievement-${index}`,
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: achievement,
        priority: 'low',
        actionable: false,
        timestamp: new Date()
      });
    });

    return coachingInsights;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'recommendation': return '💡';
      case 'alert': return '⚠️';
      case 'achievement': return '🏆';
      case 'trend': return '📈';
      default: return '💬';
    }
  };

  const getInsightColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm">
          <div className="animate-pulse flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Coach Toggle Button */}
      <button
        onClick={() => setShowCoach(!showCoach)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 mb-2"
      >
        🤖 AI Coach {insights.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
            {insights.length}
          </span>
        )}
      </button>

      {/* Coach Panel */}
      {showCoach && (
        <div className="bg-white rounded-lg shadow-xl border max-w-sm max-h-96 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
            <h3 className="font-bold text-lg">🤖 Your AI Nutrition Coach</h3>
            <p className="text-sm opacity-90">Real-time personalized insights</p>
          </div>

          {/* Insights */}
          <div className="max-h-80 overflow-y-auto">
            {insights.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>Keep tracking meals to unlock personalized coaching insights!</p>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {insights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`border-l-4 p-3 rounded-r-lg ${getInsightColor(insight.priority)}`}
                  >
                    <div className="flex items-start space-x-2">
                      <span className="text-lg">{getInsightIcon(insight.type)}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-800">
                          {insight.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {insight.message}
                        </p>
                        {insight.actionable && (
                          <button className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded mt-2 hover:bg-blue-200 transition-colors">
                            Take Action
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {patterns && (
            <div className="border-t bg-gray-50 p-3">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">📊 Your Patterns</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-bold text-blue-600">{patterns.avgCalories}</div>
                  <div className="text-gray-500">Avg Calories</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">{patterns.avgProtein}g</div>
                  <div className="text-gray-500">Avg Protein</div>
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  patterns.mealFrequency === 'very_consistent' ? 'bg-green-100 text-green-700' :
                  patterns.mealFrequency === 'consistent' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {patterns.mealFrequency.replace('_', ' ')} tracking
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 