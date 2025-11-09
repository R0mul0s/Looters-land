/**
 * Daily Reset Edge Function
 *
 * Runs daily at 00:00 UTC to reset game state for all players.
 * Triggered by Supabase Cron or external scheduler.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @created 2025-11-08
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

serve(async (req: Request) => {
  try {
    // Verify request authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Starting daily reset...');

    // 1. Restore energy to max for all players
    const { data: profiles, error: energyError } = await supabase
      .from('player_profiles')
      .update({
        energy: supabase.rpc('GREATEST', [0, 'max_energy']), // Restore to max
        updated_at: new Date().toISOString()
      })
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Exclude invalid users

    if (energyError) {
      console.error('❌ Energy reset failed:', energyError);
      throw energyError;
    }

    console.log(`✅ Energy restored for all players`);

    // 2. Reset daily gacha free summons
    // Note: This is handled client-side by checking lastFreeSummonDate against today's date
    // No database update needed as gacha_state is stored in game_saves JSON

    // 3. Archive previous day's leaderboard data (if leaderboards exist)
    // TODO: Implement when leaderboard system is ready
    /*
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    await supabase
      .from('daily_leaderboards_archive')
      .insert({
        date: yesterdayStr,
        data: await getLeaderboardData(supabase)
      });
    */

    // 4. Log the reset event
    const resetLog = {
      timestamp: new Date().toISOString(),
      action: 'daily_reset',
      details: {
        energy_restored: true,
        leaderboards_archived: false // Not implemented yet
      }
    };

    console.log('✅ Daily reset completed:', resetLog);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily reset completed successfully',
        log: resetLog
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Daily reset failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

/**
 * Helper function to get current leaderboard data
 * @param supabase - Supabase client
 * @returns Leaderboard data object
 */
async function getLeaderboardData(supabase: any) {
  // TODO: Implement when leaderboard tables exist
  // This would query the daily_leaderboards table and return top players
  return {
    deepest_floor: [],
    total_gold: [],
    heroes_collected: [],
    combat_power: []
  };
}
