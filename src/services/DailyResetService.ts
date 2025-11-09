/**
 * Daily Reset Service
 *
 * Client-side service to check for daily resets and trigger appropriate actions.
 * Works in coordination with server-side Edge Function.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @created 2025-11-08
 */

/**
 * Get today's date string in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check if daily reset has occurred since last login
 * @param lastLoginDate - Last login date string (YYYY-MM-DD)
 * @returns true if a new day has started
 */
export function shouldPerformDailyReset(lastLoginDate: string | null): boolean {
  if (!lastLoginDate) return true; // First login ever

  const today = getTodayDateString();
  return today !== lastLoginDate;
}

/**
 * Check if daily free gacha summon is available
 * @param lastFreeSummonDate - Last free summon date string (YYYY-MM-DD)
 * @returns true if free summon is available today
 */
export function isFreeSummonAvailable(lastFreeSummonDate: string): boolean {
  const today = getTodayDateString();
  return today !== lastFreeSummonDate;
}

/**
 * Get daily worldmap seed based on current date
 * @returns Daily seed string
 */
export function getDailyWorldMapSeed(): string {
  const today = getTodayDateString();
  return `daily-${today}`;
}

/**
 * Calculate time until next daily reset (midnight UTC)
 * @returns Milliseconds until next reset
 */
export function getTimeUntilReset(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCHours(24, 0, 0, 0); // Next midnight UTC

  return tomorrow.getTime() - now.getTime();
}

/**
 * Format time until reset in human-readable format
 * @returns Formatted string (e.g., "5h 23m")
 */
export function getTimeUntilResetFormatted(): string {
  const ms = getTimeUntilReset();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Daily Reset Service Namespace
 */
export const DailyResetService = {
  getTodayDateString,
  shouldPerformDailyReset,
  isFreeSummonAvailable,
  getDailyWorldMapSeed,
  getTimeUntilReset,
  getTimeUntilResetFormatted
};
