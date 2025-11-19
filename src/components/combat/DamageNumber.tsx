/**
 * Damage Number Component
 *
 * Displays floating damage/heal numbers that animate upward and fade out
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import React, { useEffect, useState } from 'react';
import './DamageNumber.css';

export interface DamageNumberData {
  id: string;
  value: number;
  type: 'damage' | 'heal' | 'critical' | 'miss';
  x?: number; // Optional position offset
  y?: number;
}

interface DamageNumberProps {
  damage: DamageNumberData;
  onComplete: (id: string) => void;
}

export const DamageNumber: React.FC<DamageNumberProps> = ({ damage, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-remove after animation completes
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete(damage.id);
    }, 1500); // Match animation duration

    return () => clearTimeout(timer);
  }, [damage.id, onComplete]);

  if (!isVisible) return null;

  const getDisplayText = () => {
    if (damage.type === 'miss') return 'MISS!';
    if (damage.type === 'critical') return `${damage.value}!`;
    if (damage.type === 'heal') return `+${damage.value}`;
    return `-${damage.value}`;
  };

  const className = `damage-number ${damage.type}`;
  const style: React.CSSProperties = {
    left: damage.x ? `${damage.x}px` : '50%',
    top: damage.y ? `${damage.y}px` : '50%',
  };

  return (
    <div className={className} style={style}>
      {getDisplayText()}
    </div>
  );
};

/**
 * Container for multiple damage numbers
 */
interface DamageNumberContainerProps {
  damages: DamageNumberData[];
  onRemove: (id: string) => void;
}

export const DamageNumberContainer: React.FC<DamageNumberContainerProps> = ({
  damages,
  onRemove
}) => {
  return (
    <div className="damage-numbers-container">
      {damages.map((damage) => (
        <DamageNumber
          key={damage.id}
          damage={damage}
          onComplete={onRemove}
        />
      ))}
    </div>
  );
};
