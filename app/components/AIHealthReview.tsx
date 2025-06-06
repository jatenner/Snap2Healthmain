'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/auth';
import { useProfile } from '../lib/profile-context';
import { Skeleton } from './ui/skeleton';
import { UserProfile } from '../lib/profile-utils';

interface AIHealthReviewProps {
  mealId?: string;
  userProfile?: UserProfile | null;
  benefits?: string[];
  concerns?: string[];
  suggestions?: string[];
  goal?: string;
  insights?: string | null | undefined;
  personalizedInsights?: string;
}

export default function AIHealthReview({ 
  mealId,
  userProfile,
  benefits,
  concerns,
  suggestions,
  goal,
  insights,
  personalizedInsights
}: AIHealthReviewProps) {
  const [displayInsights, setDisplayInsights] = useState<string | null>(personalizedInsights || insights || null);

  useEffect(() => {
    setDisplayInsights(personalizedInsights || insights || null);
  }, [insights, personalizedInsights]);

  // Helper to render a list section
  const renderListSection = (title: string, items?: string[]) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mt-4">
        <h4 className="font-semibold text-lg text-indigo-300 mb-1">{title}</h4>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    );
  };

  // Determine if there is any content to show
  const hasContent = displayInsights || 
                   personalizedInsights ||
                   (benefits && benefits.length > 0) || 
                   (concerns && concerns.length > 0) || 
                   (suggestions && suggestions.length > 0);

  if (!hasContent) {
    return (
      <div className="bg-gray-800/60 rounded-lg p-6 shadow-md text-center">
        <p className="text-gray-400">No detailed analysis data available for this meal.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/60 rounded-lg p-6 shadow-md space-y-4">
      <h3 className="text-xl font-bold text-indigo-200 border-b border-indigo-700/50 pb-2 mb-3">
        Personalized Health Insights
      </h3>
      
      {displayInsights && (
        <div className="prose prose-sm prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
          {displayInsights}
        </div>
      )}

      {renderListSection('Potential Benefits:', benefits)}
      {renderListSection('Potential Concerns:', concerns)}
      {renderListSection('Suggestions & Alternatives:', suggestions)}

      {(goal || userProfile?.goal) && (
        <p className="text-xs text-gray-500 mt-4 pt-2 border-t border-gray-700/50">
          These insights are tailored to your goal of: {goal || userProfile?.goal}.
        </p>
      )}
    </div>
  );
}
