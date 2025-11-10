-- Create function for daily reset
-- This function resets energy, world maps, and discovered locations for all players

CREATE OR REPLACE FUNCTION reset_daily_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reset energy to max, clear world maps, and clear discovered locations
  UPDATE player_profiles
  SET
    energy = max_energy,
    world_map_data = NULL,
    discovered_locations = ARRAY[]::text[],
    updated_at = NOW()
  WHERE user_id != '00000000-0000-0000-0000-000000000000';

  -- Log the number of profiles updated
  RAISE NOTICE 'Daily reset completed for % profiles', (SELECT COUNT(*) FROM player_profiles WHERE user_id != '00000000-0000-0000-0000-000000000000');
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION reset_daily_data() TO authenticated, service_role, anon;

-- Add comment
COMMENT ON FUNCTION reset_daily_data() IS 'Resets daily game data: restores energy to max, clears world maps, and clears discovered locations for all players';
