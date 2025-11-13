/**
 * Gacha Summon Component - Hero summoning interface with animations
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import React, { useState } from 'react';
import type { GachaState, HeroTemplate } from '../../types/hero.types';
import { GachaSystem } from '../../engine/gacha/GachaSystem';
import { RARITY_COLORS } from '../../types/hero.types';

interface GachaSummonProps {
  gachaState: GachaState;
  playerGold: number;
  onGachaStateChange: (newState: GachaState) => void;
  onGoldChange: (newGold: number) => void;
  onHeroesObtained: (heroes: HeroTemplate[]) => void;
}

export function GachaSummon({
  gachaState,
  playerGold,
  onGachaStateChange,
  onGoldChange,
  onHeroesObtained
}: GachaSummonProps) {
  const [summoning, setSummoning] = useState(false);
  const [summonResults, setSummonResults] = useState<HeroTemplate[]>([]);
  const [showResults, setShowResults] = useState(false);

  const canUseFreeSummon = GachaSystem.canUseFreeSummon(gachaState);
  const canAffordSingle = playerGold >= GachaSystem.COST_SINGLE;
  const canAffordTen = playerGold >= GachaSystem.COST_TEN;

  // Debug mode check
  const isDebugMode = import.meta.env.DEV;

  const handleFreeSummon = () => {
    if (!canUseFreeSummon || summoning) return;

    setSummoning(true);

    // Simulate summon animation delay
    setTimeout(() => {
      const { result, newGachaState } = GachaSystem.summon(gachaState, true);

      onGachaStateChange(newGachaState);
      onHeroesObtained([result]);

      setSummonResults([result]);
      setShowResults(true);
      setSummoning(false);
    }, 1000);
  };

  const handleSingleSummon = () => {
    if (!canAffordSingle || summoning) return;

    setSummoning(true);

    setTimeout(() => {
      const { result, newGachaState } = GachaSystem.summon(gachaState, false);

      onGachaStateChange(newGachaState);
      onGoldChange(playerGold - GachaSystem.COST_SINGLE);
      onHeroesObtained([result]);

      setSummonResults([result]);
      setShowResults(true);
      setSummoning(false);
    }, 1000);
  };

  const handleTenSummon = () => {
    if (!canAffordTen || summoning) return;

    setSummoning(true);

    setTimeout(() => {
      const { results, newGachaState } = GachaSystem.summonTen(gachaState);

      onGachaStateChange(newGachaState);
      onGoldChange(playerGold - GachaSystem.COST_TEN);
      onHeroesObtained(results);

      setSummonResults(results);
      setShowResults(true);
      setSummoning(false);
    }, 2000);
  };

  // Debug: Free 10x summon
  const handleDebugTenSummon = () => {
    if (summoning) return;

    setSummoning(true);

    setTimeout(() => {
      const { results, newGachaState } = GachaSystem.summonTen(gachaState);

      onGachaStateChange(newGachaState);
      // Don't charge gold in debug mode
      onHeroesObtained(results);

      setSummonResults(results);
      setShowResults(true);
      setSummoning(false);
    }, 2000);
  };

  const closeResults = () => {
    setShowResults(false);
    setSummonResults([]);
  };

  return (
    <div style={styles.container}>
      {/* Summon Results Modal */}
      {showResults && (
        <div style={styles.resultsOverlay} onClick={closeResults}>
          <div style={styles.resultsModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.resultsHeader}>
              <h2 style={styles.resultsTitle}>
                {summonResults.length === 1 ? 'Hero Summoned!' : 'Heroes Summoned!'}
              </h2>
              <button style={styles.closeButton} onClick={closeResults}>✕</button>
            </div>

            <div style={styles.resultsGrid}>
              {summonResults.map((hero, index) => (
                <div
                  key={`${hero.id}-${index}`}
                  style={{
                    ...styles.resultCard,
                    borderColor: RARITY_COLORS[hero.rarity],
                    boxShadow: `0 4px 16px ${RARITY_COLORS[hero.rarity]}40`
                  }}
                >
                  <div
                    style={{
                      ...styles.rarityBadge,
                      background: RARITY_COLORS[hero.rarity]
                    }}
                  >
                    {hero.rarity.toUpperCase()}
                  </div>
                  <div style={styles.heroIconLarge}>{hero.icon}</div>
                  <div style={styles.heroNameLarge}>{hero.name}</div>
                  <div style={styles.heroDetails}>
                    <div style={styles.heroClass}>{hero.class}</div>
                    <div style={styles.heroRole}>{hero.role}</div>
                  </div>
                  {hero.specialAbility && (
                    <div style={styles.specialAbility}>
                      <strong>Special:</strong> {hero.specialAbility}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button style={styles.continueButton} onClick={closeResults}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Main Summon Screen */}
      {!showResults && (
        <>
          {/* Header */}
          <div style={styles.header}>
            <h2 style={styles.title}>🎰 Hero Summon</h2>
          </div>

          {/* Resources Display */}
          <div style={styles.resourcesBar}>
            <div style={styles.resourceItem}>
              <span style={styles.resourceIcon}>💰</span>
              <span style={styles.resourceValue}>{playerGold.toLocaleString()}g</span>
            </div>
            <div style={styles.resourceItem}>
              <span style={styles.resourceIcon}>🎯</span>
              <span style={styles.resourceValue}>
                Pity: {gachaState.pitySummons}/{GachaSystem.PITY_THRESHOLD}
              </span>
            </div>
          </div>

          {/* Drop Rates Info */}
          <div style={styles.ratesSection}>
            <h3 style={styles.sectionTitle}>Drop Rates</h3>
            <div style={styles.ratesGrid}>
              <div style={styles.rateItem}>
                <div
                  style={{
                    ...styles.rarityDot,
                    background: RARITY_COLORS.legendary
                  }}
                />
                <span style={styles.rateName}>Legendary</span>
                <span style={styles.ratePercent}>{GachaSystem.RATES.legendary}%</span>
              </div>
              <div style={styles.rateItem}>
                <div
                  style={{
                    ...styles.rarityDot,
                    background: RARITY_COLORS.epic
                  }}
                />
                <span style={styles.rateName}>Epic</span>
                <span style={styles.ratePercent}>{GachaSystem.RATES.epic}%</span>
              </div>
              <div style={styles.rateItem}>
                <div
                  style={{
                    ...styles.rarityDot,
                    background: RARITY_COLORS.rare
                  }}
                />
                <span style={styles.rateName}>Rare</span>
                <span style={styles.ratePercent}>{GachaSystem.RATES.rare}%</span>
              </div>
              <div style={styles.rateItem}>
                <div
                  style={{
                    ...styles.rarityDot,
                    background: RARITY_COLORS.common
                  }}
                />
                <span style={styles.rateName}>Common</span>
                <span style={styles.ratePercent}>{GachaSystem.RATES.common}%</span>
              </div>
            </div>
          </div>

          {/* Summon Buttons */}
          <div style={styles.summonSection}>
            {/* Free Summon */}
            <button
              style={{
                ...styles.summonButton,
                ...styles.freeSummonButton,
                ...(!canUseFreeSummon && styles.buttonDisabled)
              }}
              onClick={handleFreeSummon}
              disabled={!canUseFreeSummon || summoning}
            >
              <div style={styles.buttonIcon}>🎁</div>
              <div style={styles.buttonContent}>
                <div style={styles.buttonTitle}>Free Daily Summon</div>
                <div style={styles.buttonSubtitle}>
                  {canUseFreeSummon ? 'Available Now!' : 'Come back tomorrow'}
                </div>
              </div>
            </button>

            {/* Single Summon */}
            <button
              style={{
                ...styles.summonButton,
                ...styles.singleSummonButton,
                ...(!canAffordSingle && styles.buttonDisabled)
              }}
              onClick={handleSingleSummon}
              disabled={!canAffordSingle || summoning}
            >
              <div style={styles.buttonIcon}>✨</div>
              <div style={styles.buttonContent}>
                <div style={styles.buttonTitle}>Single Summon</div>
                <div style={styles.buttonSubtitle}>
                  {canAffordSingle
                    ? `${GachaSystem.COST_SINGLE.toLocaleString()}g`
                    : 'Not enough gold'
                  }
                </div>
              </div>
            </button>

            {/* 10x Summon */}
            <button
              style={{
                ...styles.summonButton,
                ...styles.tenSummonButton,
                ...(!canAffordTen && styles.buttonDisabled)
              }}
              onClick={handleTenSummon}
              disabled={!canAffordTen || summoning}
            >
              <div style={styles.buttonIcon}>🌟</div>
              <div style={styles.buttonContent}>
                <div style={styles.buttonTitle}>10x Summon</div>
                <div style={styles.buttonSubtitle}>
                  {canAffordTen
                    ? `${GachaSystem.COST_TEN.toLocaleString()}g (10% OFF!)`
                    : 'Not enough gold'
                  }
                </div>
              </div>
              <div style={styles.guaranteeBadge}>Guaranteed Rare+</div>
            </button>

            {/* Debug 10x Summon (Development only) */}
            {isDebugMode && (
              <button
                style={{
                  ...styles.summonButton,
                  ...styles.debugSummonButton
                }}
                onClick={handleDebugTenSummon}
                disabled={summoning}
              >
                <div style={styles.buttonIcon}>🔧</div>
                <div style={styles.buttonContent}>
                  <div style={styles.buttonTitle}>DEBUG: Free 10x Summon</div>
                  <div style={styles.buttonSubtitle}>Development Mode Only</div>
                </div>
                <div style={styles.guaranteeBadge}>FREE</div>
              </button>
            )}
          </div>

          {/* Pity System Info */}
          <div style={styles.infoBox}>
            <h4 style={styles.infoTitle}>Pity System</h4>
            <p style={styles.infoText}>
              • Guaranteed <strong style={{ color: RARITY_COLORS.epic }}>Epic</strong> hero after{' '}
              <strong>{GachaSystem.PITY_THRESHOLD}</strong> summons without Epic or Legendary
            </p>
            <p style={styles.infoText}>
              • Current pity counter: <strong>{gachaState.pitySummons}/{GachaSystem.PITY_THRESHOLD}</strong>
            </p>
            <p style={styles.infoText}>
              • 10x summon guarantees at least 1 Rare or better hero
            </p>
            <p style={styles.infoText}>
              • Free daily summon resets at midnight
            </p>
          </div>

          {/* Summoning Animation */}
          {summoning && (
            <div style={styles.summoningOverlay}>
              <div style={styles.summoningAnimation}>
                <div style={styles.spinner}>🌟</div>
                <div style={styles.summoningText}>Summoning...</div>
              </div>
            </div>
          )}
        </>
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
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    textAlign: 'center'
  },
  resourcesBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '40px',
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
  ratesSection: {
    padding: '20px',
    background: 'rgba(15, 23, 42, 0.3)',
    borderBottom: '1px solid #334155'
  },
  sectionTitle: {
    margin: '0 0 15px 0',
    fontSize: '18px',
    fontWeight: '700',
    textAlign: 'center',
    color: '#f1f5f9'
  },
  ratesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px',
    maxWidth: '600px',
    margin: '0 auto'
  },
  rateItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: 'rgba(51, 65, 85, 0.5)',
    borderRadius: '6px'
  },
  rarityDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    flexShrink: 0
  },
  rateName: {
    flex: 1,
    fontSize: '14px',
    fontWeight: '500'
  },
  ratePercent: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#fbbf24'
  },
  summonSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    padding: '20px',
    overflow: 'auto'
  },
  summonButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '20px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative',
    fontSize: '16px',
    fontWeight: '700'
  },
  freeSummonButton: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
  },
  singleSummonButton: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  },
  tenSummonButton: {
    background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
  },
  debugSummonButton: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
    border: '2px dashed #fca5a5'
  },
  buttonIcon: {
    fontSize: '32px',
    flexShrink: 0
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
  guaranteeBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '700',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  infoBox: {
    margin: '0 20px 20px 20px',
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
  },
  summoningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
  },
  summoningAnimation: {
    textAlign: 'center'
  },
  spinner: {
    fontSize: '80px',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px'
  },
  summoningText: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#2dd4bf'
  },
  resultsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '20px'
  },
  resultsModal: {
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    borderRadius: '16px',
    border: '2px solid #2dd4bf',
    boxShadow: '0 8px 32px rgba(45, 212, 191, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  resultsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '2px solid #2dd4bf',
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, transparent 100%)'
  },
  resultsTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#2dd4bf'
  },
  closeButton: {
    background: 'transparent',
    border: '2px solid #334155',
    color: '#94a3b8',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '6px',
    transition: 'all 0.2s'
  },
  resultsGrid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '15px',
    padding: '20px',
    overflow: 'auto'
  },
  resultCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
    border: '3px solid',
    borderRadius: '12px',
    position: 'relative'
  },
  rarityBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'white',
    borderRadius: '4px',
    letterSpacing: '0.5px'
  },
  heroIconLarge: {
    fontSize: '64px',
    marginBottom: '12px'
  },
  heroNameLarge: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: '8px',
    textAlign: 'center'
  },
  heroDetails: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px'
  },
  heroClass: {
    fontSize: '13px',
    color: '#94a3b8',
    textTransform: 'capitalize',
    padding: '4px 10px',
    background: 'rgba(148, 163, 184, 0.2)',
    borderRadius: '4px'
  },
  heroRole: {
    fontSize: '13px',
    color: '#2dd4bf',
    textTransform: 'capitalize',
    padding: '4px 10px',
    background: 'rgba(45, 212, 191, 0.2)',
    borderRadius: '4px'
  },
  specialAbility: {
    fontSize: '12px',
    color: '#fbbf24',
    textAlign: 'center',
    padding: '8px',
    background: 'rgba(251, 191, 36, 0.1)',
    borderRadius: '6px',
    lineHeight: '1.4',
    marginTop: '8px'
  },
  continueButton: {
    margin: '20px',
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
    color: '#0f172a',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(45, 212, 191, 0.3)'
  }
};
