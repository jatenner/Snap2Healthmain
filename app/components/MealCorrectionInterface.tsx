'use client';

import React, { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { AlertCircle, CheckCircle, Edit3, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MealCorrectionInterfaceProps {
  mealId: string;
  originalAnalysis: any;
  onCorrectionSaved: (corrections: any) => void;
  onClose: () => void;
}

export default function MealCorrectionInterface({
  mealId,
  originalAnalysis,
  onCorrectionSaved,
  onClose
}: MealCorrectionInterfaceProps) {
  const [corrections, setCorrections] = useState({
    mealName: originalAnalysis.mealName || '',
    calories: originalAnalysis.calories || 0,
    protein: originalAnalysis.macronutrients?.find((m: any) => m.name.toLowerCase().includes('protein'))?.amount || 0,
    carbs: originalAnalysis.macronutrients?.find((m: any) => m.name.toLowerCase().includes('carb'))?.amount || 0,
    fat: originalAnalysis.macronutrients?.find((m: any) => m.name.toLowerCase().includes('fat'))?.amount || 0,
    identifiedFoods: originalAnalysis.identifiedFoods || [],
    ingredients: originalAnalysis.ingredients || [],
    benefits: originalAnalysis.benefits || [],
    concerns: originalAnalysis.concerns || [],
    suggestions: originalAnalysis.suggestions || []
  });

  const [correctionType, setCorrectionType] = useState('general');
  const [feedback, setFeedback] = useState('');
  const [satisfaction, setSatisfaction] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const handleInputChange = (field: string, value: any) => {
    setCorrections(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    setCorrections(prev => ({
      ...prev,
      [field]: prev[field].map((item: any, i: number) => 
        i === index ? (typeof item === 'string' ? value : { ...item, name: value }) : item
      )
    }));
  };

  const addArrayItem = (field: string) => {
    setCorrections(prev => ({
      ...prev,
      [field]: [...prev[field], field === 'identifiedFoods' ? { name: '', confidence: 0.5 } : '']
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setCorrections(prev => ({
      ...prev,
      [field]: prev[field].filter((_: any, i: number) => i !== index)
    }));
  };

  const calculateChanges = () => {
    const changes = [];
    
    if (corrections.mealName !== originalAnalysis.mealName) {
      changes.push('Meal name');
    }
    
    if (Math.abs(corrections.calories - originalAnalysis.calories) > 10) {
      changes.push('Calories');
    }
    
    const originalProtein = originalAnalysis.macronutrients?.find((m: any) => m.name.toLowerCase().includes('protein'))?.amount || 0;
    if (Math.abs(corrections.protein - originalProtein) > 2) {
      changes.push('Protein');
    }
    
    if (corrections.identifiedFoods.length !== originalAnalysis.identifiedFoods?.length) {
      changes.push('Food identification');
    }
    
    return changes;
  };

  const submitCorrections = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/meal-correction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mealId,
          corrections,
          correctionType,
          feedback: {
            comment: feedback,
            satisfaction,
            changes: calculateChanges()
          },
          originalAnalysis,
          correctedAnalysis: corrections
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save corrections');
      }

      const result = await response.json();
      
      toast.success('Corrections saved! This will help improve future analysis.');
      onCorrectionSaved(corrections);
      onClose();
      
    } catch (error) {
      console.error('Failed to save corrections:', error);
      toast.error('Failed to save corrections. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const changes = calculateChanges();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Correct Meal Analysis
              </CardTitle>
              <CardDescription>
                Help improve AI accuracy by correcting any mistakes in the analysis
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {changes.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-600">
                Changes detected: {changes.join(', ')}
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
              <TabsTrigger value="foods">Foods</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mealName">Meal Name</Label>
                  <Input
                    id="mealName"
                    value={corrections.mealName}
                    onChange={(e) => handleInputChange('mealName', e.target.value)}
                    placeholder="Enter correct meal name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="calories">Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={corrections.calories}
                    onChange={(e) => handleInputChange('calories', parseInt(e.target.value) || 0)}
                    placeholder="Enter correct calories"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="correctionType">What type of correction is this?</Label>
                <select
                  id="correctionType"
                  value={correctionType}
                  onChange={(e) => setCorrectionType(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="general">General correction</option>
                  <option value="food_identification">Food identification</option>
                  <option value="portion_size">Portion size</option>
                  <option value="nutrition_values">Nutrition values</option>
                  <option value="meal_name">Meal name</option>
                </select>
              </div>
            </TabsContent>

            <TabsContent value="nutrition" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    step="0.1"
                    value={corrections.protein}
                    onChange={(e) => handleInputChange('protein', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="carbs">Carbohydrates (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    step="0.1"
                    value={corrections.carbs}
                    onChange={(e) => handleInputChange('carbs', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    step="0.1"
                    value={corrections.fat}
                    onChange={(e) => handleInputChange('fat', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Benefits</Label>
                  <div className="space-y-2">
                    {corrections.benefits.map((benefit: string, index: number) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={benefit}
                          onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                          placeholder="Health benefit"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('benefits', index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem('benefits')}
                    >
                      Add Benefit
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Concerns</Label>
                  <div className="space-y-2">
                    {corrections.concerns.map((concern: string, index: number) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={concern}
                          onChange={(e) => handleArrayChange('concerns', index, e.target.value)}
                          placeholder="Health concern"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('concerns', index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem('concerns')}
                    >
                      Add Concern
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="foods" className="space-y-4">
              <div>
                <Label>Identified Foods</Label>
                <div className="space-y-2">
                  {corrections.identifiedFoods.map((food: any, index: number) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={typeof food === 'string' ? food : food.name}
                        onChange={(e) => handleArrayChange('identifiedFoods', index, e.target.value)}
                        placeholder="Food name"
                        className="flex-1"
                      />
                      <Badge variant="secondary">
                        {typeof food === 'object' ? `${Math.round(food.confidence * 100)}%` : 'N/A'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('identifiedFoods', index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('identifiedFoods')}
                  >
                    Add Food
                  </Button>
                </div>
              </div>

              <div>
                <Label>Ingredients</Label>
                <div className="space-y-2">
                  {corrections.ingredients.map((ingredient: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={ingredient}
                        onChange={(e) => handleArrayChange('ingredients', index, e.target.value)}
                        placeholder="Ingredient"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('ingredients', index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('ingredients')}
                  >
                    Add Ingredient
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-4">
              <div>
                <Label htmlFor="satisfaction">How satisfied are you with the original analysis?</Label>
                <div className="flex items-center gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      variant={satisfaction === rating ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSatisfaction(rating)}
                    >
                      {rating}
                    </Button>
                  ))}
                  <span className="text-sm text-gray-600 ml-2">
                    {satisfaction <= 2 ? 'Poor' : satisfaction <= 3 ? 'Fair' : satisfaction <= 4 ? 'Good' : 'Excellent'}
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="feedback">Additional feedback (optional)</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="What was wrong with the analysis? How can we improve?"
                  rows={4}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">How this helps:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your corrections train the AI to be more accurate</li>
                  <li>• The system learns your personal food preferences</li>
                  <li>• Future analyses will be more personalized</li>
                  <li>• Helps improve the experience for all users</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <div className="text-sm text-gray-600">
              {changes.length > 0 ? (
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  {changes.length} change{changes.length > 1 ? 's' : ''} detected
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  No changes detected
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                onClick={submitCorrections} 
                disabled={isSubmitting || changes.length === 0}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Save Corrections'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 