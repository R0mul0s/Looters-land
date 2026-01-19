/**
 * Skill System Tests
 *
 * Tests for hero skills, effects, cooldowns, and class-based retrieval.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  Skill,
  getSkillsForClass,
  warriorSkills,
  archerSkills,
  mageSkills,
  clericSkills,
  paladinSkills
} from './Skill';
import type { Combatant, Element } from '../../types/combat.types';
import type { StatusEffect } from '../../types/hero.types';

/**
 * Create mock combatant for testing
 */
function createMockCombatant(overrides: Partial<Combatant> = {}): Combatant {
  const statusEffects: StatusEffect[] = [];

  return {
    id: `mock_${Date.now()}_${Math.random()}`,
    name: 'Mock Hero',
    isEnemy: false,
    maxHP: 100,
    currentHP: 100,
    ATK: 50,
    DEF: 20,
    SPD: 15,
    CRIT: 10,
    ACC: 100,
    EVA: 5,
    isAlive: true,
    statusEffects,
    takeDamage: vi.fn((damage: number, isCrit: boolean = false, element: Element = 'physical') => {
      // Simple damage calculation for testing
      const finalDamage = isCrit ? Math.floor(damage * 1.5) : damage;
      return finalDamage;
    }),
    heal: vi.fn((amount: number) => {
      return Math.min(amount, 100 - 50); // Assume at 50 HP
    }),
    addStatusEffect: vi.fn((effect: StatusEffect) => {
      statusEffects.push(effect);
    }),
    getCombatStats: vi.fn(() => ({
      ATK: 50,
      DEF: 20,
      SPD: 15,
      CRIT: 10,
      ACC: 100,
      EVA: 5
    })),
    tickCooldowns: vi.fn(),
    tickStatusEffects: vi.fn(),
    ...overrides
  } as Combatant;
}

describe('Skill Class', () => {
  it('should create skill with correct properties', () => {
    const skill = new Skill(
      'test.skill.name',
      'test.skill.description',
      3,
      'damage',
      () => ({ attacker: null as any, type: 'skill_damage' })
    );

    expect(skill.nameKey).toBe('test.skill.name');
    expect(skill.descriptionKey).toBe('test.skill.description');
    expect(skill.cooldown).toBe(3);
    expect(skill.type).toBe('damage');
    expect(skill.execute).toBeDefined();
  });

  it('should have callable execute function', () => {
    const mockExecute = vi.fn(() => ({
      attacker: null as any,
      type: 'skill_damage' as const
    }));

    const skill = new Skill('test', 'test', 2, 'damage', mockExecute);
    const caster = createMockCombatant();
    const targets = [createMockCombatant()];

    skill.execute(caster, targets);

    expect(mockExecute).toHaveBeenCalledWith(caster, targets);
  });
});

