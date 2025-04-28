'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ClientFallback() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    try {
      const localData = localStorage.getItem('mealData');
      
      if (localData) {
        console.log("Found data in localStorage, using it for analysis");
        // We found data in localStorage!
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
            window.location.reload();
          } else {
            router.push('/?error=session-storage-failed');
          }
        })
        .catch(error => {
          console.error('Error storing session data:', error);
          router.push('/');
        });
      } else {
        console.log("No meal data found in localStorage");
        setIsChecking(false);
        router.push('/');
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      setIsChecking(false);
      router.push('/');
    }
  }, [router]);
  
  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Looking for your meal data...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Session Data Not Found</h1>
      <p className="text-gray-600 mb-6">We couldn't find your meal analysis data.</p>
      <Link 
        href="/"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
} 