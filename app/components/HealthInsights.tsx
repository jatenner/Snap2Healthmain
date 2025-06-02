'use client';

import React, { useState } from 'react';
import { safeForEach, getArrayOrEmpty } from '../lib/utils';

interface HealthInsightsProps {
  insights?: string[];
  suggestions?: string[];
  concerns?: string[];
  userGoal?: string;
}

const HealthInsights: React.FC<HealthInsightsProps> = ({
  insights = [],
  suggestions = [],
  concerns = [],
  userGoal = 'General Wellness'
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // Toggle section expansion
  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };
  
  // Group insights by category
  const groupInsights = (insights: string[]) => {
    const categories: Record<string, string[]> = {
      'Macronutrients': [],
      'Micronutrients': [],
      'Digestion': [],
      'Energy': [],
      'Other': []
    };
    
    const keywordMap = {
      'Macronutrients': ['protein', 'carb', 'fat', 'calorie', 'sugar', 'fiber'],
      'Micronutrients': ['vitamin', 'mineral', 'iron', 'calcium', 'zinc', 'magnesium', 'potassium'],
      'Digestion': ['digest', 'gut', 'stomach', 'intestin', 'bowel', 'fiber'],
      'Energy': ['energy', 'fatigue', 'sugar level', 'glucose', 'blood sugar', 'metabolism', 'stamina']
    };
    
    // Use our safe forEach function
    safeForEach(insights, insight => {
      const lowercaseInsight = insight.toLowerCase();
      let categorized = false;
      
      // Check each category's keywords
      for (const [category, keywords] of Object.entries(keywordMap)) {
        if (keywords.some(keyword => lowercaseInsight.includes(keyword))) {
          categories[category].push(insight);
          categorized = true;
          break;
        }
      }
      
      // If not matched to any category
      if (!categorized) {
        categories['Other'].push(insight);
      }
    });
    
    // Return only categories that have insights
    return Object.entries(categories)
      .filter(([_, items]) => items.length > 0)
      .reduce((acc, [category, items]) => {
        acc[category] = items;
        return acc;
      }, {} as Record<string, string[]>);
  };
  
  // Group recommendations by focus area
  const groupRecommendations = (recommendations: string[]) => {
    const categories: Record<string, string[]> = {
      'Dietary Adjustments': [],
      'Food Suggestions': [],
      'Nutrient Focus': [],
      'Behavioral Tips': [],
      'General Advice': []
    };
    
    const keywordMap = {
      'Dietary Adjustments': ['increase', 'decrease', 'reduce', 'limit', 'avoid', 'cut back', 'lower', 'higher'],
      'Food Suggestions': ['include', 'add', 'eat', 'consume', 'try', 'choose', 'opt for', 'sources', 'foods'],
      'Nutrient Focus': ['protein', 'carb', 'fat', 'vitamin', 'mineral', 'nutrient', 'fiber', 'omega'],
      'Behavioral Tips': ['meal', 'snack', 'timing', 'portion', 'prepare', 'cook', 'track', 'monitor', 'measure']
    };
    
    // Use our safe forEach function
    safeForEach(recommendations, recommendation => {
      const lowercaseRecommendation = recommendation.toLowerCase();
      let categorized = false;
      
      // Check each category's keywords
      for (const [category, keywords] of Object.entries(keywordMap)) {
        if (keywords.some(keyword => lowercaseRecommendation.includes(keyword))) {
          categories[category].push(recommendation);
          categorized = true;
          break;
        }
      }
      
      // If not matched to any category
      if (!categorized) {
        categories['General Advice'].push(recommendation);
      }
    });
    
    // Return only categories that have recommendations
    return Object.entries(categories)
      .filter(([_, items]) => items.length > 0)
      .reduce((acc, [category, items]) => {
        acc[category] = items;
        return acc;
      }, {} as Record<string, string[]>);
  };
  
  // Use safe versions of insights and suggestions
  const safeInsights = getArrayOrEmpty(insights);
  const safeSuggestions = getArrayOrEmpty(suggestions);
  const safeConcerns = getArrayOrEmpty(concerns);
  
  const groupedInsights = groupInsights(safeInsights);
  const groupedRecommendations = groupRecommendations(safeSuggestions);
  
  // Lightbulb icon for insights
  const renderInsightIcon = () => (
    <svg className="w-5 h-5 text-cyan-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
    </svg>
  );
  
  // Checkmark icon for suggestions
  const renderSuggestionIcon = () => (
    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
  );
  
  // Warning icon for concerns
  const renderConcernIcon = () => (
    <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
    </svg>
  );
  
  // Nutrition icon
  const renderNutritionIcon = (category: string) => {
    // Different icons based on category
    switch (category) {
      case 'Macronutrients':
        return (
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
          </svg>
        );
      case 'Micronutrients':
        return (
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
          </svg>
        );
      case 'Energy':
        return (
          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        );
      case 'Digestion':
        return (
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-cyan-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
    }
  };
  
  return (
    <div className="space-y-6">
      {/* If there are any sections */}
      {(safeInsights.length > 0 || safeSuggestions.length > 0 || safeConcerns.length > 0) && (
        <div className="text-sm text-blue-100/70 mb-2">
          <p>Personalized health insights based on your meal and health goal: <span className="text-cyan-accent font-medium">{userGoal}</span></p>
        </div>
      )}
    
      {/* General Insights Section */}
      {safeInsights.length > 0 && (
        <div className="bg-darkBlue-accent/20 rounded-lg p-4">
          <div 
            className="flex justify-between items-center cursor-pointer" 
            onClick={() => toggleSection('insights')}
          >
            <div className="flex items-center space-x-2">
              <div className="bg-cyan-accent/20 p-2 rounded-full">
                {renderInsightIcon()}
              </div>
              <h3 className="font-medium text-cyan-accent">Nutritional Benefits</h3>
            </div>
            <button className="text-blue-100/70">
              <svg 
                className={`w-5 h-5 transition-transform ${expandedSection === 'insights' ? 'transform rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
          </div>
          
          <div className={`mt-2 ${expandedSection === 'insights' || expandedSection === null ? 'block' : 'hidden'}`}>
            {/* If we have grouped insights, render by category */}
            {Object.keys(groupedInsights).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(groupedInsights).map(([category, insights]) => (
                  <div key={category} className="space-y-1">
                    <h4 className="text-sm font-medium text-blue-100/90 flex items-center">
                      {renderNutritionIcon(category)}
                      <span className="ml-1">{category}</span>
                    </h4>
                    <ul className="space-y-2 pl-7">
                      {insights.map((insight, index) => (
                        <li key={`insight-${category}-${index}`} className="text-blue-100 list-disc">
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-2 pl-9">
                {safeInsights.map((insight, index) => (
                  <li key={`insight-${index}`} className="text-blue-100 list-disc">
                    {insight}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      
      {/* Recommendations / Suggestions Section */}
      {safeSuggestions.length > 0 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div 
            className="flex justify-between items-center cursor-pointer" 
            onClick={() => toggleSection('suggestions')}
          >
            <div className="flex items-center space-x-2">
              <div className="bg-green-500/20 p-2 rounded-full">
                {renderSuggestionIcon()}
              </div>
              <h3 className="font-medium text-green-400">Recommendations</h3>
            </div>
            <button className="text-blue-100/70">
              <svg 
                className={`w-5 h-5 transition-transform ${expandedSection === 'suggestions' ? 'transform rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
          </div>
          
          <div className={`mt-2 ${expandedSection === 'suggestions' || expandedSection === null ? 'block' : 'hidden'}`}>
            {/* If we have grouped recommendations, render by category */}
            {Object.keys(groupedRecommendations).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(groupedRecommendations).map(([category, recommendations]) => (
                  <div key={category} className="space-y-1">
                    <h4 className="text-sm font-medium text-green-400/90 border-b border-green-500/20 pb-1">
                      {category}
                    </h4>
                    <ul className="space-y-2 pl-7 mt-2">
                      {recommendations.map((recommendation, index) => (
                        <li key={`recommendation-${category}-${index}`} className="text-blue-100 list-disc">
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-2 pl-9">
                {safeSuggestions.map((suggestion, index) => (
                  <li key={`suggestion-${index}`} className="text-blue-100 list-disc">
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      
      {/* Health Concerns Section */}
      {safeConcerns.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
          <div 
            className="flex justify-between items-center cursor-pointer" 
            onClick={() => toggleSection('concerns')}
          >
            <div className="flex items-center space-x-2">
              <div className="bg-amber-500/20 p-2 rounded-full">
                {renderConcernIcon()}
              </div>
              <h3 className="font-medium text-amber-400">Health Considerations</h3>
            </div>
            <button className="text-blue-100/70">
              <svg 
                className={`w-5 h-5 transition-transform ${expandedSection === 'concerns' ? 'transform rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
          </div>
          
          <div className={`mt-2 ${expandedSection === 'concerns' || expandedSection === null ? 'block' : 'hidden'}`}>
            <ul className="space-y-2 pl-9">
              {safeConcerns.map((concern, index) => (
                <li key={`concern-${index}`} className="text-blue-100 list-disc">
                  {concern}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Show if no insights are provided */}
      {safeInsights.length === 0 && safeSuggestions.length === 0 && safeConcerns.length === 0 && (
        <div className="text-center py-6">
          <svg className="w-12 h-12 mx-auto text-blue-100/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
          <p className="text-blue-100/60 mt-4">
            No health insights available for this meal yet.
          </p>
          <p className="text-blue-100/40 text-sm mt-2">
            Try uploading a new meal image to get personalized health recommendations.
          </p>
        </div>
      )}
    </div>
  );
};

export default HealthInsights; 