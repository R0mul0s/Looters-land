/**
 * useGameState Hook - Centralized game state management with database sync
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-10
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Hero } from '../engine/hero/Hero';
import { Inventory } from '../engine/item/Inventory';
import { Equipment } from '../engine/equipment/Equipment';
import { Item } from '../engine/item/Item';
import { PlayerProfileService } from '../services/PlayerProfileService';
import type { PlayerProfile } from '../services/PlayerProfileService';
import { GameSaveService } from '../services/GameSaveService';
import { DynamicObjectUpdaterService } from '../services/DynamicObjectUpdaterService';
import * as AuthService from '../services/AuthService';
import type { WorldMap, StaticObjectType } from '../types/worldmap.types';
import type { GachaState } from '../types/hero.types';
import { supabase } from '../lib/supabase';
import type { SyncStatus } from '../components/SyncStatusIndicator';
import { ENERGY_CONFIG } from '../config/BALANCE_CONFIG';

interface GameState {
  // Player profile
  profile: PlayerProfile | null;
  profileLoading: boolean;

  // Player data
  playerName: string;
  playerLevel: number;
  combatPower: number; // Total party score
  gold: number;
  gems: number;
  energy: number;
  maxEnergy: number;

  // Game data
  allHeroes: Hero[];
  activeParty: Hero[];
  activePartyIndices: number[]; // Indices of heroes in active party
  inventory: Inventory;
  worldMap: WorldMap | null;
  playerPos: { x: number; y: number };
  discoveredLocations: Array<{ name: string; x: number; y: number; type: StaticObjectType }>;

  // Gacha system
  gachaState: GachaState;

  // Loading states
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Sync status
  syncStatus: SyncStatus;
  lastSaveTime: Date | null;
}

interface GameStateActions {
  // Profile actions
  updateNickname: (nickname: string) => Promise<void>;
  updatePlayerLevel: (level: number) => Promise<void>;

  // Resource actions
  addGold: (amount: number) => Promise<void>;
  removeGold: (amount: number) => Promise<void>;
  addGems: (amount: number) => Promise<void>;
  removeGems: (amount: number) => Promise<void>;
  setEnergy: (amount: number) => Promise<void>;

  // Hero actions
  addHero: (hero: Hero) => Promise<void>;
  removeHero: (heroId: string) => Promise<void>;
  updateActiveParty: (heroes: Hero[], skipAutoSave?: boolean) => Promise<void>;
  updateActivePartyIndices: (indices: number[]) => Promise<void>;
  fixDuplicateHeroes: () => Promise<{ duplicatesFixed: number; talentPointsAdded: number }>;

  // Inventory actions
  addItem: (item: Item) => Promise<void>;
  addItems: (items: Item[]) => Promise<void>; // Batch add items (optimized)
  removeItem: (itemId: string) => Promise<void>;
  updateInventory: (inventory: Inventory) => Promise<void>;

  // Gacha actions
  updateGachaState: (gachaState: GachaState) => Promise<void>;

  // World map actions
  updatePlayerPos: (x: number, y: number) => Promise<void>;
  updateWorldMap: (worldMap: WorldMap) => Promise<void>;
  addDiscoveredLocation: (location: { name: string; x: number; y: number; type: StaticObjectType }) => Promise<void>;

  // Save/Load actions
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;

  // Force update for UI refresh
  forceUpdate: () => void;
}

/**
 * Custom hook for centralized game state management
 *
 * Provides a complete game state and action interface with automatic database
 * synchronization. Manages heroes, inventory, equipment, resources, and world state.
 * Features auto-save with 2-second debouncing to optimize database writes.
 *
 * @param userEmail - Optional user email for authentication context
 * @returns Tuple of [GameState, GameStateActions] for reading and modifying state
 *
 * @example
 * ```typescript
 * const [gameState, gameActions] = useGameState(userEmail);
 *
 * // Read state
 * console.log(gameState.gold);
 *
 * // Modify state (auto-saves)
 * await gameActions.addGold(100);
 * await gameActions.addHero(newHero);
 * ```
 */
