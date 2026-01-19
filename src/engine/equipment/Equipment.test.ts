/**
 * Equipment System Tests
 *
 * Tests for equipment management, stat calculation, and set bonuses.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Equipment } from './Equipment';
import { SetBonusManager } from './SetBonusManager';
import type { Hero } from '../hero/Hero';
import type { Item } from '../item/Item';
import type { EquipmentSlotName } from '../../types/equipment.types';
import type { ItemStats } from '../../types/item.types';

/**
 * Create mock Hero for testing
 */
function createMockHero(overrides: Partial<Hero> = {}): Hero {
  return {
    id: 'hero_test',
    name: 'Test Hero',
    level: 10,
    currentHP: 100,
    maxHP: 100,
    baseMaxHP: 100,
    ATK: 50,
    baseATK: 50,
    DEF: 30,
    baseDEF: 30,
    SPD: 20,
    baseSPD: 20,
    CRIT: 5,
    baseCRIT: 5,
    ...overrides
  } as Hero;
}

/**
 * Create mock Item for testing
 */
function createMockItem(overrides: Partial<Item> = {}): Item {
  const defaultStats: ItemStats = {
    HP: 10,
    ATK: 5,
    DEF: 3,
    SPD: 2,
    CRIT: 1
  };

  return {
    id: `item_${Date.now()}_${Math.random()}`,
    name: 'Test Sword',
    slot: 'weapon',
    type: 'equipment',
    level: 1,
    rarity: 'common',
    stats: defaultStats,
    getDisplayName: () => overrides.name || 'Test Sword',
    getEffectiveStats: () => overrides.stats || defaultStats,
    toJSON: () => ({}),
    ...overrides
  } as Item;
}

