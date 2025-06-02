'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSave, FaCheck, FaSpinner } from 'react-icons/fa';
import supabase from '@/lib/supabaseClient';

interface SaveMealButtonProps {
  mealId?: string;
  imageUrl?: string;
  caption: string;
  analysisData: any;
}

export default function SaveMealButton({ mealId, imageUrl, caption, analysisData }: SaveMealButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const saveMealToHistory = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Check if we have a user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error('Authentication error. Please log in to save meals.');
      }
      
      if (!session) {
        // If no valid session (and no error), we're not logged in
        router.push('/login?redirect=meal-analysis');
        return;
      }
      
      const userId = session.user.id;
      
      // Prepare meal data for saving to meal_history table
      const mealData = {
        id: mealId || crypto.randomUUID(),
        user_id: userId,
        meal_name: caption || 'Food Analysis',
        image_url: imageUrl || null,
        analysis: analysisData || {},
        created_at: new Date().toISOString()
      };
      
      // Insert the meal into the meal_history table
      const { error: insertError } = await supabase
        .from('meals')
        .upsert(mealData, { onConflict: 'id' });
      
      if (insertError) {
        throw new Error(`Failed to save meal: ${insertError.message}`);
      }
      
      setIsSaved(true);
      
      // Refresh page data after saving
      router.refresh();
      
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error saving meal:', err);
      setError(err.message || 'Failed to save meal to history');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-start">
      <button
        onClick={saveMealToHistory}
        disabled={isSaving || isSaved}
        className={`flex items-center px-4 py-2 rounded-md text-white transition-colors ${
          isSaved ? 'bg-green-500 hover:bg-green-600' : 
          'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isSaving ? (
          <>
            <FaSpinner className="animate-spin mr-2" />
            <span>Saving...</span>
          </>
        ) : isSaved ? (
          <>
            <FaCheck className="mr-2" />
            <span>Saved to History</span>
          </>
        ) : (
          <>
            <FaSave className="mr-2" />
            <span>Save to History</span>
          </>
        )}
      </button>
      
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
} 