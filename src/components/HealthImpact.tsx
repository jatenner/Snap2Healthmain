import React from 'react';
import { HealthImpactItem } from '../lib/gpt/validator';
import { cn } from '../lib/utils';

interface HealthImpactProps {
  title: string;
  items: HealthImpactItem[];
  className?: string;
  iconType?: 'benefit' | 'concern' | 'suggestion';
}

export function HealthImpact({ title, items, className, iconType = 'benefit' }: HealthImpactProps) {
  if (!items || items.length === 0) return null;
  
  const getIconClass = () => {
    switch (iconType) {
      case 'benefit':
        return 'text-green-500';
      case 'concern':
        return 'text-amber-500';
      case 'suggestion':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };
  
  return (
    <div className={cn("mt-6", className)}>
      <h2 className="text-lg font-semibold text-gray-800 mb-3">{title}</h2>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${item.title.substring(0, 10)}-${index}`} className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-medium text-gray-900 flex items-center">
              {iconType === 'benefit' && (
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {iconType === 'concern' && (
                <svg className="w-5 h-5 mr-2 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {iconType === 'suggestion' && (
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {item.title}
            </h3>
            <p className="mt-1 text-sm text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 