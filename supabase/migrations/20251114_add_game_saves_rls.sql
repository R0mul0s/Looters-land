-- Add RLS policies for game saves tables
-- This allows authenticated users to manage their own save data

-- Enable RLS on game saves tables
ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE heroes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_slots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own game saves" ON game_saves;
DROP POLICY IF EXISTS "Users can insert own game saves" ON game_saves;
DROP POLICY IF EXISTS "Users can update own game saves" ON game_saves;
DROP POLICY IF EXISTS "Users can delete own game saves" ON game_saves;

DROP POLICY IF EXISTS "Users can view own heroes" ON heroes;
DROP POLICY IF EXISTS "Users can insert own heroes" ON heroes;
DROP POLICY IF EXISTS "Users can update own heroes" ON heroes;
DROP POLICY IF EXISTS "Users can delete own heroes" ON heroes;

DROP POLICY IF EXISTS "Users can view own inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Users can insert own inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Users can update own inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Users can delete own inventory items" ON inventory_items;

DROP POLICY IF EXISTS "Users can view own equipment" ON equipment_slots;
DROP POLICY IF EXISTS "Users can insert own equipment" ON equipment_slots;
DROP POLICY IF EXISTS "Users can update own equipment" ON equipment_slots;
DROP POLICY IF EXISTS "Users can delete own equipment" ON equipment_slots;

-- ============================================
-- GAME_SAVES POLICIES
-- ============================================

-- Allow users to view their own game saves
CREATE POLICY "Users can view own game saves"
  ON game_saves
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Allow users to insert their own game saves
CREATE POLICY "Users can insert own game saves"
  ON game_saves
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Allow users to update their own game saves
CREATE POLICY "Users can update own game saves"
  ON game_saves
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Allow users to delete their own game saves
CREATE POLICY "Users can delete own game saves"
  ON game_saves
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================
-- HEROES POLICIES
-- ============================================

-- Allow users to view their own heroes (via game_save_id)
CREATE POLICY "Users can view own heroes"
  ON heroes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_saves
      WHERE game_saves.id = heroes.game_save_id
      AND game_saves.user_id = auth.uid()::text
    )
  );

-- Allow users to insert heroes for their own game saves
CREATE POLICY "Users can insert own heroes"
  ON heroes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_saves
      WHERE game_saves.id = heroes.game_save_id
      AND game_saves.user_id = auth.uid()::text
    )
  );

-- Allow users to update their own heroes
CREATE POLICY "Users can update own heroes"
  ON heroes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM game_saves
      WHERE game_saves.id = heroes.game_save_id
      AND game_saves.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_saves
      WHERE game_saves.id = heroes.game_save_id
      AND game_saves.user_id = auth.uid()::text
    )
  );

-- Allow users to delete their own heroes
CREATE POLICY "Users can delete own heroes"
  ON heroes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM game_saves
      WHERE game_saves.id = heroes.game_save_id
      AND game_saves.user_id = auth.uid()::text
    )
  );

-- ============================================
-- INVENTORY_ITEMS POLICIES
-- ============================================

-- Allow users to view their own inventory items
CREATE POLICY "Users can view own inventory items"
  ON inventory_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_saves
      WHERE game_saves.id = inventory_items.game_save_id
      AND game_saves.user_id = auth.uid()::text
    )
  );

-- Allow users to insert inventory items for their own game saves
CREATE POLICY "Users can insert own inventory items"
  ON inventory_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_saves
      WHERE game_saves.id = inventory_items.game_save_id
      AND game_saves.user_id = auth.uid()::text
    )
  );

-- Allow users to update their own inventory items
CREATE POLICY "Users can update own inventory items"
  ON inventory_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM game_saves
      WHERE game_saves.id = inventory_items.game_save_id
      AND game_saves.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_saves
      WHERE game_saves.id = inventory_items.game_save_id
      AND game_saves.user_id = auth.uid()::text
    )
  );

-- Allow users to delete their own inventory items
CREATE POLICY "Users can delete own inventory items"
  ON inventory_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM game_saves
      WHERE game_saves.id = inventory_items.game_save_id
      AND game_saves.user_id = auth.uid()::text
    )
  );

-- ============================================
-- EQUIPMENT_SLOTS POLICIES
-- ============================================

-- Allow users to view their own equipment
CREATE POLICY "Users can view own equipment"
  ON equipment_slots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM heroes
      JOIN game_saves ON game_saves.id = heroes.game_save_id
      WHERE heroes.id = equipment_slots.hero_id
      AND game_saves.user_id = auth.uid()::text
    )
  );

-- Allow users to insert equipment for their own heroes
CREATE POLICY "Users can insert own equipment"
  ON equipment_slots
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM heroes
      JOIN game_saves ON game_saves.id = heroes.game_save_id
      WHERE heroes.id = equipment_slots.hero_id
      AND game_saves.user_id = auth.uid()::text
    )
  );

-- Allow users to update their own equipment
CREATE POLICY "Users can update own equipment"
  ON equipment_slots
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM heroes
      JOIN game_saves ON game_saves.id = heroes.game_save_id
      WHERE heroes.id = equipment_slots.hero_id
      AND game_saves.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM heroes
      JOIN game_saves ON game_saves.id = heroes.game_save_id
      WHERE heroes.id = equipment_slots.hero_id
      AND game_saves.user_id = auth.uid()::text
    )
  );

-- Allow users to delete their own equipment
CREATE POLICY "Users can delete own equipment"
  ON equipment_slots
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM heroes
      JOIN game_saves ON game_saves.id = heroes.game_save_id
      WHERE heroes.id = equipment_slots.hero_id
      AND game_saves.user_id = auth.uid()::text
    )
  );

-- Add helpful comments
COMMENT ON POLICY "Users can view own game saves" ON game_saves IS 'Allow authenticated users to view their own game saves';
COMMENT ON POLICY "Users can insert own game saves" ON game_saves IS 'Allow authenticated users to create new game saves';
COMMENT ON POLICY "Users can update own game saves" ON game_saves IS 'Allow authenticated users to update their own game saves';
COMMENT ON POLICY "Users can delete own game saves" ON game_saves IS 'Allow authenticated users to delete their own game saves';
