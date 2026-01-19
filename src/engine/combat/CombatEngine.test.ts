/**
 * Combat Engine Tests
 *
 * Tests for damage calculation, crit chance, elemental bonuses, and status effects.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hero } from '../hero/Hero';
import { Enemy, generateRandomEnemy } from './Enemy';
import { CombatEngine } from './CombatEngine';

// Mock i18n to avoid browser dependencies
vi.mock('../../localization/i18n', () => ({
  t: (key: string) => key
}));

describe('CombatEngine', () => {
  let engine: CombatEngine;

  beforeEach(() => {
    engine = new CombatEngine();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(engine.isActive).toBe(false);
      expect(engine.turnCounter).toBe(0);
      expect(engine.combatResult).toBeNull();
      expect(engine.heroes).toHaveLength(0);
      expect(engine.enemies).toHaveLength(0);
    });

    it('should initialize combat with heroes and enemies', () => {
      const heroes = [new Hero('Test Hero', 'warrior', 5)];
      const enemies = [generateRandomEnemy(5, 'normal')];

      engine.initialize(heroes, enemies);

      expect(engine.isActive).toBe(true);
      expect(engine.heroes).toHaveLength(1);
      expect(engine.enemies).toHaveLength(1);
      expect(engine.turnCounter).toBe(0);
    });
  });

  describe('Combo System', () => {
    it('should return 1.0 multiplier at 0 combo', () => {
      expect(engine.getComboMultiplier()).toBe(1.0);
    });

    it('should increase multiplier by 10% per combo hit', () => {
      engine.comboCounter = 1;
      expect(engine.getComboMultiplier()).toBe(1.1);

      engine.comboCounter = 3;
      expect(engine.getComboMultiplier()).toBe(1.3);
    });

    it('should cap combo multiplier at 50% (5 hits)', () => {
      engine.comboCounter = 10;
      expect(engine.getComboMultiplier()).toBe(1.5);
    });
  });

  describe('Victory/Defeat Conditions', () => {
    it('should detect victory when all enemies are dead', () => {
      const hero = new Hero('Hero', 'warrior', 10);
      const enemy = generateRandomEnemy(1, 'normal');

      engine.initialize([hero], [enemy]);

      // Kill the enemy
      enemy.currentHP = 0;
      enemy.isAlive = false;

      // Execute turn should detect victory
      engine.executeTurn();

      expect(engine.combatResult).toBe('victory');
      expect(engine.isActive).toBe(false);
    });

    it('should detect defeat when all heroes are dead', () => {
      const hero = new Hero('Hero', 'warrior', 1);
      const enemy = generateRandomEnemy(10, 'boss');

      engine.initialize([hero], [enemy]);

      // Kill the hero
      hero.currentHP = 0;
      hero.isAlive = false;

      // Execute turn should detect defeat
      engine.executeTurn();

      expect(engine.combatResult).toBe('defeat');
      expect(engine.isActive).toBe(false);
    });
  });
});

describe('Hero - Damage Calculation', () => {
  let hero: Hero;
  let enemy: Enemy;

  beforeEach(() => {
    hero = new Hero('Test Warrior', 'warrior', 10);
    enemy = new Enemy('Test Enemy', 10, 'normal');
  });

  describe('Basic Attack', () => {
    it('should deal damage based on ATK stat', () => {
      const initialHP = enemy.currentHP;
      const result = hero.attack(enemy);

      if (result && !result.didMiss) {
        expect(result.damage).toBeGreaterThan(0);
        expect(enemy.currentHP).toBeLessThan(initialHP);
      }
    });

    it('should never deal less than 1 damage', () => {
      // Create weak hero vs very tanky enemy
      const weakHero = new Hero('Weak', 'cleric', 1);
      const tankEnemy = new Enemy('Tank', 50, 'boss');

      const result = weakHero.attack(tankEnemy);

      if (result && !result.didMiss) {
        expect(result.damage).toBeGreaterThanOrEqual(1);
      }
    });

    it('should have hit/miss mechanic based on ACC vs EVA', () => {
      let hits = 0;
      let misses = 0;

      // Run multiple attacks to verify hit/miss system
      for (let i = 0; i < 100; i++) {
        const testHero = new Hero('Test', 'archer', 10);
        const testEnemy = new Enemy('Evasive', 10, 'normal');
        testEnemy.currentHP = testEnemy.maxHP; // Reset HP

        const result = testHero.attack(testEnemy);
        if (result) {
          if (result.didMiss) {
            misses++;
          } else {
            hits++;
          }
        }
      }

      // Should have both hits and misses (unless extremely unlucky)
      expect(hits).toBeGreaterThan(0);
      // Misses might be 0 with high accuracy, which is fine
    });
  });

  describe('Critical Hits', () => {
    it('should have a chance to deal critical damage', () => {
      let critCount = 0;
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const testHero = new Hero('CritHero', 'archer', 20); // Archers have higher crit
        const testEnemy = new Enemy('Target', 10, 'normal');

        const result = testHero.attack(testEnemy);
        if (result && result.isCrit && !result.didMiss) {
          critCount++;
        }
      }

      // With ~15%+ base crit chance, should get some crits
      expect(critCount).toBeGreaterThan(0);

      // Crit rate should be roughly within expected range (allowing for RNG variance)
      const critRate = critCount / iterations;
      expect(critRate).toBeGreaterThan(0.05); // At least 5%
      expect(critRate).toBeLessThan(0.5); // Less than 50%
    });

    it('should deal more damage on critical hit', () => {
      const testEnemy = new Enemy('Target', 10, 'normal');

      // Force a crit vs non-crit comparison
      const normalDamage = testEnemy.takeDamage(100, false);
      testEnemy.currentHP = testEnemy.maxHP;
      const critDamage = testEnemy.takeDamage(100, true);

      expect(critDamage).toBeGreaterThan(normalDamage);
    });
  });

  describe('Elemental Damage', () => {
    it('should deal extra damage on elemental weakness', () => {
      const testEnemy = new Enemy('WeakEnemy', 10, 'normal');
      testEnemy.weaknesses = ['fire'];

      const normalDamage = testEnemy.takeDamage(100, false, 'physical');
      testEnemy.currentHP = testEnemy.maxHP;
      const fireDamage = testEnemy.takeDamage(100, false, 'fire');

      // Fire damage should be 50% more due to weakness
      expect(fireDamage).toBeGreaterThan(normalDamage);
    });

    it('should reduce damage on elemental resistance', () => {
      const testEnemy = new Enemy('ResistantEnemy', 10, 'boss');
      // Bosses have 15% resistance to all elements

      const initialResistance = testEnemy.resistances['fire'];
      expect(initialResistance).toBeGreaterThanOrEqual(15);

      const fullDamage = 100;
      const resistedDamage = testEnemy.takeDamage(fullDamage, false, 'fire');

      // Should take less than full damage
      expect(resistedDamage).toBeLessThan(fullDamage);
    });
  });

  describe('Defense Calculation', () => {
    it('should reduce damage based on DEF stat', () => {
      const lowDefEnemy = new Enemy('LowDef', 1, 'normal');
      const highDefEnemy = new Enemy('HighDef', 50, 'boss');

      const damageToLowDef = lowDefEnemy.takeDamage(100, false);
      const damageToHighDef = highDefEnemy.takeDamage(100, false);

      // High DEF should take less damage
      expect(damageToHighDef).toBeLessThan(damageToLowDef);
    });

    it('should use formula: damage * (100 / (100 + DEF))', () => {
      const testEnemy = new Enemy('TestDef', 10, 'normal');
      const rawDamage = 100;
      const def = testEnemy.DEF;

      // Expected damage = rawDamage * (100 / (100 + DEF))
      const expectedDamage = Math.floor(rawDamage * (100 / (100 + def)));
      const actualDamage = testEnemy.takeDamage(rawDamage, false);

      // Should be close (might differ due to other modifiers)
      expect(actualDamage).toBeGreaterThanOrEqual(Math.floor(expectedDamage * 0.8));
      expect(actualDamage).toBeLessThanOrEqual(Math.ceil(expectedDamage * 1.2));
    });
  });
});

describe('Status Effects', () => {
  let hero: Hero;
  let enemy: Enemy;

  beforeEach(() => {
    hero = new Hero('StatusHero', 'warrior', 10);
    enemy = new Enemy('StatusEnemy', 10, 'normal');
  });

  describe('Buff Application', () => {
    it('should apply ATK buff correctly', () => {
      const baseATK = hero.ATK;

      hero.addStatusEffect({
        name: 'ATK Buff',
        duration: 3,
        type: 'buff',
        stat: 'ATK',
        value: 30 // +30%
      });

      const buffedATK = hero.getEffectiveStat(hero.ATK, 'ATK');
      expect(buffedATK).toBeGreaterThan(baseATK);
      expect(buffedATK).toBe(Math.floor(baseATK * 1.3));
    });

    it('should apply DEF buff correctly', () => {
      const baseDEF = hero.DEF;

      hero.addStatusEffect({
        name: 'DEF Buff',
        duration: 3,
        type: 'buff',
        stat: 'DEF',
        value: 40 // +40%
      });

      const buffedDEF = hero.getEffectiveStat(hero.DEF, 'DEF');
      expect(buffedDEF).toBe(Math.floor(baseDEF * 1.4));
    });
  });

  describe('Debuff Application', () => {
    it('should apply stun correctly', () => {
      expect(enemy.isStunned()).toBe(false);

      enemy.addStatusEffect({
        name: 'Stunned',
        duration: 1,
        type: 'debuff',
        stun: true
      });

      expect(enemy.isStunned()).toBe(true);
    });

    it('should apply ATK reduction correctly', () => {
      const baseATK = enemy.ATK;

      enemy.addStatusEffect({
        name: 'Weakness',
        duration: 2,
        type: 'debuff',
        stat: 'ATK',
        value: -30 // -30%
      });

      const debuffedATK = enemy.getEffectiveStat(enemy.ATK, 'ATK');
      expect(debuffedATK).toBeLessThan(baseATK);
      expect(debuffedATK).toBe(Math.floor(baseATK * 0.7));
    });
  });

  describe('Duration System', () => {
    it('should reduce duration on tick', () => {
      hero.addStatusEffect({
        name: 'Test Buff',
        duration: 3,
        type: 'buff',
        stat: 'ATK',
        value: 10
      });

      expect(hero.statusEffects[0].duration).toBe(3);

      hero.tickStatusEffects();
      expect(hero.statusEffects[0].duration).toBe(2);

      hero.tickStatusEffects();
      expect(hero.statusEffects[0].duration).toBe(1);
    });

    it('should remove effect when duration reaches 0', () => {
      hero.addStatusEffect({
        name: 'Short Buff',
        duration: 1,
        type: 'buff',
        stat: 'ATK',
        value: 10
      });

      expect(hero.statusEffects).toHaveLength(1);

      hero.tickStatusEffects();
      expect(hero.statusEffects).toHaveLength(0);
    });
  });

  describe('Immunity', () => {
    it('should block all damage when immune', () => {
      hero.addStatusEffect({
        name: 'Divine Shield',
        duration: 1,
        type: 'buff',
        immunity: true
      });

      expect(hero.hasImmunity()).toBe(true);

      const damage = hero.takeDamage(999, true, 'fire');
      expect(damage).toBe(0);
      expect(hero.currentHP).toBe(hero.maxHP);
    });
  });

  describe('Damage Reduction', () => {
    it('should reduce damage with damageReduction effect', () => {
      const initialHP = hero.currentHP;

      hero.addStatusEffect({
        name: 'Mana Shield',
        duration: 3,
        type: 'buff',
        stat: 'damageReduction',
        value: 40 // -40% damage
      });

      const reduction = hero.getDamageReduction();
      expect(reduction).toBe(40);

      // Take damage with reduction active
      hero.takeDamage(100, false);
      const damageWithReduction = initialHP - hero.currentHP;

      // Reset and take damage without reduction
      hero.currentHP = initialHP;
      hero.statusEffects = [];
      hero.takeDamage(100, false);
      const damageWithoutReduction = initialHP - hero.currentHP;

      expect(damageWithReduction).toBeLessThan(damageWithoutReduction);
    });

    it('should cap damage reduction at 90%', () => {
      hero.addStatusEffect({
        name: 'Mega Shield',
        duration: 3,
        type: 'buff',
        stat: 'damageReduction',
        value: 100 // 100% would be too much
      });

      const reduction = hero.getDamageReduction();
      expect(reduction).toBe(90); // Capped at 90%
    });
  });
});

describe('Enemy Generation', () => {
  it('should generate enemy with correct level', () => {
    const enemy = generateRandomEnemy(15, 'normal');
    expect(enemy.level).toBe(15);
  });

  it('should generate elite enemies with boosted stats', () => {
    const normal = generateRandomEnemy(10, 'normal');
    const elite = generateRandomEnemy(10, 'elite');

    expect(elite.maxHP).toBeGreaterThan(normal.maxHP);
    expect(elite.ATK).toBeGreaterThan(normal.ATK);
    expect(elite.DEF).toBeGreaterThan(normal.DEF);
  });

  it('should generate boss enemies with significantly boosted stats', () => {
    const elite = generateRandomEnemy(10, 'elite');
    const boss = generateRandomEnemy(10, 'boss');

    expect(boss.maxHP).toBeGreaterThan(elite.maxHP);
    expect(boss.ATK).toBeGreaterThan(elite.ATK);
  });

  it('should generate enemies with names from predefined pool', () => {
    const validNames = [
      'Goblin', 'Orc', 'Skeleton', 'Spider', 'Wolf',
      'Bandit', 'Dark Knight', 'Zombie', 'Imp', 'Slime'
    ];

    for (let i = 0; i < 50; i++) {
      const enemy = generateRandomEnemy(5, 'normal');
      expect(validNames).toContain(enemy.name);
    }
  });
});
