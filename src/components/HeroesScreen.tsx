/**
 * Heroes Screen Component
 *
 * Displays hero collection with party management.
 * Shows all heroes (owned and locked), allows party activation.
 *
 * Contains:
 * - Active Party panel with accordion (4 hero slots)
 * - Hero Collection panel with accordion and class filters
 * - Combat Power display for each hero
 * - Health bars with color-coded HP status
 * - Hero details panel (stats, talents, XP)
 * - Party management (add/remove heroes)
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-16
 */

import React, { useState } from 'react';
import type { Hero } from '../engine/hero/Hero';
import type { HeroClass } from '../types/hero.types';
import { CLASS_ICONS, RARITY_COLORS } from '../types/hero.types';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS, SHADOWS, BLUR, Z_INDEX } from '../styles/tokens';
import { flexColumn, flexCenter, flexBetween } from '../styles/common';
import { t } from '../localization/i18n';

interface HeroesScreenProps {
  heroes: Hero[];
  activeParty: Hero[];
  onPartyChange?: (heroes: Hero[]) => void;
  isInTown?: boolean; // Can only change party in town
}

/**
 * Get health bar color based on HP percentage
 *
 * Returns appropriate gradient color for health bar visualization.
 * Uses design tokens for consistent theming.
 *
 * @param hpPercent - Current HP as percentage (0-1)
 * @returns CSS gradient string for health bar color
 *
 * @example
 * ```typescript
 * const color = getHealthBarColor(0.8); // Returns green gradient
 * const color = getHealthBarColor(0.3); // Returns red gradient
 * ```
 */
function getHealthBarColor(hpPercent: number): string {
  if (hpPercent > 0.6) {
    return `linear-gradient(90deg, ${COLORS.success} 0%, ${COLORS.successDark} 100%)`; // Green
  } else if (hpPercent > 0.4) {
    return `linear-gradient(90deg, ${COLORS.warning} 0%, ${COLORS.warningDark} 100%)`; // Orange
  } else if (hpPercent > 0.2) {
    return `linear-gradient(90deg, ${COLORS.danger} 0%, ${COLORS.dangerDark} 100%)`; // Red
  } else {
    return 'linear-gradient(90deg, #991b1b 0%, #7f1d1d 100%)'; // Dark red (critical)
  }
}

/**
 * Calculate average health percentage of active party
 * @param activeParty - Array of heroes in active party
 * @returns Average health percentage (0-100)
 */
// eslint-disable-next-line react-refresh/only-export-components
export function getPartyAverageHealth(activeParty: Hero[]): number {
  if (!activeParty || activeParty.length === 0) return 100;

  const totalHealthPercent = activeParty.reduce((sum, hero) => {
    return sum + (hero.currentHP / hero.maxHP) * 100;
  }, 0);

  return totalHealthPercent / activeParty.length;
}

/**
 * Heroes Screen Component
 *
 * Main screen for managing hero party and viewing hero collection.
 * Features accordion panels, class filtering, and detailed hero stats.
 *
 * @param props - Component props
 * @param props.heroes - All available heroes
 * @param props.activeParty - Currently active party (max 4 heroes)
 * @param props.onPartyChange - Callback when party composition changes
 * @param props.isInTown - Whether player is in town (party changes only allowed in town)
 * @returns React component
 *
 * @example
 * ```tsx
 * <HeroesScreen
 *   heroes={allHeroes}
 *   activeParty={currentParty}
 *   onPartyChange={handlePartyChange}
 *   isInTown={true}
 * />
 * ```
 */
