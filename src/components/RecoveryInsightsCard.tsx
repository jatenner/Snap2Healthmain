import React from 'react';

interface RecoveryInsight {
  title: string;
  description: string;
  icon?: string; // Icon type identifier
}

interface RecoveryInsightsCardProps {
  goal: string;
  insights: RecoveryInsight[];
}

export const RecoveryInsightsCard: React.FC<RecoveryInsightsCardProps> = ({
  goal,
  insights
}) => {
  return (
    <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-6 shadow-md">
      <div className="flex items-center mb-5">
        <div className="flex items-center justify-center w-10 h-10 bg-teal-100 text-teal-700 rounded-full mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-800">
          Recovery Insights for {goal}
        </h3>
      </div>
      
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="text-md font-semibold text-teal-700 mb-2">
              {insight.title}
            </h4>
            <p className="text-sm text-gray-600">
              {insight.description}
            </p>
          </div>
        ))}
        
        {insights.length === 0 && (
          <div className="text-center py-6">
            <p className="text-gray-500">No specific recovery insights available for this meal.</p>
          </div>
        )}
      </div>
    </div>
  );
}; 