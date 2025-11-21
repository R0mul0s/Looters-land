/**
 * Formation Display Component
 * Shows party formation with visual positioning
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-21
 */
import React from 'react';
import type { Combatant, PositionBonuses } from '../../types/combat.types';
import { Position, POSITION_BONUSES } from '../../types/combat.types';
import { t } from '../../localization/i18n';
import './FormationDisplay.css';

interface FormationDisplayProps {
  combatants: Combatant[];
  isEnemyFormation?: boolean;
  onPositionChange?: (combatantId: string, newPosition: Position) => void;
  allowReposition?: boolean;
  compact?: boolean;
}

/**
 * Formation Display Component
 * Shows combatants grouped by position (Front/Middle/Back)
 */
export const FormationDisplay: React.FC<FormationDisplayProps> = ({
  combatants,
  isEnemyFormation = false,
  onPositionChange,
  allowReposition = false,
  compact = false
}) => {
  // Group by position
  const getPosition = (c: Combatant): Position => {
    return 'position' in c ? (c as { position: Position }).position : Position.MIDDLE;
  };

  const front = combatants.filter(c => getPosition(c) === Position.FRONT);
  const middle = combatants.filter(c => getPosition(c) === Position.MIDDLE);
  const back = combatants.filter(c => getPosition(c) === Position.BACK);

  const renderRow = (position: Position, chars: Combatant[]) => {
    const bonuses: PositionBonuses = POSITION_BONUSES[position];
    const rowName = t(`combat.position.${position}`);

    return (
      <div className={`formation-row ${compact ? 'compact' : ''}`} key={position}>
        <div className="formation-row-label">
          <div className="formation-row-name">{rowName}</div>
          {!compact && (
            <div className="formation-row-aggro">
              {t('combat.position.aggro')}: {bonuses.aggroWeight}x
            </div>
          )}
        </div>

        <div className="formation-chars">
          {chars.length === 0 ? (
            <div className="formation-empty">{t('combat.position.empty')}</div>
          ) : (
            chars.map(char => (
              <div
                key={char.id}
                className={`formation-char ${isEnemyFormation ? 'enemy' : 'hero'} ${char.isAlive ? '' : 'dead'}`}
              >
                <div className="formation-char-name">{char.name}</div>
                <div className="formation-char-hp">
                  {char.currentHP}/{char.maxHP}
                </div>

                {allowReposition && onPositionChange && (
                  <select
                    value={position}
                    onChange={(e) => onPositionChange(char.id, e.target.value as Position)}
                    className="formation-position-select"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value={Position.FRONT}>{t('combat.position.front')}</option>
                    <option value={Position.MIDDLE}>{t('combat.position.middle')}</option>
                    <option value={Position.BACK}>{t('combat.position.back')}</option>
                  </select>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`formation-display ${compact ? 'compact' : ''}`}>
      <div className="formation-header">
        {isEnemyFormation ? t('combat.enemyFormation') : t('combat.partyFormation')}
      </div>

      {renderRow(Position.FRONT, front)}
      {renderRow(Position.MIDDLE, middle)}
      {renderRow(Position.BACK, back)}

      {/* Bonus legend - only show in non-compact mode */}
      {!compact && (
        <div className="formation-legend">
          <div className="formation-legend-title">{t('combat.position.bonuses')}:</div>
          <div className="formation-legend-items">
            <div>{t('combat.position.frontBonus')}</div>
            <div>{t('combat.position.middleBonus')}</div>
            <div>{t('combat.position.backBonus')}</div>
          </div>
        </div>
      )}
    </div>
  );
};
