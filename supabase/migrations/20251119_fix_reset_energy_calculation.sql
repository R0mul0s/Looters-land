-- ============================================================================
-- Fix Reset Energy Calculation (After Healing Wells Update)
-- ============================================================================
--
-- The 20251117 migration accidentally overwrote the dynamic energy calculation
-- from 20251116. This restores the correct behavior where energy is reset to
-- base_max_energy + bank_vault_tier bonus instead of using cached max_energy.
--
-- @author Roman Hlaváček - rhsoft.cz
-- @copyright 2025
-- @created 2025-11-19
-- ============================================================================

-- Update reset_daily_data to use dynamic energy calculation + healing wells reset
CREATE OR REPLACE FUNCTION reset_daily_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_max_energy INTEGER := 240; -- ENERGY_CONFIG.MAX_ENERGY from BALANCE_CONFIG.ts
  updated_count INTEGER;
BEGIN
  -- Reset energy to dynamically calculated max, clear world maps, clear discovered locations, and reset healing wells
  -- max_energy = base_max_energy (240) + bank vault bonus
  UPDATE player_profiles
  SET
    energy = base_max_energy + calculate_bank_energy_bonus(COALESCE(bank_vault_tier, 0)),
    world_map_data = NULL,
    discovered_locations = '[]'::jsonb,
    healing_wells_used = '[]'::jsonb,
    updated_at = NOW()
  WHERE user_id != '00000000-0000-0000-0000-000000000000';

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- Log the number of profiles updated
  RAISE NOTICE 'Daily reset completed for % profiles', updated_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reset_daily_data() TO authenticated, service_role, anon;

-- Add updated comment
COMMENT ON FUNCTION reset_daily_data() IS 'Resets daily game data: restores energy to dynamically calculated max (base + bank bonus), clears world maps, clears discovered locations, and resets healing wells for all players';

-- ============================================================================
-- TESTING
-- ============================================================================

-- Test the reset function (optional - uncomment to test)
-- SELECT reset_daily_data();

-- Verify energy calculation for different bank tiers:
-- SELECT
--   user_id,
--   bank_vault_tier,
--   240 + calculate_bank_energy_bonus(COALESCE(bank_vault_tier, 0)) as calculated_max_energy,
--   energy as current_energy
-- FROM player_profiles
-- WHERE user_id != '00000000-0000-0000-0000-000000000000'
-- LIMIT 5;

-- ============================================================================
