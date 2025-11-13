/**
 * Debug Configuration
 *
 * Debug settings for development and testing.
 * These can be toggled via browser console.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-10
 */

/**
 * Debug state
 * Access via window.__DEBUG__ in browser console
 */
export const DEBUG_CONFIG = {
  /** Disable energy consumption (no energy cost for movement/dungeons) */
  UNLIMITED_ENERGY: false,

  /** Unlimited gold */
  UNLIMITED_GOLD: false,

  /** Unlimited gems */
  UNLIMITED_GEMS: false,

  /** Fast energy regeneration (100x speed) */
  FAST_ENERGY_REGEN: false,
};

/**
 * Enable debug mode in browser console
 *
 * Usage:
 * window.enableUnlimitedEnergy() - Enable unlimited energy
 * window.disableUnlimitedEnergy() - Disable unlimited energy
 * window.toggleUnlimitedEnergy() - Toggle unlimited energy
 */
if (typeof window !== 'undefined') {
  (window as any).__DEBUG__ = DEBUG_CONFIG;

  (window as any).enableUnlimitedEnergy = () => {
    DEBUG_CONFIG.UNLIMITED_ENERGY = true;
    console.log('⚡ Unlimited energy ENABLED');
  };

  (window as any).disableUnlimitedEnergy = () => {
    DEBUG_CONFIG.UNLIMITED_ENERGY = false;
    console.log('⚡ Unlimited energy DISABLED');
  };

  (window as any).toggleUnlimitedEnergy = () => {
    DEBUG_CONFIG.UNLIMITED_ENERGY = !DEBUG_CONFIG.UNLIMITED_ENERGY;
    console.log(`⚡ Unlimited energy ${DEBUG_CONFIG.UNLIMITED_ENERGY ? 'ENABLED' : 'DISABLED'}`);
  };

  (window as any).enableFastRegen = () => {
    DEBUG_CONFIG.FAST_ENERGY_REGEN = true;
    console.log('⚡ Fast energy regeneration ENABLED (100x speed)');
  };

  (window as any).disableFastRegen = () => {
    DEBUG_CONFIG.FAST_ENERGY_REGEN = false;
    console.log('⚡ Fast energy regeneration DISABLED');
  };

  /**
   * Reset daily free gacha summon
   * Allows using free summon again today
   */
  (window as any).resetDailyGacha = async () => {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('❌ Not logged in');
        return;
      }

      const { error } = await supabase
        .from('player_profiles')
        .update({ gacha_last_free_summon: null })
        .eq('user_id', session.user.id);

      if (error) {
        console.error('❌ Failed to reset daily gacha:', error);
      } else {
        console.log('🎰 Daily free gacha summon RESET! Reload page to use it.');
      }
    } catch (error) {
      console.error('❌ Error resetting gacha:', error);
    }
  };

  /**
   * Show current gacha state
   */
  (window as any).showGachaState = async () => {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('❌ Not logged in');
        return;
      }

      const { data, error } = await supabase
        .from('player_profiles')
        .select('gacha_summon_count, gacha_last_free_summon, gacha_pity_summons')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('❌ Failed to get gacha state:', error);
      } else {
        console.log('🎰 Current Gacha State:');
        console.log('  Total summons:', data.gacha_summon_count || 0);
        console.log('  Last free summon:', data.gacha_last_free_summon || 'Never used');
        console.log('  Pity summons:', data.gacha_pity_summons || 0);

        const today = new Date().toISOString().split('T')[0];
        const canUseFree = !data.gacha_last_free_summon || data.gacha_last_free_summon !== today;
        console.log('  Can use free summon today:', canUseFree ? '✅ YES' : '❌ NO');
      }
    } catch (error) {
      console.error('❌ Error getting gacha state:', error);
    }
  };

  /**
   * Reset worldmap - generates new map
   */
  (window as any).resetWorldMap = () => {
    localStorage.removeItem('worldmap');
    console.log('🗺️ World map reset! Reload page to generate new map.');
    console.log('🔄 Reloading in 1 second...');
    setTimeout(() => location.reload(), 1000);
  };

  /**
   * DISABLED - Fix duplicate heroes
   * This function has been disabled due to bugs that deleted all heroes
   */
  (window as any).fixDuplicateHeroes = async () => {
    console.error('❌ This function has been DISABLED due to bugs.');
    console.error('   It incorrectly detected all heroes as duplicates.');
    console.error('   Use window.showAllHeroes() to see your current heroes.');
  };

  /**
   * Show all heroes in the collection
   */
  (window as any).showAllHeroes = () => {
    const gameActions = (window as any).__gameActions;
    const gameState = (window as any).__gameState;

    if (!gameState) {
      console.error('❌ Game not loaded yet');
      return;
    }

    console.log('📋 All Heroes in Collection:');
    console.log(`   Total: ${gameState.allHeroes.length} heroes`);
    gameState.allHeroes.forEach((hero: any, index: number) => {
      console.log(`   ${index + 1}. ${hero.name} (${hero.heroClass}) - Lv${hero.level} - ID: ${hero.id}`);
    });
  };

  console.log('🐛 Debug commands available:');
  console.log('  Energy:');
  console.log('    - window.enableUnlimitedEnergy()');
  console.log('    - window.disableUnlimitedEnergy()');
  console.log('    - window.toggleUnlimitedEnergy()');
  console.log('    - window.enableFastRegen()');
  console.log('    - window.disableFastRegen()');
  console.log('  Gacha:');
  console.log('    - window.showGachaState() - Show current gacha state');
  console.log('    - window.resetDailyGacha() - Reset daily free summon');
  console.log('  Heroes:');
  console.log('    - window.fixDuplicateHeroes() - Fix duplicate heroes (converts to talents)');
  console.log('  World Map:');
  console.log('    - window.resetWorldMap() - Generate new world map');
}
