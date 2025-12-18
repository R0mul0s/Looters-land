/**
 * Combat Engine - Core turn-based combat system
 *
 * Manages combat flow, turn order, initiative, victory conditions,
 * and coordination between heroes and enemies. Supports both
 * automatic and manual combat modes with player input handling.
 *
 * Contains:
 * - CombatEngine class - Main combat controller
 * - Turn order calculation based on initiative rolls
 * - Combat action execution and processing
 * - Status effects tick system (duration reduction per turn)
 * - Stun checking and turn skipping
 * - Combat log with detailed action reporting
 * - Victory/defeat condition checking
 * - XP reward system with shrine buff support (baseXP * avgEnemyLevel * numEnemies * xpMultiplier)
 * - Level up processing and stat growth
 * - Manual mode with player input waiting
 * - Auto-combat with AI for heroes and enemies
 * - Shrine buff multipliers for XP and gold rewards
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-20
 */

import type {
  Combatant,
  CombatActionResult,
  CombatLogEntry,
  CombatState
} from '../../types/combat.types';
import type { LootReward } from '../../types/loot.types';
import { LootGenerator } from '../loot/LootGenerator';
import { Enemy } from './Enemy';
import { t } from '../../localization/i18n';

export class CombatEngine {
  heroes: Combatant[];
  enemies: Combatant[];
  combatLog: CombatLogEntry[];
  turnCounter: number;
  isActive: boolean;
  combatResult: 'victory' | 'defeat' | null;
  lootReward: LootReward | null;

  // Loot generator
  lootGenerator: LootGenerator;

  // Manual combat mode
  isManualMode: boolean;
  waitingForPlayerInput: boolean;
  currentCharacter: Combatant | null;
  turnOrder: Combatant[];

  // Dungeon buffs
  xpMultiplier: number; // Multiplier for XP rewards (default 1.0, +15% = 1.15)
  goldMultiplier: number; // Multiplier for gold rewards (handled in App.tsx)

  // Callbacks for UI updates
  onTurnStart: ((character: Combatant) => void) | null;
  onAction: ((action: CombatActionResult) => void) | null;
  onCombatEnd: ((result: 'victory' | 'defeat') => void) | null;
  onUpdate: (() => void) | null;
  onWaitForInput: ((character: Combatant) => void) | null;

  // Animation callbacks
  onDamageDealt: ((targetId: string, damage: number, isCritical: boolean) => void) | null;
  onHealApplied: ((targetId: string, amount: number) => void) | null;
  onSkillUsed: ((casterId: string, skillName: string) => void) | null;
  onAttackAnimation: ((attackerId: string) => void) | null;
// Combo system (Phase 3)
  comboCounter: number;
  lastAttacker: Combatant | null;
  comboTarget: Combatant | null;
  maxComboReached: number;

  constructor() {
    this.heroes = [];
    this.enemies = [];
    this.combatLog = [];
    this.turnCounter = 0;
    this.isActive = false;
    this.combatResult = null;
    this.lootReward = null;

    // Initialize loot generator
    this.lootGenerator = new LootGenerator();

    // Manual mode
    this.isManualMode = false;
    this.waitingForPlayerInput = false;
    this.currentCharacter = null;
    this.turnOrder = [];

    // Buffs
    this.xpMultiplier = 1.0;
    this.goldMultiplier = 1.0;

    // Callbacks
    this.onTurnStart = null;
    this.onAction = null;
    this.onCombatEnd = null;
    this.onUpdate = null;
    this.onWaitForInput = null;

    // Animation callbacks
    this.onDamageDealt = null;
    this.onHealApplied = null;
    this.onSkillUsed = null;
    this.onAttackAnimation = null;
// Combo system
    this.comboCounter = 0;
    this.lastAttacker = null;
    this.comboTarget = null;
    this.maxComboReached = 0;
  }

  /**
   * Initialize combat with heroes and enemies
   */
  initialize(heroes: Combatant[], enemies: Combatant[]): void {
    this.heroes = heroes;
    this.enemies = enemies;
    this.combatLog = [];
    this.turnCounter = 0;
    this.isActive = true;
    this.combatResult = null;
    this.lootReward = null;

    // Reset combat state without healing (HP persists between fights)
    this.heroes.forEach(h => h.resetCombatState());
    // Enemies are freshly spawned, so they start at full HP
    this.enemies.forEach(e => e.reset());

    this.log('Combat initialized!');
    this.log(`Heroes: ${this.heroes.map(h => h.name).join(', ')}`);
    this.log(
      `Enemies: ${this.enemies.map((e) => `${e.name} (Lv.${e.level})`).join(', ')}`
    );
  }

