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
 * @lastModified 2025-11-20
 */

import type {
  SkillType,
  SkillExecuteFunction,
  CombatActionResult,
  Combatant,
  Element
} from '../../types/combat.types';
import type { HeroClass } from '../../types/hero.types';
import { t } from '../../localization/i18n';

export class Skill {
  /** Localization key for skill name (e.g., 'skills.heavySlash.name') */
  nameKey: string;
  /** Localization key for skill description */
  descriptionKey: string;
  cooldown: number; // in turns
  type: SkillType;
  execute: SkillExecuteFunction;

  constructor(
    nameKey: string,
    descriptionKey: string,
    cooldown: number,
    type: SkillType,
    execute: SkillExecuteFunction
  ) {
    this.nameKey = nameKey;
    this.descriptionKey = descriptionKey;
    this.cooldown = cooldown;
    this.type = type;
    this.execute = execute;
  }

  /** Get localized skill name */
  get name(): string {
    return t(this.nameKey);
  }

  /** Get localized skill description */
  get description(): string {
    return t(this.descriptionKey);
  }
}

// ============================================================================
// WARRIOR SKILLS
// ============================================================================
const warriorSkills: Skill[] = [
  new Skill(
    'skills.heavySlash.name',
    'skills.heavySlash.description',
    2,
    'damage',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      const target = targets[0];
      const isCrit = Math.random() * 100 < caster.CRIT;
      const damage = Math.floor(caster.ATK * 1.5);
      const element: Element = 'physical';
      const finalDamage = target.takeDamage(damage, isCrit, element);

      return {
        attacker: caster,
        target: target,
        damage: finalDamage,
        isCrit: isCrit,
        element: element,
        skillName: t('skills.heavySlash.name'),
        type: 'skill_damage'
      };
    }
  ),
  new Skill(
    'skills.shieldBash.name',
    'skills.shieldBash.description',
    3,
    'damage',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      const target = targets[0];
      const damage = Math.floor(caster.ATK * 0.8);
      const element: Element = 'physical';
      const finalDamage = target.takeDamage(damage, false, element);

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
        element: element,
        skillName: t('skills.shieldBash.name'),
        type: 'skill_damage',
        effect: t('combat.stunned')
      };
    }
  ),
  new Skill(
    'skills.battleCry.name',
    'skills.battleCry.description',
    5,
    'buff',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      // Apply buff to all targets
      targets.forEach(target => {
        target.addStatusEffect({
          name: t('skills.battleCry.name'),
          duration: 3,
          type: 'buff',
          stat: 'ATK',
          value: 30
        });
      });

      return {
        attacker: caster,
        targets: targets,
        skillName: t('skills.battleCry.name'),
        type: 'skill_buff',
        effect: t('skills.battleCry.effect')
      };
    }
  )
];

// ============================================================================
// ARCHER SKILLS
// ============================================================================
const archerSkills: Skill[] = [
  new Skill(
    'skills.preciseShot.name',
    'skills.preciseShot.description',
    2,
    'damage',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      const target = targets[0];
      const damage = Math.floor(caster.ATK * 1.8);
      const element: Element = 'physical';
      const finalDamage = target.takeDamage(damage, true, element);

      return {
        attacker: caster,
        target: target,
        damage: finalDamage,
        isCrit: true,
        element: element,
        skillName: t('skills.preciseShot.name'),
        type: 'skill_damage'
      };
    }
  ),
  new Skill(
    'skills.multiShot.name',
    'skills.multiShot.description',
    4,
    'damage',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      const element: Element = 'physical';
      const results: Array<{ target: Combatant; damage: number; isCrit: boolean }> = [];
      targets.forEach(target => {
        if (target.isAlive) {
          const damage = Math.floor(caster.ATK * 0.8);
          const isCrit = Math.random() * 100 < caster.CRIT;
          const finalDamage = target.takeDamage(damage, isCrit, element);
          results.push({
            target: target,
            damage: finalDamage,
            isCrit: isCrit
          });
        }
      });

      return {
        attacker: caster,
        element: element,
        skillName: t('skills.multiShot.name'),
        type: 'skill_aoe',
        results: results
      };
    }
  ),
  new Skill(
    'skills.evasion.name',
    'skills.evasion.description',
    3,
    'buff',
    (caster: Combatant): CombatActionResult => {
      // Apply SPD buff to caster
      caster.addStatusEffect({
        name: t('skills.evasion.name'),
        duration: 2,
        type: 'buff',
        stat: 'SPD',
        value: 50
      });

      return {
        attacker: caster,
        skillName: t('skills.evasion.name'),
        type: 'skill_buff',
        effect: t('skills.evasion.effect')
      };
    }
  )
];

