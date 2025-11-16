-- Migration: Add SQL function to update global world state
-- Created: 2025-11-16
-- Description: SQL function that does the same as Edge Function but runs directly in database
--              This avoids authentication issues with Edge Functions

-- Weather types (skip if already exists)
DO $$ BEGIN
  CREATE TYPE weather_type AS ENUM ('clear', 'rain', 'storm', 'fog', 'snow');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE time_of_day_type AS ENUM ('dawn', 'day', 'dusk', 'night');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Function to get next weather (weighted random)
CREATE OR REPLACE FUNCTION get_next_weather(current_weather TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  random_val FLOAT;
  next_weather TEXT;
BEGIN
  random_val := random();

  -- Weighted random selection
  IF random_val < 0.4 AND current_weather != 'clear' THEN
    next_weather := 'clear';
  ELSIF random_val < 0.65 AND current_weather != 'rain' THEN
    next_weather := 'rain';
  ELSIF random_val < 0.75 AND current_weather != 'storm' THEN
    next_weather := 'storm';
  ELSIF random_val < 0.90 AND current_weather != 'fog' THEN
    next_weather := 'fog';
  ELSE
    next_weather := 'snow';
  END IF;

  -- Make sure we don't return the same weather
  IF next_weather = current_weather THEN
    next_weather := CASE current_weather
      WHEN 'clear' THEN 'rain'
      WHEN 'rain' THEN 'fog'
      WHEN 'storm' THEN 'clear'
      WHEN 'fog' THEN 'clear'
      WHEN 'snow' THEN 'clear'
      ELSE 'clear'
    END;
  END IF;

  RETURN next_weather;
END;
$$;

-- Function to get next time of day (cycles through)
CREATE OR REPLACE FUNCTION get_next_time_of_day(current_time_of_day TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN CASE current_time_of_day
    WHEN 'dawn' THEN 'day'
    WHEN 'day' THEN 'dusk'
    WHEN 'dusk' THEN 'night'
    WHEN 'night' THEN 'dawn'
    ELSE 'dawn'
  END;
END;
$$;

-- Main function to update global world state
CREATE OR REPLACE FUNCTION update_global_world_state()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_state RECORD;
  weather_should_change BOOLEAN;
  time_should_change BOOLEAN;
  new_weather TEXT;
  new_time TEXT;
  new_duration INT;
  weather_changed BOOLEAN := false;
  time_changed BOOLEAN := false;
  result jsonb;
BEGIN
  -- Get current state
  SELECT * INTO current_state
  FROM global_world_state
  WHERE id = 1;

  -- Check if weather should transition
  weather_should_change := NOW() >= (
    current_state.weather_transition_start +
    (current_state.weather_duration || ' minutes')::interval
  );

  -- Check if time should transition
  time_should_change := NOW() >= (
    current_state.time_transition_start +
    (current_state.time_duration || ' minutes')::interval
  );

  -- Update weather if needed
  IF weather_should_change THEN
    new_weather := get_next_weather(current_state.weather_next);
    new_duration := floor(random() * 7 + 8)::int; -- 8-15 minutes

    UPDATE global_world_state
    SET
      weather_current = current_state.weather_next,
      weather_next = new_weather,
      weather_transition_start = NOW(),
      weather_duration = new_duration,
      updated_at = NOW()
    WHERE id = 1;

    weather_changed := true;
  END IF;

  -- Update time if needed
  IF time_should_change THEN
    new_time := get_next_time_of_day(current_state.time_next);
    new_duration := floor(random() * 10 + 15)::int; -- 15-25 minutes

    UPDATE global_world_state
    SET
      time_current = current_state.time_next,
      time_next = new_time,
      time_transition_start = NOW(),
      time_duration = new_duration,
      updated_at = NOW()
    WHERE id = 1;

    time_changed := true;
  END IF;

  -- Build result
  result := jsonb_build_object(
    'success', true,
    'weather_changed', weather_changed,
    'time_changed', time_changed,
    'timestamp', NOW()
  );

  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_global_world_state() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_next_weather(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_next_time_of_day(TEXT) TO authenticated, anon, service_role;
