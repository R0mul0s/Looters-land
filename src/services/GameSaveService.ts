/**
 * Game Save Service - Handles saving and loading game state to/from Supabase
 *
 * Manages persistence of game data including heroes, inventory, equipment,
 * and player progress. Provides save/load functionality with Supabase database
 * integration. Handles serialization and deserialization of game objects.
 *
 * Contains:
 * - saveGame() - Save complete game state to database
 * - loadGame() - Load game state from database
 * - listSaves() - List all saves for a user
 * - deleteSave() - Delete a save file
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-08
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { t } from '../localization/i18n';
import type { Hero } from '../engine/hero/Hero';
import type { Inventory } from '../engine/item/Inventory';
import type { GameSave, DBHero, DBInventoryItem, DBEquipmentSlot, GameSaveInsert, DBHeroInsert, DBInventoryItemInsert, DBEquipmentSlotInsert } from '../types/database.types';
import { LeaderboardService } from './LeaderboardService';
import { calculatePlayerScore } from '../utils/scoreCalculator';

export class GameSaveService {
  /**
   * Save entire game state to Supabase database
   *
   * Creates or updates a game save with all associated data including heroes,
   * equipment slots, and inventory items. Uses upsert to avoid duplicates.
   *
   * @param userId - User ID from authentication
   * @param saveName - Name for the save file
   * @param heroes - Array of Hero instances to save
   * @param inventory - Inventory instance with items and gold
   * @returns Promise with success status, message, and optional save ID
   *
   * @example
   * ```typescript
   * const result = await GameSaveService.saveGame(
   *   'user-123',
   *   'my-save',
   *   [hero1, hero2],
   *   inventory
   * );
   * if (result.success) {
   *   console.log('Save ID:', result.saveId);
   * }
   * ```
   */
  static async saveGame(
    userId: string,
    saveName: string,
    heroes: Hero[],
    inventory: Inventory,
    activeParty?: Hero[],
    playerName?: string
  ): Promise<{ success: boolean; message: string; saveId?: string }> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: t('saveGame.notConfigured')
      };
    }

    try {
      // 1. Create or update game save
      const { data: gameSave, error: saveError } = await supabase
        .from('game_saves')
        .upsert({
          user_id: userId,
          save_name: saveName,
          gold: inventory.gold,
          inventory_max_slots: inventory.maxSlots
        } as GameSaveInsert, {
          onConflict: 'user_id,save_name'
        })
        .select()
        .single();

      if (saveError || !gameSave) {
        console.error('Save error:', saveError);
        return {
          success: false,
          message: t('saveGame.saveFailed')
        };
      }

      const gameSaveId = gameSave.id;

      // 2. Use UPSERT for heroes (UPDATE existing or INSERT new)
      // This is safer and faster than DELETE + INSERT pattern
      const heroUpserts: DBHeroInsert[] = heroes.map(hero => {
        // Find if hero is in active party and get its position
        const partyIndex = activeParty?.findIndex(h => h.id === hero.id) ?? -1;
        const party_order = partyIndex >= 0 ? partyIndex : null;

        return {
          id: hero.id, // CRITICAL: Include ID for upsert to work
          game_save_id: gameSaveId,
          hero_name: hero.name,
          hero_class: hero.class,
          rarity: hero.rarity,
          level: hero.level,
          experience: hero.experience,
          required_xp: hero.requiredXP,
          talent_points: hero.talentPoints,
          current_hp: hero.currentHP,
          max_hp: hero.maxHP,
          atk: hero.ATK,
          def: hero.DEF,
          spd: hero.SPD,
          crit: hero.CRIT,
          party_order
        };
      });

      const { data: savedHeroes, error: heroError } = await supabase
        .from('heroes')
        .upsert(heroUpserts, {
          onConflict: 'id', // Use hero ID as conflict key
          ignoreDuplicates: false // Update existing records
        })
        .select();

      if (heroError || !savedHeroes) {
        console.error('❌ Hero save error:', heroError);
        return {
          success: false,
          message: t('saveGame.heroSaveFailed')
        };
      }

      // Verify XP and HP integrity (only log errors if mismatch detected)
      heroUpserts.forEach((input, index) => {
        const returned = savedHeroes[index];
        if (input.experience !== returned.experience) {
          console.error(`❌ XP MISMATCH for ${input.hero_name}:`, {
            sent: input.experience,
            returned: returned.experience,
            difference: returned.experience - input.experience
          });
        }
        if (input.current_hp !== returned.current_hp) {
          console.error(`❌ HP MISMATCH for ${input.hero_name}:`, {
            sentCurrentHP: input.current_hp,
            returnedCurrentHP: returned.current_hp,
            sentMaxHP: input.max_hp,
            returnedMaxHP: returned.max_hp
          });
        }
      });

      // 4. Save equipment slots for each hero
      // Use UPSERT pattern (same as heroes) - safer and faster than DELETE + INSERT
      const equipmentUpserts: DBEquipmentSlotInsert[] = [];
      heroes.forEach((hero, index) => {
        const dbHeroId = savedHeroes[index].id;

        if (hero.equipment) {
          Object.entries(hero.equipment.slots).forEach(([slotName, item]) => {
            equipmentUpserts.push({
              hero_id: dbHeroId,
              slot_name: slotName,
              item_id: item?.id || null,
              item_name: item?.name || null,
              item_type: item?.type || null,
              slot: item?.slot || null,
              icon: item?.icon || null,
              level: item?.level || null,
              rarity: item?.rarity || null,
              gold_value: item?.goldValue || null,
              enchant_level: item?.enchantLevel || null,
              base_stats: item?.stats || null,  // Fixed: use item.stats instead of item.baseStats
              set_id: item?.setId || null,
              set_name: item?.setName || null
            });
          });
        }
      });

      if (equipmentUpserts.length > 0) {
        const { error: equipError } = await supabase
          .from('equipment_slots')
          .upsert(equipmentUpserts, {
            onConflict: 'hero_id,slot_name', // Use composite unique key
            ignoreDuplicates: false // Update existing records
          });

        if (equipError) {
          console.error('❌ Equipment save error:', equipError);
          return {
            success: false,
            message: t('saveGame.equipmentSaveFailed')
          };
        }
      }

      // 5. Save inventory items
      // For inventory, we keep DELETE + INSERT because items can be added/removed frequently
      // and we don't have a stable composite key (items can be duplicates with same item_id)
      const { error: deleteItemsError } = await supabase
        .from('inventory_items')
        .delete()
        .eq('game_save_id', gameSaveId);

      if (deleteItemsError) {
        console.error('❌ Delete inventory error:', deleteItemsError);
      }

      const itemInserts: DBInventoryItemInsert[] = inventory.items.map(item => ({
        game_save_id: gameSaveId,
        item_id: item.id,
        item_name: item.name,
        item_type: item.type,
        slot: item.slot,
        icon: item.icon,
        level: item.level,
        rarity: item.rarity,
        gold_value: item.goldValue,
        enchant_level: item.enchantLevel,
        base_stats: item.stats,
        set_id: item.setId || null,
        set_name: item.setName || null
      }));

      if (itemInserts.length > 0) {
        const { error: itemError } = await supabase
          .from('inventory_items')
          .insert(itemInserts);

        if (itemError) {
          console.error('Inventory save error:', itemError);
          return {
            success: false,
            message: t('saveGame.inventorySaveFailed')
          };
        }
      }

      // 6. Update leaderboards (don't wait for it, fire and forget)
      this.updateLeaderboards(
        userId,
        activeParty || heroes.slice(0, 4),
        heroes.length, // Total heroes collected
        inventory.gold,
        playerName
      ).catch(err =>
        console.warn('Leaderboard update failed (non-critical):', err)
      );

      return {
        success: true,
        message: t('saveGame.saveSuccess'),
        saveId: gameSaveId
      };
    } catch (error: any) {
      console.error('Unexpected save error:', error);
      return {
        success: false,
        message: t('saveGame.saveFailed')
      };
    }
  }

  /**
   * Update leaderboards with current game stats
   * @param userId - User ID
   * @param activeParty - Active party heroes (up to 4)
   * @param totalHeroesCount - Total number of heroes collected
   * @param gold - Current gold
   * @param playerName - Player's nickname
   */
  private static async updateLeaderboards(
    userId: string,
    activeParty: Hero[],
    totalHeroesCount: number,
    gold: number,
    playerName?: string
  ): Promise<void> {
    try {
      // Calculate combat power using proper scoring system
      // This includes all stats (HP, ATK, DEF, SPD, CRIT) with rarity multipliers
      const combatPower = calculatePlayerScore(activeParty);

      // Update all categories
      await LeaderboardService.updateAllCategories(
        userId,
        {
          heroes_collected: totalHeroesCount, // Total unique heroes owned
          total_gold: gold,
          combat_power: combatPower
          // Note: deepest_floor is updated separately when completing dungeon floors
        },
        playerName || 'Anonymous', // player_name
        1 // player_level (TODO: add player level system)
      );
    } catch (error) {
      // Non-critical error, just log it
      console.warn('Failed to update leaderboards:', error);
    }
  }

  /**
   * Load game state from Supabase database
   *
   * Retrieves a complete game save including heroes, equipment, and inventory items.
   * Returns all data in raw database format for reconstruction in game engine.
   *
   * @param userId - User ID from authentication
   * @param saveName - Name of the save file to load
   * @returns Promise with success status, message, and optional game data
   *
   * @example
   * ```typescript
   * const result = await GameSaveService.loadGame('user-123', 'my-save');
   * if (result.success && result.data) {
   *   const { gameSave, heroes, equipmentSlots, inventoryItems } = result.data;
   *   // Reconstruct game state from database data
   * }
   * ```
   */
  static async loadGame(
    userId: string,
    saveName: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: {
      gameSave: GameSave;
      heroes: DBHero[];
      equipmentSlots: DBEquipmentSlot[];
      inventoryItems: DBInventoryItem[];
    };
  }> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: t('saveGame.notConfigured')
      };
    }

    try {
      // 1. Load game save
      const { data: gameSave, error: saveError } = await supabase
        .from('game_saves')
        .select('*')
        .eq('user_id', userId)
        .eq('save_name', saveName)
        .single();

      if (saveError || !gameSave) {
        return {
          success: false,
          message: t('saveGame.loadNotFound')
        };
      }

      const gameSaveId = gameSave.id;

      // 2. Load heroes
      const { data: heroes, error: heroError } = await supabase
        .from('heroes')
        .select('*')
        .eq('game_save_id', gameSaveId);

      if (heroError) {
        return {
          success: false,
          message: t('saveGame.loadHeroesFailed')
        };
      }

      // 3. Load equipment slots
      const heroIds = (heroes || []).map(h => h.id);
      const { data: equipmentSlots, error: equipError } = await supabase
        .from('equipment_slots')
        .select('*')
        .in('hero_id', heroIds);

      if (equipError) {
        return {
          success: false,
          message: t('saveGame.loadEquipmentFailed')
        };
      }

      // 4. Load inventory items
      const { data: inventoryItems, error: itemError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('game_save_id', gameSaveId);

      if (itemError) {
        return {
          success: false,
          message: t('saveGame.loadInventoryFailed')
        };
      }

      return {
        success: true,
        message: t('saveGame.loadSuccess'),
        data: {
          gameSave: gameSave as GameSave,
          heroes: (heroes || []) as DBHero[],
          equipmentSlots: (equipmentSlots || []) as DBEquipmentSlot[],
          inventoryItems: (inventoryItems || []) as DBInventoryItem[]
        }
      };
    } catch (error: any) {
      console.error('Unexpected load error:', error);
      return {
        success: false,
        message: t('saveGame.saveFailed')
      };
    }
  }

  /**
   * List all save files for a user
   *
   * Retrieves all game saves for the specified user, ordered by most recently updated.
   * Used for displaying save file selection UI.
   *
   * @param userId - User ID from authentication
   * @returns Promise with success status, message, and optional saves array
   *
   * @example
   * ```typescript
   * const result = await GameSaveService.listSaves('user-123');
   * if (result.success && result.saves) {
   *   result.saves.forEach(save => console.log(save.save_name));
   * }
   * ```
   */
  static async listSaves(userId: string): Promise<{
    success: boolean;
    message: string;
    saves?: GameSave[];
  }> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: t('saveGame.notConfigured')
      };
    }

    try {
      const { data: saves, error } = await supabase
        .from('game_saves')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        return {
          success: false,
          message: t('saveGame.listFailed')
        };
      }

      return {
        success: true,
        message: t('saveGame.loadSuccess'),
        saves: (saves || []) as GameSave[]
      };
    } catch (error: any) {
      return {
        success: false,
        message: t('saveGame.listFailed')
      };
    }
  }

  /**
   * Delete a save file
   *
   * Permanently removes a game save and all associated data (heroes, equipment, inventory).
   * Uses CASCADE delete in database schema to automatically remove related records.
   *
   * @param userId - User ID from authentication
   * @param saveName - Name of the save file to delete
   * @returns Promise with success status and message
   *
   * @example
   * ```typescript
   * const result = await GameSaveService.deleteSave('user-123', 'old-save');
   * if (result.success) {
   *   console.log('Save deleted successfully');
   * }
   * ```
   */
  static async deleteSave(userId: string, saveName: string): Promise<{
    success: boolean;
    message: string;
  }> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: t('saveGame.notConfigured')
      };
    }

    try {
      const { error } = await supabase
        .from('game_saves')
        .delete()
        .eq('user_id', userId)
        .eq('save_name', saveName);

      if (error) {
        return {
          success: false,
          message: t('saveGame.deleteFailed')
        };
      }

      return {
        success: true,
        message: t('saveGame.deleteSuccess')
      };
    } catch (error: any) {
      return {
        success: false,
        message: t('saveGame.deleteFailed')
      };
    }
  }
}
