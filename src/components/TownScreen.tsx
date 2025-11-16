/**
 * Town Screen Component - Main town UI with building navigation
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-16
 */

import React, { useState, useEffect } from 'react';
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
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS } from '../styles/tokens';
import { flexColumn } from '../styles/common';
import { t } from '../localization/i18n';

// Import city interior images (city1-inside doesn't exist, only city2-5)
import city2InsideImg from '../assets/images/building/city2-inside.png';
import city3InsideImg from '../assets/images/building/city3-inside.png';
import city4InsideImg from '../assets/images/building/city4-inside.png';
import city5InsideImg from '../assets/images/building/city5-inside.png';

interface TownScreenProps {
  userId: string;
  town: TownData;
  heroes: Hero[];
  activeParty: Hero[];
  activePartyIndices: number[];
  inventory: Inventory;
  playerGold: number;
  playerGems: number;
  playerLevel: number;
  energy: number;
  maxEnergy: number;
  storedGold: number; // Deprecated - kept for compatibility
  bankVaultTier: number;
  bankVaultMaxSlots: number;
  bankTotalItems: number;
  gachaState: GachaState;
  onGoldChange: (newGold: number) => void;
  onGemsChange: (newGems: number) => void;
  onEnergyChange: (newEnergy: number) => void;
  onMaxEnergyChange: (newMaxEnergy: number) => void;
  onStoredGoldChange: (newStoredGold: number) => void; // Deprecated
  onBankVaultChange: (tier: number, maxSlots: number, totalItems: number) => void;
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
  userId,
  town,
  heroes,
  activeParty,
  activePartyIndices,
  inventory,
  playerGold,
  playerGems,
  playerLevel,
  energy,
  maxEnergy,
  storedGold,
  bankVaultTier,
  bankVaultMaxSlots,
  bankTotalItems,
  gachaState,
  onGoldChange,
  onGemsChange,
  onEnergyChange,
  onMaxEnergyChange,
  onStoredGoldChange,
  onBankVaultChange,
  onHeroesChange,
  onInventoryChange,
  onGachaStateChange,
  onActivePartyChange,
  onClose
}: TownScreenProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType | null>(null);
  const [cityBackgroundImage, setCityBackgroundImage] = useState<string>('');

  // Load appropriate city background based on town asset
  useEffect(() => {
    const assetName = town.asset || 'city2.png'; // Default to city2 if no asset specified

    let insideImage = city2InsideImg; // Default fallback (city1-inside doesn't exist)

    // Map city assets to their interior images
    switch (assetName) {
      case 'city1.png':
        // city1-inside doesn't exist, use city2-inside as fallback
        insideImage = city2InsideImg;
        break;
      case 'city2.png':
        insideImage = city2InsideImg;
        break;
      case 'city3.png':
        insideImage = city3InsideImg;
        break;
      case 'city4.png':
        insideImage = city4InsideImg;
        break;
      case 'city5.png':
        insideImage = city5InsideImg;
        break;
    }

    setCityBackgroundImage(insideImage);
  }, [town.asset]);

  // Building metadata
  const buildingInfo: Record<BuildingType, { name: string; icon: string; description: string }> = {
    tavern: {
      name: t('town.tavern'),
      icon: '🍺',
      description: t('town.tavernDesc')
    },
    smithy: {
      name: t('town.smithy'),
      icon: '⚒️',
      description: t('town.smithyDesc')
    },
    healer: {
      name: t('town.healer'),
      icon: '⛑️',
      description: t('town.healerDesc')
    },
    market: {
      name: t('town.market'),
      icon: '🏪',
      description: t('town.marketDesc')
    },
    bank: {
      name: t('town.bank'),
      icon: '🏦',
      description: t('town.bankDesc')
    },
    guild: {
      name: t('town.guild'),
      icon: '🏰',
      description: t('town.guildDesc')
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
            userId={userId}
            inventory={inventory}
            playerGold={playerGold}
            energy={energy}
            maxEnergy={maxEnergy}
            bankVaultTier={bankVaultTier}
            bankVaultMaxSlots={bankVaultMaxSlots}
            bankTotalItems={bankTotalItems}
            onClose={() => setSelectedBuilding(null)}
            onInventoryChange={onInventoryChange}
            onGoldChange={onGoldChange}
            onEnergyChange={onEnergyChange}
            onBankVaultChange={onBankVaultChange}
            onMaxEnergyChange={onMaxEnergyChange}
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

  // Otherwise, show town overview with city background
  return (
    <div style={styles.container}>
      {/* City Background Image (like HOMAM) */}
      <div
        style={{
          ...styles.cityBackground,
          backgroundImage: cityBackgroundImage ? `url(${cityBackgroundImage})` : 'none'
        }}
      />

      {/* Header - Positioned absolutely at top */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{town.name}</h1>
          <p style={styles.subtitle}>
            {town.faction} • Level {town.level}
          </p>
        </div>
        <button style={styles.closeButton} onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Resources Display - Positioned absolutely at top */}
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

      {/* Buildings Grid - Positioned at bottom */}
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
                <div style={styles.lockedBadge}>🔒 {t('town.locked')}</div>
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
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    color: COLORS.textLight,
    overflow: 'hidden'
  },
  cityBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    zIndex: 0
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 70%, transparent 100%)',
    zIndex: 10,
    backdropFilter: 'blur(4px)'
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
    position: 'absolute',
    top: '80px', // Below header
    left: 0,
    right: 0,
    display: 'flex',
    gap: SPACING.lg,
    padding: `${SPACING.md} ${SPACING.lg}`,
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)',
    zIndex: 10
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: SPACING.md,
    padding: SPACING.lg,
    background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.7) 80%, transparent 100%)',
    backdropFilter: 'blur(6px)',
    maxHeight: '35%',
    overflow: 'auto',
    zIndex: 10
  },
  buildingCard: {
    ...flexColumn,
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${SPACING[3]} ${SPACING.md}`,
    background: 'rgba(30, 41, 59, 0.85)',
    border: `2px solid rgba(71, 85, 105, 0.6)`,
    borderRadius: BORDER_RADIUS.md,
    cursor: 'pointer',
    transition: TRANSITIONS.base,
    position: 'relative',
    minHeight: '140px',
    backdropFilter: 'blur(8px)'
  },
  buildingCardUnlocked: {
    borderColor: COLORS.primary,
    boxShadow: `0 0 15px ${COLORS.primary}40`
  },
  buildingCardLocked: {
    opacity: 0.4,
    cursor: 'not-allowed'
  },
  buildingIcon: {
    fontSize: FONT_SIZE['5xl'],
    marginBottom: SPACING[2]
  },
  buildingName: {
    margin: `0 0 ${SPACING[1]} 0`,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textLight
  },
  buildingDescription: {
    margin: 0,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textGray,
    textAlign: 'center',
    lineHeight: '1.3',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
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
