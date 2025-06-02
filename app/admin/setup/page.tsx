'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../context/auth';

export default function SetupPage() {
  const [tableStatus, setTableStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const { user } = useAuth();

  // SQL for creating meals table
  const mealsTableSQL = `CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  goal TEXT,
  image_url TEXT,
  caption TEXT,
  analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable row level security
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- Create access policies
CREATE POLICY "Users can view their own meals"
  ON public.meals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meals"
  ON public.meals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);`;

  // SQL for creating storage bucket
  const storageSetupSQL = `-- This is for reference - you'll need to create
-- the storage bucket via the Supabase dashboard:
-- 1. Go to Storage in the left sidebar
-- 2. Click "Create new bucket"
-- 3. Name it "meal-images"
-- 4. Make sure "Public bucket" is enabled
-- 5. Set file size limit to 10MB`;

  useEffect(() => {
    checkTables();
  }, []);

  const checkTables = async () => {
    setIsLoading(true);
    try {
      // Check meals table 
      const { error: mealsError } = await supabase
        .from('meals')
        .select('id')
        .limit(1);

      setTableStatus({
        meals: {
          exists: !mealsError,
          message: mealsError 
            ? 'Table does not exist. Please run the migration files in your Supabase project.' 
            : 'Table exists'
        }
      });
    } catch (err) {
      console.error('Error checking tables:', err);
      setTableStatus({
        meals: {
          exists: false,
          message: 'Error checking table status'
        }
      });
    }
    setIsLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Check storage bucket
  const [bucketStatus, setBucketStatus] = useState({ exists: false, message: 'Checking...' });
  
  useEffect(() => {
    const checkBucket = async () => {
      try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) {
          setBucketStatus({ exists: false, message: `Error checking bucket: ${error.message}` });
          return;
        }
        
        const mealImagesBucket = buckets.find(bucket => bucket.name === 'meal-images');
        if (mealImagesBucket) {
          setBucketStatus({ exists: true, message: 'Bucket exists' });
        } else {
          setBucketStatus({ exists: false, message: 'Bucket does not exist' });
        }
      } catch (err: any) {
        setBucketStatus({ exists: false, message: `Error: ${err.message}` });
      }
    };
    
    checkBucket();
  }, []);

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Database Setup</h1>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
          <p className="font-medium">You need to be logged in to access this page</p>
          <p className="mt-2">Please log in to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Snap2Health Database Setup</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
        <p>
          This utility helps you ensure that all required database tables and storage buckets 
          are set up correctly in your Supabase project.
        </p>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Required Database Tables</h2>
        
        {isLoading ? (
          <div className="p-4 bg-gray-100 rounded">Loading...</div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 border-b font-medium flex justify-between">
                <span>meals table</span>
                <span className={tableStatus?.meals.exists ? "text-green-600" : "text-red-600"}>
                  {tableStatus?.meals.exists ? "OK" : "Missing"}
                </span>
              </div>
              <div className="p-4">
                <p className="mb-4">{tableStatus?.meals.message}</p>
                
                {!tableStatus?.meals.exists && (
                  <div className="mt-4">
                    <div className="mb-2 font-medium">SQL to create table:</div>
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-auto max-h-80">
                        {mealsTableSQL}
                      </pre>
                      <button 
                        onClick={() => copyToClipboard(mealsTableSQL)}
                        className="absolute top-2 right-2 bg-blue-500 hover:bg-blue-600 text-white rounded px-2 py-1 text-xs"
                      >
                        {isCopied ? "Copied!" : "Copy SQL"}
                      </button>
                    </div>
                    
                    <div className="mt-4 bg-yellow-50 p-3 rounded border border-yellow-200 text-sm">
                      <p className="font-medium">How to run this SQL:</p>
                      <ol className="list-decimal pl-5 mt-2 space-y-1">
                        <li>Go to your Supabase project dashboard</li>
                        <li>Click on "SQL Editor" in the left sidebar</li>
                        <li>Click "New Query"</li>
                        <li>Paste the SQL above</li>
                        <li>Click "Run"</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Required Storage Buckets</h2>
        
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b font-medium flex justify-between">
            <span>meal-images bucket</span>
            <span className={bucketStatus.exists ? "text-green-600" : "text-red-600"}>
              {bucketStatus.exists ? "OK" : "Missing"}
            </span>
          </div>
          <div className="p-4">
            <p className="mb-4">{bucketStatus.message}</p>
            
            {!bucketStatus.exists && (
              <div className="mt-4">
                <div className="mb-2 font-medium">Storage setup instructions:</div>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-auto max-h-80">
                    {storageSetupSQL}
                  </pre>
                </div>
                
                <div className="mt-4 bg-yellow-50 p-3 rounded border border-yellow-200 text-sm">
                  <p className="font-medium">How to create the storage bucket:</p>
                  <ol className="list-decimal pl-5 mt-2 space-y-1">
                    <li>Go to your Supabase project dashboard</li>
                    <li>Click on "Storage" in the left sidebar</li>
                    <li>Click "New Bucket"</li>
                    <li>Name it "meal-images"</li>
                    <li>Enable "Public bucket" option</li>
                    <li>Click "Create bucket"</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between mt-8">
        <button
          onClick={checkTables}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh Status
        </button>
        
        <a
          href="https://app.supabase.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Go to Supabase Dashboard
        </a>
      </div>
    </div>
  );
} 