  /**
   * Main combat loop - execute one turn
   */
  executeTurn(): void {
    if (!this.isActive) return;
    if (this.waitingForPlayerInput) return; // Don't proceed if waiting for input

    // Start new turn if no turn order exists
    if (this.turnOrder.length === 0) {
      this.turnCounter++;
      this.log(`\n=== TURN ${this.turnCounter} ===`, 'turn');

      // Reduce cooldowns and tick status effects for all characters
      [...this.heroes, ...this.enemies].forEach(char => {
        if (char.isAlive) {
          char.tickCooldowns();
          char.tickStatusEffects();
        }
      });

      // Calculate initiative for all alive characters
      this.turnOrder = this.calculateTurnOrder();
    }

    // Process characters one by one
    while (this.turnOrder.length > 0 && this.isActive) {
      const character = this.turnOrder[0];

      if (!character.isAlive) {
        this.turnOrder.shift(); // Skip dead characters
        continue;
      }

      // Check if character is stunned
      if (character.isStunned()) {
        this.log(`${character.name} is stunned and skips their turn!`, 'debuff');
        this.turnOrder.shift();
        continue;
      }

      // If manual mode and this is a hero (not an enemy), wait for player input
      if (this.isManualMode && !(character instanceof Enemy)) {
        this.waitingForPlayerInput = true;
        this.currentCharacter = character;

        // Notify UI that we're waiting for input
        if (this.onWaitForInput) {
          this.onWaitForInput(character);
        }

        // Trigger update callback
        if (this.onUpdate) {
          this.onUpdate();
        }

        return; // Pause here, wait for executeManualAction
      }

      // Execute action (auto for enemies, or in auto mode)
      this.executeCharacterAction(character);

      // Remove character from turn order
      this.turnOrder.shift();

      // Check victory conditions after each action
      if (this.checkVictoryConditions()) {
        this.turnOrder = []; // Clear turn order
        break;
      }
    }

    // Trigger update callback
    if (this.onUpdate) {
      this.onUpdate();
    }
  }

  /**
   * Calculate turn order based on initiative
   */
  private calculateTurnOrder(): Combatant[] {
    const allCharacters = [...this.heroes, ...this.enemies].filter(char => char.isAlive);

    // Roll initiative for each character
    allCharacters.forEach(char => char.rollInitiative());

    // Sort by initiative (highest first)
    allCharacters.sort((a, b) => b.initiative - a.initiative);

    return allCharacters;
  }

  /**
   * Execute action for a single character
   */
  private executeCharacterAction(character: Combatant): void {
    // Trigger turn start callback
    if (this.onTurnStart) {
      this.onTurnStart(character);
    }

    let action: CombatActionResult | null;

    if ('isEnemy' in character && character.isEnemy) {
      // Enemy AI chooses action
      action = (character as Combatant & { chooseAction: (heroes: Combatant[], enemies: Combatant[]) => CombatActionResult }).chooseAction(this.heroes, this.enemies);
    } else {
      // Hero AI (simplified - will be enhanced with player control)
      action = this.heroAI(character);
    }

    if (action) {
      this.processAction(action);

      // Trigger action callback
      if (this.onAction) {
        this.onAction(action);
      }
    }
  }

  /**
   * Simple AI for heroes in auto-combat
   */
  private heroAI(hero: Combatant): CombatActionResult | null {
    const aliveEnemies = this.enemies.filter(e => e.isAlive);
    if (aliveEnemies.length === 0) return null;

    // Get skills if hero has them
    const skills = 'getSkills' in hero ? (hero as Combatant & { getSkills: () => Array<{ name: string; type: string }> }).getSkills() : [];

    // Check if any skill is off cooldown
    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i];
      const currentCD = 'cooldowns' in hero ? (hero as Combatant & { cooldowns: Map<string, number> }).cooldowns.get(skill.name) || 0 : 0;

