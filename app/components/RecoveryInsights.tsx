import React from 'react';

interface InsightItem {
  title: string;
  description: string;
  researchNotes?: string[];
  citations?: string[];
  keyFindings?: string[];
  impactRating?: 'low' | 'moderate' | 'high';
  timeframe?: string;
}

interface RecoveryInsightsProps {
  insights: InsightItem[];
  goal?: string;
}

const RecoveryInsights: React.FC<RecoveryInsightsProps> = ({ insights, goal }) => {
  if (!insights || insights.length === 0) {
    return null;
  }

  // Function to determine the color based on impact rating
  const getImpactColor = (rating?: 'low' | 'moderate' | 'high') => {
    switch(rating) {
      case 'high': return 'border-emerald-500';
      case 'moderate': return 'border-blue-500';
      case 'low': return 'border-purple-500';
      default: return 'border-blue-500';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
        {goal ? `${goal} Insights` : 'Recovery Insights'}
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
        Evidence-based analysis for optimal nutritional outcomes
      </p>
      <div className="space-y-6">
        {insights.map((insight, index) => (
          <div key={index} className={`border-l-4 ${getImpactColor(insight.impactRating)} pl-4 py-4 bg-blue-50 dark:bg-gray-700 rounded-r-lg`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{insight.title}</h3>
              {insight.impactRating && (
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full 
                  ${insight.impactRating === 'high' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 
                  insight.impactRating === 'moderate' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
                  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'}`}>
                  {insight.impactRating.charAt(0).toUpperCase() + insight.impactRating.slice(1)} Impact
                </span>
              )}
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-3">{insight.description}</p>
            
            {insight.timeframe && (
              <div className="mt-2 mb-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{insight.timeframe}</span>
              </div>
            )}
            
            {insight.keyFindings && insight.keyFindings.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Key Findings:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {insight.keyFindings.map((finding, findingIndex) => (
                    <li key={findingIndex} className="text-sm text-gray-600 dark:text-gray-300">{finding}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {insight.researchNotes && insight.researchNotes.length > 0 && (
              <div className="mt-3 bg-white dark:bg-gray-600 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Research Notes:</h4>
                <ul className="space-y-1">
                  {insight.researchNotes.map((note, noteIndex) => (
                    <li key={noteIndex} className="text-sm text-gray-600 dark:text-gray-300">{note}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {insight.citations && insight.citations.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Citations:</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  {insight.citations.map((citation, citationIndex) => (
                    <li key={citationIndex} className="text-xs text-gray-500 dark:text-gray-400">{citation}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecoveryInsights; 