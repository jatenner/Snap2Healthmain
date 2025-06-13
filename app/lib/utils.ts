/**
 * Safe array helper functions that handle null/undefined arrays
 */

/**
 * Safely iterate over an array with forEach, handling null/undefined arrays
 * @param arr The array to iterate over (or null/undefined)
 * @param callback The callback function to execute for each element
 */
export function safeForEach<T>(arr: T[] | null | undefined, callback: (item: T, index: number, array: T[]) => void): void {
  if (!arr || !Array.isArray(arr)) return;
  arr.forEach(callback);
}

/**
 * Safely map over an array, handling null/undefined arrays
 * @param arr The array to map over (or null/undefined)
 * @param callback The mapping function to apply to each element
 * @returns A new array with the results, or an empty array if input is null/undefined
 */
export function safeMap<T, U>(arr: T[] | null | undefined, callback: (item: T, index: number, array: T[]) => U): U[] {
  if (!arr || !Array.isArray(arr)) return [];
  return arr.map(callback);
}

/**
 * Safely filter an array, handling null/undefined arrays
 * @param arr The array to filter (or null/undefined)
 * @param callback The predicate function to test each element
 * @returns A new filtered array, or an empty array if input is null/undefined
 */
export function safeFilter<T>(arr: T[] | null | undefined, callback: (item: T, index: number, array: T[]) => boolean): T[] {
  if (!arr || !Array.isArray(arr)) return [];
  return arr.filter(callback);
}

/**
 * Check if an array is empty or null/undefined
 * @param arr The array to check
 * @returns True if the array is null, undefined, or empty
 */
export function isEmptyArray<T>(arr: T[] | null | undefined): boolean {
  return !arr || !Array.isArray(arr) || arr.length === 0;
}

/**
 * Safely get an array or return an empty array if null/undefined
 * @param arr The array or null/undefined
 * @returns The original array or an empty array
 */
export function getArrayOrEmpty<T>(arr: T[] | null | undefined): T[] {
  return Array.isArray(arr) ? arr : [];
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names with Tailwind CSS classes using clsx and tailwind-merge
 * This helps to avoid conflicts when combining Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with commas as thousands separators
 */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}

/**
 * Truncate a string to a maximum length and add ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (!str) return '';
  return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
}

/**
 * Calculate percentage with safety checks
 */
export function calculatePercentage(value: number, total: number): number {
  if (!total || isNaN(total) || !value || isNaN(value)) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Parse a number from a string or return a default value
 */
export function parseNumberOrDefault(value: any, defaultValue: number | null = 0): number | null {
  if (value === undefined || value === null || value === '') return defaultValue;
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get an appropriate color for a percentage value
 */
export function getColorForPercentage(percentage: number): string {
  if (percentage >= 80) return 'text-green-500';
  if (percentage >= 50) return 'text-blue-500';
  if (percentage >= 30) return 'text-yellow-500';
  return 'text-red-500';
}

/**
 * Safe JSON parsing with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return fallback;
  }
}

/**
 * Timezone and date utilities for EST/EDT handling
 */

// Eastern timezone helper functions
export function getEasternTime(): Date {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
}

export function formatDateEST(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Invalid date';
  }
}

export function formatTimeEST(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    console.error('Error formatting time:', e);
    return 'Invalid time';
  }
}

export function formatDateTimeEST(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    console.error('Error formatting datetime:', e);
    return 'Invalid datetime';
  }
}

export function getRelativeDateEST(date: string | Date): string {
  try {
    let inputDateEST: string;
    
    // If date is already in YYYY-MM-DD format, use it directly
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      inputDateEST = date;
    } else {
      // Convert to EST date string for comparison
      const inputDate = typeof date === 'string' ? new Date(date) : date;
      inputDateEST = inputDate.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    }
    
    const now = getEasternTime();
    
    // Get dates in EST for comparison
    const todayEST = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); // YYYY-MM-DD format
    const yesterdayEST = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      .toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    
    if (inputDateEST === todayEST) return 'Today';
    if (inputDateEST === yesterdayEST) return 'Yesterday';
    
    // For formatting the fallback, create a proper date object
    const fallbackDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) 
      ? new Date(date + 'T12:00:00') // Add noon time to avoid timezone issues
      : (typeof date === 'string' ? new Date(date) : date);
    
    return formatDateEST(fallbackDate);
  } catch (e) {
    console.error('Error getting relative date:', e);
    const fallbackDate = typeof date === 'string' ? new Date(date) : date;
    return formatDateEST(fallbackDate);
  }
}

// For database operations - let DB handle timezone instead of JS
export function createDatabaseTimestamp(): undefined {
  // Return undefined to let database handle the timestamp with NOW()
  // This avoids timezone conversion issues
  return undefined;
}

// Convert UTC timestamp from DB to EST for display
export function displayTimestamp(timestamp: string): string {
  return formatDateTimeEST(timestamp);
}

// Get current EST timestamp as ISO string (for debugging/logging)
export function getCurrentESTISOString(): string {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"})).toISOString();
}

export function formatDate(date: Date | string): string {
  // Use EST formatting by default
  return formatDateEST(date);
}

export function formatTime(date: Date | string): string {
  // Use EST formatting by default
  return formatTimeEST(date);
}

// Generate slug from string
export function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Safely turn a value into a number
export function toNumber(value: any, fallback: number = 0): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
}

// Delay execution
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
} 