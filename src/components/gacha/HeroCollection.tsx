/**
 * Hero Collection Component
 *
 * Displays and manages the player's collected heroes with filtering,
 * sorting, and detailed hero information. Shows hero stats, rarity,
 * class, talent points, and active party status.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React, { useState } from 'react';
import type { Hero } from '../../engine/hero/Hero';
import { RARITY_COLORS } from '../../types/hero.types';
import { t } from '../../localization/i18n';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS, SHADOWS, Z_INDEX } from '../../styles/tokens';
import { flexBetween, flexColumn, flexCenter } from '../../styles/common';

/**
 * Props for HeroCollection component
 */
interface HeroCollectionProps {
  /** Array of collected heroes to display */
  heroes: Hero[];
  /** Indices of heroes currently in active party */
  activePartyIndices: number[];
}

type FilterRarity = 'all' | 'common' | 'rare' | 'epic' | 'legendary';
type FilterClass = 'all' | 'warrior' | 'archer' | 'mage' | 'cleric' | 'paladin';
type SortMode = 'level' | 'rarity' | 'name' | 'class';

/**
 * Hero Collection Component
 *
 * Displays all collected heroes with filtering by rarity/class,
 * sorting options, and detailed hero information panel.
 *
 * @param props - Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * <HeroCollection
 *   heroes={collectedHeroes}
 *   activePartyIndices={[0, 1, 2, 3]}
 * />
 * ```
 */
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
        const rarityDiff = (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
        // If same rarity, sort by level (descending)
        if (rarityDiff !== 0) return rarityDiff;
        return b.level - a.level;
      }
      case 'name':
        return a.name.localeCompare(b.name);
      case 'class':
        return a.class.localeCompare(b.class);
      default:
        return 0;
    }
  });

  /**
   * Get emoji icon for hero class
   *
   * @param heroClass - Hero class name
   * @returns Emoji representing the class
   */
  const getClassIcon = (heroClass: string): string => {
    switch (heroClass) {
      case 'warrior': return '⚔️';
      case 'archer': return '🏹';
      case 'mage': return '🔮';
      case 'cleric': return '✨';
      case 'paladin': return '🛡️';
      default: return '❓';
    }
  };

  /**
   * Get emoji icon for hero role
   *
   * @param role - Hero role name
   * @returns Emoji representing the role
   */
  const getRoleIcon = (role: string): string => {
    switch (role) {
      case 'tank': return '🛡️';
      case 'dps': return '⚔️';
      case 'healer': return '💚';
      case 'support': return '✨';
      default: return '❓';
    }
  };

  /**
   * Check if hero is in active party
   *
   * @param heroIndex - Index of hero in heroes array
   * @returns True if hero is in active party
   */
  const isInActiveParty = (heroIndex: number): boolean => {
    return activePartyIndices.includes(heroIndex);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>📖 {t('heroCollection.title')}</h2>
        <div style={styles.collectionStats}>
          <span style={styles.statText}>{t('heroCollection.stats.totalHeroes')} {heroes.length}</span>
          <span style={styles.statText}>{t('heroCollection.stats.activeParty')} {activePartyIndices.length}{t('heroCollection.stats.partySlots')}</span>
        </div>
      </div>

      {/* Filters and Sort */}
      <div style={styles.controlsSection}>
        {/* Rarity Filter */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>{t('heroCollection.filters.rarity')}</label>
          <select
            style={styles.select}
            value={filterRarity}
            onChange={(e) => setFilterRarity(e.target.value as FilterRarity)}
          >
            <option value="all">{t('heroCollection.filters.all')}</option>
            <option value="legendary">{t('heroCollection.rarities.legendary')}</option>
            <option value="epic">{t('heroCollection.rarities.epic')}</option>
            <option value="rare">{t('heroCollection.rarities.rare')}</option>
            <option value="common">{t('heroCollection.rarities.common')}</option>
          </select>
        </div>

        {/* Class Filter */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>{t('heroCollection.filters.class')}</label>
          <select
            style={styles.select}
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value as FilterClass)}
          >
            <option value="all">{t('heroCollection.filters.all')}</option>
            <option value="warrior">{t('heroCollection.classes.warrior')}</option>
            <option value="archer">{t('heroCollection.classes.archer')}</option>
            <option value="mage">{t('heroCollection.classes.mage')}</option>
            <option value="cleric">{t('heroCollection.classes.cleric')}</option>
            <option value="paladin">{t('heroCollection.classes.paladin')}</option>
          </select>
        </div>

        {/* Sort Mode */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>{t('heroCollection.filters.sortBy')}</label>
          <select
            style={styles.select}
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
          >
            <option value="rarity">{t('heroCollection.sortOptions.rarity')}</option>
            <option value="level">{t('heroCollection.sortOptions.level')}</option>
            <option value="name">{t('heroCollection.sortOptions.name')}</option>
            <option value="class">{t('heroCollection.sortOptions.class')}</option>
          </select>
        </div>
      </div>

      {/* Hero Grid */}
      <div style={styles.content}>
        {filteredHeroes.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🎯</div>
            <h3 style={styles.emptyTitle}>{t('heroCollection.empty.title')}</h3>
            <p style={styles.emptyText}>
              {t('heroCollection.empty.message')}
            </p>
          </div>
        ) : (
          <div style={styles.heroesGrid}>
            {filteredHeroes.map((hero) => {
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
                    <div style={styles.activeBadge}>{t('heroCollection.badges.activeParty')}</div>
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
                    <div style={styles.heroLevel}>{t('heroCollection.labels.level')} {hero.level}</div>

                    {/* Stats Preview */}
                    <div style={styles.statsPreview}>
                      <div style={styles.statRow}>
                        <span style={styles.statLabel}>{t('heroCollection.stats.hp')}</span>
                        <span style={styles.statValue}>{hero.currentHP}/{hero.maxHP}</span>
                      </div>
                      <div style={styles.statRow}>
                        <span style={styles.statLabel}>{t('heroCollection.stats.atk')}</span>
                        <span style={styles.statValue}>{hero.ATK}</span>
                      </div>
                      <div style={styles.statRow}>
                        <span style={styles.statLabel}>{t('heroCollection.stats.def')}</span>
                        <span style={styles.statValue}>{hero.DEF}</span>
                      </div>
                      <div style={styles.statRow}>
                        <span style={styles.statLabel}>🏆 {t('heroCollection.stats.score')}</span>
                        <span style={{ ...styles.statValue, color: '#ffd700', fontWeight: 'bold' }}>
                          {hero.getScore().toLocaleString()}
                        </span>
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
                <span style={styles.detailLabel}>{t('heroCollection.details.class')}</span>
                <span style={styles.detailValue}>{selectedHero.class}</span>
              </div>
              {selectedHero.role && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>{t('heroCollection.details.role')}</span>
                  <span style={styles.detailValue}>{selectedHero.role}</span>
                </div>
              )}
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>{t('heroCollection.details.level')}</span>
                <span style={styles.detailValue}>{selectedHero.level}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>{t('heroCollection.details.xp')}</span>
                <span style={styles.detailValue}>
                  {selectedHero.xp}/{selectedHero.xpToNextLevel}
                </span>
              </div>
            </div>

            <div style={styles.detailStats}>
              <h4 style={styles.statsTitle}>{t('heroCollection.details.statisticsTitle')}</h4>
              <div style={styles.statGrid}>
                <div style={styles.detailStatItem}>
                  <div style={styles.detailStatLabel}>{t('heroCollection.detailStats.hp')}</div>
                  <div style={styles.detailStatValue}>{selectedHero.currentHP}/{selectedHero.maxHP}</div>
                </div>
                <div style={styles.detailStatItem}>
                  <div style={styles.detailStatLabel}>{t('heroCollection.detailStats.attack')}</div>
                  <div style={styles.detailStatValue}>{selectedHero.ATK}</div>
                </div>
                <div style={styles.detailStatItem}>
                  <div style={styles.detailStatLabel}>{t('heroCollection.detailStats.defense')}</div>
                  <div style={styles.detailStatValue}>{selectedHero.DEF}</div>
                </div>
                <div style={styles.detailStatItem}>
                  <div style={styles.detailStatLabel}>{t('heroCollection.detailStats.speed')}</div>
                  <div style={styles.detailStatValue}>{selectedHero.SPD}</div>
                </div>
                <div style={styles.detailStatItem}>
                  <div style={styles.detailStatLabel}>🏆 {t('heroCollection.detailStats.heroScore')}</div>
                  <div style={{ ...styles.detailStatValue, color: '#ffd700', fontWeight: 'bold' }}>
                    {selectedHero.getScore().toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Talent Points Section - Shows for duplicate heroes */}
            {selectedHero.talentPoints > 0 && (
              <div style={styles.talentSection}>
                <h4 style={styles.talentSectionTitle}>⭐ {t('heroCollection.talent.title')}</h4>
                <div style={styles.talentInfo}>
                  <span style={styles.talentCount}>{selectedHero.talentPoints} {t('heroCollection.talent.pointsAvailable')}</span>
                  <p style={styles.talentDescription}>
                    {t('heroCollection.talent.description')}
                  </p>
                </div>
              </div>
            )}

            {selectedHero.description && (
              <div style={styles.detailDescription}>
                <h4 style={styles.descriptionTitle}>{t('heroCollection.details.description')}</h4>
                <p style={styles.descriptionText}>{selectedHero.description}</p>
              </div>
            )}

            {selectedHero.specialAbility && (
              <div style={styles.specialAbilityBox}>
                <h4 style={styles.abilityTitle}>{t('heroCollection.details.specialAbility')}</h4>
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
    ...flexColumn,
    width: '100%',
    height: '100%',
    background: `linear-gradient(135deg, ${COLORS.bgSurface} 0%, ${COLORS.bgDarkAlt} 100%)`,
    color: COLORS.textLight,
    overflow: 'hidden',
    position: 'relative'
  },
  header: {
    padding: SPACING[5],
    borderBottom: `2px solid ${COLORS.primary}`,
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, transparent 100%)'
  },
  title: {
    margin: `0 0 ${SPACING[3]} 0`,
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold
  },
  collectionStats: {
    display: 'flex',
    gap: SPACING[5],
    flexWrap: 'wrap'
  },
  statText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textGray,
    fontWeight: FONT_WEIGHT.semibold
  },
  controlsSection: {
    display: 'flex',
    gap: SPACING[4],
    padding: `${SPACING[4]} ${SPACING[5]}`,
    background: 'rgba(15, 23, 42, 0.5)',
    borderBottom: `1px solid ${COLORS.bgSurfaceLight}`,
    flexWrap: 'wrap'
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[2]
  },
  filterLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textGray
  },
  select: {
    padding: `${SPACING[2]} ${SPACING[3]}`,
    fontSize: FONT_SIZE.md,
    background: COLORS.bgSurfaceLight,
    color: COLORS.textLight,
    border: `1px solid ${COLORS.bgSurfaceLighter}`,
    borderRadius: BORDER_RADIUS.md,
    cursor: 'pointer',
    outline: 'none'
  },
  content: {
    flex: 1,
    padding: SPACING[5],
    overflow: 'auto'
  },
  heroesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: SPACING[4]
  },
  heroCard: {
    ...flexColumn,
    padding: SPACING[4],
    background: `linear-gradient(135deg, ${COLORS.bgSurfaceLight} 0%, ${COLORS.bgSurface} 100%)`,
    border: '3px solid',
    borderRadius: BORDER_RADIUS.lg,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase,
    position: 'relative'
  },
  heroCardSelected: {
    boxShadow: SHADOWS.glowTeal,
    transform: 'scale(1.03)'
  },
  activeBadge: {
    position: 'absolute',
    top: SPACING[3],
    right: SPACING[3],
    padding: `${SPACING.xxs} ${SPACING[2]}`,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    color: COLORS.bgDarkAlt,
    borderRadius: BORDER_RADIUS.sm,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    zIndex: 2
  },
  talentBadge: {
    position: 'absolute',
    top: SPACING[10],
    right: SPACING[3],
    padding: `${SPACING[1]} ${SPACING[2]}`,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    background: `linear-gradient(135deg, ${COLORS.warning} 0%, ${COLORS.warningDark} 100%)`,
    boxShadow: SHADOWS.card,
    zIndex: 1
  },
  rarityBadge: {
    position: 'absolute',
    top: SPACING[3],
    left: SPACING[3],
    padding: `${SPACING[1]} ${SPACING[3]}`,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    textTransform: 'capitalize',
    zIndex: 1
  },
  heroIcon: {
    fontSize: FONT_SIZE['6xl'],
    textAlign: 'center',
    marginBottom: SPACING[3],
    marginTop: SPACING[5]
  },
  heroInfo: {
    textAlign: 'center'
  },
  heroName: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textLight,
    marginBottom: SPACING[2],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  heroMeta: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textGray,
    marginBottom: SPACING[1],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2]
  },
  heroClass: {
    textTransform: 'capitalize'
  },
  heroDivider: {
    opacity: 0.5
  },
  heroRole: {
    textTransform: 'capitalize',
    color: COLORS.primary
  },
  heroLevel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.goldLight,
    marginBottom: SPACING[3]
  },
  statsPreview: {
    ...flexColumn,
    gap: SPACING[1],
    padding: SPACING[3],
    background: 'rgba(15, 23, 42, 0.6)',
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING[3]
  },
  statRow: {
    ...flexBetween,
    fontSize: FONT_SIZE.sm
  },
  statLabel: {
    color: COLORS.textGray,
    fontWeight: FONT_WEIGHT.semibold
  },
  statValue: {
    color: COLORS.textLight,
    fontWeight: FONT_WEIGHT.bold
  },
  emptyState: {
    flex: 1,
    ...flexColumn,
    ...flexCenter,
    textAlign: 'center',
    padding: SPACING[10]
  },
  emptyIcon: {
    fontSize: FONT_SIZE['8xl'],
    marginBottom: SPACING[5]
  },
  emptyTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textLight,
    margin: `0 0 ${SPACING[4]} 0`
  },
  emptyText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textGray,
    maxWidth: '400px',
    lineHeight: '1.6',
    margin: 0
  },
  detailPanel: {
    position: 'absolute',
    top: SPACING[5],
    right: SPACING[5],
    width: '350px',
    maxHeight: `calc(100% - ${SPACING[10]})`,
    background: `linear-gradient(135deg, ${COLORS.bgSurfaceLight} 0%, ${COLORS.bgSurface} 100%)`,
    border: `2px solid ${COLORS.primary}`,
    borderRadius: BORDER_RADIUS.lg,
    boxShadow: SHADOWS['2xl'],
    ...flexColumn,
    overflow: 'hidden',
    zIndex: Z_INDEX.dropdown
  },
  detailHeader: {
    ...flexBetween,
    padding: SPACING[4],
    borderBottom: `2px solid ${COLORS.primary}`,
    background: 'rgba(45, 212, 191, 0.1)'
  },
  detailTitle: {
    margin: 0,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textLight
  },
  closeDetailButton: {
    background: COLORS.transparent,
    border: 'none',
    color: COLORS.textGray,
    fontSize: FONT_SIZE.xl,
    cursor: 'pointer',
    padding: `${SPACING[1]} ${SPACING[2]}`
  },
  detailContent: {
    flex: 1,
    padding: SPACING[4],
    overflow: 'auto'
  },
  detailIconSection: {
    textAlign: 'center',
    marginBottom: SPACING[4],
    position: 'relative'
  },
  detailIcon: {
    fontSize: FONT_SIZE['8xl'],
    marginBottom: SPACING[3]
  },
  detailRarityBadge: {
    display: 'inline-block',
    padding: `${SPACING[2]} ${SPACING[3]}`,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    letterSpacing: '0.5px'
  },
  detailInfo: {
    marginBottom: SPACING[4]
  },
  detailRow: {
    ...flexBetween,
    padding: `${SPACING[2]} 0`,
    borderBottom: '1px solid rgba(51, 65, 85, 0.5)'
  },
  detailLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textGray,
    fontWeight: FONT_WEIGHT.semibold
  },
  detailValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
    fontWeight: FONT_WEIGHT.bold,
    textTransform: 'capitalize'
  },
  detailStats: {
    marginBottom: SPACING[4]
  },
  statsTitle: {
    margin: `0 0 ${SPACING[3]} 0`,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary
  },
  talentSection: {
    marginBottom: SPACING[4],
    padding: SPACING[3],
    background: 'rgba(245, 158, 11, 0.1)',
    border: `1px solid rgba(245, 158, 11, 0.3)`,
    borderRadius: BORDER_RADIUS.md
  },
  talentSectionTitle: {
    margin: `0 0 ${SPACING[2]} 0`,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.warning
  },
  talentInfo: {
    ...flexColumn,
    gap: SPACING[2]
  },
  talentCount: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.warning
  },
  talentDescription: {
    margin: 0,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textGray,
    lineHeight: '1.5'
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: SPACING[3]
  },
  detailStatItem: {
    padding: SPACING[3],
    background: 'rgba(15, 23, 42, 0.6)',
    borderRadius: BORDER_RADIUS.md,
    textAlign: 'center'
  },
  detailStatLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textGray,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING[1]
  },
  detailStatValue: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textLight,
    fontWeight: FONT_WEIGHT.bold
  },
  detailDescription: {
    marginBottom: SPACING[4]
  },
  descriptionTitle: {
    margin: `0 0 ${SPACING[2]} 0`,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.infoLight
  },
  descriptionText: {
    margin: 0,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textGray,
    lineHeight: '1.6'
  },
  specialAbilityBox: {
    padding: SPACING[3],
    background: 'rgba(251, 191, 36, 0.1)',
    border: `1px solid rgba(251, 191, 36, 0.3)`,
    borderRadius: BORDER_RADIUS.md
  },
  abilityTitle: {
    margin: `0 0 ${SPACING[2]} 0`,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.goldLight
  },
  abilityText: {
    margin: 0,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    lineHeight: '1.6'
  }
};
