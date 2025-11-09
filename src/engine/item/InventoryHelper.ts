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
   * Find best item for slot (by rarity first, then level, then power score)
   * Only considers items from inventory (not currently equipped items)
   */
  static findBestForSlot(inventory: Inventory, slot: ItemSlot, heroLevel: number = 1, equipment?: Equipment, specificSlot?: EquipmentSlotName): Item | null {
    // Only get items from inventory (not equipped items)
    const items = inventory.getItemsBySlot(slot);

    console.log(`🔍 findBestForSlot for ${slot}:`, {
      itemsInInventory: items.length,
      heroLevel,
      items: items.map(i => `${i.name} (${i.rarity}, Lv.${i.level})`)
    });

    if (items.length === 0) return null;

    // Filter by level requirement
    const usableItems = items.filter(item => item.level <= heroLevel);

    console.log(`✅ Usable items (level <= ${heroLevel}):`, usableItems.length);

    if (usableItems.length === 0) return null;

    // Rarity order for comparison
    const rarityOrder: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

    // Calculate power score for each item
    const scored = usableItems.map(item => {
      const stats = item.getEffectiveStats();
      const powerScore = stats.HP + (stats.ATK * 2) + (stats.DEF * 1.5) + stats.SPD + (stats.CRIT * 10);
      const rarityIndex = rarityOrder.indexOf(item.rarity);

      return { item, powerScore, rarityIndex, level: item.level };
    });

    // Sort by: 1) rarity (higher first), 2) level (higher first), 3) power score (higher first)
    scored.sort((a, b) => {
      if (a.rarityIndex !== b.rarityIndex) {
        return b.rarityIndex - a.rarityIndex; // Higher rarity first
      }
      if (a.level !== b.level) {
        return b.level - a.level; // Higher level first
      }
      return b.powerScore - a.powerScore; // Higher power score first
    });

    console.log(`🏆 Best item selected:`, {
      name: scored[0].item.name,
      rarity: scored[0].item.rarity,
      level: scored[0].item.level,
      powerScore: scored[0].powerScore,
      allScored: scored.map(s => `${s.item.name} (${s.item.rarity}, Lv.${s.item.level}, PS:${s.powerScore.toFixed(0)})`)
    });

    return scored[0].item;
  }

  /**
   * Auto-equip best items
   * Compares inventory items with currently equipped items and equips the best ones
   */
  static autoEquipBest(inventory: Inventory, equipment: Equipment, heroLevel: number): AutoEquipResult {
    console.log('🔧 Auto-equip starting...', { heroLevel, inventorySize: inventory.items.length });

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
      // IMPORTANT: Re-check inventory after each equip in case items were moved
      const allItemsInSlot = inventory.getItemsBySlot(slot);
      const bestItem = this.findBestForSlot(inventory, slot, heroLevel, equipment, equipSlot);
      const currentItem = equipment.slots[equipSlot];

      console.log(`📦 Checking ${equipSlot}:`, {
        slot,
        currentItem: currentItem ? `${currentItem.name} (${currentItem.rarity}, Lv.${currentItem.level})` : 'Empty',
        bestItem: bestItem ? `${bestItem.name} (${bestItem.rarity}, Lv.${bestItem.level})` : 'None found',
        inInventory: bestItem ? inventory.items.find(i => i.id === bestItem.id) !== undefined : false
      });

      // Check if there are items that couldn't be equipped due to level requirement
      if (!bestItem && allItemsInSlot.length > 0) {
        // Find the best item regardless of level
        const itemsTooHigh = allItemsInSlot.filter(item => item.level > heroLevel);
        if (itemsTooHigh.length > 0) {
          // Sort by rarity to find the best item that can't be equipped
          const rarityOrder: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
          itemsTooHigh.sort((a, b) => {
            const aIndex = rarityOrder.indexOf(a.rarity);
            const bIndex = rarityOrder.indexOf(b.rarity);
            if (aIndex !== bIndex) return bIndex - aIndex;
            return b.level - a.level;
          });
          skippedItems.push({
            item: itemsTooHigh[0],
            reason: 'level_too_low',
            slot
          });
        }
      }

      if (!bestItem) return;

      // Only equip if:
      // 1. Slot is empty, OR
      // 2. Best item is different from currently equipped item
      if (!currentItem || currentItem.id !== bestItem.id) {
        // Best item is in inventory, need to equip it
        if (inventory.items.find(i => i.id === bestItem.id)) {
          const result = equipment.equip(bestItem);
          if (result.success) {
            console.log(`✅ Equipped ${bestItem.name} to ${equipSlot}`);
            equipped.push(bestItem);
            inventory.removeItem(bestItem.id);

            // If an item was unequipped, put it back in inventory
            if (result.unequippedItem) {
              inventory.addItem(result.unequippedItem);
            }
          }
        }
        // Best item is already equipped, do nothing (it's already the best)
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
