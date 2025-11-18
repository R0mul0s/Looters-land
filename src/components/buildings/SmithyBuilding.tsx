/**
 * Smithy Building Component - Equipment enchanting and repair services
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React, { useState } from 'react';
import type { Inventory } from '../../engine/item/Inventory';
import type { Item } from '../../engine/item/Item';
import { TownService } from '../../services/TownService';
import { t } from '../../localization/i18n';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS } from '../../styles/tokens';
import { flexBetween, flexColumn } from '../../styles/common';

interface SmithyBuildingProps {
  inventory: Inventory;
  playerGold: number;
  onClose: () => void;
  onInventoryChange: (inventory: Inventory) => void;
  onGoldChange: (newGold: number) => void;
}

export function SmithyBuilding({
  inventory,
  playerGold,
  onClose,
  onInventoryChange,
  onGoldChange
}: SmithyBuildingProps) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleEnchantItem = (item: Item) => {
    const cost = TownService.calculateEnchantCost(item);

    if (cost === 0) {
      setMessage({ text: t('townBuildings.maxEnchantLevel'), type: 'error' });
      return;
    }

    const result = TownService.enchantItem(item, cost, playerGold);

    if (result.success) {
      onGoldChange(result.newGold);
      onInventoryChange(inventory); // Trigger re-render
      setMessage({ text: result.message, type: 'success' });
    } else {
      onGoldChange(result.newGold); // Gold was spent even on failure
      setMessage({ text: result.message, type: 'error' });
    }

    setTimeout(() => setMessage(null), 4000);
  };

  // Get equipment items only (no consumables, etc.)
  let equipmentItems = inventory.items.filter(
    item => ['helmet', 'chest', 'legs', 'boots', 'weapon', 'shield', 'accessory'].includes(item.slot)
  );

  // Sort by rarity, then level
  const rarityOrder: Record<string, number> = {
    mythic: 6,
    legendary: 5,
    epic: 4,
    rare: 3,
    uncommon: 2,
    common: 1
  };

  equipmentItems = equipmentItems.sort((a, b) => {
    // First by rarity (descending)
    const rarityDiff = (rarityOrder[b.rarity.toLowerCase()] || 0) - (rarityOrder[a.rarity.toLowerCase()] || 0);
    if (rarityDiff !== 0) return rarityDiff;

    // Then by level (descending)
    return b.level - a.level;
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return '#ff8c00';
      case 'epic': return '#a855f7';
      case 'rare': return '#3b82f6';
      case 'uncommon': return '#10b981';
      default: return '#9ca3af';
    }
  };

  const getEnchantColor = (level: number) => {
    if (level === 0) return '#9ca3af';
    if (level <= 3) return '#10b981';
    if (level <= 6) return '#3b82f6';
    if (level <= 9) return '#a855f7';
    return '#ff8c00';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>⚒️ {t('buildings.smithy.title')}</h2>
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
        {equipmentItems.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📦</div>
            <h3 style={styles.emptyTitle}>{t('buildings.smithy.empty.title')}</h3>
            <p style={styles.emptyText}>
              {t('buildings.smithy.empty.message')}
            </p>
          </div>
        ) : (
          <>
            {/* Item Grid */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>{t('buildings.smithy.selectItem')}</h3>
              <div style={styles.itemsGrid}>
                {equipmentItems.map(item => {
                  const enchantCost = TownService.calculateEnchantCost(item);
                  const successRate = TownService.calculateEnchantSuccessRate(item);
                  const canAfford = playerGold >= enchantCost && enchantCost > 0;

                  return (
                    <div
                      key={`smithy-enchant-${item.id}`}
                      style={{
                        ...styles.itemCard,
                        ...(selectedItem?.id === item.id && styles.itemCardSelected),
                        borderColor: getRarityColor(item.rarity)
                      }}
                      onClick={() => setSelectedItem(item)}
                    >
                      <div style={styles.itemIcon}>{item.icon}</div>
                      <div style={styles.itemInfo}>
                        <div
                          style={{
                            ...styles.itemName,
                            color: getRarityColor(item.rarity)
                          }}
                        >
                          {item.name}
                        </div>
                        <div style={styles.itemSlot}>{item.slot}</div>
                        <div
                          style={{
                            ...styles.enchantLevel,
                            color: getEnchantColor(item.enchantLevel || 0)
                          }}
                        >
                          +{item.enchantLevel || 0}
                        </div>
                      </div>
                      {selectedItem?.id === item.id && (
                        <div style={styles.selectedBadge}>✓</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Enchant Panel */}
            {selectedItem && (
              <div style={styles.enchantPanel}>
                <h3 style={styles.panelTitle}>{t('buildings.smithy.enchantingDetails')}</h3>

                <div style={styles.enchantInfo}>
                  <div style={styles.infoRow}>
                    <span style={styles.label}>{t('buildings.smithy.currentLevel')}</span>
                    <span
                      style={{
                        ...styles.value,
                        color: getEnchantColor(selectedItem.enchantLevel || 0)
                      }}
                    >
                      +{selectedItem.enchantLevel || 0}
                    </span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.label}>{t('buildings.smithy.nextLevel')}</span>
                    <span
                      style={{
                        ...styles.value,
                        color: getEnchantColor((selectedItem.enchantLevel || 0) + 1)
                      }}
                    >
                      +{(selectedItem.enchantLevel || 0) + 1}
                    </span>
                  </div>
                  <div style={styles.divider} />
                  <div style={styles.infoRow}>
                    <span style={styles.label}>{t('buildings.smithy.successRate')}</span>
                    <span
                      style={{
                        ...styles.value,
                        color: TownService.calculateEnchantSuccessRate(selectedItem) > 50
                          ? '#10b981'
                          : TownService.calculateEnchantSuccessRate(selectedItem) > 25
                            ? '#f59e0b'
                            : '#ef4444'
                      }}
                    >
                      {TownService.calculateEnchantSuccessRate(selectedItem)}%
                    </span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.label}>{t('buildings.smithy.cost')}</span>
                    <span style={styles.costValue}>
                      {TownService.calculateEnchantCost(selectedItem) || 'MAX'}g
                    </span>
                  </div>
                </div>

                <button
                  style={{
                    ...styles.enchantButton,
                    ...((!playerGold || playerGold < TownService.calculateEnchantCost(selectedItem) || TownService.calculateEnchantCost(selectedItem) === 0) && styles.buttonDisabled)
                  }}
                  onClick={() => handleEnchantItem(selectedItem)}
                  disabled={
                    !playerGold ||
                    playerGold < TownService.calculateEnchantCost(selectedItem) ||
                    TownService.calculateEnchantCost(selectedItem) === 0
                  }
                >
                  {TownService.calculateEnchantCost(selectedItem) === 0
                    ? t('buildings.smithy.maxEnchant')
                    : playerGold < TownService.calculateEnchantCost(selectedItem)
                      ? t('buildings.smithy.notEnoughGold')
                      : t('buildings.smithy.enchantButton')
                  }
                </button>

                <div style={styles.warningBox}>
                  <strong>{t('buildings.smithy.warning.title')}</strong> {t('buildings.smithy.warning.message')}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div style={styles.infoBox}>
              <h4 style={styles.infoTitle}>{t('buildings.smithy.info.title')}</h4>
              <p style={styles.infoText}>
                • {t('buildings.smithy.info.item1')}
              </p>
              <p style={styles.infoText}>
                • {t('buildings.smithy.info.item2')}
              </p>
              <p style={styles.infoText}>
                • {t('buildings.smithy.info.item3')}
              </p>
              <p style={styles.infoText}>
                • {t('buildings.smithy.info.item4')}
              </p>
            </div>
          </>
        )}
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
  itemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: SPACING[3]
  },
  itemCard: {
    ...flexColumn,
    alignItems: 'center',
    padding: SPACING[3],
    background: `linear-gradient(135deg, ${COLORS.bgSurfaceLight} 0%, ${COLORS.bgSurface} 100%)`,
    border: '2px solid',
    borderRadius: BORDER_RADIUS.md,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase,
    position: 'relative'
  },
  itemCardSelected: {
    boxShadow: `0 0 ${SPACING.lg} rgba(45, 212, 191, 0.5)`,
    transform: 'scale(1.05)'
  },
  itemIcon: {
    fontSize: '36px',
    marginBottom: SPACING[2]
  },
  itemInfo: {
    textAlign: 'center',
    width: '100%'
  },
  itemName: {
    fontSize: FONT_SIZE['13'],
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING[1],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  itemSlot: {
    fontSize: FONT_SIZE['11'],
    color: COLORS.textGray,
    textTransform: 'capitalize',
    marginBottom: SPACING[1]
  },
  enchantLevel: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold
  },
  selectedBadge: {
    position: 'absolute',
    top: SPACING[2],
    right: SPACING[2],
    width: SPACING[6],
    height: SPACING[6],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: COLORS.primary,
    color: COLORS.bgDarkAlt,
    borderRadius: BORDER_RADIUS.round,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold
  },
  enchantPanel: {
    padding: SPACING.lg,
    background: `linear-gradient(135deg, ${COLORS.bgSurfaceLight} 0%, ${COLORS.bgSurface} 100%)`,
    border: `2px solid ${COLORS.primary}`,
    borderRadius: BORDER_RADIUS.lg,
    boxShadow: '0 4px 16px rgba(45, 212, 191, 0.2)'
  },
  panelTitle: {
    margin: `0 0 ${SPACING.md} 0`,
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary
  },
  enchantInfo: {
    marginBottom: SPACING.lg
  },
  infoRow: {
    ...flexBetween,
    padding: `${SPACING.sm} 0`,
    borderBottom: `1px solid rgba(51, 65, 85, 0.5)`
  },
  label: {
    color: COLORS.textGray,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium
  },
  value: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold
  },
  costValue: {
    color: COLORS.goldLight,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold
  },
  divider: {
    height: '1px',
    background: `linear-gradient(90deg, transparent 0%, ${COLORS.bgSurfaceLight} 50%, transparent 100%)`,
    margin: `${SPACING.sm} 0`
  },
  enchantButton: {
    width: '100%',
    padding: `${SPACING.md} ${SPACING[6]}`,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    color: COLORS.bgDarkAlt,
    border: 'none',
    borderRadius: BORDER_RADIUS.md,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase,
    boxShadow: '0 4px 12px rgba(45, 212, 191, 0.3)',
    marginBottom: SPACING.md
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: 'none'
  },
  warningBox: {
    padding: SPACING[3],
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: BORDER_RADIUS.sm,
    fontSize: FONT_SIZE['13'],
    color: '#fca5a5',
    textAlign: 'center'
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
  },
  emptyState: {
    flex: 1,
    ...flexColumn,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: SPACING.xxl
  },
  emptyIcon: {
    fontSize: '80px',
    marginBottom: SPACING.lg
  },
  emptyTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textLight,
    margin: `0 0 ${SPACING.md} 0`
  },
  emptyText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textGray,
    maxWidth: '400px',
    lineHeight: '1.6',
    margin: 0
  }
};
