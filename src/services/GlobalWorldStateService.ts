/**
 * Global World State Service
 *
 * Manages global world state (weather, time of day) shared across all players.
 * All players see the same weather and time of day at the same time.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { WeatherState, TimeState } from '../types/worldmap.types';

export interface GlobalWorldState {
  id: number;
  weather_current: string;
  weather_next: string;
  weather_transition_start: string;
  weather_duration: number;
  time_current: string;
  time_next: string;
  time_transition_start: string;
  time_duration: number;
  updated_at: string;
}

export class GlobalWorldStateService {
  /**
   * Get global world state (weather and time of day)
   */
  static async getGlobalWorldState(): Promise<{
    success: boolean;
    message: string;
    state?: GlobalWorldState;
  }> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Supabase not configured'
      };
    }

    try {
      const { data, error } = await supabase
        .from('global_world_state')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) {
        return {
          success: false,
          message: `Failed to get global world state: ${error instanceof Error ? error.message : String(error)}`
        };
      }

      return {
        success: true,
        message: 'Global world state loaded',
        state: data as GlobalWorldState
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Convert database state to WeatherState
   */
  static convertToWeatherState(state: GlobalWorldState): WeatherState {
    // Calculate when weather changes (transition_start + duration)
    const transitionStart = new Date(state.weather_transition_start);
    const changesAt = new Date(transitionStart.getTime() + state.weather_duration * 60 * 1000);

    return {
      current: state.weather_current as WeatherState['current'],
      next: state.weather_next as WeatherState['next'],
      changesAt,
      spawnRateModifier: 1.0 // Default modifier
    };
  }

  /**
   * Convert database state to TimeState
   */
  static convertToTimeState(state: GlobalWorldState): TimeState {
    // Calculate when time changes (transition_start + duration)
    const transitionStart = new Date(state.time_transition_start);
    const changesAt = new Date(transitionStart.getTime() + state.time_duration * 60 * 1000);

    return {
      current: state.time_current as TimeState['current'],
      next: state.time_next as TimeState['next'],
      changesAt,
      enemyModifier: {
        dayEnemies: state.time_current === 'day' || state.time_current === 'dawn',
        nightEnemies: state.time_current === 'night' || state.time_current === 'dusk'
      }
    };
  }

  /**
   * Subscribe to global world state changes
   * Returns unsubscribe function
   */
  static subscribeToGlobalWorldState(
    callback: (state: GlobalWorldState) => void
  ): () => void {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, cannot subscribe to global world state');
      return () => {};
    }

    const channel = supabase
      .channel('global-world-state-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'global_world_state',
          filter: 'id=eq.1'
        },
        (payload) => {
          console.log('🌍 Global world state updated:', payload.new);
          callback(payload.new as GlobalWorldState);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}
