/**
 * Use Global World State Hook
 *
 * React hook to subscribe to global world state (weather, time of day)
 * shared across all players in real-time.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import { useState, useEffect } from 'react';
import { GlobalWorldStateService } from '../services/GlobalWorldStateService';
import type { GlobalWorldState } from '../services/GlobalWorldStateService';
import type { WeatherState, TimeState } from '../types/worldmap.types';

export interface GlobalWorldStateHook {
  weather: WeatherState | null;
  timeOfDay: TimeState | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to get and subscribe to global world state
 * All players see the same weather and time of day
 */
export function useGlobalWorldState(): GlobalWorldStateHook {
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<TimeState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch initial global world state
    const fetchGlobalState = async () => {
      setLoading(true);
      setError(null);

      const result = await GlobalWorldStateService.getGlobalWorldState();

      if (result.success && result.state) {
        setWeather(GlobalWorldStateService.convertToWeatherState(result.state));
        setTimeOfDay(GlobalWorldStateService.convertToTimeState(result.state));
      } else {
        console.error('❌ Failed to load global world state:', result.message);
        setError(result.message);
      }

      setLoading(false);
    };

    fetchGlobalState();

    // Subscribe to real-time updates
    const unsubscribe = GlobalWorldStateService.subscribeToGlobalWorldState((state: GlobalWorldState) => {
      console.log('🌍 Global world state updated in real-time:', state);
      setWeather(GlobalWorldStateService.convertToWeatherState(state));
      setTimeOfDay(GlobalWorldStateService.convertToTimeState(state));
    });

    // Poll for updates every 30 seconds as fallback (in case Realtime is slow)
    const pollInterval = setInterval(async () => {
      console.log('🔄 Polling for global world state updates...');
      const result = await GlobalWorldStateService.getGlobalWorldState();

      if (result.success && result.state) {
        console.log('🔄 Poll result:', {
          weather: result.state.weather_current,
          time: result.state.time_current,
          updated_at: result.state.updated_at
        });

        const newWeather = GlobalWorldStateService.convertToWeatherState(result.state);
        const newTime = GlobalWorldStateService.convertToTimeState(result.state);

        // Always update to get latest changesAt and next values
        setWeather(prev => {
          if (!prev || prev.current !== newWeather.current) {
            console.log('🔄 Weather state changed via polling:', newWeather.current);
          }
          // Always return new object to ensure React detects the change
          return newWeather;
        });

        setTimeOfDay(prev => {
          if (!prev || prev.current !== newTime.current) {
            console.log('🔄 Time state changed via polling:', newTime.current);
          }
          // Always return new object to ensure React detects the change
          return newTime;
        });
      } else {
        console.error('🔄 Poll failed:', result.message);
      }
    }, 30000); // Poll every 30 seconds

    // Cleanup subscription and polling on unmount
    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  return {
    weather,
    timeOfDay,
    loading,
    error
  };
}
