/**
 * Party Manager Component - Manage active party of 4 heroes
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React, { useState } from 'react';
import type { Hero } from '../../engine/hero/Hero';
import { RARITY_COLORS } from '../../types/hero.types';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS, SHADOWS } from '../../styles/tokens';
import { flexColumn, flexCenter } from '../../styles/common';

interface PartyManagerProps {
  heroes: Hero[];
  activePartyIndices: number[];
  onPartyChange: (newPartyIndices: number[]) => void;
}

export function PartyManager({ heroes, activePartyIndices, onPartyChange }: PartyManagerProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const MAX_PARTY_SIZE = 4;

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

  const _getRoleIcon = (role: string) => {
    switch (role) {
      case 'tank': return '🛡️';
      case 'dps': return '⚔️';
      case 'healer': return '💚';
      case 'support': return '✨';
      default: return '❓';
    }
  };

  const handleSlotClick = (slotIndex: number) => {
    setSelectedSlot(slotIndex);
  };

  const handleHeroSelect = (heroIndex: number) => {
    if (selectedSlot === null) {
      showMessage('Please select a party slot first', 'error');
      return;
    }

    // Check if hero is already in party
    const heroAlreadyInParty = activePartyIndices.includes(heroIndex);
    if (heroAlreadyInParty) {
      showMessage('This hero is already in the party', 'error');
      return;
    }

    // Update party
    const newParty = [...activePartyIndices];
    newParty[selectedSlot] = heroIndex;
    onPartyChange(newParty);

    showMessage(`${heroes[heroIndex].name} added to party!`, 'success');
    setSelectedSlot(null);
  };

  const handleRemoveFromParty = (slotIndex: number) => {
    const newParty = [...activePartyIndices];
    newParty.splice(slotIndex, 1);
    onPartyChange(newParty);

    showMessage('Hero removed from party', 'success');
    setSelectedSlot(null);
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // Get available heroes (not in active party)
  const availableHeroes = heroes.filter((_, index) => !activePartyIndices.includes(index));

  // Calculate party stats (filter out invalid indices)
  const validPartyHeroes = activePartyIndices
    .filter(idx => idx !== undefined && heroes[idx] !== undefined)
    .map(idx => heroes[idx]);

  const partyStats = {
    totalHP: validPartyHeroes.reduce((sum, hero) => sum + hero.maxHP, 0),
    totalAttack: validPartyHeroes.reduce((sum, hero) => sum + hero.ATK, 0),
    totalDefense: validPartyHeroes.reduce((sum, hero) => sum + hero.DEF, 0),
    avgLevel: validPartyHeroes.length > 0
      ? Math.round(validPartyHeroes.reduce((sum, hero) => sum + hero.level, 0) / validPartyHeroes.length)
      : 0
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>⚔️ Party Manager</h2>
      </div>

      {/* Message Banner */}
      {message && (
        <div style={{
          ...styles.messageBanner,
          ...(message.type === 'success' ? styles.successBanner : styles.errorBanner)
        }}>
          {message.text}
        </div>
      )}

      <div style={styles.content}>
        {/* Active Party Section */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Active Party ({activePartyIndices.length}/{MAX_PARTY_SIZE})</h3>

          {/* Party Slots */}
          <div style={styles.partySlots}>
            {Array.from({ length: MAX_PARTY_SIZE }).map((_, slotIndex) => {
              const heroIndex = activePartyIndices[slotIndex];
              const hero = heroIndex !== undefined ? heroes[heroIndex] : null;
              const isSelected = selectedSlot === slotIndex;

              return (
                <div
                  key={slotIndex}
                  style={{
                    ...styles.partySlot,
                    ...(isSelected && styles.partySlotSelected),
                    ...(hero && { borderColor: RARITY_COLORS[hero.rarity] })
                  }}
                  onClick={() => handleSlotClick(slotIndex)}
                >
                  {isSelected && (
                    <div style={styles.selectedIndicator}>SELECT HERO</div>
                  )}

                  {hero ? (
                    <>
                      <div style={styles.slotNumber}>Slot {slotIndex + 1}</div>

                      {/* Talent Points Badge */}
                      {hero.talentPoints > 0 && (
                        <div style={styles.talentBadgeSlot}>
                          ⭐ {hero.talentPoints}
                        </div>
                      )}

                      <div style={styles.heroIconMedium}>{getClassIcon(hero.class)}</div>
                      <div style={styles.heroNameMedium}>{hero.name}</div>
                      <div
                        style={{
                          padding: `${SPACING[0.75]} ${SPACING[2]}`,
                          fontSize: FONT_SIZE.xs,
                          fontWeight: FONT_WEIGHT.bold,
                          color: COLORS.white,
                          borderRadius: BORDER_RADIUS.sm,
                          textTransform: 'capitalize',
                          background: RARITY_COLORS[hero.rarity],
                          boxShadow: SHADOWS.sm,
                          marginBottom: SPACING[1]
                        }}
                      >
                        {hero.rarity}
                      </div>
                      <div style={styles.heroMetaSmall}>
                        <span>{hero.class}</span>
                        <span style={styles.heroDivider}>•</span>
                        <span>Lv.{hero.level}</span>
                      </div>

                      <button
                        style={styles.removeButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromParty(slotIndex);
                        }}
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <div style={styles.emptySlot}>
                      <div style={styles.emptySlotIcon}>➕</div>
                      <div style={styles.emptySlotText}>Empty Slot</div>
                      <div style={styles.slotNumberEmpty}>Slot {slotIndex + 1}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Party Stats */}
          {activePartyIndices.length > 0 && (
            <div style={styles.partyStats}>
              <h4 style={styles.statsTitle}>Party Statistics</h4>
              <div style={styles.statsGrid}>
                <div style={styles.statItem}>
                  <div style={styles.statLabel}>Total HP</div>
                  <div style={styles.statValue}>{partyStats.totalHP}</div>
                </div>
                <div style={styles.statItem}>
                  <div style={styles.statLabel}>Total ATK</div>
                  <div style={styles.statValue}>{partyStats.totalAttack}</div>
                </div>
                <div style={styles.statItem}>
                  <div style={styles.statLabel}>Total DEF</div>
                  <div style={styles.statValue}>{partyStats.totalDefense}</div>
                </div>
                <div style={styles.statItem}>
                  <div style={styles.statLabel}>Avg Level</div>
                  <div style={styles.statValue}>{partyStats.avgLevel}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Available Heroes Section */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            Available Heroes ({availableHeroes.length})
            {selectedSlot !== null && (
              <span style={styles.selectionHint}> - Select hero for Slot {selectedSlot + 1}</span>
            )}
          </h3>

          {availableHeroes.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🎯</div>
              <p style={styles.emptyText}>
                All heroes are in the active party!
              </p>
            </div>
          ) : (
            <div style={styles.heroesGrid}>
              {availableHeroes.map((hero) => {
                const heroIndex = heroes.indexOf(hero);

                return (
                  <div
                    key={hero.id}
                    style={{
                      ...styles.heroCard,
                      borderColor: RARITY_COLORS[hero.rarity],
                      ...(selectedSlot !== null && styles.heroCardSelectable)
                    }}
                    onClick={() => selectedSlot !== null && handleHeroSelect(heroIndex)}
                  >
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
                      <div style={styles.talentBadge}>
                        ⭐ {hero.talentPoints}
                      </div>
                    )}

                    <div style={styles.heroIcon}>{getClassIcon(hero.class)}</div>

                    <div style={styles.heroInfo}>
                      <div style={styles.heroName}>{hero.name}</div>
                      <div style={styles.heroMeta}>
                        <span>{hero.class}</span>
                        <span style={styles.heroDivider}>•</span>
                        <span>Lv.{hero.level}</span>
                      </div>

                      <div style={styles.miniStats}>
                        <div style={styles.miniStat}>
                          <span>HP:</span> {hero.maxHP}
                        </div>
                        <div style={styles.miniStat}>
                          <span>ATK:</span> {hero.ATK}
                        </div>
                        <div style={styles.miniStat}>
                          <span>DEF:</span> {hero.DEF}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div style={styles.infoBox}>
          <h4 style={styles.infoTitle}>Party Management</h4>
          <p style={styles.infoText}>
            • Maximum party size: <strong>{MAX_PARTY_SIZE} heroes</strong>
          </p>
          <p style={styles.infoText}>
            • Click on a party slot to select it
          </p>
          <p style={styles.infoText}>
            • Then click on an available hero to add them to that slot
          </p>
          <p style={styles.infoText}>
            • Build a balanced party with tanks, DPS, healers, and support
          </p>
        </div>
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
    textAlign: 'center'
  },
  messageBanner: {
    padding: `${SPACING[3]} ${SPACING.lg}`,
    textAlign: 'center',
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT_SIZE.md
  },
  successBanner: {
    background: 'rgba(16, 185, 129, 0.2)',
    color: COLORS.success,
    borderBottom: `2px solid ${COLORS.success}`
  },
  errorBanner: {
    background: 'rgba(239, 68, 68, 0.2)',
    color: COLORS.danger,
    borderBottom: `2px solid ${COLORS.danger}`
  },
  content: {
    flex: 1,
    ...flexColumn,
    gap: SPACING.lg,
    padding: SPACING.lg,
    overflow: 'auto'
  },
  section: {
    ...flexColumn,
    gap: SPACING[3.75]
  },
  sectionTitle: {
    margin: 0,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textLight
  },
  selectionHint: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary
  },
  partySlots: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: SPACING[3.75]
  },
  partySlot: {
    position: 'relative',
    ...flexColumn,
    alignItems: 'center',
    padding: SPACING[3.75],
    background: `linear-gradient(135deg, ${COLORS.bgSurfaceLight} 0%, ${COLORS.bgSurface} 100%)`,
    border: `3px solid ${COLORS.bgSurfaceLighter}`,
    borderRadius: BORDER_RADIUS.lg,
    cursor: 'pointer',
    transition: TRANSITIONS.base,
    minHeight: '200px'
  },
  partySlotSelected: {
    boxShadow: SHADOWS.glowTeal,
    transform: 'scale(1.03)',
    borderColor: COLORS.primary
  },
  selectedIndicator: {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: `${SPACING[1]} ${SPACING[3]}`,
    fontSize: FONT_SIZE[11],
    fontWeight: FONT_WEIGHT.bold,
    background: COLORS.primary,
    color: COLORS.bgDarkAlt,
    borderRadius: BORDER_RADIUS.sm,
    letterSpacing: '0.5px',
    zIndex: 2
  },
  slotNumber: {
    position: 'absolute',
    top: SPACING[2],
    left: SPACING[2],
    fontSize: FONT_SIZE[11],
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  slotNumberEmpty: {
    fontSize: FONT_SIZE[11],
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: SPACING[2]
  },
  heroIconMedium: {
    fontSize: FONT_SIZE['6xl'],
    marginBottom: SPACING[2],
    marginTop: SPACING.lg
  },
  heroNameMedium: {
    fontSize: FONT_SIZE[15],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textLight,
    marginBottom: SPACING[1],
    textAlign: 'center'
  },
  heroMetaSmall: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING[1],
    display: 'flex',
    gap: SPACING[1.5],
    textTransform: 'capitalize'
  },
  heroRoleSmall: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    textTransform: 'capitalize',
    marginBottom: SPACING[2.5]
  },
  heroDivider: {
    opacity: 0.5
  },
  removeButton: {
    padding: `${SPACING[1.5]} ${SPACING[4]}`,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    background: 'rgba(239, 68, 68, 0.2)',
    color: COLORS.danger,
    border: `1px solid rgba(239, 68, 68, 0.3)`,
    borderRadius: BORDER_RADIUS.md,
    cursor: 'pointer',
    transition: TRANSITIONS.base
  },
  emptySlot: {
    ...flexColumn,
    ...flexCenter,
    flex: 1,
    width: '100%'
  },
  emptySlotIcon: {
    fontSize: FONT_SIZE['6xl'],
    color: COLORS.bgSurfaceLighter,
    marginBottom: SPACING[2]
  },
  emptySlotText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.semibold
  },
  partyStats: {
    padding: SPACING[3.75],
    background: 'rgba(45, 212, 191, 0.1)',
    border: `1px solid rgba(45, 212, 191, 0.3)`,
    borderRadius: BORDER_RADIUS.md
  },
  statsTitle: {
    margin: `0 0 ${SPACING[3]} 0`,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: SPACING[3]
  },
  statItem: {
    padding: SPACING[2.5],
    background: 'rgba(15, 23, 42, 0.6)',
    borderRadius: BORDER_RADIUS.md,
    textAlign: 'center'
  },
  statLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING[1]
  },
  statValue: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textLight,
    fontWeight: FONT_WEIGHT.bold
  },
  heroesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: SPACING[3]
  },
  heroCard: {
    ...flexColumn,
    padding: SPACING[3],
    background: `linear-gradient(135deg, ${COLORS.bgSurfaceLight} 0%, ${COLORS.bgSurface} 100%)`,
    border: '2px solid',
    borderRadius: BORDER_RADIUS.lg,
    position: 'relative',
    transition: TRANSITIONS.base
  },
  heroCardSelectable: {
    cursor: 'pointer'
  },
  rarityBadge: {
    position: 'absolute',
    top: SPACING[2],
    left: SPACING[2],
    padding: `${SPACING[0.75]} ${SPACING[2]}`,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    textTransform: 'capitalize',
    zIndex: 1
  },
  talentBadge: {
    position: 'absolute',
    top: SPACING[2],
    right: SPACING[2],
    padding: `${SPACING[0.75]} ${SPACING[2]}`,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    background: `linear-gradient(135deg, ${COLORS.goldLight} 0%, ${COLORS.goldDark} 100%)`,
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.6)',
    zIndex: 1
  },
  talentBadgeSlot: {
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
  heroIcon: {
    fontSize: FONT_SIZE['5xl'],
    textAlign: 'center',
    marginBottom: SPACING[2],
    marginTop: SPACING[3.75]
  },
  heroInfo: {
    textAlign: 'center'
  },
  heroName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textLight,
    marginBottom: SPACING[1],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  heroMeta: {
    fontSize: FONT_SIZE[11],
    color: COLORS.textSecondary,
    marginBottom: SPACING[1],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[1]
  },
  heroRole: {
    fontSize: FONT_SIZE[11],
    color: COLORS.primary,
    textTransform: 'capitalize',
    marginBottom: SPACING[2]
  },
  miniStats: {
    ...flexColumn,
    gap: SPACING[0.75],
    padding: SPACING[2],
    background: 'rgba(15, 23, 42, 0.6)',
    borderRadius: BORDER_RADIUS.sm,
    fontSize: FONT_SIZE[11]
  },
  miniStat: {
    display: 'flex',
    justifyContent: 'space-between',
    color: COLORS.textLight
  },
  emptyState: {
    textAlign: 'center',
    padding: SPACING[7.5]
  },
  emptyIcon: {
    fontSize: FONT_SIZE['8xl'],
    marginBottom: SPACING[3.75]
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    margin: 0
  },
  infoBox: {
    padding: `${SPACING[3.75]} ${SPACING.lg}`,
    background: 'rgba(59, 130, 246, 0.1)',
    border: `1px solid rgba(59, 130, 246, 0.3)`,
    borderRadius: BORDER_RADIUS.md
  },
  infoTitle: {
    margin: `0 0 ${SPACING[2.5]} 0`,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.info
  },
  infoText: {
    margin: `${SPACING[1.25]} 0`,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    lineHeight: '1.6'
  }
};
