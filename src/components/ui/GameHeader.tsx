/**
 * Game Header Component
 *
 * Displays player info, resources (gold, gems), and energy bar.
 * Main header for the game UI shown across all screens.
 * Includes sync status indicator and settings button.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-10
 */

import React from 'react';
import { SyncStatusIndicator, type SyncStatus } from '../SyncStatusIndicator';
import { t } from '../../localization/i18n';

/**
 * Props for GameHeader component
 */
interface GameHeaderProps {
  /** Player's display name */
  playerName: string;
  /** Current gold amount */
  gold: number;
  /** Current gems amount */
  gems: number;
  /** Current energy points */
  energy: number;
  /** Maximum energy capacity */
  maxEnergy: number;
  /** Energy regeneration rate per hour */
  energyRegenRate: number;
  /** Current database sync status */
  syncStatus?: SyncStatus;
  /** Last save timestamp */
  lastSaveTime?: Date | null;
  /** Callback when settings button is clicked */
  onSettingsClick?: () => void;
}

/**
 * Game Header Component
 *
 * @param props - Component props
 * @returns React component
 */
export function GameHeader({
  playerName,
  gold,
  gems,
  energy,
  maxEnergy,
  energyRegenRate,
  syncStatus,
  lastSaveTime,
  onSettingsClick
}: GameHeaderProps) {
  // Calculate energy percentage for progress bar
  const energyPercent = (energy / maxEnergy) * 100;

  /**
   * Format numbers with Czech locale (thousands separator)
   *
   * @param num - Number to format
   * @returns Formatted number string with thousands separators
   *
   * @example
   * ```typescript
   * formatNumber(1234567) // "1 234 567"
   * ```
   */
  const formatNumber = (num: number): string => {
    return num.toLocaleString('cs-CZ');
  };

  return (
    <div style={styles.container}>
      {/* Player Info & Resources */}
      <div style={styles.topRow}>
        <div style={styles.playerName}>
          🧙 {playerName}
        </div>

        <div style={styles.resources}>
          {/* Sync Status Indicator */}
          {syncStatus && (
            <SyncStatusIndicator
              status={syncStatus}
              lastSaveTime={lastSaveTime || undefined}
            />
          )}

          <div style={styles.resource} title={t('worldmap.gold')}>
            <span style={styles.resourceIcon}>💰</span>
            <span style={styles.resourceValue}>{formatNumber(gold)}</span>
          </div>

          <div style={styles.resource} title={t('resources.gems')}>
            <span style={styles.resourceIcon}>💎</span>
            <span style={styles.resourceValue}>{formatNumber(gems)}</span>
          </div>

          <button onClick={onSettingsClick} style={styles.settingsButton}>
            ⚙️
          </button>
        </div>
      </div>

      {/* Energy Bar */}
      <div style={styles.energyContainer}>
        <div style={styles.energyLabel}>
          ⚡ {t('worldmap.energy')}: {energy}/{maxEnergy} (+{energyRegenRate}/hour)
        </div>

        <div style={styles.energyBarBackground}>
          <div
            style={{
              ...styles.energyBarFill,
              width: `${energyPercent}%`
            }}
          />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#1a1a1a',
    padding: '15px 20px',
    borderBottom: '2px solid #333',
    boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  playerName: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  resources: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center'
  },
  resource: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#2a2a2a',
    padding: '5px 12px',
    borderRadius: '5px',
    border: '1px solid #444'
  },
  resourceIcon: {
    fontSize: '16px'
  },
  resourceValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#FFD700'
  },
  settingsButton: {
    fontSize: '20px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '5px',
    opacity: 0.8,
    transition: 'opacity 0.2s'
  },
  energyContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  energyLabel: {
    fontSize: '14px',
    color: '#ccc'
  },
  energyBarBackground: {
    width: '100%',
    height: '20px',
    backgroundColor: '#2a2a2a',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid #444'
  },
  energyBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    transition: 'width 0.3s ease',
    boxShadow: '0 0 10px rgba(76, 175, 80, 0.5)'
  }
};
