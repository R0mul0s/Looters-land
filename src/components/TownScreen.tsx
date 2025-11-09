/**
 * Town Screen Component - Main town UI with building navigation
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
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
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    color: '#f1f5f9',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '2px solid #2dd4bf',
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, transparent 100%)'
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '700',
    color: '#2dd4bf'
  },
  subtitle: {
    margin: '5px 0 0 0',
    fontSize: '14px',
    color: '#94a3b8'
  },
  closeButton: {
    background: 'transparent',
    border: '2px solid #334155',
    color: '#94a3b8',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: '8px',
    transition: 'all 0.2s',
    fontWeight: '700'
  },
  resourcesBar: {
    display: 'flex',
    gap: '20px',
    padding: '15px 20px',
    background: 'rgba(15, 23, 42, 0.5)',
    borderBottom: '1px solid #334155'
  },
  resourceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  resourceIcon: {
    fontSize: '20px'
  },
  resourceValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fbbf24'
  },
  buildingsGrid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    padding: '20px',
    overflow: 'auto'
  },
  buildingCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '30px 20px',
    background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
    border: '2px solid #475569',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    position: 'relative',
    minHeight: '200px'
  },
  buildingCardUnlocked: {
    borderColor: '#2dd4bf'
  },
  buildingCardLocked: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  buildingIcon: {
    fontSize: '64px',
    marginBottom: '15px'
  },
  buildingName: {
    margin: '0 0 10px 0',
    fontSize: '20px',
    fontWeight: '700',
    color: '#f1f5f9'
  },
  buildingDescription: {
    margin: 0,
    fontSize: '14px',
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: '1.5'
  },
  lockedBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    padding: '4px 8px',
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid #ef4444',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#ef4444'
  }
};
