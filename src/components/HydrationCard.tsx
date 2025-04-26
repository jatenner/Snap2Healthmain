import React from 'react';

interface HydrationCardProps {
  hydrationLevel: number; // 0-100 percentage
  waterContent: number;
  unit: string;
  tips: string[];
}

export const HydrationCard: React.FC<HydrationCardProps> = ({
  hydrationLevel,
  waterContent,
  unit,
  tips
}) => {
  // Colors based on hydration level
  const getColorScheme = () => {
    if (hydrationLevel >= 75) {
      return {
        text: 'text-blue-700',
        bg: 'bg-blue-600',
        status: 'Excellent'
      };
    } else if (hydrationLevel >= 50) {
      return {
        text: 'text-cyan-700',
        bg: 'bg-cyan-600',
        status: 'Good'
      };
    } else if (hydrationLevel >= 25) {
      return {
        text: 'text-amber-700',
        bg: 'bg-amber-600',
        status: 'Moderate'
      };
    } else {
      return {
        text: 'text-red-700',
        bg: 'bg-red-600',
        status: 'Low'
      };
    }
  };
  
  const colors = getColorScheme();
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-blue-100">
      <div className="flex items-center mb-5">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-700 rounded-full mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-800">
          Hydration Estimate
        </h3>
      </div>
      
      <div className="mb-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Estimated Water Content</span>
          <span className="font-semibold text-blue-700">{waterContent} {unit}</span>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Hydration Contribution</span>
            <span className={`${colors.text} font-semibold`}>{colors.status} ({hydrationLevel}%)</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full ${colors.bg} rounded-full`} 
              style={{ width: `${hydrationLevel}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {tips.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Hydration Tips</h4>
          <ul className="space-y-1">
            {tips.map((tip, index) => (
              <li key={index} className="text-xs text-gray-700 flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 