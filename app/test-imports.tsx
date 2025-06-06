// Test file to verify @/ imports work on Vercel
'use client';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/client/ClientAuthProvider';
import PersonalizedNutritionAnalysis from '@/components/PersonalizedNutritionAnalysis';

export default function TestImports() {
  return (
    <div>
      <h1>Import Test</h1>
      <p>This page tests the problematic imports that are failing on Vercel</p>
    </div>
  );
} 