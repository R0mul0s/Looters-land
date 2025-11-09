/**
 * Inventory Types - Type definitions for inventory system
 */

import type { Item } from '../engine/item/Item';
import type { ItemRarity, ItemSlot } from './item.types';

export interface InventoryFilters {
  slot: ItemSlot | 'all';
  rarity: ItemRarity | 'all';
  minLevel: number;
  maxLevel: number;
}

export type SortOption = 'rarity' | 'level' | 'name' | 'value';

export interface InventoryResult {
  success: boolean;
  message: string;
  item?: Item;
}

export interface AddItemResult extends InventoryResult {
  item?: Item;
}

export interface RemoveItemResult extends InventoryResult {
  item?: Item;
}

export interface SellItemResult extends InventoryResult {
  item?: Item;
  goldGained?: number;
}

export interface SellMultipleResult {
  success: boolean;
  soldItems: Item[];
  totalGold: number;
  message: string;
}

export interface AddMultipleResult {
  added: Item[];
  failed: Item[];
}

export interface Materials {
  dust: number;
  crystals: number;
  gems: number;
}

export interface SalvageItemResult extends InventoryResult {
  item?: Item;
  materials?: Materials;
}

export interface SalvageMultipleResult {
  success: boolean;
  itemsSalvaged: number;
  materials: Materials;
  message: string;
}

export interface ExpandInventoryResult {
  success: boolean;
  message: string;
  newMaxSlots?: number;
}

export interface InventoryStatistics {
  totalItems: number;
  maxSlots: number;
  usedSlots: number;
  freeSlots: number;
  gold: number;
  byRarity: Record<ItemRarity, number>;
  bySlot: Record<ItemSlot, number>;
  totalValue: number;
}

export interface InventoryData {
  maxSlots: number;
  items: any[]; // Will be Item[] after parsing
  gold: number;
  filters: InventoryFilters;
  sortBy: SortOption;
}

export interface AutoEquipResult {
  success: boolean;
  equippedItems: Item[];
  message: string;
}
