/**
 * Score Calculator - Utility functions for calculating hero and item scores
 *
 * Provides scoring system for heroes and items based on rarity, level,
 * and equipment. Used for progression gates, leaderboards, and power ratings.
 *
 * Contains:
 * - calculateHeroScore - Calculate hero power rating
 * - calculateItemScore - Calculate item value rating
 * - calculatePlayerScore - Calculate total combat power
 * - Score constants and configurations
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-10
 */

import type { Hero } from '../engine/hero/Hero';
import type { Item } from '../engine/item/Item';

/**
 * Base score values for hero rarities
 */
export const HERO_RARITY_BASE_SCORE = {
  Common: 100,
  Rare: 250,
  Epic: 500,
  Legendary: 1000,
} as const;

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
 * Calculate equipment total score for a hero
 *
 * Sums up all equipped item scores to determine equipment contribution
 * to hero's overall power rating.
 *
 * @param hero - Hero instance with equipment
 * @returns Total equipment score
 *
 * @example
 * ```typescript
 * const equipScore = calculateEquipmentScore(warrior);
 * console.log(equipScore); // 5000
 * ```
 */
export function calculateEquipmentScore(hero: Hero): number {
  let totalScore = 0;

  // Sum scores from all equipped items
  const equipment = hero.equipment?.getAllEquipped() || [];
  for (const equipped of equipment) {
    totalScore += calculateItemScore(equipped.item);
  }

  return Math.floor(totalScore);
}

/**
 * Calculate hero score (power rating)
 *
 * Formula: Base Score (rarity) × Level Multiplier × (1 + Equipment Score Bonus)
 *
 * - Base Score: 100 (Common) to 1000 (Legendary)
 * - Level Multiplier: 1 + (level - 1) × 0.1
 * - Equipment Bonus: +1% per 100 equipment score
 *
 * @param hero - Hero instance
 * @returns Hero score (power rating)
 *
 * @example
 * ```typescript
 * const score = calculateHeroScore(legendaryWarrior);
 * console.log(score); // 5850 (Legendary Lvl 30 with 5000 equipment)
 * ```
 */
export function calculateHeroScore(hero: Hero): number {
  // Get base score from rarity
  const baseScore = HERO_RARITY_BASE_SCORE[hero.rarity] || HERO_RARITY_BASE_SCORE.Common;

  // Calculate level multiplier: 1.0 at level 1, grows by 0.1 per level
  const levelMultiplier = 1 + (hero.level - 1) * 0.1;

  // Calculate equipment score bonus
  const equipmentScore = calculateEquipmentScore(hero);
  const equipmentBonus = 1 + equipmentScore / 10000; // +1% per 100 score

  // Final hero score
  const heroScore = baseScore * levelMultiplier * equipmentBonus;

  return Math.floor(heroScore);
}

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
 * @param activeParty - Array of active party heroes (typically 4)
 * @returns Total player combat power
 *
 * @example
 * ```typescript
 * const combatPower = calculatePlayerScore([hero1, hero2, hero3, hero4]);
 * console.log(combatPower); // 16350
 * ```
 */
export function calculatePlayerScore(activeParty: Hero[]): number {
  let totalScore = 0;

  for (const hero of activeParty) {
    if (hero && hero.isAlive) {
      totalScore += calculateHeroScore(hero);
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
