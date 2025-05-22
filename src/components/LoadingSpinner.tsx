import React from 'react';

interface LoadingSpinnerProps {
<<<<<<< HEAD
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
=======
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function LoadingSpinner({ size = 'medium', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-2',
    large: 'w-12 h-12 border-3',
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full border-gray-300 border-t-indigo-600 animate-spin`}
      />
    </div>
  );
} 
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
