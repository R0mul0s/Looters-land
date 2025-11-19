import React from 'react';
import './CombatSpeedControl.css';

export type CombatSpeed = 'NORMAL' | 'FAST' | 'VERY_FAST';

interface CombatSpeedControlProps {
  currentSpeed: CombatSpeed;
  onSpeedChange: (speed: CombatSpeed) => void;
  disabled?: boolean;
}

export const CombatSpeedControl: React.FC<CombatSpeedControlProps> = ({
  currentSpeed,
  onSpeedChange,
  disabled = false
}) => {
  const speeds: { key: CombatSpeed; label: string; icon: string }[] = [
    { key: 'NORMAL', label: '1x', icon: '▶️' },
    { key: 'FAST', label: '2x', icon: '⏩' },
    { key: 'VERY_FAST', label: '4x', icon: '⏭️' }
  ];

  return (
    <div className="combat-speed-control">
      <div className="speed-label">Rychlost:</div>
      <div className="speed-buttons">
        {speeds.map(speed => (
          <button
            key={speed.key}
            className={`speed-button ${currentSpeed === speed.key ? 'active' : ''}`}
            onClick={() => onSpeedChange(speed.key)}
            disabled={disabled}
            title={`Rychlost ${speed.label}`}
          >
            <span className="speed-icon">{speed.icon}</span>
            <span className="speed-text">{speed.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
