/**
 * Combat Utility Functions
 *
 * Helper functions for combat calculations and UI rendering.
 *
 * Contains:
 * - Combat speed delay calculation
 * - Turn gauge calculation for initiative order display
 * - Hit/miss calculation with accuracy and evasion
 * - Elemental damage calculation with resistances
 * - Combat state helper functions
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-20
 */

import { COMBAT_CONFIG } from '../config/BALANCE_CONFIG';
import type { CombatSpeed } from '../components/combat/CombatSpeedControl';
import type { Combatant, HitResult, Element } from '../types/combat.types';

/**
 * Get delay in milliseconds for given combat speed
 *
 * @param speed - Combat speed setting (slow, normal, fast, instant)
 * @returns Delay in milliseconds
 *
 * @example
 * const delay = getSpeedDelay('normal'); // Returns 1000
 */
export function getSpeedDelay(speed: CombatSpeed): number {
  return COMBAT_CONFIG.SPEED_PRESETS[speed];
}

/**
 * Calculate turn gauge percentage and display text for a character
 *
 * Determines when a character will act next based on their position in turn order.
 * Active character (position 0) shows 100%, others show decreasing percentage.
 *
 * @param character - The character to calculate gauge for
 * @param turnOrder - Current turn order array from combat engine
 * @returns Object with percentage (0-100), localization key, and position
 *
 * @example
 * const gauge = calculateTurnGauge(hero, combatEngine.turnOrder);
 * // Returns: { percentage: 100, textKey: 'combat.turn.now', position: 0 }
 */
export function calculateTurnGauge(
  character: Combatant,
  turnOrder: Combatant[]
): { percentage: number; textKey: string; position: number } {
  const turnIndex = turnOrder.findIndex(char => char.id === character.id);
  const maxTurns = turnOrder.length;

  if (turnIndex === -1 || maxTurns === 0) {
    return { percentage: 0, textKey: 'combat.turn.wait', position: -1 };
  }

  if (turnIndex === 0) {
    return { percentage: 100, textKey: 'combat.turn.now', position: 0 };
  }

  // Calculate percentage: 100% at position 0, gradually decreases
  // Minimum 10% to keep bar visible
  const percentage = Math.max(10, 100 - (turnIndex * (80 / (maxTurns - 1))));

  return {
    percentage,
    textKey: 'combat.turn.position',
    position: turnIndex
  };
}

/**
 * Calculate hit chance based on attacker ACC and target EVA
 *
 * Formula: 100 + (ACC - EVA) / 10
 * - Min 5% hit chance (always a chance to hit)
 * - Max 95% hit chance (always a chance to miss)
 *
 * @param attackerACC - Attacker's accuracy rating
 * @param targetEVA - Target's evasion rating
 * @returns Hit chance percentage (5-95)
 *
 * @example
 * calculateHitChance(100, 0); // 95% (capped)
 * calculateHitChance(100, 50); // 95% (capped)
 * calculateHitChance(80, 100); // 98%
 * calculateHitChance(50, 150); // 90%
 */
export function calculateHitChance(attackerACC: number, targetEVA: number): number {
  const rawChance = 100 + (attackerACC - targetEVA) / 10;

  // Cap between 5% and 95%
  return Math.max(5, Math.min(95, rawChance));
}

/**
 * Roll for hit/miss based on accuracy and evasion
 *
 * @param attackerACC - Attacker's accuracy rating
 * @param targetEVA - Target's evasion rating
 * @returns True if attack hits, false if it misses
 *
 * @example
 * const didHit = rollHit(hero.ACC, enemy.EVA);
 * if (didHit) {
 *   // Apply damage
 * } else {
 *   // Show miss message
 * }
 */
export function rollHit(attackerACC: number, targetEVA: number): boolean {
  const hitChance = calculateHitChance(attackerACC, targetEVA);
  const roll = Math.random() * 100;

  return roll < hitChance;
}

/**
 * Execute attack with full hit calculation including crit chance
 *
 * Performs hit/miss roll and crit roll, calculates final damage.
 * Returns complete result object with all information.
 *
 * @param attacker - The attacking combatant
 * @param target - The target combatant
 * @param baseDamage - Base damage before modifiers
 * @returns Complete hit result with didHit, hitChance, wasCrit, finalDamage
 *
 * @example
 * const result = calculateAttackResult(hero, enemy, hero.ATK);
 * if (result.didHit) {
 *   target.takeDamage(result.finalDamage, result.wasCrit);
 * }
 */
export function calculateAttackResult(
  attacker: Combatant,
  target: Combatant,
  baseDamage: number
): HitResult {
  const attackerStats = attacker.getCombatStats();
  const targetStats = target.getCombatStats();

  // Calculate hit chance
  const hitChance = calculateHitChance(attackerStats.ACC, targetStats.EVA);
  const didHit = rollHit(attackerStats.ACC, targetStats.EVA);

  // If miss, return early
  if (!didHit) {
    return {
      didHit: false,
      hitChance,
      wasCrit: false,
      finalDamage: 0
    };
  }

  // Hit succeeded - roll for crit
  const wasCrit = Math.random() * 100 < attackerStats.CRIT;

  // Calculate final damage (this will be applied through takeDamage)
  const finalDamage = target.takeDamage(baseDamage, wasCrit);

  return {
    didHit: true,
    hitChance,
    wasCrit,
    finalDamage
  };
}

/**
 * Calculate elemental damage modifier based on target's resistances and weaknesses
 *
 * Formula:
 * - Resistance: damage * (1 - resistance / 100)
 * - Weakness: damage * 1.5 (50% bonus)
 * - Combined: weakness bonus applies first, then resistance
 *
 * @param baseDamage - Base damage before elemental modifiers
 * @param element - Element type of the attack
 * @param target - Target combatant with resistances and weaknesses
 * @returns Modified damage and resistance percentage
 *
 * @example
 * // Enemy with 20% fire resistance
 * calculateElementalDamage(100, 'fire', enemy);
 * // Returns: { damage: 80, resistancePercent: 20, isWeak: false, isResist: true }
 *
 * // Hero weak to dark
 * calculateElementalDamage(100, 'dark', hero);
 * // Returns: { damage: 150, resistancePercent: 0, isWeak: true, isResist: false }
 */
export function calculateElementalDamage(
  baseDamage: number,
  element: Element,
  target: Combatant
): { damage: number; resistancePercent: number; isWeak: boolean; isResist: boolean } {
  // Check if target has resistances property (Hero/Enemy classes)
  if (!('resistances' in target) || !('weaknesses' in target)) {
    return { damage: baseDamage, resistancePercent: 0, isWeak: false, isResist: false };
  }

  let finalDamage = baseDamage;
  let isWeak = false;
  let isResist = false;

  // Check for weakness (50% bonus damage)
  if (target.weaknesses.includes(element)) {
    finalDamage = Math.floor(finalDamage * 1.5);
    isWeak = true;
  }

  // Apply resistance/vulnerability
  const resistance = target.resistances[element] || 0;
  if (resistance !== 0) {
    // Positive resistance reduces damage, negative increases it
    finalDamage = Math.floor(finalDamage * (1 - resistance / 100));
    isResist = resistance > 0;
  }

  // Minimum 1 damage
  finalDamage = Math.max(1, finalDamage);

  return {
    damage: finalDamage,
    resistancePercent: resistance,
    isWeak,
    isResist
  };
}
