/**
 * Combo Counter Display Component
 *
 * Shows the current combo count during combat with visual effects.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */
import React from 'react';
import { t } from '../../localization/i18n';
import './ComboCounter.css';

interface ComboCounterProps {
  comboCount: number;
  maxCombo?: number;
}

/**
 * Combo Counter Component
 *
 * Displays current combo with scaling animation at 3+ hits.
 */
export const ComboCounter: React.FC<ComboCounterProps> = ({
  comboCount,
  maxCombo = 5
}) => {
  if (comboCount < 3) return null;

  const bonusPercent = Math.min(comboCount, maxCombo) * 10;
  const isMaxed = comboCount >= maxCombo;

  return (
    <div className={`combo-counter ${isMaxed ? 'maxed' : ''}`}>
      <span className="combo-count">{comboCount}x</span>
      <span className="combo-label">{t('combat.comboLabel')}</span>
      <span className="combo-bonus">+{bonusPercent}%</span>
    </div>
  );
};
