/**
 * Hero Collection Component - Display and manage collected heroes
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import React, { useState } from 'react';
import type { Hero } from '../../engine/hero/Hero';
import { RARITY_COLORS } from '../../types/hero.types';

interface HeroCollectionProps {
  heroes: Hero[];
  activePartyIndices: number[];
}

type FilterRarity = 'all' | 'common' | 'rare' | 'epic' | 'legendary';
type FilterClass = 'all' | 'warrior' | 'archer' | 'mage' | 'cleric' | 'paladin';
type SortMode = 'level' | 'rarity' | 'name' | 'class';

export function HeroCollection({ heroes, activePartyIndices }: HeroCollectionProps) {
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all');
  const [filterClass, setFilterClass] = useState<FilterClass>('all');
  const [sortMode, setSortMode] = useState<SortMode>('rarity');

  // Filter heroes
  let filteredHeroes = heroes.filter(hero => {
    if (filterRarity !== 'all' && hero.rarity !== filterRarity) return false;
    if (filterClass !== 'all' && hero.class !== filterClass) return false;
    return true;
  });

  // Sort heroes
  filteredHeroes = [...filteredHeroes].sort((a, b) => {
    switch (sortMode) {
      case 'level':
        return b.level - a.level;
      case 'rarity': {
        const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
        return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
      }
      case 'name':
        return a.name.localeCompare(b.name);
      case 'class':
        return a.class.localeCompare(b.class);
      default:
        return 0;
    }
  });

  const getClassIcon = (heroClass: string) => {
    switch (heroClass) {
      case 'warrior': return '⚔️';
      case 'archer': return '🏹';
      case 'mage': return '🔮';
      case 'cleric': return '✨';
      case 'paladin': return '🛡️';
      default: return '❓';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'tank': return '🛡️';
      case 'dps': return '⚔️';
      case 'healer': return '💚';
      case 'support': return '✨';
      default: return '❓';
    }
  };

  const isInActiveParty = (heroIndex: number) => {
    return activePartyIndices.includes(heroIndex);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>📖 Hero Collection</h2>
        <div style={styles.collectionStats}>
          <span style={styles.statText}>Total Heroes: {heroes.length}</span>
          <span style={styles.statText}>Active Party: {activePartyIndices.length}/4</span>
        </div>
      </div>

      {/* Filters and Sort */}
      <div style={styles.controlsSection}>
        {/* Rarity Filter */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Rarity:</label>
          <select
            style={styles.select}
            value={filterRarity}
            onChange={(e) => setFilterRarity(e.target.value as FilterRarity)}
          >
            <option value="all">All</option>
            <option value="legendary">Legendary</option>
            <option value="epic">Epic</option>
            <option value="rare">Rare</option>
            <option value="common">Common</option>
          </select>
        </div>

        {/* Class Filter */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Class:</label>
          <select
            style={styles.select}
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value as FilterClass)}
          >
            <option value="all">All</option>
            <option value="warrior">Warrior</option>
            <option value="archer">Archer</option>
            <option value="mage">Mage</option>
            <option value="cleric">Cleric</option>
            <option value="paladin">Paladin</option>
          </select>
        </div>

        {/* Sort Mode */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Sort by:</label>
          <select
            style={styles.select}
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
          >
            <option value="rarity">Rarity</option>
            <option value="level">Level</option>
            <option value="name">Name</option>
            <option value="class">Class</option>
          </select>
        </div>
      </div>

      {/* Hero Grid */}
      <div style={styles.content}>
        {filteredHeroes.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🎯</div>
            <h3 style={styles.emptyTitle}>No Heroes Found</h3>
            <p style={styles.emptyText}>
              Try adjusting your filters or summon more heroes!
            </p>
          </div>
        ) : (
          <div style={styles.heroesGrid}>
            {filteredHeroes.map((hero, index) => {
              const originalIndex = heroes.indexOf(hero);
              const inActiveParty = isInActiveParty(originalIndex);

              return (
                <div
                  key={hero.id}
                  style={{
                    ...styles.heroCard,
                    borderColor: RARITY_COLORS[hero.rarity],
                    ...(selectedHero?.id === hero.id && styles.heroCardSelected)
                  }}
                  onClick={() => setSelectedHero(hero)}
                >
                  {inActiveParty && (
                    <div style={styles.activeBadge}>Active Party</div>
                  )}

                  <div
                    style={{
                      ...styles.rarityBadge,
                      background: RARITY_COLORS[hero.rarity]
                    }}
                  >
                    {hero.rarity}
                  </div>

                  {/* Talent Points Badge - Duplicate Hero Indicator */}
                  {hero.talentPoints > 0 && (
                    <div style={styles.talentBadge}>
                      ⭐ {hero.talentPoints}
                    </div>
                  )}

                  <div style={styles.heroIcon}>{getClassIcon(hero.class)}</div>

                  <div style={styles.heroInfo}>
                    <div style={styles.heroName}>{hero.name}</div>
                    <div style={styles.heroMeta}>
                      <span style={styles.heroClass}>{hero.class}</span>
                      {hero.role && (
                        <>
                          <span style={styles.heroDivider}>•</span>
                          <span style={styles.heroRole}>{getRoleIcon(hero.role)} {hero.role}</span>
                        </>
                      )}
                    </div>
                    <div style={styles.heroLevel}>Level {hero.level}</div>

                    {/* Stats Preview */}
                    <div style={styles.statsPreview}>
                      <div style={styles.statRow}>
                        <span style={styles.statLabel}>HP:</span>
                        <span style={styles.statValue}>{hero.currentHP}/{hero.maxHP}</span>
                      </div>
                      <div style={styles.statRow}>
                        <span style={styles.statLabel}>ATK:</span>
                        <span style={styles.statValue}>{hero.ATK}</span>
                      </div>
                      <div style={styles.statRow}>
                        <span style={styles.statLabel}>DEF:</span>
                        <span style={styles.statValue}>{hero.DEF}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hero Detail Panel */}
      {selectedHero && (
        <div style={styles.detailPanel}>
          <div style={styles.detailHeader}>
            <h3 style={styles.detailTitle}>{selectedHero.name}</h3>
            <button
              style={styles.closeDetailButton}
              onClick={() => setSelectedHero(null)}
            >
              ✕
            </button>
          </div>

          <div style={styles.detailContent}>
            <div style={styles.detailIconSection}>
              <div style={styles.detailIcon}>{getClassIcon(selectedHero.class)}</div>
              <div
                style={{
                  ...styles.detailRarityBadge,
                  background: RARITY_COLORS[selectedHero.rarity]
                }}
              >
                {selectedHero.rarity.toUpperCase()}
              </div>
            </div>

            <div style={styles.detailInfo}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Class:</span>
                <span style={styles.detailValue}>{selectedHero.class}</span>
              </div>
              {selectedHero.role && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Role:</span>
                  <span style={styles.detailValue}>{selectedHero.role}</span>
                </div>
              )}
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Level:</span>
                <span style={styles.detailValue}>{selectedHero.level}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>XP:</span>
                <span style={styles.detailValue}>
                  {selectedHero.xp}/{selectedHero.xpToNextLevel}
                </span>
              </div>
            </div>

            <div style={styles.detailStats}>
              <h4 style={styles.statsTitle}>Statistics</h4>
              <div style={styles.statGrid}>
                <div style={styles.detailStatItem}>
                  <div style={styles.detailStatLabel}>HP</div>
                  <div style={styles.detailStatValue}>{selectedHero.currentHP}/{selectedHero.maxHP}</div>
                </div>
                <div style={styles.detailStatItem}>
                  <div style={styles.detailStatLabel}>Attack</div>
                  <div style={styles.detailStatValue}>{selectedHero.ATK}</div>
                </div>
                <div style={styles.detailStatItem}>
                  <div style={styles.detailStatLabel}>Defense</div>
                  <div style={styles.detailStatValue}>{selectedHero.DEF}</div>
                </div>
                <div style={styles.detailStatItem}>
                  <div style={styles.detailStatLabel}>Speed</div>
                  <div style={styles.detailStatValue}>{selectedHero.SPD}</div>
                </div>
              </div>
            </div>

            {/* Talent Points Section - Shows for duplicate heroes */}
            {selectedHero.talentPoints > 0 && (
              <div style={styles.talentSection}>
                <h4 style={styles.talentSectionTitle}>⭐ Talent Points</h4>
                <div style={styles.talentInfo}>
                  <span style={styles.talentCount}>{selectedHero.talentPoints} Points Available</span>
                  <p style={styles.talentDescription}>
                    This hero was summoned multiple times! Talent points can be used in the Talent Tree (Coming Soon).
                  </p>
                </div>
              </div>
            )}

            {selectedHero.description && (
              <div style={styles.detailDescription}>
                <h4 style={styles.descriptionTitle}>Description</h4>
                <p style={styles.descriptionText}>{selectedHero.description}</p>
              </div>
            )}

            {selectedHero.specialAbility && (
              <div style={styles.specialAbilityBox}>
                <h4 style={styles.abilityTitle}>Special Ability</h4>
                <p style={styles.abilityText}>{selectedHero.specialAbility}</p>
              </div>
            )}
          </div>
        </div>
      )}
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
    overflow: 'hidden',
    position: 'relative'
  },
  header: {
    padding: '20px',
    borderBottom: '2px solid #2dd4bf',
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, transparent 100%)'
  },
  title: {
    margin: '0 0 10px 0',
    fontSize: '24px',
    fontWeight: '700'
  },
  collectionStats: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap'
  },
  statText: {
    fontSize: '14px',
    color: '#94a3b8',
    fontWeight: '600'
  },
  controlsSection: {
    display: 'flex',
    gap: '15px',
    padding: '15px 20px',
    background: 'rgba(15, 23, 42, 0.5)',
    borderBottom: '1px solid #334155',
    flexWrap: 'wrap'
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#94a3b8'
  },
  select: {
    padding: '6px 12px',
    fontSize: '14px',
    background: '#334155',
    color: '#f1f5f9',
    border: '1px solid #475569',
    borderRadius: '6px',
    cursor: 'pointer',
    outline: 'none'
  },
  content: {
    flex: 1,
    padding: '20px',
    overflow: 'auto'
  },
  heroesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '15px'
  },
  heroCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: '15px',
    background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
    border: '3px solid',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative'
  },
  heroCardSelected: {
    boxShadow: '0 0 20px rgba(45, 212, 191, 0.6)',
    transform: 'scale(1.03)'
  },
  activeBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    padding: '3px 8px',
    fontSize: '10px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
    color: '#0f172a',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    zIndex: 2
  },
  talentBadge: {
    position: 'absolute',
    top: '40px',
    right: '10px',
    padding: '4px 8px',
    fontSize: '10px',
    fontWeight: '700',
    color: 'white',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.6)',
    zIndex: 1
  },
  rarityBadge: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'white',
    borderRadius: '4px',
    textTransform: 'capitalize',
    zIndex: 1
  },
  heroIcon: {
    fontSize: '48px',
    textAlign: 'center',
    marginBottom: '10px',
    marginTop: '20px'
  },
  heroInfo: {
    textAlign: 'center'
  },
  heroName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: '6px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  heroMeta: {
    fontSize: '12px',
    color: '#94a3b8',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },
  heroClass: {
    textTransform: 'capitalize'
  },
  heroDivider: {
    opacity: 0.5
  },
  heroRole: {
    textTransform: 'capitalize',
    color: '#2dd4bf'
  },
  heroLevel: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#fbbf24',
    marginBottom: '10px'
  },
  statsPreview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '10px',
    background: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '6px',
    marginTop: '10px'
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px'
  },
  statLabel: {
    color: '#94a3b8',
    fontWeight: '600'
  },
  statValue: {
    color: '#f1f5f9',
    fontWeight: '700'
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '40px'
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
  },
  detailPanel: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '350px',
    maxHeight: 'calc(100% - 40px)',
    background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
    border: '2px solid #2dd4bf',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 10
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    borderBottom: '2px solid #2dd4bf',
    background: 'rgba(45, 212, 191, 0.1)'
  },
  detailTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#f1f5f9'
  },
  closeDetailButton: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px'
  },
  detailContent: {
    flex: 1,
    padding: '15px',
    overflow: 'auto'
  },
  detailIconSection: {
    textAlign: 'center',
    marginBottom: '15px',
    position: 'relative'
  },
  detailIcon: {
    fontSize: '80px',
    marginBottom: '10px'
  },
  detailRarityBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '700',
    color: 'white',
    borderRadius: '6px',
    letterSpacing: '0.5px'
  },
  detailInfo: {
    marginBottom: '15px'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid rgba(51, 65, 85, 0.5)'
  },
  detailLabel: {
    fontSize: '14px',
    color: '#94a3b8',
    fontWeight: '600'
  },
  detailValue: {
    fontSize: '14px',
    color: '#f1f5f9',
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  detailStats: {
    marginBottom: '15px'
  },
  statsTitle: {
    margin: '0 0 10px 0',
    fontSize: '16px',
    fontWeight: '700',
    color: '#2dd4bf'
  },
  talentSection: {
    marginBottom: '15px',
    padding: '12px',
    background: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '8px'
  },
  talentSectionTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '700',
    color: '#f59e0b'
  },
  talentInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  talentCount: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#f59e0b'
  },
  talentDescription: {
    margin: 0,
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: '1.5'
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  detailStatItem: {
    padding: '10px',
    background: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '6px',
    textAlign: 'center'
  },
  detailStatLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: '4px'
  },
  detailStatValue: {
    fontSize: '16px',
    color: '#f1f5f9',
    fontWeight: '700'
  },
  detailDescription: {
    marginBottom: '15px'
  },
  descriptionTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: '700',
    color: '#60a5fa'
  },
  descriptionText: {
    margin: 0,
    fontSize: '13px',
    color: '#94a3b8',
    lineHeight: '1.6'
  },
  specialAbilityBox: {
    padding: '12px',
    background: 'rgba(251, 191, 36, 0.1)',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    borderRadius: '8px'
  },
  abilityTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: '700',
    color: '#fbbf24'
  },
  abilityText: {
    margin: 0,
    fontSize: '13px',
    color: '#f1f5f9',
    lineHeight: '1.6'
  }
};
