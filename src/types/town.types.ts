/**
 * Town System Type Definitions
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

/**
 * Building types available in towns
 */
export type BuildingType = 'tavern' | 'smithy' | 'healer' | 'market' | 'bank' | 'guild';

/**
 * Building metadata
 */
export interface Building {
  type: BuildingType;
  name: string;
  icon: string;
  description: string;
  level: number;
  isUnlocked: boolean;
}

/**
 * Town data structure
 */
export interface TownData {
  id: string;
  name: string;
  faction: string;
  level: number;
  buildings: Record<BuildingType, boolean>;
}

/**
 * Service prices for town buildings
 */
export interface ServicePrices {
  // Healer
  healPerHP: number;
  fullHealCost: number;

  // Smithy
  repairPerDurability: number;
  enchantBaseCost: number;
  enchantLevelMultiplier: number;

  // Bank
  depositFee: number; // Percentage
  withdrawFee: number; // Percentage
  interestRate: number; // Daily percentage

  // Market
  buyPriceMultiplier: number; // Item value × multiplier
  sellPriceMultiplier: number; // Item value × multiplier
}

/**
 * Market item for sale
 */
export interface MarketItem {
  id: string;
  itemName: string;
  itemType: string;
  slot: string;
  icon: string;
  level: number;
  rarity: string;
  baseStats: Record<string, number>;
  goldValue: number;
  price: number; // Actual price after multiplier
  stock: number;
}

/**
 * Bank account data
 */
export interface BankAccount {
  userId: string;
  storedGold: number;
  lastInterestDate: string;
  totalDeposited: number;
  totalWithdrawn: number;
}

/**
 * Guild data (placeholder for future)
 */
export interface Guild {
  id: string;
  name: string;
  level: number;
  memberCount: number;
  maxMembers: number;
  guildMaster: string;
  description: string;
}
