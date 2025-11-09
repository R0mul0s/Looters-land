/**
 * Tavern Building Component - Hero recruitment and gacha system
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import React, { useState } from 'react';
import { Hero } from '../../engine/hero/Hero';
import type { GachaState, HeroTemplate } from '../../types/hero.types';
import { GachaSummon } from '../gacha/GachaSummon';
import { HeroCollection } from '../gacha/HeroCollection';
import { PartyManager } from '../gacha/PartyManager';

interface TavernBuildingProps {
  heroes: Hero[];
  playerGold: number;
  playerGems: number;
  gachaState: GachaState;
  activePartyIndices: number[];
  onClose: () => void;
  onHeroesChange: (heroes: Hero[]) => void;
  onGoldChange: (newGold: number) => void;
  onGemsChange: (newGems: number) => void;
  onGachaStateChange: (newState: GachaState) => void;
  onActivePartyChange: (newPartyIndices: number[]) => void;
}

type TavernTab = 'summon' | 'collection' | 'party';

export function TavernBuilding({
  heroes,
  playerGold,
  gachaState,
  activePartyIndices,
  onClose,
  onHeroesChange,
  onGoldChange,
  onGachaStateChange,
  onActivePartyChange
}: TavernBuildingProps) {
  const [activeTab, setActiveTab] = useState<TavernTab>('summon');

  const handleHeroesObtained = (newHeroTemplates: HeroTemplate[]) => {
    const updatedHeroes = [...heroes];
    const newUniqueHeroes: Hero[] = [];

    newHeroTemplates.forEach((template) => {
      // Check for duplicate (same name + class + rarity)
      const existingHero = updatedHeroes.find(
        h => h.name === template.name &&
             h.class === template.class &&
             h.rarity === template.rarity
      );

      if (existingHero) {
        // Duplicate found - add talent point instead of creating new hero
        existingHero.talentPoints += 1;
        console.log(`⭐ Duplicate ${template.name} summoned! Added +1 talent point (total: ${existingHero.talentPoints})`);
      } else {
        // New hero - create instance
        const hero = new Hero(template.name, template.class, 1, template.rarity);

        // Override with template data
        hero.id = `${template.id}_${Date.now()}_${Math.random()}`;
        hero.description = template.description;
        hero.specialAbility = template.specialAbility;
        hero.faction = template.faction;
        hero.role = template.role;

        newUniqueHeroes.push(hero);
      }
    });

    onHeroesChange([...updatedHeroes, ...newUniqueHeroes]);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🍺 Tavern</h2>
        <button style={styles.closeButton} onClick={onClose}>✕</button>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabBar}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'summon' && styles.tabActive)
          }}
          onClick={() => setActiveTab('summon')}
        >
          🎰 Summon Heroes
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'collection' && styles.tabActive)
          }}
          onClick={() => setActiveTab('collection')}
        >
          📖 Collection
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'party' && styles.tabActive)
          }}
          onClick={() => setActiveTab('party')}
        >
          ⚔️ Party Manager
        </button>
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {activeTab === 'summon' && (
          <GachaSummon
            gachaState={gachaState}
            playerGold={playerGold}
            onGachaStateChange={onGachaStateChange}
            onGoldChange={onGoldChange}
            onHeroesObtained={handleHeroesObtained}
          />
        )}

        {activeTab === 'collection' && (
          <HeroCollection
            heroes={heroes}
            activePartyIndices={activePartyIndices}
          />
        )}

        {activeTab === 'party' && (
          <PartyManager
            heroes={heroes}
            activePartyIndices={activePartyIndices}
            onPartyChange={onActivePartyChange}
          />
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '2px solid #2dd4bf',
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, transparent 100%)'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700'
  },
  closeButton: {
    background: 'transparent',
    border: '2px solid #334155',
    color: '#94a3b8',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: '8px',
    transition: 'all 0.2s'
  },
  tabBar: {
    display: 'flex',
    gap: '0',
    background: 'rgba(15, 23, 42, 0.5)',
    borderBottom: '1px solid #334155',
    padding: '0'
  },
  tab: {
    flex: 1,
    padding: '15px 20px',
    fontSize: '15px',
    fontWeight: '600',
    background: 'transparent',
    color: '#94a3b8',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap'
  },
  tabActive: {
    color: '#2dd4bf',
    borderBottom: '3px solid #2dd4bf',
    background: 'rgba(45, 212, 191, 0.1)'
  },
  tabContent: {
    flex: 1,
    overflow: 'hidden'
  }
};
