/**
 * Bank Building Component - Placeholder for future bank system
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React from 'react';
import { t } from '../../localization/i18n';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS } from '../../styles/tokens';
import { flexBetween, flexColumn } from '../../styles/common';

interface BankBuildingProps {
  playerGold: number;
  storedGold: number;
  onClose: () => void;
  onGoldChange: (newGold: number) => void;
  onStoredGoldChange: (newStoredGold: number) => void;
}

export function BankBuilding({ onClose }: BankBuildingProps) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🏦 {t('buildings.bank.title')}</h2>
        <button style={styles.closeButton} onClick={onClose}>✕</button>
      </div>

      <div style={styles.content}>
        <div style={styles.comingSoon}>
          <div style={styles.icon}>🚧</div>
          <h3 style={styles.comingSoonTitle}>{t('buildings.bank.comingSoon.title')}</h3>
          <p style={styles.comingSoonText}>
            {t('buildings.bank.comingSoon.version')}
          </p>
          <div style={styles.featuresList}>
            <div style={styles.featureItem}>✨ {t('buildings.bank.comingSoon.features.item1')}</div>
            <div style={styles.featureItem}>✨ {t('buildings.bank.comingSoon.features.item2')}</div>
            <div style={styles.featureItem}>✨ {t('buildings.bank.comingSoon.features.item3')}</div>
            <div style={styles.featureItem}>✨ {t('buildings.bank.comingSoon.features.item4')}</div>
          </div>
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
    color: COLORS.textLight
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
  content: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl
  },
  comingSoon: {
    textAlign: 'center',
    maxWidth: '500px'
  },
  icon: {
    fontSize: '80px',
    marginBottom: SPACING.lg
  },
  comingSoonTitle: {
    fontSize: FONT_SIZE['4xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
    margin: `0 0 ${SPACING.md} 0`
  },
  comingSoonText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textGray,
    margin: `0 0 ${SPACING.xl} 0`
  },
  featuresList: {
    ...flexColumn,
    gap: SPACING[3]
  },
  featureItem: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textLight,
    padding: `${SPACING[3]} ${SPACING.lg}`,
    background: 'rgba(45, 212, 191, 0.1)',
    border: '1px solid rgba(45, 212, 191, 0.3)',
    borderRadius: BORDER_RADIUS.md
  }
};
