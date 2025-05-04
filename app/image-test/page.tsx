'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

export default function ImageTestPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testUrl, setTestUrl] = useState('');
  const [testImage, setTestImage] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [loadingTestImage, setLoadingTestImage] = useState(false);

  useEffect(() => {
    async function fetchDebugInfo() {
      try {
        setLoading(true);
        const response = await fetch('/api/debug/images');
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        const data = await response.json();
        setData(data);
        // Set first image URL as test URL if available
        if (data.meals?.records?.length > 0 && data.meals.records[0].image_url) {
          setTestUrl(data.meals.records[0].image_url);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch debug information');
      } finally {
        setLoading(false);
      }
    }

    fetchDebugInfo();
  }, []);

  const handleTestImage = () => {
    setTestImage(testUrl);
    setImageLoaded(false);
    setImageError(null);
    setLoadingTestImage(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setLoadingTestImage(false);
    setImageError(null);
  };

  const handleImageError = () => {
    setImageError(`Failed to load image from URL: ${testUrl}`);
    setLoadingTestImage(false);
    setImageLoaded(false);
  };

  const generateTestUrl = async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError('Supabase environment variables are not set');
      return;
    }

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      if (data?.storage?.files?.length > 0) {
        const file = data.storage.files[0];
        const { data: publicUrl } = supabase
          .storage
          .from('meal-images')
          .getPublicUrl(file.name);
        
        if (publicUrl?.publicUrl) {
          setTestUrl(publicUrl.publicUrl);
        } else {
          setError('Failed to generate public URL');
        }
      } else {
        setError('No files found in storage');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate test URL');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Image Loading Test Page</h1>
      <Link href="/dashboard" className="text-blue-500 hover:underline mb-4 inline-block">
        ← Back to Dashboard
      </Link>

      <div className="bg-gray-100 p-4 rounded-md my-4">
        <h2 className="text-xl font-semibold mb-2">Test Image Loading</h2>
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            className="flex-1 p-2 border rounded"
            placeholder="Enter image URL to test"
          />
          <button
            onClick={handleTestImage}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Load
          </button>
          <button
            onClick={generateTestUrl}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Generate URL
          </button>
        </div>

        {loadingTestImage && <p>Loading image...</p>}
        {imageError && <p className="text-red-500">{imageError}</p>}
        
        {testImage && (
          <div className="mt-4 border p-4 rounded">
            <h3 className="text-lg font-medium mb-2">Test Image:</h3>
            <div className="relative h-64 w-full">
              {/* First try with next/image */}
              <Image
                src={testImage}
                alt="Test image"
                fill
                style={{ objectFit: 'contain' }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
            <p className="mt-2">
              Status: {imageLoaded ? 'Loaded successfully ✓' : 'Failed to load ✗'}
            </p>
            
            {!imageLoaded && (
              <div className="mt-4">
                <h4 className="font-medium">Fallback with regular img tag:</h4>
                <img 
                  src={testImage} 
                  alt="Test with standard img tag" 
                  className="max-h-64 mt-2"
                  onLoad={() => console.log("Standard img loaded")} 
                  onError={() => console.log("Standard img failed")}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <p>Loading debug information...</p>
      ) : error ? (
        <div className="text-red-500 my-4">Error: {error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white p-4 shadow rounded">
            <h2 className="text-xl font-semibold mb-4">Meal Records ({data?.meals?.records?.length || 0})</h2>
            {data?.meals?.error && (
              <p className="text-red-500 mb-2">Error: {data.meals.error}</p>
            )}
            {data?.meals?.records?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Image URL</th>
                      <th className="px-4 py-2 text-left">Valid URL</th>
                      <th className="px-4 py-2 text-left">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.meals.records.map((meal: any) => (
                      <tr key={meal.id} className="border-b">
                        <td className="px-4 py-2">{meal.id}</td>
                        <td className="px-4 py-2 max-w-[200px] truncate">{meal.image_url}</td>
                        <td className="px-4 py-2">
                          {meal.url_valid ? (
                            <span className="text-green-500">✓</span>
                          ) : (
                            <span className="text-red-500">✗</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {new Date(meal.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No meal records found</p>
            )}
          </div>

          <div className="bg-white p-4 shadow rounded">
            <h2 className="text-xl font-semibold mb-4">Storage Files ({data?.storage?.files?.length || 0})</h2>
            {data?.storage?.bucketError && (
              <p className="text-red-500 mb-2">Bucket Error: {data.storage.bucketError}</p>
            )}
            {data?.storage?.filesError && (
              <p className="text-red-500 mb-2">Files Error: {data.storage.filesError}</p>
            )}
            {data?.storage?.files?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Size</th>
                      <th className="px-4 py-2 text-left">MIME Type</th>
                      <th className="px-4 py-2 text-left">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.storage.files.map((file: any) => (
                      <tr key={file.id} className="border-b">
                        <td className="px-4 py-2">{file.name}</td>
                        <td className="px-4 py-2">{Math.round(file.metadata?.size / 1024)} KB</td>
                        <td className="px-4 py-2">{file.metadata?.mimetype || 'N/A'}</td>
                        <td className="px-4 py-2">
                          {file.created_at ? new Date(file.created_at).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No files found in storage</p>
            )}
          </div>

          <div className="bg-white p-4 shadow rounded md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Next.js Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Image Domains</h3>
                {data?.nextConfig?.domains?.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {data.nextConfig.domains.map((domain: string, index: number) => (
                      <li key={index}>{domain}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No domains configured</p>
                )}
              </div>
              <div>
                <h3 className="font-medium mb-2">URL Format</h3>
                <p className="break-all">{data?.nextConfig?.urlFormat || 'Not available'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 