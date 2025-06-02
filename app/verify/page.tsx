// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function VerifyPage() {
  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-green-600 mb-4">System Verification Page</h1>
      <p className="mb-4">If you can see this page, the basic Next.js routing is working.</p>
      <p className="mb-4">This page doesn't use:</p>
      <ul className="list-disc pl-6 mb-6 space-y-1">
        <li>Authentication</li>
        <li>Error boundaries</li>
        <li>Dynamic content</li>
        <li>API calls</li>
      </ul>
      <div className="p-4 bg-blue-50 rounded-md">
        <p className="text-blue-800">Next step: Check if the <a href="/" className="underline">homepage</a> loads correctly.</p>
      </div>
    </div>
  );
} 