import { ReactNode } from 'react';

interface NutritionCardProps {
  title: string;
  value: number;
  unit?: string;
  description?: string;
  icon?: ReactNode;
  infoText?: string;
}

export default function NutritionCard({ title, value, unit, description, icon, infoText }: NutritionCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center mb-2">
        {icon && <div className="mr-2">{icon}</div>}
        <h3 className="font-medium text-gray-700">{title}</h3>
      </div>
      <div className="flex items-baseline mb-1">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {unit && <span className="ml-1 text-gray-600">{unit}</span>}
      </div>
      {description && <p className="text-sm text-gray-500 mb-2">{description}</p>}
      
      {infoText && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-600 italic">{infoText}</p>
        </div>
      )}
    </div>
  );
} 