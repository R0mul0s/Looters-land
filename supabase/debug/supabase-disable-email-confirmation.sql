-- ============================================================================
-- Supabase Auth Configuration - Disable Email Confirmation
-- ============================================================================
-- This script disables email confirmation for development purposes.
-- Users can register and login immediately without email verification.
--
-- HOW TO RUN:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Create a new query
-- 3. Copy and paste this script
-- 4. Click "Run" button
--
-- @author Roman Hlaváček - rhsoft.cz
-- @copyright 2025
-- @created 2025-11-07
-- ============================================================================

-- ============================================================================
-- IMPORTANT: Supabase doesn't allow direct SQL configuration changes
-- for email confirmation. You MUST use the Dashboard UI instead.
-- ============================================================================
--
-- The correct way to disable email confirmation:
-- 1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/auth/providers
-- 2. Click on "Email" provider
-- 3. Scroll down and find "Confirm email" toggle
-- 4. Turn it OFF
-- 5. Click "Save"
--
-- The SQL commands below are for reference only and will NOT work:
-- (auth.config table does not exist in most Supabase versions)
-- ============================================================================

-- Optional: Auto-confirm all existing unconfirmed users
-- WARNING: This will confirm ALL pending users immediately
-- Note: confirmed_at is a generated column and will update automatically
UPDATE auth.users
SET
  email_confirmed_at = NOW()
WHERE
  email_confirmed_at IS NULL;

-- Verify the changes
SELECT
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- After running this script:
-- ✅ New users can register and login immediately
-- ✅ No email verification required
-- ✅ Existing unconfirmed users are now confirmed (if you ran the optional step)
--
-- To re-enable email confirmation later:
-- 1. Go to Supabase Dashboard → Authentication → Settings
-- 2. Enable "Confirm email" toggle
-- 3. Or run: UPDATE auth.config SET autoconfirm = false WHERE id = 'default';
-- ============================================================================
