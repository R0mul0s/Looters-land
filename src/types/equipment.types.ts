/**
 * Equipment Types - Type definitions for equipment system
 */

import type { Item } from '../engine/item/Item';

export type EquipmentSlotName = 'helmet' | 'weapon' | 'chest' | 'gloves' | 'legs' | 'boots' | 'accessory1' | 'accessory2';

export interface EquipmentSlots {
  helmet: Item | null;
  weapon: Item | null;
  chest: Item | null;
  gloves: Item | null;
  legs: Item | null;
  boots: Item | null;
  accessory1: Item | null;
  accessory2: Item | null;
}

export interface EquipResult {
  success: boolean;
  message: string;
  unequippedItem?: Item | null;
  slot?: EquipmentSlotName;
  item?: Item;
}

export interface SetBonus {
  HP?: number;
  ATK?: number;
  DEF?: number;
  SPD?: number;
  CRIT?: number;
  special?: string;
}

export interface SetDefinition {
  name: string;
  bonuses: Record<number, SetBonus>;
}

export interface SetBonusInfo {
  pieces: number;
  bonus: SetBonus;
  active: boolean;
}

export interface ActiveSetInfo {
  setName: string;
  setId: string;
  pieces: number;
  bonuses: SetBonusInfo[];
}

export interface SetInfo {
  id: string;
  name: string;
  bonuses: Record<number, SetBonus>;
}
