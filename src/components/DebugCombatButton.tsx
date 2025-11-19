/**
 * Debug Combat Button Component
 *
 * Allows testing combat improvements with various enemy scenarios
 * Only visible in development mode
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import React, { useState } from 'react';
import type { Enemy } from '../engine/combat/Enemy';
import { createTestEnemies, TEST_SCENARIOS, type TestScenario } from '../debug/testCombat';

interface DebugCombatButtonProps {
  onStartCombat: (enemies: Enemy[]) => void;
  playerLevel?: number;
}

export const DebugCombatButton: React.FC<DebugCombatButtonProps> = ({
  onStartCombat,
  playerLevel = 5
}) => {
  const [showMenu, setShowMenu] = useState(false);

  // Only show in development
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  const handleScenarioClick = (scenario: TestScenario) => {
    const enemies = createTestEnemies(scenario, playerLevel);
    console.log(`🎮 Starting test combat: ${scenario}`);
    onStartCombat(enemies);
    setShowMenu(false);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9998
    }}>
      {/* Menu */}
      {showMenu && (
        <div style={{
          position: 'absolute',
          bottom: '60px',
          right: '0',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '2px solid #FFD700',
          borderRadius: '8px',
          padding: '12px',
          minWidth: '250px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
          fontFamily: "'Press Start 2P', cursive"
        }}>
          <div style={{
            fontSize: '10px',
            color: '#FFD700',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            🎯 Test Combat Scenarios
          </div>

          {Object.entries(TEST_SCENARIOS).map(([key, scenario]) => (
            <button
              key={key}
              onClick={() => handleScenarioClick(key as TestScenario)}
              style={{
                width: '100%',
                padding: '8px 10px',
                marginBottom: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                color: 'white',
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '7px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
                e.currentTarget.style.borderColor = '#FFD700';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              <div style={{ marginBottom: '4px', color: '#FFD700' }}>
                {scenario.name}
              </div>
              <div style={{ fontSize: '6px', color: '#aaa' }}>
                {scenario.description}
              </div>
              <div style={{ fontSize: '6px', color: '#FFA500', marginTop: '2px' }}>
                [{scenario.difficulty}]
              </div>
            </button>
          ))}

          <div style={{
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            fontSize: '6px',
            color: '#888',
            textAlign: 'center'
          }}>
            DEV MODE ONLY
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: showMenu
            ? 'linear-gradient(135deg, #FFD700, #FFA500)'
            : 'linear-gradient(135deg, #667eea, #764ba2)',
          border: '3px solid #FFD700',
          color: showMenu ? '#000' : '#fff',
          fontSize: '20px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          transition: 'all 0.3s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        title="Debug Combat (DEV)"
      >
        ⚔️
      </button>
    </div>
  );
};
