/**
 * Enhanced Cache Clearing and App Repair Script
 * Fixes cache issues, reload loops, and typing problems
 */

(function() {
  // Create visual feedback
  const createFeedback = () => {
    // Create container
    const container = document.createElement('div');
    container.id = 'cache-clear-feedback';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.padding = '10px';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    container.style.color = '#00ff00';
    container.style.fontFamily = 'monospace';
    container.style.fontSize = '14px';
    container.style.zIndex = '9999';
    container.style.borderBottom = '2px solid #00ff00';
    document.body.appendChild(container);
    
    // Add heading
    const heading = document.createElement('div');
    heading.textContent = '🧹 ENHANCED CACHE CLEARING AND APP REPAIR';
    heading.style.fontWeight = 'bold';
    heading.style.marginBottom = '5px';
    container.appendChild(heading);
    
    // Add log area
    const log = document.createElement('div');
    log.id = 'cache-clear-log';
    log.style.maxHeight = '200px';
    log.style.overflowY = 'auto';
    log.style.fontSize = '12px';
    container.appendChild(log);
    
    // Add progress bar
    const progressContainer = document.createElement('div');
    progressContainer.style.marginTop = '5px';
    progressContainer.style.height = '5px';
    progressContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    progressContainer.style.borderRadius = '3px';
    container.appendChild(progressContainer);
    
    const progressBar = document.createElement('div');
    progressBar.id = 'cache-clear-progress';
    progressBar.style.width = '0%';
    progressBar.style.height = '100%';
    progressBar.style.backgroundColor = '#00ff00';
    progressBar.style.borderRadius = '3px';
    progressBar.style.transition = 'width 0.3s ease';
    progressContainer.appendChild(progressBar);
    
    return {
      log: (message, isError = false) => {
        const entry = document.createElement('div');
        const time = new Date().toLocaleTimeString();
        entry.innerHTML = `[${time}] ${isError ? '❌' : '✓'} ${message}`;
        if (isError) {
          entry.style.color = '#ff4444';
        }
        document.getElementById('cache-clear-log').appendChild(entry);
      },
      
      updateProgress: (percent) => {
        document.getElementById('cache-clear-progress').style.width = `${percent}%`;
      },
      
      complete: () => {
        heading.textContent = '✅ APP REPAIR COMPLETE';
        heading.style.color = '#00ff00';
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          document.body.removeChild(container);
        }, 5000);
      }
    };
  };
  
  // Clear all caches
  const clearCaches = async (feedback) => {
    feedback.log('Starting cache cleanup...');
    
    try {
      // Clear application cache (deprecated but might exist)
      if (window.applicationCache) {
        try {
          window.applicationCache.abort();
          feedback.log('Application cache cleared');
        } catch (e) {
          feedback.log(`Application cache error: ${e.message}`, true);
        }
      }
      
      // Clear browser caches API
      if ('caches' in window) {
        feedback.log('Clearing Cache Storage API...');
        try {
          const keys = await window.caches.keys();
          feedback.log(`Found ${keys.length} caches`);
          
          let cleared = 0;
          for (const key of keys) {
            await caches.delete(key);
            cleared++;
            feedback.log(`Cleared cache: ${key}`);
            feedback.updateProgress((cleared / keys.length) * 30);
          }
          
          feedback.log('All caches cleared successfully');
        } catch (e) {
          feedback.log(`Cache API error: ${e.message}`, true);
        }
      } else {
        feedback.log('Cache Storage API not available');
      }
      
      // Clear localStorage
      try {
        const localStorageItems = Object.keys(localStorage).length;
        feedback.log(`Clearing ${localStorageItems} localStorage items...`);
        localStorage.clear();
        feedback.log('localStorage cleared');
      } catch (e) {
        feedback.log(`localStorage error: ${e.message}`, true);
      }
      
      // Clear sessionStorage
      try {
        const sessionStorageItems = Object.keys(sessionStorage).length;
        feedback.log(`Clearing ${sessionStorageItems} sessionStorage items...`);
        sessionStorage.clear();
        feedback.log('sessionStorage cleared');
      } catch (e) {
        feedback.log(`sessionStorage error: ${e.message}`, true);
      }
      
      feedback.updateProgress(40);
      return true;
    } catch (e) {
      feedback.log(`Error clearing caches: ${e.message}`, true);
      return false;
    }
  };
  
  // Fix service workers
  const fixServiceWorkers = async (feedback) => {
    feedback.log('Checking for service workers...');
    
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        feedback.log(`Found ${registrations.length} service workers`);
        
        let unregistered = 0;
        for (const registration of registrations) {
          await registration.unregister();
          unregistered++;
          feedback.log(`Unregistered service worker: ${registration.scope}`);
          feedback.updateProgress(40 + (unregistered / registrations.length) * 20);
        }
        
        feedback.log('All service workers unregistered');
      } else {
        feedback.log('Service Worker API not available');
      }
      
      feedback.updateProgress(60);
      return true;
    } catch (e) {
      feedback.log(`Error fixing service workers: ${e.message}`, true);
      return false;
    }
  };
  
  // Fix input elements
  const fixInputElements = (feedback) => {
    feedback.log('Fixing input elements...');
    
    try {
      // Find all input elements
      const inputs = document.querySelectorAll('input, textarea');
      feedback.log(`Found ${inputs.length} input elements`);
      
      // Clone each input to remove event listeners
      inputs.forEach((input, index) => {
        const parent = input.parentNode;
        if (parent) {
          // Save important state
          const value = input.value;
          const focused = document.activeElement === input;
          
          // Clone the node without event listeners
          const clone = input.cloneNode(true);
          
          // Replace the element
          parent.replaceChild(clone, input);
          
          // Restore state
          clone.value = value;
          if (focused) {
            clone.focus();
          }
          
          feedback.log(`Fixed input element: ${input.id || input.name || `[${index}]`}`);
        }
      });
      
      // Add CSS fixes
      const style = document.createElement('style');
      style.id = 'input-fix-styles';
      style.textContent = `
        /* Force hardware acceleration to prevent flickering */
        input, textarea, [contenteditable] {
          transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-font-smoothing: antialiased;
        }
        
        /* Fix for caret issues */
        input, textarea, [contenteditable] {
          isolation: isolate;
          position: relative;
          z-index: 1;
        }
        
        /* Fix for iOS zoom issues */
        input, select, textarea {
          font-size: 16px !important;
        }
      `;
      document.head.appendChild(style);
      
      feedback.log('Input elements fixed successfully');
      feedback.updateProgress(80);
      return true;
    } catch (e) {
      feedback.log(`Error fixing input elements: ${e.message}`, true);
      return false;
    }
  };
  
  // Prevent automatic page reloads
  const preventReloadLoops = (feedback) => {
    feedback.log('Preventing reload loops...');
    
    try {
      // Save current time to detect rapid reloads
      const now = Date.now();
      const lastReload = parseInt(sessionStorage.getItem('lastReload') || '0', 10);
      
      // Detect if reloading rapidly
      if (lastReload && now - lastReload < 3000) {
        feedback.log('Detected rapid reloading, applying stabilization...');
        
        // Block future automatic reloads
        const originalReload = window.location.reload;
        window.location.reload = function(forceGet) {
          if (forceGet === true) {
            // Allow hard reloads
            originalReload.call(window.location, true);
          } else {
            feedback.log('Automatic reload prevented');
            console.log('Automatic reload prevented by cache clear script');
            return false;
          }
        };
        
        feedback.log('Reload protection activated');
      }
      
      // Update last reload time
      sessionStorage.setItem('lastReload', now.toString());
      
      feedback.updateProgress(90);
      return true;
    } catch (e) {
      feedback.log(`Error preventing reloads: ${e.message}`, true);
      return false;
    }
  };
  
  // Run all repairs
  const runAllRepairs = async () => {
    const feedback = createFeedback();
    feedback.log('Starting enhanced cache clearing and app repair...');
    
    // Clear all caches
    await clearCaches(feedback);
    
    // Fix service workers
    await fixServiceWorkers(feedback);
    
    // Fix input elements
    fixInputElements(feedback);
    
    // Prevent reload loops
    preventReloadLoops(feedback);
    
    // Complete
    feedback.updateProgress(100);
    feedback.log('All repairs completed successfully');
    feedback.complete();
    
    // Update page status
    if (window.appFix) {
      window.appFix.runAll();
    }
  };
  
  // Run the repairs
  runAllRepairs();
})(); 