describe('Equipment', () => {
  let hero: Hero;
  let equipment: Equipment;

  beforeEach(() => {
    hero = createMockHero();
    equipment = new Equipment(hero);
  });

  describe('Initialization', () => {
    it('should create equipment with all slots empty', () => {
      expect(equipment.slots.helmet).toBeNull();
      expect(equipment.slots.weapon).toBeNull();
      expect(equipment.slots.chest).toBeNull();
      expect(equipment.slots.gloves).toBeNull();
      expect(equipment.slots.legs).toBeNull();
      expect(equipment.slots.boots).toBeNull();
      expect(equipment.slots.accessory1).toBeNull();
      expect(equipment.slots.accessory2).toBeNull();
    });

    it('should have reference to hero', () => {
      expect(equipment.hero).toBe(hero);
    });

    it('should have empty equipped sets map', () => {
      expect(equipment.equippedSets.size).toBe(0);
    });

    it('should have exactly 8 equipment slots', () => {
      expect(Object.keys(equipment.slots)).toHaveLength(8);
    });
  });

  describe('Equip', () => {
    it('should equip item to correct slot', () => {
      const sword = createMockItem({ slot: 'weapon' });

      const result = equipment.equip(sword);

      expect(result.success).toBe(true);
      expect(equipment.slots.weapon).toBe(sword);
    });

    it('should return unequipped item when replacing', () => {
      const oldSword = createMockItem({ name: 'Old Sword', slot: 'weapon' });
      const newSword = createMockItem({ name: 'New Sword', slot: 'weapon' });

      equipment.equip(oldSword);
      const result = equipment.equip(newSword);

      expect(result.success).toBe(true);
      expect(result.unequippedItem).toBe(oldSword);
      expect(equipment.slots.weapon).toBe(newSword);
    });

    it('should fail with invalid item', () => {
      const result = equipment.equip(null as any);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid item');
    });

    it('should fail with non-equipment item', () => {
      const consumable = createMockItem({ type: 'consumable' });

      const result = equipment.equip(consumable);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Not an equipment item');
    });

    it('should fail if hero level is too low', () => {
      const hero = createMockHero({ level: 5 });
      const equipment = new Equipment(hero);
      const highLevelItem = createMockItem({ level: 10 });

      const result = equipment.equip(highLevelItem);

      expect(result.success).toBe(false);
    });

    it('should handle accessories with two slots', () => {
      const ring1 = createMockItem({ name: 'Ring 1', slot: 'accessory' });
      const ring2 = createMockItem({ name: 'Ring 2', slot: 'accessory' });

      equipment.equip(ring1);
      equipment.equip(ring2);

      expect(equipment.slots.accessory1).toBe(ring1);
      expect(equipment.slots.accessory2).toBe(ring2);
    });

    it('should replace first accessory when both slots are full', () => {
      const ring1 = createMockItem({ name: 'Ring 1', slot: 'accessory' });
      const ring2 = createMockItem({ name: 'Ring 2', slot: 'accessory' });
      const ring3 = createMockItem({ name: 'Ring 3', slot: 'accessory' });

      equipment.equip(ring1);
      equipment.equip(ring2);
      const result = equipment.equip(ring3);

      expect(result.unequippedItem).toBe(ring1);
      expect(equipment.slots.accessory1).toBe(ring3);
      expect(equipment.slots.accessory2).toBe(ring2);
    });

    it('should recalculate hero stats after equipping', () => {
      const stats: ItemStats = { HP: 50, ATK: 20, DEF: 10, SPD: 5, CRIT: 2 };
      const item = createMockItem({ stats, slot: 'weapon' });

      equipment.equip(item);

      expect(hero.maxHP).toBe(100 + 50); // baseMaxHP + item HP
      expect(hero.ATK).toBe(50 + 20);
      expect(hero.DEF).toBe(30 + 10);
      expect(hero.SPD).toBe(20 + 5);
      expect(hero.CRIT).toBe(5 + 2);
    });
  });

  describe('Unequip', () => {
    it('should unequip item from slot', () => {
      const sword = createMockItem({ slot: 'weapon' });
      equipment.equip(sword);

      const result = equipment.unequip('weapon');

      expect(result.success).toBe(true);
      expect(result.item).toBe(sword);
      expect(equipment.slots.weapon).toBeNull();
    });

    it('should fail when slot is empty', () => {
      const result = equipment.unequip('weapon');

      expect(result.success).toBe(false);
      expect(result.message).toBe('No item equipped in that slot');
    });

    it('should recalculate hero stats after unequipping', () => {
      const stats: ItemStats = { HP: 50, ATK: 20, DEF: 10, SPD: 5, CRIT: 2 };
      const item = createMockItem({ stats, slot: 'weapon' });
      equipment.equip(item);

      equipment.unequip('weapon');

      expect(hero.maxHP).toBe(100); // Back to base
      expect(hero.ATK).toBe(50);
      expect(hero.DEF).toBe(30);
      expect(hero.SPD).toBe(20);
      expect(hero.CRIT).toBe(5);
    });
  });

  describe('getEquipped', () => {
    it('should return item in slot', () => {
      const sword = createMockItem({ slot: 'weapon' });
      equipment.equip(sword);

      expect(equipment.getEquipped('weapon')).toBe(sword);
    });

    it('should return null for empty slot', () => {
      expect(equipment.getEquipped('weapon')).toBeNull();
    });
  });

  describe('getAllEquipped', () => {
    it('should return all equipped items', () => {
      const sword = createMockItem({ slot: 'weapon' });
      const helmet = createMockItem({ slot: 'helmet' });

      equipment.equip(sword);
      equipment.equip(helmet);

      const equipped = equipment.getAllEquipped();

      expect(equipped).toHaveLength(2);
      expect(equipped.some((e) => e.slot === 'weapon')).toBe(true);
      expect(equipped.some((e) => e.slot === 'helmet')).toBe(true);
    });

    it('should return empty array when nothing equipped', () => {
      const equipped = equipment.getAllEquipped();
      expect(equipped).toHaveLength(0);
    });
  });

  describe('isSlotEmpty', () => {
    it('should return true for empty slot', () => {
      expect(equipment.isSlotEmpty('weapon')).toBe(true);
    });

    it('should return false for occupied slot', () => {
      const sword = createMockItem({ slot: 'weapon' });
      equipment.equip(sword);

      expect(equipment.isSlotEmpty('weapon')).toBe(false);
    });
  });

  describe('getTotalEquipmentStats', () => {
    it('should return zero stats when nothing equipped', () => {
      const stats = equipment.getTotalEquipmentStats();

      expect(stats.HP).toBe(0);
      expect(stats.ATK).toBe(0);
      expect(stats.DEF).toBe(0);
      expect(stats.SPD).toBe(0);
      expect(stats.CRIT).toBe(0);
    });

    it('should sum stats from all equipped items', () => {
      const sword = createMockItem({
        slot: 'weapon',
        stats: { HP: 10, ATK: 20, DEF: 5, SPD: 3, CRIT: 2 }
      });
      const helmet = createMockItem({
        slot: 'helmet',
        stats: { HP: 30, ATK: 5, DEF: 15, SPD: 2, CRIT: 1 }
      });

      equipment.equip(sword);
      equipment.equip(helmet);

      const stats = equipment.getTotalEquipmentStats();

      expect(stats.HP).toBe(40);
      expect(stats.ATK).toBe(25);
      expect(stats.DEF).toBe(20);
      expect(stats.SPD).toBe(5);
      expect(stats.CRIT).toBe(3);
    });
  });

  describe('Set Bonus Tracking', () => {
    it('should track equipped sets', () => {
      const sword = createMockItem({ slot: 'weapon', setId: 'warrior_set' });
      const helmet = createMockItem({ slot: 'helmet', setId: 'warrior_set' });

      equipment.equip(sword);
      equipment.equip(helmet);

      expect(equipment.equippedSets.get('warrior_set')).toBe(2);
    });

    it('should update set tracking when unequipping', () => {
      const sword = createMockItem({ slot: 'weapon', setId: 'warrior_set' });
      const helmet = createMockItem({ slot: 'helmet', setId: 'warrior_set' });

      equipment.equip(sword);
      equipment.equip(helmet);
      equipment.unequip('weapon');

      expect(equipment.equippedSets.get('warrior_set')).toBe(1);
    });

    it('should handle items without setId', () => {
      const sword = createMockItem({ slot: 'weapon' }); // No setId

      equipment.equip(sword);

      expect(equipment.equippedSets.size).toBe(0);
    });
  });

  describe('getPowerScore', () => {
    it('should calculate power score from stats', () => {
      const stats: ItemStats = { HP: 100, ATK: 50, DEF: 30, SPD: 20, CRIT: 5 };
      const sword = createMockItem({ stats, slot: 'weapon' });

      equipment.equip(sword);

      const powerScore = equipment.getPowerScore();

      // HP + ATK*2 + DEF*1.5 + SPD + CRIT*10
      // 100 + 100 + 45 + 20 + 50 = 315
      expect(powerScore).toBe(315);
    });

    it('should return 0 when nothing equipped', () => {
      expect(equipment.getPowerScore()).toBe(0);
    });
  });

  describe('toJSON', () => {
    it('should serialize equipment to JSON', () => {
      const sword = createMockItem({ slot: 'weapon' });
      equipment.equip(sword);

      const json = equipment.toJSON();

      expect(json.slots).toBeDefined();
      expect(json.slots.weapon).toBeDefined();
      expect(json.slots.helmet).toBeNull();
    });
  });
});

