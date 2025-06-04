export default function TestPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-400 mb-4">Snap2Health Test Page</h1>
        <p className="text-xl text-gray-300 mb-8">This page tests basic functionality</p>
        <div className="space-y-4">
          <a href="/" className="block text-blue-400 hover:text-blue-300">→ Home</a>
          <a href="/login" className="block text-blue-400 hover:text-blue-300">→ Login</a>
          <a href="/signup" className="block text-blue-400 hover:text-blue-300">→ Signup</a>
          <a href="/upload" className="block text-blue-400 hover:text-blue-300">→ Upload</a>
        </div>
      </div>
    </div>
  )
} 