/**
 * Town Screen Component - Main town UI with building navigation
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React, { useState } from 'react';
import type { TownData, BuildingType } from '../types/town.types';
import type { Hero } from '../engine/hero/Hero';
import type { Inventory } from '../engine/item/Inventory';
import type { GachaState } from '../types/hero.types';
import { TavernBuilding } from './buildings/TavernBuilding';
import { SmithyBuilding } from './buildings/SmithyBuilding';
import { HealerBuilding } from './buildings/HealerBuilding';
import { MarketBuilding } from './buildings/MarketBuilding';
import { BankBuilding } from './buildings/BankBuilding';
import { GuildHallBuilding } from './buildings/GuildHallBuilding';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS } from '../styles/tokens';
import { flexColumn } from '../styles/common';

interface TownScreenProps {
  town: TownData;
  heroes: Hero[];
  activeParty: Hero[];
  activePartyIndices: number[];
  inventory: Inventory;
  playerGold: number;
  playerGems: number;
  playerLevel: number;
  storedGold: number;
  gachaState: GachaState;
  onGoldChange: (newGold: number) => void;
  onGemsChange: (newGems: number) => void;
  onStoredGoldChange: (newStoredGold: number) => void;
  onHeroesChange: (heroes: Hero[]) => void;
  onInventoryChange: (inventory: Inventory) => void;
  onGachaStateChange: (newState: GachaState) => void;
  onActivePartyChange: (newPartyIndices: number[]) => void;
  onClose: () => void;
}

/**
 * Town Screen Component
 */