describe('SetBonusManager', () => {
  describe('Set Definitions', () => {
    it('should have 5 class-based sets', () => {
      const sets = SetBonusManager.getAllSets();
      expect(sets).toHaveLength(5);
    });

    it('should have warrior set', () => {
      const info = SetBonusManager.getSetInfo('warrior_set');
      expect(info).not.toBeNull();
      expect(info!.name).toBe("Warrior's Valor");
    });

    it('should have archer set', () => {
      const info = SetBonusManager.getSetInfo('archer_set');
      expect(info).not.toBeNull();
      expect(info!.name).toBe("Hunter's Focus");
    });

    it('should have mage set', () => {
      const info = SetBonusManager.getSetInfo('mage_set');
      expect(info).not.toBeNull();
      expect(info!.name).toBe('Arcane Wisdom');
    });

    it('should have cleric set', () => {
      const info = SetBonusManager.getSetInfo('cleric_set');
      expect(info).not.toBeNull();
      expect(info!.name).toBe('Divine Grace');
    });

    it('should have paladin set', () => {
      const info = SetBonusManager.getSetInfo('paladin_set');
      expect(info).not.toBeNull();
      expect(info!.name).toBe('Righteous Protector');
    });
  });

  describe('getBonus', () => {
    it('should return null for invalid set', () => {
      const bonus = SetBonusManager.getBonus('invalid_set', 2);
      expect(bonus).toBeNull();
    });

    it('should return null for insufficient pieces', () => {
      const bonus = SetBonusManager.getBonus('warrior_set', 1);
      expect(bonus).toBeNull();
    });

    it('should return 2-piece bonus', () => {
      const bonus = SetBonusManager.getBonus('warrior_set', 2);

      expect(bonus).not.toBeNull();
      expect(bonus!.HP).toBe(50);
      expect(bonus!.DEF).toBe(10);
    });

    it('should return 3-piece bonus', () => {
      const bonus = SetBonusManager.getBonus('warrior_set', 3);

      expect(bonus).not.toBeNull();
      expect(bonus!.HP).toBe(100);
      expect(bonus!.DEF).toBe(20);
      expect(bonus!.ATK).toBe(10);
    });

    it('should return 5-piece bonus with special', () => {
      const bonus = SetBonusManager.getBonus('warrior_set', 5);

      expect(bonus).not.toBeNull();
      expect(bonus!.special).toBe('Battle Rage');
    });
  });

  describe('getAllBonusesForSet', () => {
    it('should return empty array for invalid set', () => {
      const bonuses = SetBonusManager.getAllBonusesForSet('invalid_set', 3);
      expect(bonuses).toHaveLength(0);
    });

    it('should return all applicable bonuses for 3 pieces', () => {
      const bonuses = SetBonusManager.getAllBonusesForSet('warrior_set', 3);

      expect(bonuses).toHaveLength(2); // 2-piece and 3-piece
      expect(bonuses[0].pieces).toBe(2);
      expect(bonuses[1].pieces).toBe(3);
    });

    it('should return all applicable bonuses for 5 pieces', () => {
      const bonuses = SetBonusManager.getAllBonusesForSet('warrior_set', 5);

      expect(bonuses).toHaveLength(4); // 2, 3, 4, 5-piece
    });

    it('should mark all bonuses as active', () => {
      const bonuses = SetBonusManager.getAllBonusesForSet('warrior_set', 3);

      for (const bonus of bonuses) {
        expect(bonus.active).toBe(true);
      }
    });
  });

  describe('getSetInfo', () => {
    it('should return null for invalid set', () => {
      const info = SetBonusManager.getSetInfo('invalid_set');
      expect(info).toBeNull();
    });

    it('should return set info with all properties', () => {
      const info = SetBonusManager.getSetInfo('archer_set');

      expect(info!.id).toBe('archer_set');
      expect(info!.name).toBe("Hunter's Focus");
      expect(info!.bonuses).toBeDefined();
      expect(info!.bonuses[2]).toBeDefined();
      expect(info!.bonuses[5]).toBeDefined();
    });
  });

  describe('Set Bonus Values', () => {
    describe('Warrior Set (Tank/Defense)', () => {
      it('should provide HP and DEF focus', () => {
        const bonus5 = SetBonusManager.getBonus('warrior_set', 5);

        expect(bonus5!.HP).toBe(350);
        expect(bonus5!.DEF).toBe(70);
        expect(bonus5!.ATK).toBe(35);
      });
    });

    describe('Archer Set (Crit/Speed)', () => {
      it('should provide SPD and CRIT focus', () => {
        const bonus5 = SetBonusManager.getBonus('archer_set', 5);

        expect(bonus5!.SPD).toBe(35);
        expect(bonus5!.CRIT).toBe(18);
        expect(bonus5!.ATK).toBe(35);
      });
    });

    describe('Mage Set (Attack)', () => {
      it('should provide ATK focus', () => {
        const bonus5 = SetBonusManager.getBonus('mage_set', 5);

        expect(bonus5!.ATK).toBe(80);
        expect(bonus5!.HP).toBe(200);
        expect(bonus5!.SPD).toBe(20);
      });
    });

    describe('Cleric Set (HP/Survivability)', () => {
      it('should provide HP and DEF focus', () => {
        const bonus5 = SetBonusManager.getBonus('cleric_set', 5);

        expect(bonus5!.HP).toBe(400);
        expect(bonus5!.DEF).toBe(80);
        expect(bonus5!.SPD).toBe(20);
      });
    });

    describe('Paladin Set (Balanced)', () => {
      it('should provide balanced stats', () => {
        const bonus5 = SetBonusManager.getBonus('paladin_set', 5);

        expect(bonus5!.HP).toBe(350);
        expect(bonus5!.ATK).toBe(60);
        expect(bonus5!.DEF).toBe(60);
        expect(bonus5!.SPD).toBe(20);
      });
    });
  });

  describe('Special Bonuses', () => {
    it('should have unique special for each set at 5 pieces', () => {
      const specials = [
        SetBonusManager.getBonus('warrior_set', 5)!.special,
        SetBonusManager.getBonus('archer_set', 5)!.special,
        SetBonusManager.getBonus('mage_set', 5)!.special,
        SetBonusManager.getBonus('cleric_set', 5)!.special,
        SetBonusManager.getBonus('paladin_set', 5)!.special
      ];

      const uniqueSpecials = new Set(specials);
      expect(uniqueSpecials.size).toBe(5);
    });

    it('should have thematic special names', () => {
      expect(SetBonusManager.getBonus('warrior_set', 5)!.special).toBe('Battle Rage');
      expect(SetBonusManager.getBonus('archer_set', 5)!.special).toBe('Perfect Shot');
      expect(SetBonusManager.getBonus('mage_set', 5)!.special).toBe('Mana Surge');
      expect(SetBonusManager.getBonus('cleric_set', 5)!.special).toBe('Holy Aura');
      expect(SetBonusManager.getBonus('paladin_set', 5)!.special).toBe('Divine Shield');
    });
  });
});

