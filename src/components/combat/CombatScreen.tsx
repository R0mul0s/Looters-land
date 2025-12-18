/**
 * Combat Screen Component
 *
 * Main combat UI extracted from Router.tsx for better separation of concerns.
 * Handles rendering of combat interface including heroes, enemies, controls, and log.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-21
 */

import React from 'react';
import type { Hero } from '../../engine/hero/Hero';
import type { Item } from '../../engine/item/Item';
import { Enemy } from '../../engine/combat/Enemy';
import type { CombatEngine } from '../../engine/combat/CombatEngine';
import type { Combatant, CombatLogEntry, CombatActionResult } from '../../types/combat.types';
import type { CombatSpeed } from './CombatSpeedControl';
import type { LootReward } from '../../types/loot.types';
import { CombatSpeedControl } from './CombatSpeedControl';
import { CombatModeToggle, type CombatMode } from './CombatModeToggle';
import { DamageNumberContainer } from './DamageNumber';
import { CombatLog } from './CombatLog';
import { ComboCounter } from './ComboCounter';
import { FormationDisplay } from './FormationDisplay';
import { CombatActionTooltip } from './CombatActionTooltip';
import { calculateTurnGauge } from '../../utils/combatUtils';
import { t } from '../../localization/i18n';
import heroPortrait from '../../assets/images/portrait/king_arthur1.png';
import './CombatScreen.css';

/**
 * Damage number display data
 */
interface DamageNumberData {
  id: string;
  characterId: string;
  value: number;
  type: 'damage' | 'heal' | 'critical' | 'miss';
}

/**
 * Combat Screen Props
 */
interface CombatScreenProps {
  // Combat engine and state
  combatEngine: CombatEngine;
  heroes: Hero[];
  enemies: Enemy[];
  combatLog: CombatLogEntry[];
  comboCount: number;

  // UI state
  waitingForInput: boolean;
  activeCharacter: Combatant | null;
  tooltipTarget: Combatant | null;
  tooltipCardElement: HTMLElement | null;
  damageNumbers: DamageNumberData[];
  characterAnimations: Record<string, string>;
  activeSkills: Record<string, string>;
  combatSpeed: CombatSpeed;

  // Dungeon specific
  isDungeon: boolean;
  showDungeonVictory: boolean;
  lootReward: LootReward | null;
  isManualMode: boolean;

  // Callbacks
  onSetTooltipTarget: (target: Combatant | null) => void;
  onSetTooltipCardElement: (element: HTMLElement | null) => void;
  onSetDamageNumbers: React.Dispatch<React.SetStateAction<DamageNumberData[]>>;
  onSetCombatSpeed: (speed: CombatSpeed) => void;
  onCombatModeChange: (mode: CombatMode) => void;
  onManualAction: (action: CombatActionResult) => void;
  onContinueManualCombat: () => void;
  onDefeatExit: () => void;
  onVictoryContinue: () => void;
  onCollectLoot: (items: Item[]) => Promise<void>;
  onSellLoot: (items: Item[], gold: number) => Promise<void>;
  forceUpdate: () => void;

  // Game actions for loot
  gameActions?: {
    addItem: (item: Item) => Promise<void>;
    addGold: (amount: number) => Promise<void>;
  };
}

/**
 * Combat Screen Component
 *
 * Renders the complete combat UI including:
 * - Victory/Defeat screens
 * - Hero and enemy cards
 * - Combat controls (speed, mode toggle)
 * - Formation display
 * - Combo counter
 * - Combat log
 */
