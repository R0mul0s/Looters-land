/**
 * Hero System - Playable character management
 *
 * Defines hero characters with classes, stats, skills, and equipment.
 * Heroes have 5 different classes with unique stat distributions and skills.
 *
 * Contains:
 * - Hero class - Playable character with stats and combat abilities
 * - 5 Hero classes (Warrior, Archer, Mage, Cleric, Paladin)
 * - Experience and leveling system with XP progression
 * - Level-based stat scaling with class-specific growth rates (+5% HP, +3% ATK/DEF, +2% SPD, +0.5% CRIT per level)
 * - Skill system with cooldown management
 * - Equipment integration with stat bonuses
 * - Combat state tracking (HP, status effects, cooldowns)
 * - Status effects system (buffs/debuffs with duration tracking)
 * - Stat modifiers from active effects
 * - Immunity and damage reduction mechanics
 * - Reset functionality for combat preparation
 * - Combat power calculation based on actual stats
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-20
 */

import type { HeroClass, HeroStats, BaseStats, HeroInfo, AttackResult, StatusEffect, HeroRarity } from '../../types/hero.types';
import type { Equipment } from '../equipment/Equipment';
import { getSkillsForClass, type Skill } from '../combat/Skill';
import type { CombatActionResult, Combatant, Element, ElementResistances } from '../../types/combat.types';
import { Position, POSITION_BONUSES, type PositionBonuses } from '../../types/combat.types';

export class Hero {
  id: string;
  name: string;
  class: HeroClass;
  rarity: HeroRarity;
  level: number;

  // Hero metadata (from template)
  role?: 'tank' | 'dps' | 'healer' | 'support';
  description?: string;
  specialAbility?: string;
  faction?: string;

  // Current stats (including equipment bonuses)
  maxHP: number;
  ATK: number;
  DEF: number;
  SPD: number;
  CRIT: number;
  ACC: number;  // Accuracy rating (determines hit chance)
  EVA: number;  // Evasion rating (determines dodge chance)

  // Base stats (without equipment)
  baseMaxHP: number;
  baseATK: number;
  baseDEF: number;
  baseSPD: number;
  baseCRIT: number;
  baseACC: number;
  baseEVA: number;

  // Combat state
  currentHP: number;
  isAlive: boolean;
  initiative: number;

  // Combat tracking
  cooldowns: Map<string, number>;
  ultimateCharge: number;
  statusEffects: StatusEffect[];

  // Elemental properties
  resistances: ElementResistances;  // Elemental resistance percentages
  weaknesses: Element[];            // Elements that deal extra damage
n  // Position system (Phase 3)
  position: Position;

  // Progression
  experience: number;
  requiredXP: number;
  talentPoints: number;

  // Convenience getters for UI
  get xp(): number {
    return this.experience;
  }

  get xpToNextLevel(): number {
    return this.requiredXP;
  }

  // Equipment reference
  equipment?: Equipment;

  constructor(name: string, heroClass: HeroClass, level: number = 1, rarity: HeroRarity = 'common') {
    // Generate UUID for database compatibility
    // Use crypto.randomUUID() which generates RFC 4122 compliant UUIDs
    this.id = crypto.randomUUID();
    this.name = name;
    this.class = heroClass;
    this.rarity = rarity;
    this.level = level;

    // Initialize progression
    this.experience = 0;
    this.requiredXP = this.calculateRequiredXP(level);
    this.talentPoints = 0;

    // Initialize base stats based on class
    const stats = this.initializeStats();
    this.maxHP = stats.maxHP;
    this.ATK = stats.ATK;
    this.DEF = stats.DEF;
    this.SPD = stats.SPD;
    this.CRIT = stats.CRIT;

    // Initialize Accuracy/Evasion based on SPD
    // ACC: Base 100 + (SPD * 0.5) - faster heroes are more accurate
    // EVA: Base 0 + (SPD * 0.3) - faster heroes are harder to hit
    this.ACC = 100 + Math.floor(this.SPD * 0.5);
    this.EVA = Math.floor(this.SPD * 0.3);

    // Store base stats
    this.baseMaxHP = this.maxHP;
    this.baseATK = this.ATK;
    this.baseDEF = this.DEF;
    this.baseSPD = this.SPD;
    this.baseCRIT = this.CRIT;
    this.baseACC = this.ACC;
    this.baseEVA = this.EVA;

    // Combat state
    this.currentHP = this.maxHP;
    this.isAlive = true;
    this.initiative = 0;

    // Combat tracking
    this.cooldowns = new Map();
    this.ultimateCharge = 0;
    this.statusEffects = [];

    // Initialize elemental resistances based on class
    this.resistances = this.initializeResistances();
    this.weaknesses = this.initializeWeaknesses();
// Initialize position based on class
    this.position = this.getDefaultPosition();
  }

