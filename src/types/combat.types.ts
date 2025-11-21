/**
 * Combat System Type Definitions
 *
 * Defines all types for combat, skills, and combat actions.
 *
 * Contains:
 * - Combatant types (Hero | Enemy)
 * - Combat action results and types
 * - Hit calculation results (accuracy/evasion)
 * - Combat log entries
 * - Combat state management
 * - Enemy type definitions
 * - Status effects
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-20
 */

import type { Hero } from '../engine/hero/Hero';
import type { Enemy } from '../engine/combat/Enemy';
import type { LootReward } from './loot.types';

// Skill Types
export type SkillType = 'damage' | 'heal' | 'buff' | 'debuff';

/**
 * Elemental damage types
 */
export type Element = 'physical' | 'fire' | 'ice' | 'lightning' | 'holy' | 'dark';

/**
 * Element resistances (0-100%)
 * Positive values reduce damage, negative values increase damage
 */
export type ElementResistances = Record<Element, number>;

/**
 * Element info for UI display
 */
export interface ElementInfo {
  name: string;
  icon: string;
  color: string;
  description: string;
}

/**
 * Element database with visual properties
 */
export const ELEMENTS: Record<Element, ElementInfo> = {
  physical: {
    name: 'Physical',
    icon: '⚔️',
    color: '#9ca3af',
    description: 'Standard physical damage'
  },
  fire: {
    name: 'Fire',
    icon: '🔥',
    color: '#ef4444',
    description: 'Burns enemies with flames'
  },
  ice: {
    name: 'Ice',
    icon: '❄️',
    color: '#3b82f6',
    description: 'Freezes enemies with cold'
  },
  lightning: {
    name: 'Lightning',
    icon: '⚡',
    color: '#fbbf24',
    description: 'Strikes with electricity'
  },
  holy: {
    name: 'Holy',
    icon: '✨',
    color: '#fde047',
    description: 'Divine light damage'
  },
  dark: {
    name: 'Dark',
    icon: '🌑',
    color: '#7c3aed',
    description: 'Shadow and curse damage'
  }
};

export type CombatActionType =
  | 'basic_attack'
  | 'skill_damage'
  | 'skill_damage_heal'
  | 'skill_aoe'
  | 'skill_heal'
  | 'skill_group_heal'
  | 'skill_buff';

// Combatant - can be Hero or Enemy
export type Combatant = Hero | Enemy;

/**
 * Extended combat stats with accuracy and evasion
 */
export interface ExtendedCombatStats {
  ATK: number;
  DEF: number;
  SPD: number;
  CRIT: number;
  ACC: number;  // Accuracy rating (base 100)
  EVA: number;  // Evasion rating (base 0)
}

/**
 * Hit calculation result for accuracy/evasion system
 */
export interface HitResult {
  didHit: boolean;       // Whether the attack hit
  hitChance: number;     // Calculated hit chance percentage (0-100)
  wasCrit: boolean;      // Whether the hit was a critical hit
  finalDamage: number;   // Final damage after all calculations
}

// Skill Execute Function
export type SkillExecuteFunction = (
  caster: Combatant,
  targets: Combatant[]
) => CombatActionResult;

// Combat Action Results
export interface CombatActionResult {
  attacker: Combatant;
  target?: Combatant;
  targets?: Combatant[];
  damage?: number;
  isCrit?: boolean;
  didMiss?: boolean;     // Whether the attack missed
  element?: Element;     // Elemental type of the attack
  healAmount?: number;
  skillName?: string;
  type: CombatActionType;
  effect?: string;
  results?: Array<{
    target: Combatant;
    damage?: number;
    isCrit?: boolean;
    didMiss?: boolean;   // Whether this specific target was missed (for AoE)
    healAmount?: number;
  }>;
}

// Combat Log Entry
export interface CombatLogEntry {
  message: string;
  type: 'info' | 'attack' | 'skill' | 'heal' | 'death' | 'turn' | 'victory' | 'defeat' | 'debuff' | 'level_up';
  turn: number;
}

// Combat State
export interface CombatState {
  heroes: Combatant[];
  enemies: Combatant[];
  turnCounter: number;
  isActive: boolean;
  combatResult: 'victory' | 'defeat' | null;
  combatLog: CombatLogEntry[];
  lootReward?: LootReward; // Loot from defeated enemies
}

// Enemy Types
export type EnemyType = 'normal' | 'elite' | 'boss';

// Enemy Info
export interface EnemyInfo {
  id: string;
  name: string;
  level: number;
  type: EnemyType;
  hp: number;
  maxHP: number;
  ATK: number;
  DEF: number;
  SPD: number;
  CRIT: number;
  isAlive: boolean;
  hpPercent: number;
}

// Enemy Type Multipliers
export interface EnemyTypeMultipliers {
  hp: number;
  atk: number;
  def: number;
}
