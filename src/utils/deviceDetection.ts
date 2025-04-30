/**
 * Utility functions for device detection
 */

/**
 * Detects if the current device is a mobile device
 */
export const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Detects if the current device is an iOS device
 */
export const isIOSDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream;
};

/**
 * Detects if the device has a camera
 * Note: This is an asynchronous check as it requires browser APIs
 */
export const hasCamera = async (): Promise<boolean> => {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return false;
  }
  
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some(device => device.kind === 'videoinput');
  } catch (err) {
    console.error('Error checking for camera:', err);
    return false;
  }
};

/**
 * Checks if the browser supports the 'capture' attribute for file inputs
 */
export const supportsCaptureAttribute = (): boolean => {
  if (typeof document === 'undefined') return false;
  
  const input = document.createElement('input');
  input.type = 'file';
  
  return 'capture' in input;
}; 