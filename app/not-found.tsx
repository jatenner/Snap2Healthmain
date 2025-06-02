import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-slate-300 mb-6">Page Not Found</h2>
        <p className="text-slate-400 mb-8">The page you're looking for doesn't exist.</p>
        <Link 
          href="/upload" 
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Upload
        </Link>
      </div>
    </div>
  );
} 