describe('Equipment with Set Bonuses', () => {
  it('should include set bonuses in total stats', () => {
    const hero = createMockHero();
    const equipment = new Equipment(hero);

    // Create 2 items with warrior set
    const sword = createMockItem({
      slot: 'weapon',
      setId: 'warrior_set',
      stats: { HP: 0, ATK: 10, DEF: 0, SPD: 0, CRIT: 0 }
    });
    const helmet = createMockItem({
      slot: 'helmet',
      setId: 'warrior_set',
      stats: { HP: 0, ATK: 0, DEF: 5, SPD: 0, CRIT: 0 }
    });

    equipment.equip(sword);
    equipment.equip(helmet);

    const totalStats = equipment.getTotalEquipmentStats();

    // Item stats + 2-piece bonus (HP: 50, DEF: 10)
    expect(totalStats.HP).toBe(50); // 0 + 0 + 50 (set bonus)
    expect(totalStats.ATK).toBe(10); // 10 + 0
    expect(totalStats.DEF).toBe(15); // 0 + 5 + 10 (set bonus)
  });

  it('should return active set info', () => {
    const hero = createMockHero();
    const equipment = new Equipment(hero);

    const sword = createMockItem({ slot: 'weapon', setId: 'archer_set' });
    const helmet = createMockItem({ slot: 'helmet', setId: 'archer_set' });
    const chest = createMockItem({ slot: 'chest', setId: 'archer_set' });

    equipment.equip(sword);
    equipment.equip(helmet);
    equipment.equip(chest);

    const activeSets = equipment.getActiveSetBonuses();

    expect(activeSets).toHaveLength(1);
    expect(activeSets[0].setName).toBe("Hunter's Focus");
    expect(activeSets[0].pieces).toBe(3);
    expect(activeSets[0].bonuses.length).toBeGreaterThan(0);
  });
});
