/**
 * Cache Manager
 * Handles browser storage management and cleanup
 */

export function runCacheMaintenance(): void {
  console.log('[CacheManager] Running cache maintenance');
  
  // Clean up old localStorage entries
  try {
    const keysToCheck = Object.keys(localStorage);
    keysToCheck.forEach(key => {
      if (key.startsWith('temp_') || key.startsWith('cache_')) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            if (parsed._timestamp && Date.now() - parsed._timestamp > 24 * 60 * 60 * 1000) {
              localStorage.removeItem(key);
              console.log(`[CacheManager] Removed expired cache entry: ${key}`);
            }
          } catch (e) {
            // If we can't parse it, it might be old data
            localStorage.removeItem(key);
          }
        }
      }
    });
  } catch (e) {
    console.warn('[CacheManager] Error during cache maintenance:', e);
  }
}

export function isStorageNearlyFull(): boolean {
  try {
    // Test if we can still write to localStorage
    const testKey = '_storage_test';
    const testData = 'x'.repeat(1024); // 1KB test
    localStorage.setItem(testKey, testData);
    localStorage.removeItem(testKey);
    return false;
  } catch (e) {
    return true;
  }
}

export function clearAllCaches(): void {
  console.log('[CacheManager] Clearing all caches');
  
  try {
    // Clear specific cache entries but preserve important data
    const keysToPreserve = [
      'profile_backup',
      'snap2health_profile', 
      'user_profile',
      'supabase.auth.token'
    ];
    
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToPreserve.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage completely
    sessionStorage.clear();
    
    console.log('[CacheManager] Cache clearing complete');
  } catch (e) {
    console.warn('[CacheManager] Error clearing caches:', e);
  }
} 