  private initializeStats(): HeroStats {
    const classStats: Record<HeroClass, BaseStats> = {
      warrior: {
        maxHP: 150,
        ATK: 25,
        DEF: 30,
        SPD: 10,
        CRIT: 5,
        hpGrowth: 10,
        atkGrowth: 2,
        defGrowth: 2.5,
        spdGrowth: 0.5,
        critGrowth: 0.3
      },
      archer: {
        maxHP: 80,
        ATK: 35,
        DEF: 10,
        SPD: 25,
        CRIT: 15,
        hpGrowth: 5,
        atkGrowth: 3,
        defGrowth: 0.8,
        spdGrowth: 1.5,
        critGrowth: 0.8
      },
      mage: {
        maxHP: 70,
        ATK: 40,
        DEF: 8,
        SPD: 15,
        CRIT: 10,
        hpGrowth: 4,
        atkGrowth: 3.5,
        defGrowth: 0.5,
        spdGrowth: 1,
        critGrowth: 0.5
      },
      cleric: {
        maxHP: 100,
        ATK: 15,
        DEF: 20,
        SPD: 12,
        CRIT: 5,
        hpGrowth: 7,
        atkGrowth: 1.2,
        defGrowth: 1.5,
        spdGrowth: 0.8,
        critGrowth: 0.3
      },
      paladin: {
        maxHP: 120,
        ATK: 22,
        DEF: 25,
        SPD: 14,
        CRIT: 8,
        hpGrowth: 8,
        atkGrowth: 2,
        defGrowth: 2,
        spdGrowth: 1,
        critGrowth: 0.5
      }
    };

    const stats = classStats[this.class];

    return {
      maxHP: Math.floor(stats.maxHP + (stats.hpGrowth * (this.level - 1))),
      ATK: Math.floor(stats.ATK + (stats.atkGrowth * (this.level - 1))),
      DEF: Math.floor(stats.DEF + (stats.defGrowth * (this.level - 1))),
      SPD: Math.floor(stats.SPD + (stats.spdGrowth * (this.level - 1))),
      CRIT: stats.CRIT + (stats.critGrowth * (this.level - 1))
    };
  }

  /**
   * Initialize elemental resistances based on hero class
   * @returns Resistance percentages for each element
   */
  private initializeResistances(): ElementResistances {
    const baseResistances: ElementResistances = {
      physical: 0,
      fire: 0,
      ice: 0,
      lightning: 0,
      holy: 0,
      dark: 0
    };

    // Class-specific resistances
    switch (this.class) {
      case 'warrior':
        baseResistances.physical = 20;  // 20% physical resistance from heavy armor
        break;
      case 'archer':
        // Archers have no special resistances (rely on evasion)
        break;
      case 'mage':
        baseResistances.fire = 15;
        baseResistances.ice = 15;
        baseResistances.lightning = 15;
        break;
      case 'cleric':
        baseResistances.holy = 30;      // Strong holy resistance
        baseResistances.dark = -20;     // Weak to dark (negative = extra damage)
        break;
      case 'paladin':
        baseResistances.physical = 10;
        baseResistances.holy = 20;
        baseResistances.dark = -10;
        break;
    }

    return baseResistances;
  }

  /**
   * Initialize elemental weaknesses based on hero class
   * @returns Array of elements that deal bonus damage
   */
  private initializeWeaknesses(): Element[] {
    switch (this.class) {
      case 'warrior':
        return ['lightning'];  // Heavy armor conducts electricity
      case 'archer':
        return [];             // No specific weakness
      case 'mage':
        return ['physical'];   // Frail, weak to physical attacks
      case 'cleric':
        return ['dark'];       // Holy warriors weak to darkness
      case 'paladin':
        return ['dark'];       // Holy warriors weak to darkness
      default:
        return [];
    }
  }

