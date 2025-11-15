/**
 * Tavern Building Component - Hero recruitment and gacha system
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React, { useState } from 'react';
import { Hero } from '../../engine/hero/Hero';
import type { GachaState, HeroTemplate } from '../../types/hero.types';
import { GachaSummon } from '../gacha/GachaSummon';
import { HeroCollection } from '../gacha/HeroCollection';
import { PartyManager } from '../gacha/PartyManager';
import { t } from '../../localization/i18n';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS } from '../../styles/tokens';
import { flexBetween, flexColumn } from '../../styles/common';

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

        // Override with template data (ID is already generated as UUID in Hero constructor)
        // DO NOT override hero.id - it's already a proper UUID from crypto.randomUUID()
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
        <h2 style={styles.title}>🍺 {t('buildings.tavern.title')}</h2>
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
          🎰 {t('buildings.tavern.tabs.summon')}
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'collection' && styles.tabActive)
          }}
          onClick={() => setActiveTab('collection')}
        >
          📖 {t('buildings.tavern.tabs.collection')}
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'party' && styles.tabActive)
          }}
          onClick={() => setActiveTab('party')}
        >
          ⚔️ {t('buildings.tavern.tabs.party')}
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
    ...flexColumn,
    background: `linear-gradient(135deg, ${COLORS.bgSurface} 0%, ${COLORS.bgDarkAlt} 100%)`,
    color: COLORS.textLight,
    overflow: 'hidden'
  },
  header: {
    ...flexBetween,
    padding: SPACING.lg,
    borderBottom: `2px solid ${COLORS.primary}`,
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, transparent 100%)'
  },
  title: {
    margin: 0,
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold
  },
  closeButton: {
    background: COLORS.transparent,
    border: `2px solid ${COLORS.bgSurfaceLight}`,
    color: COLORS.textGray,
    fontSize: FONT_SIZE['2xl'],
    cursor: 'pointer',
    padding: `${SPACING[2]} ${SPACING[4]}`,
    borderRadius: BORDER_RADIUS.md,
    transition: TRANSITIONS.fast
  },
  tabBar: {
    display: 'flex',
    gap: 0,
    background: 'rgba(15, 23, 42, 0.5)',
    borderBottom: `1px solid ${COLORS.bgSurfaceLight}`,
    padding: 0
  },
  tab: {
    flex: 1,
    padding: `${SPACING[3.5]} ${SPACING.lg}`,
    fontSize: FONT_SIZE[15],
    fontWeight: FONT_WEIGHT.semibold,
    background: COLORS.transparent,
    color: COLORS.textGray,
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    transition: TRANSITIONS.fast,
    whiteSpace: 'nowrap'
  },
  tabActive: {
    color: COLORS.primary,
    borderBottom: `3px solid ${COLORS.primary}`,
    background: 'rgba(45, 212, 191, 0.1)'
  },
  tabContent: {
    flex: 1,
    overflow: 'hidden'
  }
};
