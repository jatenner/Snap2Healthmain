import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  textColor?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '',
  text,
  textColor = 'text-gray-600'
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className={`${sizeClasses[size]} rounded-full border-gray-300 border-t-green-600 animate-spin`}
      ></div>
      {text && (
        <span className={`mt-3 font-medium ${textColor}`}>{text}</span>
      )}
    </div>
  );
};

export default LoadingSpinner; 