import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'blue',
  text = 'Loading...'
}) => {
  // Determine size classes
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };
  
  // Determine color classes
  const colorClasses = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    yellow: 'border-yellow-500',
    gray: 'border-gray-500'
  };
  
  const spinnerSize = sizeClasses[size];
  const spinnerColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`${spinnerSize} animate-spin rounded-full border-t-2 border-b-2 ${spinnerColor}`}
        role="status"
        aria-label="loading"
      />
      {text && (
        <p className="mt-2 text-gray-600 text-sm">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner; 