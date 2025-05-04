'use client';

import React from 'react';
import { MealAnalysisForm } from '@/components/MealAnalysisForm';
import { SearchParams } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function MealAnalysisPage({ searchParams }: { searchParams: SearchParams }) {
  // Check if we have analysis data passed as URL parameters
  const hasAnalysisData = 
    searchParams.success === 'true' && 
    searchParams.mealId && 
    searchParams.mealContents;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Meal Analysis</CardTitle>
          <CardDescription>
            {hasAnalysisData 
              ? "Here's your meal analysis results. You can save this to your history."
              : "Upload a photo of your food to get nutritional information and analysis."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MealAnalysisForm searchParams={searchParams} />
        </CardContent>
      </Card>
    </div>
  );
} 