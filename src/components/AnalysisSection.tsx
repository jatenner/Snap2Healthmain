import React, { ReactNode } from 'react';

interface AnalysisSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const AnalysisSection: React.FC<AnalysisSectionProps> = ({
  title,
  icon,
  children,
  className = ''
}) => {
  return (
    <section className={`mb-8 ${className}`}>
      <div className="flex items-center mb-4">
        {icon && (
          <div className="mr-3">
            {icon}
          </div>
        )}
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      </div>
      {children}
    </section>
  );
}; 