import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  unit: string;
  icon: string;
  description?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  unit, 
  icon,
  description 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-5 text-center">
      <div className="flex justify-center mb-3">
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-lg font-medium text-gray-700 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-800">
        {value}{unit}
      </p>
      {description && (
        <p className="text-sm text-gray-500 mt-2">{description}</p>
      )}
    </div>
  );
};

export default StatsCard; 