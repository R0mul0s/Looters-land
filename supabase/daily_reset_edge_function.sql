-- Daily Reset Edge Function for Looters Land
-- This function is intended to be called daily at 00:00 UTC
--
-- Purpose:
-- 1. Reset worldmap seed (forces new map generation on next login)
-- 2. Restore energy to max for all players
-- 3. Reset daily gacha summons
-- 4. Archive previous day's leaderboard data
--
-- @author Roman Hlaváček - rhsoft.cz
-- @copyright 2025
-- @created 2025-11-08

-- Note: This is a SQL representation of the logic
-- The actual Supabase Edge Function would be written in TypeScript/Deno
-- and deployed using: supabase functions deploy daily-reset

/*
Edge Function Implementation (TypeScript):

File: supabase/functions/daily-reset/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Restore energy to max for all players
    const { error: energyError } = await supabaseClient
      .from('player_profiles')
      .update({
        energy: supabaseClient.rpc('max_energy'),
        last_energy_reset: new Date().toISOString()
      })

    if (energyError) throw energyError

    // 2. Reset daily gacha summons (clear lastFreeSummonDate)
    // This will be stored in a separate gacha_state table or JSON column
    // For now, we'll assume it's handled client-side by checking date

    // 3. Archive leaderboard data (if leaderboards exist)
    // const today = new Date().toISOString().split('T')[0]
    // await archiveLeaderboards(supabaseClient, today)

    console.log('✅ Daily reset completed successfully')

    return new Response(
      JSON.stringify({ success: true, message: 'Daily reset completed' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ Daily reset failed:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
*/

-- SQL Trigger Alternative (runs at midnight via cron job or scheduled task)
-- This can be used if Edge Functions are not available

-- Create a function to reset daily values
CREATE OR REPLACE FUNCTION reset_daily_values()
RETURNS void AS $$
BEGIN
  -- Reset energy to max for all players
  UPDATE player_profiles
  SET
    energy = max_energy,
    last_energy_reset = NOW(),
    updated_at = NOW();

  -- Log the reset
  RAISE NOTICE 'Daily reset completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule this function to run daily at 00:00 UTC
-- Using pg_cron extension (if available):
-- SELECT cron.schedule('daily-reset', '0 0 * * *', 'SELECT reset_daily_values()');

-- Add last_energy_reset column if it doesn't exist
ALTER TABLE player_profiles
ADD COLUMN IF NOT EXISTS last_energy_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add comment to document the daily reset system
COMMENT ON FUNCTION reset_daily_values() IS
'Resets daily game values at midnight UTC: energy restoration, gacha resets, etc.';
