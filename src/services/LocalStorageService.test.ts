/**
 * LocalStorage Service Tests
 *
 * Tests for save/load functionality, hero persistence, and data integrity.
 * These tests help identify issues where heroes might be lost or corrupted.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
  hasLocalSave,
  getLastSaveTime
} from './LocalStorageService';
import type { Hero } from '../engine/hero/Hero';
import type { Item } from '../engine/item/Item';
import type { Equipment } from '../engine/equipment/Equipment';

/**
 * Create a mock Hero for testing
 */
function createMockHero(overrides: Partial<Hero> = {}): Hero {
  const defaultEquipment = {
    slots: {
      helmet: null,
      weapon: null,
      chest: null,
      gloves: null,
      legs: null,
      boots: null,
      accessory1: null,
      accessory2: null
    }
  } as Equipment;

  return {
    id: `hero_${Date.now()}_${Math.random()}`,
    name: 'Test Hero',
    class: 'warrior',
    rarity: 'rare',
    level: 10,
    experience: 500,
    requiredXP: 1000,
    currentHP: 80,
    maxHP: 100,
    ATK: 50,
    DEF: 30,
    SPD: 20,
    CRIT: 5,
    talentPoints: 2,
    equipment: defaultEquipment,
    ...overrides
  } as Hero;
}

/**
 * Create a mock Item for testing
 */
function createMockItem(overrides: Partial<Item> = {}): Item {
  return {
    id: `item_${Date.now()}_${Math.random()}`,
    name: 'Test Sword',
    type: 'equipment',
    slot: 'weapon',
    icon: 'sword.png',
    level: 5,
    rarity: 'rare',
    stats: { HP: 10, ATK: 20, DEF: 5, SPD: 2, CRIT: 1 },
    goldValue: 500,
    enchantLevel: 0,
    setId: null,
    setName: null,
    ...overrides
  } as Item;
}