export function TownScreen({
  town,
  heroes,
  activeParty,
  activePartyIndices,
  inventory,
  playerGold,
  playerGems,
  playerLevel,
  storedGold,
  gachaState,
  onGoldChange,
  onGemsChange,
  onStoredGoldChange,
  onHeroesChange,
  onInventoryChange,
  onGachaStateChange,
  onActivePartyChange,
  onClose
}: TownScreenProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType | null>(null);

  // Building metadata
  const buildingInfo: Record<BuildingType, { name: string; icon: string; description: string }> = {
    tavern: {
      name: 'Tavern',
      icon: '🍺',
      description: 'Recruit heroes and summon new adventurers'
    },
    smithy: {
      name: 'Smithy',
      icon: '⚒️',
      description: 'Enchant equipment and repair items'
    },
    healer: {
      name: 'Healer',
      icon: '⛑️',
      description: 'Restore HP for your heroes'
    },
    market: {
      name: 'Market',
      icon: '🏪',
      description: 'Buy and sell items and resources'
    },
    bank: {
      name: 'Bank',
      icon: '🏦',
      description: 'Store gold and earn interest'
    },
    guild: {
      name: 'Guild Hall',
      icon: '🏰',
      description: 'Manage guild and social features'
    }
  };

  // Render building interior
  const renderBuildingInterior = () => {
    if (!selectedBuilding) return null;

    switch (selectedBuilding) {
      case 'tavern':
        return (
          <TavernBuilding
            heroes={heroes}
            playerGold={playerGold}
            playerGems={playerGems}
            gachaState={gachaState}
            activePartyIndices={activePartyIndices}
            onClose={() => setSelectedBuilding(null)}
            onHeroesChange={onHeroesChange}
            onGoldChange={onGoldChange}
            onGemsChange={onGemsChange}
            onGachaStateChange={onGachaStateChange}
            onActivePartyChange={onActivePartyChange}
          />
        );

      case 'smithy':
        return (
          <SmithyBuilding
            inventory={inventory}
            playerGold={playerGold}
            onClose={() => setSelectedBuilding(null)}
            onInventoryChange={onInventoryChange}
            onGoldChange={onGoldChange}
          />
        );

      case 'healer':
        return (
          <HealerBuilding
            heroes={activeParty}
            playerGold={playerGold}
            onClose={() => setSelectedBuilding(null)}
            onHeroesChange={onHeroesChange}
            onGoldChange={onGoldChange}
          />
        );

      case 'market':
        return (
          <MarketBuilding
            townLevel={town.level}
            inventory={inventory}
            playerGold={playerGold}
            playerLevel={playerLevel}
            onClose={() => setSelectedBuilding(null)}
            onInventoryChange={onInventoryChange}
            onGoldChange={onGoldChange}
          />
        );

      case 'bank':
        return (
          <BankBuilding
            playerGold={playerGold}
            storedGold={storedGold}
            onClose={() => setSelectedBuilding(null)}
            onGoldChange={onGoldChange}
            onStoredGoldChange={onStoredGoldChange}
          />
        );

      case 'guild':
        return (
          <GuildHallBuilding
            onClose={() => setSelectedBuilding(null)}
          />
        );

      default:
        return null;
    }
  };

  // If building is selected, show building interior
  if (selectedBuilding) {
    return renderBuildingInterior();
  }

  // Otherwise, show town overview
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🏰 {town.name}</h1>
          <p style={styles.subtitle}>
            {town.faction} • Level {town.level}
          </p>
        </div>
        <button style={styles.closeButton} onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Resources Display */}
      <div style={styles.resourcesBar}>
        <div style={styles.resourceItem}>
          <span style={styles.resourceIcon}>💰</span>
          <span style={styles.resourceValue}>{playerGold.toLocaleString()}g</span>
        </div>
        <div style={styles.resourceItem}>
          <span style={styles.resourceIcon}>💎</span>
          <span style={styles.resourceValue}>{playerGems.toLocaleString()}</span>
        </div>
        <div style={styles.resourceItem}>
          <span style={styles.resourceIcon}>🏦</span>
          <span style={styles.resourceValue}>{storedGold.toLocaleString()}g</span>
        </div>
      </div>

      {/* Buildings Grid */}
      <div style={styles.buildingsGrid}>
        {(Object.keys(buildingInfo) as BuildingType[]).map(buildingType => {
          const building = buildingInfo[buildingType];
          const isUnlocked = town.buildings[buildingType];

          return (
            <button
              key={buildingType}
              style={{
                ...styles.buildingCard,
                ...(isUnlocked ? styles.buildingCardUnlocked : styles.buildingCardLocked)
              }}
              onClick={() => isUnlocked && setSelectedBuilding(buildingType)}
              disabled={!isUnlocked}
            >
              <div style={styles.buildingIcon}>{building.icon}</div>
              <h3 style={styles.buildingName}>{building.name}</h3>
              <p style={styles.buildingDescription}>{building.description}</p>
              {!isUnlocked && (
                <div style={styles.lockedBadge}>🔒 Locked</div>
              )}
            </button>
          );
        })}
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottom: `2px solid ${COLORS.primary}`,
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, transparent 100%)'
  },
  title: {
    margin: 0,
    fontSize: FONT_SIZE['3xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary
  },
  subtitle: {
    margin: `${SPACING[1]} 0 0 0`,
    fontSize: FONT_SIZE.md,
    color: COLORS.textGray
  },
  closeButton: {
    background: COLORS.transparent,
    border: `2px solid ${COLORS.bgSurfaceLight}`,
    color: COLORS.textGray,
    fontSize: FONT_SIZE['2xl'],
    cursor: 'pointer',
    padding: `${SPACING[2]} ${SPACING[4]}`,
    borderRadius: BORDER_RADIUS.md,
    transition: TRANSITIONS.fast,
    fontWeight: FONT_WEIGHT.bold
  },
  resourcesBar: {
    display: 'flex',
    gap: SPACING.lg,
    padding: `${SPACING.md} ${SPACING.lg}`,
    background: 'rgba(15, 23, 42, 0.5)',
    borderBottom: `1px solid ${COLORS.bgSurfaceLight}`
  },
  resourceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[2]
  },
  resourceIcon: {
    fontSize: FONT_SIZE.xl
  },
  resourceValue: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.goldLight
  },
  buildingsGrid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: SPACING.lg,
    padding: SPACING.lg,
    overflow: 'auto'
  },
  buildingCard: {
    ...flexColumn,
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${SPACING[7]} ${SPACING.lg}`,
    background: `linear-gradient(135deg, ${COLORS.bgSurfaceLight} 0%, ${COLORS.bgSurface} 100%)`,
    border: `2px solid ${COLORS.bgSurfaceLighter}`,
    borderRadius: BORDER_RADIUS.lg,
    cursor: 'pointer',
    transition: TRANSITIONS.base,
    position: 'relative',
    minHeight: '200px'
  },
  buildingCardUnlocked: {
    borderColor: COLORS.primary
  },
  buildingCardLocked: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  buildingIcon: {
    fontSize: FONT_SIZE['7xl'],
    marginBottom: SPACING.md
  },
  buildingName: {
    margin: `0 0 ${SPACING[2.5]} 0`,
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textLight
  },
  buildingDescription: {
    margin: 0,
    fontSize: FONT_SIZE.md,
    color: COLORS.textGray,
    textAlign: 'center',
    lineHeight: '1.5'
  },
  lockedBadge: {
    position: 'absolute',
    top: SPACING[2.5],
    right: SPACING[2.5],
    padding: `${SPACING[1]} ${SPACING[2]}`,
    background: 'rgba(239, 68, 68, 0.2)',
    border: `1px solid ${COLORS.danger}`,
    borderRadius: BORDER_RADIUS.sm,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.danger
  }
};
