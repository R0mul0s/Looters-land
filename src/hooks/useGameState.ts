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
  updateActiveParty: (heroes: Hero[]) => Promise<void>;
  updateActivePartyIndices: (indices: number[]) => Promise<void>;

  // Inventory actions
  addItem: (item: Item) => Promise<void>;
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

    setState(prev => ({ ...prev, saving: true, syncStatus: 'saving' }));

    try {
      // Use stateRef to get the most current state
      const currentState = stateRef.current;

      console.log('💾 Saving game with', currentState.allHeroes.length, 'heroes');
      console.log('[Save] Combat Power to save:', currentState.combatPower);

      // Save player profile (including gacha state, worldmap, and discovered locations)
      const profileUpdate = {
        nickname: currentState.playerName,
        player_level: currentState.playerLevel,
        gold: currentState.gold,
        gems: currentState.gems,
        energy: currentState.energy,
        max_energy: currentState.maxEnergy,
        combat_power: currentState.combatPower, // Add combat power to database
        current_world_x: currentState.playerPos.x,
        current_world_y: currentState.playerPos.y,
        world_map_data: currentState.worldMap,
        discovered_locations: currentState.discoveredLocations.map(loc => JSON.stringify(loc)),
        gacha_summon_count: currentState.gachaState.summonCount,
        gacha_last_free_summon: currentState.gachaState.lastFreeSummonDate || null,
        gacha_pity_summons: currentState.gachaState.pitySummons
      };

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
    console.log('🔄 loadGameData called with userId:', userId);
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

      setState(prev => ({
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
      }));

      console.log('✅ Game data loaded', profileResult.isNew ? '(New Player)' : '(Existing Save)', `- ${heroes.length} heroes in state`);
    } catch (error: any) {
      console.error('❌ Failed to load game:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  /**
   * Initialize game state on mount - only load once per session
   */
  useEffect(() => {
    const initializeGameState = async () => {
      const session = await AuthService.getCurrentSession();

      if (session?.user?.id) {
        // Check if we already have this user's data loaded AND if user ID hasn't changed
        const isSameUser = userIdRef.current === session.user.id;
        const alreadyLoaded = hasLoadedRef.current && isSameUser;

        if (!alreadyLoaded) {
          console.log('🔄 Loading game data for user:', session.user.id);

          // Set the flag IMMEDIATELY to prevent race conditions
          hasLoadedRef.current = true;
          userIdRef.current = session.user.id;

          await loadGameData(session.user.id);
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
    };
  }, [userEmail]);

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
            // Check if map was reset (world_map_data became null)
            const wasMapReset = !updatedProfile.world_map_data && prev.worldMap;
            if (wasMapReset) {
              console.log('🗺️ World map reset detected - generating new daily map!');
            }

            return {
              ...prev,
              profile: updatedProfile,
              energy: Math.min(updatedProfile.energy, ENERGY_CONFIG.MAX_ENERGY),
              maxEnergy: ENERGY_CONFIG.MAX_ENERGY,
              gold: updatedProfile.gold,
              gems: updatedProfile.gems,
              playerLevel: updatedProfile.player_level,
              // Accept null to allow map reset
              worldMap: updatedProfile.world_map_data ?? (wasMapReset ? null : prev.worldMap),
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

    updateActiveParty: async (heroes: Hero[]) => {
      // IMPORTANT: Remove duplicates and limit to 4 heroes to prevent data corruption
      const uniqueHeroes = heroes
        .filter((hero, index, self) =>
          index === self.findIndex(h => h.id === hero.id)
        )
        .slice(0, 4);

      if (uniqueHeroes.length !== heroes.length) {
        console.warn(`⚠️ Prevented duplicate heroes in party! Original: ${heroes.length}, After dedup: ${uniqueHeroes.length}`);
      }

      setState(prev => ({ ...prev, activeParty: uniqueHeroes }));
      scheduleAutoSave();
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
      setState(prev => ({
        ...prev,
        combatPower: Math.floor(totalScore)
      }));

      // Trigger save if combat power changed (ensures it gets saved to database)
      scheduleAutoSave();
    }
  }, [state.activeParty, state.activeParty.length, state.allHeroes, scheduleAutoSave]);

  return [state, actions];
}
