/**
 * Skill System - Hero abilities and special attacks
 *
 * Defines all hero skills with their effects, cooldowns, and execute functions.
 * Each hero class has 3 unique skills matching their role and playstyle.
 *
 * Contains:
 * - Skill class - Base skill definition with execute function
 * - 15 Total skills (3 per class × 5 classes)
 * - Warrior skills - Heavy damage, stun, and team buffs
 * - Archer skills - Precision attacks, AoE, and mobility buffs
 * - Mage skills - AoE damage and defensive magic
 * - Cleric skills - Healing, immunity, and holy damage
 * - Paladin skills - Hybrid damage/healing and protection buffs
 * - Status effects application (buffs, debuffs, stun)
 * - Skill helper functions for class-based retrieval
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-07
 */

import type {
  SkillType,
  SkillExecuteFunction,
  CombatActionResult,
  Combatant
} from '../../types/combat.types';
import type { HeroClass } from '../../types/hero.types';

export class Skill {
  name: string;
  description: string;
  cooldown: number; // in turns
  type: SkillType;
  execute: SkillExecuteFunction;

  constructor(
    name: string,
    description: string,
    cooldown: number,
    type: SkillType,
    execute: SkillExecuteFunction
  ) {
    this.name = name;
    this.description = description;
    this.cooldown = cooldown;
    this.type = type;
    this.execute = execute;
  }
}

// ============================================================================
// WARRIOR SKILLS
// ============================================================================
const warriorSkills: Skill[] = [
  new Skill(
    'Heavy Slash',
    'Deal 150% ATK damage to single target',
    2,
    'damage',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      const target = targets[0];
      const isCrit = Math.random() * 100 < caster.CRIT;
      const damage = Math.floor(caster.ATK * 1.5);
      const finalDamage = target.takeDamage(damage, isCrit);

      return {
        attacker: caster,
        target: target,
        damage: finalDamage,
        isCrit: isCrit,
        skillName: 'Heavy Slash',
        type: 'skill_damage'
      };
    }
  ),
  new Skill(
    'Shield Bash',
    'Deal 80% ATK damage and stun for 1 turn',
    3,
    'damage',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      const target = targets[0];
      const damage = Math.floor(caster.ATK * 0.8);
      const finalDamage = target.takeDamage(damage, false);

      // Apply stun debuff
      target.addStatusEffect({
        name: 'Stunned',
        duration: 1,
        type: 'debuff',
        stun: true
      });

      return {
        attacker: caster,
        target: target,
        damage: finalDamage,
        skillName: 'Shield Bash',
        type: 'skill_damage',
        effect: 'Stunned!'
      };
    }
  ),
  new Skill(
    'Battle Cry',
    'Increase team ATK by 30% for 3 turns',
    5,
    'buff',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      // Apply buff to all targets
      targets.forEach(target => {
        target.addStatusEffect({
          name: 'Battle Cry',
          duration: 3,
          type: 'buff',
          stat: 'ATK',
          value: 30
        });
      });

      return {
        attacker: caster,
        targets: targets,
        skillName: 'Battle Cry',
        type: 'skill_buff',
        effect: '+30% ATK for 3 turns'
      };
    }
  )
];

// ============================================================================
// ARCHER SKILLS
// ============================================================================
const archerSkills: Skill[] = [
  new Skill(
    'Precise Shot',
    'Deal 180% ATK damage with guaranteed crit',
    2,
    'damage',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      const target = targets[0];
      const damage = Math.floor(caster.ATK * 1.8);
      const finalDamage = target.takeDamage(damage, true);

      return {
        attacker: caster,
        target: target,
        damage: finalDamage,
        isCrit: true,
        skillName: 'Precise Shot',
        type: 'skill_damage'
      };
    }
  ),
  new Skill(
    'Multi-Shot',
    'Deal 80% ATK damage to all enemies',
    4,
    'damage',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      const results: Array<{ target: Combatant; damage: number; isCrit: boolean }> = [];
      targets.forEach(target => {
        if (target.isAlive) {
          const damage = Math.floor(caster.ATK * 0.8);
          const isCrit = Math.random() * 100 < caster.CRIT;
          const finalDamage = target.takeDamage(damage, isCrit);
          results.push({
            target: target,
            damage: finalDamage,
            isCrit: isCrit
          });
        }
      });

      return {
        attacker: caster,
        skillName: 'Multi-Shot',
        type: 'skill_aoe',
        results: results
      };
    }
  ),
  new Skill(
    'Evasion',
    'Increase SPD by 50% for 2 turns',
    3,
    'buff',
    (caster: Combatant, _targets: Combatant[]): CombatActionResult => {
      // Apply SPD buff to caster
      caster.addStatusEffect({
        name: 'Evasion',
        duration: 2,
        type: 'buff',
        stat: 'SPD',
        value: 50
      });

      return {
        attacker: caster,
        skillName: 'Evasion',
        type: 'skill_buff',
        effect: '+50% SPD for 2 turns'
      };
    }
  )
];

