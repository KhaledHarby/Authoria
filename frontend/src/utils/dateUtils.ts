/**
 * Utility functions for date and time handling
 */

/**
 * Converts a UTC date string to local time
 * @param utcDateString - The UTC date string from the backend
 * @returns Formatted local date string
 */
export function utcToLocalDate(utcDateString: string | null | undefined): string {
  if (!utcDateString) return '-';
  
  try {
    const utcDate = new Date(utcDateString);
    return utcDate.toLocaleDateString();
  } catch (error) {
    console.error('Error converting UTC date:', error);
    return utcDateString;
  }
}

/**
 * Converts a UTC date string to local time with time
 * @param utcDateString - The UTC date string from the backend
 * @returns Formatted local date and time string
 */
export function utcToLocalDateTime(utcDateString: string | null | undefined): string {
  if (!utcDateString) return '-';
  
  try {
    const utcDate = new Date(utcDateString);
    return utcDate.toLocaleString();
  } catch (error) {
    console.error('Error converting UTC datetime:', error);
    return utcDateString;
  }
}

/**
 * Converts a UTC date string to local time only
 * @param utcDateString - The UTC date string from the backend
 * @returns Formatted local time string
 */
export function utcToLocalTime(utcDateString: string | null | undefined): string {
  if (!utcDateString) return '-';
  
  try {
    const utcDate = new Date(utcDateString);
    return utcDate.toLocaleTimeString();
  } catch (error) {
    console.error('Error converting UTC time:', error);
    return utcDateString;
  }
}

/**
 * Converts a UTC date string to relative time (e.g., "2 hours ago")
 * @param utcDateString - The UTC date string from the backend
 * @returns Relative time string
 */
export function utcToRelativeTime(utcDateString: string | null | undefined): string {
  if (!utcDateString) return '-';
  
  try {
    const utcDate = new Date(utcDateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - utcDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  } catch (error) {
    console.error('Error converting UTC to relative time:', error);
    return utcDateString;
  }
}

/**
 * Formats a date for display with custom options
 * @param utcDateString - The UTC date string from the backend
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string
 */
export function formatUtcDate(
  utcDateString: string | null | undefined, 
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!utcDateString) return '-';
  
  try {
    const utcDate = new Date(utcDateString);
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    };
    return utcDate.toLocaleString(undefined, defaultOptions);
  } catch (error) {
    console.error('Error formatting UTC date:', error);
    return utcDateString;
  }
}

/**
 * Gets the user's timezone
 * @returns The user's timezone string
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Checks if a date is today
 * @param utcDateString - The UTC date string from the backend
 * @returns True if the date is today
 */
export function isToday(utcDateString: string | null | undefined): boolean {
  if (!utcDateString) return false;
  
  try {
    const utcDate = new Date(utcDateString);
    const today = new Date();
    return utcDate.toDateString() === today.toDateString();
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a date is yesterday
 * @param utcDateString - The UTC date string from the backend
 * @returns True if the date is yesterday
 */
export function isYesterday(utcDateString: string | null | undefined): boolean {
  if (!utcDateString) return false;
  
  try {
    const utcDate = new Date(utcDateString);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return utcDate.toDateString() === yesterday.toDateString();
  } catch (error) {
    return false;
  }
}
