/**
 * Party Manager Component - Manage active party of 4 heroes
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import React, { useState } from 'react';
import type { Hero } from '../../engine/hero/Hero';
import { RARITY_COLORS } from '../../types/hero.types';

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

  const getRoleIcon = (role: string) => {
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
                          padding: '3px 8px',
                          fontSize: '10px',
                          fontWeight: '700',
                          color: 'white',
                          borderRadius: '4px',
                          textTransform: 'capitalize',
                          background: RARITY_COLORS[hero.rarity],
                          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
                          marginBottom: '4px'
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
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    color: '#f1f5f9',
    overflow: 'hidden'
  },
  header: {
    padding: '20px',
    borderBottom: '2px solid #2dd4bf',
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, transparent 100%)'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    textAlign: 'center'
  },
  messageBanner: {
    padding: '12px 20px',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '14px'
  },
  successBanner: {
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#10b981',
    borderBottom: '2px solid #10b981'
  },
  errorBanner: {
    background: 'rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    borderBottom: '2px solid #ef4444'
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '20px',
    overflow: 'auto'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  sectionTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#f1f5f9'
  },
  selectionHint: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2dd4bf'
  },
  partySlots: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  partySlot: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '15px',
    background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
    border: '3px solid #475569',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minHeight: '200px'
  },
  partySlotSelected: {
    boxShadow: '0 0 20px rgba(45, 212, 191, 0.6)',
    transform: 'scale(1.03)',
    borderColor: '#2dd4bf'
  },
  selectedIndicator: {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '4px 12px',
    fontSize: '11px',
    fontWeight: '700',
    background: '#2dd4bf',
    color: '#0f172a',
    borderRadius: '4px',
    letterSpacing: '0.5px',
    zIndex: 2
  },
  slotNumber: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  slotNumberEmpty: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '8px'
  },
  heroIconMedium: {
    fontSize: '48px',
    marginBottom: '8px',
    marginTop: '20px'
  },
  heroNameMedium: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: '4px',
    textAlign: 'center'
  },
  heroMetaSmall: {
    fontSize: '12px',
    color: '#94a3b8',
    marginBottom: '4px',
    display: 'flex',
    gap: '6px',
    textTransform: 'capitalize'
  },
  heroRoleSmall: {
    fontSize: '12px',
    color: '#2dd4bf',
    textTransform: 'capitalize',
    marginBottom: '10px'
  },
  heroDivider: {
    opacity: 0.5
  },
  removeButton: {
    padding: '6px 16px',
    fontSize: '12px',
    fontWeight: '700',
    background: 'rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  emptySlot: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%'
  },
  emptySlotIcon: {
    fontSize: '48px',
    color: '#475569',
    marginBottom: '8px'
  },
  emptySlotText: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '600'
  },
  partyStats: {
    padding: '15px',
    background: 'rgba(45, 212, 191, 0.1)',
    border: '1px solid rgba(45, 212, 191, 0.3)',
    borderRadius: '8px'
  },
  statsTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: '700',
    color: '#2dd4bf'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px'
  },
  statItem: {
    padding: '10px',
    background: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '6px',
    textAlign: 'center'
  },
  statLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: '4px'
  },
  statValue: {
    fontSize: '18px',
    color: '#f1f5f9',
    fontWeight: '700'
  },
  heroesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '12px'
  },
  heroCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px',
    background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
    border: '2px solid',
    borderRadius: '10px',
    position: 'relative',
    transition: 'all 0.2s'
  },
  heroCardSelectable: {
    cursor: 'pointer'
  },
  rarityBadge: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    padding: '3px 8px',
    fontSize: '10px',
    fontWeight: '700',
    color: 'white',
    borderRadius: '4px',
    textTransform: 'capitalize',
    zIndex: 1
  },
  talentBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    padding: '3px 8px',
    fontSize: '10px',
    fontWeight: '700',
    color: 'white',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.6)',
    zIndex: 1
  },
  talentBadgeSlot: {
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
  heroIcon: {
    fontSize: '40px',
    textAlign: 'center',
    marginBottom: '8px',
    marginTop: '15px'
  },
  heroInfo: {
    textAlign: 'center'
  },
  heroName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  heroMeta: {
    fontSize: '11px',
    color: '#94a3b8',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  },
  heroRole: {
    fontSize: '11px',
    color: '#2dd4bf',
    textTransform: 'capitalize',
    marginBottom: '8px'
  },
  miniStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    padding: '8px',
    background: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '4px',
    fontSize: '11px'
  },
  miniStat: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#f1f5f9'
  },
  emptyState: {
    textAlign: 'center',
    padding: '30px'
  },
  emptyIcon: {
    fontSize: '60px',
    marginBottom: '15px'
  },
  emptyText: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: 0
  },
  infoBox: {
    padding: '15px 20px',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '8px'
  },
  infoTitle: {
    margin: '0 0 10px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#60a5fa'
  },
  infoText: {
    margin: '5px 0',
    fontSize: '14px',
    color: '#94a3b8',
    lineHeight: '1.6'
  }
};