  rollInitiative(): number {
    this.initiative = this.SPD + Math.floor(Math.random() * 11);
    return this.initiative;
  }

  takeDamage(rawDamage: number, isCrit: boolean = false, element: Element = 'physical'): number {
    if (!this.isAlive) return 0;

    // Check immunity first
    if (this.hasImmunity()) {
      console.log(`🛡️ ${this.name} is immune to damage!`);
      return 0;
    }

    const damageReduction = 100 / (100 + this.DEF);
    let finalDamage = Math.floor(rawDamage * damageReduction);

    if (isCrit) {
      finalDamage = Math.floor(rawDamage * 1.5 * (100 / (100 + this.DEF * 0.5)));
    }

    // Apply elemental resistance/weakness
    let elementalModifier = 1.0;
    if (element in this.resistances) {
      const resistance = this.resistances[element];
      elementalModifier = 1 - (resistance / 100);

      // Check for weakness (50% bonus damage)
      if (this.weaknesses.includes(element)) {
        elementalModifier *= 1.5;
        console.log(`💥 ${this.name} is WEAK to ${element}!`);
      } else if (resistance > 0) {
        console.log(`🛡️ ${this.name} resists ${element} damage (${resistance}%)`);
      } else if (resistance < 0) {
        console.log(`💢 ${this.name} is vulnerable to ${element}!`);
      }
    }
    finalDamage = Math.floor(finalDamage * elementalModifier);

    // Apply damage reduction from status effects (e.g., Mana Shield)
    const statusReduction = this.getDamageReduction();
    if (statusReduction > 0) {
      finalDamage = Math.floor(finalDamage * (1 - statusReduction / 100));
      console.log(`🛡️ ${this.name}'s damage reduced by ${statusReduction}%`);
    }

    // Minimum 1 damage
    finalDamage = Math.max(1, finalDamage);

    this.currentHP -= finalDamage;

    if (this.currentHP <= 0) {
      this.currentHP = 0;
      this.isAlive = false;
    }

    return finalDamage;
  }

  heal(amount: number): number {
    if (!this.isAlive) return 0;

    const oldHP = this.currentHP;
    this.currentHP = Math.min(this.currentHP + amount, this.maxHP);
    return this.currentHP - oldHP;
  }

  attack(target: Combatant, comboMultiplier: number = 1.0): AttackResult | null {
    if (!this.isAlive || !target.isAlive) return null;

    // Use combat stats with status effects applied
    const combatStats = this.getCombatStats();
    const targetStats = target.getCombatStats();

    // Roll for hit/miss using accuracy and evasion
    const hitRoll = Math.random() * 100;
    const hitChance = 100 + (combatStats.ACC - targetStats.EVA) / 10;
    const cappedHitChance = Math.max(5, Math.min(95, hitChance));
    const didHit = hitRoll < cappedHitChance;

    // If miss, return early with didMiss flag
    if (!didHit) {
      return {
        attacker: this,
        target: target,
        damage: 0,
        isCrit: false,
        didMiss: true,
        type: 'basic_attack'
      };
    }

    // Hit succeeded - proceed with normal damage calculation
    const isCrit = Math.random() * 100 < combatStats.CRIT;
    const damage = Math.floor(combatStats.ATK * comboMultiplier);
    const element: Element = 'physical'; // Basic attacks are physical damage
    const finalDamage = target.takeDamage(damage, isCrit, element);

    return {
      attacker: this,
      target: target,
      damage: finalDamage,
      isCrit: isCrit,
      didMiss: false,
      element: element,
      type: 'basic_attack'
    };
  }

  tickCooldowns(): void {
    for (const [skillName, cd] of this.cooldowns.entries()) {
      if (cd > 0) {
        this.cooldowns.set(skillName, cd - 1);
      }
    }
  }

  getSkills(): Skill[] {
    return getSkillsForClass(this.class);
  }

  useSkill(skillIndex: number, targets: Combatant[]): CombatActionResult | null {
    const skills = this.getSkills();
    if (skillIndex < 0 || skillIndex >= skills.length) return null;

    const skill = skills[skillIndex];
    const currentCD = this.cooldowns.get(skill.name) || 0;

    if (currentCD > 0) {
      return null; // Skill on cooldown
    }

    // Execute skill
    const result = skill.execute(this, targets);

    // Set cooldown
    this.cooldowns.set(skill.name, skill.cooldown);

    return result;
  }

