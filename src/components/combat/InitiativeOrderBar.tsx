/**
 * Initiative Order Bar Component
 *
 * Displays the turn order for combat, showing which characters will act next.
 * Each character is shown with a card including their portrait, name, and initiative value.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import React from 'react';
import type { Combatant } from '../../types/combat.types';
import './InitiativeOrderBar.css';

interface InitiativeOrderBarProps {
  turnOrder: Combatant[];
  currentCharacter: Combatant | null;
}

export const InitiativeOrderBar: React.FC<InitiativeOrderBarProps> = ({
  turnOrder,
  currentCharacter
}) => {
  if (turnOrder.length === 0) {
    return null;
  }

  return (
    <div className="initiative-order-bar">
      <div className="initiative-label">Turn Order:</div>
      <div className="initiative-cards">
        {turnOrder.map((character, index) => {
          const isActive = currentCharacter?.id === character.id;
          const isHero = !('isEnemy' in character && character.isEnemy);
          const isElite = 'type' in character && character.type === 'elite';
          const isBoss = 'type' in character && character.type === 'boss';

          return (
            <div
              key={`${character.id}-${index}`}
              className={`initiative-card ${isActive ? 'active' : ''} ${isHero ? 'hero' : 'enemy'}`}
            >
              {/* Initiative Badge */}
              <div className="initiative-badge">
                {character.initiative}
              </div>

              {/* Character Icon */}
              <div className="character-icon">
                {isHero ? '🛡️' : isBoss ? '💀' : isElite ? '⭐' : '👹'}
              </div>

              {/* Character Name */}
              <div className="character-name">
                {character.name}
              </div>

              {/* HP Bar - small version */}
              <div className="mini-hp-bar">
                <div
                  className="mini-hp-fill"
                  style={{
                    width: `${(character.currentHP / character.maxHP) * 100}%`,
                    background:
                      character.currentHP / character.maxHP > 0.6
                        ? '#4CAF50'
                        : character.currentHP / character.maxHP > 0.3
                        ? '#FFA500'
                        : '#F44336'
                  }}
                />
              </div>

              {/* Active Indicator */}
              {isActive && (
                <div className="active-indicator">
                  <span className="active-arrow">▶</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
