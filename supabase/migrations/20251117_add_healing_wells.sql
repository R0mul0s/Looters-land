-- Add healing wells system to player_profiles table
-- Migration: 20251117_add_healing_wells
-- Author: Roman Hlaváček - rhsoft.cz
-- Date: 2025-11-17

-- Add healing wells usage tracking column
-- Stores JSON array of {id: string, lastUsed: timestamp} for daily reset tracking
ALTER TABLE player_profiles
ADD COLUMN IF NOT EXISTS healing_wells_used JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN player_profiles.healing_wells_used IS 'Array of healing wells used today with {id, lastUsed} for daily reset tracking';

-- Create index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_player_profiles_healing_wells_used
ON player_profiles USING GIN (healing_wells_used);
