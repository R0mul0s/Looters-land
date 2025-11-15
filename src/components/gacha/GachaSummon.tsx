/**
 * Gacha Summon Component - Hero summoning interface with animations
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React, { useState } from 'react';
import type { GachaState, HeroTemplate } from '../../types/hero.types';
import { GachaSystem } from '../../engine/gacha/GachaSystem';
import { RARITY_COLORS } from '../../types/hero.types';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS, SHADOWS, Z_INDEX } from '../../styles/tokens';
import { flexBetween, flexColumn, flexCenter } from '../../styles/common';

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
    background: `linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, transparent 100%)`
  },
  title: {
    margin: 0,
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center'
  },
  resourcesBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: SPACING[10],
    padding: `${SPACING[4]} ${SPACING[5]}`,
    background: 'rgba(15, 23, 42, 0.5)',
    borderBottom: `1px solid ${COLORS.bgSurfaceLight}`
  },
  resourceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[2]
  },
  resourceIcon: {
    fontSize: FONT_SIZE.xl
  },
  resourceValue: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.goldLight
  },
  ratesSection: {
    padding: SPACING[5],
    background: 'rgba(15, 23, 42, 0.3)',
    borderBottom: `1px solid ${COLORS.bgSurfaceLight}`
  },
  sectionTitle: {
    margin: `0 0 ${SPACING[4]} 0`,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
    color: COLORS.textLight
  },
  ratesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: SPACING[3],
    maxWidth: '600px',
    margin: '0 auto'
  },
  rateItem: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[2],
    padding: `${SPACING[2]} ${SPACING[3]}`,
    background: 'rgba(51, 65, 85, 0.5)',
    borderRadius: BORDER_RADIUS.md
  },
  rarityDot: {
    width: SPACING[3],
    height: SPACING[3],
    borderRadius: BORDER_RADIUS.round,
    flexShrink: 0
  },
  rateName: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium
  },
  ratePercent: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.goldLight
  },
  summonSection: {
    flex: 1,
    ...flexColumn,
    gap: SPACING[4],
    padding: SPACING[5],
    overflow: 'auto'
  },
  summonButton: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[4],
    padding: SPACING[5],
    border: 'none',
    borderRadius: BORDER_RADIUS.lg,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase,
    position: 'relative',
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold
  },
  freeSummonButton: {
    background: `linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.successDark} 100%)`,
    color: COLORS.white,
    boxShadow: SHADOWS.card
  },
  singleSummonButton: {
    background: `linear-gradient(135deg, ${COLORS.info} 0%, #2563eb 100%)`,
    color: COLORS.white,
    boxShadow: SHADOWS.card
  },
  tenSummonButton: {
    background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
    color: COLORS.white,
    boxShadow: SHADOWS.card
  },
  debugSummonButton: {
    background: `linear-gradient(135deg, ${COLORS.danger} 0%, ${COLORS.dangerDark} 100%)`,
    color: COLORS.white,
    boxShadow: SHADOWS.card,
    border: '2px dashed #fca5a5'
  },
  buttonIcon: {
    fontSize: FONT_SIZE['4xl'],
    flexShrink: 0
  },
  buttonContent: {
    flex: 1,
    textAlign: 'left'
  },
  buttonTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING[1]
  },
  buttonSubtitle: {
    fontSize: FONT_SIZE.md,
    opacity: 0.9
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: SHADOWS.none
  },
  guaranteeBadge: {
    position: 'absolute',
    top: SPACING[2],
    right: SPACING[2],
    padding: `${SPACING[1]} ${SPACING[3]}`,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDER_RADIUS.sm,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  infoBox: {
    margin: `0 ${SPACING[5]} ${SPACING[5]} ${SPACING[5]}`,
    padding: `${SPACING[4]} ${SPACING[5]}`,
    background: 'rgba(59, 130, 246, 0.1)',
    border: `1px solid rgba(59, 130, 246, 0.3)`,
    borderRadius: BORDER_RADIUS.md
  },
  infoTitle: {
    margin: `0 0 ${SPACING[3]} 0`,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.infoLight
  },
  infoText: {
    margin: `${SPACING.xs} 0`,
    fontSize: FONT_SIZE.md,
    color: COLORS.textGray,
    lineHeight: '1.6'
  },
  summoningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: COLORS.bgOverlayDark,
    ...flexCenter,
    zIndex: Z_INDEX.dropdown
  },
  summoningAnimation: {
    textAlign: 'center'
  },
  spinner: {
    fontSize: FONT_SIZE['8xl'],
    animation: 'spin 1s linear infinite',
    marginBottom: SPACING[5]
  },
  summoningText: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary
  },
  resultsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    ...flexCenter,
    zIndex: Z_INDEX.modal,
    padding: SPACING[5]
  },
  resultsModal: {
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    background: `linear-gradient(135deg, ${COLORS.bgSurface} 0%, ${COLORS.bgDarkAlt} 100%)`,
    borderRadius: BORDER_RADIUS.xl,
    border: `2px solid ${COLORS.primary}`,
    boxShadow: SHADOWS.glowTeal,
    ...flexColumn,
    overflow: 'hidden'
  },
  resultsHeader: {
    ...flexBetween,
    padding: SPACING[5],
    borderBottom: `2px solid ${COLORS.primary}`,
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, transparent 100%)'
  },
  resultsTitle: {
    margin: 0,
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary
  },
  closeButton: {
    background: COLORS.transparent,
    border: `2px solid ${COLORS.bgSurfaceLight}`,
    color: COLORS.textGray,
    fontSize: FONT_SIZE.xl,
    cursor: 'pointer',
    padding: `${SPACING[2]} ${SPACING[3]}`,
    borderRadius: BORDER_RADIUS.md,
    transition: TRANSITIONS.allBase
  },
  resultsGrid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: SPACING[4],
    padding: SPACING[5],
    overflow: 'auto'
  },
  resultCard: {
    ...flexColumn,
    alignItems: 'center',
    padding: SPACING[5],
    background: `linear-gradient(135deg, ${COLORS.bgSurfaceLight} 0%, ${COLORS.bgSurface} 100%)`,
    border: '3px solid',
    borderRadius: BORDER_RADIUS.lg,
    position: 'relative'
  },
  rarityBadge: {
    position: 'absolute',
    top: SPACING[3],
    right: SPACING[3],
    padding: `${SPACING[1]} ${SPACING[3]}`,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    letterSpacing: '0.5px'
  },
  heroIconLarge: {
    fontSize: FONT_SIZE['7xl'],
    marginBottom: SPACING[3]
  },
  heroNameLarge: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textLight,
    marginBottom: SPACING[2],
    textAlign: 'center'
  },
  heroDetails: {
    display: 'flex',
    gap: SPACING[3],
    marginBottom: SPACING[3]
  },
  heroClass: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textGray,
    textTransform: 'capitalize',
    padding: `${SPACING[1]} ${SPACING[3]}`,
    background: 'rgba(148, 163, 184, 0.2)',
    borderRadius: BORDER_RADIUS.sm
  },
  heroRole: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    textTransform: 'capitalize',
    padding: `${SPACING[1]} ${SPACING[3]}`,
    background: 'rgba(45, 212, 191, 0.2)',
    borderRadius: BORDER_RADIUS.sm
  },
  specialAbility: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.goldLight,
    textAlign: 'center',
    padding: SPACING[2],
    background: 'rgba(251, 191, 36, 0.1)',
    borderRadius: BORDER_RADIUS.md,
    lineHeight: '1.4',
    marginTop: SPACING[2]
  },
  continueButton: {
    margin: SPACING[5],
    padding: `${SPACING[4]} ${SPACING[6]}`,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    color: COLORS.bgDarkAlt,
    border: 'none',
    borderRadius: BORDER_RADIUS.md,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase,
    boxShadow: SHADOWS.card
  }
};
