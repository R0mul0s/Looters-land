/**
 * Combat Action Tooltip Component
 *
 * Displays attack and skill options when a target is clicked in manual combat.
 * Appears attached to the clicked character card.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import React from 'react';
import type { Combatant } from '../../types/combat.types';
import { Hero } from '../../engine/hero/Hero';
import { Enemy } from '../../engine/combat/Enemy';
import './CombatActionTooltip.css';

interface CombatActionTooltipProps {
  activeCharacter: Combatant;
  target: Combatant;
  onAttack: () => void;
  onSkillUse: (skillIndex: number) => void;
  onClose: () => void;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export const CombatActionTooltip: React.FC<CombatActionTooltipProps> = ({
  activeCharacter,
  target,
  onAttack,
  onSkillUse,
  onClose,
  position
}) => {
  // Check if active character has skills
  const hasSkills = 'getSkills' in activeCharacter;
  const skills = hasSkills ? (activeCharacter as Hero).getSkills() : [];

  // Check if target is an ally or enemy
  const isTargetEnemy = target instanceof Enemy;

  // Filter skills based on target type
  const availableSkills = skills.filter(skill => {
    if (skill.type === 'heal' || skill.type === 'buff') {
      // Heal and buff skills can only target allies
      return !isTargetEnemy;
    } else {
      // Damage and debuff skills can only target enemies
      return isTargetEnemy;
    }
  });

  return (
    <div className={`combat-action-tooltip ${position}`}>
      <div className="tooltip-arrow"></div>

      <div className="tooltip-header">
        <span className="tooltip-target-name">{target.name}</span>
        <button className="tooltip-close" onClick={onClose}>×</button>
      </div>

      <div className="tooltip-actions">
        {/* Attack button - only for enemies */}
        {isTargetEnemy && (
          <button
            onClick={onAttack}
            className="tooltip-action-button attack"
          >
            <span className="action-icon">⚔️</span>
            <span className="action-text">Attack</span>
          </button>
        )}

        {/* Skills */}
        {availableSkills.length > 0 && (
          <div className="tooltip-skills">
            {availableSkills.map((skill, index) => {
              // Get the original skill index from the full skills array
              const originalIndex = skills.indexOf(skill);
              const currentCooldown = (activeCharacter as Hero).cooldowns.get(skill.name) || 0;
              const isOnCooldown = currentCooldown > 0;
              const canUse = !isOnCooldown;

              return (
                <button
                  key={index}
                  onClick={() => canUse && onSkillUse(originalIndex)}
                  disabled={!canUse}
                  className={`tooltip-action-button skill ${canUse ? 'available' : 'cooldown'}`}
                >
                  <div className="action-header">
                    <span className="action-icon">🔮</span>
                    <span className="action-text">{skill.name}</span>
                    {isOnCooldown && (
                      <span className="action-cooldown">CD: {currentCooldown}</span>
                    )}
                  </div>
                  <div className="action-description">{skill.description}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