export const CombatScreen: React.FC<CombatScreenProps> = ({
  combatEngine,
  heroes,
  enemies,
  combatLog,
  comboCount,
  waitingForInput,
  activeCharacter,
  tooltipTarget,
  tooltipCardElement,
  damageNumbers,
  characterAnimations,
  activeSkills,
  combatSpeed,
  showDungeonVictory,
  lootReward,
  onSetTooltipTarget,
  onSetTooltipCardElement,
  onSetDamageNumbers,
  onSetCombatSpeed,
  onCombatModeChange,
  onManualAction,
  onContinueManualCombat,
  onDefeatExit,
  onVictoryContinue,
  onCollectLoot,
  onSellLoot
}) => {
  /**
   * Render hero character card
   */
  const renderHeroCard = (hero: Hero) => {
    const currentTurnChar = combatEngine.turnOrder[0] || activeCharacter;
    const isActive = currentTurnChar?.id === hero.id;
    const hpPercentage = hero.currentHP / hero.maxHP;
    const hpClass = hpPercentage < 0.3 ? 'low' : hpPercentage < 0.6 ? 'medium' : 'high';
    const animation = characterAnimations[hero.id] || '';
    const activeSkill = activeSkills[hero.id];
    const heroDamages = damageNumbers.filter(d => d.characterId === hero.id);
    const isClickable = waitingForInput && combatEngine.isManualMode && hero.isAlive && activeCharacter;

    return (
      <div
        key={hero.id}
        className={`character-card hero ${!hero.isAlive ? 'dead' : ''} ${isActive ? 'active' : ''} ${animation} ${isClickable ? 'clickable' : ''}`}
        style={{ position: 'relative' }}
        onClick={(e) => {
          if (isClickable) {
            onSetTooltipTarget(hero);
            onSetTooltipCardElement(e.currentTarget as HTMLElement);
          }
        }}
      >
        {/* Skill Indicator */}
        {activeSkill && (
          <div className="skill-indicator">
            🔮 {activeSkill}
          </div>
        )}

        {/* Damage Numbers */}
        {heroDamages.map(dmg => (
          <DamageNumberContainer
            key={dmg.id}
            damages={[dmg]}
            onRemove={(id) => onSetDamageNumbers(prev => prev.filter(d => d.id !== id))}
          />
        ))}

        {/* Avatar */}
        <img src={heroPortrait} alt={hero.name} className="character-avatar" />

        {/* Character Info */}
        <div className="character-info">
          <div className="character-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
              <span className="character-name">{hero.name}</span>
              <span className={`character-rarity ${hero.rarity}`}>{hero.rarity}</span>
            </div>
            <span className="character-level">Lv.{hero.level}</span>
          </div>
          <div className="character-hp-bar">
            <div className={`character-hp-fill ${hpClass}`} style={{ width: `${hpPercentage * 100}%` }} />
            <span className="character-hp-text">
              {hero.currentHP}/{hero.maxHP}
            </span>
          </div>
          {/* Turn Gauge Bar */}
          {(() => {
            const gauge = calculateTurnGauge(hero, combatEngine.turnOrder);
            const displayText = gauge.textKey === 'combat.turn.position'
              ? t('combat.turn.position', { position: gauge.position + 1 })
              : t(gauge.textKey);

            return (
              <div className="character-turn-gauge">
                <div className="character-turn-fill" style={{ width: `${gauge.percentage}%` }} />
                <span className="character-turn-text">
                  {displayText}
                </span>
              </div>
            );
          })()}
          <div className="character-stats">
            <span>⚔️ {hero.ATK}</span>
            <span>🛡️ {hero.DEF}</span>
            <span>⚡ {hero.SPD}</span>
          </div>
          {/* Status Effects */}
          {hero.statusEffects && hero.statusEffects.length > 0 && (
            <div className="character-status-effects">
              {hero.statusEffects.map((effect, idx) => {
                const icon = effect.stun ? '💫' : effect.immunity ? '🛡️' :
                  effect.stat === 'ATK' ? '⚔️' : effect.stat === 'DEF' ? '🛡️' :
                  effect.stat === 'SPD' ? '⚡' : effect.stat === 'CRIT' ? '🎯' :
                  effect.stat === 'damageReduction' ? '🔰' : effect.type === 'buff' ? '↑' : '↓';
                const effectClass = effect.stun ? 'stun' : effect.immunity ? 'immunity' : effect.type;
                return (
                  <span
                    key={idx}
                    className={`status-effect ${effectClass}`}
                    title={`${effect.name} (${effect.duration} ${effect.duration === 1 ? 'turn' : 'turns'})`}
                  >
                    <span className="status-effect-icon">{icon}</span>
                    {effect.value ? `${effect.value > 0 ? '+' : ''}${effect.value}%` : effect.name.substring(0, 3)}
                    <span className="duration">{effect.duration}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Hero Tooltip for healing/buff skills */}
        {tooltipTarget?.id === hero.id && activeCharacter && (
          <CombatActionTooltip
            activeCharacter={activeCharacter}
            target={hero}
            onAttack={() => {
              onSetTooltipTarget(null);
            }}
            onSkillUse={(skillIndex) => {
              if ('useSkill' in activeCharacter) {
                const heroChar = activeCharacter as Hero;
                const skill = heroChar.getSkills()[skillIndex];
                let targets: Combatant[];

                if (skill.type === 'heal' || skill.type === 'buff') {
                  if (skill.name.includes('Group') || skill.name.includes('All')) {
                    targets = heroes.filter(h => h.isAlive);
                  } else {
                    targets = [tooltipTarget as Combatant];
                  }
                } else {
                  targets = [tooltipTarget as Combatant];
                }

                const actionResult = heroChar.useSkill(skillIndex, targets);
                onSetTooltipTarget(null);

                if (actionResult) {
                  onManualAction(actionResult);
                  setTimeout(() => {
                    onContinueManualCombat();
                  }, 500);
                }
              }
            }}
            onClose={() => {
              onSetTooltipTarget(null);
              onSetTooltipCardElement(null);
            }}
            position="right"
            cardElement={tooltipCardElement}
          />
        )}
      </div>
    );
  };

  /**
   * Render enemy character card
   */
  const renderEnemyCard = (enemy: Enemy) => {
    const currentTurnChar = combatEngine.turnOrder[0] || activeCharacter;
    const isActive = currentTurnChar?.id === enemy.id;
    const hpPercentage = enemy.currentHP / enemy.maxHP;
    const hpClass = hpPercentage < 0.3 ? 'low' : hpPercentage < 0.6 ? 'medium' : 'high';
    const animation = characterAnimations[enemy.id] || '';
    const activeSkill = activeSkills[enemy.id];
    const enemyDamages = damageNumbers.filter(d => d.characterId === enemy.id);
    const isClickable = waitingForInput && combatEngine.isManualMode && enemy.isAlive && activeCharacter;

    return (
      <div
        key={enemy.id}
        className={`character-card enemy ${!enemy.isAlive ? 'dead' : ''} ${isActive ? 'active' : ''} ${enemy.type === 'elite' ? 'elite' : ''} ${enemy.type === 'boss' ? 'boss' : ''} ${animation} ${isClickable ? 'clickable' : ''}`}
        style={{ position: 'relative' }}
        onClick={(e) => {
          if (isClickable) {
            onSetTooltipTarget(enemy);
            onSetTooltipCardElement(e.currentTarget as HTMLElement);
          }
        }}
      >
        {/* Skill Indicator */}
        {activeSkill && (
          <div className="skill-indicator">
            🔮 {activeSkill}
          </div>
        )}

        {/* Damage Numbers */}
        {enemyDamages.map(dmg => (
          <DamageNumberContainer
            key={dmg.id}
            damages={[dmg]}
            onRemove={(id) => onSetDamageNumbers(prev => prev.filter(d => d.id !== id))}
          />
        ))}

        {/* Enemy Info */}
        <div className="character-info">
          <div className="character-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
              <span className="character-name">{enemy.name}</span>
              {enemy.type === 'elite' && <span className="enemy-type elite">Elite</span>}
              {enemy.type === 'boss' && <span className="enemy-type boss">Boss</span>}
            </div>
            <span className="character-level">Lv.{enemy.level}</span>
          </div>
          <div className="character-hp-bar">
            <div className={`character-hp-fill ${hpClass}`} style={{ width: `${hpPercentage * 100}%` }} />
            <span className="character-hp-text">
              {enemy.currentHP}/{enemy.maxHP}
            </span>
          </div>
          {/* Turn Gauge Bar */}
          {(() => {
            const gauge = calculateTurnGauge(enemy, combatEngine.turnOrder);
            const displayText = gauge.textKey === 'combat.turn.position'
              ? t('combat.turn.position', { position: gauge.position + 1 })
              : t(gauge.textKey);

            return (
              <div className="character-turn-gauge">
                <div className="character-turn-fill" style={{ width: `${gauge.percentage}%` }} />
                <span className="character-turn-text">
                  {displayText}
                </span>
              </div>
            );
          })()}
          <div className="character-stats">
            <span>⚔️ {enemy.ATK}</span>
            <span>🛡️ {enemy.DEF}</span>
            <span>⚡ {enemy.SPD}</span>
          </div>
          {/* Status Effects */}
          {enemy.statusEffects && enemy.statusEffects.length > 0 && (
            <div className="character-status-effects">
              {enemy.statusEffects.map((effect, idx) => {
                const icon = effect.stun ? '💫' : effect.immunity ? '🛡️' :
                  effect.stat === 'ATK' ? '⚔️' : effect.stat === 'DEF' ? '🛡️' :
                  effect.stat === 'SPD' ? '⚡' : effect.stat === 'CRIT' ? '🎯' :
                  effect.stat === 'damageReduction' ? '🔰' : effect.type === 'buff' ? '↑' : '↓';
                const effectClass = effect.stun ? 'stun' : effect.immunity ? 'immunity' : effect.type;
                return (
                  <span
                    key={idx}
                    className={`status-effect ${effectClass}`}
                    title={`${effect.name} (${effect.duration} ${effect.duration === 1 ? 'turn' : 'turns'})`}
                  >
                    <span className="status-effect-icon">{icon}</span>
                    {effect.value ? `${effect.value > 0 ? '+' : ''}${effect.value}%` : effect.name.substring(0, 3)}
                    <span className="duration">{effect.duration}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Enemy Tooltip for attacks/skills */}
        {tooltipTarget?.id === enemy.id && activeCharacter && (
          <CombatActionTooltip
            activeCharacter={activeCharacter}
            target={enemy}
            onAttack={() => {
              if ('attack' in activeCharacter) {
                const attackResult = (activeCharacter as Hero).attack(enemy);
                onSetTooltipTarget(null);
                if (attackResult) {
                  // Convert AttackResult to CombatActionResult
                  const actionResult: CombatActionResult = {
                    ...attackResult,
                    type: 'basic_attack',
                    attacker: activeCharacter,
                    target: enemy
                  };
                  onManualAction(actionResult);
                  setTimeout(() => {
                    onContinueManualCombat();
                  }, 500);
                }
              }
            }}
            onSkillUse={(skillIndex) => {
              if ('useSkill' in activeCharacter) {
                const heroChar = activeCharacter as Hero;
                const skill = heroChar.getSkills()[skillIndex];
                let targets: Combatant[];

                if (skill.name.includes('All')) {
                  targets = enemies.filter(e => e.isAlive);
                } else {
                  targets = [tooltipTarget as Combatant];
                }

                const actionResult = heroChar.useSkill(skillIndex, targets);
                onSetTooltipTarget(null);

                if (actionResult) {
                  onManualAction(actionResult);
                  setTimeout(() => {
                    onContinueManualCombat();
                  }, 500);
                }
              }
            }}
            onClose={() => {
              onSetTooltipTarget(null);
              onSetTooltipCardElement(null);
            }}
            position="left"
            cardElement={tooltipCardElement}
          />
        )}
      </div>
    );
  };

  return (
    <div className="combat-screen">
      {/* Defeat Screen */}
      {combatEngine.combatResult === 'defeat' && (
        <div className="defeat-screen">
          <h3 className="defeat-title">
            {t('router.allHeroesFallen')}
          </h3>
          <p className="defeat-message">
            {t('router.defeatMessage')}
          </p>
          <button
            onClick={onDefeatExit}
            className="defeat-button"
          >
            {t('router.returnToWorldMap')}
          </button>
        </div>
      )}

      {/* Victory Loot Screen (Dungeon only) */}
      {combatEngine.combatResult === 'victory' && lootReward && showDungeonVictory && (
        <div className="victory-screen">
          <h3 className="victory-title">
            {t('router.lootRewards')}
          </h3>

          <div className="victory-instruction">
            {t('router.lootInstruction')}
          </div>

          <div className="victory-rewards-grid">
            <div className="victory-reward-box">
              <div className="reward-icon">💰</div>
              <div className="reward-value">
                {t('router.goldAmount', { amount: lootReward.gold })}
              </div>
            </div>

            <div className="victory-reward-box">
              <div className="reward-icon">🎁</div>
              <div className="reward-value">
                {t('router.itemsCount', { count: lootReward.items.length })}
              </div>
            </div>
          </div>

          {lootReward.items.length > 0 && (
            <div className="loot-items-grid">
              {lootReward.items.map((item, index) => (
                <div
                  key={`loot-${item.id || `loot-item-${index}`}`}
                  className="loot-item"
                  style={{ border: `2px solid ${item.getRarityColor()}` }}
                >
                  <div className="loot-item-icon">{item.icon}</div>
                  <div className="loot-item-name" style={{ color: item.getRarityColor() }}>
                    {item.name}
                  </div>
                  <div className="loot-item-details">
                    {item.getRarityDisplayName()} | Lv.{item.level}
                  </div>
                </div>
              ))}
            </div>
          )}

          {lootReward.items.length > 0 && (
            <div className="loot-actions">
              <button
                onClick={() => onCollectLoot(lootReward.items)}
                className="loot-button collect"
              >
                {t('router.collectAll')}
              </button>
              <button
                onClick={() => onSellLoot(lootReward.items, lootReward.gold)}
                className="loot-button sell"
              >
                {t('router.sellAll')}
              </button>
            </div>
          )}

          {lootReward.items.length === 0 && lootReward.gold === 0 && (
            <div className="loot-empty">
              {t('router.allLootCollected')}
            </div>
          )}

          <button
            onClick={onVictoryContinue}
            className="continue-button"
          >
            {t('router.continueExploring')}
          </button>
        </div>
      )}

      {/* Combat Teams */}
      <div className="combat-teams-grid">
        {/* Heroes */}
        <div className="combat-team-section">
          <h3 className="combat-team-title">{t('router.heroes')}</h3>
          {heroes.map(renderHeroCard)}
        </div>

        {/* Enemies */}
        <div className="combat-team-section">
          <h3 className="combat-team-title">{t('router.enemies')}</h3>
          {enemies.map(renderEnemyCard)}
        </div>
      </div>

      {/* Bottom Combat Controls */}
      <div className="combat-bottom-panel">
        {/* Combat Status Text */}
        {waitingForInput && activeCharacter && (
          <div className="combat-status-text">
            🎯 {t('combat.selectTargetFor', { name: activeCharacter.name })}
          </div>
        )}

        {/* Mini Initiative Order */}
        <div className="combat-mini-initiative">
          <div className="mini-initiative-label">{t('combat.turnOrder')}:</div>
          <div className="mini-initiative-order">
            {combatEngine.turnOrder.slice(0, 6).map((combatant, index) => {
              const isActive = combatant.id === activeCharacter?.id;
              return (
                <div
                  key={combatant.id}
                  className={`mini-initiative-card ${isActive ? 'active' : ''} ${!combatant.isAlive ? 'dead' : ''}`}
                >
                  <div className="mini-initiative-icon">
                    {combatant instanceof Enemy ? (
                      combatant.type === 'boss' ? '💀' : combatant.type === 'elite' ? '⭐' : '👹'
                    ) : (
                      '🛡️'
                    )}
                  </div>
                  {index === 0 && <div className="mini-initiative-arrow">▶</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Combat Controls */}
        <div className="combat-bottom-controls">
          <div className="combat-round-display">{t('combat.round', { number: combatEngine.turnCounter })}</div>
          <CombatSpeedControl
            currentSpeed={combatSpeed}
            onSpeedChange={onSetCombatSpeed}
          />
          <CombatModeToggle
            currentMode={combatEngine.isManualMode ? 'manual' : 'auto'}
            onModeChange={onCombatModeChange}
          />
        </div>
      </div>

      {/* Formation Display */}
      <div className="combat-formations">
        <FormationDisplay combatants={heroes} compact={true} />
        <FormationDisplay combatants={enemies} isEnemyFormation={true} compact={true} />
      </div>

      {/* Combo Counter */}
      <ComboCounter comboCount={comboCount} />

      {/* Combat Log */}
      <CombatLog
        entries={combatLog}
        maxHeight={250}
        showFilters={true}
        highlightNames={heroes.map(h => h.name)}
      />
    </div>
  );
};
