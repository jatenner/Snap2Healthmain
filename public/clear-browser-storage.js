/**
 * Snap2Health Browser Storage Fix
 * This script automatically detects and fixes common browser storage issues
 */

(function() {
  // Check if storage is working properly
  function checkStorage() {
    try {
      const testKey = 'storage-test-' + Date.now();
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.error('Storage test failed:', e);
      return false;
    }
  }
  
  // Clear auth-related storage to fix conflicts
  function clearAuthStorage() {
    try {
      // Clear all Supabase related items
      const itemsToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('supabase') || 
          key.includes('sb-') || 
          key.includes('gotrue') ||
          key.includes('auth')
        )) {
          itemsToRemove.push(key);
        }
      }
      
      // Remove items outside the loop to avoid index shifting
      itemsToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log('Removed:', key);
        } catch (e) {
          console.warn('Failed to remove:', key, e);
        }
      });
      
      return true;
    } catch (e) {
      console.error('Failed to clear auth storage:', e);
      return false;
    }
  }
  
  // Run the fixes
  function runFixes() {
    const storageWorking = checkStorage();
    
    if (!storageWorking) {
      console.warn('Browser storage is not working properly');
      // Add a flag to the document to show a warning
      document.body.dataset.storageIssue = 'true';
    } else {
      clearAuthStorage();
    }
  }
  
  // Run fixes when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runFixes);
  } else {
    runFixes();
  }
})();