describe('LocalStorageService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('saveToLocalStorage', () => {
    it('should save heroes to localStorage', () => {
      const heroes = [createMockHero({ name: 'Hero1' }), createMockHero({ name: 'Hero2' })];
      const inventory: Item[] = [];

      saveToLocalStorage(heroes, inventory, 1000, 50);

      const saved = localStorage.getItem('looters-land-autosave');
      expect(saved).not.toBeNull();

      const parsed = JSON.parse(saved!);
      expect(parsed.heroes).toHaveLength(2);
      expect(parsed.heroes[0].name).toBe('Hero1');
      expect(parsed.heroes[1].name).toBe('Hero2');
    });

    it('should save hero ID correctly', () => {
      const heroId = 'unique-hero-id-123';
      const heroes = [createMockHero({ id: heroId })];

      saveToLocalStorage(heroes, [], 1000, 50);

      const saved = JSON.parse(localStorage.getItem('looters-land-autosave')!);
      expect(saved.heroes[0].id).toBe(heroId);
    });

    it('should save hero level and experience', () => {
      const heroes = [createMockHero({ level: 15, experience: 750, requiredXP: 2000 })];

      saveToLocalStorage(heroes, [], 1000, 50);

      const saved = JSON.parse(localStorage.getItem('looters-land-autosave')!);
      expect(saved.heroes[0].level).toBe(15);
      expect(saved.heroes[0].experience).toBe(750);
      expect(saved.heroes[0].requiredXP).toBe(2000);
    });

    it('should save hero currentHP', () => {
      const heroes = [createMockHero({ currentHP: 45 })];

      saveToLocalStorage(heroes, [], 1000, 50);

      const saved = JSON.parse(localStorage.getItem('looters-land-autosave')!);
      expect(saved.heroes[0].currentHP).toBe(45);
    });

    it('should save hero class', () => {
      const heroes = [
        createMockHero({ class: 'warrior' as any }),
        createMockHero({ class: 'mage' as any }),
        createMockHero({ class: 'archer' as any })
      ];

      saveToLocalStorage(heroes, [], 1000, 50);

      const saved = JSON.parse(localStorage.getItem('looters-land-autosave')!);
      expect(saved.heroes[0].class).toBe('warrior');
      expect(saved.heroes[1].class).toBe('mage');
      expect(saved.heroes[2].class).toBe('archer');
    });

    it('should save inventory items', () => {
      const inventory = [
        createMockItem({ name: 'Sword' }),
        createMockItem({ name: 'Shield', slot: 'chest' })
      ];

      saveToLocalStorage([], inventory, 5000, 50);

      const saved = JSON.parse(localStorage.getItem('looters-land-autosave')!);
      expect(saved.inventory).toHaveLength(2);
      expect(saved.inventory[0].name).toBe('Sword');
      expect(saved.inventory[1].name).toBe('Shield');
    });

    it('should save gold amount', () => {
      saveToLocalStorage([], [], 12345, 50);

      const saved = JSON.parse(localStorage.getItem('looters-land-autosave')!);
      expect(saved.gold).toBe(12345);
    });

    it('should save maxSlots', () => {
      saveToLocalStorage([], [], 1000, 75);

      const saved = JSON.parse(localStorage.getItem('looters-land-autosave')!);
      expect(saved.maxSlots).toBe(75);
    });

    it('should save timestamp', () => {
      const before = Date.now();
      saveToLocalStorage([], [], 1000, 50);
      const after = Date.now();

      const saved = JSON.parse(localStorage.getItem('looters-land-autosave')!);
      expect(saved.timestamp).toBeGreaterThanOrEqual(before);
      expect(saved.timestamp).toBeLessThanOrEqual(after);
    });

    it('should save version', () => {
      saveToLocalStorage([], [], 1000, 50);

      const saved = JSON.parse(localStorage.getItem('looters-land-autosave')!);
      expect(saved.version).toBe('1.1.0'); // Updated: v1.1.0 includes hero stats
    });

    it('should save equipped items for hero', () => {
      const weapon = createMockItem({ name: 'Epic Sword', slot: 'weapon' });
      const hero = createMockHero({
        equipment: {
          slots: {
            helmet: null,
            weapon: weapon,
            chest: null,
            gloves: null,
            legs: null,
            boots: null,
            accessory1: null,
            accessory2: null
          }
        } as Equipment
      });

      saveToLocalStorage([hero], [], 1000, 50);

      const saved = JSON.parse(localStorage.getItem('looters-land-autosave')!);
      expect(saved.heroes[0].equippedItems).toHaveLength(1);
      expect(saved.heroes[0].equippedItems[0].slot).toBe('weapon');
      expect(saved.heroes[0].equippedItems[0].item.name).toBe('Epic Sword');
    });

    it('should save item stats correctly', () => {
      const item = createMockItem({
        stats: { HP: 100, ATK: 50, DEF: 25, SPD: 10, CRIT: 5 }
      });

      saveToLocalStorage([], [item], 1000, 50);

      const saved = JSON.parse(localStorage.getItem('looters-land-autosave')!);
      expect(saved.inventory[0].stats.HP).toBe(100);
      expect(saved.inventory[0].stats.ATK).toBe(50);
      expect(saved.inventory[0].stats.DEF).toBe(25);
      expect(saved.inventory[0].stats.SPD).toBe(10);
      expect(saved.inventory[0].stats.CRIT).toBe(5);
    });

    it('should handle many heroes (stress test)', () => {
      const heroes: Hero[] = [];
      for (let i = 0; i < 50; i++) {
        heroes.push(createMockHero({ name: `Hero ${i}`, id: `hero-${i}` }));
      }

      saveToLocalStorage(heroes, [], 1000, 50);

      const saved = JSON.parse(localStorage.getItem('looters-land-autosave')!);
      expect(saved.heroes).toHaveLength(50);

      // Verify all IDs are unique and preserved
      const ids = saved.heroes.map((h: any) => h.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(50);
    });
  });

  describe('loadFromLocalStorage', () => {
    it('should return null when no save exists', () => {
      const result = loadFromLocalStorage();
      expect(result).toBeNull();
    });

    it('should load saved heroes', () => {
      const heroes = [
        createMockHero({ id: 'hero-1', name: 'Warrior', class: 'warrior' as any }),
        createMockHero({ id: 'hero-2', name: 'Mage', class: 'mage' as any })
      ];
      saveToLocalStorage(heroes, [], 1000, 50);

      const loaded = loadFromLocalStorage();

      expect(loaded).not.toBeNull();
      expect(loaded!.heroes).toHaveLength(2);
      expect(loaded!.heroes[0].id).toBe('hero-1');
      expect(loaded!.heroes[0].name).toBe('Warrior');
      expect(loaded!.heroes[1].id).toBe('hero-2');
      expect(loaded!.heroes[1].name).toBe('Mage');
    });

    it('should preserve hero IDs through save/load cycle', () => {
      const originalId = 'very-specific-hero-id-12345';
      const heroes = [createMockHero({ id: originalId })];
      saveToLocalStorage(heroes, [], 1000, 50);

      const loaded = loadFromLocalStorage();

      expect(loaded!.heroes[0].id).toBe(originalId);
    });

    it('should preserve hero experience through save/load cycle', () => {
      const heroes = [createMockHero({ experience: 7890, requiredXP: 10000 })];
      saveToLocalStorage(heroes, [], 1000, 50);

      const loaded = loadFromLocalStorage();

      expect(loaded!.heroes[0].experience).toBe(7890);
      expect(loaded!.heroes[0].requiredXP).toBe(10000);
    });

    it('should preserve gold through save/load cycle', () => {
      saveToLocalStorage([], [], 99999, 50);

      const loaded = loadFromLocalStorage();

      expect(loaded!.gold).toBe(99999);
    });

    it('should preserve inventory items through save/load cycle', () => {
      const items = [
        createMockItem({ id: 'item-1', name: 'Sword' }),
        createMockItem({ id: 'item-2', name: 'Shield' })
      ];
      saveToLocalStorage([], items, 1000, 50);

      const loaded = loadFromLocalStorage();

      expect(loaded!.inventory).toHaveLength(2);
      expect(loaded!.inventory[0].id).toBe('item-1');
      expect(loaded!.inventory[1].id).toBe('item-2');
    });
  });

  describe('clearLocalStorage', () => {
    it('should remove saved data', () => {
      saveToLocalStorage([createMockHero()], [], 1000, 50);
      expect(hasLocalSave()).toBe(true);

      clearLocalStorage();

      expect(hasLocalSave()).toBe(false);
      expect(loadFromLocalStorage()).toBeNull();
    });
  });

  describe('hasLocalSave', () => {
    it('should return false when no save exists', () => {
      expect(hasLocalSave()).toBe(false);
    });

    it('should return true after saving', () => {
      saveToLocalStorage([], [], 1000, 50);
      expect(hasLocalSave()).toBe(true);
    });
  });

  describe('getLastSaveTime', () => {
    it('should return null when no save exists', () => {
      expect(getLastSaveTime()).toBeNull();
    });

    it('should return valid Date after saving', () => {
      const before = new Date();
      saveToLocalStorage([], [], 1000, 50);
      const after = new Date();

      const saveTime = getLastSaveTime();

      expect(saveTime).toBeInstanceOf(Date);
      expect(saveTime!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(saveTime!.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Data Integrity - Potential Bug Detection', () => {
    it('should NOT lose heroes with same name but different IDs', () => {
      // This is a critical test - duplicate heroes from gacha should be kept
      const heroes = [
        createMockHero({ id: 'hero-1', name: 'Goblin Slayer', class: 'warrior' as any }),
        createMockHero({ id: 'hero-2', name: 'Goblin Slayer', class: 'warrior' as any }), // Duplicate from gacha
        createMockHero({ id: 'hero-3', name: 'Goblin Slayer', class: 'warrior' as any }) // Another duplicate
      ];

      saveToLocalStorage(heroes, [], 1000, 50);
      const loaded = loadFromLocalStorage();

      // ALL heroes should be preserved - duplicates are intentional for talent system
      expect(loaded!.heroes).toHaveLength(3);
      expect(loaded!.heroes.map((h: any) => h.id)).toContain('hero-1');
      expect(loaded!.heroes.map((h: any) => h.id)).toContain('hero-2');
      expect(loaded!.heroes.map((h: any) => h.id)).toContain('hero-3');
    });

    it('should preserve all hero classes distinctly', () => {
      const heroes = [
        createMockHero({ id: '1', class: 'warrior' as any }),
        createMockHero({ id: '2', class: 'archer' as any }),
        createMockHero({ id: '3', class: 'mage' as any }),
        createMockHero({ id: '4', class: 'cleric' as any }),
        createMockHero({ id: '5', class: 'paladin' as any })
      ];

      saveToLocalStorage(heroes, [], 1000, 50);
      const loaded = loadFromLocalStorage();

      expect(loaded!.heroes).toHaveLength(5);
      const classes = loaded!.heroes.map((h: any) => h.class);
      expect(classes).toContain('warrior');
      expect(classes).toContain('archer');
      expect(classes).toContain('mage');
      expect(classes).toContain('cleric');
      expect(classes).toContain('paladin');
    });

    it('should preserve hero currentHP accurately (not lose damage)', () => {
      // Simulate heroes damaged in combat
      const heroes = [
        createMockHero({ currentHP: 1, maxHP: 100 }), // Nearly dead
        createMockHero({ currentHP: 50, maxHP: 100 }), // Half HP
        createMockHero({ currentHP: 100, maxHP: 100 }) // Full HP
      ];

      saveToLocalStorage(heroes, [], 1000, 50);
      const loaded = loadFromLocalStorage();

      expect(loaded!.heroes[0].currentHP).toBe(1);
      expect(loaded!.heroes[1].currentHP).toBe(50);
      expect(loaded!.heroes[2].currentHP).toBe(100);
    });

    it('should preserve equipped items for each hero', () => {
      const weapon1 = createMockItem({ id: 'weapon-1', name: 'Sword', slot: 'weapon' });
      const weapon2 = createMockItem({ id: 'weapon-2', name: 'Staff', slot: 'weapon' });

      const heroes = [
        createMockHero({
          id: 'hero-1',
          equipment: {
            slots: {
              helmet: null, weapon: weapon1, chest: null, gloves: null,
              legs: null, boots: null, accessory1: null, accessory2: null
            }
          } as Equipment
        }),
        createMockHero({
          id: 'hero-2',
          equipment: {
            slots: {
              helmet: null, weapon: weapon2, chest: null, gloves: null,
              legs: null, boots: null, accessory1: null, accessory2: null
            }
          } as Equipment
        })
      ];

      saveToLocalStorage(heroes, [], 1000, 50);
      const loaded = loadFromLocalStorage();

      // Each hero should have their own equipped item
      expect(loaded!.heroes[0].equippedItems[0].item.id).toBe('weapon-1');
      expect(loaded!.heroes[1].equippedItems[0].item.id).toBe('weapon-2');
    });

    it('should handle empty equipment slots correctly', () => {
      const hero = createMockHero({
        equipment: {
          slots: {
            helmet: null, weapon: null, chest: null, gloves: null,
            legs: null, boots: null, accessory1: null, accessory2: null
          }
        } as Equipment
      });

      saveToLocalStorage([hero], [], 1000, 50);
      const loaded = loadFromLocalStorage();

      expect(loaded!.heroes[0].equippedItems).toHaveLength(0);
    });

    it('should NOT corrupt item stats through serialization', () => {
      const item = createMockItem({
        stats: { HP: 999, ATK: 888, DEF: 777, SPD: 666, CRIT: 555 }
      });

      saveToLocalStorage([], [item], 1000, 50);
      const loaded = loadFromLocalStorage();

      expect(loaded!.inventory[0].stats.HP).toBe(999);
      expect(loaded!.inventory[0].stats.ATK).toBe(888);
      expect(loaded!.inventory[0].stats.DEF).toBe(777);
      expect(loaded!.inventory[0].stats.SPD).toBe(666);
      expect(loaded!.inventory[0].stats.CRIT).toBe(555);
    });
  });

  describe('Edge Cases', () => {
    it('should handle hero with no equipment property', () => {
      const hero = createMockHero();
      delete (hero as any).equipment;

      // Should not throw
      expect(() => saveToLocalStorage([hero], [], 1000, 50)).not.toThrow();

      const loaded = loadFromLocalStorage();
      expect(loaded!.heroes[0].equippedItems).toHaveLength(0);
    });

    it('should handle zero gold', () => {
      saveToLocalStorage([], [], 0, 50);
      const loaded = loadFromLocalStorage();
      expect(loaded!.gold).toBe(0);
    });

    it('should handle empty hero array', () => {
      saveToLocalStorage([], [], 1000, 50);
      const loaded = loadFromLocalStorage();
      expect(loaded!.heroes).toHaveLength(0);
    });

    it('should handle empty inventory array', () => {
      saveToLocalStorage([], [], 1000, 50);
      const loaded = loadFromLocalStorage();
      expect(loaded!.inventory).toHaveLength(0);
    });

    it('should handle item with null setId and setName', () => {
      const item = createMockItem({ setId: null, setName: null });

      saveToLocalStorage([], [item], 1000, 50);
      const loaded = loadFromLocalStorage();

      expect(loaded!.inventory[0].setId).toBeNull();
      expect(loaded!.inventory[0].setName).toBeNull();
    });

    it('should handle item with set bonus info', () => {
      const item = createMockItem({ setId: 'warrior_set', setName: "Warrior's Valor" });

      saveToLocalStorage([], [item], 1000, 50);
      const loaded = loadFromLocalStorage();

      expect(loaded!.inventory[0].setId).toBe('warrior_set');
      expect(loaded!.inventory[0].setName).toBe("Warrior's Valor");
    });
  });

  describe('Hero Stats Persistence (Fixed in v1.1.0)', () => {
    it('should save hero rarity', () => {
      const hero = createMockHero({ rarity: 'legendary' as any });

      saveToLocalStorage([hero], [], 1000, 50);
      const loaded = loadFromLocalStorage();

      // Fixed in v1.1.0: rarity is now saved
      expect(loaded!.heroes[0].rarity).toBe('legendary');
    });

    it('should save hero talentPoints', () => {
      const hero = createMockHero({ talentPoints: 5 });

      saveToLocalStorage([hero], [], 1000, 50);
      const loaded = loadFromLocalStorage();

      // Fixed in v1.1.0: talentPoints is now saved
      expect(loaded!.heroes[0].talentPoints).toBe(5);
    });

    it('should save hero combat stats (maxHP, ATK, DEF, SPD, CRIT)', () => {
      const hero = createMockHero({
        maxHP: 500,
        ATK: 200,
        DEF: 150,
        SPD: 100,
        CRIT: 25
      });

      saveToLocalStorage([hero], [], 1000, 50);
      const loaded = loadFromLocalStorage();

      // Fixed in v1.1.0: All combat stats are now saved
      expect(loaded!.heroes[0].maxHP).toBe(500);
      expect(loaded!.heroes[0].ATK).toBe(200);
      expect(loaded!.heroes[0].DEF).toBe(150);
      expect(loaded!.heroes[0].SPD).toBe(100);
      expect(loaded!.heroes[0].CRIT).toBe(25);
    });

    it('should default rarity to common if not provided', () => {
      const hero = createMockHero();
      delete (hero as any).rarity;

      saveToLocalStorage([hero], [], 1000, 50);
      const loaded = loadFromLocalStorage();

      expect(loaded!.heroes[0].rarity).toBe('common');
    });

    it('should default talentPoints to 0 if not provided', () => {
      const hero = createMockHero();
      delete (hero as any).talentPoints;

      saveToLocalStorage([hero], [], 1000, 50);
      const loaded = loadFromLocalStorage();

      expect(loaded!.heroes[0].talentPoints).toBe(0);
    });
  });
});
