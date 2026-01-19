/**
 * Hero System Tests
 *
 * Tests for XP/leveling, stat growth, talent merging, and hero classes.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hero } from './Hero';

// Mock i18n to avoid browser dependencies
vi.mock('../../localization/i18n', () => ({
  t: (key: string) => key
}));

describe('Hero - Basic Creation', () => {
  it('should create hero with correct name and class', () => {
    const hero = new Hero('Theron', 'warrior', 1);

    expect(hero.name).toBe('Theron');
    expect(hero.class).toBe('warrior');
    expect(hero.level).toBe(1);
  });

  it('should create hero with default rarity as common', () => {
    const hero = new Hero('Test', 'archer', 1);
    expect(hero.rarity).toBe('common');
  });

  it('should create hero with specified rarity', () => {
    const hero = new Hero('Test', 'mage', 1, 'legendary');
    expect(hero.rarity).toBe('legendary');
  });

  it('should generate unique UUID for each hero', () => {
    const hero1 = new Hero('Hero1', 'warrior', 1);
    const hero2 = new Hero('Hero2', 'warrior', 1);

    expect(hero1.id).not.toBe(hero2.id);
    // UUID format check (basic)
    expect(hero1.id).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('should initialize combat state correctly', () => {
    const hero = new Hero('Test', 'warrior', 1);

    expect(hero.isAlive).toBe(true);
    expect(hero.currentHP).toBe(hero.maxHP);
    expect(hero.statusEffects).toHaveLength(0);
    expect(hero.cooldowns.size).toBe(0);
  });
});

describe('Hero - Class Stats', () => {
  describe('Warrior', () => {
    it('should have high HP and DEF', () => {
      const warrior = new Hero('Warrior', 'warrior', 1);
      const mage = new Hero('Mage', 'mage', 1);

      expect(warrior.maxHP).toBeGreaterThan(mage.maxHP);
      expect(warrior.DEF).toBeGreaterThan(mage.DEF);
    });

    it('should have lower SPD than archer', () => {
      const warrior = new Hero('Warrior', 'warrior', 1);
      const archer = new Hero('Archer', 'archer', 1);

      expect(warrior.SPD).toBeLessThan(archer.SPD);
    });

    it('should have physical resistance', () => {
      const warrior = new Hero('Warrior', 'warrior', 1);
      expect(warrior.resistances.physical).toBe(20);
    });

    it('should be weak to lightning', () => {
      const warrior = new Hero('Warrior', 'warrior', 1);
      expect(warrior.weaknesses).toContain('lightning');
    });
  });

  describe('Archer', () => {
    it('should have high SPD and CRIT', () => {
      const archer = new Hero('Archer', 'archer', 1);
      const warrior = new Hero('Warrior', 'warrior', 1);

      expect(archer.SPD).toBeGreaterThan(warrior.SPD);
      expect(archer.CRIT).toBeGreaterThan(warrior.CRIT);
    });

    it('should have no elemental weaknesses', () => {
      const archer = new Hero('Archer', 'archer', 1);
      expect(archer.weaknesses).toHaveLength(0);
    });
  });

  describe('Mage', () => {
    it('should have highest ATK', () => {
      const mage = new Hero('Mage', 'mage', 1);
      const warrior = new Hero('Warrior', 'warrior', 1);

      expect(mage.ATK).toBeGreaterThan(warrior.ATK);
    });

    it('should have lowest HP', () => {
      const mage = new Hero('Mage', 'mage', 1);
      const cleric = new Hero('Cleric', 'cleric', 1);

      expect(mage.maxHP).toBeLessThan(cleric.maxHP);
    });

    it('should have magical resistances', () => {
      const mage = new Hero('Mage', 'mage', 1);

      expect(mage.resistances.fire).toBe(15);
      expect(mage.resistances.ice).toBe(15);
      expect(mage.resistances.lightning).toBe(15);
    });

    it('should be weak to physical', () => {
      const mage = new Hero('Mage', 'mage', 1);
      expect(mage.weaknesses).toContain('physical');
    });
  });

  describe('Cleric', () => {
    it('should have holy resistance and dark weakness', () => {
      const cleric = new Hero('Cleric', 'cleric', 1);

      expect(cleric.resistances.holy).toBe(30);
      expect(cleric.resistances.dark).toBe(-20); // Negative = vulnerable
      expect(cleric.weaknesses).toContain('dark');
    });
  });

  describe('Paladin', () => {
    it('should be a hybrid with balanced stats', () => {
      const paladin = new Hero('Paladin', 'paladin', 1);
      const warrior = new Hero('Warrior', 'warrior', 1);
      const cleric = new Hero('Cleric', 'cleric', 1);

      // Paladin HP should be between warrior and cleric
      expect(paladin.maxHP).toBeLessThan(warrior.maxHP);
      expect(paladin.maxHP).toBeGreaterThan(cleric.maxHP);
    });

    it('should have both physical and holy resistance', () => {
      const paladin = new Hero('Paladin', 'paladin', 1);

      expect(paladin.resistances.physical).toBe(10);
      expect(paladin.resistances.holy).toBe(20);
    });
  });

  describe('All Classes at Level 1', () => {
    const classes = ['warrior', 'archer', 'mage', 'cleric', 'paladin'] as const;

    classes.forEach((heroClass) => {
      it(`should create ${heroClass} with valid stats`, () => {
        const hero = new Hero('Test', heroClass, 1);

        expect(hero.maxHP).toBeGreaterThan(0);
        expect(hero.ATK).toBeGreaterThan(0);
        expect(hero.DEF).toBeGreaterThan(0);
        expect(hero.SPD).toBeGreaterThan(0);
        expect(hero.CRIT).toBeGreaterThanOrEqual(0);
      });
    });
  });
});

describe('Hero - XP and Leveling', () => {
  describe('XP Calculation', () => {
    it('should calculate required XP with formula: 100 * (level ^ 1.5)', () => {
      const hero = new Hero('Test', 'warrior', 1);

      // Level 1 → Level 2: 100 * 1^1.5 = 100
      expect(hero.calculateRequiredXP(1)).toBe(100);

      // Level 5 → Level 6: 100 * 5^1.5 = 1118
      expect(hero.calculateRequiredXP(5)).toBe(Math.floor(100 * Math.pow(5, 1.5)));

      // Level 10 → Level 11: 100 * 10^1.5 = 3162
      expect(hero.calculateRequiredXP(10)).toBe(Math.floor(100 * Math.pow(10, 1.5)));
    });

    it('should scale XP exponentially', () => {
      const hero = new Hero('Test', 'warrior', 1);

      const xp5 = hero.calculateRequiredXP(5);
      const xp10 = hero.calculateRequiredXP(10);
      const xp20 = hero.calculateRequiredXP(20);

      expect(xp10).toBeGreaterThan(xp5 * 2);
      expect(xp20).toBeGreaterThan(xp10 * 2);
    });
  });

  describe('Gaining XP', () => {
    it('should add XP to current experience', () => {
      const hero = new Hero('Test', 'warrior', 1);

      expect(hero.experience).toBe(0);

      hero.gainXP(50);
      expect(hero.experience).toBe(50);

      hero.gainXP(30);
      expect(hero.experience).toBe(80);
    });

    it('should level up when XP exceeds required', () => {
      const hero = new Hero('Test', 'warrior', 1);
      const requiredXP = hero.requiredXP;

      expect(hero.level).toBe(1);

      hero.gainXP(requiredXP);
      expect(hero.level).toBe(2);
    });

    it('should carry over excess XP after level up', () => {
      const hero = new Hero('Test', 'warrior', 1);
      const requiredXP = hero.requiredXP;

      hero.gainXP(requiredXP + 50);
      expect(hero.level).toBe(2);
      expect(hero.experience).toBe(50);
    });

    it('should handle multiple level ups from single XP gain', () => {
      const hero = new Hero('Test', 'warrior', 1);

      // Give enough XP for multiple levels
      hero.gainXP(10000);

      expect(hero.level).toBeGreaterThan(5);
    });

    it('should return level up messages', () => {
      const hero = new Hero('Test', 'warrior', 1);
      const requiredXP = hero.requiredXP;

      const messages = hero.gainXP(requiredXP);

      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]).toContain('leveled up');
    });

    it('should return empty array if no level up', () => {
      const hero = new Hero('Test', 'warrior', 1);

      const messages = hero.gainXP(1);

      expect(messages).toHaveLength(0);
    });
  });

  describe('Stat Growth on Level Up', () => {
    it('should increase HP on level up', () => {
      const hero = new Hero('Test', 'warrior', 1);
      const initialHP = hero.maxHP;

      hero.gainXP(hero.requiredXP);

      expect(hero.maxHP).toBeGreaterThan(initialHP);
    });

    it('should increase ATK on level up', () => {
      const hero = new Hero('Test', 'archer', 1);
      const initialATK = hero.ATK;

      hero.gainXP(hero.requiredXP);

      expect(hero.ATK).toBeGreaterThan(initialATK);
    });

    it('should increase DEF on level up', () => {
      const hero = new Hero('Test', 'warrior', 1);
      const initialDEF = hero.DEF;

      hero.gainXP(hero.requiredXP);

      expect(hero.DEF).toBeGreaterThan(initialDEF);
    });

    it('should increase SPD on level up', () => {
      const hero = new Hero('Test', 'archer', 1);
      const initialSPD = hero.SPD;

      hero.gainXP(hero.requiredXP);

      expect(hero.SPD).toBeGreaterThan(initialSPD);
    });

    it('should increase CRIT on level up', () => {
      const hero = new Hero('Test', 'archer', 1);
      const initialCRIT = hero.CRIT;

      hero.gainXP(hero.requiredXP);

      expect(hero.CRIT).toBeGreaterThan(initialCRIT);
    });

    it('should heal to full HP on level up', () => {
      const hero = new Hero('Test', 'warrior', 1);
      hero.currentHP = 1; // Almost dead

      hero.gainXP(hero.requiredXP);

      expect(hero.currentHP).toBe(hero.maxHP);
    });

    it('should use growth rate of +5% HP per level', () => {
      const hero = new Hero('Test', 'warrior', 1);
      const initialHP = hero.baseMaxHP;

      hero.gainXP(hero.requiredXP);

      // +5% growth rate
      const expectedHP = Math.ceil(initialHP * 1.05);
      expect(hero.baseMaxHP).toBe(expectedHP);
    });
  });

  describe('Level Progression', () => {
    it('should correctly track level progression from 1 to 10', () => {
      const hero = new Hero('Test', 'warrior', 1);
      const stats: number[] = [hero.maxHP];

      while (hero.level < 10) {
        hero.gainXP(hero.requiredXP);
        stats.push(hero.maxHP);
      }

      expect(hero.level).toBe(10);

      // Each stat should be higher than previous
      for (let i = 1; i < stats.length; i++) {
        expect(stats[i]).toBeGreaterThan(stats[i - 1]);
      }
    });
  });
});

describe('Hero - Combat Power Score', () => {
  describe('Score Calculation', () => {
    it('should calculate score based on stats', () => {
      const hero = new Hero('Test', 'warrior', 1);
      const score = hero.getScore();

      expect(score).toBeGreaterThan(0);
    });

    it('should use formula: (HP * 0.5) + (ATK * 5) + (DEF * 3) + (SPD * 2) + (CRIT * 10)', () => {
      const hero = new Hero('Test', 'warrior', 1);

      const expectedBase =
        (hero.maxHP * 0.5) +
        (hero.ATK * 5) +
        (hero.DEF * 3) +
        (hero.SPD * 2) +
        (hero.CRIT * 10);

      const rarityMultiplier = 1.0; // Common
      const expectedScore = Math.floor(expectedBase * rarityMultiplier);

      expect(hero.getScore()).toBe(expectedScore);
    });

    it('should increase score with level', () => {
      const hero1 = new Hero('LowLevel', 'warrior', 1);
      const hero10 = new Hero('HighLevel', 'warrior', 10);

      expect(hero10.getScore()).toBeGreaterThan(hero1.getScore());
    });
  });

  describe('Rarity Multipliers', () => {
    it('should apply 1.0x multiplier for common', () => {
      const common = new Hero('Common', 'warrior', 10, 'common');
      const rare = new Hero('Rare', 'warrior', 10, 'rare');

      // Rare (1.2x) should have higher score than common (1.0x)
      expect(rare.getScore()).toBeGreaterThan(common.getScore());
    });

    it('should apply 1.2x multiplier for rare', () => {
      const common = new Hero('Test', 'warrior', 10, 'common');
      const rare = new Hero('Test', 'warrior', 10, 'rare');

      const commonScore = common.getScore();
      const rareScore = rare.getScore();

      // Rare should be ~1.2x common
      expect(rareScore).toBeCloseTo(commonScore * 1.2, -1);
    });

    it('should apply 1.4x multiplier for epic', () => {
      const common = new Hero('Test', 'warrior', 10, 'common');
      const epic = new Hero('Test', 'warrior', 10, 'epic');

      const commonScore = common.getScore();
      const epicScore = epic.getScore();

      expect(epicScore).toBeCloseTo(commonScore * 1.4, -1);
    });

    it('should apply 1.6x multiplier for legendary', () => {
      const common = new Hero('Test', 'warrior', 10, 'common');
      const legendary = new Hero('Test', 'warrior', 10, 'legendary');

      const commonScore = common.getScore();
      const legendaryScore = legendary.getScore();

      expect(legendaryScore).toBeCloseTo(commonScore * 1.6, -1);
    });
  });
});

describe('Hero - Talent Points', () => {
  it('should initialize with 0 talent points', () => {
    const hero = new Hero('Test', 'warrior', 1);
    expect(hero.talentPoints).toBe(0);
  });

  it('should track talent points separately from level', () => {
    const hero = new Hero('Test', 'warrior', 10);

    expect(hero.level).toBe(10);
    expect(hero.talentPoints).toBe(0);

    // Simulate duplicate merge
    hero.talentPoints = 1;
    expect(hero.talentPoints).toBe(1);
  });
});

describe('Hero - Combat State', () => {
  describe('Reset Combat State', () => {
    it('should clear cooldowns', () => {
      const hero = new Hero('Test', 'warrior', 1);
      hero.cooldowns.set('Heavy Slash', 2);
      hero.cooldowns.set('Shield Bash', 3);

      hero.resetCombatState();

      expect(hero.cooldowns.size).toBe(0);
    });

    it('should clear status effects', () => {
      const hero = new Hero('Test', 'warrior', 1);
      hero.addStatusEffect({ name: 'Buff', duration: 3, type: 'buff', stat: 'ATK', value: 10 });

      hero.resetCombatState();

      expect(hero.statusEffects).toHaveLength(0);
    });

    it('should NOT heal HP', () => {
      const hero = new Hero('Test', 'warrior', 1);
      hero.currentHP = 50;

      hero.resetCombatState();

      expect(hero.currentHP).toBe(50);
    });
  });

  describe('Full Reset', () => {
    it('should restore full HP', () => {
      const hero = new Hero('Test', 'warrior', 1);
      hero.currentHP = 1;

      hero.reset();

      expect(hero.currentHP).toBe(hero.maxHP);
    });

    it('should set isAlive to true', () => {
      const hero = new Hero('Test', 'warrior', 1);
      hero.isAlive = false;

      hero.reset();

      expect(hero.isAlive).toBe(true);
    });
  });
});

describe('Hero - Healing', () => {
  it('should heal up to max HP', () => {
    const hero = new Hero('Test', 'warrior', 1);
    hero.currentHP = 50;

    const healed = hero.heal(1000);

    expect(hero.currentHP).toBe(hero.maxHP);
    expect(healed).toBe(hero.maxHP - 50);
  });

  it('should not heal dead hero', () => {
    const hero = new Hero('Test', 'warrior', 1);
    hero.currentHP = 0;
    hero.isAlive = false;

    const healed = hero.heal(100);

    expect(healed).toBe(0);
    expect(hero.currentHP).toBe(0);
  });

  it('should return actual amount healed', () => {
    const hero = new Hero('Test', 'warrior', 1);
    hero.currentHP = hero.maxHP - 10;

    const healed = hero.heal(100);

    expect(healed).toBe(10);
  });
});

describe('Hero - Position System', () => {
  it('should assign default position based on class', () => {
    const warrior = new Hero('Warrior', 'warrior', 1);
    const archer = new Hero('Archer', 'archer', 1);
    const mage = new Hero('Mage', 'mage', 1);

    // Warrior = FRONT, Archer = MIDDLE, Mage = BACK
    expect(warrior.position).toBe('front');
    expect(archer.position).toBe('middle');
    expect(mage.position).toBe('back');
  });

  it('should allow setting position', () => {
    const hero = new Hero('Test', 'warrior', 1);

    hero.setPosition('back');
    expect(hero.position).toBe('back');
  });
});

describe('Hero - Skills', () => {
  it('should have 3 skills per class', () => {
    const classes = ['warrior', 'archer', 'mage', 'cleric', 'paladin'] as const;

    classes.forEach((heroClass) => {
      const hero = new Hero('Test', heroClass, 1);
      const skills = hero.getSkills();

      expect(skills).toHaveLength(3);
    });
  });

  it('should track skill cooldowns', () => {
    const hero = new Hero('Test', 'warrior', 1);
    hero.cooldowns.set('Test Skill', 3);

    hero.tickCooldowns();
    expect(hero.cooldowns.get('Test Skill')).toBe(2);

    hero.tickCooldowns();
    expect(hero.cooldowns.get('Test Skill')).toBe(1);

    hero.tickCooldowns();
    expect(hero.cooldowns.get('Test Skill')).toBe(0);
  });
});
