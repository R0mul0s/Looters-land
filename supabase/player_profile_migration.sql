-- Player Profile Table Migration
-- Add this to your Supabase SQL Editor

-- Player Profiles Table
CREATE TABLE IF NOT EXISTS player_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL UNIQUE,

    -- Player Info
    nickname TEXT,
    player_level INTEGER NOT NULL DEFAULT 1,
    experience INTEGER NOT NULL DEFAULT 0,

    -- Resources
    gold INTEGER NOT NULL DEFAULT 0,
    gems INTEGER NOT NULL DEFAULT 0,
    energy INTEGER NOT NULL DEFAULT 100,
    max_energy INTEGER NOT NULL DEFAULT 100,

    -- Game Progress
    current_world_x INTEGER NOT NULL DEFAULT 25,
    current_world_y INTEGER NOT NULL DEFAULT 25,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_player_profiles_user_id ON player_profiles(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_player_profiles_updated_at BEFORE UPDATE ON player_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add experience and required_xp columns to heroes table if they don't exist
ALTER TABLE heroes ADD COLUMN IF NOT EXISTS experience INTEGER NOT NULL DEFAULT 0;
ALTER TABLE heroes ADD COLUMN IF NOT EXISTS required_xp INTEGER NOT NULL DEFAULT 100;

COMMENT ON TABLE player_profiles IS 'Player account profiles with resources and progress';
