<<<<<<< HEAD
import { format, isToday, isYesterday, parseISO } from 'date-fns';

/**
 * Safely creates a Date object from various input formats
 * @param timestamp ISO string timestamp or Date object
 * @returns Valid Date object or null if invalid
 */
function safelyCreateDate(timestamp: string | Date | null | undefined): Date | null {
  if (!timestamp) return null;
  
  try {
    // If it's already a Date object
    if (timestamp instanceof Date) {
      return isNaN(timestamp.getTime()) ? null : timestamp;
    }
    
    // Try parsing as ISO string first (most reliable)
    try {
      const date = parseISO(timestamp);
      if (!isNaN(date.getTime())) return date;
    } catch (e) {
      // Parsing as ISO failed, continue to other methods
    }
    
    // Try creating a normal Date object
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) return date;
    
    // Try parsing numeric timestamp (milliseconds since epoch)
    if (!isNaN(Number(timestamp))) {
      const date = new Date(Number(timestamp));
      if (!isNaN(date.getTime())) return date;
    }
    
    return null;
  } catch (error) {
    console.error('Error creating date from:', timestamp, error);
    return null;
  }
}

/**
 * Formats a meal timestamp in a user-friendly way
 * @param timestamp ISO string timestamp
 * @returns Formatted time string (Today at 3:45 PM, Yesterday at 9:15 AM, or Jun 12 at 8:30 PM)
 */
export function formatMealTime(timestamp: string | Date | null | undefined): string {
  try {
    if (!timestamp) return 'No time';
    
    // Create date object and validate
    const date = safelyCreateDate(timestamp);
    if (!date) {
      console.warn(`Invalid timestamp for formatMealTime: ${timestamp}`);
      return 'Invalid time';
    }
    
    const timeFormatted = format(date, 'h:mm a');
    
    // Normalize dates for comparison to avoid timezone issues
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    
    const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (inputDate.getTime() === todayDate.getTime()) {
      return `Today at ${timeFormatted}`;
    } else if (inputDate.getTime() === yesterdayDate.getTime()) {
      return `Yesterday at ${timeFormatted}`;
    } else {
      return `${format(date, 'MMM d')} at ${timeFormatted}`;
    }
  } catch (error) {
    console.error('Error in formatMealTime:', error, 'Timestamp:', timestamp);
    return 'Time error';
  }
}

/**
 * Formats a meal date for grouping in the meal history
 * @param timestamp ISO string timestamp
 * @returns Formatted date string (Today, Yesterday, or Jun 12, 2023)
 */
export function formatMealDate(timestamp: string | Date | null | undefined): string {
  try {
    if (!timestamp) return 'No date';
    
    // Create date object and validate
    const date = safelyCreateDate(timestamp);
    if (!date) {
      console.warn(`Invalid timestamp for formatMealDate: ${timestamp}`);
      return 'Invalid date';
    }
    
    // Normalize dates for proper comparison
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    
    const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (inputDate.getTime() === todayDate.getTime()) {
      return 'Today';
    } else if (inputDate.getTime() === yesterdayDate.getTime()) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d, yyyy');
    }
  } catch (error) {
    console.error('Error in formatMealDate:', error, 'Timestamp:', timestamp);
    return 'Date error';
  }
} 
=======
 
>>>>>>> b4a8cf4 (Fresh clean commit - no node_modules)