// ============================================================================
// MAGE SKILLS
// ============================================================================
const mageSkills: Skill[] = [
  new Skill(
    'Fireball',
    'Deal 200% ATK magic damage to single target',
    2,
    'damage',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      const target = targets[0];
      const isCrit = Math.random() * 100 < caster.CRIT;
      const damage = Math.floor(caster.ATK * 2.0);
      const finalDamage = target.takeDamage(damage, isCrit);

      return {
        attacker: caster,
        target: target,
        damage: finalDamage,
        isCrit: isCrit,
        skillName: 'Fireball',
        type: 'skill_damage'
      };
    }
  ),
  new Skill(
    'Chain Lightning',
    'Deal 120% ATK damage to all enemies',
    4,
    'damage',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      const results: Array<{ target: Combatant; damage: number; isCrit: boolean }> = [];
      targets.forEach(target => {
        if (target.isAlive) {
          const damage = Math.floor(caster.ATK * 1.2);
          const isCrit = Math.random() * 100 < caster.CRIT;
          const finalDamage = target.takeDamage(damage, isCrit);
          results.push({
            target: target,
            damage: finalDamage,
            isCrit: isCrit
          });
        }
      });

      return {
        attacker: caster,
        skillName: 'Chain Lightning',
        type: 'skill_aoe',
        results: results
      };
    }
  ),
  new Skill(
    'Mana Shield',
    'Reduce incoming damage by 40% for 3 turns',
    5,
    'buff',
    (caster: Combatant, _targets: Combatant[]): CombatActionResult => {
      // Apply damage reduction buff
      caster.addStatusEffect({
        name: 'Mana Shield',
        duration: 3,
        type: 'buff',
        stat: 'damageReduction',
        value: 40
      });

      return {
        attacker: caster,
        skillName: 'Mana Shield',
        type: 'skill_buff',
        effect: '-40% damage taken for 3 turns'
      };
    }
  )
];

// ============================================================================
// CLERIC SKILLS
// ============================================================================
const clericSkills: Skill[] = [
  new Skill(
    'Heal',
    'Restore 100 HP to single ally',
    2,
    'heal',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      const target = targets[0];
      const healAmount = target.heal(100);

      return {
        attacker: caster,
        target: target,
        healAmount: healAmount,
        skillName: 'Heal',
        type: 'skill_heal'
      };
    }
  ),
  new Skill(
    'Group Heal',
    'Restore 60 HP to all allies',
    4,
    'heal',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      const results: Array<{ target: Combatant; healAmount: number }> = [];
      targets.forEach(target => {
        if (target.isAlive) {
          const healAmount = target.heal(60);
          results.push({
            target: target,
            healAmount: healAmount
          });
        }
      });

      return {
        attacker: caster,
        skillName: 'Group Heal',
        type: 'skill_group_heal',
        results: results
      };
    }
  ),
  new Skill(
    'Holy Smite',
    'Deal 100% ATK holy damage',
    3,
    'damage',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      const target = targets[0];
      const damage = caster.ATK;
      const finalDamage = target.takeDamage(damage, false);

      return {
        attacker: caster,
        target: target,
        damage: finalDamage,
        skillName: 'Holy Smite',
        type: 'skill_damage'
      };
    }
  )
];

// ============================================================================
// PALADIN SKILLS
// ============================================================================
const paladinSkills: Skill[] = [
  new Skill(
    'Smite',
    'Deal 130% ATK damage and heal self for 30% damage dealt',
    2,
    'damage',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      const target = targets[0];
      const damage = Math.floor(caster.ATK * 1.3);
      const isCrit = Math.random() * 100 < caster.CRIT;
      const finalDamage = target.takeDamage(damage, isCrit);
      const healAmount = caster.heal(Math.floor(finalDamage * 0.3));

      return {
        attacker: caster,
        target: target,
        damage: finalDamage,
        isCrit: isCrit,
        healAmount: healAmount,
        skillName: 'Smite',
        type: 'skill_damage_heal'
      };
    }
  ),
  new Skill(
    'Divine Shield',
    'Become immune to damage for 1 turn',
    5,
    'buff',
    (caster: Combatant, _targets: Combatant[]): CombatActionResult => {
      // Apply immunity buff
      caster.addStatusEffect({
        name: 'Divine Shield',
        duration: 1,
        type: 'buff',
        immunity: true
      });

      return {
        attacker: caster,
        skillName: 'Divine Shield',
        type: 'skill_buff',
        effect: 'Immune to damage for 1 turn'
      };
    }
  ),
  new Skill(
    'Blessing',
    'Increase ally DEF by 40% for 3 turns',
    3,
    'buff',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      const target = targets[0];

      // Apply DEF buff to target
      target.addStatusEffect({
        name: 'Blessing',
        duration: 3,
        type: 'buff',
        stat: 'DEF',
        value: 40
      });

      return {
        attacker: caster,
        target: target,
        skillName: 'Blessing',
        type: 'skill_buff',
        effect: '+40% DEF for 3 turns'
      };
    }
  )
];

// ============================================================================
// SKILL HELPER FUNCTIONS
// ============================================================================

/**
 * Get skills for a specific hero class
 */
export function getSkillsForClass(heroClass: HeroClass): Skill[] {
  const skillMap: Record<HeroClass, Skill[]> = {
    warrior: warriorSkills,
    archer: archerSkills,
    mage: mageSkills,
    cleric: clericSkills,
    paladin: paladinSkills
  };

  return skillMap[heroClass] || [];
}

/**
 * Export skill arrays for direct access if needed
 */
export {
  warriorSkills,
  archerSkills,
  mageSkills,
  clericSkills,
  paladinSkills
};
