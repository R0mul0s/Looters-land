/**
 * Balance Config Tests
 *
 * Tests for game balance constants, energy system, and helper functions.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import { describe, it, expect } from 'vitest';
import {
  COMBAT_CONFIG,
  DUNGEON_CONFIG,
  ENERGY_CONFIG,
  WORLDMAP_CONFIG,
  HERO_CONFIG,
  EQUIPMENT_CONFIG,
  INVENTORY_CONFIG,
  GACHA_CONFIG,
  TALENT_CONFIG,
  BANK_CONFIG,
  MARKET_CONFIG,
  validateRange,
  clamp,
  getRequiredXP,
  getEnchantCost,
  getEnchantSuccessRate,
  getBankVaultSlots,
  getBankUpgradeCost,
  getBankEnergyBonus,
  calculateDepositFee
} from './BALANCE_CONFIG';

describe('BALANCE_CONFIG', () => {
  describe('COMBAT_CONFIG', () => {
    it('should have valid crit chance (0-100%)', () => {
      expect(COMBAT_CONFIG.BASE_CRIT_CHANCE).toBeGreaterThanOrEqual(0);
      expect(COMBAT_CONFIG.BASE_CRIT_CHANCE).toBeLessThanOrEqual(100);
    });

    it('should have crit damage multiplier greater than 1', () => {
      expect(COMBAT_CONFIG.CRIT_DAMAGE_MULTIPLIER).toBeGreaterThan(1);
    });

    it('should have positive minimum damage', () => {
      expect(COMBAT_CONFIG.MIN_DAMAGE).toBeGreaterThan(0);
    });

    it('should have positive initiative random range', () => {
      expect(COMBAT_CONFIG.INITIATIVE_RANDOM_RANGE).toBeGreaterThan(0);
    });

    it('should have positive auto-combat delay', () => {
      expect(COMBAT_CONFIG.AUTO_COMBAT_DELAY).toBeGreaterThan(0);
    });

    it('should have speed presets in correct order', () => {
      expect(COMBAT_CONFIG.SPEED_PRESETS.NORMAL).toBeGreaterThan(COMBAT_CONFIG.SPEED_PRESETS.FAST);
      expect(COMBAT_CONFIG.SPEED_PRESETS.FAST).toBeGreaterThan(COMBAT_CONFIG.SPEED_PRESETS.VERY_FAST);
    });
  });

  describe('DUNGEON_CONFIG', () => {
    it('should have rooms per floor for all difficulties', () => {
      expect(DUNGEON_CONFIG.ROOMS_PER_FLOOR.Easy).toBeDefined();
      expect(DUNGEON_CONFIG.ROOMS_PER_FLOOR.Medium).toBeDefined();
      expect(DUNGEON_CONFIG.ROOMS_PER_FLOOR.Hard).toBeDefined();
      expect(DUNGEON_CONFIG.ROOMS_PER_FLOOR.Nightmare).toBeDefined();
    });

    it('should have increasing rooms with difficulty', () => {
      expect(DUNGEON_CONFIG.ROOMS_PER_FLOOR.Easy.min).toBeLessThanOrEqual(
        DUNGEON_CONFIG.ROOMS_PER_FLOOR.Nightmare.min
      );
    });

    it('should have valid difficulty scaling per floor', () => {
      expect(DUNGEON_CONFIG.DIFFICULTY_SCALING_PER_FLOOR).toBeGreaterThan(0);
      expect(DUNGEON_CONFIG.DIFFICULTY_SCALING_PER_FLOOR).toBeLessThanOrEqual(1);
    });

    it('should have increasing difficulty multipliers', () => {
      expect(DUNGEON_CONFIG.DIFFICULTY_MULTIPLIERS.Easy).toBeLessThan(
        DUNGEON_CONFIG.DIFFICULTY_MULTIPLIERS.Medium
      );
      expect(DUNGEON_CONFIG.DIFFICULTY_MULTIPLIERS.Medium).toBeLessThan(
        DUNGEON_CONFIG.DIFFICULTY_MULTIPLIERS.Hard
      );
      expect(DUNGEON_CONFIG.DIFFICULTY_MULTIPLIERS.Hard).toBeLessThan(
        DUNGEON_CONFIG.DIFFICULTY_MULTIPLIERS.Nightmare
      );
    });

    it('should have enemy probabilities summing to 1', () => {
      const probs = DUNGEON_CONFIG.ENEMY_PROBABILITIES.balanced;
      const sum = probs.easy + probs.normal + probs.hard + probs.elite;
      expect(sum).toBeCloseTo(1, 2);
    });
  });

  describe('ENERGY_CONFIG', () => {
    it('should have positive regen rate', () => {
      expect(ENERGY_CONFIG.REGEN_RATE).toBeGreaterThan(0);
    });

    it('should have max energy greater than regen rate', () => {
      expect(ENERGY_CONFIG.MAX_ENERGY).toBeGreaterThan(ENERGY_CONFIG.REGEN_RATE);
    });

    it('should have max energy equal to 24 hours worth of regen', () => {
      // 24 hours * 10 energy/hour = 240 max energy
      expect(ENERGY_CONFIG.MAX_ENERGY).toBe(ENERGY_CONFIG.REGEN_RATE * 24);
    });

    it('should have positive dungeon entry cost', () => {
      expect(ENERGY_CONFIG.DUNGEON_ENTRY_COST).toBeGreaterThan(0);
    });

    it('should have dungeon entry cost less than max energy', () => {
      expect(ENERGY_CONFIG.DUNGEON_ENTRY_COST).toBeLessThan(ENERGY_CONFIG.MAX_ENERGY);
    });

    it('should have positive teleport cost', () => {
      expect(ENERGY_CONFIG.TELEPORT_COST).toBeGreaterThan(0);
    });

    it('should have teleport cost less than max energy', () => {
      expect(ENERGY_CONFIG.TELEPORT_COST).toBeLessThan(ENERGY_CONFIG.MAX_ENERGY);
    });

    it('should have valid daily reset hour (0-23)', () => {
      expect(ENERGY_CONFIG.DAILY_RESET_HOUR).toBeGreaterThanOrEqual(0);
      expect(ENERGY_CONFIG.DAILY_RESET_HOUR).toBeLessThanOrEqual(23);
    });

    it('should allow multiple dungeons per day', () => {
      // Should be able to do at least 10 dungeons per day
      const dungeonsPerDay = Math.floor(ENERGY_CONFIG.MAX_ENERGY / ENERGY_CONFIG.DUNGEON_ENTRY_COST);
      expect(dungeonsPerDay).toBeGreaterThanOrEqual(10);
    });
  });

  describe('WORLDMAP_CONFIG', () => {
    it('should have valid map dimensions', () => {
      expect(WORLDMAP_CONFIG.WIDTH).toBeGreaterThan(0);
      expect(WORLDMAP_CONFIG.HEIGHT).toBeGreaterThan(0);
    });

    it('should have reasonable town count', () => {
      expect(WORLDMAP_CONFIG.TOWN_COUNT).toBeGreaterThanOrEqual(1);
      expect(WORLDMAP_CONFIG.TOWN_COUNT).toBeLessThanOrEqual(10);
    });

    it('should have dungeon count >= town count', () => {
      expect(WORLDMAP_CONFIG.DUNGEON_COUNT).toBeGreaterThanOrEqual(WORLDMAP_CONFIG.TOWN_COUNT);
    });

    it('should have even portal count (for pairing)', () => {
      expect(WORLDMAP_CONFIG.PORTAL_COUNT % 2).toBe(0);
    });

    it('should have reasonable encounter chance (0-100%)', () => {
      expect(WORLDMAP_CONFIG.RANDOM_ENCOUNTER_CHANCE).toBeGreaterThanOrEqual(0);
      expect(WORLDMAP_CONFIG.RANDOM_ENCOUNTER_CHANCE).toBeLessThanOrEqual(100);
    });
  });

  describe('HERO_CONFIG', () => {
    it('should have starting level of 1', () => {
      expect(HERO_CONFIG.STARTING_LEVEL).toBe(1);
    });

    it('should have max level greater than starting level', () => {
      expect(HERO_CONFIG.MAX_LEVEL).toBeGreaterThan(HERO_CONFIG.STARTING_LEVEL);
    });

    it('should have positive base XP requirement', () => {
      expect(HERO_CONFIG.BASE_XP_REQUIREMENT).toBeGreaterThan(0);
    });

    it('should have XP scaling factor greater than 1', () => {
      expect(HERO_CONFIG.XP_SCALING_FACTOR).toBeGreaterThan(1);
    });

    it('should have positive stat growth values', () => {
      expect(HERO_CONFIG.STAT_GROWTH.HP).toBeGreaterThan(0);
      expect(HERO_CONFIG.STAT_GROWTH.ATK).toBeGreaterThan(0);
      expect(HERO_CONFIG.STAT_GROWTH.DEF).toBeGreaterThan(0);
      expect(HERO_CONFIG.STAT_GROWTH.SPD).toBeGreaterThan(0);
      expect(HERO_CONFIG.STAT_GROWTH.CRIT).toBeGreaterThan(0);
    });
  });

  describe('EQUIPMENT_CONFIG', () => {
    it('should have enchant success rates from 0 to max level', () => {
      for (let i = 0; i < EQUIPMENT_CONFIG.MAX_ENCHANT_LEVEL; i++) {
        expect(EQUIPMENT_CONFIG.ENCHANT_SUCCESS_RATES[i as keyof typeof EQUIPMENT_CONFIG.ENCHANT_SUCCESS_RATES]).toBeDefined();
      }
    });

    it('should have decreasing success rates with level', () => {
      const rates = EQUIPMENT_CONFIG.ENCHANT_SUCCESS_RATES;
      expect(rates[0]).toBeGreaterThan(rates[5]);
      expect(rates[5]).toBeGreaterThan(rates[9]);
    });

    it('should have success rates between 0 and 1', () => {
      const rates = Object.values(EQUIPMENT_CONFIG.ENCHANT_SUCCESS_RATES);
      for (const rate of rates) {
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThanOrEqual(1);
      }
    });

    it('should have rarity drop rates summing to 1', () => {
      const rates = EQUIPMENT_CONFIG.RARITY_DROP_RATES;
      const sum = rates.common + rates.uncommon + rates.rare + rates.epic + rates.legendary;
      expect(sum).toBeCloseTo(1, 2);
    });

    it('should have slots defined', () => {
      expect(EQUIPMENT_CONFIG.SLOTS.length).toBeGreaterThan(0);
    });
  });

  describe('INVENTORY_CONFIG', () => {
    it('should have default slots less than max', () => {
      expect(INVENTORY_CONFIG.DEFAULT_SLOTS).toBeLessThan(INVENTORY_CONFIG.MAX_SLOTS);
    });

    it('should have positive slot expansion cost', () => {
      expect(INVENTORY_CONFIG.SLOT_EXPANSION_BASE_COST).toBeGreaterThan(0);
    });

    it('should have expansion cost multiplier >= 1', () => {
      expect(INVENTORY_CONFIG.SLOT_EXPANSION_COST_MULTIPLIER).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GACHA_CONFIG', () => {
    it('should have at least 1 daily free summon', () => {
      expect(GACHA_CONFIG.DAILY_FREE_SUMMONS).toBeGreaterThanOrEqual(1);
    });

    it('should have 10-pull cheaper than 10 singles', () => {
      expect(GACHA_CONFIG.COST_TEN).toBeLessThan(GACHA_CONFIG.COST_SINGLE * GACHA_CONFIG.MULTI_SUMMON_COUNT);
    });

    it('should have rates summing to 100', () => {
      const rates = GACHA_CONFIG.RATES;
      const sum = rates.common + rates.rare + rates.epic + rates.legendary;
      expect(sum).toBe(100);
    });

    it('should have decreasing rates for higher rarities', () => {
      expect(GACHA_CONFIG.RATES.common).toBeGreaterThan(GACHA_CONFIG.RATES.rare);
      expect(GACHA_CONFIG.RATES.rare).toBeGreaterThan(GACHA_CONFIG.RATES.epic);
      expect(GACHA_CONFIG.RATES.epic).toBeGreaterThan(GACHA_CONFIG.RATES.legendary);
    });

    it('should have reasonable pity threshold', () => {
      expect(GACHA_CONFIG.PITY_THRESHOLD).toBeGreaterThan(0);
      expect(GACHA_CONFIG.PITY_THRESHOLD).toBeLessThanOrEqual(200);
    });
  });

  describe('TALENT_CONFIG', () => {
    it('should have max talent points greater than points per duplicate', () => {
      expect(TALENT_CONFIG.MAX_TALENT_POINTS).toBeGreaterThan(TALENT_CONFIG.POINTS_PER_DUPLICATE);
    });

    it('should have positive stat bonus per point', () => {
      expect(TALENT_CONFIG.STAT_BONUS_PER_POINT).toBeGreaterThan(0);
    });
  });

  describe('BANK_CONFIG', () => {
    it('should have tiers defined', () => {
      expect(BANK_CONFIG.TIERS.length).toBeGreaterThan(0);
    });

    it('should have tier 0 with no cost', () => {
      const tier0 = BANK_CONFIG.TIERS.find((t) => t.tier === 0);
      expect(tier0).toBeDefined();
      expect(tier0!.cost).toBe(0);
    });

    it('should have increasing slots with tier', () => {
      for (let i = 1; i < BANK_CONFIG.TIERS.length; i++) {
        expect(BANK_CONFIG.TIERS[i].slots).toBeGreaterThan(BANK_CONFIG.TIERS[i - 1].slots);
      }
    });

    it('should have increasing costs with tier', () => {
      for (let i = 2; i < BANK_CONFIG.TIERS.length; i++) {
        expect(BANK_CONFIG.TIERS[i].cost).toBeGreaterThan(BANK_CONFIG.TIERS[i - 1].cost);
      }
    });

    it('should have deposit fee between 0 and 1', () => {
      expect(BANK_CONFIG.DEPOSIT_FEE_PERCENTAGE).toBeGreaterThanOrEqual(0);
      expect(BANK_CONFIG.DEPOSIT_FEE_PERCENTAGE).toBeLessThanOrEqual(1);
    });

    it('should have withdraw fee of 0 (free)', () => {
      expect(BANK_CONFIG.WITHDRAW_FEE_PERCENTAGE).toBe(0);
    });
  });

  describe('MARKET_CONFIG', () => {
    it('should have positive shop size', () => {
      expect(MARKET_CONFIG.DAILY_SHOP_SIZE).toBeGreaterThan(0);
    });

    it('should have sell price multiplier less than 1', () => {
      expect(MARKET_CONFIG.SELL_PRICE_MULTIPLIER).toBeLessThan(1);
    });

    it('should have buy markup greater than 1', () => {
      expect(MARKET_CONFIG.BUY_PRICE_MARKUP).toBeGreaterThan(1);
    });

    it('should have increasing potion costs with size', () => {
      expect(MARKET_CONFIG.POTIONS.SMALL_POTION_COST).toBeLessThan(
        MARKET_CONFIG.POTIONS.MEDIUM_POTION_COST
      );
      expect(MARKET_CONFIG.POTIONS.MEDIUM_POTION_COST).toBeLessThan(
        MARKET_CONFIG.POTIONS.LARGE_POTION_COST
      );
    });

    it('should have increasing potion heals with size', () => {
      expect(MARKET_CONFIG.POTIONS.SMALL_POTION_HEAL).toBeLessThan(
        MARKET_CONFIG.POTIONS.MEDIUM_POTION_HEAL
      );
      expect(MARKET_CONFIG.POTIONS.MEDIUM_POTION_HEAL).toBeLessThan(
        MARKET_CONFIG.POTIONS.LARGE_POTION_HEAL
      );
    });
  });
});

describe('Helper Functions', () => {
  describe('validateRange', () => {
    it('should return true for value within range', () => {
      expect(validateRange(5, 0, 10)).toBe(true);
      expect(validateRange(0, 0, 10)).toBe(true);
      expect(validateRange(10, 0, 10)).toBe(true);
    });

    it('should return false for value outside range', () => {
      expect(validateRange(-1, 0, 10)).toBe(false);
      expect(validateRange(11, 0, 10)).toBe(false);
    });
  });

  describe('clamp', () => {
    it('should return value if within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('should return min if value is below', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('should return max if value is above', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle edge cases', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  describe('getRequiredXP', () => {
    it('should return base XP for level 1', () => {
      const xp = getRequiredXP(1);
      expect(xp).toBe(HERO_CONFIG.BASE_XP_REQUIREMENT);
    });

    it('should increase XP for higher levels', () => {
      const xp1 = getRequiredXP(1);
      const xp2 = getRequiredXP(2);
      const xp3 = getRequiredXP(3);

      expect(xp2).toBeGreaterThan(xp1);
      expect(xp3).toBeGreaterThan(xp2);
    });

    it('should scale exponentially', () => {
      const xp1 = getRequiredXP(1);
      const xp2 = getRequiredXP(2);
      const xp3 = getRequiredXP(3);

      const ratio1 = xp2 / xp1;
      const ratio2 = xp3 / xp2;

      // Ratios should be similar (exponential scaling)
      expect(Math.abs(ratio1 - ratio2)).toBeLessThan(0.1);
    });
  });

  describe('getEnchantCost', () => {
    it('should return base cost for level 0', () => {
      const cost = getEnchantCost(0);
      expect(cost).toBe(EQUIPMENT_CONFIG.ENCHANT_BASE_COST);
    });

    it('should increase cost for higher levels', () => {
      const cost0 = getEnchantCost(0);
      const cost5 = getEnchantCost(5);
      const cost9 = getEnchantCost(9);

      expect(cost5).toBeGreaterThan(cost0);
      expect(cost9).toBeGreaterThan(cost5);
    });
  });

  describe('getEnchantSuccessRate', () => {
    it('should return 100% for level 0', () => {
      expect(getEnchantSuccessRate(0)).toBe(1.0);
    });

    it('should return decreasing rates for higher levels', () => {
      expect(getEnchantSuccessRate(1)).toBeLessThan(getEnchantSuccessRate(0));
      expect(getEnchantSuccessRate(5)).toBeLessThan(getEnchantSuccessRate(1));
      expect(getEnchantSuccessRate(9)).toBeLessThan(getEnchantSuccessRate(5));
    });

    it('should return 0 for invalid level', () => {
      expect(getEnchantSuccessRate(100)).toBe(0);
    });
  });

  describe('getBankVaultSlots', () => {
    it('should return 0 for tier 0', () => {
      expect(getBankVaultSlots(0)).toBe(0);
    });

    it('should return increasing slots for higher tiers', () => {
      expect(getBankVaultSlots(1)).toBeGreaterThan(getBankVaultSlots(0));
      expect(getBankVaultSlots(3)).toBeGreaterThan(getBankVaultSlots(1));
      expect(getBankVaultSlots(5)).toBeGreaterThan(getBankVaultSlots(3));
    });

    it('should return 0 for invalid tier', () => {
      expect(getBankVaultSlots(100)).toBe(0);
    });
  });

  describe('getBankUpgradeCost', () => {
    it('should return cost for tier 1 upgrade', () => {
      const cost = getBankUpgradeCost(0);
      expect(cost).toBe(BANK_CONFIG.TIERS[1].cost);
    });

    it('should return 0 for max tier', () => {
      expect(getBankUpgradeCost(BANK_CONFIG.MAX_TIER)).toBe(0);
    });

    it('should return increasing costs', () => {
      expect(getBankUpgradeCost(1)).toBeLessThan(getBankUpgradeCost(2));
      expect(getBankUpgradeCost(2)).toBeLessThan(getBankUpgradeCost(3));
    });
  });

  describe('getBankEnergyBonus', () => {
    it('should return 0 for tier 0', () => {
      expect(getBankEnergyBonus(0)).toBe(0);
    });

    it('should return increasing bonus for higher tiers', () => {
      expect(getBankEnergyBonus(1)).toBeGreaterThan(getBankEnergyBonus(0));
      expect(getBankEnergyBonus(3)).toBeGreaterThan(getBankEnergyBonus(1));
      expect(getBankEnergyBonus(5)).toBeGreaterThan(getBankEnergyBonus(3));
    });
  });

  describe('calculateDepositFee', () => {
    it('should return 1% of item value', () => {
      expect(calculateDepositFee(100)).toBe(1);
      expect(calculateDepositFee(1000)).toBe(10);
      expect(calculateDepositFee(10000)).toBe(100);
    });

    it('should return 0 for free items', () => {
      expect(calculateDepositFee(0)).toBe(0);
    });

    it('should floor fractional fees', () => {
      expect(calculateDepositFee(50)).toBe(0); // 0.5 floors to 0
      expect(calculateDepositFee(150)).toBe(1); // 1.5 floors to 1
    });
  });
});
