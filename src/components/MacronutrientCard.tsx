interface MacronutrientProps {
  nutrient: {
    name: string;
    amount: number;
    unit: string;
    percentDailyValue: number;
    description?: string;
  };
}

export default function MacronutrientCard({ nutrient }: MacronutrientProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-gray-800 mb-1">{nutrient.name}</h3>
      <div className="flex items-baseline mb-2">
        <span className="text-xl font-bold">{nutrient.amount}</span>
        <span className="ml-1 text-gray-600">{nutrient.unit}</span>
        <span className="ml-2 text-sm text-gray-500">({nutrient.percentDailyValue}% DV)</span>
      </div>
      
      {/* Progress bar for Daily Value percentage */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className="bg-blue-600 h-2 rounded-full" 
          style={{ width: `${Math.min(nutrient.percentDailyValue, 100)}%` }}
        ></div>
      </div>
      
      {nutrient.description && (
        <p className="text-sm text-gray-600 mt-1">{nutrient.description}</p>
      )}
    </div>
  );
} 