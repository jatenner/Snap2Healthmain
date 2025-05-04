'use client';

import OriginalHealthInsights from '../../src/components/HealthInsights';

// Define the props interface
interface HealthInsightsProps {
  insights?: string[];
  concerns?: string[];
  suggestions?: string[];
}

// Default empty values
const defaultValues = {
  insights: [],
  concerns: [],
  suggestions: []
};

export default function HealthInsights({ insights, concerns, suggestions }: HealthInsightsProps) {
  // Provide default empty arrays for any missing data
  return <OriginalHealthInsights 
    insights={insights || defaultValues.insights} 
    concerns={concerns || defaultValues.concerns}
    suggestions={suggestions || defaultValues.suggestions}
  />;
} 