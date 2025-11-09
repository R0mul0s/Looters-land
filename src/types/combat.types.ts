/**
 * Combat System Type Definitions
 * Defines all types for combat, skills, and combat actions
 */

import type { Hero } from '../engine/hero/Hero';
import type { Enemy } from '../engine/combat/Enemy';
import type { LootReward } from './loot.types';

// Skill Types
export type SkillType = 'damage' | 'heal' | 'buff' | 'debuff';

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
  healAmount?: number;
  skillName?: string;
  type: CombatActionType;
  effect?: string;
  results?: Array<{
    target: Combatant;
    damage?: number;
    isCrit?: boolean;
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