      if (currentCD === 0) {
        // Use skill based on type
        if (skill.type === 'heal' && 'class' in hero && (hero as Combatant & { class: string }).class === 'cleric') {
          // Heal lowest HP ally
          const aliveHeroes = this.heroes.filter(h => h.isAlive);
          const lowestHPHero = aliveHeroes.reduce((lowest, h) =>
            h.currentHP < lowest.currentHP ? h : lowest
          );

          if (lowestHPHero.currentHP < lowestHPHero.maxHP * 0.6) {
            return (hero as Combatant & { useSkill: (index: number, targets: Combatant[]) => CombatActionResult | null }).useSkill(i, [lowestHPHero])!;
          }
        } else if (skill.type === 'damage') {
          // Attack random enemy
          const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
          return (hero as Combatant & { useSkill: (index: number, targets: Combatant[]) => CombatActionResult | null }).useSkill(i, [target])!;
        } else if (skill.type === 'buff') {
          // Use buff
          return (hero as Combatant & { useSkill: (index: number, targets: Combatant[]) => CombatActionResult | null }).useSkill(i, this.heroes.filter(h => h.isAlive))!;
        }
      }
    }

    // Default: basic attack on random enemy
    const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    const result = (hero as Combatant & { attack: (target: Combatant) => { attacker: Combatant; target: Combatant; damage: number; isCrit?: boolean; type: string } }).attack(target, this.getComboMultiplier());
    return {
      ...result,
      type: 'basic_attack'
    } as CombatActionResult;
  }

  /**
   * Process combat action and log results
   */
  private processAction(action: CombatActionResult): void {
    if (!action) return;

    const attacker = action.attacker;

    switch (action.type) {
      case 'basic_attack': {
        // Check for miss first
        if (action.didMiss) {
          this.log(
            t('combat.miss', { attacker: attacker.name, target: action.target?.name }),
            'attack'
          );
          // Still trigger attack animation even on miss
          if (this.onAttackAnimation) {
            this.onAttackAnimation(attacker.id);
          }
          break;
        }

        // Hit succeeded - log damage
        const critText = action.isCrit ? ` [${t('combat.critical')}]` : '';
        this.log(
          t('combat.attacks', { attacker: attacker.name, target: action.target?.name, damage: action.damage }) + critText,
          'attack'
        );

        // Trigger animations
        if (this.onAttackAnimation) {
          this.onAttackAnimation(attacker.id);
        }
        if (this.onDamageDealt && action.target && action.damage > 0) {
          this.onDamageDealt(action.target.id, action.damage, action.isCrit || false);
        }

        // Update combo tracking
        if (action.target) {
          this.updateCombo(attacker, action.target, true);
        }

        if (action.target && !action.target.isAlive) {
          this.log(t('combat.defeated', { name: action.target.name }), 'death');
        }
        break;
      }

      case 'skill_damage': {
        const skillCritText = action.isCrit ? ` [${t('combat.critical')}]` : '';
        this.log(
          t('combat.usesSkillDamage', { attacker: attacker.name, skill: action.skillName, target: action.target?.name, damage: action.damage }) + skillCritText,
          'skill'
        );

        // Trigger animations
        if (this.onSkillUsed && action.skillName) {
          this.onSkillUsed(attacker.id, action.skillName);
        }
        if (this.onDamageDealt && action.target && action.damage > 0) {
          this.onDamageDealt(action.target.id, action.damage, action.isCrit || false);
        }

        if (action.effect) {
          this.log(`  → ${action.effect}`, 'skill');
        }
        // Update combo tracking
        if (action.target) {
          this.updateCombo(attacker, action.target, true);
        }

        if (action.target && !action.target.isAlive) {
          this.log(t('combat.defeated', { name: action.target.name }), 'death');
        }
        break;
      }

      case 'skill_damage_heal':
        this.log(
          t('combat.usesSkillDamageHeal', { attacker: attacker.name, skill: action.skillName, target: action.target?.name, damage: action.damage, heal: action.healAmount }),
          'skill'
        );

        // Trigger animations
        if (this.onSkillUsed && action.skillName) {
          this.onSkillUsed(attacker.id, action.skillName);
        }
        if (this.onDamageDealt && action.target && action.damage > 0) {
          this.onDamageDealt(action.target.id, action.damage, false);
        }
        if (this.onHealApplied && action.healAmount && action.healAmount > 0) {
          this.onHealApplied(attacker.id, action.healAmount);
        }

        // Update combo tracking
        if (action.target) {
          this.updateCombo(attacker, action.target, true);
        }

        if (action.target && !action.target.isAlive) {
          this.log(t('combat.defeated', { name: action.target.name }), 'death');
        }
        break;

      case 'skill_aoe':
        this.log(t('combat.usesSkillAoE', { attacker: attacker.name, skill: action.skillName }), 'skill');

        // Trigger skill animation
        if (this.onSkillUsed && action.skillName) {
          this.onSkillUsed(attacker.id, action.skillName);
        }

        action.results?.forEach(result => {
          const aoeCritText = result.isCrit ? ` [${t('combat.critical')}]` : '';
          this.log(`  → ${t('combat.takeDamage', { target: result.target.name, damage: result.damage })}${aoeCritText}`, 'skill');

          // Trigger damage animation for each target
          if (this.onDamageDealt && result.damage > 0) {
            this.onDamageDealt(result.target.id, result.damage, result.isCrit || false);
          }

          if (!result.target.isAlive) {
            this.log(`  → ${t('combat.defeated', { name: result.target.name })}`, 'death');
          }
        });
        break;

      case 'skill_heal':
        this.log(
          t('combat.usesSkillHeal', { attacker: attacker.name, skill: action.skillName, target: action.target?.name, heal: action.healAmount }),
          'heal'
        );

        // Trigger animations
        if (this.onSkillUsed && action.skillName) {
          this.onSkillUsed(attacker.id, action.skillName);
        }
        if (this.onHealApplied && action.target && action.healAmount && action.healAmount > 0) {
          this.onHealApplied(action.target.id, action.healAmount);
        }
        break;

      case 'skill_group_heal':
        this.log(t('combat.usesSkillGroupHeal', { attacker: attacker.name, skill: action.skillName }), 'heal');

        // Trigger skill animation
        if (this.onSkillUsed && action.skillName) {
          this.onSkillUsed(attacker.id, action.skillName);
        }

        action.results?.forEach(result => {
          if (result.healAmount && result.healAmount > 0) {
            this.log(`  → ${t('combat.healsFor', { target: result.target.name, amount: result.healAmount })}`, 'heal');

            // Trigger heal animation for each target
            if (this.onHealApplied) {
              this.onHealApplied(result.target.id, result.healAmount);
            }
          }
        });
        break;

      case 'skill_buff':
        this.log(t('combat.usesSkillBuff', { attacker: attacker.name, skill: action.skillName, effect: action.effect }), 'skill');

        // Trigger skill animation
        if (this.onSkillUsed && action.skillName) {
          this.onSkillUsed(attacker.id, action.skillName);
        }
        break;
    }
  }

  /**
   * Check if combat has ended
   */
  private checkVictoryConditions(): boolean {
    const aliveHeroes = this.heroes.filter(h => h.isAlive).length;
    const aliveEnemies = this.enemies.filter(e => e.isAlive).length;

    if (aliveEnemies === 0) {
      this.endCombat('victory');
      return true;
    }

    if (aliveHeroes === 0) {
      this.endCombat('defeat');
      return true;
    }

    return false;
  }

  /**
   * End combat and award XP on victory
   */
  private endCombat(result: 'victory' | 'defeat'): void {
    this.isActive = false;
    this.combatResult = result;

    if (result === 'victory') {
      this.log('\n🎉 VICTORY! Heroes win! 🎉', 'victory');

      // Award XP to all alive heroes
      this.awardVictoryXP();
    } else {
      this.log('\n💀 DEFEAT! Heroes have fallen... 💀', 'defeat');
    }

    if (this.onCombatEnd) {
      this.onCombatEnd(result);
    }
  }

  /**
   * Award XP and loot to heroes after victory
   * Formula: baseXP (50) * average enemy level * number of enemies
   */
  private awardVictoryXP(): void {
    // Calculate total XP from enemies
    const totalEnemyLevel = this.enemies.reduce((sum, enemy) => sum + enemy.level, 0);
    const avgEnemyLevel = totalEnemyLevel / this.enemies.length;
    const numEnemies = this.enemies.length;

    // Base XP: 50 per enemy, scaled by level
    const baseXP = 50;
    const totalXP = Math.floor(baseXP * avgEnemyLevel * numEnemies);

    // Generate loot from defeated enemies
    this.lootReward = this.lootGenerator.generateLoot(this.enemies as Enemy[]);

    this.log(`\n💰 Rewards:`, 'info');
    this.log(`Experience: ${totalXP} XP`, 'info');
    this.log(`Gold: ${this.lootReward.gold}`, 'info');
    if (this.lootReward.items.length > 0) {
      this.log(`Items: ${this.lootReward.items.length} item(s) dropped`, 'info');
      this.lootReward.items.forEach(item => {
        this.log(`  → ${item.name} (${item.rarity}, Lv.${item.level})`, 'info');
      });
    } else {
      this.log(`Items: No items dropped`, 'info');
    }

    // Award XP to all alive heroes (apply XP multiplier from shrine buff)
    const finalXP = Math.floor(totalXP * this.xpMultiplier);
    const aliveHeroes = this.heroes.filter(h => h.isAlive);

    aliveHeroes.forEach(hero => {
      // Type guard: only Hero has gainXP method
      if ('gainXP' in hero && typeof hero.gainXP === 'function') {
        const levelUpMessages = hero.gainXP(finalXP);

        // Log level ups if any occurred
        if (levelUpMessages.length > 0) {
          levelUpMessages.forEach(msg => this.log(msg, 'level_up'));
        }
      }
    });
  }

  /**
   * Add entry to combat log
   */
  private log(
    message: string,
    type: CombatLogEntry['type'] = 'info'
  ): void {
    this.combatLog.push({
      message,
      type,
      turn: this.turnCounter
    });
  }

  /**
   * Get combat state
   */
  getState(): CombatState {
    return {
      heroes: this.heroes,
      enemies: this.enemies,
      turnCounter: this.turnCounter,
      isActive: this.isActive,
      combatResult: this.combatResult,
      combatLog: this.combatLog,
      lootReward: this.lootReward || undefined
    };
  }

  /**
   * Auto-combat - run full combat automatically
   */
  async runAutoCombat(turnDelay: number = 1000): Promise<void> {
    while (this.isActive && !this.waitingForPlayerInput) {
      this.executeTurn();

      // Wait between turns
      if (this.isActive && !this.waitingForPlayerInput) {
        await new Promise(resolve => setTimeout(resolve, turnDelay));
      }
    }
  }

  /**
   * Set manual combat mode
   */
  setManualMode(manual: boolean): void {
    this.isManualMode = manual;
  }

  /**
   * Execute manual action chosen by player
   */
  executeManualAction(action: CombatActionResult): void {
    if (!this.waitingForPlayerInput || !this.currentCharacter) return;

    // Process the action
    this.processAction(action);

    // Remove current character from turn order
    this.turnOrder.shift();

    // Clear waiting state
    this.waitingForPlayerInput = false;
    this.currentCharacter = null;

    // Check victory conditions
    if (this.checkVictoryConditions()) {
      this.turnOrder = [];
      return;
    }

    // Trigger update
    if (this.onUpdate) {
      this.onUpdate();
    }

    // Continue to next character
    this.executeTurn();
  }

  // ============================================================================
  // COMBO SYSTEM (Phase 3)
  // ============================================================================

  /**
   * Get combo damage multiplier
   * +10% per combo hit, max 5 combo (50% bonus)
   */
  getComboMultiplier(): number {
    const comboBonus = Math.min(this.comboCounter, 5) * 0.1;
    return 1.0 + comboBonus;
  }

  /**
   * Update combo counter after an attack
   * Same attacker must hit same target consecutively
   */
  updateCombo(attacker: Combatant, target: Combatant, didHit: boolean): void {
    if (!didHit) {
      this.resetCombo();
      return;
    }
    // Check if same attacker and same target
    if (this.lastAttacker?.id === attacker.id && this.comboTarget?.id === target.id) {
      this.comboCounter++;
      if (this.comboCounter > this.maxComboReached) {
        this.maxComboReached = this.comboCounter;
      }
      if (this.comboCounter >= 3) {
        this.log(t('combat.combo', { count: this.comboCounter }), 'skill');
      }
    } else {
      // Different attacker or target - start new combo
      this.comboCounter = 1;
      this.lastAttacker = attacker;
      this.comboTarget = target;
    }
  }

  /**
   * Reset combo (on miss or target death)
   */
  resetCombo(): void {
    this.comboCounter = 0;
    this.lastAttacker = null;
    this.comboTarget = null;
  }
}
