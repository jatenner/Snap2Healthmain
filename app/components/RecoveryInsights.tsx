'use client';

import React from 'react';

interface RecoveryInsight {
  title: string;
  description: string;
}

interface RecoveryInsightsProps {
  insights: RecoveryInsight[];
}

const RecoveryInsights: React.FC<RecoveryInsightsProps> = ({ insights }) => {
  if (!insights || insights.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      {insights.map((insight, index) => (
        <div key={index} className="bg-darkBlue-accent/20 p-4 rounded-lg border-l-4 border-cyan-accent">
          <h4 className="font-semibold text-cyan-accent mb-1">{insight.title}</h4>
          <p className="text-blue-100/90 text-sm">{insight.description}</p>
        </div>
      ))}
    </div>
  );
};

export default RecoveryInsights; 