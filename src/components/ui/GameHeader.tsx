/**
 * Game Header Component
 *
 * Displays player info, resources (gold, gems), and energy bar.
 * Main header for the game UI shown across all screens.
 * Includes sync status indicator and settings button.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React from 'react';
import { SyncStatusIndicator, type SyncStatus } from '../SyncStatusIndicator';
import { t } from '../../localization/i18n';
import { useIsMobile } from '../../hooks/useIsMobile';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS } from '../../styles/tokens';
import { flexBetween, flexColumn } from '../../styles/common';

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
  const isMobile = useIsMobile();

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

  if (isMobile) {
    // Mobile layout - minimal, only essentials
    return (
      <div style={styles.containerMobile}>
        {/* Single row: Player name + Sync Status */}
        <div style={styles.topRowMobile}>
          <div style={styles.playerNameMobile}>
            🧙 {playerName}
          </div>

          {/* Sync Status - compact text only */}
          {syncStatus && syncStatus === 'success' && (
            <div style={styles.syncStatusMobile}>
              Uloženo
            </div>
          )}
          {syncStatus && syncStatus === 'saving' && (
            <div style={styles.syncStatusMobileSyncing}>
              Ukládám...
            </div>
          )}
        </div>

        {/* Energy Bar - compact */}
        <div style={styles.energyContainerMobile}>
          <div style={styles.energyLabelMobile}>
            ⚡ {energy}/{maxEnergy}
          </div>
          <div style={styles.energyBarBackgroundMobile}>
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

  // Desktop layout - original
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
    backgroundColor: COLORS.bgCardDark,
    padding: `${SPACING.md} ${SPACING.lg}`,
    borderBottom: `2px solid ${COLORS.borderDark}`,
    boxShadow: SHADOWS.md
  },
  topRow: {
    ...flexBetween,
    marginBottom: SPACING.sm
  },
  playerName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.successLight
  },
  resources: {
    display: 'flex',
    gap: SPACING.lg,
    alignItems: 'center'
  },
  resource: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.bgInput,
    padding: `${SPACING.xs} ${SPACING[3]}`,
    borderRadius: SPACING.xs,
    border: `1px solid ${COLORS.borderDarker}`
  },
  resourceIcon: {
    fontSize: FONT_SIZE.base
  },
  resourceValue: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.gold
  },
  settingsButton: {
    fontSize: FONT_SIZE.xl,
    background: COLORS.transparent,
    border: 'none',
    cursor: 'pointer',
    padding: SPACING.xs,
    opacity: 0.8,
    transition: TRANSITIONS.fast
  },
  energyContainer: {
    ...flexColumn,
    gap: SPACING.xs
  },
  energyLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSlate
  },
  energyBarBackground: {
    width: '100%',
    height: '20px',
    backgroundColor: COLORS.bgInput,
    borderRadius: SPACING.sm,
    overflow: 'hidden',
    border: `1px solid ${COLORS.borderDarker}`
  },
  energyBarFill: {
    height: '100%',
    backgroundColor: COLORS.successLight,
    transition: TRANSITIONS.base,
    boxShadow: SHADOWS.glowGreen
  },
  // Mobile-specific styles
  containerMobile: {
    backgroundColor: COLORS.bgCardDark,
    paddingTop: SPACING[2],
    paddingRight: SPACING[2],
    paddingBottom: SPACING[2],
    paddingLeft: SPACING[2],
    borderBottom: `2px solid ${COLORS.borderDark}`,
    boxShadow: SHADOWS.md
  },
  topRowMobile: {
    ...flexBetween,
    marginBottom: SPACING[2],
    alignItems: 'center'
  },
  playerNameMobile: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.successLight
  },
  syncStatusMobile: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
    fontWeight: FONT_WEIGHT.semibold
  },
  syncStatusMobileSyncing: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textGray,
    fontWeight: FONT_WEIGHT.semibold
  },
  energyContainerMobile: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[2]
  },
  energyLabelMobile: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSlate,
    whiteSpace: 'nowrap',
    minWidth: '70px'
  },
  energyBarBackgroundMobile: {
    flex: 1,
    height: '16px',
    backgroundColor: COLORS.bgInput,
    borderRadius: SPACING.sm,
    overflow: 'hidden',
    border: `1px solid ${COLORS.borderDarker}`
  }
};
