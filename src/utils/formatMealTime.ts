import { format, isToday, isYesterday } from 'date-fns';

/**
 * Formats a meal timestamp in a user-friendly way
 * @param timestamp ISO string timestamp
 * @returns Formatted time string (Today at 3:45 PM, Yesterday at 9:15 AM, or Jun 12 at 8:30 PM)
 */
export function formatMealTime(timestamp: string): string {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const timeFormatted = format(date, 'h:mm a');
  
  if (isToday(date)) {
    return `Today at ${timeFormatted}`;
  } else if (isYesterday(date)) {
    return `Yesterday at ${timeFormatted}`;
  } else {
    return `${format(date, 'MMM d')} at ${timeFormatted}`;
  }
}

/**
 * Formats a meal date for grouping in the meal history
 * @param timestamp ISO string timestamp
 * @returns Formatted date string (Today, Yesterday, or Jun 12, 2023)
 */
export function formatMealDate(timestamp: string): string {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  
  if (isToday(date)) {
    return 'Today';
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return format(date, 'MMM d, yyyy');
  }
} 