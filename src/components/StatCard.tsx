import React from 'react';

interface StatCardProps {
  title?: string;  // For backward compatibility
  label?: string;  // New prop name
  value: number;
  unit: string;
  description?: string;
  icon?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  label, 
  value, 
  unit, 
  description, 
  icon 
}) => {
  // Use label if provided, otherwise fall back to title
  const displayTitle = label || title || '';
  
  return (
    <div className="bg-white rounded-lg shadow p-4 text-center">
      <h3 className="text-lg font-medium text-gray-700 mb-2">{displayTitle}</h3>
      <p className="text-2xl font-bold">
        {value}{unit}
      </p>
      {description && (
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      )}
    </div>
  );
};

export default StatCard; 