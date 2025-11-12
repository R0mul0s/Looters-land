import type { TimeState, TimeOfDay } from '../../types/worldmap.types';
import { WORLDMAP_CONFIG } from '../../config/BALANCE_CONFIG';

export class TimeOfDaySystem {
  /**
   * Initialize time of day state starting at dawn
   */
  static initialize(): TimeState {
    const currentTime = 'dawn' as TimeOfDay;
    const nextTime = this.getNextTimeOfDay(currentTime);
    const changeTime = this.calculateNextChangeTime();

    return {
      current: currentTime,
      changesAt: changeTime,
      next: nextTime,
      enemyModifier: this.getEnemyModifier(currentTime),
    };
  }

  /**
   * Update time of day state if it's time for a change
   */
  static update(currentState: TimeState): TimeState {
    const now = new Date();
    // Handle both Date objects and date strings (from database)
    const changesAt = typeof currentState.changesAt === 'string' ? new Date(currentState.changesAt) : currentState.changesAt;

    // Check if it's time to change
    if (now >= changesAt) {
      const newCurrent = currentState.next;
      const newNext = this.getNextTimeOfDay(newCurrent);
      const newChangeTime = this.calculateNextChangeTime();

      return {
        current: newCurrent,
        changesAt: newChangeTime,
        next: newNext,
        enemyModifier: this.getEnemyModifier(newCurrent),
      };
    }

    return currentState;
  }

  /**
   * Get the next time of day in the cycle
   */
  private static getNextTimeOfDay(current: TimeOfDay): TimeOfDay {
    const cycle: TimeOfDay[] = ['dawn', 'day', 'dusk', 'night'];
    const currentIndex = cycle.indexOf(current);
    const nextIndex = (currentIndex + 1) % cycle.length;
    return cycle[nextIndex];
  }

  /**
   * Get enemy modifier for given time of day
   */
  static getEnemyModifier(time: TimeOfDay): { dayEnemies: boolean; nightEnemies: boolean } {
    const modifiers: Record<TimeOfDay, { dayEnemies: boolean; nightEnemies: boolean }> = {
      dawn: { dayEnemies: true, nightEnemies: true },   // Both types can spawn
      day: { dayEnemies: true, nightEnemies: false },   // Only day enemies
      dusk: { dayEnemies: true, nightEnemies: true },   // Both types can spawn
      night: { dayEnemies: false, nightEnemies: true }, // Only night enemies
    };

    return modifiers[time];
  }

  /**
   * Calculate the next time change
   */
  private static calculateNextChangeTime(): Date {
    const now = new Date();
    const hoursUntilChange = WORLDMAP_CONFIG.TIME_CHANGE_INTERVAL;
    return new Date(now.getTime() + hoursUntilChange * 60 * 60 * 1000);
  }

  /**
   * Get time of day display info for UI
   */
  static getTimeDisplay(time: TimeOfDay): { icon: string; label: string; color: string } {
    const displays: Record<TimeOfDay, { icon: string; label: string; color: string }> = {
      dawn: { icon: '🌅', label: 'Dawn', color: '#FF9A56' },
      day: { icon: '☀️', label: 'Day', color: '#FFE066' },
      dusk: { icon: '🌇', label: 'Dusk', color: '#FF6B9D' },
      night: { icon: '🌙', label: 'Night', color: '#4A5A8C' },
    };

    return displays[time];
  }

  /**
   * Get lighting overlay color for canvas rendering
   */
  static getLightingOverlay(time: TimeOfDay): { color: string; alpha: number } {
    const overlays: Record<TimeOfDay, { color: string; alpha: number }> = {
      dawn: { color: '#FF9A56', alpha: 0.15 },  // Warm orange tint
      day: { color: '#FFFACD', alpha: 0.05 },   // Very subtle warm yellow
      dusk: { color: '#FF6B9D', alpha: 0.20 },  // Pink/purple tint
      night: { color: '#1A1A3E', alpha: 0.35 }, // Dark blue overlay
    };

    return overlays[time];
  }

  /**
   * Get time remaining until next time change
   */
  static getTimeUntilChange(state: TimeState): string {
    const now = new Date();
    // Handle both Date objects and date strings (from database)
    const changesAt = typeof state.changesAt === 'string' ? new Date(state.changesAt) : state.changesAt;
    const diff = changesAt.getTime() - now.getTime();

    if (diff <= 0) return 'Soon';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Check if it's currently dark (affects visibility)
   */
  static isDark(time: TimeOfDay): boolean {
    return time === 'night' || time === 'dusk';
  }
}
