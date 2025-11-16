-- Migration: Fix global_world_state RLS for anonymous users
-- Created: 2025-11-16
-- Description: Allows anonymous (non-authenticated) users to read global world state

-- Drop old policy that only allowed authenticated users
DROP POLICY IF EXISTS "Allow all users to read global world state" ON global_world_state;

-- Create new policy to allow EVERYONE (authenticated + anon) to read
CREATE POLICY "Allow all users to read global world state"
  ON global_world_state
  FOR SELECT
  USING (true);

-- Verify policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'global_world_state';

-- Expected: Policy with cmd='SELECT' and qual='true'
