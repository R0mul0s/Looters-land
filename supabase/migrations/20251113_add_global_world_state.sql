-- Migration: Add global world state table for weather and time
-- Created: 2025-11-13
-- Description: Creates a table to store global world state (weather, time of day)
--              that is shared across all players

-- Create global_world_state table
CREATE TABLE IF NOT EXISTS global_world_state (
  id INTEGER PRIMARY KEY DEFAULT 1, -- Single row table (only id=1)

  -- Weather state
  weather_current TEXT NOT NULL DEFAULT 'clear',
  weather_next TEXT NOT NULL DEFAULT 'clear',
  weather_transition_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  weather_duration INTEGER NOT NULL DEFAULT 30, -- minutes

  -- Time of day state
  time_current TEXT NOT NULL DEFAULT 'day',
  time_next TEXT NOT NULL DEFAULT 'night',
  time_transition_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_duration INTEGER NOT NULL DEFAULT 15, -- minutes

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraint to ensure only one row exists
  CONSTRAINT single_row_check CHECK (id = 1)
);

-- Insert initial global world state
INSERT INTO global_world_state (
  id,
  weather_current,
  weather_next,
  weather_transition_start,
  weather_duration,
  time_current,
  time_next,
  time_transition_start,
  time_duration
) VALUES (
  1,
  'clear',
  'rain',
  NOW(),
  30,
  'day',
  'dusk',
  NOW(),
  15
) ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE global_world_state ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read
CREATE POLICY "Allow all users to read global world state"
  ON global_world_state
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow service role to update (for server-side updates)
CREATE POLICY "Allow service role to update global world state"
  ON global_world_state
  FOR UPDATE
  TO service_role
  USING (true);

-- Create function to update global world state timestamp on update
CREATE OR REPLACE FUNCTION update_global_world_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update timestamp
CREATE TRIGGER update_global_world_state_timestamp_trigger
  BEFORE UPDATE ON global_world_state
  FOR EACH ROW
  EXECUTE FUNCTION update_global_world_state_timestamp();

-- Create index for faster reads (though single row table doesn't need it)
CREATE INDEX IF NOT EXISTS idx_global_world_state_id ON global_world_state(id);
