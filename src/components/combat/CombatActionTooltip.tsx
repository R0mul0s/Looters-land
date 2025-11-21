/**
 * Combat Action Tooltip Component
 *
 * Displays attack and skill options when a target is clicked in manual combat.
 * Appears attached to the clicked character card.
 *
 * Contains:
 * - Draggable tooltip with target character name
 * - Attack button with estimated damage preview
 * - Skill buttons with cooldown indicators
 * - Smart skill filtering (damage for enemies, heal/buff for allies)
 * - Dynamic positioning to avoid viewport overflow
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-20
 */

import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Combatant } from '../../types/combat.types';
import { Hero } from '../../engine/hero/Hero';
import { Enemy } from '../../engine/combat/Enemy';
import { t } from '../../localization/i18n';
import './CombatActionTooltip.css';

interface CombatActionTooltipProps {
  activeCharacter: Combatant;
  target: Combatant;
  onAttack: () => void;
  onSkillUse: (skillIndex: number) => void;
  onClose: () => void;
  position: 'top' | 'bottom' | 'left' | 'right';
  cardElement?: HTMLElement | null;
}

export const CombatActionTooltip: React.FC<CombatActionTooltipProps> = ({
  activeCharacter,
  target,
  onAttack,
  onSkillUse,
  onClose,
  position,
  cardElement
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Reset position when target changes
  useEffect(() => {
    setTooltipPosition({ top: 0, left: 0 });
    setIsDragging(false);
  }, [target?.id]);

  // Handle dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      setTooltipPosition({
        top: e.clientY - dragOffset.y,
        left: e.clientX - dragOffset.x
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    // Don't start dragging if clicking the close button
    if ((e.target as HTMLElement).classList.contains('tooltip-close')) {
      return;
    }

    if (!tooltipRef.current) return;

    const rect = tooltipRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

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

  // Calculate tooltip position based on card element
  useEffect(() => {
    if (!cardElement || !tooltipRef.current) return;

    const calculatePosition = () => {
      if (!cardElement || !tooltipRef.current) return;

      const cardRect = cardElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      console.log('📏 Calculating position - tooltip size:', tooltipRect.width, 'x', tooltipRect.height);

      // Skip if tooltip hasn't been rendered yet (width/height is 0)
      if (tooltipRect.width === 0 || tooltipRect.height === 0) {
        console.log('⚠️ Tooltip not rendered yet, will retry in 50ms');
        // Retry after a short delay
        setTimeout(calculatePosition, 50);
        return;
      }

      let top = 0;
      let left = 0;

      switch (position) {
        case 'right':
          // Position to the right of the card
          left = cardRect.right + 10;
          top = cardRect.top + (cardRect.height / 2) - (tooltipRect.height / 2);
          break;
        case 'left':
          // Position to the left of the card
          left = cardRect.left - tooltipRect.width - 10;
          top = cardRect.top + (cardRect.height / 2) - (tooltipRect.height / 2);
          break;
        case 'top':
          // Position above the card
          left = cardRect.left + (cardRect.width / 2) - (tooltipRect.width / 2);
          top = cardRect.top - tooltipRect.height - 10;
          break;
        case 'bottom':
          // Position below the card
          left = cardRect.left + (cardRect.width / 2) - (tooltipRect.width / 2);
          top = cardRect.bottom + 10;
          break;
      }

      // Make sure tooltip stays within viewport
      const padding = 10;
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

      console.log('📍 Tooltip position calculated:', { top, left, position, cardRect, tooltipRect });
      setTooltipPosition({ top, left });
    };

    // Start calculation after a small delay to ensure React has rendered
    const timer = setTimeout(calculatePosition, 10);

    return () => clearTimeout(timer);
  }, [cardElement, position, target, availableSkills.length]);

  // Calculate estimated damage for attack
  const calculateEstimatedDamage = (): { min: number; max: number } => {
    if (!('getCombatStats' in activeCharacter)) {
      return { min: 0, max: 0 };
    }

    const attackerStats = (activeCharacter as Hero).getCombatStats();
    const baseDamage = attackerStats.ATK;

    // Estimate damage range considering target's DEF
    // Normal damage: ATK - DEF/2 (approximation)
    const normalDamage = Math.max(1, baseDamage - Math.floor(target.DEF / 2));
    // Crit damage is typically 1.5x - 2x
    const critDamage = Math.floor(normalDamage * 1.5);

    return { min: normalDamage, max: critDamage };
  };

  const estimatedDamage = isTargetEnemy ? calculateEstimatedDamage() : { min: 0, max: 0 };

  const tooltipContent = (
    <div
      ref={tooltipRef}
      className={`combat-action-tooltip ${position}`}
      style={{
        top: `${tooltipPosition.top}px`,
        left: `${tooltipPosition.left}px`,
        opacity: tooltipPosition.top === 0 && tooltipPosition.left === 0 ? 0 : 1,
        transition: 'opacity 0.1s'
      }}
    >
      <div className="tooltip-arrow"></div>

      <div className="tooltip-header" onMouseDown={handleHeaderMouseDown}>
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
            <div className="action-header">
              <span className="action-icon">⚔️</span>
              <span className="action-text">{t('combat.attack')}</span>
            </div>
            <div className="action-description">
              {t('combat.estDamage')}: {estimatedDamage.min} - {estimatedDamage.max}
            </div>
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
                      <span className="action-cooldown">{t('combat.cooldown')}: {currentCooldown}</span>
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

  // Render tooltip using portal to prevent z-index and overflow issues
  return createPortal(tooltipContent, document.body);
};
