/**
 * LocalStorage Service - Auto-save game state locally
 *
 * Provides automatic saving and loading of game state to/from browser's
 * localStorage for quick recovery and offline play. Works independently
 * from Supabase cloud saves.
 *
 * Contains:
 * - Auto-save functionality for inventory and heroes
 * - Auto-restore on application startup
 * - Lightweight JSON serialization
 * - Version management for save compatibility
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-07
 */

import type { Hero } from '../engine/hero/Hero';
import type { Item } from '../engine/item/Item';

const STORAGE_KEY = 'looters-land-autosave';
const VERSION = '1.0.0';

/**
 * Game state structure for localStorage
 */
interface LocalGameState {
  version: string;
  timestamp: number;
  heroes: {
    id: string;
    name: string;
    class: string;
    level: number;
    experience: number;
    requiredXP: number;
    currentHP: number;
    equippedItems: {
      slot: string;
      item: {
        id: string;
        name: string;
        type: string;
        slot: string;
        icon: string;
        level: number;
        rarity: string;
        stats: Record<string, number>;
        goldValue: number;
        enchantLevel: number;
        setId: string | null;
        setName: string | null;
      };
    }[];
  }[];
  inventory: {
    id: string;
    name: string;
    type: string;
    slot: string;
    icon: string;
    level: number;
    rarity: string;
    stats: Record<string, number>;
    goldValue: number;
    enchantLevel: number;
    setId: string | null;
    setName: string | null;
  }[];
  gold: number;
  maxSlots: number;
}

/**
 * Save game state to localStorage
 *
 * Automatically serializes heroes and inventory into localStorage
 * for quick recovery. Called automatically after game state changes.
 *
 * @param heroes - Array of hero instances
 * @param inventory - Array of item instances
 * @param gold - Current gold amount
 * @param maxSlots - Maximum inventory slots
 *
 * @example
 * ```typescript
 * saveToLocalStorage(heroes, inventory, 5000, 50);
 * // Saved automatically to localStorage
 * ```
 */
export function saveToLocalStorage(
  heroes: Hero[],
  inventory: Item[],
  gold: number,
  maxSlots: number = 50
): void {
  try {
    const gameState: LocalGameState = {
      version: VERSION,
      timestamp: Date.now(),
      heroes: heroes.map(hero => ({
        id: hero.id,
        name: hero.name,
        class: hero.class,
        level: hero.level,
        experience: hero.experience,
        requiredXP: hero.requiredXP,
        currentHP: hero.currentHP,
        equippedItems: hero.equipment
          ? Object.entries(hero.equipment.slots)
              .filter(([, item]) => item !== null)
              .map(([slot, item]) => ({
                slot,
                item: {
                  id: item!.id,
                  name: item!.name,
                  type: item!.type,
                  slot: item!.slot,
                  icon: item!.icon,
                  level: item!.level,
                  rarity: item!.rarity,
                  stats: item!.stats,
                  goldValue: item!.goldValue,
                  enchantLevel: item!.enchantLevel,
                  setId: item!.setId,
                  setName: item!.setName
                }
              }))
          : []
      })),
      inventory: inventory.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        slot: item.slot,
        icon: item.icon,
        level: item.level,
        rarity: item.rarity,
        stats: item.stats,
        goldValue: item.goldValue,
        enchantLevel: item.enchantLevel,
        setId: item.setId,
        setName: item.setName
      })),
      gold,
      maxSlots
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    console.log('✅ Auto-saved to localStorage');
  } catch (error) {
    console.error('❌ Failed to save to localStorage:', error);
  }
}

/**
 * Load game state from localStorage
 *
 * Retrieves and deserializes previously saved game state.
 * Returns null if no save exists or if loading fails.
 *
 * @returns Saved game state or null
 *
 * @example
 * ```typescript
 * const savedState = loadFromLocalStorage();
 * if (savedState) {
 *   // Restore game from saved state
 *   restoreGameState(savedState);
 * }
 * ```
 */
export function loadFromLocalStorage(): LocalGameState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      console.log('ℹ️ No auto-save found in localStorage');
      return null;
    }

    const gameState: LocalGameState = JSON.parse(saved);

    // Version check
    if (gameState.version !== VERSION) {
      console.warn('⚠️ Save version mismatch, may need migration');
      // TODO: Add migration logic if needed
    }

    console.log('✅ Loaded auto-save from localStorage');
    return gameState;
  } catch (error) {
    console.error('❌ Failed to load from localStorage:', error);
    return null;
  }
}

/**
 * Clear localStorage save
 *
 * Removes the auto-save data from localStorage.
 * Useful for starting a fresh game or clearing corrupted saves.
 *
 * @example
 * ```typescript
 * clearLocalStorage();
 * console.log('Local save cleared');
 * ```
 */
export function clearLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('✅ Cleared auto-save from localStorage');
  } catch (error) {
    console.error('❌ Failed to clear localStorage:', error);
  }
}

/**
 * Check if auto-save exists
 *
 * @returns True if auto-save exists in localStorage
 *
 * @example
 * ```typescript
 * if (hasLocalSave()) {
 *   // Show "Continue" button
 * }
 * ```
 */
export function hasLocalSave(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * Get save timestamp
 *
 * Returns when the game was last auto-saved.
 *
 * @returns Date object or null
 *
 * @example
 * ```typescript
 * const lastSaved = getLastSaveTime();
 * if (lastSaved) {
 *   console.log(`Last saved: ${lastSaved.toLocaleString()}`);
 * }
 * ```
 */
export function getLastSaveTime(): Date | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const gameState: LocalGameState = JSON.parse(saved);
    return new Date(gameState.timestamp);
  } catch {
    return null;
  }
}
