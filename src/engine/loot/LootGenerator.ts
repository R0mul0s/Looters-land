/**
 * Loot Generator - Generates rewards from combat encounters
 *
 * Handles gold drops, item generation, and rarity distribution
 * based on enemy levels and types.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-10
 */

import { ItemGenerator } from '../item/ItemGenerator';
import type { Enemy } from '../combat/Enemy';
import type { LootReward, LootConfig } from '../../types/loot.types';
import type { EnemyType } from '../../types/combat.types';
import type { ItemRarity } from '../../types/item.types';
import { DEFAULT_LOOT_CONFIG } from '../../types/loot.types';

export class LootGenerator {
  private config: LootConfig;

  constructor(config: LootConfig = DEFAULT_LOOT_CONFIG) {
    this.config = config;
  }

  /**
   * Generate loot rewards from defeated enemies
   */
  generateLoot(enemies: Enemy[]): LootReward {
    const gold = this.calculateGold(enemies);
    const items = this.generateItems(enemies);

    console.log(`💰 Loot generated: ${gold} gold, ${items.length} items`);

    return {
      gold,
      items,
      experience: 0 // XP handled separately in CombatEngine
    };
  }

  /**
   * Calculate gold drops from enemies
   */
  private calculateGold(enemies: Enemy[]): number {
    let totalGold = 0;

    for (const enemy of enemies) {
      // Base gold = enemyLevel * baseGoldPerLevel
      const baseGold = enemy.level * this.config.baseGoldPerLevel;

      // Apply random variance (0.8 - 1.2)
      const variance = 1 - this.config.goldVariance + (Math.random() * this.config.goldVariance * 2);
      const enemyGold = Math.floor(baseGold * variance);

      totalGold += enemyGold;
    }

    return totalGold;
  }

  /**
   * Generate item drops from enemies
   */
  private generateItems(enemies: Enemy[]): any[] {
    const items: any[] = [];

    for (const enemy of enemies) {
      // Check if item drops
      if (this.shouldDropItem(enemy.type)) {
        const rarity = this.rollRarity();
        const itemLevel = this.calculateItemLevel(enemy.level);

        console.log(`🎲 ${enemy.name} drops ${rarity} item (level ${itemLevel})`);

        // Generate item using ItemGenerator
        const item = ItemGenerator.generate(itemLevel, rarity);
        items.push(item);
      } else {
        console.log(`❌ ${enemy.name} drops no items`);
      }
    }

    return items;
  }

  /**
   * Determine if enemy drops an item
   */
  private shouldDropItem(enemyType: EnemyType): boolean {
    const dropChance = this.config.dropChances[enemyType];
    return Math.random() < dropChance;
  }

  /**
   * Roll for item rarity based on distribution
   */
  private rollRarity(): ItemRarity {
    const roll = Math.random();
    let cumulative = 0;

    const rarities: ItemRarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
    const distribution = this.config.rarityDistribution;

    // Check from rarest to most common
    for (const rarity of rarities) {
      cumulative += distribution[rarity];
      if (roll < cumulative) {
        return rarity;
      }
    }

    // Fallback to common
    return 'common';
  }

  /**
   * Calculate item level based on enemy level
   */
  private calculateItemLevel(enemyLevel: number): number {
    const min = enemyLevel + this.config.minItemLevel;
    const max = enemyLevel + this.config.maxItemLevel;

    // Random level between min and max
    const itemLevel = min + Math.floor(Math.random() * (max - min + 1));

    return Math.max(1, itemLevel); // Never below level 1
  }

  /**
   * Update loot configuration
   */
  setConfig(config: Partial<LootConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): LootConfig {
    return { ...this.config };
  }

  /**
   * Generate loot for treasure chest
   * Static method for worldmap treasure chests
   *
   * @param lootQuality - Chest quality (common, uncommon, rare, epic)
   * @param playerLevel - Player's current level
   * @returns Loot reward with gold and items
   *
   * @example
   * ```typescript
   * const loot = LootGenerator.generateTreasureChestLoot('rare', 10);
   * // Returns: { gold: 500, items: [...] }
   * ```
   */
  static generateTreasureChestLoot(lootQuality: 'common' | 'uncommon' | 'rare' | 'epic', playerLevel: number): LootReward {
    const baseGold = {
      common: 100,
      uncommon: 250,
      rare: 500,
      epic: 1000,
    };

    const itemCount = {
      common: 1,
      uncommon: 2,
      rare: 3,
      epic: 4,
    };

    // Generate gold with ±20% variance
    const gold = Math.floor(baseGold[lootQuality] * (0.8 + Math.random() * 0.4));

    // Generate items
    const items: any[] = [];
    const count = itemCount[lootQuality];

    for (let i = 0; i < count; i++) {
      const rarity = this.rollTreasureRarity(lootQuality);
      const itemLevel = playerLevel + Math.floor(Math.random() * 3) - 1; // -1 to +1 level variance
      const item = ItemGenerator.generate(Math.max(1, itemLevel), rarity);
      items.push(item);
    }

    return {
      gold,
      items,
      experience: 0,
    };
  }

  /**
   * Generate loot for hidden path
   * Static method for worldmap hidden paths
   *
   * @param lootQuality - Path quality (rare, epic, legendary)
   * @param playerLevel - Player's current level
   * @returns Loot reward with gold and items
   */
  static generateHiddenPathLoot(lootQuality: 'rare' | 'epic' | 'legendary', playerLevel: number): LootReward {
    const baseGold = {
      rare: 1000,
      epic: 2000,
      legendary: 5000,
    };

    const itemCount = {
      rare: 3,
      epic: 4,
      legendary: 5,
    };

    // Generate gold
    const gold = Math.floor(baseGold[lootQuality] * (0.8 + Math.random() * 0.4));

    // Generate items (all at least the quality of the path)
    const items: any[] = [];
    const count = itemCount[lootQuality];

    for (let i = 0; i < count; i++) {
      let rarity: ItemRarity = lootQuality;

      // 20% chance for even better rarity
      if (lootQuality === 'rare' && Math.random() < 0.2) rarity = 'epic';
      if (lootQuality === 'epic' && Math.random() < 0.2) rarity = 'legendary';

      const itemLevel = playerLevel + Math.floor(Math.random() * 5); // 0 to +4 level variance
      const item = ItemGenerator.generate(Math.max(1, itemLevel), rarity);
      items.push(item);
    }

    return {
      gold,
      items,
      experience: 0,
    };
  }

  /**
   * Roll rarity for treasure chest items
   */
  private static rollTreasureRarity(chestQuality: 'common' | 'uncommon' | 'rare' | 'epic'): ItemRarity {
    const distributions = {
      common: { common: 0.7, uncommon: 0.25, rare: 0.05, epic: 0, legendary: 0 },
      uncommon: { common: 0.5, uncommon: 0.35, rare: 0.13, epic: 0.02, legendary: 0 },
      rare: { common: 0.3, uncommon: 0.4, rare: 0.25, epic: 0.05, legendary: 0 },
      epic: { common: 0.1, uncommon: 0.3, rare: 0.4, epic: 0.18, legendary: 0.02 },
    };

    const distribution = distributions[chestQuality];
    const roll = Math.random();
    let cumulative = 0;

    const rarities: ItemRarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

    for (const rarity of rarities) {
      cumulative += distribution[rarity];
      if (roll < cumulative) {
        return rarity;
      }
    }

    return 'common';
  }
}
