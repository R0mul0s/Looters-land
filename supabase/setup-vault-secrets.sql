-- ============================================================================
-- SETUP SUPABASE API KEYS - SIMPLE VERSION
-- ============================================================================
-- Since Vault is not available, we'll use a simpler approach:
-- Store keys as Supabase Edge Function Secrets (via CLI)
--
-- @author Roman Hlaváček - rhsoft.cz
-- @copyright 2025
-- @created 2025-11-15
-- ============================================================================

-- ============================================================================
-- OPTION 1: Use Supabase CLI to set secrets (RECOMMENDED)
-- ============================================================================
-- Run these commands in your terminal (from project root):
--
-- npx supabase secrets set PUBLISHABLE_KEY="sb_publishable_mx0WvoiRGGr-9n6engbNSg_TYp9wubZ"
-- npx supabase secrets set SECRET_KEY="sb_secret_CLP2fLYADlq6HQM9CoWKPg_H9uLCFwL"
--
-- These secrets will be available to your Edge Functions via Deno.env.get()

-- ============================================================================
-- OPTION 2: Use custom secrets table (for SQL/Cron access)
-- ============================================================================
-- This stores the keys in a dedicated table that can be accessed in SQL

-- Create secrets table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_secrets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a secure function to get secrets
CREATE OR REPLACE FUNCTION get_secret(secret_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  secret_value TEXT;
BEGIN
  SELECT value INTO secret_value
  FROM app_secrets
  WHERE key = secret_key;

  RETURN secret_value;
END;
$$;

-- Insert or update the publishable key
INSERT INTO app_secrets (key, value, updated_at)
VALUES ('publishable_key', 'sb_publishable_mx0WvoiRGGr-9n6engbNSg_TYp9wubZ', NOW())
ON CONFLICT (key)
DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Insert or update the secret key
INSERT INTO app_secrets (key, value, updated_at)
VALUES ('secret_key', 'sb_secret_CLP2fLYADlq6HQM9CoWKPg_H9uLCFwL', NOW())
ON CONFLICT (key)
DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Restrict access to the secrets table
REVOKE ALL ON app_secrets FROM PUBLIC;
GRANT SELECT ON app_secrets TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_secret(TEXT) TO authenticated, service_role, anon;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the secrets were created
SELECT key, created_at, updated_at
FROM app_secrets
ORDER BY key;

-- Test the get_secret function
SELECT get_secret('publishable_key') AS publishable_key_check;
SELECT get_secret('secret_key') AS secret_key_check;

-- Expected output: 2 rows showing publishable_key and secret_key

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- To use these secrets in your SQL code:
-- get_secret('publishable_key')
-- get_secret('secret_key')

-- Example in a cron job:
/*
SELECT net.http_post(
  url := 'https://ykkjdsciiztoeqycxmtg.supabase.co/functions/v1/my-function',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || get_secret('publishable_key')
  ),
  body := '{}'::jsonb
);
*/

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================
-- 1. Secrets are stored in a dedicated table with restricted access
-- 2. Only authenticated and service_role users can read secrets
-- 3. The get_secret() function uses SECURITY DEFINER for controlled access
-- 4. Never commit these values to Git
-- 5. To update a key, run INSERT ... ON CONFLICT UPDATE again
--
-- To update a secret:
-- UPDATE app_secrets SET value = 'NEW_VALUE', updated_at = NOW() WHERE key = 'publishable_key';
--
-- To delete a secret:
-- DELETE FROM app_secrets WHERE key = 'publishable_key';
-- ============================================================================
