-- Add avatar field to player_profiles table
-- This allows players to select their avatar image for the worldmap

-- Add avatar column with default value
ALTER TABLE player_profiles
ADD COLUMN IF NOT EXISTS avatar TEXT NOT NULL DEFAULT 'hero1.png';

-- Add comment to column
COMMENT ON COLUMN player_profiles.avatar IS 'Avatar image filename (e.g., hero1.png, hero2.png)';

-- Update existing profiles to have default avatar if NULL
UPDATE player_profiles
SET avatar = 'hero1.png'
WHERE avatar IS NULL OR avatar = '';

-- Create index for faster avatar queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_player_profiles_avatar ON player_profiles(avatar);
