/**
 * Hero Types - Type definitions for hero system
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

export type HeroClass = 'warrior' | 'archer' | 'mage' | 'cleric' | 'paladin';

/**
 * Hero rarity types for gacha system
 */
export type HeroRarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * Hero role types for party composition
 */
export type HeroRole = 'tank' | 'dps' | 'healer' | 'support';

export interface HeroStats {
  maxHP: number;
  ATK: number;
  DEF: number;
  SPD: number;
  CRIT: number;
}

export interface BaseStats extends HeroStats {
  hpGrowth: number;
  atkGrowth: number;
  defGrowth: number;
  spdGrowth: number;
  critGrowth: number;
}

export interface HeroInfo {
  id: string;
  name: string;
  class: HeroClass;
  level: number;
  hp: number;
  maxHP: number;
  ATK: number;
  DEF: number;
  SPD: number;
  CRIT: number;
  isAlive: boolean;
  hpPercent: number;
}

export interface AttackResult {
  attacker: unknown; // Will be typed properly when we have full Hero type
  target: unknown;
  damage: number;
  isCrit: boolean;
  didMiss?: boolean;
  element?: string;
  type: 'basic_attack' | 'skill';
  skillName?: string;
}

export interface StatusEffect {
  name: string;
  duration: number;
  type: 'buff' | 'debuff';
  stat?: 'ATK' | 'DEF' | 'SPD' | 'CRIT' | 'ACC' | 'EVA' | 'damageReduction'; // Which stat is affected
  value?: number; // Percentage modifier (e.g., 30 for +30%)
  stun?: boolean; // If true, character skips turns
  immunity?: boolean; // If true, character is immune to damage
}

export const CLASS_ICONS: Record<HeroClass, string> = {
  warrior: '🗡️',
  archer: '🏹',
  mage: '🔮',
  cleric: '⚕️',
  paladin: '🛡️'
};

/**
 * Hero template for gacha pool
 * Defines a summonable hero with all metadata
 */
export interface HeroTemplate {
  id: string;
  name: string;
  class: HeroClass;
  role: HeroRole;
  rarity: HeroRarity;
  description: string;
  icon: string;
  faction?: string;
  specialAbility?: string;
}

/**
 * Gacha summon result
 */
export interface SummonResult {
  hero: HeroTemplate;
  isNew: boolean; // If player didn't have this hero before
}

/**
 * Gacha state for tracking pity and daily free summon
 */
export interface GachaState {
  summonCount: number; // Total summons (for pity system)
  lastFreeSummonDate: string; // ISO date string
  pitySummons: number; // Summons since last Epic+ (resets on Epic/Legendary)
}

/**
 * Rarity colors for UI
 */
export const RARITY_COLORS: Record<HeroRarity, string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#ff8c00'
};

/**
 * Rarity display names
 */
export const RARITY_NAMES: Record<HeroRarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary'
};