export function useGameState(userEmail?: string): [GameState, GameStateActions] {
  const [state, setState] = useState<GameState>({
    profile: null,
    profileLoading: true,
    playerName: 'Adventurer',
    playerLevel: 1,
    combatPower: 0,
    gold: 0,
    gems: 100,
    energy: ENERGY_CONFIG.MAX_ENERGY,
    maxEnergy: ENERGY_CONFIG.MAX_ENERGY,
    allHeroes: [],
    activeParty: [],
    activePartyIndices: [0, 1, 2, 3],
    inventory: new Inventory(50),
    worldMap: null,
    playerPos: { x: 25, y: 25 },
    discoveredLocations: [],
    gachaState: {
      summonCount: 0,
      lastFreeSummonDate: '',
      pitySummons: 0
    },
    loading: true,
    saving: false,
    error: null,
    syncStatus: 'idle',
    lastSaveTime: null
  });

  const [updateTrigger, setUpdateTrigger] = useState(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userIdRef = useRef<string | null>(null);
  const stateRef = useRef<GameState>(state);
  const hasLoadedRef = useRef(false); // Track if we've loaded data to prevent duplicate loads
  const isLoadingRef = useRef(false); // Track if we're currently loading to prevent concurrent loads
  const isSavingRef = useRef(false); // Track if we're currently saving to prevent concurrent saves
  const saveQueueRef = useRef<Promise<void> | null>(null); // Promise queue for sequential saves

  // Auto-save delay (ms)
  const AUTO_SAVE_DELAY = 2000;

  // Update stateRef whenever state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /**
   * Schedule auto-save with debouncing
   *
   * Cancels any pending save and schedules a new one after AUTO_SAVE_DELAY.
   * This prevents excessive database writes during rapid state changes.
   *
   * @example
   * ```typescript
   * scheduleAutoSave(); // Will save after 2000ms
   * ```
   */
  const scheduleAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (userIdRef.current && !stateRef.current.profileLoading) {
        await saveGameInternal();
      }
    }, AUTO_SAVE_DELAY);
  }, []);

  /**
   * Internal save function
   *
   * Saves the current game state to database including player profile,
   * heroes, equipment, and inventory. Called automatically by scheduleAutoSave.
   *
   * @returns Promise that resolves when save is complete
   *
   * @example
   * ```typescript
   * await saveGameInternal(); // Manual save trigger
   * ```
   */
  const saveGameInternal = async () => {
    if (!userIdRef.current) return;

    // CRITICAL: Use promise queue to prevent concurrent saves
    // Wait for any existing save to complete first
    while (saveQueueRef.current) {
      console.log('⏭️ Save already in progress, waiting...');
      await saveQueueRef.current;
      console.log('⏭️ Previous save completed');
    }

    // Create promise and set it IMMEDIATELY (synchronously) to prevent race condition
    let resolveSave: () => void;
    const savePromise = new Promise<void>((resolve) => {
      resolveSave = resolve;
    });
    saveQueueRef.current = savePromise;

    try {
      isSavingRef.current = true;
      setState(prev => ({ ...prev, saving: true, syncStatus: 'saving' }));

      // Use stateRef to get the most current state
      const currentState = stateRef.current;

      console.log('💾 Saving game with', currentState.allHeroes.length, 'heroes');
      console.log('[Save] Combat Power to save:', currentState.combatPower);

      // Save player profile (including gacha state, worldmap, and discovered locations)
      // IMPORTANT: Never save world_map_data as null - this would trigger map regeneration on Realtime update!
      // If worldMap is null during save (e.g., early combat power update), skip saving it.
      const profileUpdate: any = {
        nickname: currentState.playerName,
        player_level: currentState.playerLevel,
        gold: currentState.gold,
        gems: currentState.gems,
        energy: currentState.energy,
        max_energy: currentState.maxEnergy,
        combat_power: currentState.combatPower, // Add combat power to database
        current_world_x: currentState.playerPos.x,
        current_world_y: currentState.playerPos.y,
        discovered_locations: currentState.discoveredLocations.map(loc => JSON.stringify(loc)),
        gacha_summon_count: currentState.gachaState.summonCount,
        gacha_last_free_summon: currentState.gachaState.lastFreeSummonDate || null,
        gacha_pity_summons: currentState.gachaState.pitySummons
      };

      // Only include world_map_data if it exists (never overwrite with null)
      if (currentState.worldMap) {
        profileUpdate.world_map_data = currentState.worldMap;
      }

      // Log world map data for debugging
      if (currentState.worldMap) {
        const defeatedMonsters = currentState.worldMap.dynamicObjects.filter(obj => obj.type === 'wanderingMonster' && 'defeated' in obj && obj.defeated);
        console.log(`[Save] World map - Defeated monsters: ${defeatedMonsters.length}/${currentState.worldMap.dynamicObjects.filter(obj => obj.type === 'wanderingMonster').length}`);
        console.log(`[Save] Energy being saved: ${currentState.energy}/${currentState.maxEnergy}`);
      }

      console.log('[Save] Profile update data:', JSON.stringify(profileUpdate, null, 2));
      await PlayerProfileService.updateProfile(userIdRef.current!, profileUpdate);

      // Save game data (heroes, inventory, active party)
      await GameSaveService.saveGame(
        userIdRef.current!,
        'Auto Save',
        currentState.allHeroes,
        currentState.inventory,
        currentState.activeParty
      );

      console.log('✅ Auto-save completed');
      setState(prev => ({ ...prev, saving: false, syncStatus: 'success', lastSaveTime: new Date() }));
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
      setState(prev => ({ ...prev, saving: false, syncStatus: 'error' }));
    } finally {
      // CRITICAL: Always release the save lock, even if save failed
      isSavingRef.current = false;

      // Clear queue and resolve promise
      saveQueueRef.current = null;
      resolveSave();
    }
  };

  /**
   * Load game data from database
   *
   * Retrieves player profile, heroes, equipment, and inventory from database.
   * If no save exists, creates default starter heroes. Handles both new players
   * and existing saves.
   *
   * @param userId - User ID from authentication
   * @returns Promise that resolves when load is complete
   *
   * @example
   * ```typescript
   * await loadGameData('user-id-123');
   * ```
   */
  const loadGameData = async (userId: string) => {
    // Prevent concurrent loads using ref (synchronous check)
    if (isLoadingRef.current) {
      console.log('⏭️ loadGameData already in progress, skipping');
      return;
    }

    console.log('🔄 loadGameData called with userId:', userId);
    isLoadingRef.current = true;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get or create profile
      console.log('📝 Getting or creating profile...');
      const profileResult = await PlayerProfileService.getOrCreateProfile(userId);
      console.log('📝 Profile result:', profileResult);

      if (!profileResult.success || !profileResult.profile) {
        throw new Error(profileResult.message);
      }

      const profile = profileResult.profile;
      console.log('👤 Profile loaded:', {
        nickname: profile.nickname,
        level: profile.player_level,
        isNew: profileResult.isNew
      });

      // Try to load saved game
      console.log('💾 Loading game save...');
      const saveResult = await GameSaveService.loadGame(userId, 'Auto Save');
      console.log('💾 Save result:', {
        success: saveResult.success,
        hasData: !!saveResult.data,
        heroCount: saveResult.data?.heroes.length || 0,
        message: saveResult.message
      });

      let heroes: Hero[] = [];
      let inventory = new Inventory(50);
      inventory.gold = profile.gold;

      if (saveResult.success && saveResult.data && saveResult.data.heroes.length > 0) {
        console.log('🎮 Loading heroes from save data...');

        // Create a map to store hero with their party order
        const heroesWithPartyOrder: Array<{hero: Hero, partyOrder: number | null}> = [];

        // Reconstruct heroes from database
        saveResult.data.heroes.forEach(dbHero => {
          const hero = new Hero(dbHero.hero_name, dbHero.hero_class as any, dbHero.level, dbHero.rarity as any || 'common');
          hero.id = dbHero.id;
          hero.experience = dbHero.experience;
          hero.requiredXP = dbHero.required_xp;
          hero.talentPoints = dbHero.talent_points || 0;
          hero.currentHP = dbHero.current_hp;
          hero.maxHP = dbHero.max_hp;
          hero.ATK = dbHero.atk;
          hero.DEF = dbHero.def;
          hero.SPD = dbHero.spd;
          hero.CRIT = dbHero.crit;

          // Initialize equipment
          hero.equipment = new Equipment(hero);

          // Load equipped items
          const heroEquipment = saveResult.data!.equipmentSlots.filter(
            eq => eq.hero_id === dbHero.id
          );

          heroEquipment.forEach(eq => {
            if (eq.item_id) {
              // Reconstruct item from equipment slot data
              const item = new Item({
                id: eq.item_id,
                name: eq.item_name!,
                type: eq.item_type as any,
                slot: eq.slot as any,
                icon: eq.icon!,
                level: eq.level!,
                rarity: eq.rarity as any,
                stats: eq.base_stats as any || {},
                goldValue: eq.gold_value!,
                enchantLevel: eq.enchant_level || 0,
                setId: eq.set_id || undefined,
                setName: eq.set_name || undefined
              });

              hero.equipment?.equip(item);
            }
          });

          heroesWithPartyOrder.push({hero, partyOrder: dbHero.party_order});
        });

        // Extract all heroes
        heroes = heroesWithPartyOrder.map(item => item.hero);

        // Reconstruct inventory items
        saveResult.data.inventoryItems.forEach(dbItem => {
          const item = new Item({
            id: dbItem.item_id,
            name: dbItem.item_name,
            type: dbItem.item_type as any,
            slot: dbItem.slot as any,
            icon: dbItem.icon,
            level: dbItem.level,
            rarity: dbItem.rarity as any,
            stats: dbItem.base_stats as any || {},
            goldValue: dbItem.gold_value,
            enchantLevel: dbItem.enchant_level,
            setId: dbItem.set_id || undefined,
            setName: dbItem.set_name || undefined
          });

          inventory.addItem(item);
        });

        inventory.maxSlots = saveResult.data.gameSave.inventory_max_slots;
        console.log(`✅ Loaded ${heroes.length} heroes from database`);
      } else {
        // No heroes in save or new player - create starter heroes
        console.log('🆕 Creating starter heroes...', profileResult.isNew ? '(New Player)' : '(Empty Save)');
        heroes = [
          new Hero('Theron', 'warrior', 1),
          new Hero('Lyra', 'archer', 1),
          new Hero('Zephyr', 'mage', 1),
          new Hero('Elena', 'cleric', 1)
        ];

        heroes.forEach(hero => {
          hero.equipment = new Equipment(hero);
        });
        console.log(`✅ Created ${heroes.length} starter heroes`);
      }

      console.log('📊 Final heroes array length:', heroes.length);

      // Deduplicate heroes by name + class instead of ID
      // This prevents duplicate heroes from appearing even if they have different IDs
      const uniqueHeroKeys = new Set<string>();
      const deduplicatedHeroes: Hero[] = [];
      heroes.forEach(hero => {
        const heroKey = `${hero.name}-${hero.class}`;
        if (!uniqueHeroKeys.has(heroKey)) {
          uniqueHeroKeys.add(heroKey);
          deduplicatedHeroes.push(hero);
        } else {
          console.warn('⚠️ Duplicate hero detected during load (same name+class), skipping:', hero.name, hero.class, hero.id);
        }
      });
      heroes = deduplicatedHeroes;
      console.log('📊 After deduplication:', heroes.length, 'heroes (originally had', deduplicatedHeroes.length === heroes.length ? 'no duplicates' : heroes.length + ' duplicates removed', ')');

      // Build active party from party_order (if available)
      let activeParty: Hero[];
      let activePartyIndices: number[];

      if (saveResult.success && saveResult.data && saveResult.data.heroes.length > 0) {
        // Sort heroes by party_order and filter those in party
        const heroesWithPartyOrder: Array<{hero: Hero, partyOrder: number | null, index: number}> = heroes
          .map((hero, index) => {
            const dbHero = saveResult.data!.heroes.find(db => db.id === hero.id);
            return {hero, partyOrder: dbHero?.party_order ?? null, index};
          })
          .filter(item => item.partyOrder !== null)
          .sort((a, b) => (a.partyOrder as number) - (b.partyOrder as number));

        activeParty = heroesWithPartyOrder.map(item => item.hero);
        activePartyIndices = heroesWithPartyOrder.map(item => item.index);

        console.log('🎯 Loaded active party from party_order:', {
          partySize: activeParty.length,
          partyNames: activeParty.map(h => h.name).join(', ')
        });
      } else {
        // New player - default party (first 4 heroes)
        activeParty = heroes.slice(0, 4);
        activePartyIndices = heroes.length >= 4 ? [0, 1, 2, 3] : Array.from({ length: heroes.length }, (_, i) => i);
      }

      // Migrate max_energy if needed (for existing players)
      if (profile.max_energy < ENERGY_CONFIG.MAX_ENERGY) {
        console.log(`⚡ Migrating max_energy from ${profile.max_energy} to ${ENERGY_CONFIG.MAX_ENERGY}`);
        await PlayerProfileService.updateProfile(userId, {
          max_energy: ENERGY_CONFIG.MAX_ENERGY
        });
      }

      // Log world map data for debugging
      if (profile.world_map_data) {
        const defeatedMonsters = profile.world_map_data.dynamicObjects?.filter((obj: any) => obj.type === 'wanderingMonster' && obj.defeated) || [];
        console.log(`[Load] World map - Defeated monsters: ${defeatedMonsters.length}/${profile.world_map_data.dynamicObjects?.filter((obj: any) => obj.type === 'wanderingMonster').length || 0}`);
        console.log(`[Load] Energy being loaded: ${profile.energy}/${ENERGY_CONFIG.MAX_ENERGY}`);
      }

      setState(prev => {
        console.log('📊 setState in loadGameData - prev.loading:', prev.loading);
        console.log('   prev.allHeroes.length:', prev.allHeroes.length);
        console.log('   prev.activeParty.length:', prev.activeParty.length);
        console.log('   heroes to load:', heroes.length);
        console.log('   activeParty to load:', activeParty.length);

        // IMPORTANT: React StrictMode calls setState twice with the SAME prev state
        // We need to check if we're in the middle of initial load and return early
        // to prevent both calls from returning new state

        // Skip duplicate detection if prev is empty (initial load)
        // Both StrictMode calls will see empty prev, so we let both through
        // React will automatically merge them correctly

        // Additional safety check: detect duplicate loads
        const existingHeroIds = new Set(prev.allHeroes.map(h => h.id));

        // If we have existing heroes loaded AND they're not just starter heroes, check for duplicate load
        if (prev.allHeroes.length >= 4 && heroes.length > 0) {
          // Count how many heroes overlap
          const overlapCount = heroes.filter(h => existingHeroIds.has(h.id)).length;
          const overlapPercentage = (overlapCount / heroes.length) * 100;

          // IMPORTANT: Only block if BOTH conditions are met:
          // 1. High overlap (>80%)
          // 2. Same or very similar hero count (within 20% difference)
          const heroCountDiff = Math.abs(prev.allHeroes.length - heroes.length);
          const maxDiff = Math.max(2, Math.ceil(heroes.length * 0.2));
          const isSimilarCount = heroCountDiff <= maxDiff;

          if (overlapPercentage > 80 && isSimilarCount) {
            console.warn('⚠️ Detected duplicate load - ignoring!');
            console.warn(`   Overlap: ${overlapCount}/${heroes.length} (${overlapPercentage.toFixed(0)}%)`);
            console.warn(`   Count difference: ${heroCountDiff} (Existing: ${prev.allHeroes.length}, New: ${heroes.length})`);

            // Check if prev already has data loaded - if yes, just ensure loading is false
            if (prev.allHeroes.length > 0 && prev.activeParty.length > 0) {
              console.warn('   ⚠️ Returning prev WITH loading: false (data already loaded)');
              return {
                ...prev,
                loading: false,
                profileLoading: false
              };
            } else {
              // prev is empty (initial state) - allow load to proceed
              console.warn('   ⚠️ prev is empty, allowing load to proceed');
            }
          } else if (overlapCount > 0 && overlapPercentage > 30 && isSimilarCount) {
            // Moderate overlap with similar count - add only new heroes (gacha case)
            const trulyNewHeroes = heroes.filter(h => !existingHeroIds.has(h.id));
            if (trulyNewHeroes.length > 0) {
              console.log(`   Partial overlap (${overlapPercentage.toFixed(0)}%), adding ${trulyNewHeroes.length} new heroes`);
              heroes = [...prev.allHeroes, ...trulyNewHeroes];
            } else {
              console.log('   No new heroes to add');
              console.warn('   ⚠️ Returning prev WITH loading: false to prevent stuck loading screen!');
              return {
                ...prev,
                loading: false,
                profileLoading: false
              };
            }
          }
          // Low overlap or different count - allow full reload
        }

        console.log('✅ setState returning NEW state with loading: false');
        const newState = {
          ...prev,
          profile,
          profileLoading: false,
          playerName: profile.nickname || 'Adventurer',
          playerLevel: profile.player_level,
          gold: profile.gold,
          gems: profile.gems,
          energy: Math.min(profile.energy, ENERGY_CONFIG.MAX_ENERGY),
          maxEnergy: ENERGY_CONFIG.MAX_ENERGY,
          allHeroes: heroes,
          activeParty,
          activePartyIndices,
          inventory,
          playerPos: { x: profile.current_world_x, y: profile.current_world_y },
          worldMap: profile.world_map_data || null,
          discoveredLocations: (profile.discovered_locations || []).map(str => {
            try {
              return JSON.parse(str);
            } catch {
              return { name: '', x: 0, y: 0, type: 'town' as const };
            }
          }),
          gachaState: {
            summonCount: profile.gacha_summon_count || 0,
            lastFreeSummonDate: profile.gacha_last_free_summon || '',
            pitySummons: profile.gacha_pity_summons || 0
          },
          loading: false
        };
        console.log('✅ NEW STATE - allHeroes.length:', newState.allHeroes.length);
        console.log('✅ NEW STATE - activeParty.length:', newState.activeParty.length);

        // CRITICAL: Ensure loading is ALWAYS false after successful load
        if (newState.loading !== false) {
          console.error('❌ BUG: loading should be false but is', newState.loading);
          newState.loading = false;
        }

        return newState;
      });

      console.log('✅ Game data loaded', profileResult.isNew ? '(New Player)' : '(Existing Save)', `- ${heroes.length} heroes in state`);
      console.log('🎯 Loading state should be false now (set in setState above)');

      // CRITICAL: Verify state was actually updated
      // In StrictMode, the second mount might interfere, so we verify after setState
      setTimeout(() => {
        console.log('🔍 Verification timeout running...');
        const currentState = stateRef.current;
        console.log('🔍 Current state:', {
          loading: currentState.loading,
          allHeroesLength: currentState.allHeroes.length,
          heroesLoaded: heroes.length
        });

        if (currentState.allHeroes.length === 0 && heroes.length > 0) {
          console.error('❌ CRITICAL: State was not updated! Forcing update...');
          setState(prev => ({
            ...prev,
            allHeroes: heroes,
            activeParty,
            activePartyIndices,
            loading: false,
            profileLoading: false
          }));
          // Force re-render
          setUpdateTrigger(prev => prev + 1);
        } else if (currentState.loading === true) {
          console.error('❌ CRITICAL: Loading stuck at true! Forcing false...');
          setState(prev => ({ ...prev, loading: false, profileLoading: false }));
          // Force re-render
          setUpdateTrigger(prev => prev + 1);
        } else {
          console.log('✅ State is correct, no forced update needed');
          // Force re-render anyway to ensure component gets the updated state
          console.log('🔄 Forcing re-render to propagate state to component...');
          // Create a new state object to force React to re-render
          setState(prev => ({ ...prev }));
        }
      }, 100);

      // DISABLED: Auto-fix duplicates - caused issues with deleting all heroes
      // The function needs improvement to properly detect duplicates by ID, not name+class
      // setTimeout(() => {
      //   gameActions.fixDuplicateHeroes().then(result => {
      //     if (result.duplicatesFixed > 0) {
      //       console.log(`🔧 Auto-fixed ${result.duplicatesFixed} duplicate heroes on load`);
      //     }
      //   });
      // }, 1000);
    } catch (error: any) {
      console.error('❌ Failed to load game:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        profileLoading: false,
        error: error.message
      }));
    } finally {
      // Reset loading flag
      isLoadingRef.current = false;
    }
  };

  /**
   * Initialize game state on mount - only load once per session
   */
  useEffect(() => {
    const initializeGameState = async () => {
      const session = await AuthService.getCurrentSession();

      if (session?.user?.id) {
        const loadingFlagKey = `loading-${session.user.id}`;

        // CRITICAL FIX: On component mount, clear any stale sessionStorage loading flags
        // This ensures fresh start on each page load/refresh
        if (!hasLoadedRef.current) {
          const existingFlag = sessionStorage.getItem(loadingFlagKey);
          if (existingFlag) {
            console.log('🧹 Clearing stale loading flag on mount');
            sessionStorage.removeItem(loadingFlagKey);
            sessionStorage.removeItem(`${loadingFlagKey}-timestamp`);
          }
        }

        // Check if we already have this user's data loaded AND if user ID hasn't changed
        const isSameUser = userIdRef.current === session.user.id;
        const alreadyLoaded = hasLoadedRef.current && isSameUser;

        // Additional check: prevent loading if we're currently loading
        // But first, clean up stale loading flags (older than 10 seconds)
        const loadingFlagTimestamp = sessionStorage.getItem(`${loadingFlagKey}-timestamp`);

        if (loadingFlagTimestamp) {
          const flagAge = Date.now() - parseInt(loadingFlagTimestamp);
          if (flagAge > 10000) { // 10 seconds - flag is stale
            console.log('🧹 Clearing stale loading flag (age: ' + Math.round(flagAge / 1000) + 's)');
            sessionStorage.removeItem(loadingFlagKey);
            sessionStorage.removeItem(`${loadingFlagKey}-timestamp`);
            // Reset state to ensure UI updates after clearing stale flag
            console.log('🔄 Resetting loading state after clearing stale flag');
            setState(prev => ({ ...prev, loading: false, profileLoading: false }));
          }
        } else {
          // If flag exists but has no timestamp (old version), clean it up
          const currentlyLoading = sessionStorage.getItem(loadingFlagKey);
          if (currentlyLoading === 'true') {
            console.log('🧹 Clearing old loading flag without timestamp');
            sessionStorage.removeItem(loadingFlagKey);
            // Reset state to ensure UI updates after clearing old flag
            console.log('🔄 Resetting loading state after clearing old flag');
            setState(prev => ({ ...prev, loading: false, profileLoading: false }));
          }
        }

        const currentlyLoading = sessionStorage.getItem(loadingFlagKey);
        if (currentlyLoading === 'true') {
          console.log('⏭️ Already loading data, skipping duplicate load');

          // IMPORTANT: In StrictMode, the second mount may see loading: true
          // Check if we actually have data loaded (from the first mount's completion)
          // and ensure loading state reflects reality
          if (hasLoadedRef.current && stateRef.current.allHeroes.length > 0) {
            console.log('⏭️ Data already loaded by first mount, ensuring loading: false');
            setState(prev => ({ ...prev, loading: false, profileLoading: false }));
          }
          return;
        }

        if (!alreadyLoaded) {
          console.log('🔄 Loading game data for user:', session.user.id);

          // Set the flag IMMEDIATELY to prevent race conditions
          hasLoadedRef.current = true;
          userIdRef.current = session.user.id;
          const loadingFlagKey = `loading-${session.user.id}`;
          sessionStorage.setItem(loadingFlagKey, 'true');
          sessionStorage.setItem(`${loadingFlagKey}-timestamp`, Date.now().toString());

          try {
            await loadGameData(session.user.id);
          } finally {
            // Clear loading flag and timestamp after completion
            sessionStorage.removeItem(loadingFlagKey);
            sessionStorage.removeItem(`${loadingFlagKey}-timestamp`);
          }
        } else {
          console.log('⏭️ Skipping reload - data already loaded for same user');
          setState(prev => ({ ...prev, loading: false, profileLoading: false }));
        }
      } else {
        // Not logged in - use local state
        hasLoadedRef.current = false;
        userIdRef.current = null;
        setState(prev => ({ ...prev, loading: false, profileLoading: false }));
      }
    };

    initializeGameState();

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // IMPORTANT: In StrictMode, cleanup runs between double mounts
      // Clear sessionStorage flags to ensure clean state for remount
      if (userIdRef.current) {
        const loadingFlagKey = `loading-${userIdRef.current}`;
        sessionStorage.removeItem(loadingFlagKey);
        sessionStorage.removeItem(`${loadingFlagKey}-timestamp`);
      }
    };
  }, []); // Empty deps - only run once on mount

  /**
   * Subscribe to real-time profile changes after userId is loaded
   */
  useEffect(() => {
    if (!userIdRef.current) return;

    console.log('🔌 Setting up Realtime subscription for user:', userIdRef.current);

    const profileSubscription = supabase
      .channel(`profile:${userIdRef.current}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'player_profiles',
          filter: `user_id=eq.${userIdRef.current}`
        },
        (payload) => {
          console.log('🔄 Profile updated via realtime:', payload.new);
          const updatedProfile = payload.new as PlayerProfile;

          setState(prev => {
            // IMPORTANT: Ignore world_map_data from Realtime updates!
            // World map should only be loaded during initial game load, not from profile updates.
            // This prevents map regeneration caused by JSON serialization differences.

            // CRITICAL: Always preserve allHeroes and activeParty from prev state!
            // Realtime updates should NEVER overwrite hero data

            return {
              ...prev,
              profile: updatedProfile,
              energy: Math.min(updatedProfile.energy, ENERGY_CONFIG.MAX_ENERGY),
              maxEnergy: ENERGY_CONFIG.MAX_ENERGY,
              gold: updatedProfile.gold,
              gems: updatedProfile.gems,
              playerLevel: updatedProfile.player_level,
              // KEEP current worldMap - do not overwrite from Realtime
              worldMap: prev.worldMap,
              // KEEP current heroes - do not overwrite from Realtime
              allHeroes: prev.allHeroes,
              activeParty: prev.activeParty,
              activePartyIndices: prev.activePartyIndices,
              discoveredLocations: updatedProfile.discovered_locations
                ? updatedProfile.discovered_locations.map(str => {
                    try { return JSON.parse(str); }
                    catch { return { name: '', x: 0, y: 0, type: 'town' as const }; }
                  })
                : prev.discoveredLocations
            };
          });
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up Realtime subscription');
      supabase.removeChannel(profileSubscription);
    };
  }, [state.profile]);

  /**
   * Periodic update for dynamic objects (wandering monsters, traveling merchants)
   * Runs every 5 minutes to check for respawns and despawns
   */
  useEffect(() => {
    if (!state.worldMap || !userIdRef.current) return;

    console.log('⏰ Starting dynamic object updater (5-minute interval)');

    // Update immediately on mount
    const updateDynamicObjects = () => {
      const currentWorldMap = stateRef.current.worldMap;
      if (!currentWorldMap) return;

      console.log('🔄 Checking dynamic objects for updates...');
      const result = DynamicObjectUpdaterService.updateDynamicObjects(currentWorldMap);

      if (result.updated) {
        console.log('✅ Dynamic objects updated, saving to database...');
        setState(prev => ({ ...prev, worldMap: result.worldMap }));
        // Auto-save will be triggered by the state change
        scheduleAutoSave();
      } else {
        console.log('⏭️ No dynamic object updates needed');
      }
    };

    // Run immediately
    updateDynamicObjects();

    // Then run every 5 minutes
    const intervalId = setInterval(updateDynamicObjects, 5 * 60 * 1000);

    return () => {
      console.log('⏰ Cleaning up dynamic object updater');
      clearInterval(intervalId);
    };
  }, [state.worldMap, scheduleAutoSave]);

  /**
   * Actions
   */
  const actions: GameStateActions = {
    updateNickname: async (nickname: string) => {
      setState(prev => ({ ...prev, playerName: nickname }));
      scheduleAutoSave();
    },

    updatePlayerLevel: async (level: number) => {
      setState(prev => ({ ...prev, playerLevel: level }));
      scheduleAutoSave();
    },

    addGold: async (amount: number) => {
      setState(prev => ({
        ...prev,
        gold: prev.gold + amount,
        inventory: (() => {
          const inv = prev.inventory;
          inv.gold += amount;
          return inv;
        })()
      }));
      scheduleAutoSave();
    },

    removeGold: async (amount: number) => {
      setState(prev => ({
        ...prev,
        gold: Math.max(0, prev.gold - amount),
        inventory: (() => {
          const inv = prev.inventory;
          inv.gold = Math.max(0, inv.gold - amount);
          return inv;
        })()
      }));
      scheduleAutoSave();
    },

    addGems: async (amount: number) => {
      setState(prev => ({ ...prev, gems: prev.gems + amount }));
      scheduleAutoSave();
    },

    removeGems: async (amount: number) => {
      setState(prev => ({ ...prev, gems: Math.max(0, prev.gems - amount) }));
      scheduleAutoSave();
    },

    setEnergy: async (amount: number) => {
      setState(prev => ({ ...prev, energy: Math.min(amount, prev.maxEnergy) }));
      scheduleAutoSave();
    },

    addHero: async (hero: Hero) => {
      console.log('🎭 Adding hero to collection:', hero.name, hero.id);
      setState(prev => {
        // Check if hero already exists (prevent duplicates)
        const heroExists = prev.allHeroes.some(h => h.id === hero.id);
        if (heroExists) {
          console.warn('⚠️ Hero already exists in collection, skipping:', hero.name, hero.id);
          return prev; // No change
        }

        const newAllHeroes = [...prev.allHeroes, hero];
        console.log('📊 All heroes count after add:', newAllHeroes.length);

        return {
          ...prev,
          allHeroes: newAllHeroes
        };
      });
      scheduleAutoSave();
    },

    removeHero: async (heroId: string) => {
      setState(prev => ({
        ...prev,
        allHeroes: prev.allHeroes.filter(h => h.id !== heroId),
        activeParty: prev.activeParty.filter(h => h.id !== heroId)
      }));
      scheduleAutoSave();
    },

    updateActiveParty: async (heroes: Hero[], skipAutoSave = false) => {
      // IMPORTANT: Remove duplicates and limit to 4 heroes to prevent data corruption
      const uniqueHeroes = heroes
        .filter((hero, index, self) =>
          index === self.findIndex(h => h.id === hero.id)
        )
        .slice(0, 4);

      if (uniqueHeroes.length !== heroes.length) {
        console.warn(`⚠️ Prevented duplicate heroes in party! Original: ${heroes.length}, After dedup: ${uniqueHeroes.length}`);
      }

      setState(prev => {
        // Sync updated heroes to allHeroes array
        // Heroes are already mutated in-place, we just need to ensure the references are correct
        const updatedHeroMap = new Map(uniqueHeroes.map(h => [h.id, h]));

        const updatedAllHeroes = prev.allHeroes.map(hero => {
          const updatedHero = updatedHeroMap.get(hero.id);
          if (updatedHero) {
            console.log(`🔄 Syncing hero ${hero.name}:`, {
              hp: updatedHero.currentHP,
              maxHP: updatedHero.maxHP,
              level: updatedHero.level,
              xp: updatedHero.experience
            });
            // Return the same hero reference (already mutated in combat)
            return updatedHero;
          }
          return hero;
        });

        console.log('✅ Updated activeParty and synced changes to allHeroes');
        console.log('📊 Active party heroes:', uniqueHeroes.map(h => ({ name: h.name, hp: h.currentHP, level: h.level, xp: h.experience })));
        console.log('📊 All heroes after sync:', updatedAllHeroes.map(h => ({ name: h.name, hp: h.currentHP, level: h.level, xp: h.experience })));

        return {
          ...prev,
          activeParty: [...uniqueHeroes], // New array reference to trigger React update
          allHeroes: [...updatedAllHeroes] // New array reference to trigger React update
        };
      });

      // Force re-render to propagate changes to components
      setUpdateTrigger(prev => prev + 1);

      // Only auto-save if not explicitly skipped (e.g., during combat flow where manual save follows)
      if (!skipAutoSave) {
        scheduleAutoSave();
      } else {
        console.log('⏭️ Skipping auto-save (manual save will follow)');
      }
    },

    updateActivePartyIndices: async (indices: number[]) => {
      setState(prev => ({
        ...prev,
        activePartyIndices: indices,
        activeParty: indices.map(i => prev.allHeroes[i]).filter(Boolean)
      }));
      scheduleAutoSave();
    },

    addItem: async (item: Item) => {
      setState(prev => {
        // Create a new inventory instance to trigger React re-render
        const newInventory = new Inventory(prev.inventory.maxSlots);
        newInventory.gold = prev.inventory.gold;
        newInventory.items = [...prev.inventory.items, item];
        return { ...prev, inventory: newInventory };
      });
      scheduleAutoSave();
    },

    // Batch add multiple items at once (optimized - single setState)
    addItems: async (items: Item[]) => {
      if (items.length === 0) return;

      setState(prev => {
        // Create a new inventory instance to trigger React re-render
        const newInventory = new Inventory(prev.inventory.maxSlots);
        newInventory.gold = prev.inventory.gold;
        newInventory.items = [...prev.inventory.items, ...items];
        return { ...prev, inventory: newInventory };
      });
      scheduleAutoSave();
    },

    removeItem: async (itemId: string) => {
      setState(prev => {
        const inv = prev.inventory;
        inv.removeItem(itemId);
        return { ...prev, inventory: inv };
      });
      scheduleAutoSave();
    },

    updateInventory: async (inventory: Inventory) => {
      setState(prev => ({ ...prev, inventory }));
      scheduleAutoSave();
    },

    updateGachaState: async (gachaState: GachaState) => {
      setState(prev => ({ ...prev, gachaState }));
      scheduleAutoSave();
    },

    updatePlayerPos: async (x: number, y: number) => {
      setState(prev => ({ ...prev, playerPos: { x, y } }));
      scheduleAutoSave();
    },

    updateWorldMap: async (worldMap: WorldMap) => {
      setState(prev => ({ ...prev, worldMap }));
      scheduleAutoSave();
    },

    addDiscoveredLocation: async (location: { name: string; x: number; y: number; type: StaticObjectType }) => {
      setState(prev => {
        // Check if location is already discovered
        const exists = prev.discoveredLocations.some(
          loc => loc.x === location.x && loc.y === location.y
        );
        if (exists) return prev;

        return {
          ...prev,
          discoveredLocations: [...prev.discoveredLocations, location]
        };
      });
      scheduleAutoSave();
    },

    /**
     * Fix duplicate heroes by converting duplicates to talent points
     *
     * @returns Object with fixed count and talent points added
     *
     * @example
     * ```typescript
     * const result = await gameActions.fixDuplicateHeroes();
     * console.log(`Fixed ${result.duplicatesFixed} duplicates, added ${result.talentPointsAdded} talent points`);
     * ```
     */
    fixDuplicateHeroes: async () => {
      console.log('🔧 Checking for duplicate heroes...');

      return new Promise<{ duplicatesFixed: number; talentPointsAdded: number }>((resolve) => {
        setState(prev => {
          const heroMap = new Map<string, Hero[]>();
          let duplicatesFixed = 0;
          let talentPointsAdded = 0;

          // Group heroes by name+class (same hero type)
          prev.allHeroes.forEach(hero => {
            const key = `${hero.name}-${hero.class}`;
            if (!heroMap.has(key)) {
              heroMap.set(key, []);
            }
            heroMap.get(key)!.push(hero);
          });

          // Find duplicates and convert to talents
          const uniqueHeroes: Hero[] = [];

          heroMap.forEach((heroes, key) => {
            if (heroes.length > 1) {
              console.log(`🔍 Found ${heroes.length} duplicates of ${key}`);

              // Sort by level and talent points (keep the best one)
              heroes.sort((a, b) => {
                if (a.level !== b.level) return b.level - a.level;
                return (b.talentPoints || 0) - (a.talentPoints || 0);
              });

              // Keep the first (best) hero
              const mainHero = heroes[0];
              uniqueHeroes.push(mainHero);

              // Convert duplicates to talent points
              const duplicates = heroes.slice(1);
              const talentPoints = duplicates.length; // 1 talent point per duplicate

              mainHero.talentPoints = (mainHero.talentPoints || 0) + talentPoints;

              duplicatesFixed += duplicates.length;
              talentPointsAdded += talentPoints;

              console.log(`  ✅ Kept ${mainHero.name} (Lv${mainHero.level}, Talents: ${mainHero.talentPoints})`);
              console.log(`  🗑️ Removed ${duplicates.length} duplicates → +${talentPoints} talent points`);
            } else {
              // No duplicates, keep as is
              uniqueHeroes.push(heroes[0]);
            }
          });

          if (duplicatesFixed > 0) {
            console.log(`✅ Fixed ${duplicatesFixed} duplicate heroes, added ${talentPointsAdded} talent points`);

            // Update active party to remove any duplicates
            const newActiveParty = prev.activeParty
              .map(partyHero => {
                // Find the kept version of this hero
                return uniqueHeroes.find(h =>
                  h.name === partyHero.name && h.class === partyHero.class
                );
              })
              .filter(Boolean) as Hero[];

            // Ensure no duplicates in active party
            const uniqueActiveParty = newActiveParty.filter((hero, index, self) =>
              index === self.findIndex(h => h.id === hero.id)
            );

            resolve({ duplicatesFixed, talentPointsAdded });

            return {
              ...prev,
              allHeroes: uniqueHeroes,
              activeParty: uniqueActiveParty
            };
          } else {
            console.log('✅ No duplicate heroes found');
            resolve({ duplicatesFixed: 0, talentPointsAdded: 0 });
            return prev;
          }
        });

        // Save after fixing
        scheduleAutoSave();
      });
    },

    saveGame: async () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      await saveGameInternal();
    },

    loadGame: async () => {
      if (userIdRef.current) {
        await loadGameData(userIdRef.current);
      }
    },

    forceUpdate: () => {
      setUpdateTrigger(prev => prev + 1);
    }
  };

  /**
   * Calculate combat power whenever active party or heroes change
   *
   * Combat power = sum of all active party hero scores
   *
   * IMPORTANT: We need to depend on state.allHeroes because equipment changes
   * mutate hero objects without changing the activeParty array reference.
   * This ensures combat power recalculates when equipment is changed.
   */
  useEffect(() => {
    // Skip calculation during initial load to prevent race conditions
    if (state.loading || state.profileLoading) {
      console.log('[Combat Power] Skipping calculation during loading');
      return;
    }

    let totalScore = 0;

    console.log('[Combat Power] Calculating combat power for active party:', state.activeParty.length, 'heroes');
    for (const hero of state.activeParty) {
      if (hero && hero.isAlive) {
        const heroScore = hero.getScore();
        console.log(`[Combat Power] Hero ${hero.name}: Score = ${heroScore}, Level = ${hero.level}, Alive = ${hero.isAlive}`);
        totalScore += heroScore;
      }
    }

    console.log(`[Combat Power] Total calculated: ${totalScore}, Current state: ${state.combatPower}`);

    // Only update if changed to avoid infinite loops
    if (totalScore !== state.combatPower) {
      console.log(`[Combat Power] Combat power changed from ${state.combatPower} to ${Math.floor(totalScore)}, triggering save`);
      setState(prev => {
        console.log('[Combat Power] setState - prev.allHeroes.length:', prev.allHeroes.length);
        console.log('[Combat Power] setState - prev.activeParty.length:', prev.activeParty.length);
        return {
          ...prev,
          combatPower: Math.floor(totalScore)
        };
      });

      // Trigger save if combat power changed (ensures it gets saved to database)
      scheduleAutoSave();
    }
  }, [state.activeParty, state.activeParty.length, state.allHeroes, state.loading, state.profileLoading, scheduleAutoSave]);

  return [state, actions];
}
