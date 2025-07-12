'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Eye, Scale, Calculator, Target } from 'lucide-react';

interface ConfidenceIndicatorProps {
  confidence: number;
  confidenceBreakdown?: {
    foodIdentification?: number;
    portionEstimation?: number;
    nutritionalAccuracy?: number;
    personalizedRelevance?: number;
  };
  adaptiveInsights?: {
    analysisMethod?: string;
    userPatternAlignment?: any;
    improvementSuggestions?: string[];
  };
  className?: string;
}

export default function ConfidenceIndicator({ 
  confidence, 
  confidenceBreakdown, 
  adaptiveInsights,
  className = "" 
}: ConfidenceIndicatorProps) {
  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.8) return 'Very Good';
    if (score >= 0.7) return 'Good';
    if (score >= 0.6) return 'Fair';
    if (score >= 0.5) return 'Poor';
    return 'Very Poor';
  };

  const getConfidenceBadgeVariant = (score: number) => {
    if (score >= 0.8) return 'default';
    if (score >= 0.6) return 'secondary';
    return 'destructive';
  };

  const confidenceItems = [
    {
      key: 'foodIdentification',
      label: 'Food Recognition',
      icon: Eye,
      description: 'How well the AI identified the foods in your image'
    },
    {
      key: 'portionEstimation',
      label: 'Portion Size',
      icon: Scale,
      description: 'Accuracy of portion size and weight estimation'
    },
    {
      key: 'nutritionalAccuracy',
      label: 'Nutrition Values',
      icon: Calculator,
      description: 'Precision of calorie and nutrient calculations'
    },
    {
      key: 'personalizedRelevance',
      label: 'Personalization',
      icon: Target,
      description: 'How well the analysis fits your dietary patterns'
    }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {confidence >= 0.8 ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            )}
            Analysis Confidence
          </div>
          <Badge variant={getConfidenceBadgeVariant(confidence)}>
            {Math.round(confidence * 100)}%
          </Badge>
        </CardTitle>
        <CardDescription>
          {confidence >= 0.8 
            ? "High confidence - this analysis is very reliable"
            : confidence >= 0.6
            ? "Moderate confidence - generally accurate but some uncertainty"
            : "Low confidence - consider retaking the photo or making corrections"
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Confidence */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Overall Confidence</span>
            <span className={`text-sm font-medium ${getConfidenceColor(confidence)}`}>
              {getConfidenceLabel(confidence)}
            </span>
          </div>
          <Progress value={confidence * 100} className="h-2" />
        </div>

        {/* Detailed Breakdown */}
        {confidenceBreakdown && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Detailed Breakdown</h4>
            {confidenceItems.map((item) => {
              const score = confidenceBreakdown[item.key as keyof typeof confidenceBreakdown];
              if (score === undefined) return null;
              
              const Icon = item.icon;
              return (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className={`text-sm font-medium ${getConfidenceColor(score)}`}>
                      {Math.round(score * 100)}%
                    </span>
                  </div>
                  <Progress value={score * 100} className="h-1" />
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Adaptive Insights */}
        {adaptiveInsights && (
          <div className="space-y-3 pt-3 border-t">
            <h4 className="text-sm font-medium text-gray-700">Personalization Insights</h4>
            
            {adaptiveInsights.analysisMethod && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {adaptiveInsights.analysisMethod === 'personalized' ? 'Personalized Analysis' : 'Standard Analysis'}
                </Badge>
              </div>
            )}

            {adaptiveInsights.userPatternAlignment && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Pattern Alignment:</p>
                <div className="grid grid-cols-2 gap-2">
                  {adaptiveInsights.userPatternAlignment.portionSize && (
                    <div className="flex items-center gap-1">
                      <Scale className="h-3 w-3 text-gray-400" />
                      <span className="text-xs">
                        Portion: {adaptiveInsights.userPatternAlignment.portionSize}
                      </span>
                    </div>
                  )}
                  {adaptiveInsights.userPatternAlignment.typicalness !== undefined && (
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-gray-400" />
                      <span className="text-xs">
                        Typical: {Math.round(adaptiveInsights.userPatternAlignment.typicalness * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {adaptiveInsights.improvementSuggestions && adaptiveInsights.improvementSuggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Suggestions for Better Analysis:</p>
                <ul className="space-y-1">
                  {adaptiveInsights.improvementSuggestions.map((suggestion, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                      <span className="text-blue-500 mt-0.5">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Items */}
        <div className="pt-3 border-t">
          {confidence < 0.6 && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Low Confidence Detected</span>
              </div>
              <p className="text-xs text-yellow-700">
                Consider retaking the photo with better lighting or making corrections to improve accuracy.
              </p>
            </div>
          )}
          
          {confidence >= 0.6 && confidence < 0.8 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Good Analysis</span>
              </div>
              <p className="text-xs text-blue-700">
                The analysis looks good! You can make corrections if needed to help improve future accuracy.
              </p>
            </div>
          )}
          
          {confidence >= 0.8 && (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Excellent Analysis</span>
              </div>
              <p className="text-xs text-green-700">
                High confidence analysis! The AI is very confident in these results.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 