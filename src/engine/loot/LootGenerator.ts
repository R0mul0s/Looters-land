/**
 * Loot Generator - Generates rewards from combat encounters
 *
 * Handles gold drops, item generation, and rarity distribution
 * based on enemy levels and types.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-07
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
}
