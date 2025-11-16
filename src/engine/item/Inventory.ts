/**
 * Inventory Manager - Manages player's item collection
 * Migrated from vanilla JS to TypeScript
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import { Item } from './Item';
import type { ItemRarity, ItemSlot } from '../../types/item.types';
import type {
  InventoryFilters,
  SortOption,
  AddItemResult,
  RemoveItemResult,
  SellItemResult,
  SellMultipleResult,
  AddMultipleResult,
  SalvageItemResult,
  Materials,
  ExpandInventoryResult,
  InventoryStatistics,
  InventoryData,
  InventoryResult
} from '../../types/inventory.types';

export class Inventory {
  maxSlots: number;
  items: Item[];
  gold: number;
  filters: InventoryFilters;
  sortBy: SortOption;

  constructor(maxSlots: number = 50) {
    this.maxSlots = maxSlots;
    this.items = [];
    this.gold = 0;
    this.filters = {
      slot: 'all',
      rarity: 'all',
      minLevel: 0,
      maxLevel: 100
    };
    this.sortBy = 'rarity';
  }

  addItem(item: Item): AddItemResult {
    if (this.isFull()) {
      return {
        success: false,
        message: 'Inventory is full!'
      };
    }

    this.items.push(item);

    return {
      success: true,
      message: `Added ${item.getDisplayName()} to inventory`,
      item: item
    };
  }

  addItems(items: Item[]): AddMultipleResult {
    const results: AddMultipleResult = {
      added: [],
      failed: []
    };

    items.forEach(item => {
      const result = this.addItem(item);
      if (result.success) {
        results.added.push(item);
      } else {
        results.failed.push(item);
      }
    });

    return results;
  }

  removeItem(itemId: string): RemoveItemResult {
    const index = this.items.findIndex(item => item.id === itemId);

    if (index === -1) {
      return {
        success: false,
        message: 'Item not found in inventory'
      };
    }

    const item = this.items.splice(index, 1)[0];

    return {
      success: true,
      message: `Removed ${item.getDisplayName()} from inventory`,
      item: item
    };
  }

  getItem(itemId: string): Item | null {
    return this.items.find(item => item.id === itemId) || null;
  }

  isFull(): boolean {
    return this.items.length >= this.maxSlots;
  }

  getAvailableSpace(): number {
    return this.maxSlots - this.items.length;
  }

  getFilteredItems(): Item[] {
    let filtered = [...this.items];

    // Apply filters
    if (this.filters.slot !== 'all') {
      filtered = filtered.filter(item => item.slot === this.filters.slot);
    }

    if (this.filters.rarity !== 'all') {
      filtered = filtered.filter(item => item.rarity === this.filters.rarity);
    }

    filtered = filtered.filter(item =>
      item.level >= this.filters.minLevel && item.level <= this.filters.maxLevel
    );

    // Apply sorting
    // Always sort by: Level > Rarity > Type (slot)
    filtered.sort((a, b) => {
      // Primary: Level (descending - highest first)
      const levelDiff = b.level - a.level;
      if (levelDiff !== 0) return levelDiff;

      // Secondary: Rarity (descending - highest first)
      const rarityOrder: Record<ItemRarity, number> = {
        common: 0,
        uncommon: 1,
        rare: 2,
        epic: 3,
        legendary: 4,
        mythic: 5
      };
      const rarityDiff = (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
      if (rarityDiff !== 0) return rarityDiff;

      // Tertiary: Type/Slot (alphabetical)
      const slotOrder: Record<ItemSlot, number> = {
        weapon: 0,
        helmet: 1,
        chest: 2,
        gloves: 3,
        legs: 4,
        boots: 5,
        accessory: 6
      };
      const slotDiff = (slotOrder[a.slot] || 0) - (slotOrder[b.slot] || 0);
      if (slotDiff !== 0) return slotDiff;

      // Quaternary: Name (alphabetical)
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }

  getItemsBySlot(slot: ItemSlot): Item[] {
    return this.items.filter(item => item.slot === slot);
  }

  getItemsByRarity(rarity: ItemRarity): Item[] {
    return this.items.filter(item => item.rarity === rarity);
  }

  sellItem(itemId: string): SellItemResult {
    const result = this.removeItem(itemId);

    if (result.success && result.item) {
      const goldGained = result.item.goldValue;
      this.gold += goldGained;

      return {
        success: true,
        message: `Sold ${result.item.getDisplayName()} for ${goldGained} gold`,
        item: result.item,
        goldGained: goldGained
      };
    }

    return result;
  }

  sellItems(itemIds: string[]): SellMultipleResult {
    let totalGold = 0;
    const soldItems: Item[] = [];

    itemIds.forEach(itemId => {
      const result = this.sellItem(itemId);
      if (result.success && result.item) {
        totalGold += result.goldGained || 0;
        soldItems.push(result.item);
      }
    });

    return {
      success: soldItems.length > 0,
      soldItems: soldItems,
      totalGold: totalGold,
      message: `Sold ${soldItems.length} items for ${totalGold} gold`
    };
  }

  salvageItem(itemId: string): SalvageItemResult {
    const result = this.removeItem(itemId);

    if (result.success && result.item) {
      const materials: Materials = {
        dust: 1,
        crystals: 0,
        gems: 0
      };

      const rarityValue: Record<ItemRarity, number> = {
        common: 1,
        uncommon: 2,
        rare: 5,
        epic: 10,
        legendary: 25,
        mythic: 100
      };
      const value = rarityValue[result.item.rarity] || 1;

      materials.dust = value;
      if (result.item.rarity === 'rare' || result.item.rarity === 'epic') {
        materials.crystals = Math.floor(value / 3);
      }
      if (result.item.rarity === 'legendary' || result.item.rarity === 'mythic') {
        materials.gems = Math.floor(value / 10);
      }

      return {
        success: true,
        message: `Salvaged ${result.item.getDisplayName()}`,
        item: result.item,
        materials: materials
      };
    }

    return result;
  }

  addGold(amount: number): void {
    this.gold += amount;
  }

  removeGold(amount: number): InventoryResult {
    if (this.gold < amount) {
      return {
        success: false,
        message: 'Not enough gold!'
      };
    }

    this.gold -= amount;

    return {
      success: true,
      message: `Spent ${amount} gold`
    };
  }

  expandInventory(additionalSlots: number, cost: number): ExpandInventoryResult {
    const result = this.removeGold(cost);

    if (result.success) {
      this.maxSlots += additionalSlots;
      return {
        success: true,
        message: `Inventory expanded by ${additionalSlots} slots!`,
        newMaxSlots: this.maxSlots
      };
    }

    return result;
  }

  getStatistics(): InventoryStatistics {
    const stats: InventoryStatistics = {
      totalItems: this.items.length,
      maxSlots: this.maxSlots,
      usedSlots: this.items.length,
      freeSlots: this.getAvailableSpace(),
      gold: this.gold,
      byRarity: {
        common: 0,
        uncommon: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
        mythic: 0
      },
      bySlot: {
        helmet: 0,
        weapon: 0,
        chest: 0,
        gloves: 0,
        legs: 0,
        boots: 0,
        accessory: 0
      },
      totalValue: 0
    };

    this.items.forEach(item => {
      stats.byRarity[item.rarity]++;
      stats.bySlot[item.slot]++;
      stats.totalValue += item.goldValue;
    });

    return stats;
  }

  clear(): void {
    this.items = [];
  }

  toJSON(): InventoryData {
    return {
      maxSlots: this.maxSlots,
      items: this.items.map(item => item.toJSON()),
      gold: this.gold,
      filters: this.filters,
      sortBy: this.sortBy
    };
  }

  static fromJSON(data: InventoryData): Inventory {
    const inventory = new Inventory(data.maxSlots);
    inventory.items = data.items.map(itemData => Item.fromJSON(itemData));
    inventory.gold = data.gold;
    inventory.filters = data.filters || inventory.filters;
    inventory.sortBy = data.sortBy || inventory.sortBy;

    return inventory;
  }
}
