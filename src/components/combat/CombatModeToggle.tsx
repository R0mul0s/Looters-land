/**
 * Combat Mode Toggle Component
 *
 * Allows switching between Auto and Manual combat modes
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import React from 'react';
import './CombatModeToggle.css';

export type CombatMode = 'auto' | 'manual';

interface CombatModeToggleProps {
  currentMode: CombatMode;
  onModeChange: (mode: CombatMode) => void;
  disabled?: boolean;
}

export const CombatModeToggle: React.FC<CombatModeToggleProps> = ({
  currentMode,
  onModeChange,
  disabled = false
}) => {
  const modes: { key: CombatMode; label: string; icon: string }[] = [
    { key: 'auto', label: 'Auto', icon: '🤖' },
    { key: 'manual', label: 'Manual', icon: '🎮' }
  ];

  return (
    <div className="combat-mode-toggle">
      <div className="mode-label">Mode:</div>
      <div className="mode-buttons">
        {modes.map(mode => (
          <button
            key={mode.key}
            className={`mode-button ${currentMode === mode.key ? 'active' : ''}`}
            onClick={() => onModeChange(mode.key)}
            disabled={disabled}
            title={`${mode.label} Combat`}
          >
            <span className="mode-icon">{mode.icon}</span>
            <span className="mode-text">{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
