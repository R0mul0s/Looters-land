-- Add party_order column to heroes table to track active party
ALTER TABLE heroes
ADD COLUMN IF NOT EXISTS party_order INTEGER DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN heroes.party_order IS 'Position in active party (0-3), NULL if not in party';

-- Add index for faster party queries
CREATE INDEX IF NOT EXISTS idx_heroes_party_order ON heroes(game_save_id, party_order) WHERE party_order IS NOT NULL;
