import React from 'react';

interface Nutrient {
  name: string;
  amount: number;
  unit: string;
  percentDailyValue?: number;
  description?: string;
}

interface EnhancedMicronutrientDisplayProps {
  micronutrients: Nutrient[];
}

const getNutrientDescription = (name: string): string => {
  const descriptions: Record<string, string> = {
    'vitamin a': 'Keeps your eyes healthy for good vision, especially at night. Also supports immune function and skin health.',
    'vitamin c': 'Powerful immune system booster that helps fight off colds and infections. Also helps your body absorb iron and heal wounds.',
    'vitamin d': 'The "sunshine vitamin" that keeps bones strong, supports immune function, and may boost mood. Most people do not get enough.',
    'vitamin e': 'A protective antioxidant that shields your cells from damage and supports immune function.',
    'vitamin k': 'Essential for blood clotting and bone health. Helps your body use calcium effectively.',
    'vitamin b1': 'Helps your body convert food into energy and supports proper nerve function.',
    'vitamin b2': 'Important for energy production and healthy skin, eyes, and nervous system.',
    'vitamin b3': 'Supports brain function, digestion, and healthy skin. Also helps lower cholesterol.',
    'vitamin b6': 'Essential for brain development and function, and helps your body make serotonin and norepinephrine.',
    'vitamin b12': 'Essential for nerve function, energy production, and making red blood cells. Deficiency can cause permanent nerve damage.',
    'folate': 'Works with B12 to make healthy red blood cells and support brain function. Important for cell growth and repair.',
    'biotin': 'Helps your body convert food into energy and supports healthy hair, skin, and nails.',
    'pantothenic acid': 'Helps break down fats and carbohydrates for energy and supports hormone production.',
    'calcium': 'Builds strong bones and teeth that last a lifetime. Also helps your muscles work properly - think of it as structural support for your body!',
    'iron': 'Prevents fatigue and keeps your energy levels high all day. Iron from meat is super easy for your body to absorb - way better than iron pills!',
    'magnesium': 'Natural muscle relaxer that helps you sleep better and reduces cramps. Most people do not get enough - a super important mineral that is often missing!',
    'phosphorus': 'Works with calcium to build strong bones and teeth, and helps your body store and use energy.',
    'potassium': 'Keeps your blood pressure healthy and prevents muscle cramps. Works like a natural salt balancer - great if you eat a lot of processed foods!',
    'sodium': 'Helps maintain fluid balance and nerve function, but excess amounts can increase blood pressure and strain your cardiovascular system.',
    'zinc': 'Boosts immune function and wound healing. Also important for taste, smell, and proper growth.',
    'copper': 'Helps your body make red blood cells and maintains healthy bones, blood vessels, and immune system.',
    'manganese': 'Supports bone development, wound healing, and helps your body process cholesterol and carbs.',
    'selenium': 'A powerful antioxidant that protects your cells from damage and supports thyroid function.',
    'chromium': 'Helps your body use insulin effectively and may help regulate blood sugar levels.',
    'molybdenum': 'Helps your body process proteins and genetic material (DNA).',
    'iodine': 'Essential for proper thyroid function, which controls your metabolism and energy levels.'
  };
  
  const key = name.toLowerCase();
  return descriptions[key] || `Essential ${key.includes('vitamin') ? 'vitamin' : 'mineral'} that supports various bodily functions and overall health.`;
};

const EnhancedMicronutrientDisplay: React.FC<EnhancedMicronutrientDisplayProps> = ({ micronutrients }) => {
  if (!micronutrients || micronutrients.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <svg className="w-20 h-20 mx-auto mb-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <p className="text-xl">No micronutrient data available for this meal.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {micronutrients.map((nutrient, index) => {
        const dv = nutrient.percentDailyValue || 0;
        
        // Enhanced color system - consistent red/yellow/green
        const limitNutrients = ['sodium', 'sugar', 'saturated fat', 'cholesterol'];
        const isLimitNutrient = limitNutrients.some(limit => 
          nutrient.name.toLowerCase().includes(limit)
        );
        
        // Determine color based on DV percentage
        let colorClass = '';
        let statusLabel = '';
        let bgColor = '';
        let textColor = 'text-white';
        
        if (dv <= 0) {
          colorClass = 'bg-gray-600';
          statusLabel = 'Unknown';
          bgColor = 'bg-gray-800/50 border-gray-600/50';
        } else if (isLimitNutrient) {
          // For limit nutrients (sodium, sugar, etc.), high is bad
          if (dv >= 75) {
            colorClass = 'bg-red-500';
            statusLabel = 'High';
            bgColor = 'bg-red-900/30 border-red-500/40';
          } else if (dv >= 40) {
            colorClass = 'bg-yellow-500';
            statusLabel = 'Moderate';
            bgColor = 'bg-yellow-900/30 border-yellow-500/40';
          } else {
            colorClass = 'bg-green-500';
            statusLabel = 'Good';
            bgColor = 'bg-green-900/30 border-green-500/40';
          }
        } else {
          // For beneficial nutrients, higher is better
          if (dv >= 50) {
            colorClass = 'bg-green-500';
            statusLabel = 'Excellent';
            bgColor = 'bg-green-900/30 border-green-500/40';
          } else if (dv >= 25) {
            colorClass = 'bg-yellow-500';
            statusLabel = 'Good';
            bgColor = 'bg-yellow-900/30 border-yellow-500/40';
          } else {
            colorClass = 'bg-red-500';
            statusLabel = 'Low';
            bgColor = 'bg-red-900/30 border-red-500/40';
          }
        }
        
        return (
          <div key={index} className={`${bgColor} backdrop-blur-sm rounded-xl p-6 border hover:shadow-lg transition-all duration-300 hover:scale-105`}>
            {/* Header with nutrient name and status badge */}
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-bold text-white text-lg leading-tight">{nutrient.name}</h4>
              <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${colorClass} shadow-lg`}>
                {statusLabel}
              </span>
            </div>
            
            {/* Amount and DV% - Enhanced Typography */}
            <div className="mb-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-white">
                    {nutrient.amount}
                  </span>
                  <span className="text-lg text-gray-300 ml-2">
                    {nutrient.unit}
                  </span>
                </div>
              </div>
              
              {dv > 0 && (
                <div className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3">
                  <span className="text-2xl font-bold text-white">
                    {Math.round(dv)}%
                  </span>
                  <span className="text-sm text-gray-400 font-medium">
                    Daily Value
                  </span>
                </div>
              )}
            </div>
            
            {/* Progress Bar - Enhanced */}
            {dv > 0 && (
              <div className="mb-4">
                <div className="w-full bg-gray-700 rounded-full h-3 shadow-inner">
                  <div 
                    className={`h-3 rounded-full transition-all duration-700 shadow-lg ${colorClass}`}
                    style={{ width: `${Math.min(dv, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0%</span>
                  <span>{dv > 100 ? '100%+' : '100%'}</span>
                </div>
              </div>
            )}
            
            {/* Description */}
            <p className="text-gray-300 text-sm leading-relaxed">
              {nutrient.description || getNutrientDescription(nutrient.name)}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default EnhancedMicronutrientDisplay; 