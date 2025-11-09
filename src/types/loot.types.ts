/**
 * Loot System Type Definitions
 *
 * Defines types for loot generation, drop rates, and rewards
 * from combat encounters.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-07
 */

import type { Item } from '../engine/item/Item';
import type { ItemRarity } from './item.types';

/**
 * Loot rewards from combat
 */
export interface LootReward {
  gold: number;
  items: Item[];
  experience: number; // Already handled, but included for completeness
}

/**
 * Drop chance configuration based on enemy type
 */
export interface DropChance {
  normal: number;   // 30% for normal enemies
  elite: number;    // 50% for elite enemies
  boss: number;     // 100% for boss enemies
}

/**
 * Rarity distribution for item drops
 */
export interface RarityDistribution {
  common: number;      // 60%
  uncommon: number;    // 25%
  rare: number;        // 10%
  epic: number;        // 4%
  legendary: number;   // 1%
}

/**
 * Loot generation configuration
 */
export interface LootConfig {
  // Gold calculation
  baseGoldPerLevel: number;        // Base gold = enemyLevel * this value
  goldVariance: number;             // Random multiplier range (0.8 - 1.2)

  // Item drops
  dropChances: DropChance;
  rarityDistribution: RarityDistribution;

  // Level scaling
  minItemLevel: number;             // Minimum item level relative to enemy
  maxItemLevel: number;             // Maximum item level relative to enemy
}

/**
 * Default loot configuration
 */
export const DEFAULT_LOOT_CONFIG: LootConfig = {
  // Gold
  baseGoldPerLevel: 10,
  goldVariance: 0.2, // 0.8 - 1.2 multiplier

  // Drop chances
  dropChances: {
    normal: 0.30,  // 30%
    elite: 0.50,   // 50%
    boss: 1.00     // 100%
  },

  // Rarity distribution
  rarityDistribution: {
    common: 0.60,     // 60%
    uncommon: 0.25,   // 25%
    rare: 0.10,       // 10%
    epic: 0.04,       // 4%
    legendary: 0.01   // 1%
  },

  // Item level range
  minItemLevel: -1,  // enemyLevel - 1
  maxItemLevel: 2    // enemyLevel + 2
};
