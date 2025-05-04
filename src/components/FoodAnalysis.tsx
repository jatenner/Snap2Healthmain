'use client';

import React from 'react';
import { SimpleFoodAnalysis } from './SimpleFoodAnalysis';

interface FoodAnalysisProps {
  imageUrl?: string;
  mealData?: any;
  isLoading?: boolean;
  onAnalyze?: (file?: File) => void;
  className?: string;
  goal?: string;
}

export function FoodAnalysis(props: FoodAnalysisProps) {
  return (
    <SimpleFoodAnalysis 
      imageUrl={props.imageUrl} 
      goal={props.goal || 'General Wellness'} 
    />
  );
}