export function HeroesScreen({
  heroes,
  activeParty,
  onPartyChange,
  isInTown = true
}: HeroesScreenProps) {
  // DEBUG: Log when HeroesScreen renders with new props
  console.log('🎨 HeroesScreen RENDER with props:', {
    heroesCount: heroes.length,
    activePartyCount: activeParty.length,
    heroData: heroes.map(h => ({ name: h.name, level: h.level, xp: h.experience, hp: h.currentHP }))
  });

  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [filterClass, setFilterClass] = useState<HeroClass | 'all'>('all');
  const [activePartyExpanded, setActivePartyExpanded] = useState(true);
  const [collectionExpanded, setCollectionExpanded] = useState(false);

  const maxPartySize = 4;

  const isInParty = (hero: Hero) => {
    return activeParty.some(h => h.id === hero.id);
  };

  const toggleParty = (hero: Hero) => {
    if (!onPartyChange) return;

    // Can only change party in town (e.g., in Tavern)
    if (!isInTown) {
      alert(`⚠️ ${t('heroesScreen.townOnly')}`);
      return;
    }

    if (isInParty(hero)) {
      // Remove from party
      onPartyChange(activeParty.filter(h => h.id !== hero.id));
    } else {
      // Add to party if space available
      if (activeParty.length < maxPartySize) {
        onPartyChange([...activeParty, hero]);
      } else {
        alert(`⚠️ ${t('heroesScreen.partyFull').replace('{max}', maxPartySize.toString())}`);
      }
    }
  };

  let filteredHeroes = filterClass === 'all'
    ? heroes
    : heroes.filter(h => h.class === filterClass);

  // Sort heroes by rarity, then level
  const rarityOrder: Record<string, number> = {
    mythic: 6,
    legendary: 5,
    epic: 4,
    rare: 3,
    uncommon: 2,
    common: 1
  };

  filteredHeroes = filteredHeroes.sort((a, b) => {
    // First by rarity (descending)
    const rarityDiff = (rarityOrder[b.rarity.toLowerCase()] || 0) - (rarityOrder[a.rarity.toLowerCase()] || 0);
    if (rarityDiff !== 0) return rarityDiff;

    // Then by level (descending)
    return b.level - a.level;
  });

  const allClasses: (HeroClass | 'all')[] = ['all', 'warrior', 'archer', 'mage', 'cleric', 'paladin'];

  return (
    <div style={styles.container}>
      {/* Active Party Panel */}
      <div style={styles.partyPanel}>
        <div
          style={styles.accordionHeader}
          onClick={() => setActivePartyExpanded(!activePartyExpanded)}
        >
          <h2 style={styles.partyTitle}>
            <span style={styles.accordionIcon}>{activePartyExpanded ? '▼' : '▶'}</span>
            ⚔️ {t('heroesScreen.activePartyTitle')} ({activeParty.length}/{maxPartySize})
          </h2>
        </div>

        {activePartyExpanded && (
          <div style={styles.accordionContent}>
            <div style={styles.partySlots}>
          {[0, 1, 2, 3].map((index) => {
            const hero = activeParty[index];

            return (
              <div
                key={index}
                style={{
                  ...styles.partySlot,
                  ...(hero ? styles.partySlotFilled : styles.partySlotEmpty)
                }}
                onClick={() => hero && setSelectedHero(hero)}
              >
                {hero ? (
                  <>
                    <div style={styles.partyHeroIcon}>{CLASS_ICONS[hero.class]}</div>
                    <div style={styles.partyHeroName}>{hero.name}</div>
                    <div style={styles.partyHeroCombatPower}>🏆 {hero.getScore()}</div>
                    <div style={styles.partyHeroClass}>{hero.class}</div>
                    <div style={styles.partyHeroLevel}>Level {hero.level}</div>

                    {/* Health Bar */}
                    <div style={styles.healthBarContainer}>
                      <div style={styles.healthBarBackground}>
                        <div
                          style={{
                            ...styles.healthBarFill,
                            width: `${(hero.currentHP / hero.maxHP) * 100}%`,
                            background: getHealthBarColor(hero.currentHP / hero.maxHP)
                          }}
                        />
                      </div>
                      <div style={styles.healthBarText}>
                        {hero.currentHP} / {hero.maxHP}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleParty(hero);
                      }}
                      style={styles.removeButton}
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <div style={styles.partySlotPlaceholder}>{t('heroesScreen.emptySlot')}</div>
                )}
              </div>
            );
          })}
            </div>
          </div>
        )}
      </div>

      {/* Hero Collection */}
      <div style={styles.collectionPanel}>
        <div
          style={styles.accordionHeader}
          onClick={() => setCollectionExpanded(!collectionExpanded)}
        >
          <h2 style={styles.collectionTitle}>
            <span style={styles.accordionIcon}>{collectionExpanded ? '▼' : '▶'}</span>
            📖 {t('heroesScreen.heroCollectionTitle')} ({heroes.length})
          </h2>
        </div>

        {collectionExpanded && (
          <div style={styles.accordionContent}>
            <div style={styles.collectionHeader}>
              {/* Class Filter */}
              <div style={styles.filterContainer}>
            {allClasses.map((cls) => (
              <button
                key={cls}
                onClick={() => setFilterClass(cls)}
                style={{
                  ...styles.filterButton,
                  ...(filterClass === cls ? styles.filterButtonActive : {})
                }}
              >
                {cls === 'all' ? `🌟 ${t('heroesScreen.all')}` : `${CLASS_ICONS[cls]} ${cls}`}
              </button>
            ))}
              </div>
            </div>

            {/* Hero Grid */}
            <div style={styles.heroGrid}>
          {filteredHeroes.map((hero) => {
            const inParty = isInParty(hero);

            return (
              <div
                key={hero.id}
                style={{
                  ...styles.heroCard,
                  ...(selectedHero?.id === hero.id ? styles.heroCardSelected : {}),
                  ...(inParty ? styles.heroCardInParty : {})
                }}
                onClick={() => setSelectedHero(hero)}
              >
                {/* Rarity Badge */}
                <div
                  style={{
                    ...styles.rarityBadge,
                    background: RARITY_COLORS[hero.rarity]
                  }}
                >
                  {hero.rarity}
                </div>

                {/* Talent Points Badge */}
                {hero.talentPoints > 0 && (
                  <div
                    style={{
                      ...styles.talentBadge
                    }}
                  >
                    ⭐ {hero.talentPoints}
                  </div>
                )}

                <div style={styles.heroCardIcon}>{CLASS_ICONS[hero.class]}</div>
                <div style={styles.heroCardName}>{hero.name}</div>
                <div style={styles.heroCardClass}>{hero.class}</div>
                <div style={styles.heroCardLevel}>Level {hero.level}</div>

                <div style={styles.heroCardStats}>
                  <div style={styles.stat}>❤️ {hero.maxHP}</div>
                  <div style={styles.stat}>⚔️ {hero.ATK}</div>
                  <div style={styles.stat}>🛡️ {hero.DEF}</div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleParty(hero);
                  }}
                  style={{
                    ...styles.partyToggleButton,
                    ...(inParty ? styles.partyToggleButtonActive : {})
                  }}
                >
                  {inParty ? `✓ ${t('heroesScreen.inParty')}` : t('heroesScreen.addToParty')}
                </button>
              </div>
            );
          })}
            </div>
          </div>
        )}
      </div>

      {/* Hero Details Panel (when selected) */}
      {selectedHero && (
        <div style={styles.detailsPanel}>
          <div style={styles.detailsHeader}>
            <h3 style={styles.detailsTitle}>
              {CLASS_ICONS[selectedHero.class]} {selectedHero.name}
            </h3>
            <button
              onClick={() => setSelectedHero(null)}
              style={styles.closeButton}
            >
              ✕
            </button>
          </div>

          <div style={styles.detailsContent}>
            <div style={styles.detailsRow}>
              <span style={styles.detailsLabel}>{t('heroesScreen.class')}:</span>
              <span style={styles.detailsValue}>{selectedHero.class}</span>
            </div>
            <div style={styles.detailsRow}>
              <span style={styles.detailsLabel}>{t('stats.level')}:</span>
              <span style={styles.detailsValue}>{selectedHero.level}</span>
            </div>
            <div style={styles.detailsRow}>
              <span style={styles.detailsLabel}>{t('heroesScreen.xp')}:</span>
              <span style={styles.detailsValue}>{selectedHero.xp} / {selectedHero.xpToNextLevel}</span>
            </div>

            {/* Talent Section */}
            {selectedHero.talentPoints > 0 && (
              <div style={styles.talentSection}>
                <h4 style={styles.statsTitle}>⭐ {t('heroesScreen.talentPoints')}</h4>
                <div style={styles.talentInfo}>
                  <span style={styles.talentCount}>
                    {t('heroesScreen.talentPointsAvailable').replace('{count}', selectedHero.talentPoints.toString())}
                  </span>
                  <button style={styles.talentButton}>
                    {t('heroesScreen.talentTree')}
                  </button>
                </div>
              </div>
            )}

            <div style={styles.statsSection}>
              <h4 style={styles.statsTitle}>Stats</h4>
              <div style={styles.detailsRow}>
                <span style={styles.detailsLabel}>❤️ HP:</span>
                <span style={styles.detailsValue}>{selectedHero.maxHP}</span>
              </div>
              <div style={styles.detailsRow}>
                <span style={styles.detailsLabel}>⚔️ ATK:</span>
                <span style={styles.detailsValue}>{selectedHero.ATK}</span>
              </div>
              <div style={styles.detailsRow}>
                <span style={styles.detailsLabel}>🛡️ DEF:</span>
                <span style={styles.detailsValue}>{selectedHero.DEF}</span>
              </div>
              <div style={styles.detailsRow}>
                <span style={styles.detailsLabel}>⚡ SPD:</span>
                <span style={styles.detailsValue}>{selectedHero.SPD}</span>
              </div>
              <div style={styles.detailsRow}>
                <span style={styles.detailsLabel}>💥 CRIT:</span>
                <span style={styles.detailsValue}>{selectedHero.CRIT}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    ...flexColumn,
    height: '100%',
    width: '100%',
    background: `linear-gradient(135deg, ${COLORS.bgDarkSolid} 0%, ${COLORS.bgDarkAlt} 100%)`,
    overflowY: 'auto',
    gap: SPACING[4],
    padding: SPACING.lg,
    boxSizing: 'border-box'
  },
  partyPanel: {
    background: `linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)`,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    border: `1px solid rgba(45, 212, 191, 0.3)`,
    boxShadow: `${SHADOWS.lg}, inset 0 1px 0 rgba(45, 212, 191, 0.1)`
  },
  accordionHeader: {
    cursor: 'pointer',
    userSelect: 'none' as const,
    transition: TRANSITIONS.base
  },
  accordionIcon: {
    display: 'inline-block',
    marginRight: SPACING[2],
    fontSize: FONT_SIZE.lg,
    transition: TRANSITIONS.base,
    color: COLORS.primary
  },
  accordionContent: {
    marginTop: SPACING[4],
    animation: 'fadeIn 0.3s ease-in-out'
  },
  partyTitle: {
    margin: 0,
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '0.3px',
    display: 'flex',
    alignItems: 'center'
  },
  partySlots: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: SPACING[3]
  },
  partySlot: {
    position: 'relative',
    padding: SPACING[4],
    borderRadius: BORDER_RADIUS.lg,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  partySlotFilled: {
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.15) 0%, rgba(20, 184, 166, 0.08) 100%)',
    border: `1px solid rgba(45, 212, 191, 0.5)`,
    boxShadow: `${SHADOWS.md}, inset 0 1px 0 rgba(45, 212, 191, 0.2)`
  },
  partySlotEmpty: {
    background: `linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)`,
    border: `2px dashed rgba(45, 212, 191, 0.2)`
  },
  partySlotPlaceholder: {
    color: COLORS.bgSurfaceLighter,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium
  },
  partyHeroIcon: {
    fontSize: FONT_SIZE['4xl'],
    marginBottom: SPACING[2],
    filter: 'drop-shadow(0 2px 8px rgba(45, 212, 191, 0.4))'
  },
  partyHeroName: {
    fontSize: FONT_SIZE[15],
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textLight,
    marginBottom: SPACING[1],
    letterSpacing: '0.3px'
  },
  partyHeroLevel: {
    fontSize: FONT_SIZE[13],
    color: COLORS.goldLight,
    marginBottom: SPACING[0.75],
    textShadow: '0 0 8px rgba(251, 191, 36, 0.4)'
  },
  partyHeroCombatPower: {
    fontSize: FONT_SIZE[12],
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING[0.75],
    textShadow: '0 0 8px rgba(45, 212, 191, 0.6)',
    letterSpacing: '0.3px'
  },
  partyHeroClass: {
    fontSize: FONT_SIZE[11],
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
    letterSpacing: '0.5px'
  },
  removeButton: {
    position: 'absolute',
    top: SPACING[2],
    right: SPACING[2],
    width: '24px',
    height: '24px',
    borderRadius: BORDER_RADIUS.round,
    border: 'none',
    background: `linear-gradient(135deg, ${COLORS.danger} 0%, ${COLORS.dangerDark} 100%)`,
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    cursor: 'pointer',
    ...flexCenter,
    transition: TRANSITIONS.base,
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
  },
  collectionPanel: {
    background: `linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)`,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    border: `1px solid rgba(45, 212, 191, 0.3)`,
    boxShadow: `${SHADOWS.lg}, inset 0 1px 0 rgba(45, 212, 191, 0.1)`
  },
  collectionHeader: {
    marginBottom: SPACING[4]
  },
  collectionTitle: {
    margin: 0,
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '0.3px',
    display: 'flex',
    alignItems: 'center'
  },
  filterContainer: {
    display: 'flex',
    gap: SPACING[2.5],
    flexWrap: 'wrap'
  },
  filterButton: {
    padding: `${SPACING[2]} ${SPACING[4]}`,
    fontSize: FONT_SIZE[13],
    fontWeight: FONT_WEIGHT.medium,
    background: `linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)`,
    border: `1px solid rgba(45, 212, 191, 0.2)`,
    borderRadius: BORDER_RADIUS.md,
    color: COLORS.textSecondary,
    cursor: 'pointer',
    transition: TRANSITIONS.base,
    textTransform: 'capitalize',
    letterSpacing: '0.3px'
  },
  filterButtonActive: {
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    color: COLORS.bgDarkAlt,
    border: `1px solid ${COLORS.primary}`,
    boxShadow: '0 4px 12px rgba(45, 212, 191, 0.3)',
    fontWeight: FONT_WEIGHT.semibold
  },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
    gap: SPACING[3.5],
    padding: SPACING[1.5]
  },
  heroCard: {
    position: 'relative',
    background: `linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)`,
    border: `1px solid rgba(45, 212, 191, 0.2)`,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[4.5],
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: SHADOWS.md
  },
  rarityBadge: {
    position: 'absolute',
    top: SPACING[2],
    left: SPACING[2],
    padding: `${SPACING[1]} ${SPACING[2.5]}`,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    textTransform: 'capitalize',
    letterSpacing: '0.5px',
    boxShadow: SHADOWS.md,
    zIndex: 1
  },
  talentBadge: {
    position: 'absolute',
    top: SPACING[2],
    right: SPACING[2],
    padding: `${SPACING[1]} ${SPACING[2]}`,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    background: `linear-gradient(135deg, ${COLORS.goldLight} 0%, ${COLORS.goldDark} 100%)`,
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.6)',
    zIndex: 1
  },
  heroCardSelected: {
    border: `1px solid rgba(251, 191, 36, 0.6)`,
    boxShadow: `${SHADOWS.glowGold}, ${SHADOWS.md}`,
    transform: 'translateY(-2px)'
  },
  heroCardInParty: {
    border: `1px solid rgba(45, 212, 191, 0.6)`,
    background: `linear-gradient(135deg, rgba(45, 212, 191, 0.15) 0%, rgba(20, 184, 166, 0.08) 100%)`,
    boxShadow: '0 4px 16px rgba(45, 212, 191, 0.2)'
  },
  heroCardIcon: {
    fontSize: FONT_SIZE['5xl'],
    marginBottom: SPACING[2.5],
    filter: 'drop-shadow(0 2px 8px rgba(45, 212, 191, 0.3))'
  },
  heroCardName: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textLight,
    marginBottom: SPACING[1.25],
    letterSpacing: '0.3px'
  },
  heroCardClass: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
    marginBottom: SPACING[2],
    letterSpacing: '0.5px'
  },
  heroCardLevel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.goldLight,
    marginBottom: SPACING[3],
    textShadow: '0 0 8px rgba(251, 191, 36, 0.4)',
    fontWeight: FONT_WEIGHT.semibold
  },
  heroCardStats: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: SPACING[3],
    padding: `${SPACING[2.5]} 0`,
    borderTop: `1px solid rgba(45, 212, 191, 0.2)`,
    borderBottom: `1px solid rgba(45, 212, 191, 0.2)`
  },
  stat: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textGray,
    fontWeight: FONT_WEIGHT.medium
  },
  partyToggleButton: {
    width: '100%',
    padding: SPACING[2.5],
    fontSize: FONT_SIZE[13],
    fontWeight: FONT_WEIGHT.semibold,
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    border: 'none',
    borderRadius: BORDER_RADIUS.md,
    color: COLORS.bgDarkAlt,
    cursor: 'pointer',
    transition: TRANSITIONS.base,
    boxShadow: '0 4px 12px rgba(45, 212, 191, 0.3)',
    letterSpacing: '0.3px'
  },
  partyToggleButtonActive: {
    background: `linear-gradient(135deg, ${COLORS.danger} 0%, ${COLORS.dangerDark} 100%)`,
    color: COLORS.white,
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
  },
  detailsPanel: {
    position: 'fixed',
    bottom: SPACING[6],
    right: SPACING[6],
    width: '320px',
    maxHeight: '520px',
    background: `linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)`,
    border: `1px solid rgba(45, 212, 191, 0.4)`,
    borderRadius: BORDER_RADIUS.xl,
    boxShadow: `${SHADOWS.xl}, 0 0 0 1px rgba(45, 212, 191, 0.2) inset`,
    backdropFilter: BLUR.lg,
    overflow: 'hidden',
    zIndex: Z_INDEX.modal
  },
  detailsHeader: {
    ...flexBetween,
    padding: `${SPACING[4.5]} ${SPACING.lg}`,
    background: `linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)`,
    borderBottom: `1px solid rgba(45, 212, 191, 0.2)`
  },
  detailsTitle: {
    margin: 0,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '0.3px'
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: BORDER_RADIUS.round,
    border: 'none',
    background: `linear-gradient(135deg, ${COLORS.danger} 0%, ${COLORS.dangerDark} 100%)`,
    color: COLORS.white,
    fontSize: FONT_SIZE.base,
    cursor: 'pointer',
    transition: TRANSITIONS.base,
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
  },
  detailsContent: {
    padding: `${SPACING[4.5]} ${SPACING.lg}`,
    overflowY: 'auto',
    maxHeight: '420px'
  },
  detailsRow: {
    ...flexBetween,
    padding: `${SPACING[2.5]} 0`,
    borderBottom: `1px solid rgba(45, 212, 191, 0.1)`
  },
  detailsLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium
  },
  detailsValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
    fontWeight: FONT_WEIGHT.semibold
  },
  statsSection: {
    marginTop: SPACING[4.5],
    paddingTop: SPACING[4.5],
    borderTop: `1px solid rgba(45, 212, 191, 0.2)`
  },
  statsTitle: {
    margin: `0 0 ${SPACING[3]} 0`,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
    letterSpacing: '0.3px'
  },
  talentSection: {
    marginTop: SPACING[4.5],
    paddingTop: SPACING[4.5],
    borderTop: `1px solid rgba(245, 158, 11, 0.3)`,
    background: `linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING[3]
  },
  talentInfo: {
    ...flexColumn,
    gap: SPACING[2],
    alignItems: 'center'
  },
  talentCount: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.goldLight,
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
  },
  talentButton: {
    padding: `${SPACING[2]} ${SPACING[4]}`,
    background: `linear-gradient(135deg, ${COLORS.textMuted} 0%, #4b5563 100%)`,
    border: `1px solid rgba(156, 163, 175, 0.3)`,
    borderRadius: BORDER_RADIUS.md,
    color: COLORS.textGray,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    cursor: 'not-allowed',
    boxShadow: SHADOWS.sm,
    opacity: 0.7
  },
  healthBarContainer: {
    marginTop: SPACING[2],
    marginBottom: SPACING[2]
  },
  healthBarBackground: {
    width: '100%',
    height: '12px',
    background: 'rgba(15, 23, 42, 0.8)',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    border: `1px solid rgba(45, 212, 191, 0.3)`,
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
  },
  healthBarFill: {
    height: '100%',
    transition: 'width 0.3s ease, background 0.3s ease',
    borderRadius: BORDER_RADIUS.md,
    boxShadow: SHADOWS.glowGreen,
    position: 'relative' as const
  },
  healthBarText: {
    fontSize: FONT_SIZE[11],
    color: COLORS.textGray,
    textAlign: 'center' as const,
    marginTop: SPACING[1],
    fontWeight: FONT_WEIGHT.medium,
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)'
  }
};
