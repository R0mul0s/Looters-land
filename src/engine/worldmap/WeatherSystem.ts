import type { WeatherState, WeatherType } from '../../types/worldmap.types';
import { WORLDMAP_CONFIG } from '../../config/BALANCE_CONFIG';

export class WeatherSystem {
  /**
   * Initialize weather state with random starting weather
   */
  static initialize(): WeatherState {
    const currentWeather = this.getRandomWeather();
    const nextWeather = this.getRandomWeather(currentWeather);
    const changeTime = this.calculateNextChangeTime();

    return {
      current: currentWeather,
      changesAt: changeTime,
      next: nextWeather,
      spawnRateModifier: this.getSpawnRateModifier(currentWeather),
    };
  }

  /**
   * Update weather state if it's time for a change
   */
  static update(currentState: WeatherState): WeatherState {
    const now = new Date();
    // Handle both Date objects and date strings (from database)
    const changesAt = typeof currentState.changesAt === 'string' ? new Date(currentState.changesAt) : currentState.changesAt;

    // Check if it's time to change weather
    if (now >= changesAt) {
      const newCurrent = currentState.next;
      const newNext = this.getRandomWeather(newCurrent);
      const newChangeTime = this.calculateNextChangeTime();

      return {
        current: newCurrent,
        changesAt: newChangeTime,
        next: newNext,
        spawnRateModifier: this.getSpawnRateModifier(newCurrent),
      };
    }

    return currentState;
  }

  /**
   * Get spawn rate modifier for given weather type
   */
  static getSpawnRateModifier(weather: WeatherType): number {
    const modifiers: Record<WeatherType, number> = {
      clear: 1.0,    // Normal spawn rate
      rain: 0.8,     // Slightly reduced spawns
      storm: 0.6,    // Significantly reduced spawns
      fog: 1.2,      // Increased spawns (monsters hide in fog)
      snow: 0.7,     // Reduced spawns
    };

    return modifiers[weather];
  }

  /**
   * Get a random weather type, avoiding repeats if possible
   */
  private static getRandomWeather(avoid?: WeatherType): WeatherType {
    const allWeathers: WeatherType[] = ['clear', 'rain', 'storm', 'fog', 'snow'];

    // Weight probabilities (clear is most common)
    const weights: Record<WeatherType, number> = {
      clear: 40,  // 40% chance
      rain: 20,   // 20% chance
      fog: 20,    // 20% chance
      storm: 10,  // 10% chance
      snow: 10,   // 10% chance
    };

    // If avoiding a weather, reduce its weight to 0
    if (avoid) {
      weights[avoid] = 0;
    }

    // Calculate total weight
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    // Select based on weighted random
    for (const weather of allWeathers) {
      random -= weights[weather];
      if (random <= 0) {
        return weather;
      }
    }

    return 'clear'; // Fallback
  }

  /**
   * Calculate the next weather change time
   */
  private static calculateNextChangeTime(): Date {
    const now = new Date();
    const hoursUntilChange = WORLDMAP_CONFIG.WEATHER_CHANGE_INTERVAL;
    return new Date(now.getTime() + hoursUntilChange * 60 * 60 * 1000);
  }

  /**
   * Get weather display info for UI
   */
  static getWeatherDisplay(weather: WeatherType): { icon: string; label: string; color: string } {
    const displays: Record<WeatherType, { icon: string; label: string; color: string }> = {
      clear: { icon: '☀️', label: 'Clear', color: '#FFD700' },
      rain: { icon: '🌧️', label: 'Rain', color: '#4A90E2' },
      storm: { icon: '⛈️', label: 'Storm', color: '#5C5C8A' },
      fog: { icon: '🌫️', label: 'Fog', color: '#9E9E9E' },
      snow: { icon: '❄️', label: 'Snow', color: '#E0F7FA' },
    };

    return displays[weather];
  }

  /**
   * Get time remaining until next weather change
   */
  static getTimeUntilChange(state: WeatherState): string {
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
}
