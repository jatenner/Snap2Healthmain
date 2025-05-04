import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 24, 
  color = 'text-blue-600' 
}) => {
  return (
    <div className="flex justify-center items-center">
      <div
        className={`animate-spin rounded-full border-t-2 border-b-2 ${color} h-${size/4} w-${size/4}`}
        style={{ width: size, height: size, borderWidth: Math.max(2, size/12) }}
      ></div>
    </div>
  );
};

export default LoadingSpinner; 