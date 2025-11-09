/**
 * Healer Building Component - HP restoration services
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import React, { useState } from 'react';
import type { Hero } from '../../engine/hero/Hero';
import { TownService } from '../../services/TownService';

interface HealerBuildingProps {
  heroes: Hero[];
  playerGold: number;
  onClose: () => void;
  onHeroesChange: (heroes: Hero[]) => void;
  onGoldChange: (newGold: number) => void;
}

export function HealerBuilding({
  heroes,
  playerGold,
  onClose,
  onHeroesChange,
  onGoldChange
}: HealerBuildingProps) {
  const [selectedHeroIndex, setSelectedHeroIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleHealHero = (heroIndex: number) => {
    const hero = heroes[heroIndex];
    const cost = TownService.calculateHealCost(hero);

    if (cost === 0) {
      setMessage({ text: `${hero.name} is already at full HP!`, type: 'error' });
      return;
    }

    const result = TownService.healHero(hero, cost, playerGold);

    if (result.success) {
      onGoldChange(result.newGold);
      onHeroesChange([...heroes]); // Trigger re-render
      setMessage({ text: result.message, type: 'success' });
    } else {
      setMessage({ text: result.message, type: 'error' });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  const handleHealParty = () => {
    const cost = TownService.calculatePartyHealCost(heroes);

    if (cost === 0) {
      setMessage({ text: 'All heroes are already at full HP!', type: 'error' });
      return;
    }

    const result = TownService.healParty(heroes, cost, playerGold);

    if (result.success) {
      onGoldChange(result.newGold);
      onHeroesChange([...heroes]); // Trigger re-render
      setMessage({ text: result.message, type: 'success' });
    } else {
      setMessage({ text: result.message, type: 'error' });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  const partyHealCost = TownService.calculatePartyHealCost(heroes);
  const canAffordPartyHeal = playerGold >= partyHealCost && partyHealCost > 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>⛑️ Healer</h2>
        <button style={styles.closeButton} onClick={onClose}>✕</button>
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

      {/* Resources Display */}
      <div style={styles.resourcesBar}>
        <div style={styles.resourceItem}>
          <span style={styles.resourceIcon}>💰</span>
          <span style={styles.resourceValue}>{playerGold.toLocaleString()}g</span>
        </div>
      </div>

      <div style={styles.content}>
        {/* Heal All Button */}
        <div style={styles.section}>
          <button
            style={{
              ...styles.healAllButton,
              ...(!canAffordPartyHeal && styles.buttonDisabled)
            }}
            onClick={handleHealParty}
            disabled={!canAffordPartyHeal}
          >
            <div style={styles.buttonIcon}>✨</div>
            <div style={styles.buttonContent}>
              <div style={styles.buttonTitle}>Heal Entire Party</div>
              <div style={styles.buttonSubtitle}>
                {partyHealCost === 0
                  ? 'All heroes at full HP'
                  : `Cost: ${partyHealCost}g`
                }
              </div>
            </div>
          </button>
        </div>

        {/* Individual Heroes */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Individual Healing</h3>
          <div style={styles.heroesGrid}>
            {heroes.map((hero, index) => {
              const healCost = TownService.calculateHealCost(hero);
              const canAfford = playerGold >= healCost && healCost > 0;
              const hpPercent = (hero.currentHP / hero.maxHP) * 100;

              return (
                <div
                  key={hero.id}
                  style={styles.heroCard}
                  onClick={() => setSelectedHeroIndex(index)}
                >
                  <div style={styles.heroIcon}>
                    {hero.class === 'warrior' && '⚔️'}
                    {hero.class === 'archer' && '🏹'}
                    {hero.class === 'mage' && '🔮'}
                    {hero.class === 'cleric' && '✨'}
                    {hero.class === 'paladin' && '🛡️'}
                  </div>

                  <div style={styles.heroInfo}>
                    <div style={styles.heroName}>{hero.name}</div>
                    <div style={styles.heroClass}>{hero.class}</div>

                    {/* HP Bar */}
                    <div style={styles.hpBarContainer}>
                      <div
                        style={{
                          ...styles.hpBarFill,
                          width: `${hpPercent}%`,
                          backgroundColor: hpPercent > 50 ? '#10b981' : hpPercent > 25 ? '#f59e0b' : '#ef4444'
                        }}
                      />
                      <div style={styles.hpBarText}>
                        {hero.currentHP} / {hero.maxHP}
                      </div>
                    </div>
                  </div>

                  <button
                    style={{
                      ...styles.healButton,
                      ...(!canAfford && styles.buttonDisabled)
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHealHero(index);
                    }}
                    disabled={!canAfford}
                  >
                    {healCost === 0 ? (
                      <span>Full HP</span>
                    ) : (
                      <>
                        <span>Heal</span>
                        <span style={styles.costText}>{healCost}g</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing Info */}
        <div style={styles.infoBox}>
          <h4 style={styles.infoTitle}>Pricing</h4>
          <p style={styles.infoText}>
            • Individual healing: <strong>1g per HP</strong>
          </p>
          <p style={styles.infoText}>
            • Full party heal: <strong>50g flat rate</strong> (cheaper for multiple heroes)
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
  healAllButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '20px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
    color: 'white'
  },
  buttonIcon: {
    fontSize: '32px'
  },
  buttonContent: {
    flex: 1,
    textAlign: 'left'
  },
  buttonTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '4px'
  },
  buttonSubtitle: {
    fontSize: '14px',
    opacity: 0.9
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: 'none'
  },
  heroesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '15px'
  },
  heroCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '15px',
    background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
    border: '2px solid #475569',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  heroIcon: {
    fontSize: '40px',
    flexShrink: 0
  },
  heroInfo: {
    flex: 1,
    minWidth: 0
  },
  heroName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  heroClass: {
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'capitalize',
    marginBottom: '8px'
  },
  hpBarContainer: {
    position: 'relative',
    width: '100%',
    height: '24px',
    background: 'rgba(15, 23, 42, 0.8)',
    borderRadius: '4px',
    overflow: 'hidden',
    border: '1px solid #334155'
  },
  hpBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    transition: 'width 0.3s, background-color 0.3s',
    borderRadius: '4px'
  },
  hpBarText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '700',
    color: 'white',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    zIndex: 1
  },
  healButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '14px',
    fontWeight: '700',
    color: '#0f172a',
    whiteSpace: 'nowrap'
  },
  costText: {
    fontSize: '12px',
    opacity: 0.9
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
