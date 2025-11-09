-- Fix equipment_slots foreign key to cascade delete
-- This ensures when a hero is deleted, their equipment slots are automatically deleted

-- Drop existing constraint if it exists
ALTER TABLE equipment_slots
DROP CONSTRAINT IF EXISTS equipment_slots_hero_id_fkey;

-- Add new constraint with CASCADE delete
ALTER TABLE equipment_slots
ADD CONSTRAINT equipment_slots_hero_id_fkey
FOREIGN KEY (hero_id)
REFERENCES heroes(id)
ON DELETE CASCADE;

-- Add index for better performance on hero_id lookups
CREATE INDEX IF NOT EXISTS idx_equipment_slots_hero_id
ON equipment_slots(hero_id);
