'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function TestImagePage() {
  const [imgSrc, setImgSrc] = useState('/images/meal-sample.jpg');
  
  const handleError = () => {
    console.error("Image failed to load:", imgSrc);
    setImgSrc('/images/meal-sample.jpg');
  };
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Image Test Page</h1>
      
      <div className="mb-4">
        <input 
          type="text" 
          value={imgSrc} 
          onChange={(e) => setImgSrc(e.target.value)} 
          className="w-full p-2 border rounded"
          placeholder="Image URL"
        />
      </div>
      
      <div className="relative h-96 w-full border rounded overflow-hidden">
        <Image 
          src={imgSrc}
          alt="Test image" 
          fill
          className="object-contain"
          unoptimized={true}
          onError={handleError}
        />
      </div>
      
      <div className="mt-4">
        <p className="text-gray-700">Current image URL: {imgSrc}</p>
      </div>
    </div>
  );
} 