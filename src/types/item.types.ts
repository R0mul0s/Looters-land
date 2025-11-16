/**
 * Item Types - Type definitions for item system
 */

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type ItemSlot = 'helmet' | 'weapon' | 'chest' | 'gloves' | 'legs' | 'boots' | 'accessory';
export type ItemType = 'equipment' | 'consumable' | 'material';

export interface ItemStats {
  HP: number;
  ATK: number;
  DEF: number;
  SPD: number;
  CRIT: number;
}

export interface ItemConfig {
  id?: string;
  name?: string;
  description?: string;
  rarity?: ItemRarity;
  level?: number;
  slot?: ItemSlot;
  type?: ItemType;
  stats?: ItemStats;
  enchantLevel?: number;
  setName?: string | null;
  setId?: string | null;
  goldValue?: number;
  icon?: string;
  location?: 'inventory' | 'bank' | 'equipped'; // Item location for bank vault system
}

export interface ItemInfo {
  id: string;
  name: string;
  baseName: string;
  description: string;
  rarity: ItemRarity;
  rarityDisplay: string;
  rarityColor: string;
  level: number;
  slot: ItemSlot;
  type: ItemType;
  baseStats: ItemStats;
  effectiveStats: ItemStats;
  enchantLevel: number;
  maxEnchantLevel: number;
  setName: string | null;
  goldValue: number;
  icon: string;
}

export interface EnchantResult {
  success: boolean;
  newLevel: number;
  message: string;
  chance?: string;
}

export interface StatComparison {
  HP: number;
  ATK: number;
  DEF: number;
  SPD: number;
  CRIT: number;
}

export const RARITY_MULTIPLIERS: Record<ItemRarity, number> = {
  common: 1.0,
  uncommon: 1.2,
  rare: 1.5,
  epic: 2.0,
  legendary: 3.0,
  mythic: 5.0
};

export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#6c757d',
  uncommon: '#28a745',
  rare: '#007bff',
  epic: '#9c27b0',
  legendary: '#ff9800',
  mythic: '#ffd700'
};

export const SLOT_ICONS: Record<ItemSlot, string> = {
  helmet: '⛑️',
  weapon: '⚔️',
  chest: '🛡️',
  gloves: '🧤',
  legs: '👖',
  boots: '👢',
  accessory: '💍'
};
