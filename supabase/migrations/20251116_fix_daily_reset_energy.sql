-- ============================================================================
-- Fix Daily Reset Energy Calculation
-- ============================================================================
--
-- Updates the reset_daily_data() function to calculate max_energy dynamically
-- from bank_vault_tier instead of using the cached max_energy column.
--
-- This ensures daily reset respects the bank vault energy bonuses correctly.
--
-- @author Roman Hlaváček - rhsoft.cz
-- @copyright 2025
-- @created 2025-11-16
-- ============================================================================

-- Create helper function to calculate energy bonus from bank vault tier
CREATE OR REPLACE FUNCTION calculate_bank_energy_bonus(tier INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Bank energy bonus tiers (matches BALANCE_CONFIG.ts)
  CASE tier
    WHEN 0 THEN RETURN 0;
    WHEN 1 THEN RETURN 25;
    WHEN 2 THEN RETURN 50;
    WHEN 3 THEN RETURN 75;
    WHEN 4 THEN RETURN 100;
    WHEN 5 THEN RETURN 125;
    ELSE RETURN 0;
  END CASE;
END;
$$;

-- Add comment
COMMENT ON FUNCTION calculate_bank_energy_bonus(INTEGER) IS 'Calculates energy bonus from bank vault tier (matches BALANCE_CONFIG.ts)';

-- Update reset_daily_data to use dynamic energy calculation
CREATE OR REPLACE FUNCTION reset_daily_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_max_energy INTEGER := 240; -- ENERGY_CONFIG.MAX_ENERGY from BALANCE_CONFIG.ts
  updated_count INTEGER;
BEGIN
  -- Reset energy to dynamically calculated max, clear world maps, and clear discovered locations
  -- max_energy = base_max_energy (240) + bank vault bonus
  UPDATE player_profiles
  SET
    energy = base_max_energy + calculate_bank_energy_bonus(COALESCE(bank_vault_tier, 0)),
    world_map_data = NULL,
    discovered_locations = '[]'::jsonb,
    updated_at = NOW()
  WHERE user_id != '00000000-0000-0000-0000-000000000000';

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- Log the number of profiles updated
  RAISE NOTICE 'Daily reset completed for % profiles', updated_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reset_daily_data() TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION calculate_bank_energy_bonus(INTEGER) TO authenticated, service_role, anon;

-- Add comment
COMMENT ON FUNCTION reset_daily_data() IS 'Resets daily game data: restores energy to dynamically calculated max (base + bank bonus), clears world maps, and clears discovered locations for all players';

-- ============================================================================
-- TESTING
-- ============================================================================

-- Test the energy calculation function
-- SELECT calculate_bank_energy_bonus(0); -- Should return 0
-- SELECT calculate_bank_energy_bonus(1); -- Should return 25
-- SELECT calculate_bank_energy_bonus(3); -- Should return 75
-- SELECT calculate_bank_energy_bonus(5); -- Should return 125

-- Test the reset function (optional - uncomment to test)
-- SELECT reset_daily_data();

-- ============================================================================