  getInfo(): HeroInfo {
    return {
      id: this.id,
      name: this.name,
      class: this.class,
      level: this.level,
      hp: this.currentHP,
      maxHP: this.maxHP,
      ATK: this.ATK,
      DEF: this.DEF,
      SPD: this.SPD,
      CRIT: this.CRIT,
      isAlive: this.isAlive,
      hpPercent: (this.currentHP / this.maxHP) * 100
    };
  }

  updateStatsWithEquipment(): void {
    if (!this.equipment) return;

    const equipStats = this.equipment.getTotalEquipmentStats();

    this.maxHP = Math.floor(this.baseMaxHP + (equipStats.HP || 0));
    this.ATK = Math.floor(this.baseATK + (equipStats.ATK || 0));
    this.DEF = Math.floor(this.baseDEF + (equipStats.DEF || 0));
    this.SPD = Math.floor(this.baseSPD + (equipStats.SPD || 0));
    this.CRIT = Math.floor(this.baseCRIT + (equipStats.CRIT || 0));

    if (this.currentHP > this.maxHP) {
      this.currentHP = this.maxHP;
    }

    console.log(`📊 ${this.name} stats updated with equipment:`, {
      HP: `${this.baseMaxHP} + ${equipStats.HP || 0} = ${this.maxHP}`,
      ATK: `${this.baseATK} + ${equipStats.ATK || 0} = ${this.ATK}`,
      DEF: `${this.baseDEF} + ${equipStats.DEF || 0} = ${this.DEF}`,
      SPD: `${this.baseSPD} + ${equipStats.SPD || 0} = ${this.SPD}`,
      CRIT: `${this.baseCRIT} + ${equipStats.CRIT || 0} = ${this.CRIT}`
    });
  }

  // ============================================================================
  // STATUS EFFECTS SYSTEM
  // ============================================================================

  /**
   * Add a status effect to this hero
   */
  addStatusEffect(effect: StatusEffect): void {
    // Check if effect already exists
    const existing = this.statusEffects.find(e => e.name === effect.name);
    if (existing) {
      // Refresh duration
      existing.duration = effect.duration;
    } else {
      this.statusEffects.push(effect);
    }
    console.log(`⭐ ${this.name} gained ${effect.name} (${effect.duration} turns)`);
  }

  /**
   * Tick all status effects (reduce duration by 1)
   * Called at the end of each turn
   */
  tickStatusEffects(): void {
    this.statusEffects = this.statusEffects
      .map(effect => ({ ...effect, duration: effect.duration - 1 }))
      .filter(effect => {
        if (effect.duration <= 0) {
          console.log(`💨 ${effect.name} expired on ${this.name}`);
          return false;
        }
        return true;
      });
  }

  /**
   * Check if character is stunned (skips turn)
   */
  isStunned(): boolean {
    return this.statusEffects.some(e => e.stun === true);
  }

  /**
   * Check if character has immunity (no damage taken)
   */
  hasImmunity(): boolean {
    return this.statusEffects.some(e => e.immunity === true);
  }

  /**
   * Get effective stat value including status effect modifiers
   */
  getEffectiveStat(baseStat: number, statName: 'ATK' | 'DEF' | 'SPD' | 'CRIT' | 'ACC' | 'EVA'): number {
    let modifier = 0;

    for (const effect of this.statusEffects) {
      if (effect.stat === statName && effect.value) {
        modifier += effect.value;
      }
    }

    // Apply percentage modifier
    return Math.floor(baseStat * (1 + modifier / 100));
  }

  /**
   * Get damage reduction from status effects (e.g., Mana Shield)
   */
  getDamageReduction(): number {
    let reduction = 0;

    for (const effect of this.statusEffects) {
      if (effect.stat === 'damageReduction' && effect.value) {
        reduction += effect.value;
      }
    }

    return Math.min(reduction, 90); // Cap at 90% reduction
  }

  /**
  /**
   * Get default position based on hero class
   */
  private getDefaultPosition(): Position {
    switch (this.class) {
      case 'warrior':
      case 'paladin':
        return Position.FRONT;
      case 'archer':
        return Position.MIDDLE;
      case 'mage':
      case 'cleric':
        return Position.BACK;
      default:
        return Position.MIDDLE;
    }
  }

