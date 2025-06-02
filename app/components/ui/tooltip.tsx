"use client"

import React, { useState, ReactNode } from 'react';

export interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({ 
  children, 
  content, 
  position = 'top', 
  delay = 200 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showTip = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const hideTip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const positionStyles = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-1',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 translate-y-2 mt-1',
    left: 'right-full top-1/2 transform -translate-y-1/2 -translate-x-2 mr-1',
    right: 'left-full top-1/2 transform -translate-y-1/2 translate-x-2 ml-1',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTip}
      onMouseLeave={hideTip}
      onFocus={showTip}
      onBlur={hideTip}
    >
      {isVisible && (
        <div 
          className={`absolute ${positionStyles[position]} z-50 px-2 py-1 text-xs bg-gray-900 text-white rounded whitespace-nowrap shadow-lg max-w-[200px] overflow-hidden text-ellipsis`}
        >
          {content}
        </div>
      )}
      <div className="inline-block">{children}</div>
    </div>
  );
} 