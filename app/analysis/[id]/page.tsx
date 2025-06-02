'use client';

import { useEffect } from 'react';
import StandaloneMealAnalysis from '../../components/StandaloneMealAnalysis';

// Export this to ensure dynamic data is fetched on each request
export const dynamic = 'force-dynamic';

// Simple page component that passes the ID parameter to StandaloneMealAnalysis
export default function MealAnalysisPage({ params }: { params: { id: string } }) {
  // Log page load for debugging
  useEffect(() => {
    console.log('[analysis/[id]] Page loaded with ID:', params.id);
  }, [params.id]);

  return (
    <div className="analysis-page">
      <StandaloneMealAnalysis mealId={params.id} />
    </div>
  );
} 