/**
 * Market Service
 *
 * Handles market operations including buying/selling items,
 * daily shop inventory generation, and pricing calculations.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-08
 */

import { MARKET_CONFIG } from '../config/BALANCE_CONFIG';
import { ItemGenerator } from '../engine/item/ItemGenerator';
import type { Item } from '../engine/item/Item';
import type { Inventory } from '../engine/item/Inventory';
import type { ItemRarity } from '../types/item.types';

// ============================================================================
// TYPES
// ============================================================================

export interface ShopItem {
  item: Item;
  price: number;
}

export interface MarketTransaction {
  success: boolean;
  newGold: number;
  message: string;
}

// ============================================================================
// SHOP INVENTORY GENERATION
// ============================================================================

/**
 * Generate daily shop inventory
 * @param playerLevel - Player level for item scaling
 * @param date - Date string for daily seed (YYYY-MM-DD)
 * @returns Array of shop items with prices
 */
export function generateDailyShop(playerLevel: number, date: string): ShopItem[] {
  const shopItems: ShopItem[] = [];
  const seed = hashString(date); // Use date as seed for deterministic generation

  // Generate equipment items
  for (let i = 0; i < MARKET_CONFIG.DAILY_SHOP_SIZE; i++) {
    const itemSeed = seed + i;
    const rarity = selectRarity(itemSeed);
    const itemLevel = Math.max(
      1,
      playerLevel + Math.floor((seededRandom(itemSeed + 100) * 2 - 1) * MARKET_CONFIG.ITEM_LEVEL_VARIANCE)
    );

    // Temporarily override Math.random for deterministic generation
    const originalRandom = Math.random;
    let randomCallCount = 0;
    Math.random = () => seededRandom(itemSeed + randomCallCount++);

    const item = ItemGenerator.generate(itemLevel, rarity, null);

    // Restore original Math.random
    Math.random = originalRandom;

    // Generate unique ID for market item (date-based + shop index)
    item.id = `market_${date}_${i}_${itemSeed}`;

    const price = Math.floor(item.goldValue * MARKET_CONFIG.BUY_PRICE_MARKUP);

    shopItems.push({ item, price });
  }

  return shopItems;
}

/**
 * Select rarity based on shop distribution
 * @param seed - Random seed
 * @returns Selected rarity
 */
function selectRarity(seed: number): ItemRarity {
  const rand = seededRandom(seed);
  const rates = MARKET_CONFIG.SHOP_RARITY_RATES;

  if (rand < rates.legendary) return 'legendary';
  if (rand < rates.legendary + rates.epic) return 'epic';
  if (rand < rates.legendary + rates.epic + rates.rare) return 'rare';
  if (rand < rates.legendary + rates.epic + rates.rare + rates.uncommon) return 'uncommon';
  return 'common';
}

// ============================================================================
// BUY/SELL OPERATIONS
// ============================================================================

/**
 * Buy item from shop
 * @param item - Item to buy
 * @param price - Item price
 * @param inventory - Player inventory
 * @param playerGold - Current gold
 * @returns Transaction result
 */
export function buyItem(
  item: Item,
  price: number,
  inventory: Inventory,
  playerGold: number
): MarketTransaction {
  // Check gold
  if (playerGold < price) {
    return {
      success: false,
      newGold: playerGold,
      message: `Not enough gold! Need ${price}g, have ${playerGold}g`
    };
  }

  // Check inventory space
  if (inventory.isFull()) {
    return {
      success: false,
      newGold: playerGold,
      message: 'Inventory is full! Sell items to make space.'
    };
  }

  // Purchase item
  const addResult = inventory.addItem(item);
  if (!addResult.success) {
    return {
      success: false,
      newGold: playerGold,
      message: addResult.message
    };
  }

  const newGold = playerGold - price;

  return {
    success: true,
    newGold,
    message: `Purchased ${item.name} for ${price}g`
  };
}

/**
 * Sell item from inventory
 * @param item - Item to sell
 * @param inventory - Player inventory
 * @param playerGold - Current gold
 * @returns Transaction result
 */
export function sellItem(
  item: Item,
  inventory: Inventory,
  playerGold: number
): MarketTransaction {
  const sellPrice = calculateSellPrice(item);

  // Remove item from inventory
  const removed = inventory.removeItem(item.id);

  if (!removed) {
    return {
      success: false,
      newGold: playerGold,
      message: 'Failed to remove item from inventory'
    };
  }

  const newGold = playerGold + sellPrice;

  return {
    success: true,
    newGold,
    message: `Sold ${item.name} for ${sellPrice}g`
  };
}

/**
 * Calculate sell price for item (50% of value)
 * @param item - Item to sell
 * @returns Sell price
 */
export function calculateSellPrice(item: Item): number {
  return Math.floor(item.goldValue * MARKET_CONFIG.SELL_PRICE_MULTIPLIER);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Simple string hash function for seeded randomness
 * @param str - String to hash
 * @returns Hash number
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Seeded random number generator (0-1)
 * @param seed - Random seed
 * @returns Random number between 0 and 1
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Get current date string for daily shop
 * @returns Date string (YYYY-MM-DD)
 */
export function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// ============================================================================
// MARKET SERVICE EXPORT
// ============================================================================

export const MarketService = {
  generateDailyShop,
  buyItem,
  sellItem,
  calculateSellPrice,
  getCurrentDateString
};
