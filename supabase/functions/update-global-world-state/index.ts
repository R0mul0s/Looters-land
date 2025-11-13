/**
 * Supabase Edge Function: Update Global World State
 *
 * Periodically updates the global world state (weather and time of day)
 * This function should be triggered by a cron job every 15-30 minutes
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Weather types in order
const weatherTypes = ['clear', 'rain', 'storm', 'fog', 'snow'];

// Time of day in order
const timeOfDayTypes = ['dawn', 'day', 'dusk', 'night'];

interface GlobalWorldState {
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

/**
 * Get next weather type
 */
function getNextWeather(current: string): string {
  // Random weather selection with weights
  const weights = {
    'clear': 0.4,   // 40% chance
    'rain': 0.25,   // 25% chance
    'storm': 0.1,   // 10% chance
    'fog': 0.15,    // 15% chance
    'snow': 0.1     // 10% chance
  };

  const random = Math.random();
  let cumulative = 0;

  for (const [weather, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (random <= cumulative && weather !== current) {
      return weather;
    }
  }

  // Fallback: cycle to next weather type
  const currentIndex = weatherTypes.indexOf(current);
  const nextIndex = (currentIndex + 1) % weatherTypes.length;
  return weatherTypes[nextIndex];
}

/**
 * Get next time of day
 */
function getNextTimeOfDay(current: string): string {
  const currentIndex = timeOfDayTypes.indexOf(current);
  const nextIndex = (currentIndex + 1) % timeOfDayTypes.length;
  return timeOfDayTypes[nextIndex];
}

/**
 * Check if transition should occur
 */
function shouldTransition(transitionStart: string, duration: number): boolean {
  const startTime = new Date(transitionStart);
  const now = new Date();
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

  return now >= endTime;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  let logEntry = {
    function_name: 'update-global-world-state',
    request_method: req.method,
    success: false,
    error_message: null as string | null,
    metadata: {} as Record<string, unknown>,
    execution_time_ms: 0
  };

  try {
    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current global world state
    const { data: currentState, error: fetchError } = await supabase
      .from('global_world_state')
      .select('*')
      .eq('id', 1)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch global world state: ${fetchError.message}`);
    }

    const state = currentState as GlobalWorldState;
    let weatherChanged = false;
    let timeChanged = false;

    // Check if weather should transition
    if (shouldTransition(state.weather_transition_start, state.weather_duration)) {
      console.log(`🌦️ Weather transitioning from ${state.weather_current} to ${state.weather_next}`);

      const newCurrent = state.weather_next;
      const newNext = getNextWeather(newCurrent);
      const newDuration = Math.floor(Math.random() * 30) + 30; // 30-60 minutes

      state.weather_current = newCurrent;
      state.weather_next = newNext;
      state.weather_transition_start = new Date().toISOString();
      state.weather_duration = newDuration;

      weatherChanged = true;
    }

    // Check if time of day should transition
    if (shouldTransition(state.time_transition_start, state.time_duration)) {
      console.log(`🕐 Time transitioning from ${state.time_current} to ${state.time_next}`);

      const newCurrent = state.time_next;
      const newNext = getNextTimeOfDay(newCurrent);
      const newDuration = Math.floor(Math.random() * 10) + 15; // 15-25 minutes

      state.time_current = newCurrent;
      state.time_next = newNext;
      state.time_transition_start = new Date().toISOString();
      state.time_duration = newDuration;

      timeChanged = true;
    }

    // Update database if any changes occurred
    if (weatherChanged || timeChanged) {
      const { error: updateError } = await supabase
        .from('global_world_state')
        .update({
          weather_current: state.weather_current,
          weather_next: state.weather_next,
          weather_transition_start: state.weather_transition_start,
          weather_duration: state.weather_duration,
          time_current: state.time_current,
          time_next: state.time_next,
          time_transition_start: state.time_transition_start,
          time_duration: state.time_duration
        })
        .eq('id', 1);

      if (updateError) {
        throw new Error(`Failed to update global world state: ${updateError.message}`);
      }

      console.log('✅ Global world state updated successfully');

      // Log success to database
      logEntry.success = true;
      logEntry.execution_time_ms = Date.now() - startTime;
      logEntry.metadata = {
        weatherChanged,
        timeChanged,
        weather_current: state.weather_current,
        weather_next: state.weather_next,
        time_current: state.time_current,
        time_next: state.time_next
      };

      const responseData = {
        success: true,
        message: 'Global world state updated',
        weatherChanged,
        timeChanged,
        state: {
          weather: `${state.weather_current} → ${state.weather_next} (${state.weather_duration}min)`,
          time: `${state.time_current} → ${state.time_next} (${state.time_duration}min)`
        }
      };

      // Write log to database
      await supabase.from('edge_function_logs').insert({
        ...logEntry,
        response_status: 200,
        response_body: responseData
      });

      return new Response(
        JSON.stringify(responseData),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } else {
      console.log('⏭️ No transitions needed yet');

      // Log no changes to database
      logEntry.success = true;
      logEntry.execution_time_ms = Date.now() - startTime;
      logEntry.metadata = {
        weatherChanged: false,
        timeChanged: false,
        message: 'No transitions needed',
        nextWeatherChange: new Date(
          new Date(state.weather_transition_start).getTime() +
          state.weather_duration * 60 * 1000
        ).toISOString(),
        nextTimeChange: new Date(
          new Date(state.time_transition_start).getTime() +
          state.time_duration * 60 * 1000
        ).toISOString()
      };

      const responseData = {
        success: true,
        message: 'No transitions needed',
        weatherChanged: false,
        timeChanged: false,
        nextWeatherChange: new Date(
          new Date(state.weather_transition_start).getTime() +
          state.weather_duration * 60 * 1000
        ).toISOString(),
        nextTimeChange: new Date(
          new Date(state.time_transition_start).getTime() +
          state.time_duration * 60 * 1000
        ).toISOString()
      };

      // Write log to database
      await supabase.from('edge_function_logs').insert({
        ...logEntry,
        response_status: 200,
        response_body: responseData
      });

      return new Response(
        JSON.stringify(responseData),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
  } catch (error) {
    console.error('❌ Error updating global world state:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
