import { format, isToday, isYesterday } from 'date-fns';

/**
 * Formats a meal timestamp in a user-friendly way
 * @param timestamp ISO string timestamp
 * @returns Formatted time string (Today at 3:45 PM, Yesterday at 9:15 AM, or Jun 12 at 8:30 PM)
 */
export function formatMealTime(timestamp: string): string {
  try {
    if (!timestamp) return 'No time';
    
    // Create date object and validate
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid timestamp for formatMealTime: ${timestamp}`);
      return 'Invalid time';
    }
    
    const timeFormatted = format(date, 'h:mm a');
    
    if (isToday(date)) {
      return `Today at ${timeFormatted}`;
    } else if (isYesterday(date)) {
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
export function formatMealDate(timestamp: string): string {
  try {
    if (!timestamp) return 'No date';
    
    // Create date object and validate
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid timestamp for formatMealDate: ${timestamp}`);
      return 'Invalid date';
    }
    
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d, yyyy');
    }
  } catch (error) {
    console.error('Error in formatMealDate:', error, 'Timestamp:', timestamp);
    return 'Date error';
  }
} 