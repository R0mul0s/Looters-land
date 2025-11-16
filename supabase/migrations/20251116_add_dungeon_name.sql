-- Migration: Add dungeon_name column to daily_leaderboards
-- Created: 2025-11-16
-- Description: Adds dungeon_name field to track where deepest_floor was achieved

-- Add dungeon_name column
ALTER TABLE daily_leaderboards
ADD COLUMN IF NOT EXISTS dungeon_name TEXT;

-- Add index for dungeon_name queries
CREATE INDEX IF NOT EXISTS idx_daily_leaderboards_dungeon_name
ON daily_leaderboards(dungeon_name);

-- Update comment
COMMENT ON COLUMN daily_leaderboards.dungeon_name IS 'Name of the dungeon where the deepest floor was reached';