  /**
   * Set hero position
   */
  setPosition(position: Position): void {
    this.position = position;
  }

  /**
   * Get position bonuses
   */
  getPositionBonuses(): PositionBonuses {
    return POSITION_BONUSES[this.position];
  }

  /**
   * Get combat stats with status effects applied
   */
  getCombatStats() {
    return {
      ATK: this.getEffectiveStat(this.ATK, 'ATK'),
      DEF: this.getEffectiveStat(this.DEF, 'DEF'),
      SPD: this.getEffectiveStat(this.SPD, 'SPD'),
      CRIT: this.getEffectiveStat(this.CRIT, 'CRIT'),
      ACC: this.getEffectiveStat(this.ACC, 'ACC'),
      EVA: this.getEffectiveStat(this.EVA, 'EVA')
    };
  }

  /**
   * Calculate required XP for a given level
   * Formula: 100 * (level ^ 1.5)
   *
   * @param level - Target level
   * @returns Required XP to reach next level
   *
   * @example
   * ```typescript
   * const xp = hero.calculateRequiredXP(5); // 559 XP needed for level 6
   * ```
   */
  calculateRequiredXP(level: number): number {
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  /**
   * Award experience points and handle level ups
   *
   * @param amount - Amount of XP to award
   * @returns Array of level up messages (empty if no level up)
   *
   * @example
   * ```typescript
   * const messages = hero.gainXP(150);
   * // ["Theron leveled up! (Lv.1 → Lv.2)", "HP: 150 → 157 (+7)"]
   * ```
   */
  gainXP(amount: number): string[] {
    this.experience += amount;
    console.log(`⭐ ${this.name} gained ${amount} XP (${this.experience}/${this.requiredXP})`);

    const levelUpMessages: string[] = [];

    // Check for level ups (can level up multiple times from one XP gain)
    while (this.experience >= this.requiredXP) {
      this.experience -= this.requiredXP;
      this.level++;

      // Store old stats for comparison
      const oldMaxHP = this.maxHP;
      const oldATK = this.ATK;
      const oldDEF = this.DEF;
      const oldSPD = this.SPD;
      const oldCRIT = this.CRIT;

      // Apply stat growth
      this.applyLevelUpGrowth();

      // Calculate new required XP
      this.requiredXP = this.calculateRequiredXP(this.level);

      // Heal to full on level up
      this.currentHP = this.maxHP;

      // Generate level up messages
      levelUpMessages.push(`🎉 ${this.name} leveled up! (Lv.${this.level - 1} → Lv.${this.level})`);
      levelUpMessages.push(`  HP: ${oldMaxHP} → ${this.maxHP} (+${this.maxHP - oldMaxHP})`);
      levelUpMessages.push(`  ATK: ${oldATK} → ${this.ATK} (+${this.ATK - oldATK})`);
      levelUpMessages.push(`  DEF: ${oldDEF} → ${this.DEF} (+${this.DEF - oldDEF})`);
      levelUpMessages.push(`  SPD: ${oldSPD} → ${this.SPD} (+${this.SPD - oldSPD})`);
      levelUpMessages.push(`  CRIT: ${oldCRIT.toFixed(1)}% → ${this.CRIT.toFixed(1)}% (+${(this.CRIT - oldCRIT).toFixed(1)}%)`);

      console.log(`🎉 ${this.name} reached level ${this.level}!`);
    }

    return levelUpMessages;
  }

  /**
   * Apply stat growth on level up
   * Growth rates:
   * - HP: +5% base MaxHP
   * - ATK: +3% base ATK
   * - DEF: +3% base DEF
   * - SPD: +2% base SPD
   * - CRIT: +0.5% per level
   */
  private applyLevelUpGrowth(): void {
    // Get class-specific growth rates
    const growthRates: Record<HeroClass, BaseStats> = {
      warrior: {
        maxHP: 150,
        ATK: 25,
        DEF: 30,
        SPD: 10,
        CRIT: 5,
        hpGrowth: 0.05,
        atkGrowth: 0.03,
        defGrowth: 0.03,
        spdGrowth: 0.02,
        critGrowth: 0.5
      },
      archer: {
        maxHP: 120,
        ATK: 30,
        DEF: 15,
        SPD: 25,
        CRIT: 15,
        hpGrowth: 0.05,
        atkGrowth: 0.03,
        defGrowth: 0.03,
        spdGrowth: 0.02,
        critGrowth: 0.5
      },
      mage: {
        maxHP: 100,
        ATK: 35,
        DEF: 10,
        SPD: 15,
        CRIT: 10,
        hpGrowth: 0.05,
        atkGrowth: 0.03,
        defGrowth: 0.03,
        spdGrowth: 0.02,
        critGrowth: 0.5
      },
      cleric: {
        maxHP: 110,
        ATK: 20,
        DEF: 20,
        SPD: 18,
        CRIT: 8,
        hpGrowth: 0.05,
        atkGrowth: 0.03,
        defGrowth: 0.03,
        spdGrowth: 0.02,
        critGrowth: 0.5
      },
      paladin: {
        maxHP: 140,
        ATK: 22,
        DEF: 35,
        SPD: 12,
        CRIT: 7,
        hpGrowth: 0.05,
        atkGrowth: 0.03,
        defGrowth: 0.03,
        spdGrowth: 0.02,
        critGrowth: 0.5
      }
    };

    const growth = growthRates[this.class];

    // Apply growth to base stats (using Math.ceil to ensure minimum +1 growth)
    this.baseMaxHP = Math.ceil(this.baseMaxHP * (1 + growth.hpGrowth));
    this.baseATK = Math.ceil(this.baseATK * (1 + growth.atkGrowth));
    this.baseDEF = Math.ceil(this.baseDEF * (1 + growth.defGrowth));
    this.baseSPD = Math.ceil(this.baseSPD * (1 + growth.spdGrowth));
    this.baseCRIT = parseFloat((this.baseCRIT + growth.critGrowth).toFixed(1));

    // Recalculate current stats with equipment bonuses
    if (this.equipment) {
      this.equipment.recalculateStats();
    } else {
      // If no equipment, just copy base stats
      this.maxHP = this.baseMaxHP;
      this.ATK = this.baseATK;
      this.DEF = this.baseDEF;
      this.SPD = this.baseSPD;
      this.CRIT = this.baseCRIT;
    }
  }

  /**
   * Calculate hero score (combat power)
   *
   * New formula based on actual combat stats:
   * Base = (HP × 0.5) + (ATK × 5) + (DEF × 3) + (SPD × 2) + (CRIT × 10)
   * Final = Base × Rarity Multiplier
   *
   * Rarity Multipliers:
   * - Common: 1.0×
   * - Rare: 1.2×
   * - Epic: 1.4×
   * - Legendary: 1.6×
   *
   * This formula reflects actual combat effectiveness by weighing stats
   * according to their impact on survivability and damage output.
   *
   * @returns Hero combat power
   *
   * @example
   * ```typescript
   * const score = hero.getScore();
   * console.log(score); // 1370 (Common Warrior Lv30 with equipment)
   * ```
   */
  getScore(): number {
    // Calculate base score from stats (with equipment bonuses already included)
    const baseScore =
      (this.maxHP * 0.5) +       // Survivability base
      (this.ATK * 5) +            // Primary damage
      (this.DEF * 3) +            // Damage reduction value
      (this.SPD * 2) +            // Turn advantage
      (this.CRIT * 10);           // Crit multiplier value

    // Apply rarity multiplier
    const rarityMultipliers: Record<HeroRarity, number> = {
      common: 1.0,
      rare: 1.2,
      epic: 1.4,
      legendary: 1.6
    };

    const rarityMultiplier = rarityMultipliers[this.rarity] || rarityMultipliers.common;
    const finalScore = baseScore * rarityMultiplier;

    return Math.floor(finalScore);
  }

  /**
   * Reset combat state (cooldowns, status effects) without healing
   * Use this between combats to prepare for next fight while keeping current HP
   */
  resetCombatState(): void {
    this.cooldowns.clear();
    this.ultimateCharge = 0;
    this.statusEffects = [];
  }

  /**
   * Full reset including HP restoration
   * Use this only when hero should be fully healed (e.g., after defeat/revival, town healing)
   */
  reset(): void {
    this.currentHP = this.maxHP;
    this.isAlive = true;
    this.resetCombatState();
  }
}
