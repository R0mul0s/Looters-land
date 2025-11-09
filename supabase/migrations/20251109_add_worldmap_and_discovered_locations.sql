-- Add world map data and discovered locations to player_profiles table
-- Migration: 20251109_add_worldmap_and_discovered_locations
-- Author: Roman Hlaváček - rhsoft.cz
-- Date: 2025-11-09

-- Add world map JSON data column (stores explored tiles state)
ALTER TABLE player_profiles
ADD COLUMN IF NOT EXISTS world_map_data JSONB;

-- Add discovered locations array (stores discovered towns/dungeons)
ALTER TABLE player_profiles
ADD COLUMN IF NOT EXISTS discovered_locations JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN player_profiles.world_map_data IS 'Serialized world map data including explored tiles state';
COMMENT ON COLUMN player_profiles.discovered_locations IS 'Array of discovered locations (towns and dungeons) with {name, x, y, type}';

-- Create index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_player_profiles_world_map_data
ON player_profiles USING GIN (world_map_data);

CREATE INDEX IF NOT EXISTS idx_player_profiles_discovered_locations
ON player_profiles USING GIN (discovered_locations);
