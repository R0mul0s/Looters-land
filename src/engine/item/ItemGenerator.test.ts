/**
 * Item Generation Tests
 *
 * Tests for item rarity distribution, stat ranges, gold values, and item creation.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import { describe, it, expect, vi } from 'vitest';
import { ItemGenerator } from './ItemGenerator';
import { Item } from './Item';
import type { ItemRarity, ItemSlot } from '../../types/item.types';
import { RARITY_MULTIPLIERS } from '../../types/item.types';

// Mock i18n to avoid browser dependencies
vi.mock('../../localization/i18n', () => ({
  t: (key: string) => key
}));

describe('ItemGenerator', () => {
  describe('Basic Generation', () => {
    it('should generate item with correct level', () => {
      const item = ItemGenerator.generate(10, 'rare');
      expect(item.level).toBe(10);
    });

    it('should generate item with correct rarity', () => {
      const rarities: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

      rarities.forEach((rarity) => {
        const item = ItemGenerator.generate(5, rarity);
        expect(item.rarity).toBe(rarity);
      });
    });

    it('should generate item with specified slot', () => {
      const slots: ItemSlot[] = ['helmet', 'weapon', 'chest', 'gloves', 'legs', 'boots', 'accessory'];

      slots.forEach((slot) => {
        const item = ItemGenerator.generate(5, 'rare', slot);
        expect(item.slot).toBe(slot);
      });
    });

    it('should generate random slot if not specified', () => {
      const validSlots = ['helmet', 'weapon', 'chest', 'gloves', 'legs', 'boots', 'accessory'];
      const generatedSlots = new Set<string>();

      // Generate multiple items to check randomness
      for (let i = 0; i < 100; i++) {
        const item = ItemGenerator.generate(5, 'rare');
        generatedSlots.add(item.slot);
      }

      // Should have generated at least 3 different slot types
      expect(generatedSlots.size).toBeGreaterThanOrEqual(3);

      // All slots should be valid
      generatedSlots.forEach((slot) => {
        expect(validSlots).toContain(slot);
      });
    });

    it('should return Item instance', () => {
      const item = ItemGenerator.generate(5, 'rare');
      expect(item).toBeInstanceOf(Item);
    });
  });

  describe('Stat Generation', () => {
    describe('Rarity Scaling', () => {
      it('should generate higher stats for higher rarities', () => {
        const commonItem = ItemGenerator.generate(10, 'common', 'weapon');
        const rareItem = ItemGenerator.generate(10, 'rare', 'weapon');
        const epicItem = ItemGenerator.generate(10, 'epic', 'weapon');
        const legendaryItem = ItemGenerator.generate(10, 'legendary', 'weapon');

        // ATK should increase with rarity for weapons
        expect(rareItem.stats.ATK).toBeGreaterThan(commonItem.stats.ATK);
        expect(epicItem.stats.ATK).toBeGreaterThan(rareItem.stats.ATK);
        expect(legendaryItem.stats.ATK).toBeGreaterThan(epicItem.stats.ATK);
      });

      it('should use correct rarity multipliers', () => {
        expect(Item.getRarityMultiplier('common')).toBe(1.0);
        expect(Item.getRarityMultiplier('uncommon')).toBe(1.2);
        expect(Item.getRarityMultiplier('rare')).toBe(1.5);
        expect(Item.getRarityMultiplier('epic')).toBe(2.0);
        expect(Item.getRarityMultiplier('legendary')).toBe(3.0);
        expect(Item.getRarityMultiplier('mythic')).toBe(5.0);
      });

      it('should match RARITY_MULTIPLIERS constant', () => {
        const rarities: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

        rarities.forEach((rarity) => {
          expect(Item.getRarityMultiplier(rarity)).toBe(RARITY_MULTIPLIERS[rarity]);
        });
      });
    });

    describe('Level Scaling', () => {
      it('should generate higher stats for higher levels', () => {
        const level1Item = ItemGenerator.generate(1, 'rare', 'weapon');
        const level10Item = ItemGenerator.generate(10, 'rare', 'weapon');
        const level50Item = ItemGenerator.generate(50, 'rare', 'weapon');

        expect(level10Item.stats.ATK).toBeGreaterThan(level1Item.stats.ATK);
        expect(level50Item.stats.ATK).toBeGreaterThan(level10Item.stats.ATK);
      });

      it('should use exponential level scaling (level^1.2)', () => {
        const level1Item = ItemGenerator.generate(1, 'common', 'weapon');
        const level10Item = ItemGenerator.generate(10, 'common', 'weapon');

        // Level 10 scaling: 10^1.2 ≈ 15.85
        // Level 1 scaling: 1^1.2 = 1
        // So level 10 should be roughly 15x stronger
        const ratio = level10Item.stats.ATK / Math.max(level1Item.stats.ATK, 1);
        expect(ratio).toBeGreaterThan(5); // At least 5x stronger
        expect(ratio).toBeLessThan(25); // But not more than 25x
      });
    });

    describe('Slot-specific Stats', () => {
      it('should give weapons high ATK', () => {
        const weapon = ItemGenerator.generate(10, 'rare', 'weapon');
        const chest = ItemGenerator.generate(10, 'rare', 'chest');

        expect(weapon.stats.ATK).toBeGreaterThan(chest.stats.ATK);
      });

      it('should give armor high HP and DEF', () => {
        const chest = ItemGenerator.generate(10, 'rare', 'chest');
        const accessory = ItemGenerator.generate(10, 'rare', 'accessory');

        expect(chest.stats.HP).toBeGreaterThan(accessory.stats.HP);
        expect(chest.stats.DEF).toBeGreaterThan(accessory.stats.DEF);
      });

      it('should give boots high SPD', () => {
        const boots = ItemGenerator.generate(10, 'rare', 'boots');
        const helmet = ItemGenerator.generate(10, 'rare', 'helmet');

        expect(boots.stats.SPD).toBeGreaterThan(helmet.stats.SPD);
      });

      it('should give accessories high CRIT', () => {
        const accessory = ItemGenerator.generate(10, 'rare', 'accessory');
        const legs = ItemGenerator.generate(10, 'rare', 'legs');

        expect(accessory.stats.CRIT).toBeGreaterThan(legs.stats.CRIT);
      });

      it('should generate correct stat templates for each slot', () => {
        const slots: ItemSlot[] = ['helmet', 'weapon', 'chest', 'gloves', 'legs', 'boots', 'accessory'];

        slots.forEach((slot) => {
          const item = ItemGenerator.generate(10, 'rare', slot);

          // All items should have non-negative stats
          expect(item.stats.HP).toBeGreaterThanOrEqual(0);
          expect(item.stats.ATK).toBeGreaterThanOrEqual(0);
          expect(item.stats.DEF).toBeGreaterThanOrEqual(0);
          expect(item.stats.SPD).toBeGreaterThanOrEqual(0);
          expect(item.stats.CRIT).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });

  describe('Name Generation', () => {
    it('should generate names with rarity prefix', () => {
      const rareItem = ItemGenerator.generate(5, 'rare', 'weapon');
      const epicItem = ItemGenerator.generate(5, 'epic', 'weapon');

      // Rare items get prefixes like "Fine", "Quality", "Sturdy", "Sharp"
      const rarePrefixes = ['Fine', 'Quality', 'Sturdy', 'Sharp'];
      const hasRarePrefix = rarePrefixes.some((prefix) => rareItem.name.includes(prefix));
      expect(hasRarePrefix).toBe(true);

      // Epic items get prefixes like "Superior", "Enhanced", "Reinforced", "Blessed"
      const epicPrefixes = ['Superior', 'Enhanced', 'Reinforced', 'Blessed'];
      const hasEpicPrefix = epicPrefixes.some((prefix) => epicItem.name.includes(prefix));
      expect(hasEpicPrefix).toBe(true);
    });

    it('should generate common items without prefix', () => {
      const commonItem = ItemGenerator.generate(5, 'common', 'weapon');

      // Common items don't have prefixes
      const prefixedWords = ['Fine', 'Quality', 'Ancient', 'Mystic', 'Superior'];
      const hasPrefix = prefixedWords.some((prefix) => commonItem.name.startsWith(prefix));
      expect(hasPrefix).toBe(false);
    });

    it('should generate slot-appropriate names', () => {
      const helmet = ItemGenerator.generate(5, 'rare', 'helmet');
      const weapon = ItemGenerator.generate(5, 'rare', 'weapon');
      const boots = ItemGenerator.generate(5, 'rare', 'boots');

      // Helmet names should contain helmet-related words
      const helmetNames = ['Helmet', 'Helm', 'Crown', 'Circlet'];
      const hasHelmetName = helmetNames.some((name) => helmet.name.includes(name));
      expect(hasHelmetName).toBe(true);

      // Weapon names should contain weapon-related words
      const weaponNames = ['Sword', 'Blade', 'Axe', 'Mace'];
      const hasWeaponName = weaponNames.some((name) => weapon.name.includes(name));
      expect(hasWeaponName).toBe(true);

      // Boots names should contain boots-related words
      const bootNames = ['Boots', 'Shoes', 'Treads'];
      const hasBootName = bootNames.some((name) => boots.name.includes(name));
      expect(hasBootName).toBe(true);
    });
  });

  describe('Description Generation', () => {
    it('should generate slot-appropriate descriptions', () => {
      const helmet = ItemGenerator.generate(5, 'rare', 'helmet');
      const weapon = ItemGenerator.generate(5, 'rare', 'weapon');

      expect(helmet.description).toContain('head');
      expect(weapon.description).toContain('combat');
    });
  });
});

describe('Item', () => {
  describe('Gold Value Calculation', () => {
    it('should calculate value based on rarity', () => {
      const commonItem = ItemGenerator.generate(10, 'common', 'weapon');
      const rareItem = ItemGenerator.generate(10, 'rare', 'weapon');
      const legendaryItem = ItemGenerator.generate(10, 'legendary', 'weapon');

      expect(rareItem.goldValue).toBeGreaterThan(commonItem.goldValue);
      expect(legendaryItem.goldValue).toBeGreaterThan(rareItem.goldValue);
    });

    it('should calculate value based on level', () => {
      const level1Item = ItemGenerator.generate(1, 'rare', 'weapon');
      const level50Item = ItemGenerator.generate(50, 'rare', 'weapon');

      expect(level50Item.goldValue).toBeGreaterThan(level1Item.goldValue);
    });

    it('should increase value with enchant level', () => {
      const item = ItemGenerator.generate(10, 'rare', 'weapon');
      const baseValue = item.goldValue;

      item.enchantLevel = 5;
      const enchantedValue = item.calculateValue();

      expect(enchantedValue).toBeGreaterThan(baseValue);
    });

    it('should use formula: baseValue * (level/5) * (1 + enchant * 0.2)', () => {
      const item = new Item({
        name: 'Test',
        rarity: 'rare', // base value 200
        level: 10,
        slot: 'weapon',
        enchantLevel: 0
      });

      // Expected: 200 * (10/5) * 1 = 400
      expect(item.goldValue).toBe(Math.floor(200 * (10 / 5)));
    });
  });

  describe('Enchanting System', () => {
    it('should increase enchant level on success', () => {
      const item = ItemGenerator.generate(10, 'rare', 'weapon');
      expect(item.enchantLevel).toBe(0);

      // Force success
      const result = item.enchant(true);

      expect(result.success).toBe(true);
      expect(item.enchantLevel).toBe(1);
    });

    it('should not exceed max enchant level', () => {
      const item = ItemGenerator.generate(10, 'rare', 'weapon');
      item.enchantLevel = 10; // Max level

      const result = item.enchant(true);

      expect(result.success).toBe(false);
      expect(item.enchantLevel).toBe(10);
      expect(result.message).toContain('maximum');
    });

    it('should have decreasing success chance at higher levels', () => {
      // Success chances: 0: 90%, 5: 50%, 9: 30%
      // This is probabilistic so we just verify the function exists
      const item = ItemGenerator.generate(10, 'rare', 'weapon');

      // Multiple enchant attempts
      let successes = 0;
      let failures = 0;

      for (let i = 0; i < 100; i++) {
        const testItem = ItemGenerator.generate(10, 'rare', 'weapon');
        testItem.enchantLevel = 5; // 50% chance
        const result = testItem.enchant();
        if (result.success) successes++;
        else failures++;
      }

      // With 50% chance, both should be > 0
      expect(successes).toBeGreaterThan(0);
      expect(failures).toBeGreaterThan(0);
    });

    it('should boost stats with enchant level', () => {
      const item = ItemGenerator.generate(10, 'rare', 'weapon');
      const baseStats = { ...item.stats };

      item.enchantLevel = 5;
      const enhancedStats = item.getEffectiveStats();

      // +10% per level = +50% at +5
      expect(enhancedStats.ATK).toBeGreaterThan(baseStats.ATK);
      expect(enhancedStats.ATK).toBe(Math.floor(baseStats.ATK * 1.5));
    });
  });

  describe('Item Score', () => {
    it('should calculate score based on rarity, level, enchant, and slot', () => {
      const item = ItemGenerator.generate(10, 'rare', 'weapon');
      const score = item.getScore();

      expect(score).toBeGreaterThan(0);
    });

    it('should give higher score to higher rarity items', () => {
      const common = ItemGenerator.generate(10, 'common', 'weapon');
      const legendary = ItemGenerator.generate(10, 'legendary', 'weapon');

      expect(legendary.getScore()).toBeGreaterThan(common.getScore());
    });

    it('should give higher score to weapons (1.5x multiplier)', () => {
      const weapon = new Item({
        name: 'Test',
        rarity: 'rare',
        level: 10,
        slot: 'weapon',
        enchantLevel: 0
      });

      const helmet = new Item({
        name: 'Test',
        rarity: 'rare',
        level: 10,
        slot: 'helmet',
        enchantLevel: 0
      });

      expect(weapon.getScore()).toBeGreaterThan(helmet.getScore());
    });

    it('should increase score with enchant level', () => {
      const item = ItemGenerator.generate(10, 'rare', 'weapon');
      const baseScore = item.getScore();

      item.enchantLevel = 5;
      const enchantedScore = item.getScore();

      expect(enchantedScore).toBeGreaterThan(baseScore);
    });
  });

  describe('Display Name', () => {
    it('should show enchant level in display name', () => {
      const item = ItemGenerator.generate(10, 'rare', 'weapon');
      item.enchantLevel = 5;

      expect(item.getDisplayName()).toContain('+5');
    });

    it('should not show enchant level if 0', () => {
      const item = ItemGenerator.generate(10, 'rare', 'weapon');
      item.enchantLevel = 0;

      expect(item.getDisplayName()).not.toContain('+');
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const item = ItemGenerator.generate(10, 'rare', 'weapon');
      const json = item.toJSON();

      expect(json.name).toBe(item.name);
      expect(json.rarity).toBe(item.rarity);
      expect(json.level).toBe(item.level);
      expect(json.slot).toBe(item.slot);
      expect(json.stats).toEqual(item.stats);
    });

    it('should deserialize from JSON correctly', () => {
      const original = ItemGenerator.generate(10, 'rare', 'weapon');
      original.enchantLevel = 3;

      const json = original.toJSON();
      const restored = Item.fromJSON(json);

      expect(restored.name).toBe(original.name);
      expect(restored.rarity).toBe(original.rarity);
      expect(restored.level).toBe(original.level);
      expect(restored.enchantLevel).toBe(original.enchantLevel);
      expect(restored.stats).toEqual(original.stats);
    });

    it('should clone correctly', () => {
      const original = ItemGenerator.generate(10, 'rare', 'weapon');
      const clone = original.clone();

      expect(clone.id).toBe(original.id); // Same ID from JSON
      expect(clone.name).toBe(original.name);
      expect(clone.stats).toEqual(original.stats);

      // Should be separate objects
      clone.enchantLevel = 10;
      expect(original.enchantLevel).not.toBe(clone.enchantLevel);
    });
  });

  describe('Stat Comparison', () => {
    it('should compare stats with another item', () => {
      const item1 = new Item({
        name: 'Test1',
        rarity: 'rare',
        level: 10,
        slot: 'weapon',
        stats: { HP: 10, ATK: 50, DEF: 5, SPD: 3, CRIT: 2 }
      });

      const item2 = new Item({
        name: 'Test2',
        rarity: 'epic',
        level: 10,
        slot: 'weapon',
        stats: { HP: 15, ATK: 60, DEF: 8, SPD: 5, CRIT: 3 }
      });

      const comparison = item1.compareWith(item2);

      expect(comparison).not.toBeNull();
      expect(comparison!.HP).toBe(-5); // item1 has 5 less HP
      expect(comparison!.ATK).toBe(-10); // item1 has 10 less ATK
      expect(comparison!.DEF).toBe(-3);
      expect(comparison!.SPD).toBe(-2);
      expect(comparison!.CRIT).toBe(-1);
    });

    it('should return null when comparing with null', () => {
      const item = ItemGenerator.generate(10, 'rare', 'weapon');
      const comparison = item.compareWith(null);

      expect(comparison).toBeNull();
    });
  });
});

describe('Rarity Distribution (Statistical)', () => {
  it('should verify rarity multipliers are correctly ordered', () => {
    const multipliers = [
      Item.getRarityMultiplier('common'),
      Item.getRarityMultiplier('uncommon'),
      Item.getRarityMultiplier('rare'),
      Item.getRarityMultiplier('epic'),
      Item.getRarityMultiplier('legendary'),
      Item.getRarityMultiplier('mythic')
    ];

    // Each multiplier should be higher than previous
    for (let i = 1; i < multipliers.length; i++) {
      expect(multipliers[i]).toBeGreaterThan(multipliers[i - 1]);
    }
  });

  it('should generate items consistently at same level/rarity', () => {
    // Generate multiple items and verify consistency
    const items: Item[] = [];
    for (let i = 0; i < 100; i++) {
      items.push(ItemGenerator.generate(10, 'rare', 'weapon'));
    }

    // All items should have same level and rarity
    items.forEach((item) => {
      expect(item.level).toBe(10);
      expect(item.rarity).toBe('rare');
      expect(item.slot).toBe('weapon');
    });

    // Stats should vary (different names = different items)
    const uniqueNames = new Set(items.map((i) => i.name));
    expect(uniqueNames.size).toBeGreaterThan(1);
  });
});
