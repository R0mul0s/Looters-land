/**
 * Game State Restorer - Restore game from localStorage auto-save
 *
 * Handles restoration of game state from localStorage auto-save.
 * Reconstructs Hero and Item instances from serialized data.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-07
 */

import { Hero } from '../engine/hero/Hero';
import { Item } from '../engine/item/Item';
import { Equipment } from '../engine/equipment/Equipment';
import type { HeroClass } from '../types/hero.types';
import type { ItemRarity, ItemSlot, ItemType } from '../types/item.types';

interface SavedHero {
  name: string;
  class: string;
  level: number;
  experience?: number;
  requiredXP?: number;
  currentHP: number;
  equippedItems?: Array<{
    slot: string;
    item: unknown;
  }>;
}

/**
 * Restore hero from saved data
 *
 * @param savedHero - Serialized hero data from localStorage
 * @returns Restored Hero instance
 *
 * @example
 * ```typescript
 * const hero = restoreHero(savedData.heroes[0]);
 * ```
 */
export function restoreHero(
  savedHero: SavedHero
): Hero {
  // Create hero instance
  const hero = new Hero(
    savedHero.name,
    savedHero.class as HeroClass,
    savedHero.level
  );

  // Restore XP progression
  hero.experience = savedHero.experience || 0;
  hero.requiredXP = savedHero.requiredXP || hero.calculateRequiredXP(savedHero.level);

  // Create equipment manager
  hero.equipment = new Equipment(hero);

  // Restore equipped items FIRST (before restoring HP)
  if (savedHero.equippedItems && savedHero.equippedItems.length > 0) {
    savedHero.equippedItems.forEach((equipped: unknown) => {
      // Restore the item from saved data
      const item = restoreItem(equipped.item);
      if (item && hero.equipment) {
        // Directly assign to slot without triggering full equip logic
        hero.equipment.slots[equipped.slot as keyof typeof hero.equipment.slots] = item;
      }
    });

    // Recalculate stats after all items are equipped
    hero.equipment.updateSetTracking();
    hero.equipment.recalculateStats();
    hero.updateStatsWithEquipment();
  }

  // Restore HP AFTER equipment is loaded (so maxHP is correct)
  hero.currentHP = savedHero.currentHP;
  hero.isAlive = savedHero.currentHP > 0;

  return hero;
}

/**
 * Restore item from saved data
 *
 * @param savedItem - Serialized item data from localStorage
 * @returns Restored Item instance
 *
 * @example
 * ```typescript
 * const item = restoreItem(savedData.inventory[0]);
 * ```
 */
export function restoreItem(savedItem: unknown): Item {
  return new Item({
    id: savedItem.id,
    name: savedItem.name,
    type: (savedItem.type as ItemType) || 'equipment', // Default to 'equipment' if not set
    slot: savedItem.slot as ItemSlot,
    icon: savedItem.icon,
    level: savedItem.level,
    rarity: savedItem.rarity as ItemRarity,
    stats: savedItem.stats,
    goldValue: savedItem.goldValue,
    enchantLevel: savedItem.enchantLevel,
    setId: savedItem.setId,
    setName: savedItem.setName,
    description: ''
  });
}

/**
 * Restore full game state from localStorage
 *
 * @param savedState - Complete saved game state from localStorage
 * @returns Object with restored heroes, inventory, gold, and maxSlots
 *
 * @example
 * ```typescript
 * const savedState = loadFromLocalStorage();
 * if (savedState) {
 *   const { heroes, inventory, gold, maxSlots } = restoreGameState(savedState);
 *   // Use restored data in app
 * }
 * ```
 */
export function restoreGameState(savedState: unknown): {
  heroes: Hero[];
  inventory: Item[];
  gold: number;
  maxSlots: number;
} {
  // Restore inventory items
  const inventory = savedState.inventory.map((item: unknown) => restoreItem(item));

  // Restore heroes with their equipped items
  const heroes = savedState.heroes.map((savedHero: unknown) =>
    restoreHero(savedHero)
  );

  return {
    heroes,
    inventory,
    gold: savedState.gold || 0,
    maxSlots: savedState.maxSlots || 50
  };
}
