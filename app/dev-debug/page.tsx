'use client';

import { useState, useEffect } from 'react';

export default function DevDebugPage() {
  const [systemInfo, setSystemInfo] = useState<any>({
    nextVersion: 'Loading...',
    nodeVersion: 'Loading...',
    platform: 'Loading...',
    timestamp: new Date().toISOString(),
    buildId: 'Loading...',
    serverSideRendering: 'Loading...',
    cacheBuster: Date.now().toString()
  });

  const [browserInfo, setBrowserInfo] = useState<any>({
    userAgent: 'Loading...',
    localStorage: 'Loading...',
    sessionStorage: 'Loading...',
    cookies: 'Loading...',
    windowSize: 'Loading...',
    devicePixelRatio: 'Loading...'
  });

  useEffect(() => {
    // Get browser info
    const getBrowserInfo = () => {
      try {
        const localStorageItems = Object.keys(localStorage).length;
        const sessionStorageItems = Object.keys(sessionStorage).length;
        const cookies = document.cookie.split(';').map(c => c.trim());
        const windowSize = `${window.innerWidth}x${window.innerHeight}`;
        
        setBrowserInfo({
          userAgent: navigator.userAgent,
          localStorage: `${localStorageItems} items`,
          sessionStorage: `${sessionStorageItems} items`,
          cookies: cookies.length > 0 ? `${cookies.length} cookies` : 'No cookies',
          windowSize,
          devicePixelRatio: window.devicePixelRatio
        });
      } catch (error) {
        console.error('Error getting browser info:', error);
      }
    };

    // Get server info through an API endpoint
    const getSystemInfo = async () => {
      try {
        const response = await fetch('/api/debug/system-info');
        if (response.ok) {
          const data = await response.json();
          setSystemInfo({
            ...data,
            timestamp: new Date().toISOString(),
            cacheBuster: Date.now().toString()
          });
        }
      } catch (error) {
        console.error('Error fetching system info:', error);
      }
    };

    getBrowserInfo();
    getSystemInfo();

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      getBrowserInfo();
      getSystemInfo();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Development Debug Information</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3 text-blue-800">System Information</h2>
          <div className="space-y-2">
            {Object.entries(systemInfo).map(([key, value]) => (
              <div key={key} className="flex justify-between border-b border-blue-100 pb-1">
                <span className="font-medium text-blue-700">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                <span className="text-blue-900">{value?.toString() || 'Not available'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3 text-green-800">Browser Information</h2>
          <div className="space-y-2">
            {Object.entries(browserInfo).map(([key, value]) => (
              <div key={key} className="flex justify-between border-b border-green-100 pb-1">
                <span className="font-medium text-green-700">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                <span className="text-green-900">{value?.toString() || 'Not available'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-purple-50 p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-3 text-purple-800">Cache Control</h2>
        <div className="space-y-4">
          <div>
            <p className="text-purple-700 mb-2">Your page has a cache buster parameter: <code className="bg-purple-100 px-2 py-1 rounded">{systemInfo.cacheBuster}</code></p>
            <p className="text-sm text-purple-600">This ensures you're seeing the latest version.</p>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={() => {
                window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
              }} 
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
            >
              Hard Reload Page
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                alert('Browser storage cleared! Reloading page...');
                window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
              }} 
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Clear Browser Storage
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-sm text-gray-500 text-center">
        Last updated: {new Date().toLocaleTimeString()} · Auto-refreshes every 5 seconds
      </div>
    </div>
  );
} 