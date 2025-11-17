/**
 * Healer Building Component - HP restoration services
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React, { useState } from 'react';
import type { Hero } from '../../engine/hero/Hero';
import { TownService } from '../../services/TownService';
import { t } from '../../localization/i18n';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS } from '../../styles/tokens';
import { flexBetween, flexColumn } from '../../styles/common';

interface HealerBuildingProps {
  heroes: Hero[];
  playerGold: number;
  healerCooldownUntil: Date | null;
  onClose: () => void;
  onHeroesChange: (heroes: Hero[]) => void;
  onGoldChange: (newGold: number) => void;
  onSetHealerCooldown: (cooldownUntil: Date | null) => void;
}

export function HealerBuilding({
  heroes,
  playerGold,
  healerCooldownUntil,
  onClose,
  onHeroesChange,
  onGoldChange,
  onSetHealerCooldown
}: HealerBuildingProps) {
  const [selectedHeroIndex, setSelectedHeroIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Update cooldown countdown every second
  React.useEffect(() => {
    const updateCooldown = () => {
      if (!healerCooldownUntil) {
        setCooldownRemaining(0);
        return;
      }

      const now = new Date().getTime();
      const cooldownTime = new Date(healerCooldownUntil).getTime();
      const remaining = Math.max(0, cooldownTime - now);
      setCooldownRemaining(remaining);
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);

    return () => clearInterval(interval);
  }, [healerCooldownUntil]);

  // Format cooldown remaining time
  const formatCooldown = (ms: number): string => {
    if (ms <= 0) return '';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
    // Check if on cooldown
    if (cooldownRemaining > 0) {
      setMessage({ text: `Party heal is on cooldown! Available in ${formatCooldown(cooldownRemaining)}`, type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const cost = TownService.calculatePartyHealCost(heroes);

    if (cost === 0) {
      setMessage({ text: 'All heroes are already at full HP!', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const result = TownService.healParty(heroes, cost, playerGold);

    if (result.success) {
      onGoldChange(result.newGold);
      onHeroesChange([...heroes]); // Trigger re-render

      // Set 60-minute cooldown
      const cooldownUntil = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes from now
      onSetHealerCooldown(cooldownUntil);

      setMessage({ text: result.message + ' (Cooldown: 60 min)', type: 'success' });
    } else {
      setMessage({ text: result.message, type: 'error' });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  const partyHealCost = TownService.calculatePartyHealCost(heroes);
  const isOnCooldown = cooldownRemaining > 0;
  const canAffordPartyHeal = playerGold >= partyHealCost && partyHealCost > 0 && !isOnCooldown;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>⛑️ {t('buildings.healer.title')}</h2>
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
              <div style={styles.buttonTitle}>{t('buildings.healer.healParty')}</div>
              <div style={styles.buttonSubtitle}>
                {isOnCooldown
                  ? `Cooldown: ${formatCooldown(cooldownRemaining)}`
                  : partyHealCost === 0
                  ? t('buildings.healer.allAtFullHP')
                  : `${t('buildings.smithy.cost')} ${partyHealCost}g`
                }
              </div>
            </div>
          </button>
        </div>

        {/* Individual Heroes */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>{t('buildings.healer.individual')}</h3>
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
                      <span>{t('buildings.healer.fullHP')}</span>
                    ) : (
                      <>
                        <span>{t('buildings.healer.heal')}</span>
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
          <h4 style={styles.infoTitle}>{t('buildings.healer.pricing.title')}</h4>
          <p style={styles.infoText}>
            • {t('buildings.healer.pricing.individual')} <strong>{t('buildings.healer.pricing.individualCost')}</strong>
          </p>
          <p style={styles.infoText}>
            • {t('buildings.healer.pricing.party')} <strong>{t('buildings.healer.pricing.partyCost')}</strong> {t('buildings.healer.pricing.partySaving')}
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
    transition: TRANSITIONS.allBase
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
  resourcesBar: {
    display: 'flex',
    gap: SPACING.lg,
    padding: `${SPACING.md} ${SPACING.lg}`,
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
  content: {
    flex: 1,
    ...flexColumn,
    gap: SPACING.lg,
    padding: SPACING.lg,
    overflow: 'auto'
  },
  section: {
    ...flexColumn,
    gap: SPACING.md
  },
  sectionTitle: {
    margin: 0,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textLight
  },
  healAllButton: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    background: `linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.successDark} 100%)`,
    border: 'none',
    borderRadius: BORDER_RADIUS.lg,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase,
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
    color: COLORS.white
  },
  buttonIcon: {
    fontSize: FONT_SIZE['4xl']
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
    boxShadow: 'none'
  },
  heroesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: SPACING.md
  },
  heroCard: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    background: `linear-gradient(135deg, ${COLORS.bgSurfaceLight} 0%, ${COLORS.bgSurface} 100%)`,
    border: `2px solid ${COLORS.bgSurfaceLighter}`,
    borderRadius: BORDER_RADIUS.md,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase
  },
  heroIcon: {
    fontSize: SPACING.xxl,
    flexShrink: 0
  },
  heroInfo: {
    flex: 1,
    minWidth: 0
  },
  heroName: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textLight,
    marginBottom: SPACING.xxs,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  heroClass: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textGray,
    textTransform: 'capitalize',
    marginBottom: SPACING[2]
  },
  hpBarContainer: {
    position: 'relative',
    width: '100%',
    height: SPACING[6],
    background: 'rgba(15, 23, 42, 0.8)',
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    border: `1px solid ${COLORS.bgSurfaceLight}`
  },
  hpBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    transition: 'width 0.3s, background-color 0.3s',
    borderRadius: BORDER_RADIUS.sm
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
    fontSize: FONT_SIZE['11'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    zIndex: 1
  },
  healButton: {
    ...flexColumn,
    alignItems: 'center',
    gap: SPACING[1],
    padding: `${SPACING.sm} ${SPACING[4]}`,
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    border: 'none',
    borderRadius: BORDER_RADIUS.sm,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.bgDarkAlt,
    whiteSpace: 'nowrap'
  },
  costText: {
    fontSize: FONT_SIZE.sm,
    opacity: 0.9
  },
  infoBox: {
    padding: `${SPACING.md} ${SPACING.lg}`,
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: BORDER_RADIUS.md
  },
  infoTitle: {
    margin: `0 0 ${SPACING.sm} 0`,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.infoLight
  },
  infoText: {
    margin: `${SPACING.xs} 0`,
    fontSize: FONT_SIZE.md,
    color: COLORS.textGray,
    lineHeight: '1.6'
  }
};
