/**
 * Score Calculator - Utility functions for calculating item scores and player combat power
 *
 * Provides scoring system for items and player party power rating.
 * Hero scores are now calculated directly by Hero.getScore() method.
 *
 * Contains:
 * - calculateItemScore - Calculate item value rating
 * - calculatePlayerScore - Calculate total combat power
 * - Score constants and configurations
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import type { Hero } from '../engine/hero/Hero';
import type { Item } from '../engine/item/Item';

/**
 * Base score values for item rarities
 */
export const ITEM_RARITY_BASE_SCORE = {
  Common: 10,
  Uncommon: 25,
  Rare: 50,
  Epic: 100,
  Legendary: 250,
} as const;

/**
 * Slot multipliers based on importance
 */
export const ITEM_SLOT_MULTIPLIER = {
  Weapon: 1.5,
  Chest: 1.2,
  Helmet: 1.0,
  Legs: 1.0,
  Boots: 1.0,
  Shield: 1.2,
  Accessory: 1.3,
} as const;

/**
 * Calculate item score (value rating)
 *
 * Formula: Base Score (rarity) × (1 + level/50) × (1 + enchant × 0.15) × Slot Multiplier
 *
 * - Base Score: 10 (Common) to 250 (Legendary)
 * - Level Scaling: +2% per level
 * - Enchant Bonus: +15% per enchant level
 * - Slot Multiplier: 1.0 to 1.5 based on slot importance
 *
 * @param item - Item instance
 * @returns Item score (value rating)
 *
 * @example
 * ```typescript
 * const score = calculateItemScore(legendaryWeapon);
 * console.log(score); // 1875 (Legendary Weapon Lvl 50 +10)
 * ```
 */
export function calculateItemScore(item: Item): number {
  // Get base score from rarity
  const baseScore = ITEM_RARITY_BASE_SCORE[item.rarity] || ITEM_RARITY_BASE_SCORE.Common;

  // Calculate level scaling: +2% per level
  const levelScaling = 1 + item.level / 50;

  // Calculate enchant bonus: +15% per enchant level
  const enchantBonus = 1 + (item.enchantLevel || 0) * 0.15;

  // Get slot multiplier (default 1.0 if slot not found)
  const slotMultiplier = ITEM_SLOT_MULTIPLIER[item.slot] || 1.0;

  // Final item score
  const itemScore = baseScore * levelScaling * enchantBonus * slotMultiplier;

  return Math.floor(itemScore);
}

/**
 * Calculate player combat power (total party score)
 *
 * Sums the hero scores of all active party members to determine
 * overall combat effectiveness. Used for progression gates and
 * leaderboard rankings.
 *
 * Note: Individual hero scores are calculated by Hero.getScore() method,
 * which uses actual combat stats (HP, ATK, DEF, SPD, CRIT) with rarity multipliers.
 *
 * @param activeParty - Array of active party heroes (typically 4)
 * @returns Total player combat power
 *
 * @example
 * ```typescript
 * const combatPower = calculatePlayerScore([hero1, hero2, hero3, hero4]);
 * console.log(combatPower); // 5480 (sum of all hero combat powers)
 * ```
 */
export function calculatePlayerScore(activeParty: Hero[]): number {
  let totalScore = 0;

  for (const hero of activeParty) {
    if (hero && hero.isAlive) {
      totalScore += hero.getScore();
    }
  }

  return Math.floor(totalScore);
}

/**
 * Get recommended content tier based on combat power
 *
 * Provides suggestions for which dungeons/content the player
 * should attempt based on their current power level.
 *
 * @param combatPower - Player's total combat power
 * @returns Recommended content tier name
 *
 * @example
 * ```typescript
 * const tier = getRecommendedTier(16350);
 * console.log(tier); // "Hard Dungeons"
 * ```
 */
export function getRecommendedTier(combatPower: number): string {
  if (combatPower >= 25000) return 'Endless Abyss';
  if (combatPower >= 15000) return 'Hard Dungeons';
  if (combatPower >= 5000) return 'Medium Dungeons';
  return 'Easy Dungeons';
}

/**
 * Format score number with thousands separator
 *
 * @param score - Score value to format
 * @returns Formatted score string
 *
 * @example
 * ```typescript
 * const formatted = formatScore(16350);
 * console.log(formatted); // "16,350"
 * ```
 */
export function formatScore(score: number): string {
  return Math.floor(score).toLocaleString();
}
