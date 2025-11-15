/**
 * Database Types - Supabase schema types
 */

import type { ItemStats } from './item.types';

export interface GameSave {
  id: string;
  user_id: string;
  save_name: string;
  created_at: string;
  updated_at: string;
  gold: number;
  inventory_max_slots: number;
}

export interface DBHero {
  id: string;
  game_save_id: string;
  hero_name: string;
  hero_class: string;
  rarity: string;
  level: number;
  experience: number;
  required_xp: number;
  talent_points: number;
  current_hp: number;
  max_hp: number;
  atk: number;
  def: number;
  spd: number;
  crit: number;
  party_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface DBInventoryItem {
  id: string;
  game_save_id: string;
  item_id: string;
  item_name: string;
  item_type: string;
  slot: string;
  icon: string;
  level: number;
  rarity: string;
  gold_value: number;
  enchant_level: number;
  base_stats: ItemStats;
  set_id: string | null;
  set_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBEquipmentSlot {
  id: string;
  hero_id: string;
  slot_name: string;
  item_id: string | null;
  item_name: string | null;
  item_type: string | null;
  slot: string | null;
  icon: string | null;
  level: number | null;
  rarity: string | null;
  gold_value: number | null;
  enchant_level: number | null;
  base_stats: ItemStats | null;
  set_id: string | null;
  set_name: string | null;
  created_at: string;
  updated_at: string;
}

// Insert types (without auto-generated fields)
export type GameSaveInsert = Omit<GameSave, 'id' | 'created_at' | 'updated_at'>;
// DBHeroInsert MUST include 'id' for UPSERT operations to work correctly
// Otherwise heroes won't be properly updated and may be duplicated or lost
export type DBHeroInsert = Omit<DBHero, 'created_at' | 'updated_at'>;
export type DBInventoryItemInsert = Omit<DBInventoryItem, 'id' | 'created_at' | 'updated_at'>;
export type DBEquipmentSlotInsert = Omit<DBEquipmentSlot, 'id' | 'created_at' | 'updated_at'>;

// Update types (all fields optional except id)
export type GameSaveUpdate = Partial<Omit<GameSave, 'id' | 'created_at' | 'updated_at'>>;
export type DBHeroUpdate = Partial<Omit<DBHero, 'id' | 'created_at' | 'updated_at'>>;
export type DBInventoryItemUpdate = Partial<Omit<DBInventoryItem, 'id' | 'created_at' | 'updated_at'>>;
export type DBEquipmentSlotUpdate = Partial<Omit<DBEquipmentSlot, 'id' | 'created_at' | 'updated_at'>>;
