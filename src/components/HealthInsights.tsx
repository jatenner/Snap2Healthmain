'use client';

import React from 'react';
import { useAuth } from '@/context/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

interface HealthInsightsProps {
  insights?: string[];
  concerns?: string[];
  suggestions?: string[];
}

export default function HealthInsights({
  insights = [],
  concerns = [],
  suggestions = []
}: HealthInsightsProps) {
  return (
    <div className="space-y-6">
      <Card className="border border-darkBlue-accent/30 bg-darkBlue-secondary/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-blue-100">Health Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2 text-blue-100">
            {insights.map((insight, index) => (
              <li key={index} className="text-sm">{insight}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {concerns.length > 0 && (
        <Card className="border border-darkBlue-accent/30 bg-darkBlue-secondary/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-blue-100">Potential Concerns</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-blue-100">
              {concerns.map((concern, index) => (
                <li key={index} className="text-sm">{concern}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {suggestions.length > 0 && (
        <Card className="border border-darkBlue-accent/30 bg-darkBlue-secondary/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-blue-100">Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-blue-100">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm">{suggestion}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 