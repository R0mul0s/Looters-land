/**
 * Town Service - Handles town building services and interactions
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import type { ServicePrices, MarketItem } from '../types/town.types';
import type { Hero } from '../engine/hero/Hero';
import type { Item } from '../engine/item/Item';
import { ItemGenerator } from '../engine/item/ItemGenerator';

export class TownService {
  /**
   * Default service prices
   */
  static readonly DEFAULT_PRICES: ServicePrices = {
    // Healer
    healPerHP: 1, // 1 gold per HP
    fullHealCost: 50, // Fixed cost for full party heal

    // Smithy
    repairPerDurability: 2, // 2 gold per durability point
    enchantBaseCost: 100, // Base cost for enchanting
    enchantLevelMultiplier: 1.5, // Cost multiplier per enchant level

    // Bank
    depositFee: 0, // No deposit fee
    withdrawFee: 1, // 1% withdrawal fee
    interestRate: 0.5, // 0.5% daily interest

    // Market
    buyPriceMultiplier: 1.5, // Buy at 150% of base value
    sellPriceMultiplier: 0.6, // Sell at 60% of base value
  };

  // ============================================================================
  // HEALER SERVICES
  // ============================================================================

  /**
   * Calculate cost to heal a single hero
   */
  static calculateHealCost(hero: Hero, prices: ServicePrices = this.DEFAULT_PRICES): number {
    const missingHP = hero.maxHP - hero.currentHP;
    if (missingHP <= 0) return 0;
    return Math.ceil(missingHP * prices.healPerHP);
  }

  /**
   * Calculate cost to heal entire party
   */
  static calculatePartyHealCost(heroes: Hero[], prices: ServicePrices = this.DEFAULT_PRICES): number {
    const totalMissingHP = heroes.reduce((sum, hero) => sum + (hero.maxHP - hero.currentHP), 0);
    if (totalMissingHP <= 0) return 0;

    // Use fixed cost if cheaper
    const individualCost = Math.ceil(totalMissingHP * prices.healPerHP);
    return Math.min(individualCost, prices.fullHealCost);
  }

  /**
   * Heal a single hero
   */
  static healHero(hero: Hero, cost: number, playerGold: number): { success: boolean; message: string; newGold: number } {
    if (playerGold < cost) {
      return {
        success: false,
        message: 'Not enough gold!',
        newGold: playerGold
      };
    }

    hero.currentHP = hero.maxHP;
    return {
      success: true,
      message: `${hero.name} fully healed!`,
      newGold: playerGold - cost
    };
  }

  /**
   * Heal entire party
   */
  static healParty(heroes: Hero[], cost: number, playerGold: number): { success: boolean; message: string; newGold: number } {
    if (playerGold < cost) {
      return {
        success: false,
        message: 'Not enough gold!',
        newGold: playerGold
      };
    }

    heroes.forEach(hero => {
      hero.currentHP = hero.maxHP;
    });

    return {
      success: true,
      message: 'Party fully healed!',
      newGold: playerGold - cost
    };
  }

  // ============================================================================
  // SMITHY SERVICES
  // ============================================================================

  /**
   * Calculate enchanting cost
   */
  static calculateEnchantCost(item: Item, prices: ServicePrices = this.DEFAULT_PRICES): number {
    const currentLevel = item.enchantLevel || 0;
    const nextLevel = currentLevel + 1;

    if (nextLevel > 10) return 0; // Max enchant level

    return Math.ceil(
      prices.enchantBaseCost * Math.pow(prices.enchantLevelMultiplier, currentLevel)
    );
  }

  /**
   * Calculate enchant success rate
   */
  static calculateEnchantSuccessRate(item: Item): number {
    const currentLevel = item.enchantLevel || 0;

    // Success rates by enchant level
    const successRates: Record<number, number> = {
      0: 100, // +0 → +1: 100%
      1: 90,  // +1 → +2: 90%
      2: 80,  // +2 → +3: 80%
      3: 70,  // +3 → +4: 70%
      4: 60,  // +4 → +5: 60%
      5: 50,  // +5 → +6: 50%
      6: 40,  // +6 → +7: 40%
      7: 30,  // +7 → +8: 30%
      8: 20,  // +8 → +9: 20%
      9: 10,  // +9 → +10: 10%
    };

    return successRates[currentLevel] || 0;
  }

  /**
   * Attempt to enchant an item
   */
  static enchantItem(
    item: Item,
    cost: number,
    playerGold: number
  ): { success: boolean; message: string; newGold: number; newEnchantLevel: number } {
    if (playerGold < cost) {
      return {
        success: false,
        message: 'Not enough gold!',
        newGold: playerGold,
        newEnchantLevel: item.enchantLevel || 0
      };
    }

    const currentLevel = item.enchantLevel || 0;
    if (currentLevel >= 10) {
      return {
        success: false,
        message: 'Item is already at max enchant level!',
        newGold: playerGold,
        newEnchantLevel: currentLevel
      };
    }

    const successRate = this.calculateEnchantSuccessRate(item);
    const roll = Math.random() * 100;

    if (roll <= successRate) {
      // Success!
      const newLevel = currentLevel + 1;
      item.enchantLevel = newLevel;

      return {
        success: true,
        message: `Success! Item enchanted to +${newLevel}`,
        newGold: playerGold - cost,
        newEnchantLevel: newLevel
      };
    } else {
      // Failure
      return {
        success: false,
        message: `Enchanting failed! Item remains at +${currentLevel}`,
        newGold: playerGold - cost,
        newEnchantLevel: currentLevel
      };
    }
  }

  // ============================================================================
  // MARKET SERVICES
  // ============================================================================

  /**
   * Generate market items for sale
   */
  static generateMarketItems(townLevel: number, count: number = 10): MarketItem[] {
    const items: MarketItem[] = [];

    for (let i = 0; i < count; i++) {
      const itemLevel = townLevel + Math.floor(Math.random() * 3);
      const item = ItemGenerator.generate(itemLevel);

      const buyPrice = Math.ceil(item.goldValue * this.DEFAULT_PRICES.buyPriceMultiplier);

      items.push({
        id: item.id,
        itemName: item.name,
        itemType: item.type,
        slot: item.slot,
        icon: item.icon,
        level: item.level,
        rarity: item.rarity,
        baseStats: item.stats,
        goldValue: item.goldValue,
        price: buyPrice,
        stock: 1
      });
    }

    return items;
  }

  /**
   * Calculate sell price for an item
   */
  static calculateSellPrice(item: Item, prices: ServicePrices = this.DEFAULT_PRICES): number {
    let value = item.goldValue;

    // Add value for enchant levels
    const enchantValue = (item.enchantLevel || 0) * 50;
    value += enchantValue;

    return Math.ceil(value * prices.sellPriceMultiplier);
  }

  /**
   * Buy an item from market
   */
  static buyItem(
    marketItem: MarketItem,
    playerGold: number
  ): { success: boolean; message: string; newGold: number } {
    if (playerGold < marketItem.price) {
      return {
        success: false,
        message: 'Not enough gold!',
        newGold: playerGold
      };
    }

    return {
      success: true,
      message: `Purchased ${marketItem.itemName} for ${marketItem.price}g`,
      newGold: playerGold - marketItem.price
    };
  }

  /**
   * Sell an item to market
   */
  static sellItem(
    item: Item,
    playerGold: number
  ): { success: boolean; message: string; newGold: number; sellPrice: number } {
    const sellPrice = this.calculateSellPrice(item);

    return {
      success: true,
      message: `Sold ${item.name} for ${sellPrice}g`,
      newGold: playerGold + sellPrice,
      sellPrice
    };
  }

  // ============================================================================
  // BANK SERVICES
  // ============================================================================

  /**
   * Calculate deposit fee
   */
  static calculateDepositFee(amount: number, prices: ServicePrices = this.DEFAULT_PRICES): number {
    return Math.ceil(amount * (prices.depositFee / 100));
  }

  /**
   * Calculate withdrawal fee
   */
  static calculateWithdrawFee(amount: number, prices: ServicePrices = this.DEFAULT_PRICES): number {
    return Math.ceil(amount * (prices.withdrawFee / 100));
  }

  /**
   * Calculate daily interest
   */
  static calculateInterest(storedGold: number, days: number, prices: ServicePrices = this.DEFAULT_PRICES): number {
    const dailyRate = prices.interestRate / 100;
    const interest = storedGold * dailyRate * days;
    return Math.floor(interest);
  }

  /**
   * Deposit gold to bank
   */
  static depositGold(
    amount: number,
    playerGold: number,
    storedGold: number
  ): { success: boolean; message: string; newPlayerGold: number; newStoredGold: number } {
    if (amount <= 0) {
      return {
        success: false,
        message: 'Invalid amount!',
        newPlayerGold: playerGold,
        newStoredGold: storedGold
      };
    }

    const fee = this.calculateDepositFee(amount);
    const totalCost = amount + fee;

    if (playerGold < totalCost) {
      return {
        success: false,
        message: 'Not enough gold!',
        newPlayerGold: playerGold,
        newStoredGold: storedGold
      };
    }

    return {
      success: true,
      message: `Deposited ${amount}g (Fee: ${fee}g)`,
      newPlayerGold: playerGold - totalCost,
      newStoredGold: storedGold + amount
    };
  }

  /**
   * Withdraw gold from bank
   */
  static withdrawGold(
    amount: number,
    playerGold: number,
    storedGold: number
  ): { success: boolean; message: string; newPlayerGold: number; newStoredGold: number } {
    if (amount <= 0) {
      return {
        success: false,
        message: 'Invalid amount!',
        newPlayerGold: playerGold,
        newStoredGold: storedGold
      };
    }

    if (storedGold < amount) {
      return {
        success: false,
        message: 'Not enough gold in bank!',
        newPlayerGold: playerGold,
        newStoredGold: storedGold
      };
    }

    const fee = this.calculateWithdrawFee(amount);
    const amountAfterFee = amount - fee;

    return {
      success: true,
      message: `Withdrew ${amount}g (Fee: ${fee}g, Received: ${amountAfterFee}g)`,
      newPlayerGold: playerGold + amountAfterFee,
      newStoredGold: storedGold - amount
    };
  }
}
