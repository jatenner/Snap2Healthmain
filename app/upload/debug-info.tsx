'use client';

export default function DebugInfo() {
  return (
    <div className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded text-xs max-w-xs">
      <div>🔐 FULL AUTH BUILD: 2025-06-02T23:00:00Z</div>
      <div>✅ ClientAuthProvider with safe fallbacks</div>
      <div>✅ ProfileProvider</div>
      <div>✅ MealUploader with text input</div>
      <div>✅ Snap2Health logo in NavBar</div>
      <div>✅ Working analysis functionality</div>
      <div>✅ No broken script references</div>
    </div>
  );
} 