// ============================================================================
// MAGE SKILLS
// ============================================================================
const mageSkills: Skill[] = [
  new Skill(
    'skills.fireball.name',
    'skills.fireball.description',
    2,
    'damage',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      const target = targets[0];
      const isCrit = Math.random() * 100 < caster.CRIT;
      const damage = Math.floor(caster.ATK * 2.0);
      const element: Element = 'fire';
      const finalDamage = target.takeDamage(damage, isCrit, element);

      return {
        attacker: caster,
        target: target,
        damage: finalDamage,
        isCrit: isCrit,
        element: element,
        skillName: t('skills.fireball.name'),
        type: 'skill_damage'
      };
    }
  ),
  new Skill(
    'skills.chainLightning.name',
    'skills.chainLightning.description',
    4,
    'damage',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      const element: Element = 'lightning';
      const results: Array<{ target: Combatant; damage: number; isCrit: boolean }> = [];
      targets.forEach(target => {
        if (target.isAlive) {
          const damage = Math.floor(caster.ATK * 1.2);
          const isCrit = Math.random() * 100 < caster.CRIT;
          const finalDamage = target.takeDamage(damage, isCrit, element);
          results.push({
            target: target,
            damage: finalDamage,
            isCrit: isCrit
          });
        }
      });

      return {
        attacker: caster,
        element: element,
        skillName: t('skills.chainLightning.name'),
        type: 'skill_aoe',
        results: results
      };
    }
  ),
  new Skill(
    'skills.manaShield.name',
    'skills.manaShield.description',
    5,
    'buff',
    (caster: Combatant): CombatActionResult => {
      // Apply damage reduction buff
      caster.addStatusEffect({
        name: t('skills.manaShield.name'),
        duration: 3,
        type: 'buff',
        stat: 'damageReduction',
        value: 40
      });

      return {
        attacker: caster,
        skillName: t('skills.manaShield.name'),
        type: 'skill_buff',
        effect: t('skills.manaShield.effect')
      };
    }
  )
];

// ============================================================================
// CLERIC SKILLS
// ============================================================================
const clericSkills: Skill[] = [
  new Skill(
    'skills.heal.name',
    'skills.heal.description',
    2,
    'heal',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      const target = targets[0];
      const healAmount = target.heal(target.maxHP * 0.6); // 60% of target's max HP

      return {
        attacker: caster,
        target: target,
        healAmount: healAmount,
        skillName: t('skills.heal.name'),
        type: 'skill_heal'
      };
    }
  ),
  new Skill(
    'skills.groupHeal.name',
    'skills.groupHeal.description',
    4,
    'heal',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      const results: Array<{ target: Combatant; healAmount: number }> = [];
      targets.forEach(target => {
        if (target.isAlive) {
          const healAmount = target.heal(Math.floor(target.maxHP * 0.3)); // 30% of target's max HP
          results.push({
            target: target,
            healAmount: healAmount
          });
        }
      });

      return {
        attacker: caster,
        skillName: t('skills.groupHeal.name'),
        type: 'skill_group_heal',
        results: results
      };
    }
  ),
  new Skill(
    'skills.holySmite.name',
    'skills.holySmite.description',
    3,
    'damage',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      const target = targets[0];
      const damage = caster.ATK;
      const element: Element = 'holy';
      const finalDamage = target.takeDamage(damage, false, element);

      return {
        attacker: caster,
        target: target,
        damage: finalDamage,
        element: element,
        skillName: t('skills.holySmite.name'),
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
    'skills.smite.name',
    'skills.smite.description',
    2,
    'damage',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      const target = targets[0];
      const damage = Math.floor(caster.ATK * 1.3);
      const isCrit = Math.random() * 100 < caster.CRIT;
      const element: Element = 'holy';
      const finalDamage = target.takeDamage(damage, isCrit, element);
      const healAmount = caster.heal(Math.floor(finalDamage * 0.3));

      return {
        attacker: caster,
        target: target,
        damage: finalDamage,
        isCrit: isCrit,
        healAmount: healAmount,
        element: element,
        skillName: t('skills.smite.name'),
        type: 'skill_damage_heal'
      };
    }
  ),
  new Skill(
    'skills.divineShield.name',
    'skills.divineShield.description',
    5,
    'buff',
    (caster: Combatant): CombatActionResult => {
      // Apply immunity buff
      caster.addStatusEffect({
        name: t('skills.divineShield.name'),
        duration: 1,
        type: 'buff',
        immunity: true
      });

      return {
        attacker: caster,
        skillName: t('skills.divineShield.name'),
        type: 'skill_buff',
        effect: t('skills.divineShield.effect')
      };
    }
  ),
  new Skill(
    'skills.blessing.name',
    'skills.blessing.description',
    3,
    'buff',
    (caster: Combatant, targets: Combatant[]): CombatActionResult => {
      const target = targets[0];

      // Apply DEF buff to target
      target.addStatusEffect({
        name: t('skills.blessing.name'),
        duration: 3,
        type: 'buff',
        stat: 'DEF',
        value: 40
      });

      return {
        attacker: caster,
        target: target,
        skillName: t('skills.blessing.name'),
        type: 'skill_buff',
        effect: t('skills.blessing.effect')
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
