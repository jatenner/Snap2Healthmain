import React from 'react';

interface MacroBarProps {
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
}

const MacroBar: React.FC<MacroBarProps> = ({ 
  proteinPercent, 
  carbsPercent, 
  fatPercent 
}) => {
  return (
    <div className="w-full">
      <div className="flex h-6 rounded-full overflow-hidden">
        <div 
          className="bg-blue-500" 
          style={{ width: `${proteinPercent}%` }}
          title={`Protein: ${proteinPercent}%`}
        ></div>
        <div 
          className="bg-green-500" 
          style={{ width: `${carbsPercent}%` }}
          title={`Carbs: ${carbsPercent}%`}
        ></div>
        <div 
          className="bg-amber-500" 
          style={{ width: `${fatPercent}%` }}
          title={`Fat: ${fatPercent}%`}
        ></div>
      </div>
      <div className="flex justify-between mt-1 text-sm">
        <div>Protein {proteinPercent}%</div>
        <div>Carbs {carbsPercent}%</div>
        <div>Fat {fatPercent}%</div>
      </div>
    </div>
  );
};

export default MacroBar; 