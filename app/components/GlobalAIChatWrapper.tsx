'use client';

import dynamic from 'next/dynamic';

const GlobalAIChat = dynamic(() => import('./GlobalAIChat'), {
  ssr: false,
  loading: () => (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="w-14 h-14 bg-purple-600 rounded-full shadow-lg flex items-center justify-center animate-pulse">
        <span className="text-white">💬</span>
      </div>
    </div>
  )
});

export default function GlobalAIChatWrapper() {
  return <GlobalAIChat />;
} 