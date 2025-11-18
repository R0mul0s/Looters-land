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

// Extend Window interface for debug commands
declare global {
  interface Window {
    __DEBUG__?: typeof DEBUG_CONFIG;
    __gameActions?: unknown;
    __gameState?: unknown;
    enableUnlimitedEnergy?: () => void;
    disableUnlimitedEnergy?: () => void;
    toggleUnlimitedEnergy?: () => void;
    resetDailyGacha?: () => Promise<void>;
    showGachaState?: () => Promise<void>;
    resetWorldMap?: () => Promise<void>;
    fixDuplicateHeroes?: () => Promise<void>;
    showAllHeroes?: () => void;
    revealMap?: () => void;
  }
}

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

  // Note: FAST_ENERGY_REGEN removed - energy is now server-side via cron job
  // Use SQL to test: SELECT regenerate_player_energy();
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
  window.__DEBUG__ = DEBUG_CONFIG;

  window.enableUnlimitedEnergy = () => {
    DEBUG_CONFIG.UNLIMITED_ENERGY = true;
    console.log('⚡ Unlimited energy ENABLED');
  };

  window.disableUnlimitedEnergy = () => {
    DEBUG_CONFIG.UNLIMITED_ENERGY = false;
    console.log('⚡ Unlimited energy DISABLED');
  };

  window.toggleUnlimitedEnergy = () => {
    DEBUG_CONFIG.UNLIMITED_ENERGY = !DEBUG_CONFIG.UNLIMITED_ENERGY;
    console.log(`⚡ Unlimited energy ${DEBUG_CONFIG.UNLIMITED_ENERGY ? 'ENABLED' : 'DISABLED'}`);
  };

  // REMOVED: enableFastRegen / disableFastRegen
  // Energy is now server-side via cron job (pg_cron)
  // To test energy regen: Run in Supabase SQL Editor:
  //   SELECT regenerate_player_energy();

  /**
   * Reset daily free gacha summon
   * Allows using free summon again today
   */
  window.resetDailyGacha = async () => {
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
  window.showGachaState = async () => {
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
   * Clears worldmap from database so it regenerates with new town names
   */
  window.resetWorldMap = async () => {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('❌ Not logged in');
        return;
      }

      console.log('🗺️ Resetting world map in database...');

      const { error } = await supabase
        .from('player_profiles')
        .update({ world_map_data: null })
        .eq('user_id', session.user.id);

      if (error) {
        console.error('❌ Failed to reset world map:', error);
      } else {
        console.log('✅ World map reset in database!');
        console.log('🔄 Reloading page to generate new map with updated town names...');
        setTimeout(() => location.reload(), 1000);
      }
    } catch (error) {
      console.error('❌ Error resetting world map:', error);
    }
  };

  /**
   * DISABLED - Fix duplicate heroes
   * This function has been disabled due to bugs that deleted all heroes
   */
  window.fixDuplicateHeroes = async () => {
    console.error('❌ This function has been DISABLED due to bugs.');
    console.error('   It incorrectly detected all heroes as duplicates.');
    console.error('   Use window.showAllHeroes() to see your current heroes.');
  };

  /**
   * Show all heroes in the collection
   */
  window.showAllHeroes = () => {
    const gameState = window.__gameState as { allHeroes: Array<{ name: string; heroClass: string; level: number; id: string }> } | undefined;

    if (!gameState) {
      console.error('❌ Game not loaded yet');
      return;
    }

    console.log('📋 All Heroes in Collection:');
    console.log(`   Total: ${gameState.allHeroes.length} heroes`);
    gameState.allHeroes.forEach((hero, index: number) => {
      console.log(`   ${index + 1}. ${hero.name} (${hero.heroClass}) - Lv${hero.level} - ID: ${hero.id}`);
    });
  };

  /**
   * Reveal entire world map (remove fog of war)
   * Explores all tiles on the map
   */
  window.revealMap = () => {
    const gameActions = window.__gameActions as { addDiscoveredLocation: (loc: { name: string; x: number; y: number; type: string }) => void } | undefined;
    const gameState = window.__gameState as { worldMap?: { tiles: Array<Array<{ isExplored: boolean; staticObject?: { name: string; type: string }; x: number; y: number }>> } } | undefined;

    if (!gameState || !gameActions) {
      console.error('❌ Game not loaded yet');
      return;
    }

    if (!gameState.worldMap) {
      console.error('❌ World map not generated yet');
      return;
    }

    console.log('🗺️ Revealing entire world map...');

    let exploredCount = 0;
    const worldMap = gameState.worldMap;

    // Explore all tiles
    for (let y = 0; y < worldMap.tiles.length; y++) {
      for (let x = 0; x < worldMap.tiles[y].length; x++) {
        const tile = worldMap.tiles[y][x];
        if (!tile.isExplored) {
          tile.isExplored = true;
          exploredCount++;

          // Add discovered location if it has a static object
          if (tile.staticObject) {
            gameActions.addDiscoveredLocation({
              name: tile.staticObject.name,
              x,
              y,
              type: tile.staticObject.type
            });
          }
        }
      }
    }

    // Force re-render by updating the worldmap
    gameActions.updateWorldMap({ ...worldMap });

    console.log(`✅ Map revealed! Explored ${exploredCount} new tiles`);
    console.log(`📍 Total tiles: ${worldMap.tiles.length * worldMap.tiles[0].length}`);
  };

  console.log('🐛 Debug commands available:');
  console.log('  Energy:');
  console.log('    - window.enableUnlimitedEnergy()');
  console.log('    - window.disableUnlimitedEnergy()');
  console.log('    - window.toggleUnlimitedEnergy()');
  console.log('  Gacha:');
  console.log('    - await window.showGachaState() - Show current gacha state');
  console.log('    - await window.resetDailyGacha() - Reset daily free summon');
  console.log('  Heroes:');
  console.log('    - window.showAllHeroes() - Show all heroes in collection');
  console.log('    - await window.fixDuplicateHeroes() - Fix duplicate heroes (converts to talents)');
  console.log('  World Map:');
  console.log('    - await window.resetWorldMap() - Generate new world map');
  console.log('    - window.revealMap() - Reveal entire map (remove fog of war)');
}
