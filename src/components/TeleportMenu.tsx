/**
 * Teleport Menu Component - Fast travel to discovered locations
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React, { useState } from 'react';
import { t } from '../localization/i18n';
import type { StaticObjectType } from '../types/worldmap.types';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS, SHADOWS } from '../styles/tokens';
import { flexColumn, flexCenter, flexBetween } from '../styles/common';
import { ENERGY_CONFIG } from '../config/BALANCE_CONFIG';

interface TeleportLocation {
  name: string;
  x: number;
  y: number;
  type: StaticObjectType;
}

interface TeleportMenuProps {
  discoveredLocations: TeleportLocation[];
  currentEnergy: number;
  onTeleport: (location: TeleportLocation) => void;
  onClose: () => void;
}

const TELEPORT_COST = ENERGY_CONFIG.TELEPORT_COST;

/**
 * Teleport Menu Component
 *
 * Displays a list of discovered locations (towns and dungeons) that the player
 * can teleport to for an energy cost. Includes filtering by location type and
 * real-time energy validation.
 *
 * @param props - Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * <TeleportMenu
 *   discoveredLocations={locations}
 *   currentEnergy={75}
 *   onTeleport={(loc) => console.log('Teleporting to', loc.name)}
 *   onClose={() => setShowMenu(false)}
 * />
 * ```
 */
