/**
 * Cache Manager
 * Utilities for managing browser caches to prevent quota exceeded errors
 */

// Maximum number of caches to keep
const MAX_CACHES = 3;

/**
 * Clean up browser caches to prevent QuotaExceededError
 * Keeps only the most recent caches up to MAX_CACHES
 */
export const cleanupCaches = async (): Promise<boolean> => {
  try {
    // Check if Cache API is available
    if (!('caches' in window)) {
      console.log('Cache API not available in this browser');
      return false;
    }

    // Get all cache names
    const cacheNames = await caches.keys();
    console.log(`Found ${cacheNames.length} caches`);

    // If we have more caches than our limit, delete the oldest ones
    if (cacheNames.length > MAX_CACHES) {
      const oldestCaches = cacheNames.slice(0, cacheNames.length - MAX_CACHES);
      
      console.log(`Removing ${oldestCaches.length} oldest caches`);
      let deletedCount = 0;
      
      for (const cacheName of oldestCaches) {
        await caches.delete(cacheName);
        deletedCount++;
      }
      
      console.log(`Successfully removed ${deletedCount} caches`);
    } else {
      console.log('Cache count is within limits, no cleanup needed');
    }
    
    return true;
  } catch (error) {
    console.error('Error cleaning up caches:', error);
    return false;
  }
};

/**
 * Clear all browser caches
 * More aggressive cleanup when needed
 */
export const clearAllCaches = async (): Promise<boolean> => {
  try {
    // Check if Cache API is available
    if (!('caches' in window)) {
      console.log('Cache API not available in this browser');
      return false;
    }

    // Get all cache names
    const cacheNames = await caches.keys();
    console.log(`Clearing all ${cacheNames.length} browser caches`);

    let deletedCount = 0;
    for (const cacheName of cacheNames) {
      await caches.delete(cacheName);
      deletedCount++;
    }
    
    console.log(`Successfully cleared ${deletedCount} caches`);
    return true;
  } catch (error) {
    console.error('Error clearing all caches:', error);
    return false;
  }
};

/**
 * Monitor browser storage usage
 * @returns Storage estimate object or null if not supported
 */
export const getStorageEstimate = async (): Promise<StorageEstimate | null> => {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usagePercent = Math.round((estimate.usage || 0) / (estimate.quota || 1) * 100);
      
      console.log(`Storage usage: ${usagePercent}% (${formatBytes(estimate.usage || 0)} of ${formatBytes(estimate.quota || 0)})`);
      return estimate;
    }
    return null;
  } catch (error) {
    console.error('Error estimating storage:', error);
    return null;
  }
};

/**
 * Format bytes to human-readable string
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check if browser storage is nearly full (>80% usage)
 * @returns Boolean indicating if storage is nearly full
 */
export const isStorageNearlyFull = async (): Promise<boolean> => {
  const estimate = await getStorageEstimate();
  if (!estimate || !estimate.quota) return false;
  
  const usagePercent = (estimate.usage || 0) / estimate.quota * 100;
  return usagePercent > 80;
};

/**
 * Run automatic cache maintenance if needed
 * Called on app startup or when storage issues are detected
 */
export const runCacheMaintenance = async (): Promise<void> => {
  try {
    const isNearlyFull = await isStorageNearlyFull();
    
    if (isNearlyFull) {
      console.log('Storage usage is high, performing aggressive cache cleanup');
      await clearAllCaches();
    } else {
      // Just do regular maintenance
      await cleanupCaches();
    }
  } catch (error) {
    console.error('Error during cache maintenance:', error);
  }
}; 