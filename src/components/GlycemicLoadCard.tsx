import React from 'react';

interface GlycemicLoadCardProps {
  glycemicLoad: number;
  glycemicIndex?: number;
  carbs: number;
  unit: string;
  foodTypes: string[]; // Foods contributing to glycemic load
  impact: string; // Description of impact
}

export const GlycemicLoadCard: React.FC<GlycemicLoadCardProps> = ({
  glycemicLoad,
  glycemicIndex,
  carbs,
  unit,
  foodTypes,
  impact
}) => {
  // Determine level based on glycemic load
  // Low: ≤10, Medium: 11-19, High: ≥20
  const getLoadLevel = () => {
    if (glycemicLoad <= 10) {
      return {
        level: 'Low',
        color: 'text-green-700',
        bg: 'bg-green-600',
        description: 'Minimal impact on blood sugar levels'
      };
    } else if (glycemicLoad <= 19) {
      return {
        level: 'Medium',
        color: 'text-amber-700',
        bg: 'bg-amber-600',
        description: 'Moderate impact on blood sugar levels'
      };
    } else {
      return {
        level: 'High',
        color: 'text-red-700',
        bg: 'bg-red-600',
        description: 'Significant impact on blood sugar levels'
      };
    }
  };
  
  const loadLevel = getLoadLevel();
  
  // Calculate percentage for visualization (out of 30 max)
  const loadPercentage = Math.min((glycemicLoad / 30) * 100, 100);
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-orange-100">
      <div className="flex items-center mb-5">
        <div className="flex items-center justify-center w-10 h-10 bg-orange-100 text-orange-700 rounded-full mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.707.293l.707.707L15 4.707l.707-.707A1 1 0 0117 5v2h2a1 1 0 110 2h-2v2a1 1 0 01-1 1h-2v2a1 1 0 01-1 1H9a1 1 0 01-1-1V9H6a1 1 0 01-1-1V6h2V4a1 1 0 011-1h4z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-800">
          Glycemic Load Estimate
        </h3>
      </div>
      
      <div className="mb-5">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-sm text-gray-600 mb-1">Estimated Glycemic Load</p>
            <p className={`text-2xl font-bold ${loadLevel.color}`}>{glycemicLoad}</p>
          </div>
          <div className={`px-3 py-1 rounded-full ${loadLevel.color} bg-opacity-10 text-sm font-medium`}>
            {loadLevel.level}
          </div>
        </div>
        
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div 
            className={`h-full ${loadLevel.bg} rounded-full`} 
            style={{ width: `${loadPercentage}%` }}
          ></div>
        </div>
        
        <p className="text-xs text-gray-500 italic mb-4">{loadLevel.description}</p>
        
        {glycemicIndex && (
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Estimated Average GI</span>
            <span className="font-medium">{glycemicIndex}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Digestible Carbs</span>
          <span className="font-medium">{carbs} {unit}</span>
        </div>
      </div>
      
      {foodTypes.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Contributing Foods</h4>
          <div className="flex flex-wrap gap-2">
            {foodTypes.map((food, index) => (
              <span 
                key={index} 
                className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full"
              >
                {food}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {impact && (
        <div className="bg-orange-50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-orange-800 mb-1">Health Impact</h4>
          <p className="text-xs text-gray-700">{impact}</p>
        </div>
      )}
    </div>
  );
}; 