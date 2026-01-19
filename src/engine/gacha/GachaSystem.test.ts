/**
 * Gacha System Tests
 *
 * Tests for hero summoning, drop rates, pity system, and guarantees.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GachaSystem } from './GachaSystem';
import type { GachaState, HeroRarity } from '../../types/hero.types';

describe('GachaSystem', () => {
  /**
   * Helper to create fresh gacha state
   */
  const createGachaState = (overrides: Partial<GachaState> = {}): GachaState => ({
    summonCount: 0,
    lastFreeSummonDate: null,
    pitySummons: 0,
    ...overrides
  });

  describe('Constants', () => {
    it('should have correct single summon cost', () => {
      expect(GachaSystem.COST_SINGLE).toBe(1000);
    });

    it('should have correct 10x summon cost (10% discount)', () => {
      expect(GachaSystem.COST_TEN).toBe(9000);
      // Verify it's actually 10% discount
      expect(GachaSystem.COST_TEN).toBe(GachaSystem.COST_SINGLE * 10 * 0.9);
    });

    it('should have correct drop rates totaling 100%', () => {
      const totalRate = Object.values(GachaSystem.RATES).reduce((sum, rate) => sum + rate, 0);
      expect(totalRate).toBe(100);
    });

    it('should have correct individual drop rates', () => {
      expect(GachaSystem.RATES.common).toBe(60);
      expect(GachaSystem.RATES.rare).toBe(25);
      expect(GachaSystem.RATES.epic).toBe(12);
      expect(GachaSystem.RATES.legendary).toBe(3);
    });

    it('should have pity threshold of 100', () => {
      expect(GachaSystem.PITY_THRESHOLD).toBe(100);
    });
  });

  describe('Single Summon', () => {
    it('should return a hero result', () => {
      const state = createGachaState();
      const { result } = GachaSystem.summon(state);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBeDefined();
      expect(result.rarity).toBeDefined();
    });

    it('should increment summon count', () => {
      const state = createGachaState({ summonCount: 5 });
      const { newGachaState } = GachaSystem.summon(state);

      expect(newGachaState.summonCount).toBe(6);
    });

    it('should increment pity counter for common/rare summons', () => {
      // Mock random to force common
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.1); // 10% = common

      const state = createGachaState({ pitySummons: 10 });
      const { result, newGachaState } = GachaSystem.summon(state);

      // If common or rare, pity should increment
      if (result.rarity === 'common' || result.rarity === 'rare') {
        expect(newGachaState.pitySummons).toBe(11);
      }

      mockRandom.mockRestore();
    });

    it('should reset pity counter on epic pull', () => {
      // Mock random to force epic (60 + 25 = 85, epic at 85-97)
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.90); // 90% = epic

      const state = createGachaState({ pitySummons: 50 });
      const { newGachaState } = GachaSystem.summon(state);

      expect(newGachaState.pitySummons).toBe(0);

      mockRandom.mockRestore();
    });

    it('should reset pity counter on legendary pull', () => {
      // Mock random to force legendary (97-100)
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.98);

      const state = createGachaState({ pitySummons: 75 });
      const { newGachaState } = GachaSystem.summon(state);

      expect(newGachaState.pitySummons).toBe(0);

      mockRandom.mockRestore();
    });

    it('should update lastFreeSummonDate for free summons', () => {
      const state = createGachaState();
      const { newGachaState } = GachaSystem.summon(state, true);

      expect(newGachaState.lastFreeSummonDate).not.toBeNull();
    });

    it('should not update lastFreeSummonDate for paid summons', () => {
      const state = createGachaState({ lastFreeSummonDate: '2025-01-01' });
      const { newGachaState } = GachaSystem.summon(state, false);

      expect(newGachaState.lastFreeSummonDate).toBe('2025-01-01');
    });
  });

  describe('Pity System', () => {
    it('should guarantee epic at pity threshold', () => {
      const state = createGachaState({ pitySummons: 100 });
      const { result, newGachaState } = GachaSystem.summon(state);

      expect(['epic', 'legendary']).toContain(result.rarity);
      expect(newGachaState.pitySummons).toBe(0);
    });

    it('should guarantee epic when exceeding pity threshold', () => {
      const state = createGachaState({ pitySummons: 150 });
      const { result, newGachaState } = GachaSystem.summon(state);

      expect(['epic', 'legendary']).toContain(result.rarity);
      expect(newGachaState.pitySummons).toBe(0);
    });

    it('should not guarantee epic before threshold', () => {
      // Run multiple summons at 99 pity
      let commonCount = 0;
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const state = createGachaState({ pitySummons: 99 });
        const { result } = GachaSystem.summon(state);
        if (result.rarity === 'common') commonCount++;
      }

      // Should have some common results (not guaranteed epic)
      expect(commonCount).toBeGreaterThan(0);
    });
  });

  describe('10x Summon', () => {
    it('should return exactly 10 heroes', () => {
      const state = createGachaState();
      const { results } = GachaSystem.summonTen(state);

      expect(results).toHaveLength(10);
    });

    it('should increment summon count by 10', () => {
      const state = createGachaState({ summonCount: 5 });
      const { newGachaState } = GachaSystem.summonTen(state);

      expect(newGachaState.summonCount).toBe(15);
    });

    it('should guarantee at least 1 rare or better', () => {
      // Run multiple 10x summons to test the guarantee
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        const state = createGachaState();
        const { results } = GachaSystem.summonTen(state);

        const hasRareOrBetter = results.some(
          (h) => h.rarity === 'rare' || h.rarity === 'epic' || h.rarity === 'legendary'
        );

        expect(hasRareOrBetter).toBe(true);
      }
    });

    it('should return all heroes with valid rarities', () => {
      const state = createGachaState();
      const { results } = GachaSystem.summonTen(state);

      const validRarities: HeroRarity[] = ['common', 'rare', 'epic', 'legendary'];

      for (const hero of results) {
        expect(validRarities).toContain(hero.rarity);
      }
    });
  });

  describe('Affordability Checks', () => {
    it('should return true when can afford single summon', () => {
      expect(GachaSystem.canAffordSingle(1000)).toBe(true);
      expect(GachaSystem.canAffordSingle(1500)).toBe(true);
      expect(GachaSystem.canAffordSingle(999999)).toBe(true);
    });

    it('should return false when cannot afford single summon', () => {
      expect(GachaSystem.canAffordSingle(999)).toBe(false);
      expect(GachaSystem.canAffordSingle(500)).toBe(false);
      expect(GachaSystem.canAffordSingle(0)).toBe(false);
    });

    it('should return true when can afford 10x summon', () => {
      expect(GachaSystem.canAffordTen(9000)).toBe(true);
      expect(GachaSystem.canAffordTen(10000)).toBe(true);
      expect(GachaSystem.canAffordTen(999999)).toBe(true);
    });

    it('should return false when cannot afford 10x summon', () => {
      expect(GachaSystem.canAffordTen(8999)).toBe(false);
      expect(GachaSystem.canAffordTen(5000)).toBe(false);
      expect(GachaSystem.canAffordTen(0)).toBe(false);
    });
  });

  describe('Pity Info', () => {
    it('should return correct pity info at 0 summons', () => {
      const state = createGachaState({ pitySummons: 0 });
      const info = GachaSystem.getPityInfo(state);

      expect(info.current).toBe(0);
      expect(info.total).toBe(100);
      expect(info.percentage).toBe(0);
      expect(info.isGuaranteed).toBe(false);
    });

    it('should return correct pity info at 50 summons', () => {
      const state = createGachaState({ pitySummons: 50 });
      const info = GachaSystem.getPityInfo(state);

      expect(info.current).toBe(50);
      expect(info.total).toBe(100);
      expect(info.percentage).toBe(50);
      expect(info.isGuaranteed).toBe(false);
    });

    it('should return guaranteed at threshold', () => {
      const state = createGachaState({ pitySummons: 100 });
      const info = GachaSystem.getPityInfo(state);

      expect(info.current).toBe(100);
      expect(info.percentage).toBe(100);
      expect(info.isGuaranteed).toBe(true);
    });

    it('should return guaranteed above threshold', () => {
      const state = createGachaState({ pitySummons: 150 });
      const info = GachaSystem.getPityInfo(state);

      expect(info.isGuaranteed).toBe(true);
      expect(info.percentage).toBe(150);
    });
  });

  describe('Drop Rate Distribution', () => {
    it('should produce approximate expected distribution over many summons', () => {
      // Statistical test - run many summons and check distribution
      const iterations = 1000;
      const counts: Record<HeroRarity, number> = {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0
      };

      for (let i = 0; i < iterations; i++) {
        const state = createGachaState();
        const { result } = GachaSystem.summon(state);
        counts[result.rarity]++;
      }

      // Check that distribution is roughly correct (with 15% tolerance due to RNG)
      const tolerance = 0.15;

      const commonRate = counts.common / iterations;
      const rareRate = counts.rare / iterations;
      const epicRate = counts.epic / iterations;
      const legendaryRate = counts.legendary / iterations;

      // Common: 60% expected
      expect(commonRate).toBeGreaterThan(0.6 - tolerance);
      expect(commonRate).toBeLessThan(0.6 + tolerance);

      // Rare: 25% expected
      expect(rareRate).toBeGreaterThan(0.25 - tolerance);
      expect(rareRate).toBeLessThan(0.25 + tolerance);

      // Epic: 12% expected
      expect(epicRate).toBeGreaterThan(0.12 - tolerance);
      expect(epicRate).toBeLessThan(0.12 + tolerance);

      // Legendary: 3% expected (wider tolerance for rare events)
      expect(legendaryRate).toBeGreaterThanOrEqual(0);
      expect(legendaryRate).toBeLessThan(0.1); // Should be under 10%
    });

    it('should produce all rarities over many summons', () => {
      const iterations = 500;
      const rarities = new Set<HeroRarity>();

      for (let i = 0; i < iterations; i++) {
        const state = createGachaState();
        const { result } = GachaSystem.summon(state);
        rarities.add(result.rarity);
      }

      // Should have seen all 4 rarities
      expect(rarities.size).toBe(4);
      expect(rarities.has('common')).toBe(true);
      expect(rarities.has('rare')).toBe(true);
      expect(rarities.has('epic')).toBe(true);
      expect(rarities.has('legendary')).toBe(true);
    });
  });

  describe('Free Summon', () => {
    it('should allow free summon (debug mode)', () => {
      // Currently in debug mode - always returns true
      expect(GachaSystem.canUseFreeSummon()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle summon with max pity', () => {
      const state = createGachaState({ pitySummons: Number.MAX_SAFE_INTEGER });
      const { result, newGachaState } = GachaSystem.summon(state);

      expect(['epic', 'legendary']).toContain(result.rarity);
      expect(newGachaState.pitySummons).toBe(0);
    });

    it('should handle multiple consecutive summons', () => {
      let state = createGachaState();

      for (let i = 0; i < 50; i++) {
        const { newGachaState } = GachaSystem.summon(state);
        state = newGachaState;
      }

      expect(state.summonCount).toBe(50);
    });

    it('should handle mixed free and paid summons', () => {
      let state = createGachaState();

      // Paid summon
      let result = GachaSystem.summon(state, false);
      state = result.newGachaState;
      const dateAfterPaid = state.lastFreeSummonDate;

      // Free summon
      result = GachaSystem.summon(state, true);
      state = result.newGachaState;

      expect(state.summonCount).toBe(2);
      expect(state.lastFreeSummonDate).not.toBe(dateAfterPaid);
    });
  });
});
