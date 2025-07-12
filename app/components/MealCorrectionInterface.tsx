'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Edit3, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MealCorrectionInterfaceProps {
  mealId: string;
  originalAnalysis: any;
  onCorrectionSaved: (corrections: any) => void;
  onClose: () => void;
}

interface CorrectionData {
  mealName: any;
  calories: any;
  protein: any;
  carbs: any;
  fat: any;
  identifiedFoods: any;
  ingredients: any;
  benefits: any;
  concerns: any;
  suggestions: any;
  [key: string]: any;
}

export default function MealCorrectionInterface({
  mealId,
  originalAnalysis,
  onCorrectionSaved,
  onClose
}: MealCorrectionInterfaceProps) {
  const [corrections, setCorrections] = useState<CorrectionData>({
    mealName: originalAnalysis?.mealName || '',
    calories: originalAnalysis?.calories || 0,
    protein: originalAnalysis?.protein || 0,
    carbs: originalAnalysis?.carbs || 0,
    fat: originalAnalysis?.fat || 0,
    identifiedFoods: originalAnalysis?.identifiedFoods || [],
    ingredients: originalAnalysis?.ingredients || [],
    benefits: originalAnalysis?.benefits || [],
    concerns: originalAnalysis?.concerns || [],
    suggestions: originalAnalysis?.suggestions || []
  });
  
  const [feedback, setFeedback] = useState('');
  const [satisfaction, setSatisfaction] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  const supabase = createClientComponentClient();

  const handleInputChange = (field: string, value: any) => {
    setCorrections(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: string, index: number, value: any) => {
    setCorrections(prev => ({
      ...prev,
      [field]: prev[field].map((item: any, i: number) =>
        i === index ? (typeof item === 'object' ? { ...item, name: value } : value) : item
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

  const handleSubmit = async () => {
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
          feedback,
          satisfaction,
          originalAnalysis
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onCorrectionSaved(result);
        onClose();
      } else {
        console.error('Failed to save corrections');
      }
    } catch (error) {
      console.error('Error saving corrections:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderArrayField = (field: string, title: string, placeholder: string) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{title}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addArrayItem(field)}
        >
          Add {title.slice(0, -1)}
        </Button>
      </div>
      {corrections[field].map((item: any, index: number) => (
        <div key={index} className="flex items-center space-x-2">
          <Input
            value={typeof item === 'object' ? item.name : item}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleArrayChange(field, index, e.target.value)}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => removeArrayItem(field, index)}
          >
            Remove
          </Button>
        </div>
      ))}
    </div>
  );

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
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mealName">Meal Name</Label>
                  <Input
                    id="mealName"
                    value={corrections.mealName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('mealName', e.target.value)}
                    placeholder="Enter the correct meal name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="calories">Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={corrections.calories}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('calories', parseInt(e.target.value) || 0)}
                    placeholder="Enter correct calories"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="nutrition" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    step="0.1"
                    value={corrections.protein}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('protein', parseFloat(e.target.value) || 0)}
                    placeholder="Protein in grams"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    step="0.1"
                    value={corrections.carbs}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('carbs', parseFloat(e.target.value) || 0)}
                    placeholder="Carbs in grams"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    step="0.1"
                    value={corrections.fat}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('fat', parseFloat(e.target.value) || 0)}
                    placeholder="Fat in grams"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="foods" className="space-y-4">
              {renderArrayField('benefits', 'Benefits', 'Enter a health benefit')}
              
              <div className="border-t pt-4">
                {renderArrayField('concerns', 'Concerns', 'Enter a health concern')}
              </div>
              
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Identified Foods</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem('identifiedFoods')}
                    >
                      Add Food
                    </Button>
                  </div>
                  {corrections.identifiedFoods.map((food: any, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={food.name || food}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleArrayChange('identifiedFoods', index, e.target.value)}
                        placeholder="Food name"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('identifiedFoods', index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Ingredients</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem('ingredients')}
                    >
                      Add Ingredient
                    </Button>
                  </div>
                  {corrections.ingredients.map((ingredient: any, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={ingredient}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleArrayChange('ingredients', index, e.target.value)}
                        placeholder="Ingredient name"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('ingredients', index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="insights" className="space-y-4">
              {renderArrayField('suggestions', 'Suggestions', 'Enter a suggestion')}
              
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="feedback">Additional Feedback</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedback(e.target.value)}
                    placeholder="Any additional feedback to help improve our analysis..."
                    className="min-h-[100px]"
                  />
                </div>
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
                onClick={handleSubmit} 
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