/**
 * Inventory Helper - Quick inventory actions
 * Migrated from vanilla JS to TypeScript
 */

import type { Inventory } from './Inventory';
import type { Item } from './Item';
import type { Equipment } from '../equipment/Equipment';
import type { ItemRarity, ItemSlot } from '../../types/item.types';
import type { SellMultipleResult, SalvageMultipleResult, AutoEquipResult, Materials } from '../../types/inventory.types';
import type { EquipmentSlotName } from '../../types/equipment.types';

export class InventoryHelper {
  /**
   * Auto-sell all items below a certain rarity
   */
  static autoSellByRarity(inventory: Inventory, maxRarity: ItemRarity = 'common'): SellMultipleResult {
    const rarityOrder: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
    const maxIndex = rarityOrder.indexOf(maxRarity);

    const itemsToSell = inventory.items
      .filter(item => rarityOrder.indexOf(item.rarity) <= maxIndex)
      .map(item => item.id);

    return inventory.sellItems(itemsToSell);
  }

  /**
   * Auto-salvage all items below a certain rarity
   */
  static autoSalvageByRarity(inventory: Inventory, maxRarity: ItemRarity = 'uncommon'): SalvageMultipleResult {
    const rarityOrder: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
    const maxIndex = rarityOrder.indexOf(maxRarity);

    const materials: Materials = { dust: 0, crystals: 0, gems: 0 };
    let count = 0;

    inventory.items
      .filter(item => rarityOrder.indexOf(item.rarity) <= maxIndex)
      .forEach(item => {
        const result = inventory.salvageItem(item.id);
        if (result.success && result.materials) {
          materials.dust += result.materials.dust;
          materials.crystals += result.materials.crystals;
          materials.gems += result.materials.gems;
          count++;
        }
      });

    return {
      success: count > 0,
      itemsSalvaged: count,
      materials: materials,
      message: `Salvaged ${count} items`
    };
  }

  /**
   * Calculate power score with role-based stat weights
   * Different roles value different stats more highly
   */
  static calculatePowerScore(item: Item, heroRole?: 'tank' | 'dps' | 'healer' | 'support'): number {
    const stats = item.getEffectiveStats();

    // Default weights (balanced)
    let weights = {
      HP: 1,
      ATK: 2,
      DEF: 1.5,
      SPD: 1,
      CRIT: 10
    };

    // Role-based weights
    if (heroRole === 'tank') {
      weights = { HP: 2.5, ATK: 1, DEF: 3, SPD: 0.5, CRIT: 5 };
    } else if (heroRole === 'dps') {
      weights = { HP: 0.8, ATK: 3, DEF: 0.5, SPD: 1.5, CRIT: 15 };
    } else if (heroRole === 'healer') {
      weights = { HP: 1.5, ATK: 0.5, DEF: 1.5, SPD: 2, CRIT: 8 };
    } else if (heroRole === 'support') {
      weights = { HP: 1.2, ATK: 1, DEF: 1.2, SPD: 2.5, CRIT: 12 };
    }

    return (
      stats.HP * weights.HP +
      stats.ATK * weights.ATK +
      stats.DEF * weights.DEF +
      stats.SPD * weights.SPD +
      stats.CRIT * weights.CRIT
    );
  }

  /**
   * Find best item for slot comparing both inventory AND currently equipped item
   * Compares by: 1) Power score (with role weights), 2) Rarity, 3) Level
   */
  static findBestForSlot(inventory: Inventory, slot: ItemSlot, heroLevel: number = 1, equipment?: Equipment, specificSlot?: EquipmentSlotName, heroRole?: 'tank' | 'dps' | 'healer' | 'support'): Item | null {
    // Get items from inventory
    const inventoryItems = inventory.getItemsBySlot(slot);

    // Get currently equipped item for this slot
    let equippedItem: Item | null = null;
    if (equipment && specificSlot) {
      equippedItem = equipment.slots[specificSlot];
    }

    // Combine inventory items with equipped item
    const allItems: Item[] = [...inventoryItems];
    if (equippedItem && equippedItem.slot === slot) {
      allItems.push(equippedItem);
    }

    console.log(`🔍 findBestForSlot for ${slot}:`, {
      itemsInInventory: inventoryItems.length,
      equippedItem: equippedItem ? `${equippedItem.name} (${equippedItem.rarity}, Lv.${equippedItem.level})` : 'None',
      totalItems: allItems.length,
      heroLevel,
      heroRole: heroRole || 'balanced'
    });

    if (allItems.length === 0) return null;

    // Filter by level requirement
    const usableItems = allItems.filter(item => item.level <= heroLevel);

    console.log(`✅ Usable items (level <= ${heroLevel}):`, usableItems.length);

    if (usableItems.length === 0) return null;

    // Rarity order for comparison
    const rarityOrder: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

    // Calculate power score for each item
    const scored = usableItems.map(item => {
      const powerScore = this.calculatePowerScore(item, heroRole);
      const rarityIndex = rarityOrder.indexOf(item.rarity);
      const isEquipped = equippedItem?.id === item.id;

      return { item, powerScore, rarityIndex, level: item.level, isEquipped };
    });

    // Sort by: 1) power score (higher first), 2) rarity (higher first), 3) level (higher first)
    scored.sort((a, b) => {
      // Primary: Power score
      if (Math.abs(a.powerScore - b.powerScore) > 0.01) {
        return b.powerScore - a.powerScore;
      }
      // Secondary: Rarity
      if (a.rarityIndex !== b.rarityIndex) {
        return b.rarityIndex - a.rarityIndex;
      }
      // Tertiary: Level
      return b.level - a.level;
    });

    console.log(`🏆 Best item selected:`, {
      name: scored[0].item.name,
      rarity: scored[0].item.rarity,
      level: scored[0].item.level,
      powerScore: scored[0].powerScore.toFixed(1),
      isEquipped: scored[0].isEquipped,
      allScored: scored.map(s => `${s.item.name} (${s.item.rarity}, Lv.${s.item.level}, PS:${s.powerScore.toFixed(1)})${s.isEquipped ? ' [EQUIPPED]' : ''}`)
    });

    return scored[0].item;
  }

