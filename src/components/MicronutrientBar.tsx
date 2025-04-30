interface MicronutrientProps {
  nutrient: {
    name: string;
    amount: number;
    unit: string;
    percentDailyValue: number;
    description?: string;
  };
}

export default function MicronutrientBar({ nutrient }: MicronutrientProps) {
  const getColorClass = (percentDV: number) => {
    if (percentDV < 10) return 'bg-red-500';
    if (percentDV < 25) return 'bg-yellow-500';
    if (percentDV < 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getDVLabel = (percentDV: number) => {
    if (percentDV < 5) return 'Low';
    if (percentDV < 15) return 'Moderate';
    if (percentDV < 40) return 'Good';
    return 'Excellent';
  };

  const dvLabel = getDVLabel(nutrient.percentDailyValue);
  const colorClass = getColorClass(nutrient.percentDailyValue);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
      <div className="flex justify-between items-center mb-1">
        <span className="font-medium text-gray-800">{nutrient.name}</span>
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{nutrient.amount}</span> {nutrient.unit}
        </div>
      </div>
      
      <div className="flex items-center mb-2">
        <div className="w-full bg-gray-200 rounded-full h-1.5 mr-2">
          <div 
            className={`h-1.5 rounded-full ${colorClass}`} 
            style={{ width: `${Math.min(nutrient.percentDailyValue, 100)}%` }}
          ></div>
        </div>
        <div className="flex flex-col items-end min-w-[50px]">
          <span className="text-xs font-semibold text-right">
            {nutrient.percentDailyValue}%
          </span>
          <span className={`text-xs ${
            colorClass === 'bg-red-500' ? 'text-red-500' : 
            colorClass === 'bg-yellow-500' ? 'text-yellow-500' :
            colorClass === 'bg-blue-500' ? 'text-blue-500' : 'text-green-500'
          }`}>
            {dvLabel}
          </span>
        </div>
      </div>
      
      {nutrient.description && (
        <p className="text-xs text-gray-600 mt-1">{nutrient.description}</p>
      )}
    </div>
  );
} 