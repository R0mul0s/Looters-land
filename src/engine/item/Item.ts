/**
 * Item Class - Represents any equippable item
 * Migrated from vanilla JS to TypeScript
 */

import type {
  ItemRarity,
  ItemSlot,
  ItemType,
  ItemStats,
  ItemConfig,
  ItemInfo,
  EnchantResult,
  StatComparison
} from '../../types/item.types';
import { RARITY_MULTIPLIERS, RARITY_COLORS, SLOT_ICONS } from '../../types/item.types';

export class Item {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  level: number;
  slot: ItemSlot;
  type: ItemType;
  stats: ItemStats;
  enchantLevel: number;
  maxEnchantLevel: number = 10;
  setName: string | null;
  setId: string | null;
  goldValue: number;
  icon: string;

  // Static counter to ensure truly unique IDs
  private static _idCounter: number = 0;

  constructor(config: ItemConfig) {
    // Generate truly unique ID using timestamp, random, and counter
    if (!config.id) {
      Item._idCounter++;
      this.id = `item_${Date.now()}_${Math.random()}_${Item._idCounter}`;
    } else {
      this.id = config.id;
    }
    this.name = config.name || 'Unknown Item';
    this.description = config.description || '';
    this.rarity = config.rarity || 'common';
    this.level = config.level || 1;
    this.slot = config.slot || 'weapon';
    this.type = config.type || 'equipment';
    this.stats = config.stats || {
      HP: 0,
      ATK: 0,
      DEF: 0,
      SPD: 0,
      CRIT: 0
    };
    this.enchantLevel = config.enchantLevel || 0;
    this.setName = config.setName || null;
    this.setId = config.setId || null;
    this.goldValue = config.goldValue || this.calculateValue();
    this.icon = config.icon || this.getDefaultIcon();
  }

  static getRarityMultiplier(rarity: ItemRarity): number {
    return RARITY_MULTIPLIERS[rarity] || 1.0;
  }

  getRarityColor(): string {
    return RARITY_COLORS[this.rarity] || RARITY_COLORS.common;
  }

  getRarityDisplayName(): string {
    return this.rarity.charAt(0).toUpperCase() + this.rarity.slice(1);
  }

  getDefaultIcon(): string {
    return SLOT_ICONS[this.slot] || '📦';
  }

  calculateValue(): number {
    const baseValue: Record<ItemRarity, number> = {
      common: 10,
      uncommon: 50,
      rare: 200,
      epic: 1000,
      legendary: 10000,
      mythic: 100000
    };

    let value = (baseValue[this.rarity] || 10) * (this.level / 5);

    if (this.enchantLevel > 0) {
      value *= (1 + (this.enchantLevel * 0.2));
    }

    return Math.floor(value);
  }

  getEffectiveStats(): ItemStats {
    const enchantMultiplier = 1 + (this.enchantLevel * 0.1);

    return {
      HP: Math.floor(this.stats.HP * enchantMultiplier),
      ATK: Math.floor(this.stats.ATK * enchantMultiplier),
      DEF: Math.floor(this.stats.DEF * enchantMultiplier),
      SPD: Math.floor(this.stats.SPD * enchantMultiplier),
      CRIT: parseFloat((this.stats.CRIT * enchantMultiplier).toFixed(2))
    };
  }

  enchant(guaranteedSuccess: boolean = false): EnchantResult {
    if (this.enchantLevel >= this.maxEnchantLevel) {
      return {
        success: false,
        newLevel: this.enchantLevel,
        message: 'Item is already at maximum enchant level!'
      };
    }

    const successChances: Record<number, number> = {
      0: 0.90,
      1: 0.85,
      2: 0.80,
      3: 0.70,
      4: 0.60,
      5: 0.50,
      6: 0.40,
      7: 0.35,
      8: 0.32,
      9: 0.30
    };

    const successChance = successChances[this.enchantLevel] || 0.3;
    const roll = Math.random();

    if (guaranteedSuccess || roll < successChance) {
      this.enchantLevel++;
      return {
        success: true,
        newLevel: this.enchantLevel,
        message: `Successfully enchanted to +${this.enchantLevel}!`,
        chance: (successChance * 100).toFixed(0)
      };
    } else {
      return {
        success: false,
        newLevel: this.enchantLevel,
        message: `Enchantment failed! Item remains at +${this.enchantLevel}.`,
        chance: (successChance * 100).toFixed(0)
      };
    }
  }

  getDisplayName(): string {
    let name = this.name;
    if (this.enchantLevel > 0) {
      name = `${name} +${this.enchantLevel}`;
    }
    return name;
  }

  getInfo(): ItemInfo {
    return {
      id: this.id,
      name: this.getDisplayName(),
      baseName: this.name,
      description: this.description,
      rarity: this.rarity,
      rarityDisplay: this.getRarityDisplayName(),
      rarityColor: this.getRarityColor(),
      level: this.level,
      slot: this.slot,
      type: this.type,
      baseStats: this.stats,
      effectiveStats: this.getEffectiveStats(),
      enchantLevel: this.enchantLevel,
      maxEnchantLevel: this.maxEnchantLevel,
      setName: this.setName,
      goldValue: this.goldValue,
      icon: this.icon
    };
  }

  compareWith(otherItem: Item | null): StatComparison | null {
    if (!otherItem) return null;

    const myStats = this.getEffectiveStats();
    const theirStats = otherItem.getEffectiveStats();

    return {
      HP: myStats.HP - theirStats.HP,
      ATK: myStats.ATK - theirStats.ATK,
      DEF: myStats.DEF - theirStats.DEF,
      SPD: myStats.SPD - theirStats.SPD,
      CRIT: parseFloat((myStats.CRIT - theirStats.CRIT).toFixed(2))
    };
  }

  /**
   * Calculate item score (value rating)
   *
   * Formula: Base Score (rarity) × (1 + level/50) × (1 + enchant × 0.15) × Slot Multiplier
   *
   * @returns Item score value
   *
   * @example
   * ```typescript
   * const score = item.getScore();
   * console.log(score); // 1875
   * ```
   */
  getScore(): number {
    const baseScores: Record<ItemRarity, number> = {
      common: 10,
      uncommon: 25,
      rare: 50,
      epic: 100,
      legendary: 250,
      mythic: 500
    };

    const slotMultipliers: Record<ItemSlot, number> = {
      weapon: 1.5,
      chest: 1.2,
      helmet: 1.0,
      gloves: 1.0,
      legs: 1.0,
      boots: 1.0,
      accessory: 1.3
    };

    const baseScore = baseScores[this.rarity] || baseScores.common;
    const levelScaling = 1 + this.level / 50;
    const enchantBonus = 1 + this.enchantLevel * 0.15;
    const slotMultiplier = slotMultipliers[this.slot] || 1.0;

    const itemScore = baseScore * levelScaling * enchantBonus * slotMultiplier;

    return Math.floor(itemScore);
  }

  toJSON(): ItemConfig {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      rarity: this.rarity,
      level: this.level,
      slot: this.slot,
      type: this.type,
      stats: this.stats,
      enchantLevel: this.enchantLevel,
      setName: this.setName,
      setId: this.setId,
      goldValue: this.goldValue,
      icon: this.icon
    };
  }

  static fromJSON(data: ItemConfig): Item {
    return new Item(data);
  }

  clone(): Item {
    return Item.fromJSON(this.toJSON());
  }
}
