-- Update reset_daily_data function to include healing wells reset
-- Migration: 20251117_add_healing_wells_reset
-- Author: Roman Hlaváček - rhsoft.cz
-- Date: 2025-11-17

CREATE OR REPLACE FUNCTION reset_daily_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reset energy to max, clear world maps, clear discovered locations, and reset healing wells
  UPDATE player_profiles
  SET
    energy = max_energy,
    world_map_data = NULL,
    discovered_locations = '[]'::jsonb,
    healing_wells_used = '[]'::jsonb,
    updated_at = NOW()
  WHERE user_id != '00000000-0000-0000-0000-000000000000';

  -- Log the number of profiles updated
  RAISE NOTICE 'Daily reset completed for % profiles', (SELECT COUNT(*) FROM player_profiles WHERE user_id != '00000000-0000-0000-0000-000000000000');
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION reset_daily_data() TO authenticated, service_role, anon;

-- Add updated comment
COMMENT ON FUNCTION reset_daily_data() IS 'Resets daily game data: restores energy to max, clears world maps, clears discovered locations, and resets healing wells for all players';
