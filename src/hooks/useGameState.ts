/**
 * useGameState Hook - Centralized game state management with database sync
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-08
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
import type { WorldMap } from '../types/worldmap.types';
import type { GachaState } from '../types/hero.types';

interface GameState {
  // Player profile
  profile: PlayerProfile | null;
  profileLoading: boolean;

  // Player data
  playerName: string;
  playerLevel: number;
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
  discoveredLocations: Array<{ name: string; x: number; y: number; type: 'town' | 'dungeon' }>;

  // Gacha system
  gachaState: GachaState;

  // Loading states
  loading: boolean;
  saving: boolean;
  error: string | null;
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
  addDiscoveredLocation: (location: { name: string; x: number; y: number; type: 'town' | 'dungeon' }) => Promise<void>;

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
    gold: 0,
    gems: 100,
    energy: 100,
    maxEnergy: 100,
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
    error: null
  });

  const [updateTrigger, setUpdateTrigger] = useState(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userIdRef = useRef<string | null>(null);
  const stateRef = useRef<GameState>(state);

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

    setState(prev => ({ ...prev, saving: true }));

    try {
      // Use stateRef to get the most current state
      const currentState = stateRef.current;

      console.log('💾 Saving game with', currentState.allHeroes.length, 'heroes');

      // Save player profile (including gacha state, worldmap, and discovered locations)
      await PlayerProfileService.updateProfile(userIdRef.current!, {
        nickname: currentState.playerName,
        player_level: currentState.playerLevel,
        gold: currentState.gold,
        gems: currentState.gems,
        energy: currentState.energy,
        max_energy: currentState.maxEnergy,
        current_world_x: currentState.playerPos.x,
        current_world_y: currentState.playerPos.y,
        world_map_data: currentState.worldMap,
        discovered_locations: currentState.discoveredLocations,
        gacha_summon_count: currentState.gachaState.summonCount,
        gacha_last_free_summon: currentState.gachaState.lastFreeSummonDate || null,
        gacha_pity_summons: currentState.gachaState.pitySummons
      });

      // Save game data (heroes, inventory)
      await GameSaveService.saveGame(
        userIdRef.current!,
        'Auto Save',
        currentState.allHeroes,
        currentState.inventory
      );

      console.log('✅ Auto-save completed');
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    } finally {
      setState(prev => ({ ...prev, saving: false }));
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
        // Reconstruct heroes from database
        heroes = saveResult.data.heroes.map(dbHero => {
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
                stats: eq.base_stats || {},
                goldValue: eq.gold_value!,
                enchantLevel: eq.enchant_level || 0,
                setId: eq.set_id || undefined,
                setName: eq.set_name || undefined
              });

              hero.equipment?.equip(item);
            }
          });

          return hero;
        });

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
            stats: dbItem.base_stats || {},
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

      setState(prev => ({
        ...prev,
        profile,
        profileLoading: false,
        playerName: profile.nickname || 'Adventurer',
        playerLevel: profile.player_level,
        gold: profile.gold,
        gems: profile.gems,
        energy: profile.energy,
        maxEnergy: profile.max_energy,
        allHeroes: heroes,
        activeParty: heroes.slice(0, 4),
        activePartyIndices: heroes.length >= 4 ? [0, 1, 2, 3] : Array.from({ length: heroes.length }, (_, i) => i),
        inventory,
        playerPos: { x: profile.current_world_x, y: profile.current_world_y },
        worldMap: profile.world_map_data || null,
        discoveredLocations: profile.discovered_locations || [],
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
   * Initialize game state on mount
   */
  useEffect(() => {
    const initializeGameState = async () => {
      const session = await AuthService.getCurrentSession();

      if (session?.user?.id) {
        userIdRef.current = session.user.id;
        await loadGameData(session.user.id);
      } else {
        // Not logged in - use local state
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
      setState(prev => ({ ...prev, activeParty: heroes }));
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
        const item = inv.items.find(i => i.id === itemId);
        if (item) inv.removeItem(item);
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

    addDiscoveredLocation: async (location: { name: string; x: number; y: number; type: 'town' | 'dungeon' }) => {
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

  return [state, actions];
}
