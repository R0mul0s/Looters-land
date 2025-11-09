-- Add rarity column to heroes table
ALTER TABLE heroes
ADD COLUMN IF NOT EXISTS rarity TEXT NOT NULL DEFAULT 'common';

-- Add experience and required_xp columns if they don't exist
ALTER TABLE heroes
ADD COLUMN IF NOT EXISTS experience INTEGER NOT NULL DEFAULT 0;

ALTER TABLE heroes
ADD COLUMN IF NOT EXISTS required_xp INTEGER NOT NULL DEFAULT 100;
