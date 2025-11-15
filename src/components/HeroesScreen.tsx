/**
 * Heroes Screen Component
 *
 * Displays hero collection with party management.
 * Shows all heroes (owned and locked), allows party activation.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-08
 */

import React, { useState } from 'react';
import type { Hero } from '../engine/hero/Hero';
import type { HeroClass } from '../types/hero.types';
import { CLASS_ICONS, RARITY_COLORS } from '../types/hero.types';

interface HeroesScreenProps {
  heroes: Hero[];
  activeParty: Hero[];
  onPartyChange?: (heroes: Hero[]) => void;
  isInTown?: boolean; // Can only change party in town
}

/**
 * Get health bar color based on HP percentage
 */
function getHealthBarColor(hpPercent: number): string {
  if (hpPercent > 0.6) {
    return 'linear-gradient(90deg, #10b981 0%, #059669 100%)'; // Green
  } else if (hpPercent > 0.4) {
    return 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'; // Orange
  } else if (hpPercent > 0.2) {
    return 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'; // Red
  } else {
    return 'linear-gradient(90deg, #991b1b 0%, #7f1d1d 100%)'; // Dark red
  }
}

/**
 * Calculate average health percentage of active party
 * @param activeParty - Array of heroes in active party
 * @returns Average health percentage (0-100)
 */
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
 * @param props - Component props
 * @returns React component
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

  const maxPartySize = 4;

  const isInParty = (hero: Hero) => {
    return activeParty.some(h => h.id === hero.id);
  };

  const toggleParty = (hero: Hero) => {
    if (!onPartyChange) return;

    // Can only change party in town (e.g., in Tavern)
    if (!isInTown) {
      alert('⚠️ You can only change your party in town (visit the Tavern)!');
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
        alert(`⚠️ Party is full! Maximum ${maxPartySize} heroes allowed.`);
      }
    }
  };

  const filteredHeroes = filterClass === 'all'
    ? heroes
    : heroes.filter(h => h.class === filterClass);

  const allClasses: (HeroClass | 'all')[] = ['all', 'warrior', 'archer', 'mage', 'cleric', 'paladin'];

  return (
    <div style={styles.container}>
      {/* Active Party Panel */}
      <div style={styles.partyPanel}>
        <h2 style={styles.partyTitle}>⚔️ Active Party ({activeParty.length}/{maxPartySize})</h2>
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
                  <div style={styles.partySlotPlaceholder}>Empty Slot</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hero Collection */}
      <div style={styles.collectionPanel}>
        <div style={styles.collectionHeader}>
          <h2 style={styles.collectionTitle}>📖 Hero Collection ({heroes.length})</h2>

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
                {cls === 'all' ? '🌟 All' : `${CLASS_ICONS[cls]} ${cls}`}
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
                  {inParty ? '✓ In Party' : '+ Add to Party'}
                </button>
              </div>
            );
          })}
        </div>
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
              <span style={styles.detailsLabel}>Class:</span>
              <span style={styles.detailsValue}>{selectedHero.class}</span>
            </div>
            <div style={styles.detailsRow}>
              <span style={styles.detailsLabel}>Level:</span>
              <span style={styles.detailsValue}>{selectedHero.level}</span>
            </div>
            <div style={styles.detailsRow}>
              <span style={styles.detailsLabel}>XP:</span>
              <span style={styles.detailsValue}>{selectedHero.xp} / {selectedHero.xpToNextLevel}</span>
            </div>

            {/* Talent Section */}
            {selectedHero.talentPoints > 0 && (
              <div style={styles.talentSection}>
                <h4 style={styles.statsTitle}>⭐ Talent Points</h4>
                <div style={styles.talentInfo}>
                  <span style={styles.talentCount}>{selectedHero.talentPoints} Points Available</span>
                  <button style={styles.talentButton}>
                    Talent Tree (Coming Soon)
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
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 100%)',
    overflow: 'hidden',
    gap: '16px',
    padding: '20px',
    boxSizing: 'border-box'
  },
  partyPanel: {
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid rgba(45, 212, 191, 0.3)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(45, 212, 191, 0.1)'
  },
  partyTitle: {
    margin: '0 0 16px 0',
    fontSize: '22px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '0.3px'
  },
  partySlots: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '12px'
  },
  partySlot: {
    position: 'relative',
    padding: '16px',
    borderRadius: '12px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  partySlotFilled: {
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.15) 0%, rgba(20, 184, 166, 0.08) 100%)',
    border: '1px solid rgba(45, 212, 191, 0.5)',
    boxShadow: '0 4px 16px rgba(45, 212, 191, 0.2), inset 0 1px 0 rgba(45, 212, 191, 0.2)'
  },
  partySlotEmpty: {
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
    border: '2px dashed rgba(45, 212, 191, 0.2)'
  },
  partySlotPlaceholder: {
    color: '#475569',
    fontSize: '14px',
    fontWeight: '500'
  },
  partyHeroIcon: {
    fontSize: '36px',
    marginBottom: '8px',
    filter: 'drop-shadow(0 2px 8px rgba(45, 212, 191, 0.4))'
  },
  partyHeroName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: '4px',
    letterSpacing: '0.3px'
  },
  partyHeroLevel: {
    fontSize: '13px',
    color: '#fbbf24',
    marginBottom: '3px',
    textShadow: '0 0 8px rgba(251, 191, 36, 0.4)'
  },
  partyHeroClass: {
    fontSize: '11px',
    color: '#94a3b8',
    textTransform: 'capitalize',
    letterSpacing: '0.5px'
  },
  removeButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: 'none',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
  },
  collectionPanel: {
    flex: 1,
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid rgba(45, 212, 191, 0.3)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(45, 212, 191, 0.1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  collectionHeader: {
    marginBottom: '16px'
  },
  collectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '22px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '0.3px'
  },
  filterContainer: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  filterButton: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '500',
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
    border: '1px solid rgba(45, 212, 191, 0.2)',
    borderRadius: '8px',
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textTransform: 'capitalize',
    letterSpacing: '0.3px'
  },
  filterButtonActive: {
    background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
    color: '#0f172a',
    border: '1px solid #2dd4bf',
    boxShadow: '0 4px 12px rgba(45, 212, 191, 0.3)',
    fontWeight: '600'
  },
  heroGrid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
    gap: '14px',
    overflowY: 'auto',
    padding: '6px'
  },
  heroCard: {
    position: 'relative',
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
    border: '1px solid rgba(45, 212, 191, 0.2)',
    borderRadius: '12px',
    padding: '18px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
  },
  rarityBadge: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    padding: '4px 10px',
    fontSize: '10px',
    fontWeight: '700',
    color: 'white',
    borderRadius: '6px',
    textTransform: 'capitalize',
    letterSpacing: '0.5px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    zIndex: 1
  },
  talentBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    padding: '4px 8px',
    fontSize: '10px',
    fontWeight: '700',
    color: 'white',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.6)',
    zIndex: 1
  },
  heroCardSelected: {
    border: '1px solid rgba(251, 191, 36, 0.6)',
    boxShadow: '0 0 20px rgba(251, 191, 36, 0.4), 0 4px 16px rgba(0, 0, 0, 0.4)',
    transform: 'translateY(-2px)'
  },
  heroCardInParty: {
    border: '1px solid rgba(45, 212, 191, 0.6)',
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.15) 0%, rgba(20, 184, 166, 0.08) 100%)',
    boxShadow: '0 4px 16px rgba(45, 212, 191, 0.2)'
  },
  heroCardIcon: {
    fontSize: '44px',
    marginBottom: '10px',
    filter: 'drop-shadow(0 2px 8px rgba(45, 212, 191, 0.3))'
  },
  heroCardName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: '5px',
    letterSpacing: '0.3px'
  },
  heroCardClass: {
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'capitalize',
    marginBottom: '8px',
    letterSpacing: '0.5px'
  },
  heroCardLevel: {
    fontSize: '14px',
    color: '#fbbf24',
    marginBottom: '12px',
    textShadow: '0 0 8px rgba(251, 191, 36, 0.4)',
    fontWeight: '600'
  },
  heroCardStats: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '12px',
    padding: '10px 0',
    borderTop: '1px solid rgba(45, 212, 191, 0.2)',
    borderBottom: '1px solid rgba(45, 212, 191, 0.2)'
  },
  stat: {
    fontSize: '12px',
    color: '#cbd5e1',
    fontWeight: '500'
  },
  partyToggleButton: {
    width: '100%',
    padding: '10px',
    fontSize: '13px',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#0f172a',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(45, 212, 191, 0.3)',
    letterSpacing: '0.3px'
  },
  partyToggleButtonActive: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
  },
  detailsPanel: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '320px',
    maxHeight: '520px',
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
    border: '1px solid rgba(45, 212, 191, 0.4)',
    borderRadius: '16px',
    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(45, 212, 191, 0.2) inset',
    backdropFilter: 'blur(20px)',
    overflow: 'hidden',
    zIndex: 100
  },
  detailsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 20px',
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)',
    borderBottom: '1px solid rgba(45, 212, 191, 0.2)'
  },
  detailsTitle: {
    margin: 0,
    fontSize: '19px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '0.3px'
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
  },
  detailsContent: {
    padding: '18px 20px',
    overflowY: 'auto',
    maxHeight: '420px'
  },
  detailsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid rgba(45, 212, 191, 0.1)'
  },
  detailsLabel: {
    fontSize: '14px',
    color: '#94a3b8',
    fontWeight: '500'
  },
  detailsValue: {
    fontSize: '14px',
    color: '#f1f5f9',
    fontWeight: '600'
  },
  statsSection: {
    marginTop: '18px',
    paddingTop: '18px',
    borderTop: '1px solid rgba(45, 212, 191, 0.2)'
  },
  statsTitle: {
    margin: '0 0 12px 0',
    fontSize: '17px',
    fontWeight: '600',
    color: '#2dd4bf',
    letterSpacing: '0.3px'
  },
  talentSection: {
    marginTop: '18px',
    paddingTop: '18px',
    borderTop: '1px solid rgba(245, 158, 11, 0.3)',
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
    borderRadius: '8px',
    padding: '12px'
  },
  talentInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'center'
  },
  talentCount: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f59e0b',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
  },
  talentButton: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
    border: '1px solid rgba(156, 163, 175, 0.3)',
    borderRadius: '6px',
    color: '#d1d5db',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'not-allowed',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
    opacity: 0.7
  },
  healthBarContainer: {
    marginTop: '8px',
    marginBottom: '8px'
  },
  healthBarBackground: {
    width: '100%',
    height: '12px',
    background: 'rgba(15, 23, 42, 0.8)',
    borderRadius: '6px',
    overflow: 'hidden',
    border: '1px solid rgba(45, 212, 191, 0.3)',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
  },
  healthBarFill: {
    height: '100%',
    transition: 'width 0.3s ease, background 0.3s ease',
    borderRadius: '6px',
    boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
    position: 'relative' as const
  },
  healthBarText: {
    fontSize: '11px',
    color: '#cbd5e1',
    textAlign: 'center' as const,
    marginTop: '4px',
    fontWeight: '500',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)'
  }
};
