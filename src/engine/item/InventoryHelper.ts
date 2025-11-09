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
   * Find best item for slot (by power score)
   * Includes currently equipped items in comparison
   */
  static findBestForSlot(inventory: Inventory, slot: ItemSlot, heroLevel: number = 1, equipment?: Equipment, specificSlot?: EquipmentSlotName): Item | null {
    const items = inventory.getItemsBySlot(slot);

    // If equipment provided, also consider currently equipped item
    let allItems = [...items];
    if (equipment && specificSlot) {
      const equippedItem = equipment.slots[specificSlot];
      if (equippedItem && equippedItem.slot === slot) {
        allItems.push(equippedItem);
      }
    }

    if (allItems.length === 0) return null;

    // Filter by level requirement
    const usableItems = allItems.filter(item => item.level <= heroLevel);

    if (usableItems.length === 0) return null;

    // Calculate power score for each item
    const scored = usableItems.map(item => {
      const stats = item.getEffectiveStats();
      const powerScore = stats.HP + (stats.ATK * 2) + (stats.DEF * 1.5) + stats.SPD + (stats.CRIT * 10);

      return { item, powerScore };
    });

    // Sort by power score
    scored.sort((a, b) => b.powerScore - a.powerScore);

    return scored[0].item;
  }

  /**
   * Auto-equip best items
   * Compares inventory items with currently equipped items and equips the best ones
   */
  static autoEquipBest(inventory: Inventory, equipment: Equipment, heroLevel: number): AutoEquipResult {
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

    slotPairs.forEach(({ slot, equipSlot }) => {
      // Find best item including currently equipped one
      const bestItem = this.findBestForSlot(inventory, slot, heroLevel, equipment, equipSlot);
      if (!bestItem) return;

      const currentItem = equipment.slots[equipSlot];

      // Only equip if:
      // 1. Slot is empty, OR
      // 2. Best item is different from currently equipped item
      if (!currentItem || currentItem.id !== bestItem.id) {
        // Best item is in inventory, need to equip it
        if (inventory.items.find(i => i.id === bestItem.id)) {
          const result = equipment.equip(bestItem);
          if (result.success) {
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

    return {
      success: equipped.length > 0,
      equippedItems: equipped,
      message: equipped.length > 0 ? `Auto-equipped ${equipped.length} items` : 'Already using best items'
    };
  }
}
