/**
 * Game State Converter - Converts between game objects and database format
 */

import { Hero } from '../engine/hero/Hero';
import { Item } from '../engine/item/Item';
import { Inventory } from '../engine/item/Inventory';
import { Equipment } from '../engine/equipment/Equipment';
import type { DBHero, DBInventoryItem, DBEquipmentSlot } from '../types/database.types';
import type { HeroClass } from '../types/hero.types';

export class GameStateConverter {
  /**
   * Convert DB Hero to Game Hero
   */
  static dbHeroToHero(dbHero: DBHero, equipmentSlots: DBEquipmentSlot[]): Hero {
    const hero = new Hero(
      dbHero.hero_name,
      dbHero.hero_class as HeroClass,
      dbHero.level
    );

    // Restore stats
    hero.currentHP = dbHero.current_hp;
    hero.maxHP = dbHero.max_hp;
    hero.ATK = dbHero.atk;
    hero.DEF = dbHero.def;
    hero.SPD = dbHero.spd;
    hero.CRIT = dbHero.crit;

    // Restore XP progression
    hero.experience = dbHero.experience || 0;
    hero.requiredXP = dbHero.required_xp || hero.calculateRequiredXP(dbHero.level);

    // Create equipment
    hero.equipment = new Equipment(hero);

    // Restore equipped items
    const heroEquipmentSlots = equipmentSlots.filter(slot => slot.hero_id === dbHero.id);
    heroEquipmentSlots.forEach(slot => {
      if (slot.item_id && slot.item_name) {
        const item = this.dbSlotToItem(slot);
        if (item && hero.equipment) {
          // Directly set the slot without calling equip (to avoid recalculation)
          hero.equipment.slots[slot.slot_name as keyof typeof hero.equipment.slots] = item;
        }
      }
    });

    // Recalculate stats with equipment
    if (hero.equipment) {
      hero.equipment.updateSetTracking();
      hero.equipment.recalculateStats();
    }

    return hero;
  }

  /**
   * Convert DB Equipment Slot to Item
   */
  static dbSlotToItem(slot: DBEquipmentSlot): Item | null {
    if (!slot.item_id || !slot.item_name || !slot.base_stats) {
      return null;
    }

    const item = new Item({
      id: slot.item_id,
      name: slot.item_name,
      type: slot.item_type as any,
      slot: slot.slot as any,
      icon: slot.icon || '⚔️',
      level: slot.level || 1,
      rarity: slot.rarity as any,
      stats: slot.base_stats,
      goldValue: slot.gold_value || 0,
      enchantLevel: slot.enchant_level || 0,
      setId: slot.set_id || null,
      setName: slot.set_name || null,
      description: ''
    });

    return item;
  }

  /**
   * Convert DB Inventory Item to Item
   */
  static dbItemToItem(dbItem: DBInventoryItem): Item {
    return new Item({
      id: dbItem.item_id,
      name: dbItem.item_name,
      type: dbItem.item_type as any,
      slot: dbItem.slot as any,
      icon: dbItem.icon,
      level: dbItem.level,
      rarity: dbItem.rarity as any,
      stats: dbItem.base_stats,
      goldValue: dbItem.gold_value,
      enchantLevel: dbItem.enchant_level,
      setId: dbItem.set_id || null,
      setName: dbItem.set_name || null,
      description: ''
    });
  }

  /**
   * Restore Inventory from DB data
   */
  static restoreInventory(
    maxSlots: number,
    gold: number,
    dbItems: DBInventoryItem[]
  ): Inventory {
    const inventory = new Inventory(maxSlots);
    inventory.gold = gold;

    dbItems.forEach(dbItem => {
      const item = this.dbItemToItem(dbItem);
      inventory.addItem(item);
    });

    return inventory;
  }
}
