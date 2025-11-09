-- Add talent_points column to heroes table
-- Part of hero duplicate system implementation
-- When player summons duplicate hero, they receive talent points instead

ALTER TABLE heroes
ADD COLUMN IF NOT EXISTS talent_points INTEGER NOT NULL DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN heroes.talent_points IS 'Number of talent points available from duplicate hero summons';
