import React, { ReactNode } from 'react';

interface AnalysisSectionProps {
  title: string;
  items: string[];
  icon: string;
  className?: string;
}

export function AnalysisSection({ title, items, icon, className = '' }: AnalysisSectionProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className={`p-6 rounded-lg shadow ${className}`}>
      <h3 className="text-xl font-semibold mb-4">{icon} {title}</h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="pl-2">{item}</li>
        ))}
      </ul>
    </div>
  );
}