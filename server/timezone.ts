/**
 * Timezone utilities for converting dates to user's local timezone
 */

import { format, subDays } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

/**
 * Get the current date in the user's timezone as a YYYY-MM-DD string
 */
export function getTodayInTimezone(timezone: string): string {
  const now = new Date();
  return formatInTimeZone(now, timezone, "yyyy-MM-dd");
}

/**
 * Get yesterday's date in the user's timezone as a YYYY-MM-DD string
 */
export function getYesterdayInTimezone(timezone: string): string {
  // Get "now" in the user's timezone, then subtract a day
  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);
  const yesterday = subDays(zonedNow, 1);
  return format(yesterday, "yyyy-MM-dd");
}

/**
 * Get a date N days ago in the user's timezone as a YYYY-MM-DD string
 */
export function getDaysAgoInTimezone(timezone: string, days: number): string {
  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);
  const pastDate = subDays(zonedNow, days);
  return format(pastDate, "yyyy-MM-dd");
}

/**
 * Get the current hour (0-23) in the user's timezone
 */
export function getCurrentHourInTimezone(timezone: string): number {
  const now = new Date();
  const hourStr = formatInTimeZone(now, timezone, "H");
  return parseInt(hourStr, 10);
}

/**
 * Format a date in the user's timezone
 */
export function formatDateInTimezone(date: Date, timezone: string, formatStr: string): string {
  return formatInTimeZone(date, timezone, formatStr);
}

/**
 * Get the default timezone (fallback when user hasn't set one)
 */
export const DEFAULT_TIMEZONE = "America/New_York";

/**
 * Validate that a timezone string is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a safe timezone - returns the provided timezone if valid, otherwise returns default
 */
export function getSafeTimezone(timezone: string | null | undefined): string {
  if (timezone && isValidTimezone(timezone)) {
    return timezone;
  }
  return DEFAULT_TIMEZONE;
}