describe('Warrior Skills', () => {
  it('should have exactly 3 skills', () => {
    expect(warriorSkills).toHaveLength(3);
  });

  describe('Heavy Slash', () => {
    const heavySlash = warriorSkills[0];

    it('should have correct cooldown', () => {
      expect(heavySlash.cooldown).toBe(2);
    });

    it('should be damage type', () => {
      expect(heavySlash.type).toBe('damage');
    });

    it('should deal 1.5x ATK damage', () => {
      const caster = createMockCombatant({ ATK: 100 });
      const target = createMockCombatant();

      heavySlash.execute(caster, [target]);

      // Should call takeDamage with 150 (100 * 1.5)
      expect(target.takeDamage).toHaveBeenCalled();
      const callArgs = (target.takeDamage as any).mock.calls[0];
      expect(callArgs[0]).toBe(150);
    });

    it('should use physical element', () => {
      const caster = createMockCombatant();
      const target = createMockCombatant();

      const result = heavySlash.execute(caster, [target]);

      expect(result.element).toBe('physical');
    });
  });

  describe('Shield Bash', () => {
    const shieldBash = warriorSkills[1];

    it('should have correct cooldown', () => {
      expect(shieldBash.cooldown).toBe(3);
    });

    it('should deal 0.8x ATK damage', () => {
      const caster = createMockCombatant({ ATK: 100 });
      const target = createMockCombatant();

      shieldBash.execute(caster, [target]);

      const callArgs = (target.takeDamage as any).mock.calls[0];
      expect(callArgs[0]).toBe(80);
    });

    it('should apply stun to target', () => {
      const caster = createMockCombatant();
      const target = createMockCombatant();

      shieldBash.execute(caster, [target]);

      expect(target.addStatusEffect).toHaveBeenCalled();
      const effect = (target.addStatusEffect as any).mock.calls[0][0];
      expect(effect.stun).toBe(true);
      expect(effect.duration).toBe(1);
    });
  });

  describe('Battle Cry', () => {
    const battleCry = warriorSkills[2];

    it('should have correct cooldown', () => {
      expect(battleCry.cooldown).toBe(5);
    });

    it('should be buff type', () => {
      expect(battleCry.type).toBe('buff');
    });

    it('should apply ATK buff to all targets', () => {
      const caster = createMockCombatant();
      const targets = [
        createMockCombatant(),
        createMockCombatant(),
        createMockCombatant()
      ];

      battleCry.execute(caster, targets);

      // Each target should receive buff
      for (const target of targets) {
        expect(target.addStatusEffect).toHaveBeenCalled();
        const effect = (target.addStatusEffect as any).mock.calls[0][0];
        expect(effect.stat).toBe('ATK');
        expect(effect.value).toBe(30);
        expect(effect.duration).toBe(3);
      }
    });
  });
});

describe('Archer Skills', () => {
  it('should have exactly 3 skills', () => {
    expect(archerSkills).toHaveLength(3);
  });

  describe('Precise Shot', () => {
    const preciseShot = archerSkills[0];

    it('should have correct cooldown', () => {
      expect(preciseShot.cooldown).toBe(2);
    });

    it('should deal 1.8x ATK damage as guaranteed crit', () => {
      const caster = createMockCombatant({ ATK: 100 });
      const target = createMockCombatant();

      preciseShot.execute(caster, [target]);

      const callArgs = (target.takeDamage as any).mock.calls[0];
      expect(callArgs[0]).toBe(180);
      expect(callArgs[1]).toBe(true); // isCrit = true
    });

    it('should return result with isCrit true', () => {
      const caster = createMockCombatant();
      const target = createMockCombatant();

      const result = preciseShot.execute(caster, [target]);

      expect(result.isCrit).toBe(true);
    });
  });

  describe('Multi Shot', () => {
    const multiShot = archerSkills[1];

    it('should have correct cooldown', () => {
      expect(multiShot.cooldown).toBe(4);
    });

    it('should hit all alive targets', () => {
      const caster = createMockCombatant({ ATK: 100 });
      const targets = [
        createMockCombatant({ isAlive: true }),
        createMockCombatant({ isAlive: true }),
        createMockCombatant({ isAlive: false })
      ];

      multiShot.execute(caster, targets);

      // Only alive targets should be hit
      expect(targets[0].takeDamage).toHaveBeenCalled();
      expect(targets[1].takeDamage).toHaveBeenCalled();
      expect(targets[2].takeDamage).not.toHaveBeenCalled();
    });

    it('should deal 0.8x ATK to each target', () => {
      const caster = createMockCombatant({ ATK: 100 });
      const target = createMockCombatant();

      multiShot.execute(caster, [target]);

      const callArgs = (target.takeDamage as any).mock.calls[0];
      expect(callArgs[0]).toBe(80);
    });

    it('should return AoE results', () => {
      const caster = createMockCombatant();
      const targets = [createMockCombatant(), createMockCombatant()];

      const result = multiShot.execute(caster, targets);

      expect(result.type).toBe('skill_aoe');
      expect(result.results).toBeDefined();
      expect(result.results).toHaveLength(2);
    });
  });

  describe('Evasion', () => {
    const evasion = archerSkills[2];

    it('should have correct cooldown', () => {
      expect(evasion.cooldown).toBe(3);
    });

    it('should be buff type', () => {
      expect(evasion.type).toBe('buff');
    });

    it('should apply SPD buff to caster', () => {
      const caster = createMockCombatant();

      evasion.execute(caster, []);

      expect(caster.addStatusEffect).toHaveBeenCalled();
      const effect = (caster.addStatusEffect as any).mock.calls[0][0];
      expect(effect.stat).toBe('SPD');
      expect(effect.value).toBe(50);
      expect(effect.duration).toBe(2);
    });
  });
});

