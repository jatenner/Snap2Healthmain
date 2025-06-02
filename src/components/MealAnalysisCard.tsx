import React, { useState } from 'react';
import { FaAppleAlt, FaCarrot, FaChartPie, FaLightbulb, FaCheckCircle, FaExclamationTriangle, FaHeart, FaLeaf, FaFire, FaBalanceScale } from 'react-icons/fa';
import { BiInfoCircle } from 'react-icons/bi';
import { MdFitnessCenter, MdLocalDining, MdTrendingUp } from 'react-icons/md';
import { GiMuscleUp, GiHeartOrgan, GiBrain } from 'react-icons/gi';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { AlertCircle, ArrowUp, CheckCircle, Flame, Info } from 'lucide-react';

interface Food {
  name: string;
  amount: string;
}

interface Nutrient {
  name: string;
  amount: number;
  unit: string;
  percentDailyValue: number;
}

interface RecoveryInsights {
  proteinAdequacy: string;
  carbohydrateRefueling: string;
  inflammatoryProfile: string;
}

interface MealAnalysisProps {
  mealName: string;
  foods: Food[];
  calories: number;
  macronutrients: Nutrient[];
  micronutrients: Nutrient[];
  recoveryInsights: RecoveryInsights;
  benefits: string[];
  concerns: string[];
  suggestions: string[];
}

export function MealAnalysisCard({
  mealName,
  foods,
  calories,
  macronutrients,
  micronutrients,
  recoveryInsights,
  benefits,
  concerns,
  suggestions,
}: MealAnalysisProps) {
  // Helper function to determine badge color based on value
  const getBadgeVariant = (value: number): "default" | "secondary" | "destructive" | "outline" => {
    if (value >= 80) return "default"; // Good
    if (value >= 40) return "secondary"; // Moderate
    return "destructive"; // Poor
  };

  // Helper function to determine rating text based on value
  const getRatingText = (value: string): string => {
    switch (value) {
      case 'optimal':
        return 'Optimal';
      case 'moderate':
        return 'Moderate';
      case 'low':
        return 'Low';
      case 'anti-inflammatory':
        return 'Anti-inflammatory';
      case 'neutral':
        return 'Neutral';
      case 'pro-inflammatory':
        return 'Pro-inflammatory';
      default:
        return value;
    }
  };

  // Helper function to determine rating variant based on value
  const getRatingVariant = (key: string, value: string): "default" | "secondary" | "destructive" | "outline" => {
    if (key === 'proteinAdequacy' || key === 'carbohydrateRefueling') {
      if (value === 'optimal') return "default";
      if (value === 'moderate') return "secondary";
      return "destructive";
    }
    
    if (key === 'inflammatoryProfile') {
      if (value === 'anti-inflammatory') return "default";
      if (value === 'neutral') return "secondary";
      return "destructive";
    }
    
    return "outline";
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold">{mealName}</CardTitle>
        <CardDescription>
          <div className="flex items-center space-x-2 mt-1">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="font-medium">{calories} calories</span>
          </div>
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="nutrients">Nutrients</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        
        <CardContent className="pt-4">
          <TabsContent value="overview" className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-2">Food Items</h3>
              <ul className="space-y-1">
                {foods.map((food, index) => (
                  <li key={index} className="text-sm flex justify-between">
                    <span>{food.name}</span>
                    <span className="text-gray-500">{food.amount}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-sm mb-2">Macronutrients</h3>
              <div className="space-y-3">
                {macronutrients.map((nutrient, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{nutrient.name}</span>
                      <span>{nutrient.amount}{nutrient.unit} ({nutrient.percentDailyValue}% DV)</span>
                    </div>
                    <Progress value={nutrient.percentDailyValue} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="nutrients" className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-3">Micronutrients</h3>
              <div className="grid grid-cols-2 gap-3">
                {micronutrients.map((nutrient, index) => (
                  <div key={index} className="border rounded-md p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{nutrient.name}</span>
                      <Badge variant={getBadgeVariant(nutrient.percentDailyValue)}>
                        {nutrient.percentDailyValue}%
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {nutrient.amount}{nutrient.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="recovery" className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-3">Recovery Insights</h3>
              <div className="space-y-3">
                {Object.entries(recoveryInsights).map(([key, value], index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <Badge variant={getRatingVariant(key, value)}>
                      {getRatingText(value)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <h3 className="font-semibold text-sm">Benefits</h3>
              </div>
              <ul className="space-y-1 ml-6 list-disc text-sm">
                {benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </div>
            
            {concerns.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <h3 className="font-semibold text-sm">Considerations</h3>
                </div>
                <ul className="space-y-1 ml-6 list-disc text-sm">
                  {concerns.map((concern, index) => (
                    <li key={index}>{concern}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <ArrowUp className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Suggestions</h3>
              </div>
              <ul className="space-y-1 ml-6 list-disc text-sm">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-center border-t pt-4">
        <div className="flex items-center text-xs text-gray-500">
          <Info className="h-3 w-3 mr-1" />
          <span>Analysis based on image recognition and nutritional database</span>
        </div>
      </CardFooter>
    </Card>
  );
} 