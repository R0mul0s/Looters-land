/**
 * Gacha System - Hero summoning mechanics
 *
 * Implements the gacha (lootbox) system for hero recruitment.
 * Features:
 * - Rarity-based summoning (Common 60%, Rare 25%, Epic 12%, Legendary 3%)
 * - Pity system (guaranteed Epic after 100 summons without Epic+)
 * - Daily free summon
 * - Single and 10x summons
 * - Cost: 1,000g for 1x, 9,000g for 10x (10% discount)
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import type { HeroTemplate, HeroRarity, GachaState } from '../../types/hero.types';
import { HERO_POOL } from './HeroPool';

export class GachaSystem {
  /**
   * Summon costs
   */
  static readonly COST_SINGLE = 1000;
  static readonly COST_TEN = 9000;

  /**
   * Rarity drop rates (in percentages)
   */
  static readonly RATES = {
    common: 60,
    rare: 25,
    epic: 12,
    legendary: 3
  };

  /**
   * Pity system threshold
   * Guaranteed Epic after this many summons without Epic+
   */
  static readonly PITY_THRESHOLD = 100;

  /**
   * Check if player can use daily free summon
   */
  static canUseFreeSummon(): boolean {
    // DEBUG MODE: Always allow free summon for testing
    return true;

    // ORIGINAL CODE (uncomment to restore):
    // if (!gachaState.lastFreeSummonDate) {
    //   return true; // Never used before
    // }
    //
    // const today = new Date().toISOString().split('T')[0];
    // const lastSummonDate = gachaState.lastFreeSummonDate.split('T')[0];
    // return lastSummonDate !== today;
  }

  /**
   * Perform a single summon
   * @param gachaState Current gacha state (for pity tracking)
   * @param isFree Whether this is a free summon
   * @returns Summon result with hero and updated gacha state
   */
  static summon(gachaState: GachaState, isFree: boolean = false): { result: HeroTemplate; newGachaState: GachaState } {
    // Determine rarity
    let rarity: HeroRarity;

    // Check pity system first
    if (gachaState.pitySummons >= this.PITY_THRESHOLD) {
      // Guaranteed Epic
      rarity = 'epic';
    } else {
      // Normal RNG
      rarity = this.rollRarity();
    }

    // Get random hero of that rarity
    const hero = this.getRandomHeroByRarity(rarity);

    // Update gacha state
    const newGachaState: GachaState = {
      summonCount: gachaState.summonCount + 1,
      lastFreeSummonDate: isFree ? new Date().toISOString() : gachaState.lastFreeSummonDate,
      pitySummons: (rarity === 'epic' || rarity === 'legendary') ? 0 : gachaState.pitySummons + 1
    };

    return { result: hero, newGachaState };
  }

  /**
   * Perform 10x summon
   * Guaranteed at least 1 Rare or better
   */
  static summonTen(gachaState: GachaState): { results: HeroTemplate[]; newGachaState: GachaState } {
    const results: HeroTemplate[] = [];
    let currentState = { ...gachaState };

    // First 9 summons
    for (let i = 0; i < 9; i++) {
      const { result, newGachaState } = this.summon(currentState, false);
      results.push(result);
      currentState = newGachaState;
    }

    // 10th summon - guaranteed Rare or better if no Rare+ yet
    const hasRareOrBetter = results.some(h => h.rarity === 'rare' || h.rarity === 'epic' || h.rarity === 'legendary');

    if (hasRareOrBetter) {
      // Normal summon
      const { result, newGachaState } = this.summon(currentState, false);
      results.push(result);
      currentState = newGachaState;
    } else {
      // Force Rare or better
      const rarity = this.rollRarity(['rare', 'epic', 'legendary']);
      const hero = this.getRandomHeroByRarity(rarity);
      results.push(hero);
      currentState = {
        summonCount: currentState.summonCount + 1,
        lastFreeSummonDate: currentState.lastFreeSummonDate,
        pitySummons: (rarity === 'epic' || rarity === 'legendary') ? 0 : currentState.pitySummons + 1
      };
    }

    return { results, newGachaState: currentState };
  }

  /**
   * Roll for rarity based on drop rates
   * @param allowedRarities Optional filter for allowed rarities
   */
  private static rollRarity(allowedRarities?: HeroRarity[]): HeroRarity {
    const roll = Math.random() * 100;

    // Filter rates if needed
    const rates = allowedRarities
      ? Object.entries(this.RATES).filter(([rarity]) => allowedRarities.includes(rarity as HeroRarity))
      : Object.entries(this.RATES);

    // Normalize rates if filtered
    const totalRate = rates.reduce((sum, [, rate]) => sum + rate, 0);
    const normalizedRates = rates.map(([rarity, rate]) => [rarity, (rate / totalRate) * 100]);

    let cumulative = 0;
    for (const [rarity, rate] of normalizedRates) {
      cumulative += Number(rate);
      if (roll < cumulative) {
        return rarity as HeroRarity;
      }
    }

    // Fallback (should never reach here)
    return allowedRarities ? allowedRarities[0] : 'common';
  }

  /**
   * Get random hero of specific rarity from the pool
   */
  private static getRandomHeroByRarity(rarity: HeroRarity): HeroTemplate {
    const heroesOfRarity = HERO_POOL.filter(h => h.rarity === rarity);

    if (heroesOfRarity.length === 0) {
      throw new Error(`No heroes found for rarity: ${rarity}`);
    }

    const randomIndex = Math.floor(Math.random() * heroesOfRarity.length);
    return heroesOfRarity[randomIndex];
  }

  /**
   * Check if player has enough gold for summon
   */
  static canAffordSingle(gold: number): boolean {
    return gold >= this.COST_SINGLE;
  }

  static canAffordTen(gold: number): boolean {
    return gold >= this.COST_TEN;
  }

  /**
   * Get current pity progress info
   */
  static getPityInfo(gachaState: GachaState): {
    current: number;
    total: number;
    percentage: number;
    isGuaranteed: boolean;
  } {
    return {
      current: gachaState.pitySummons,
      total: this.PITY_THRESHOLD,
      percentage: (gachaState.pitySummons / this.PITY_THRESHOLD) * 100,
      isGuaranteed: gachaState.pitySummons >= this.PITY_THRESHOLD
    };
  }
}
