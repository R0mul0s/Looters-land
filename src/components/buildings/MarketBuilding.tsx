/**
 * Market Building Component - Buy and sell items
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React, { useState, useEffect } from 'react';
import type { Inventory } from '../../engine/item/Inventory';
import type { Item } from '../../engine/item/Item';
import { MarketService, type ShopItem } from '../../services/MarketService';
import { RARITY_COLORS } from '../../types/item.types';
import { ItemTooltip } from '../ui/ItemTooltip';
import { t } from '../../localization/i18n';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS } from '../../styles/tokens';
import { flexBetween, flexColumn } from '../../styles/common';

interface MarketBuildingProps {
  townLevel: number;
  inventory: Inventory;
  playerGold: number;
  playerLevel?: number;
  onClose: () => void;
  onInventoryChange: (inventory: Inventory) => void;
  onGoldChange: (newGold: number) => void;
}

type MarketTab = 'buy' | 'sell';

export function MarketBuilding({
  inventory,
  playerGold,
  playerLevel = 1,
  onClose,
  onInventoryChange,
  onGoldChange
}: MarketBuildingProps) {
  const [activeTab, setActiveTab] = useState<MarketTab>('buy');
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [tooltip, setTooltip] = useState<{ item: Item; x: number; y: number } | null>(null);

  // Generate daily shop on mount
  useEffect(() => {
    const dateString = MarketService.getCurrentDateString();
    let dailyShop = MarketService.generateDailyShop(playerLevel, dateString);

    // Sort shop items by rarity, then level
    const rarityOrder: Record<string, number> = {
      mythic: 6,
      legendary: 5,
      epic: 4,
      rare: 3,
      uncommon: 2,
      common: 1
    };

    dailyShop = dailyShop.sort((a, b) => {
      // First by rarity (descending)
      const rarityDiff = (rarityOrder[b.item.rarity.toLowerCase()] || 0) - (rarityOrder[a.item.rarity.toLowerCase()] || 0);
      if (rarityDiff !== 0) return rarityDiff;

      // Then by level (descending)
      return b.item.level - a.item.level;
    });

    setShopItems(dailyShop);
  }, [playerLevel]);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleBuyItem = (shopItem: ShopItem) => {
    const result = MarketService.buyItem(
      shopItem.item,
      shopItem.price,
      inventory,
      playerGold
    );

    if (result.success) {
      onGoldChange(result.newGold);
      onInventoryChange(inventory);

      // Remove purchased item from shop (can only buy once)
      setShopItems(prevItems => prevItems.filter(item => item.item.id !== shopItem.item.id));

      showMessage(result.message, 'success');
    } else {
      showMessage(result.message, 'error');
    }
  };

  const handleSellItem = (item: Item) => {
    const result = MarketService.sellItem(item, inventory, playerGold);

    if (result.success) {
      onGoldChange(result.newGold);
      onInventoryChange(inventory);
      setSelectedItem(null);
      showMessage(result.message, 'success');
    } else {
      showMessage(result.message, 'error');
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>🏪 {t('buildings.market.title')}</h2>
        <div style={styles.goldDisplay}>
          💰 {playerGold.toLocaleString()}g
        </div>
        <button style={styles.closeButton} onClick={onClose}>✕</button>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'buy' ? styles.tabActive : {})
          }}
          onClick={() => setActiveTab('buy')}
        >
          🛒 {t('buildings.market.tabs.buy')}
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'sell' ? styles.tabActive : {})
          }}
          onClick={() => setActiveTab('sell')}
        >
          💸 {t('buildings.market.tabs.sell')}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          style={{
            ...styles.message,
            ...(message.type === 'success' ? styles.messageSuccess : styles.messageError)
          }}
        >
          {message.text}
        </div>
      )}

      {/* Content */}
      <div style={styles.content}>
        {activeTab === 'buy' ? renderBuyTab() : renderSellTab()}
      </div>

      {/* Item Tooltip */}
      {tooltip && (
        <ItemTooltip
          item={tooltip.item}
          x={tooltip.x}
          y={tooltip.y}
          customActions={activeTab === 'buy' ? 'Click to purchase' : 'Click to sell'}
        />
      )}
    </div>
  );

  function renderBuyTab() {
    return (
      <div style={styles.shopGrid}>
        {shopItems.map((shopItem, index) => (
          <div
            key={shopItem.item.id}
            style={styles.shopItemCard}
            onMouseEnter={(e) => setTooltip({ item: shopItem.item, x: e.clientX, y: e.clientY })}
            onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
            onMouseLeave={() => setTooltip(null)}
          >
            {/* Rarity badge */}
            <div
              style={{
                ...styles.rarityBadge,
                background: RARITY_COLORS[shopItem.item.rarity]
              }}
            >
              {shopItem.item.rarity}
            </div>

            <div style={styles.itemIcon}>{shopItem.item.icon}</div>
            <div style={styles.itemName}>{shopItem.item.name}</div>
            <div style={styles.itemType}>{shopItem.item.type}</div>
            <div style={styles.itemLevel}>Level {shopItem.item.level}</div>

            {/* Stats preview */}
            <div style={styles.statsPreview}>
              {shopItem.item.stats.HP > 0 && <div>❤️ +{shopItem.item.stats.HP}</div>}
              {shopItem.item.stats.ATK > 0 && <div>⚔️ +{shopItem.item.stats.ATK}</div>}
              {shopItem.item.stats.DEF > 0 && <div>🛡️ +{shopItem.item.stats.DEF}</div>}
            </div>

            <div style={styles.itemPrice}>💰 {shopItem.price}g</div>

            <button
              style={{
                ...styles.buyButton,
                ...(playerGold < shopItem.price ? styles.buyButtonDisabled : {})
              }}
              onClick={() => handleBuyItem(shopItem)}
              disabled={playerGold < shopItem.price}
            >
              {playerGold < shopItem.price ? t('buildings.market.buttons.notEnoughGold') : t('buildings.market.buttons.buy')}
            </button>
          </div>
        ))}
      </div>
    );
  }

  function renderSellTab() {
    // Sort inventory items by rarity, then level
    const rarityOrder: Record<string, number> = {
      mythic: 6,
      legendary: 5,
      epic: 4,
      rare: 3,
      uncommon: 2,
      common: 1
    };

    const sortedItems = [...inventory.items].sort((a, b) => {
      // First by rarity (descending)
      const rarityDiff = (rarityOrder[b.rarity.toLowerCase()] || 0) - (rarityOrder[a.rarity.toLowerCase()] || 0);
      if (rarityDiff !== 0) return rarityDiff;

      // Then by level (descending)
      return b.level - a.level;
    });

    return (
      <div style={styles.inventoryGrid}>
        {sortedItems.length === 0 ? (
          <div style={styles.emptyMessage}>
            {t('buildings.market.empty.message')}
          </div>
        ) : (
          sortedItems.map((item) => {
            const sellPrice = MarketService.calculateSellPrice(item);
            return (
              <div
                key={`market-sell-${item.id}`}
                style={{
                  ...styles.inventoryItemCard,
                  ...(selectedItem?.id === item.id ? styles.inventoryItemSelected : {})
                }}
                onClick={() => setSelectedItem(item)}
                onMouseEnter={(e) => setTooltip({ item, x: e.clientX, y: e.clientY })}
                onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Rarity badge */}
                <div
                  style={{
                    ...styles.rarityBadge,
                    background: RARITY_COLORS[item.rarity]
                  }}
                >
                  {item.rarity}
                </div>

                <div style={styles.itemIcon}>{item.icon}</div>
                <div style={styles.itemName}>{item.name}</div>
                <div style={styles.itemType}>{item.type}</div>

                {item.enchantLevel > 0 && (
                  <div style={styles.enchantBadge}>+{item.enchantLevel}</div>
                )}

                <div style={styles.sellPrice}>{t('buildings.market.sellPrice')} {sellPrice}g</div>

                <button
                  style={styles.sellButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSellItem(item);
                  }}
                >
                  {t('buildings.market.buttons.sell')}
                </button>
              </div>
            );
          })
        )}
      </div>
    );
  }
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
  goldDisplay: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.goldLight,
    background: 'rgba(251, 191, 36, 0.1)',
    padding: `${SPACING[2]} ${SPACING[4]}`,
    borderRadius: BORDER_RADIUS.md,
    border: '1px solid rgba(251, 191, 36, 0.3)'
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
  tabs: {
    display: 'flex',
    gap: SPACING.sm,
    padding: `${SPACING.md} ${SPACING.lg}`,
    borderBottom: '1px solid rgba(45, 212, 191, 0.2)'
  },
  tab: {
    flex: 1,
    padding: `${SPACING[3]} ${SPACING.lg}`,
    background: 'rgba(45, 212, 191, 0.1)',
    border: '1px solid rgba(45, 212, 191, 0.3)',
    borderRadius: BORDER_RADIUS.md,
    color: COLORS.textGray,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase
  },
  tabActive: {
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    color: COLORS.bgDarkAlt,
    border: `1px solid ${COLORS.primary}`,
    boxShadow: '0 4px 12px rgba(45, 212, 191, 0.4)'
  },
  message: {
    padding: `${SPACING[3]} ${SPACING.lg}`,
    margin: `${SPACING.sm} ${SPACING.lg}`,
    borderRadius: BORDER_RADIUS.md,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    textAlign: 'center'
  },
  messageSuccess: {
    background: 'rgba(34, 197, 94, 0.2)',
    border: '1px solid rgba(34, 197, 94, 0.4)',
    color: '#86efac'
  },
  messageError: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#fca5a5'
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: SPACING.lg
  },
  shopGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: SPACING.md
  },
  shopItemCard: {
    position: 'relative',
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
    border: '1px solid rgba(45, 212, 191, 0.2)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    textAlign: 'center',
    transition: TRANSITIONS.allSlow,
    cursor: 'pointer'
  },
  rarityBadge: {
    position: 'absolute',
    top: SPACING[2],
    right: SPACING[2],
    padding: `${SPACING[1]} ${SPACING[2]}`,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    textTransform: 'capitalize',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
    zIndex: 1
  },
  itemIcon: {
    fontSize: '48px',
    marginBottom: SPACING.sm
  },
  itemName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textLight,
    marginBottom: SPACING[1]
  },
  itemType: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textGray,
    marginBottom: SPACING[1],
    textTransform: 'capitalize'
  },
  itemLevel: {
    fontSize: FONT_SIZE['11'],
    color: COLORS.textDarkGray,
    marginBottom: SPACING[2]
  },
  statsPreview: {
    display: 'flex',
    justifyContent: 'center',
    gap: SPACING[2],
    fontSize: FONT_SIZE['11'],
    color: COLORS.primary,
    marginBottom: SPACING.sm
  },
  itemPrice: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.goldLight,
    marginBottom: SPACING.sm
  },
  buyButton: {
    width: '100%',
    padding: SPACING.sm,
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    border: 'none',
    borderRadius: BORDER_RADIUS.md,
    color: COLORS.bgDarkAlt,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase
  },
  buyButtonDisabled: {
    background: COLORS.bgSurfaceLight,
    color: COLORS.textDarkGray,
    cursor: 'not-allowed',
    opacity: 0.5
  },
  inventoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: SPACING[3]
  },
  inventoryItemCard: {
    position: 'relative',
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
    border: '1px solid rgba(45, 212, 191, 0.2)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[3],
    textAlign: 'center',
    cursor: 'pointer',
    transition: TRANSITIONS.allBase
  },
  inventoryItemSelected: {
    border: `2px solid ${COLORS.primary}`,
    boxShadow: '0 0 15px rgba(45, 212, 191, 0.3)'
  },
  enchantBadge: {
    display: 'inline-block',
    padding: `${SPACING.xxs} ${SPACING[2]}`,
    background: 'rgba(251, 191, 36, 0.2)',
    border: '1px solid rgba(251, 191, 36, 0.4)',
    borderRadius: BORDER_RADIUS.sm,
    fontSize: FONT_SIZE['11'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.goldLight,
    marginBottom: SPACING.sm
  },
  sellPrice: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: '#22c55e',
    marginBottom: SPACING[2]
  },
  sellButton: {
    width: '100%',
    padding: `${SPACING[2]} ${SPACING[4]}`,
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    border: 'none',
    borderRadius: BORDER_RADIUS.sm,
    color: COLORS.white,
    fontSize: FONT_SIZE['13'],
    fontWeight: FONT_WEIGHT.semibold,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase
  },
  emptyMessage: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: `${SPACING[16]} ${SPACING.lg}`,
    fontSize: FONT_SIZE.base,
    color: COLORS.textDarkGray
  }
};