describe('Mage Skills', () => {
  it('should have exactly 3 skills', () => {
    expect(mageSkills).toHaveLength(3);
  });

  describe('Fireball', () => {
    const fireball = mageSkills[0];

    it('should have correct cooldown', () => {
      expect(fireball.cooldown).toBe(2);
    });

    it('should deal 2.0x ATK damage', () => {
      const caster = createMockCombatant({ ATK: 100 });
      const target = createMockCombatant();

      fireball.execute(caster, [target]);

      const callArgs = (target.takeDamage as any).mock.calls[0];
      expect(callArgs[0]).toBe(200);
    });

    it('should use fire element', () => {
      const caster = createMockCombatant();
      const target = createMockCombatant();

      const result = fireball.execute(caster, [target]);

      expect(result.element).toBe('fire');
    });
  });

  describe('Chain Lightning', () => {
    const chainLightning = mageSkills[1];

    it('should have correct cooldown', () => {
      expect(chainLightning.cooldown).toBe(4);
    });

    it('should deal 1.2x ATK to all targets', () => {
      const caster = createMockCombatant({ ATK: 100 });
      const target = createMockCombatant();

      chainLightning.execute(caster, [target]);

      const callArgs = (target.takeDamage as any).mock.calls[0];
      expect(callArgs[0]).toBe(120);
    });

    it('should use lightning element', () => {
      const caster = createMockCombatant();
      const target = createMockCombatant();

      const result = chainLightning.execute(caster, [target]);

      expect(result.element).toBe('lightning');
    });
  });

  describe('Mana Shield', () => {
    const manaShield = mageSkills[2];

    it('should have correct cooldown', () => {
      expect(manaShield.cooldown).toBe(5);
    });

    it('should be buff type', () => {
      expect(manaShield.type).toBe('buff');
    });

    it('should apply 40% damage reduction to caster', () => {
      const caster = createMockCombatant();

      manaShield.execute(caster, []);

      expect(caster.addStatusEffect).toHaveBeenCalled();
      const effect = (caster.addStatusEffect as any).mock.calls[0][0];
      expect(effect.stat).toBe('damageReduction');
      expect(effect.value).toBe(40);
      expect(effect.duration).toBe(3);
    });
  });
});

