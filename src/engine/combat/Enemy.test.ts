/**
 * Enemy System Tests
 *
 * Tests for enemy creation, stat scaling, type multipliers, and combat mechanics.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Enemy, generateRandomEnemy, generateEnemyGroup } from './Enemy';
import type { EnemyType } from '../../types/combat.types';
import { Position } from '../../types/combat.types';

describe('Enemy', () => {
  describe('Creation', () => {
    it('should create enemy with correct name', () => {
      const enemy = new Enemy('Goblin', 1, 'normal');
      expect(enemy.name).toBe('Goblin');
    });

    it('should create enemy with correct level', () => {
      const enemy = new Enemy('Orc', 5, 'normal');
      expect(enemy.level).toBe(5);
    });

    it('should create enemy with correct type', () => {
      const normal = new Enemy('Goblin', 1, 'normal');
      const elite = new Enemy('Orc', 1, 'elite');
      const boss = new Enemy('Dragon', 1, 'boss');

      expect(normal.type).toBe('normal');
      expect(elite.type).toBe('elite');
      expect(boss.type).toBe('boss');
    });

    it('should default to normal type', () => {
      const enemy = new Enemy('Slime', 1);
      expect(enemy.type).toBe('normal');
    });

    it('should default to level 1', () => {
      const enemy = new Enemy('Imp');
      expect(enemy.level).toBe(1);
    });

    it('should have unique ID', () => {
      const enemy1 = new Enemy('Goblin', 1);
      const enemy2 = new Enemy('Goblin', 1);
      expect(enemy1.id).not.toBe(enemy2.id);
    });

    it('should start alive with full HP', () => {
      const enemy = new Enemy('Goblin', 1);
      expect(enemy.isAlive).toBe(true);
      expect(enemy.currentHP).toBe(enemy.maxHP);
    });

    it('should have isEnemy flag set to true', () => {
      const enemy = new Enemy('Goblin', 1);
      expect(enemy.isEnemy).toBe(true);
    });
  });

  describe('Base Stats at Level 1', () => {
    it('should have correct base stats for normal enemy', () => {
      const enemy = new Enemy('Goblin', 1, 'normal');

      // Base: HP=50, ATK=12, DEF=8, SPD=10, CRIT=3
      // Normal multiplier: hp=1.0, atk=1.0, def=1.0
      // Level 1 scaling = 1.0
      expect(enemy.maxHP).toBe(50);
      expect(enemy.ATK).toBe(12);
      expect(enemy.DEF).toBe(8);
      expect(enemy.SPD).toBe(10);
      expect(enemy.CRIT).toBe(3);
    });

    it('should have correct base stats for elite enemy', () => {
      const enemy = new Enemy('Elite Orc', 1, 'elite');

      // Elite multiplier: hp=1.8, atk=1.4, def=1.3
      expect(enemy.maxHP).toBe(Math.floor(50 * 1.8)); // 90
      expect(enemy.ATK).toBe(Math.floor(12 * 1.4)); // 16
      expect(enemy.DEF).toBe(Math.floor(8 * 1.3)); // 10
    });

    it('should have correct base stats for boss enemy', () => {
      const enemy = new Enemy('Boss Dragon', 1, 'boss');

      // Boss multiplier: hp=3.5, atk=1.7, def=1.5
      expect(enemy.maxHP).toBe(Math.floor(50 * 3.5)); // 175
      expect(enemy.ATK).toBe(Math.floor(12 * 1.7)); // 20
      expect(enemy.DEF).toBe(Math.floor(8 * 1.5)); // 12
    });
  });

  describe('Level Scaling', () => {
    it('should scale HP with level', () => {
      const level1 = new Enemy('Goblin', 1, 'normal');
      const level5 = new Enemy('Goblin', 5, 'normal');
      const level10 = new Enemy('Goblin', 10, 'normal');

      expect(level5.maxHP).toBeGreaterThan(level1.maxHP);
      expect(level10.maxHP).toBeGreaterThan(level5.maxHP);
    });

    it('should scale ATK with level', () => {
      const level1 = new Enemy('Goblin', 1, 'normal');
      const level5 = new Enemy('Goblin', 5, 'normal');
      const level10 = new Enemy('Goblin', 10, 'normal');

      expect(level5.ATK).toBeGreaterThan(level1.ATK);
      expect(level10.ATK).toBeGreaterThan(level5.ATK);
    });

    it('should scale DEF with level', () => {
      const level1 = new Enemy('Goblin', 1, 'normal');
      const level5 = new Enemy('Goblin', 5, 'normal');

      expect(level5.DEF).toBeGreaterThan(level1.DEF);
    });

    it('should scale SPD with level', () => {
      const level1 = new Enemy('Goblin', 1, 'normal');
      const level5 = new Enemy('Goblin', 5, 'normal');

      expect(level5.SPD).toBeGreaterThan(level1.SPD);
    });

    it('should apply 15% scaling per level', () => {
      const level1 = new Enemy('Goblin', 1, 'normal');
      const level2 = new Enemy('Goblin', 2, 'normal');

      // Level 2 scaling = 1 + (2-1) * 0.15 = 1.15
      // HP at level 2 = (50 + 12*(2-1)) * 1.0 * 1.15 = 62 * 1.15 = 71.3 -> 71
      expect(level2.maxHP).toBe(Math.floor((50 + 12) * 1.15));
    });
  });

  describe('Accuracy and Evasion', () => {
    it('should calculate base ACC for normal enemy', () => {
      const enemy = new Enemy('Goblin', 1, 'normal');
      // ACC = 90 + SPD * 0.4 = 90 + 10 * 0.4 = 94
      expect(enemy.ACC).toBe(94);
    });

    it('should calculate base EVA for normal enemy', () => {
      const enemy = new Enemy('Goblin', 1, 'normal');
      // EVA = SPD * 0.25 = 10 * 0.25 = 2
      expect(enemy.EVA).toBe(2);
    });

    it('should add ACC/EVA bonus for elite enemy', () => {
      const normal = new Enemy('Goblin', 1, 'normal');
      const elite = new Enemy('Goblin', 1, 'elite');

      // Elite gets +10 ACC and +8 EVA
      expect(elite.ACC).toBe(normal.ACC + 10);
      expect(elite.EVA).toBe(normal.EVA + 8);
    });

    it('should add ACC/EVA bonus for boss enemy', () => {
      const normal = new Enemy('Goblin', 1, 'normal');
      const boss = new Enemy('Goblin', 1, 'boss');

      // Boss gets +20 ACC and +15 EVA
      expect(boss.ACC).toBe(normal.ACC + 20);
      expect(boss.EVA).toBe(normal.EVA + 15);
    });
  });

  describe('Combat Mechanics', () => {
    describe('Take Damage', () => {
      it('should reduce HP when taking damage', () => {
        const enemy = new Enemy('Goblin', 1, 'normal');
        const initialHP = enemy.currentHP;

        enemy.takeDamage(20);

        expect(enemy.currentHP).toBeLessThan(initialHP);
      });

      it('should apply defense reduction to damage', () => {
        const enemy = new Enemy('Goblin', 1, 'normal');
        // DEF = 8, damage reduction = 100 / (100 + 8) = 0.926
        const rawDamage = 100;
        const actualDamage = enemy.takeDamage(rawDamage);

        const expectedDamage = Math.floor(rawDamage * (100 / (100 + enemy.DEF)));
        expect(actualDamage).toBe(expectedDamage);
      });

      it('should apply crit damage multiplier', () => {
        const enemy = new Enemy('Goblin', 1, 'normal');
        const rawDamage = 100;

        const normalDamage = enemy.takeDamage(rawDamage, false);
        enemy.reset();
        const critDamage = enemy.takeDamage(rawDamage, true);

        expect(critDamage).toBeGreaterThan(normalDamage);
      });

      it('should die when HP reaches 0', () => {
        const enemy = new Enemy('Goblin', 1, 'normal');

        enemy.takeDamage(10000); // Massive damage

        expect(enemy.currentHP).toBe(0);
        expect(enemy.isAlive).toBe(false);
      });

      it('should ensure minimum 1 damage', () => {
        const enemy = new Enemy('Goblin', 1, 'normal');

        const damage = enemy.takeDamage(1);

        expect(damage).toBeGreaterThanOrEqual(1);
      });

      it('should not take damage when dead', () => {
        const enemy = new Enemy('Goblin', 1, 'normal');
        enemy.isAlive = false;
        enemy.currentHP = 0;

        const damage = enemy.takeDamage(100);

        expect(damage).toBe(0);
      });
    });

    describe('Heal', () => {
      it('should restore HP when healing', () => {
        const enemy = new Enemy('Goblin', 1, 'normal');
        enemy.currentHP = 10;

        const healed = enemy.heal(20);

        expect(enemy.currentHP).toBe(30);
        expect(healed).toBe(20);
      });

      it('should not exceed max HP', () => {
        const enemy = new Enemy('Goblin', 1, 'normal');
        enemy.currentHP = enemy.maxHP - 5;

        const healed = enemy.heal(100);

        expect(enemy.currentHP).toBe(enemy.maxHP);
        expect(healed).toBe(5);
      });

      it('should not heal when dead', () => {
        const enemy = new Enemy('Goblin', 1, 'normal');
        enemy.isAlive = false;

        const healed = enemy.heal(100);

        expect(healed).toBe(0);
      });
    });

    describe('Initiative', () => {
      it('should roll initiative based on SPD', () => {
        const enemy = new Enemy('Goblin', 1, 'normal');

        const initiative = enemy.rollInitiative();

        // Initiative = SPD + random(0-10)
        expect(initiative).toBeGreaterThanOrEqual(enemy.SPD);
        expect(initiative).toBeLessThanOrEqual(enemy.SPD + 10);
        expect(enemy.initiative).toBe(initiative);
      });
    });
  });

  describe('Status Effects', () => {
    it('should add status effect', () => {
      const enemy = new Enemy('Goblin', 1, 'normal');

      enemy.addStatusEffect({
        name: 'Poison',
        duration: 3,
        stat: 'ATK',
        value: -10
      });

      expect(enemy.statusEffects).toHaveLength(1);
      expect(enemy.statusEffects[0].name).toBe('Poison');
    });

    it('should refresh duration of existing effect', () => {
      const enemy = new Enemy('Goblin', 1, 'normal');

      enemy.addStatusEffect({ name: 'Burn', duration: 2, stat: 'DEF', value: -5 });
      enemy.addStatusEffect({ name: 'Burn', duration: 5, stat: 'DEF', value: -5 });

      expect(enemy.statusEffects).toHaveLength(1);
      expect(enemy.statusEffects[0].duration).toBe(5);
    });

    it('should tick status effects', () => {
      const enemy = new Enemy('Goblin', 1, 'normal');

      enemy.addStatusEffect({ name: 'Buff', duration: 3, stat: 'ATK', value: 10 });
      enemy.tickStatusEffects();

      expect(enemy.statusEffects[0].duration).toBe(2);
    });

    it('should remove expired effects', () => {
      const enemy = new Enemy('Goblin', 1, 'normal');

      enemy.addStatusEffect({ name: 'Buff', duration: 1, stat: 'ATK', value: 10 });
      enemy.tickStatusEffects();

      expect(enemy.statusEffects).toHaveLength(0);
    });

    it('should detect stun', () => {
      const enemy = new Enemy('Goblin', 1, 'normal');

      expect(enemy.isStunned()).toBe(false);

      enemy.addStatusEffect({ name: 'Stun', duration: 1, stun: true });

      expect(enemy.isStunned()).toBe(true);
    });

    it('should detect immunity', () => {
      const enemy = new Enemy('Goblin', 1, 'normal');

      expect(enemy.hasImmunity()).toBe(false);

      enemy.addStatusEffect({ name: 'Shield', duration: 2, immunity: true });

      expect(enemy.hasImmunity()).toBe(true);
    });

    it('should apply stat modifiers from effects', () => {
      const enemy = new Enemy('Goblin', 1, 'normal');
      const baseATK = enemy.ATK;

      enemy.addStatusEffect({ name: 'ATK Boost', duration: 3, stat: 'ATK', value: 50 });

      const boostedATK = enemy.getEffectiveStat(baseATK, 'ATK');
      expect(boostedATK).toBe(Math.floor(baseATK * 1.5));
    });

    it('should cap damage reduction at 90%', () => {
      const enemy = new Enemy('Goblin', 1, 'normal');

      enemy.addStatusEffect({ name: 'Shield1', duration: 3, stat: 'damageReduction', value: 60 });
      enemy.addStatusEffect({ name: 'Shield2', duration: 3, stat: 'damageReduction', value: 60 });

      const reduction = enemy.getDamageReduction();
      expect(reduction).toBe(90);
    });
  });

  describe('Resistances and Weaknesses', () => {
    it('should initialize resistances based on type', () => {
      const normal = new Enemy('Goblin', 1, 'normal');
      const elite = new Enemy('Goblin', 1, 'elite');
      const boss = new Enemy('Goblin', 1, 'boss');

      // Normal enemies have 0 base resistance
      expect(normal.resistances.physical).toBe(0);

      // Elite has 10% resistance
      expect(elite.resistances.physical).toBe(10);
      expect(elite.resistances.fire).toBe(10);

      // Boss has 15% resistance
      expect(boss.resistances.physical).toBe(15);
      expect(boss.resistances.fire).toBe(15);
    });

    it('should apply elemental resistance to damage', () => {
      // Create boss with guaranteed resistances
      const boss = new Enemy('Boss', 1, 'boss');

      // Boss has 15% fire resistance
      const fireDamage = boss.takeDamage(100, false, 'fire');
      boss.reset();
      const physDamage = boss.takeDamage(100, false, 'physical');

      // Both should have resistance but fire vs physical resistance are same for boss
      expect(fireDamage).toBeLessThan(100);
    });

    it('should apply weakness multiplier to damage', () => {
      const enemy = new Enemy('Goblin', 1, 'normal');
      enemy.weaknesses = ['fire'];

      // Force a specific enemy with weakness
      const initialHP = enemy.currentHP;
      enemy.takeDamage(50, false, 'fire');
      const damageWithWeakness = initialHP - enemy.currentHP;

      enemy.reset();
      enemy.takeDamage(50, false, 'physical');
      const normalDamage = enemy.maxHP - enemy.currentHP;

      // Weakness should deal more damage
      expect(damageWithWeakness).toBeGreaterThan(normalDamage);
    });
  });

  describe('Position System', () => {
    it('should place boss in front position', () => {
      const boss = new Enemy('Boss', 1, 'boss');
      expect(boss.position).toBe(Position.FRONT);
    });

    it('should place elite in front position', () => {
      const elite = new Enemy('Elite', 1, 'elite');
      expect(elite.position).toBe(Position.FRONT);
    });

    it('should place normal enemies with position variety', () => {
      // Run multiple times to test distribution
      const positions: Position[] = [];

      for (let i = 0; i < 100; i++) {
        const enemy = new Enemy('Goblin', 1, 'normal');
        positions.push(enemy.position);
      }

      // Should have variety in positions
      const uniquePositions = new Set(positions);
      expect(uniquePositions.size).toBeGreaterThanOrEqual(2);
    });

    it('should return position bonuses', () => {
      const enemy = new Enemy('Goblin', 1, 'normal');
      const bonuses = enemy.getPositionBonuses();

      expect(bonuses).toBeDefined();
      expect(bonuses.aggroWeight).toBeDefined();
    });
  });

  describe('Reset Functions', () => {
    it('should reset combat state', () => {
      const enemy = new Enemy('Goblin', 1, 'normal');
      enemy.addStatusEffect({ name: 'Buff', duration: 5, stat: 'ATK', value: 10 });

      enemy.resetCombatState();

      expect(enemy.statusEffects).toHaveLength(0);
    });

    it('should fully reset including HP', () => {
      const enemy = new Enemy('Goblin', 1, 'normal');
      enemy.currentHP = 1;
      enemy.isAlive = false;
      enemy.addStatusEffect({ name: 'Buff', duration: 5, stat: 'ATK', value: 10 });

      enemy.reset();

      expect(enemy.currentHP).toBe(enemy.maxHP);
      expect(enemy.isAlive).toBe(true);
      expect(enemy.statusEffects).toHaveLength(0);
    });
  });

  describe('getInfo', () => {
    it('should return correct enemy info', () => {
      const enemy = new Enemy('Goblin', 5, 'elite');
      enemy.currentHP = 50;

      const info = enemy.getInfo();

      expect(info.id).toBe(enemy.id);
      expect(info.name).toBe('Goblin');
      expect(info.level).toBe(5);
      expect(info.type).toBe('elite');
      expect(info.hp).toBe(50);
      expect(info.maxHP).toBe(enemy.maxHP);
      expect(info.ATK).toBe(enemy.ATK);
      expect(info.DEF).toBe(enemy.DEF);
      expect(info.SPD).toBe(enemy.SPD);
      expect(info.CRIT).toBe(enemy.CRIT);
      expect(info.isAlive).toBe(true);
      expect(info.hpPercent).toBe((50 / enemy.maxHP) * 100);
    });
  });

  describe('getCombatStats', () => {
    it('should return stats with status effects applied', () => {
      const enemy = new Enemy('Goblin', 1, 'normal');
      const baseATK = enemy.ATK;

      enemy.addStatusEffect({ name: 'Boost', duration: 3, stat: 'ATK', value: 25 });

      const combatStats = enemy.getCombatStats();
      expect(combatStats.ATK).toBe(Math.floor(baseATK * 1.25));
    });

    it('should include all combat stats', () => {
      const enemy = new Enemy('Goblin', 1, 'normal');
      const combatStats = enemy.getCombatStats();

      expect(combatStats.ATK).toBeDefined();
      expect(combatStats.DEF).toBeDefined();
      expect(combatStats.SPD).toBeDefined();
      expect(combatStats.CRIT).toBeDefined();
      expect(combatStats.ACC).toBeDefined();
      expect(combatStats.EVA).toBeDefined();
    });
  });
});

describe('generateRandomEnemy', () => {
  it('should generate enemy with specified level', () => {
    const enemy = generateRandomEnemy(10);
    expect(enemy.level).toBe(10);
  });

  it('should generate enemy with specified type', () => {
    const normal = generateRandomEnemy(1, 'normal');
    const elite = generateRandomEnemy(1, 'elite');
    const boss = generateRandomEnemy(1, 'boss');

    expect(normal.type).toBe('normal');
    expect(elite.type).toBe('elite');
    expect(boss.type).toBe('boss');
  });

  it('should default to normal type', () => {
    const enemy = generateRandomEnemy(1);
    expect(enemy.type).toBe('normal');
  });

  it('should generate enemy with name from pool', () => {
    const validNames = [
      'Goblin', 'Orc', 'Skeleton', 'Spider', 'Wolf',
      'Bandit', 'Dark Knight', 'Zombie', 'Imp', 'Slime'
    ];

    for (let i = 0; i < 50; i++) {
      const enemy = generateRandomEnemy(1);
      expect(validNames).toContain(enemy.name);
    }
  });

  it('should generate variety of names', () => {
    const names = new Set<string>();

    for (let i = 0; i < 100; i++) {
      const enemy = generateRandomEnemy(1);
      names.add(enemy.name);
    }

    // Should see multiple different names
    expect(names.size).toBeGreaterThanOrEqual(5);
  });
});

describe('generateEnemyGroup', () => {
  it('should generate correct number of enemies', () => {
    const group = generateEnemyGroup(5, 1);
    expect(group).toHaveLength(5);
  });

  it('should generate enemies with specified level', () => {
    const group = generateEnemyGroup(3, 10);

    for (const enemy of group) {
      expect(enemy.level).toBe(10);
    }
  });

  it('should default all enemies to normal type', () => {
    const group = generateEnemyGroup(5, 1);

    for (const enemy of group) {
      expect(enemy.type).toBe('normal');
    }
  });

  it('should cycle through provided types', () => {
    const types: EnemyType[] = ['normal', 'elite', 'boss'];
    const group = generateEnemyGroup(6, 1, types);

    expect(group[0].type).toBe('normal');
    expect(group[1].type).toBe('elite');
    expect(group[2].type).toBe('boss');
    expect(group[3].type).toBe('normal');
    expect(group[4].type).toBe('elite');
    expect(group[5].type).toBe('boss');
  });

  it('should generate unique enemies', () => {
    const group = generateEnemyGroup(10, 1);
    const ids = group.map((e) => e.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(10);
  });

  it('should handle single enemy group', () => {
    const group = generateEnemyGroup(1, 1);
    expect(group).toHaveLength(1);
  });

  it('should handle empty group', () => {
    const group = generateEnemyGroup(0, 1);
    expect(group).toHaveLength(0);
  });
});
