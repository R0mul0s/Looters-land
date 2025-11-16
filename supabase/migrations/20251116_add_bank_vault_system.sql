-- Bank Vault System Migration
-- Version: 1.0
-- Date: 2025-11-16
-- Description: Adds bank vault storage functionality for items

-- ============================================================================
-- 1. Add Bank Vault columns to player_profiles
-- ============================================================================

ALTER TABLE player_profiles
ADD COLUMN IF NOT EXISTS bank_vault_tier INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS bank_vault_max_slots INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS bank_total_items INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN player_profiles.bank_vault_tier IS 'Current bank vault tier (0-5)';
COMMENT ON COLUMN player_profiles.bank_vault_max_slots IS 'Maximum bank vault capacity (0, 50, 100, 150, 200, 250)';
COMMENT ON COLUMN player_profiles.bank_total_items IS 'Cached count of items stored in bank (for performance)';

-- ============================================================================
-- 2. Add location column to inventory_items
-- ============================================================================

ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT 'inventory';

COMMENT ON COLUMN inventory_items.location IS 'Item location: inventory | bank | equipped';

-- Create index for fast filtering by location
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory_items(game_save_id, location);

-- ============================================================================
-- 3. Update existing data (all items default to 'inventory')
-- ============================================================================

-- Existing items are already in inventory by default
UPDATE inventory_items SET location = 'inventory' WHERE location IS NULL;

-- ============================================================================
-- 4. Add constraint to validate location values
-- ============================================================================

ALTER TABLE inventory_items
ADD CONSTRAINT check_inventory_location
CHECK (location IN ('inventory', 'bank', 'equipped'));

-- ============================================================================
-- 5. Create helper function to calculate bank vault capacity
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_bank_vault_slots(tier INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE tier
        WHEN 0 THEN 0
        WHEN 1 THEN 50
        WHEN 2 THEN 100
        WHEN 3 THEN 150
        WHEN 4 THEN 200
        WHEN 5 THEN 250
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_bank_vault_slots IS 'Returns bank vault slot capacity for given tier (0-5)';

-- ============================================================================
-- 6. Create helper function to calculate bank upgrade cost
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_bank_upgrade_cost(from_tier INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE from_tier
        WHEN 0 THEN 25000
        WHEN 1 THEN 50000
        WHEN 2 THEN 100000
        WHEN 3 THEN 200000
        WHEN 4 THEN 400000
        ELSE 0 -- Cannot upgrade from tier 5 (max)
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_bank_upgrade_cost IS 'Returns gold cost to upgrade from given tier to next tier';

-- ============================================================================
-- 7. Create helper function to calculate energy bonus
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_bank_energy_bonus(tier INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE tier
        WHEN 0 THEN 0
        WHEN 1 THEN 25
        WHEN 2 THEN 50
        WHEN 3 THEN 75
        WHEN 4 THEN 100
        WHEN 5 THEN 125
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_bank_energy_bonus IS 'Returns max energy bonus for given bank vault tier';

-- ============================================================================
-- 8. Create trigger to update bank_total_items count
-- ============================================================================

CREATE OR REPLACE FUNCTION update_bank_total_items()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the cached count in player_profiles
    IF TG_OP = 'INSERT' AND NEW.location = 'bank' THEN
        UPDATE player_profiles
        SET bank_total_items = bank_total_items + 1
        WHERE user_id = (SELECT user_id FROM game_saves WHERE id = NEW.game_save_id);
    ELSIF TG_OP = 'DELETE' AND OLD.location = 'bank' THEN
        UPDATE player_profiles
        SET bank_total_items = GREATEST(0, bank_total_items - 1)
        WHERE user_id = (SELECT user_id FROM game_saves WHERE id = OLD.game_save_id);
    ELSIF TG_OP = 'UPDATE' THEN
        -- Item moved from inventory to bank
        IF OLD.location != 'bank' AND NEW.location = 'bank' THEN
            UPDATE player_profiles
            SET bank_total_items = bank_total_items + 1
            WHERE user_id = (SELECT user_id FROM game_saves WHERE id = NEW.game_save_id);
        -- Item moved from bank to inventory
        ELSIF OLD.location = 'bank' AND NEW.location != 'bank' THEN
            UPDATE player_profiles
            SET bank_total_items = GREATEST(0, bank_total_items - 1)
            WHERE user_id = (SELECT user_id FROM game_saves WHERE id = NEW.game_save_id);
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to inventory_items
DROP TRIGGER IF EXISTS trigger_update_bank_total_items ON inventory_items;
CREATE TRIGGER trigger_update_bank_total_items
AFTER INSERT OR UPDATE OR DELETE ON inventory_items
FOR EACH ROW EXECUTE FUNCTION update_bank_total_items();

COMMENT ON FUNCTION update_bank_total_items IS 'Automatically updates bank_total_items count when items move in/out of bank';

-- ============================================================================
-- 9. Create view for easy bank inventory queries
-- ============================================================================

CREATE OR REPLACE VIEW bank_inventory_view AS
SELECT
    i.*,
    gs.user_id,
    pp.bank_vault_tier,
    pp.bank_vault_max_slots,
    pp.bank_total_items
FROM inventory_items i
JOIN game_saves gs ON i.game_save_id = gs.id
JOIN player_profiles pp ON gs.user_id = pp.user_id
WHERE i.location = 'bank';

COMMENT ON VIEW bank_inventory_view IS 'Convenient view for querying items stored in bank vault';

-- ============================================================================
-- 10. Initialize bank_total_items for existing players
-- ============================================================================

-- Count existing bank items (should be 0 for new feature)
UPDATE player_profiles pp
SET bank_total_items = (
    SELECT COUNT(*)
    FROM inventory_items i
    JOIN game_saves gs ON i.game_save_id = gs.id
    WHERE gs.user_id = pp.user_id
    AND i.location = 'bank'
);

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verification queries (run these to verify migration success)
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'player_profiles' AND column_name LIKE 'bank%';

-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'inventory_items' AND column_name = 'location';

-- Test helper functions:
-- SELECT calculate_bank_vault_slots(3); -- Should return 150
-- SELECT calculate_bank_upgrade_cost(2); -- Should return 100000
-- SELECT calculate_bank_energy_bonus(5); -- Should return 125