  /**
   * Auto-equip best items
   * Compares inventory items with currently equipped items and equips the best ones
   * Now considers hero role for stat prioritization
   */
  static autoEquipBest(inventory: Inventory, equipment: Equipment, heroLevel: number, heroRole?: 'tank' | 'dps' | 'healer' | 'support'): AutoEquipResult {
    console.log('🔧 Auto-equip starting...', {
      heroLevel,
      heroRole: heroRole || 'balanced',
      inventorySize: inventory.items.length,
      equippedItems: Object.values(equipment.slots).filter(i => i !== null).length
    });

    const slotPairs: { slot: ItemSlot; equipSlot: EquipmentSlotName }[] = [
      { slot: 'helmet', equipSlot: 'helmet' },
      { slot: 'weapon', equipSlot: 'weapon' },
      { slot: 'chest', equipSlot: 'chest' },
      { slot: 'gloves', equipSlot: 'gloves' },
      { slot: 'legs', equipSlot: 'legs' },
      { slot: 'boots', equipSlot: 'boots' },
      { slot: 'accessory', equipSlot: 'accessory1' },
      { slot: 'accessory', equipSlot: 'accessory2' }
    ];

    const equipped: Item[] = [];
    const skippedItems: Array<{ item: Item; reason: 'level_too_low' | 'no_items'; slot: ItemSlot }> = [];

    slotPairs.forEach(({ slot, equipSlot }) => {
      // Find best item including currently equipped one
      const allItemsInSlot = inventory.getItemsBySlot(slot);
      const currentItem = equipment.slots[equipSlot];

      // Pass hero role to findBestForSlot for proper stat weighting
      const bestItem = this.findBestForSlot(inventory, slot, heroLevel, equipment, equipSlot, heroRole);

      console.log(`📦 Checking ${equipSlot}:`, {
        slot,
        currentItem: currentItem ? `${currentItem.name} (${currentItem.rarity}, Lv.${currentItem.level})` : 'Empty',
        bestItem: bestItem ? `${bestItem.name} (${bestItem.rarity}, Lv.${bestItem.level})` : 'None found',
        inInventory: bestItem ? inventory.items.find(i => i.id === bestItem.id) !== undefined : false,
        isCurrentBest: currentItem && bestItem ? currentItem.id === bestItem.id : false
      });

      // Check if there are items that couldn't be equipped due to level requirement
      if (!bestItem && allItemsInSlot.length > 0) {
        // Find the best item regardless of level
        const itemsTooHigh = allItemsInSlot.filter(item => item.level > heroLevel);
        if (itemsTooHigh.length > 0) {
          // Sort by power score to find the best item that can't be equipped
          itemsTooHigh.sort((a, b) => {
            const scoreA = this.calculatePowerScore(a, heroRole);
            const scoreB = this.calculatePowerScore(b, heroRole);
            return scoreB - scoreA;
          });
          skippedItems.push({
            item: itemsTooHigh[0],
            reason: 'level_too_low',
            slot
          });
        }
      }

      if (!bestItem) return;

      // Only equip if best item is different from currently equipped item AND it's in inventory
      // If bestItem is already equipped, it means it's the best option - do nothing
      if (currentItem?.id !== bestItem.id && inventory.items.find(i => i.id === bestItem.id)) {
        const result = equipment.equip(bestItem);
        if (result.success) {
          console.log(`✅ Equipped ${bestItem.name} to ${equipSlot}`);
          equipped.push(bestItem);
          inventory.removeItem(bestItem.id);

          // If an item was unequipped, put it back in inventory
          if (result.unequippedItem) {
            console.log(`📤 Unequipped ${result.unequippedItem.name} back to inventory`);
            inventory.addItem(result.unequippedItem);
          }
        }
      } else if (currentItem?.id === bestItem.id) {
        console.log(`✓ ${currentItem.name} is already the best item for ${equipSlot}`);
      }
    });

    console.log(`🎉 Auto-equip finished: ${equipped.length} items equipped`);
    console.log(`⚠️ Skipped items: ${skippedItems.length}`);

    return {
      success: equipped.length > 0,
      equippedItems: equipped,
      message: equipped.length > 0 ? `Auto-equipped ${equipped.length} items` : 'Already using best items',
      skippedItems: skippedItems.length > 0 ? skippedItems : undefined
    };
  }
}
