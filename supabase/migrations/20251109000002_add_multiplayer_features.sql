-- Migration: Add multiplayer features
-- Description: Adds columns for real-time player tracking and chat system
-- Author: Roman Hlaváček - rhsoft.cz
-- Date: 2025-11-09

-- Add multiplayer columns to player_profiles table
ALTER TABLE player_profiles
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS current_map_x INTEGER,
ADD COLUMN IF NOT EXISTS current_map_y INTEGER,
ADD COLUMN IF NOT EXISTS current_chat_message TEXT,
ADD COLUMN IF NOT EXISTS chat_message_timestamp TIMESTAMP WITH TIME ZONE;

-- Create index for efficient online player queries
CREATE INDEX IF NOT EXISTS idx_player_profiles_online_status
ON player_profiles (is_online, last_seen)
WHERE is_online = true;

-- Create index for map position queries
CREATE INDEX IF NOT EXISTS idx_player_profiles_map_position
ON player_profiles (current_map_x, current_map_y)
WHERE is_online = true;

-- Add comment
COMMENT ON COLUMN player_profiles.last_seen IS 'Last heartbeat timestamp for online presence';
COMMENT ON COLUMN player_profiles.is_online IS 'Whether player is currently online';
COMMENT ON COLUMN player_profiles.current_map_x IS 'Current X position on world map';
COMMENT ON COLUMN player_profiles.current_map_y IS 'Current Y position on world map';
COMMENT ON COLUMN player_profiles.current_chat_message IS 'Latest chat message to display';
COMMENT ON COLUMN player_profiles.chat_message_timestamp IS 'When the chat message was sent';

-- Enable Realtime for player_profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE player_profiles;

-- Create RLS policy to allow players to view all profiles (for multiplayer)
CREATE POLICY "Players can view all profiles"
ON player_profiles
FOR SELECT
USING (true);