describe('Cleric Skills', () => {
  it('should have exactly 3 skills', () => {
    expect(clericSkills).toHaveLength(3);
  });

  describe('Heal', () => {
    const heal = clericSkills[0];

    it('should have correct cooldown', () => {
      expect(heal.cooldown).toBe(2);
    });

    it('should be heal type', () => {
      expect(heal.type).toBe('heal');
    });

    it('should heal 60% of target max HP', () => {
      const caster = createMockCombatant();
      const target = createMockCombatant({ maxHP: 100 });

      heal.execute(caster, [target]);

      expect(target.heal).toHaveBeenCalledWith(60);
    });

    it('should return heal amount in result', () => {
      const caster = createMockCombatant();
      const target = createMockCombatant();

      const result = heal.execute(caster, [target]);

      expect(result.type).toBe('skill_heal');
      expect(result.healAmount).toBeDefined();
    });
  });

  describe('Group Heal', () => {
    const groupHeal = clericSkills[1];

    it('should have correct cooldown', () => {
      expect(groupHeal.cooldown).toBe(4);
    });

    it('should heal 30% of each target max HP', () => {
      const caster = createMockCombatant();
      const targets = [
        createMockCombatant({ maxHP: 100 }),
        createMockCombatant({ maxHP: 200 })
      ];

      groupHeal.execute(caster, targets);

      expect(targets[0].heal).toHaveBeenCalledWith(30);
      expect(targets[1].heal).toHaveBeenCalledWith(60);
    });

    it('should skip dead targets', () => {
      const caster = createMockCombatant();
      const targets = [
        createMockCombatant({ isAlive: true }),
        createMockCombatant({ isAlive: false })
      ];

      groupHeal.execute(caster, targets);

      expect(targets[0].heal).toHaveBeenCalled();
      expect(targets[1].heal).not.toHaveBeenCalled();
    });

    it('should return group heal results', () => {
      const caster = createMockCombatant();
      const targets = [createMockCombatant(), createMockCombatant()];

      const result = groupHeal.execute(caster, targets);

      expect(result.type).toBe('skill_group_heal');
      expect(result.results).toHaveLength(2);
    });
  });

  describe('Holy Smite', () => {
    const holySmite = clericSkills[2];

    it('should have correct cooldown', () => {
      expect(holySmite.cooldown).toBe(3);
    });

    it('should be damage type', () => {
      expect(holySmite.type).toBe('damage');
    });

    it('should deal 1.0x ATK damage', () => {
      const caster = createMockCombatant({ ATK: 100 });
      const target = createMockCombatant();

      holySmite.execute(caster, [target]);

      const callArgs = (target.takeDamage as any).mock.calls[0];
      expect(callArgs[0]).toBe(100);
    });

    it('should use holy element', () => {
      const caster = createMockCombatant();
      const target = createMockCombatant();

      const result = holySmite.execute(caster, [target]);

      expect(result.element).toBe('holy');
    });
  });
});

describe('Paladin Skills', () => {
  it('should have exactly 3 skills', () => {
    expect(paladinSkills).toHaveLength(3);
  });

  describe('Smite', () => {
    const smite = paladinSkills[0];

    it('should have correct cooldown', () => {
      expect(smite.cooldown).toBe(2);
    });

    it('should deal 1.3x ATK damage', () => {
      const caster = createMockCombatant({ ATK: 100 });
      const target = createMockCombatant();

      smite.execute(caster, [target]);

      const callArgs = (target.takeDamage as any).mock.calls[0];
      expect(callArgs[0]).toBe(130);
    });

    it('should heal caster for 30% of damage dealt', () => {
      const caster = createMockCombatant({ ATK: 100 });
      const target = createMockCombatant();
      // Mock takeDamage to return actual damage dealt
      (target.takeDamage as any).mockReturnValue(100);

      smite.execute(caster, [target]);

      // Should heal 30% of 100 = 30
      expect(caster.heal).toHaveBeenCalledWith(30);
    });

    it('should use holy element', () => {
      const caster = createMockCombatant();
      const target = createMockCombatant();

      const result = smite.execute(caster, [target]);

      expect(result.element).toBe('holy');
    });

    it('should return damage_heal type', () => {
      const caster = createMockCombatant();
      const target = createMockCombatant();

      const result = smite.execute(caster, [target]);

      expect(result.type).toBe('skill_damage_heal');
    });
  });

  describe('Divine Shield', () => {
    const divineShield = paladinSkills[1];

    it('should have correct cooldown', () => {
      expect(divineShield.cooldown).toBe(5);
    });

    it('should be buff type', () => {
      expect(divineShield.type).toBe('buff');
    });

    it('should apply immunity to caster', () => {
      const caster = createMockCombatant();

      divineShield.execute(caster, []);

      expect(caster.addStatusEffect).toHaveBeenCalled();
      const effect = (caster.addStatusEffect as any).mock.calls[0][0];
      expect(effect.immunity).toBe(true);
      expect(effect.duration).toBe(1);
    });
  });

  describe('Blessing', () => {
    const blessing = paladinSkills[2];

    it('should have correct cooldown', () => {
      expect(blessing.cooldown).toBe(3);
    });

    it('should be buff type', () => {
      expect(blessing.type).toBe('buff');
    });

    it('should apply 40% DEF buff to target', () => {
      const caster = createMockCombatant();
      const target = createMockCombatant();

      blessing.execute(caster, [target]);

      expect(target.addStatusEffect).toHaveBeenCalled();
      const effect = (target.addStatusEffect as any).mock.calls[0][0];
      expect(effect.stat).toBe('DEF');
      expect(effect.value).toBe(40);
      expect(effect.duration).toBe(3);
    });
  });
});