export function TeleportMenu({
  discoveredLocations,
  currentEnergy,
  onTeleport,
  onClose: _onClose // eslint-disable-line @typescript-eslint/no-unused-vars
}: TeleportMenuProps) {
  const [selectedLocation, setSelectedLocation] = useState<TeleportLocation | null>(null);
  const [filter, setFilter] = useState<'all' | 'town' | 'dungeon'>('all');

  // Deduplicate locations by position (x, y) to ensure uniqueness
  // Filter only towns and dungeons (teleportable locations)
  const uniqueLocations = discoveredLocations
    .filter(loc => loc.type === 'town' || loc.type === 'dungeon')
    .filter((loc, index, self) =>
      index === self.findIndex(l => l.x === loc.x && l.y === loc.y)
    );

  const filteredLocations = uniqueLocations.filter(loc => {
    if (filter === 'all') return true;
    return loc.type === filter;
  });

  /**
   * Get icon emoji for location type
   *
   * @param type - Location type (town or dungeon)
   * @returns Emoji icon string
   */
  const getLocationIcon = (type: string) => {
    return type === 'town' ? '🏰' : '🕳️';
  };

  /**
   * Handle teleportation to selected location
   *
   * Validates energy cost before triggering teleport callback.
   *
   * @param location - Target location to teleport to
   */
  const handleTeleport = (location: TeleportLocation) => {
    if (currentEnergy < TELEPORT_COST) {
      return; // Not enough energy
    }
    onTeleport(location);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>🌍 {t('worldmap.teleportTitle')}</h2>
      </div>

        {/* Info */}
        <div style={styles.infoBox}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>{t('worldmap.teleportCost')}:</span>
            <span style={styles.infoCost}>{TELEPORT_COST} {t('worldmap.teleportEnergy')}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>{t('worldmap.availableEnergy')}:</span>
            <span style={{
              ...styles.infoValue,
              color: currentEnergy >= TELEPORT_COST ? '#10b981' : '#ef4444'
            }}>
              {currentEnergy} {t('worldmap.teleportEnergy')}
            </span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>{t('worldmap.discoveredLocations')}:</span>
            <span style={styles.infoValue}>{uniqueLocations.length}</span>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filterSection}>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === 'all' && styles.filterButtonActive)
            }}
            onClick={() => setFilter('all')}
          >
            {t('worldmap.allLocations')} ({uniqueLocations.length})
          </button>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === 'town' && styles.filterButtonActive)
            }}
            onClick={() => setFilter('town')}
          >
            🏰 {t('worldmap.towns')} ({uniqueLocations.filter(l => l.type === 'town').length})
          </button>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === 'dungeon' && styles.filterButtonActive)
            }}
            onClick={() => setFilter('dungeon')}
          >
            🕳️ {t('worldmap.dungeons')} ({uniqueLocations.filter(l => l.type === 'dungeon').length})
          </button>
        </div>

        {/* Locations List */}
        <div style={styles.locationsList}>
          {filteredLocations.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🗺️</div>
              <h3 style={styles.emptyTitle}>{t('worldmap.noLocationsTitle')}</h3>
              <p style={styles.emptyText}>
                {t('worldmap.noLocationsMessage')}
              </p>
            </div>
          ) : (
            filteredLocations.map((location, index) => (
              <div
                key={index}
                style={{
                  ...styles.locationCard,
                  ...(selectedLocation === location && styles.locationCardSelected),
                  ...(currentEnergy < TELEPORT_COST && styles.locationCardDisabled)
                }}
                onClick={() => setSelectedLocation(location)}
              >
                <div style={styles.locationIcon}>
                  {getLocationIcon(location.type)}
                </div>
                <div style={styles.locationInfo}>
                  <div style={styles.locationName}>{location.name}</div>
                  <div style={styles.locationMeta}>
                    <span style={styles.locationType}>
                      {location.type === 'town' ? t('worldmap.town') : t('worldmap.dungeon')}
                    </span>
                    <span style={styles.locationDivider}>•</span>
                    <span style={styles.locationCoords}>
                      ({location.x}, {location.y})
                    </span>
                  </div>
                </div>
                {selectedLocation === location && (
                  <button
                    style={{
                      ...styles.teleportButton,
                      ...(currentEnergy < TELEPORT_COST && styles.teleportButtonDisabled)
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTeleport(location);
                    }}
                    disabled={currentEnergy < TELEPORT_COST}
                  >
                    {currentEnergy >= TELEPORT_COST ? t('worldmap.teleportButton') : t('worldmap.notEnoughEnergyButton')}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    ...flexColumn,
    background: `linear-gradient(135deg, ${COLORS.bgSurface} 0%, ${COLORS.bgDarkAlt} 100%)`,
    color: COLORS.textLight,
    overflow: 'hidden'
  },
  header: {
    padding: SPACING.lg,
    borderBottom: `2px solid ${COLORS.primary}`,
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, transparent 100%)'
  },
  title: {
    margin: 0,
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textLight
  },
  infoBox: {
    padding: `${SPACING[3.5]} ${SPACING.lg}`,
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: BORDER_RADIUS.md,
    margin: SPACING.lg,
    ...flexColumn,
    gap: SPACING[2]
  },
  infoRow: {
    ...flexBetween,
    alignItems: 'center'
  },
  infoLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textGray,
    fontWeight: FONT_WEIGHT.semibold
  },
  infoCost: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.goldLight
  },
  infoValue: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textLight
  },
  filterSection: {
    display: 'flex',
    gap: SPACING[2.5],
    padding: `0 ${SPACING.lg}`,
    marginBottom: SPACING[3.5]
  },
  filterButton: {
    flex: 1,
    padding: `${SPACING[2.5]} ${SPACING[3.5]}`,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    background: 'rgba(51, 65, 85, 0.5)',
    color: COLORS.textGray,
    border: `1px solid ${COLORS.bgSurfaceLighter}`,
    borderRadius: BORDER_RADIUS.md,
    cursor: 'pointer',
    transition: TRANSITIONS.fast
  },
  filterButtonActive: {
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    color: COLORS.bgDarkAlt,
    border: `1px solid ${COLORS.primary}`,
    boxShadow: SHADOWS.md
  },
  locationsList: {
    flex: 1,
    overflowY: 'auto',
    padding: `0 ${SPACING.lg} ${SPACING.lg} ${SPACING.lg}`,
    ...flexColumn,
    gap: SPACING[2.5]
  },
  locationCard: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[3.5],
    padding: SPACING[3.5],
    background: `linear-gradient(135deg, ${COLORS.bgSurfaceLight} 0%, ${COLORS.bgSurface} 100%)`,
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: COLORS.bgSurfaceLighter,
    borderRadius: BORDER_RADIUS.lg,
    cursor: 'pointer',
    transition: TRANSITIONS.fast,
    position: 'relative'
  },
  locationCardSelected: {
    borderColor: COLORS.primary,
    boxShadow: '0 0 20px rgba(45, 212, 191, 0.4)',
    transform: 'scale(1.02)'
  },
  locationCardDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  locationIcon: {
    fontSize: FONT_SIZE['5xl'],
    minWidth: '50px',
    textAlign: 'center'
  },
  locationInfo: {
    flex: 1
  },
  locationName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textLight,
    marginBottom: SPACING[1]
  },
  locationMeta: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textGray,
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[2]
  },
  locationType: {
    textTransform: 'capitalize',
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semibold
  },
  locationDivider: {
    opacity: 0.5
  },
  locationCoords: {
    fontFamily: 'monospace'
  },
  teleportButton: {
    padding: `${SPACING[2]} ${SPACING[4]}`,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    background: `linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.successDark} 100%)`,
    color: 'white',
    border: 'none',
    borderRadius: BORDER_RADIUS.md,
    cursor: 'pointer',
    transition: TRANSITIONS.fast,
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
  },
  teleportButtonDisabled: {
    background: COLORS.bgSurfaceLighter,
    cursor: 'not-allowed',
    boxShadow: 'none'
  },
  emptyState: {
    flex: 1,
    ...flexCenter,
    ...flexColumn,
    textAlign: 'center',
    padding: `${SPACING[10]} ${SPACING.lg}`
  },
  emptyIcon: {
    fontSize: FONT_SIZE['8xl'],
    marginBottom: SPACING.lg
  },
  emptyTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textLight,
    margin: `0 0 ${SPACING[3.5]} 0`
  },
  emptyText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textGray,
    maxWidth: '400px',
    lineHeight: '1.6',
    margin: 0
  }
};
