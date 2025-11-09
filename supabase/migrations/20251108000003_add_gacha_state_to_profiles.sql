-- Add gacha state columns to player_profiles table
-- Migration: 20251108000003_add_gacha_state_to_profiles
-- Author: Roman Hlaváček - rhsoft.cz
-- Date: 2025-11-08

-- Add gacha state tracking columns
ALTER TABLE player_profiles
ADD COLUMN IF NOT EXISTS gacha_summon_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS gacha_last_free_summon TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS gacha_pity_summons INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN player_profiles.gacha_summon_count IS 'Total number of gacha summons performed';
COMMENT ON COLUMN player_profiles.gacha_last_free_summon IS 'Timestamp of last free daily summon (resets at midnight UTC)';
COMMENT ON COLUMN player_profiles.gacha_pity_summons IS 'Number of summons since last Epic/Legendary drop (for pity system)';

-- Create index for efficient queries on last free summon date
CREATE INDEX IF NOT EXISTS idx_player_profiles_gacha_last_free_summon
ON player_profiles(gacha_last_free_summon);

-- Update existing profiles to have default gacha state
UPDATE player_profiles
SET
  gacha_summon_count = 0,
  gacha_pity_summons = 0,
  gacha_last_free_summon = NULL
WHERE gacha_summon_count IS NULL;
