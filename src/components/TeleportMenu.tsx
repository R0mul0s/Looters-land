/**
 * Teleport Menu Component - Fast travel to discovered locations
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-09
 */

import React, { useState } from 'react';
import { t } from '../localization/i18n';
import type { StaticObjectType } from '../types/worldmap.types';

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

const TELEPORT_COST = 40;

export function TeleportMenu({
  discoveredLocations,
  currentEnergy,
  onTeleport,
  onClose
}: TeleportMenuProps) {
  const [selectedLocation, setSelectedLocation] = useState<TeleportLocation | null>(null);
  const [filter, setFilter] = useState<'all' | 'town' | 'dungeon'>('all');

  const filteredLocations = discoveredLocations.filter(loc => {
    if (filter === 'all') return true;
    return loc.type === filter;
  });

  const getLocationIcon = (type: string) => {
    return type === 'town' ? '🏰' : '🕳️';
  };

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
            <span style={styles.infoValue}>{discoveredLocations.length}</span>
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
            {t('worldmap.allLocations')} ({discoveredLocations.length})
          </button>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === 'town' && styles.filterButtonActive)
            }}
            onClick={() => setFilter('town')}
          >
            🏰 {t('worldmap.towns')} ({discoveredLocations.filter(l => l.type === 'town').length})
          </button>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === 'dungeon' && styles.filterButtonActive)
            }}
            onClick={() => setFilter('dungeon')}
          >
            🕳️ {t('worldmap.dungeons')} ({discoveredLocations.filter(l => l.type === 'dungeon').length})
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
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    color: '#f1f5f9',
    overflow: 'hidden'
  },
  header: {
    padding: '20px',
    borderBottom: '2px solid #2dd4bf',
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, transparent 100%)'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#f1f5f9'
  },
  infoBox: {
    padding: '15px 20px',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '8px',
    margin: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  infoLabel: {
    fontSize: '14px',
    color: '#94a3b8',
    fontWeight: '600'
  },
  infoCost: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#fbbf24'
  },
  infoValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#f1f5f9'
  },
  filterSection: {
    display: 'flex',
    gap: '10px',
    padding: '0 20px',
    marginBottom: '15px'
  },
  filterButton: {
    flex: 1,
    padding: '10px 15px',
    fontSize: '14px',
    fontWeight: '600',
    background: 'rgba(51, 65, 85, 0.5)',
    color: '#94a3b8',
    border: '1px solid #475569',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  filterButtonActive: {
    background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
    color: '#0f172a',
    border: '1px solid #2dd4bf',
    boxShadow: '0 2px 8px rgba(45, 212, 191, 0.4)'
  },
  locationsList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 20px 20px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  locationCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '15px',
    background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
    border: '2px solid #475569',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative'
  },
  locationCardSelected: {
    borderColor: '#2dd4bf',
    boxShadow: '0 0 20px rgba(45, 212, 191, 0.4)',
    transform: 'scale(1.02)'
  },
  locationCardDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  locationIcon: {
    fontSize: '40px',
    minWidth: '50px',
    textAlign: 'center'
  },
  locationInfo: {
    flex: 1
  },
  locationName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: '4px'
  },
  locationMeta: {
    fontSize: '13px',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  locationType: {
    textTransform: 'capitalize',
    color: '#2dd4bf',
    fontWeight: '600'
  },
  locationDivider: {
    opacity: 0.5
  },
  locationCoords: {
    fontFamily: 'monospace'
  },
  teleportButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
  },
  teleportButtonDisabled: {
    background: '#475569',
    cursor: 'not-allowed',
    boxShadow: 'none'
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '40px 20px'
  },
  emptyIcon: {
    fontSize: '80px',
    marginBottom: '20px'
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#f1f5f9',
    margin: '0 0 15px 0'
  },
  emptyText: {
    fontSize: '16px',
    color: '#94a3b8',
    maxWidth: '400px',
    lineHeight: '1.6',
    margin: 0
  }
};