describe('getSkillsForClass', () => {
  it('should return warrior skills for warrior class', () => {
    const skills = getSkillsForClass('warrior');
    expect(skills).toBe(warriorSkills);
    expect(skills).toHaveLength(3);
  });

  it('should return archer skills for archer class', () => {
    const skills = getSkillsForClass('archer');
    expect(skills).toBe(archerSkills);
    expect(skills).toHaveLength(3);
  });

  it('should return mage skills for mage class', () => {
    const skills = getSkillsForClass('mage');
    expect(skills).toBe(mageSkills);
    expect(skills).toHaveLength(3);
  });

  it('should return cleric skills for cleric class', () => {
    const skills = getSkillsForClass('cleric');
    expect(skills).toBe(clericSkills);
    expect(skills).toHaveLength(3);
  });

  it('should return paladin skills for paladin class', () => {
    const skills = getSkillsForClass('paladin');
    expect(skills).toBe(paladinSkills);
    expect(skills).toHaveLength(3);
  });

  it('should return empty array for invalid class', () => {
    const skills = getSkillsForClass('invalid' as any);
    expect(skills).toEqual([]);
  });
});

describe('Skill Cooldowns', () => {
  it('should have cooldowns between 2 and 5', () => {
    const allSkills = [
      ...warriorSkills,
      ...archerSkills,
      ...mageSkills,
      ...clericSkills,
      ...paladinSkills
    ];

    for (const skill of allSkills) {
      expect(skill.cooldown).toBeGreaterThanOrEqual(2);
      expect(skill.cooldown).toBeLessThanOrEqual(5);
    }
  });

  it('should have longer cooldowns for stronger skills', () => {
    // Group heal (AOE heal) should have longer cooldown than single heal
    const heal = clericSkills[0];
    const groupHeal = clericSkills[1];

    expect(groupHeal.cooldown).toBeGreaterThan(heal.cooldown);
  });
});

describe('Skill Types', () => {
  it('should have correct type distribution', () => {
    const allSkills = [
      ...warriorSkills,
      ...archerSkills,
      ...mageSkills,
      ...clericSkills,
      ...paladinSkills
    ];

    const typeCounts = {
      damage: 0,
      heal: 0,
      buff: 0
    };

    for (const skill of allSkills) {
      typeCounts[skill.type]++;
    }

    // Should have variety of skill types
    expect(typeCounts.damage).toBeGreaterThan(0);
    expect(typeCounts.heal).toBeGreaterThan(0);
    expect(typeCounts.buff).toBeGreaterThan(0);
  });
});

describe('Total Skills Count', () => {
  it('should have exactly 15 skills total (3 per class × 5 classes)', () => {
    const totalSkills =
      warriorSkills.length +
      archerSkills.length +
      mageSkills.length +
      clericSkills.length +
      paladinSkills.length;

    expect(totalSkills).toBe(15);
  });
});
