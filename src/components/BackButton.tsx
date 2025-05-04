'use client';

import { useRouter } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa';

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
    >
      <FaArrowLeft className="mr-2" />
      <span>Back</span>
    </button>
  );
} 