'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './client/ClientAuthProvider';

interface Nutrient {
  name: string;
  amount: number;
  unit: string;
  percentDailyValue?: number;
  description?: string;
  status?: 'low' | 'adequate' | 'high';
}

interface MealAnalysisData {
  id?: string;
  calories?: number;
  macronutrients?: Nutrient[];
  micronutrients?: Nutrient[];
  mealName?: string;
  meal_name?: string;
  imageUrl?: string;
  image_url?: string;
  created_at?: string;
  personalized_insights?: string;
  analysis?: {
    calories?: number;
    macronutrients?: Nutrient[];
    micronutrients?: Nutrient[];
    personalized_insights?: string;
  };
  [key: string]: any;
}

interface MobileOptimizedAnalysisProps {
  analysisData: MealAnalysisData;
  userGoal?: string;
}

const MobileOptimizedAnalysis: React.FC<MobileOptimizedAnalysisProps> = ({ 
  analysisData, 
  userGoal 
}) => {
  const [activeTab, setActiveTab] = useState<'nutrients' | 'ai-insights'>('nutrients');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [personalizedInsights, setPersonalizedInsights] = useState<string>('');
  const { user } = useAuth();

  const getMacronutrients = (): Nutrient[] => {
    const macros = analysisData?.macronutrients || analysisData?.analysis?.macronutrients || [];
    return Array.isArray(macros) ? macros : [];
  };

  const getMicronutrients = (): Nutrient[] => {
    const micros = analysisData?.micronutrients || analysisData?.analysis?.micronutrients || [];
    return Array.isArray(micros) ? micros : [];
  };

  const getCalories = (): number => {
    return analysisData?.calories || analysisData?.analysis?.calories || 0;
  };

  const getMealName = (): string => {
    return analysisData?.mealName || analysisData?.meal_name || 'Your Meal';
  };

  const getImageUrl = (): string => {
    return analysisData?.imageUrl || analysisData?.image_url || '';
  };

  const generatePersonalizedInsights = async () => {
    if (!user?.id || !analysisData?.id) return;
    
    setIsGeneratingInsights(true);
    try {
      const response = await fetch('/api/generate-personalized-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealId: analysisData.id,
          userId: user.id,
          userGoal: userGoal
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setPersonalizedInsights(data.insights || 'No insights generated.');
      }
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  useEffect(() => {
    const existingInsights = analysisData?.personalized_insights || analysisData?.analysis?.personalized_insights;
    if (existingInsights) {
      setPersonalizedInsights(existingInsights);
    }
  }, [analysisData]);

  const getNutrientStatusColor = (nutrient: Nutrient): string => {
    const dv = nutrient.percentDailyValue || 0;
    if (dv >= 50) return 'bg-green-500';
    if (dv >= 25) return 'bg-yellow-500';
    if (dv >= 10) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (!analysisData) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 text-center mobile-padding">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto px-3 sm:px-0">
      {/* Mobile-Optimized Meal Header */}
      {getImageUrl() && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 shadow-xl">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-32 h-32 sm:w-40 sm:h-40 relative rounded-lg overflow-hidden shadow-lg flex-shrink-0">
              <img
                src={getImageUrl()}
                alt={getMealName()}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight mobile-text">{getMealName()}</h2>
              <div className="text-2xl sm:text-3xl font-bold text-blue-400">
                {getCalories()} <span className="text-base sm:text-lg font-normal text-gray-400">calories</span>
              </div>
              {analysisData.created_at && (
                <p className="text-gray-400 text-sm sm:text-base">
                  {new Date(analysisData.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
        
      {/* Mobile-Optimized Analysis Card */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-xl">
        {/* Mobile-Friendly Tab Navigation */}
        <div className="border-b border-gray-700">
          <nav className="flex">
            <button 
              onClick={() => setActiveTab('nutrients')}
              className={`flex-1 py-4 px-2 text-center font-semibold transition-all touch-target ${
                activeTab === 'nutrients' 
                  ? 'bg-blue-600 text-white border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <span className="flex flex-col items-center justify-center text-sm">
                📊
                <span className="mt-1">Nutrients</span>
              </span>
            </button>
            
            <button 
              onClick={() => setActiveTab('ai-insights')}
              className={`flex-1 py-4 px-2 text-center font-semibold transition-all touch-target ${
                activeTab === 'ai-insights' 
                  ? 'bg-blue-600 text-white border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <span className="flex flex-col items-center justify-center text-sm">
                🧠
                <span className="mt-1">AI Insights</span>
              </span>
            </button>
          </nav>
        </div>
        
        {/* Mobile-Optimized Content */}
        <div className="p-4 mobile-scroll">
          {activeTab === 'nutrients' && (
            <div className="space-y-6">
              {/* Mobile-Optimized Macronutrients */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                    📊
                  </span>
                  Macronutrients
                </h3>
                
                {getMacronutrients().length > 0 ? (
                  <div className="space-y-3">
                    {getMacronutrients().map((nutrient, index) => (
                      <div key={index} className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-4 shadow-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-lg font-semibold text-white">{nutrient.name}</h4>
                          {nutrient.percentDailyValue && nutrient.percentDailyValue > 0 && (
                            <span className="text-sm font-bold text-white bg-blue-600 px-2 py-1 rounded">
                              {Math.round(nutrient.percentDailyValue)}%
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xl font-bold text-blue-400">
                            {nutrient.amount} {nutrient.unit}
                          </span>
                        </div>
                        {nutrient.percentDailyValue && nutrient.percentDailyValue > 0 && (
                          <div className="w-full bg-gray-600 rounded-full h-3 mb-2">
                            <div 
                              className={`h-3 rounded-full transition-all duration-700 ${
                                nutrient.name.toLowerCase().includes('protein') ? 'bg-blue-500' :
                                nutrient.name.toLowerCase().includes('carb') ? 'bg-green-500' :
                                nutrient.name.toLowerCase().includes('fat') ? 'bg-amber-500' : 'bg-purple-500'
                              }`}
                              style={{ width: `${Math.min(100, nutrient.percentDailyValue)}%` }}
                            ></div>
                          </div>
                        )}
                        {nutrient.description && (
                          <p className="text-gray-300 text-sm leading-relaxed">{nutrient.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-base">No macronutrient data available</p>
                  </div>
                )}
              </div>

              {/* Mobile-Optimized Micronutrients */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <span className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                    🥗
                  </span>
                  Micronutrients
                </h3>
                
                {getMicronutrients().length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {getMicronutrients().map((nutrient, index) => (
                      <div key={index} className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-3 shadow-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-semibold text-white text-sm leading-tight">{nutrient.name}</h5>
                          {nutrient.percentDailyValue && nutrient.percentDailyValue > 0 && (
                            <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getNutrientStatusColor(nutrient)}`}>
                              {Math.round(nutrient.percentDailyValue)}%
                            </span>
                          )}
                        </div>
                        <div className="text-lg font-bold text-blue-400 mb-2">
                          {nutrient.amount} {nutrient.unit}
                        </div>
                        {nutrient.percentDailyValue && nutrient.percentDailyValue > 0 && (
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-700 ${getNutrientStatusColor(nutrient)}`}
                              style={{ width: `${Math.min(nutrient.percentDailyValue, 100)}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-base">No micronutrient data available</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ai-insights' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border border-purple-500/20 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <span className="text-2xl">🧠</span>
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white">AI Health Insights</h3>
                      <p className="text-purple-300 text-sm">Personalized analysis</p>
                    </div>
                  </div>
                  {personalizedInsights && (
                    <button
                      onClick={() => {
                        generatePersonalizedInsights();
                      }}
                      disabled={isGeneratingInsights}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm rounded-lg transition-all touch-target"
                    >
                      {isGeneratingInsights ? 'Analyzing...' : 'Regenerate'}
                    </button>
                  )}
                </div>
                
                {isGeneratingInsights ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <h4 className="text-lg font-semibold text-purple-300 mb-2">Analyzing Your Meal</h4>
                    <p className="text-purple-200/70 text-sm text-center">Generating personalized insights...</p>
                  </div>
                ) : personalizedInsights ? (
                  <div className="space-y-4">
                    {personalizedInsights.split('\n\n').filter(section => section.trim()).map((section, index) => (
                      <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                        <div className="text-gray-300 text-sm leading-relaxed mobile-text">
                          {section.split('\n').map((paragraph, pIndex) => (
                            <p key={pIndex} className="mb-2">{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mb-4">
                      <span className="text-4xl">🤖</span>
                      <h4 className="text-lg font-semibold text-white mb-2">AI Analysis Ready</h4>
                      <p className="text-gray-400 text-sm mb-6">Get personalized insights about this meal</p>
                    </div>
                    <button
                      onClick={generatePersonalizedInsights}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all touch-target"
                    >
                      Generate AI Analysis
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileOptimizedAnalysis; 