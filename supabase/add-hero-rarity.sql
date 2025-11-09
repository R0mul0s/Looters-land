-- Add rarity column to heroes table
ALTER TABLE heroes
ADD COLUMN IF NOT EXISTS rarity TEXT NOT NULL DEFAULT 'common';

-- Add check constraint for valid rarity values
ALTER TABLE heroes
DROP CONSTRAINT IF EXISTS heroes_rarity_check;

ALTER TABLE heroes
ADD CONSTRAINT heroes_rarity_check
CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary'));

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_heroes_rarity ON heroes(rarity);
