/**
 * Cache Buster Script
 * Ensures the browser always loads the latest version of the app
 */

(function() {
  console.log('Cache buster initializing');
  
  // Create a version timestamp
  const timestamp = Date.now();
  
  // Store the version globally
  window.cacheBuster = {
    version: timestamp,
    lastCheck: timestamp,
    
    // Force reload if needed
    invalidateCache: function() {
      const currentUrl = window.location.href;
      const hasParams = currentUrl.includes('?');
      const separator = hasParams ? '&' : '?';
      window.location.href = `${currentUrl}${separator}_=${Date.now()}`;
      return true;
    },
    
    // Add cache busting parameter to URL
    addCacheBustingParam: function(url) {
      if (!url) return url;
      try {
        const urlObj = new URL(url, window.location.origin);
        urlObj.searchParams.set('_cb', timestamp);
        return urlObj.toString();
      } catch (e) {
        // For relative URLs, just append the parameter
        const hasParams = url.includes('?');
        const separator = hasParams ? '&' : '?';
        return `${url}${separator}_cb=${timestamp}`;
      }
    }
  };
  
  // Add cache control headers to all fetch requests
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    // Add cache busting to the URL
    if (typeof url === 'string') {
      url = window.cacheBuster.addCacheBustingParam(url);
    } else if (url instanceof Request) {
      url = new Request(
        window.cacheBuster.addCacheBustingParam(url.url),
        url
      );
    }
    
    // Add cache control headers
    options.headers = options.headers || {};
    options.headers = {
      ...options.headers,
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    };
    
    return originalFetch(url, options);
  };
  
  // Force reload all stylesheets
  document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    const originalHref = link.getAttribute('href');
    if (originalHref) {
      link.setAttribute('href', window.cacheBuster.addCacheBustingParam(originalHref));
    }
  });
  
  // Force reload all scripts
  document.querySelectorAll('script[src]').forEach(script => {
    const originalSrc = script.getAttribute('src');
    if (originalSrc && !originalSrc.includes('cache-buster.js')) {
      const newScript = document.createElement('script');
      newScript.src = window.cacheBuster.addCacheBustingParam(originalSrc);
      if (script.async) newScript.async = true;
      if (script.defer) newScript.defer = true;
      script.parentNode.replaceChild(newScript, script);
    }
  });
  
  // Fix issues with getComputedStyle
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function(element, pseudoElt) {
    if (!element || element === null) {
      console.warn('getComputedStyle called with null element, returning empty style');
      return {
        getPropertyValue: function() { return ''; }
      };
    }
    return originalGetComputedStyle(element, pseudoElt);
  };
  
  // Periodically check for new app versions
  setInterval(() => {
    fetch('/api/version?_=' + Date.now())
      .then(response => response.json())
      .then(data => {
        const currentVersion = localStorage.getItem('app_version');
        if (currentVersion && data.version && currentVersion !== data.version) {
          console.log('New version detected, reloading application');
          window.location.reload();
        } else {
          localStorage.setItem('app_version', data.version || timestamp.toString());
        }
      })
      .catch(err => {
        console.log('Version check error:', err);
      });
  }, 30000); // Check every 30 seconds
  
  console.log('Cache buster initialized, version:', timestamp);
})(); 