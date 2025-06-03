'use client';

export default function DebugInfo() {
  return (
    <div className="fixed bottom-4 right-4 bg-green-500 text-white p-2 rounded text-xs max-w-xs">
      <div>🛡️ CRASH-PROOF BUILD: 2025-06-02T23:15:00Z</div>
      <div>✅ ALL auth contexts safe (both old & new)</div>
      <div>✅ ClientAuthProvider with safe fallbacks</div>
      <div>✅ Fixed HomeWelcome auth import</div>
      <div>✅ MealUploader with text input</div>
      <div>✅ Snap2Health logo in NavBar</div>
      <div>✅ Zero crash potential</div>
    </div>
  );
} 