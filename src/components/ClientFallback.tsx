'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ClientFallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      // First check URL parameters - prioritize this since it's what the user just did
      const urlData = searchParams.get('data');
      
      // Then check localStorage as fallback
      const localData = localStorage.getItem('mealData');
      
      if (urlData) {
        console.log("Found data in URL parameter, attempting to use it for analysis");
        try {
          // Make sure we properly decode the URL parameter
          const decodedData = decodeURIComponent(urlData);
          console.log("URL data length:", decodedData.length);
          
          // Try to parse the JSON data
          let parsedData;
          try {
            parsedData = JSON.parse(decodedData);
            console.log("Successfully parsed URL data as JSON");
          } catch (jsonError) {
            console.error("Failed to parse URL data as JSON", jsonError);
            
            // Try alternative parsing for URL-encoded JSON
            try {
              // Sometimes the JSON is doubly encoded
              parsedData = JSON.parse(decodeURIComponent(decodedData));
              console.log("Successfully parsed URL data with double decoding");
            } catch (doubleDecodeError) {
              console.error("Failed double decode attempt", doubleDecodeError);
              
              // Last resort - check if it's a simple string that needs to be wrapped
              if (decodedData.includes('mealId') || decodedData.includes('imageUrl')) {
                try {
                  // Create a basic wrapper object
                  parsedData = { mealContents: decodedData };
                  console.log("Created wrapper object for simple string data");
                } catch (e) {
                  throw new Error("All parsing attempts failed");
                }
              } else {
                throw new Error("All parsing attempts failed");
              }
            }
          }
          
          // Normalize the data - ensure we have imageUrl field
          if (parsedData) {
            if (parsedData.signedUrl && !parsedData.imageUrl) {
              parsedData.imageUrl = parsedData.signedUrl;
              console.log("Used signedUrl as imageUrl");
            }
            
            // Make sure we handle URLs that might be getting truncated or encoded incorrectly
            if (parsedData.imageUrl && typeof parsedData.imageUrl === 'string') {
              // Fix any double-encoded URLs
              if (parsedData.imageUrl.includes('%25')) {
                parsedData.imageUrl = decodeURIComponent(parsedData.imageUrl);
                console.log("Fixed double-encoded image URL");
              }
            }
          }
          
          console.log("Data structure keys:", Object.keys(parsedData).join(', '));
          
          // Store it in the session from client side and reload
          fetch('/api/session/store', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              key: 'mealData', 
              value: parsedData 
            }),
          })
          .then(response => {
            if (response.ok) {
              // Also store in localStorage as backup
              localStorage.setItem('mealData', JSON.stringify(parsedData));
              console.log("Stored URL data in session and localStorage, reloading page");
              window.location.reload();
            } else {
              console.error("Failed to store session data from URL:", response.status);
              setError("Failed to store data from URL");
              setIsChecking(false);
            }
          })
          .catch(error => {
            console.error('Error storing session data from URL:', error);
            setError("Error storing data");
            setIsChecking(false);
          });
        } catch (error) {
          console.error("Error parsing URL data:", error);
          setError("Invalid data format in URL");
          setIsChecking(false);
        }
      }
      else if (localData) {
        console.log("Found data in localStorage, using it for analysis");
        // We found data in localStorage
        // Store it in the session from client side and reload
        fetch('/api/session/store', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            key: 'mealData', 
            value: JSON.parse(localData) 
          }),
        })
        .then(response => {
          if (response.ok) {
            console.log("Stored localStorage data in session, reloading page");
            window.location.reload();
          } else {
            console.error("Failed to store session data from localStorage:", response.status);
            setError("Failed to store data from localStorage");
            setIsChecking(false);
          }
        })
        .catch(error => {
          console.error('Error storing session data from localStorage:', error);
          setError("Error storing data");
          setIsChecking(false);
        });
      } 
      else {
        console.log("No meal data found in URL or localStorage");
        setError("No meal data found");
        setIsChecking(false);
      }
    } catch (error) {
      console.error("Error in ClientFallback:", error);
      setError("Unknown error occurred");
      setIsChecking(false);
    }
  }, [router, searchParams]);
  
  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading your meal analysis...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Session Data Not Found</h1>
      <p className="text-gray-600 mb-2">We couldn't display your meal analysis.</p>
      {error && (
        <p className="text-red-500 mb-6">{error}</p>
      )}
      <Link 
        href="/"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
} 