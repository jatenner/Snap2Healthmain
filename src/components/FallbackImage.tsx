'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface FallbackImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
}

export default function FallbackImage({ 
  src, 
  alt, 
  fallbackSrc = '/images/meal-sample.jpg',
  className = 'object-contain'
}: FallbackImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(fallbackSrc);
  const [error, setError] = useState(false);

  // When the src prop changes, update the image source
  useEffect(() => {
    if (src && src !== fallbackSrc) {
      setImgSrc(src);
      setError(false);
    }
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
      setError(true);
    }
  };

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      priority
      unoptimized={true}
      className={className}
      onError={handleError}
    />
  );
} 