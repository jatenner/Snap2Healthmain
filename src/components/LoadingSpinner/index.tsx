'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
  textColor?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'text-cyan-accent', 
  text,
  textColor = 'text-white'
}: LoadingSpinnerProps) {
  const sizeClass = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }[size];
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`inline-block ${sizeClass} animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] ${color} motion-reduce:animate-[spin_1.5s_linear_infinite]`}></div>
      {text && <p className={`mt-2 text-sm font-medium ${textColor}`}>{text}</p>}
    </div>
  );
} 