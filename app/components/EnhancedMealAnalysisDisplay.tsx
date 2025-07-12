'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Edit3, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Eye,
  Scale,
  Calculator,
  Target,
  Brain,
  Sparkles
} from 'lucide-react';
import ConfidenceIndicator from './ConfidenceIndicator';
import MealCorrectionInterface from './MealCorrectionInterface';

interface EnhancedMealAnalysisDisplayProps {
  analysis: any;
  mealId: string;
  onAnalysisUpdate?: (updatedAnalysis: any) => void;
}

export default function EnhancedMealAnalysisDisplay({
  analysis,
  mealId,
  onAnalysisUpdate
}: EnhancedMealAnalysisDisplayProps) {
  const [showCorrection, setShowCorrection] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const confidence = analysis.confidence || 0.8;
  const confidenceBreakdown = analysis.confidenceBreakdown || {};
  const adaptiveInsights = analysis.adaptiveInsights || {};
  const userPatterns = analysis.userPatterns || {};

  const handleCorrectionSaved = (corrections: any) => {
    if (onAnalysisUpdate) {
      onAnalysisUpdate({
        ...analysis,
        ...corrections,
        userCorrected: true,
        lastCorrected: new Date().toISOString()
      });
    }
  };

  const renderNutrientProgress = (nutrient: any) => {
    const percentage = nutrient.percentDailyValue || 0;
    const getColor = (pct: number) => {
      if (pct >= 100) return 'bg-green-500';
      if (pct >= 75) return 'bg-yellow-500';
      if (pct >= 50) return 'bg-orange-500';
      return 'bg-red-500';
    };

    return (
      <div key={nutrient.name} className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{nutrient.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {nutrient.amount} {nutrient.unit}
            </span>
            <Badge variant={percentage >= 100 ? 'default' : 'secondary'}>
              {Math.round(percentage)}% DV
            </Badge>
          </div>
        </div>
        <Progress value={Math.min(percentage, 100)} className="h-2" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Confidence and Actions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                {analysis.mealName || 'Meal Analysis'}
                {adaptiveInsights.analysisMethod === 'personalized' && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    Personalized
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {analysis.mealDescription || 'AI-powered nutritional analysis'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={confidence >= 0.8 ? 'default' : confidence >= 0.6 ? 'secondary' : 'destructive'}>
                {Math.round(confidence * 100)}% Confidence
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCorrection(true)}
                className="flex items-center gap-1"
              >
                <Edit3 className="h-4 w-4" />
                Correct
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="confidence">Confidence</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Calories */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Calories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {analysis.calories || 0}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {userPatterns.portionPreferences?.avgCalories && (
                    `Typical: ${userPatterns.portionPreferences.avgCalories} cal`
                  )}
                </p>
              </CardContent>
            </Card>

            {/* Protein */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Protein</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {analysis.macronutrients?.find((m: any) => m.name.toLowerCase().includes('protein'))?.amount || 0}g
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {userPatterns.portionPreferences?.avgProtein && (
                    `Typical: ${userPatterns.portionPreferences.avgProtein}g`
                  )}
                </p>
              </CardContent>
            </Card>

            {/* Confidence Score */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Analysis Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold text-purple-600">
                    {Math.round(confidence * 100)}%
                  </div>
                  {confidence >= 0.8 ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-yellow-500" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {confidence >= 0.8 ? 'High confidence' : 'Moderate confidence'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Identified Foods */}
          {analysis.identifiedFoods && analysis.identifiedFoods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Identified Foods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.identifiedFoods.map((food: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{food.name}</span>
                        {food.estimatedPortion && (
                          <p className="text-sm text-gray-600">{food.estimatedPortion}</p>
                        )}
                      </div>
                      {food.confidence && (
                        <Badge variant={food.confidence >= 0.8 ? 'default' : 'secondary'}>
                          {Math.round(food.confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-4">
          {/* Macronutrients */}
          <Card>
            <CardHeader>
              <CardTitle>Macronutrients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.macronutrients?.map((nutrient: any) => renderNutrientProgress(nutrient))}
            </CardContent>
          </Card>

          {/* Micronutrients */}
          {analysis.micronutrients && analysis.micronutrients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Vitamins & Minerals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.micronutrients.slice(0, 10).map((nutrient: any) => renderNutrientProgress(nutrient))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {/* Personalized Insights */}
          {analysis.personalizedInsights && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Personalized Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.personalizedInsights.comparisonToTypical && (
                  <div>
                    <h4 className="font-medium mb-2">Comparison to Your Typical Meals</h4>
                    <p className="text-sm text-gray-600">{analysis.personalizedInsights.comparisonToTypical}</p>
                  </div>
                )}
                
                {analysis.personalizedInsights.recommendations && (
                  <div>
                    <h4 className="font-medium mb-2">Personalized Recommendations</h4>
                    <ul className="space-y-1">
                      {analysis.personalizedInsights.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Benefits and Concerns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.benefits && analysis.benefits.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.benefits.map((benefit: string, index: number) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {analysis.concerns && analysis.concerns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-amber-600">Considerations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.concerns.map((concern: string, index: number) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        {concern}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="confidence" className="space-y-4">
          <ConfidenceIndicator
            confidence={confidence}
            confidenceBreakdown={confidenceBreakdown}
            adaptiveInsights={adaptiveInsights}
          />
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          {/* User Pattern Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Your Dietary Patterns
              </CardTitle>
              <CardDescription>
                Based on your meal history ({userPatterns.totalMeals || 0} meals analyzed)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userPatterns.commonFoods && userPatterns.commonFoods.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Most Common Foods</h4>
                  <div className="flex flex-wrap gap-2">
                    {userPatterns.commonFoods.slice(0, 8).map((food: any, index: number) => (
                      <Badge key={index} variant="outline">
                        {food.food} ({food.frequency}x)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {userPatterns.cuisinePreferences && userPatterns.cuisinePreferences.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Cuisine Preferences</h4>
                  <div className="flex flex-wrap gap-2">
                    {userPatterns.cuisinePreferences.map((cuisine: any, index: number) => (
                      <Badge key={index} variant="secondary">
                        {cuisine.cuisine}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {userPatterns.nutritionalPatterns && (
                <div>
                  <h4 className="font-medium mb-2">Nutritional Patterns</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {userPatterns.nutritionalPatterns.dailyCalorieAvg || 0}
                      </div>
                      <div className="text-sm text-gray-600">Avg Calories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {userPatterns.nutritionalPatterns.proteinPercentage || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Protein</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {userPatterns.nutritionalPatterns.carbPercentage || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {userPatterns.nutritionalPatterns.fatPercentage || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Fat</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Correction Interface Modal */}
      {showCorrection && (
        <MealCorrectionInterface
          mealId={mealId}
          originalAnalysis={analysis}
          onCorrectionSaved={handleCorrectionSaved}
          onClose={() => setShowCorrection(false)}
        />
      )}
    </div>
  );
} 