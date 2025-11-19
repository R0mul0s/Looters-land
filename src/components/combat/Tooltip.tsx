/**
 * Tooltip Component
 *
 * Displays detailed information on hover for skills, enemies, and other combat elements
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import React, { useState, useRef, useEffect } from 'react';
import './Tooltip.css';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300
}) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setCoords({ x: rect.left, y: rect.top });

    timeoutRef.current = window.setTimeout(() => {
      setVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tooltip-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {visible && (
        <div className={`tooltip tooltip-${position}`}>
          <div className="tooltip-content">{content}</div>
        </div>
      )}
    </div>
  );
};

interface EnemyTooltipProps {
  enemy: {
    name: string;
    level: number;
    type?: 'normal' | 'elite' | 'boss';
    ATK: number;
    DEF: number;
    SPD: number;
    currentHP: number;
    maxHP: number;
    description?: string;
  };
}

export const EnemyTooltip: React.FC<EnemyTooltipProps> = ({ enemy }) => (
  <div className="enemy-tooltip">
    <div className="tooltip-header">
      <span className="tooltip-enemy-name">
        {enemy.type === 'boss' && '💀 '}
        {enemy.type === 'elite' && '⭐ '}
        {enemy.name}
      </span>
      <span className="tooltip-enemy-level">Lv.{enemy.level}</span>
    </div>

    {enemy.type && enemy.type !== 'normal' && (
      <div className={`tooltip-enemy-type type-${enemy.type}`}>
        {enemy.type === 'elite' ? 'Elite Enemy' : 'Boss Enemy'}
      </div>
    )}

    <div className="tooltip-divider" />

    <div className="tooltip-stats">
      <div className="tooltip-stat">
        <span className="stat-icon">❤️</span>
        <span className="stat-label">HP:</span>
        <span className="stat-value">
          {enemy.currentHP} / {enemy.maxHP}
        </span>
      </div>
      <div className="tooltip-stat">
        <span className="stat-icon">⚔️</span>
        <span className="stat-label">ATK:</span>
        <span className="stat-value">{enemy.ATK}</span>
      </div>
      <div className="tooltip-stat">
        <span className="stat-icon">🛡️</span>
        <span className="stat-label">DEF:</span>
        <span className="stat-value">{enemy.DEF}</span>
      </div>
      <div className="tooltip-stat">
        <span className="stat-icon">⚡</span>
        <span className="stat-label">SPD:</span>
        <span className="stat-value">{enemy.SPD}</span>
      </div>
    </div>

    {enemy.description && (
      <>
        <div className="tooltip-divider" />
        <div className="tooltip-description">{enemy.description}</div>
      </>
    )}
  </div>
);

interface SkillTooltipProps {
  skill: {
    name: string;
    type: string;
    damage?: number;
    heal?: number;
    cooldown?: number;
    description?: string;
    manaCost?: number;
  };
  currentCooldown?: number;
}

export const SkillTooltip: React.FC<SkillTooltipProps> = ({
  skill,
  currentCooldown = 0
}) => (
  <div className="skill-tooltip">
    <div className="tooltip-header">
      <span className="tooltip-skill-name">{skill.name}</span>
      <span className={`tooltip-skill-type type-${skill.type}`}>
        {skill.type}
      </span>
    </div>

    <div className="tooltip-divider" />

    <div className="tooltip-stats">
      {skill.damage && (
        <div className="tooltip-stat">
          <span className="stat-icon">💥</span>
          <span className="stat-label">Damage:</span>
          <span className="stat-value damage">{skill.damage}</span>
        </div>
      )}
      {skill.heal && (
        <div className="tooltip-stat">
          <span className="stat-icon">💚</span>
          <span className="stat-label">Heal:</span>
          <span className="stat-value heal">{skill.heal}</span>
        </div>
      )}
      {skill.cooldown !== undefined && skill.cooldown > 0 && (
        <div className="tooltip-stat">
          <span className="stat-icon">⏱️</span>
          <span className="stat-label">Cooldown:</span>
          <span className="stat-value">
            {currentCooldown > 0 ? (
              <span className="on-cooldown">{currentCooldown} turns</span>
            ) : (
              `${skill.cooldown} turns`
            )}
          </span>
        </div>
      )}
      {skill.manaCost && (
        <div className="tooltip-stat">
          <span className="stat-icon">🔵</span>
          <span className="stat-label">Mana:</span>
          <span className="stat-value mana">{skill.manaCost}</span>
        </div>
      )}
    </div>

    {skill.description && (
      <>
        <div className="tooltip-divider" />
        <div className="tooltip-description">{skill.description}</div>
      </>
    )}
  </div>
);
