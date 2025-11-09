-- Add RLS policies for player_profiles table
-- Allows users to read and update their own profile

-- Enable RLS
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON player_profiles FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON player_profiles FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON player_profiles FOR UPDATE
  USING (auth.uid()::text = user_id);

COMMENT ON POLICY "Users can view own profile" ON player_profiles IS 'Players can view their own profile data';
COMMENT ON POLICY "Users can update own profile" ON player_profiles IS 'Players can update their own profile (nickname, etc.)';
