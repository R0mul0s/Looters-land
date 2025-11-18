/**
 * Market Building Component - Buy and sell items
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-18
 */

import React, { useState, useEffect } from 'react';
import type { Inventory } from '../../engine/item/Inventory';
import type { Item } from '../../engine/item/Item';
import { MarketService, type ShopItem } from '../../services/MarketService';
import { RARITY_COLORS } from '../../types/item.types';
import { ItemTooltip } from '../ui/ItemTooltip';
import { GameModal } from '../ui/GameModal';
import { ModalText, ModalButton } from '../ui/ModalContent';
import { ItemMultiSelect, type ItemMultiSelectAction } from '../ui/ItemMultiSelect';
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
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState<{ count: number; gold: number } | null>(null);

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

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAllGrey = () => {
    const greyItemIds = inventory.items
      .filter(item => item.rarity === 'common')
      .map(item => item.id);
    setSelectedItemIds(new Set(greyItemIds));
  };

  const clearSelection = () => {
    setSelectedItemIds(new Set());
  };

  const handleSellSelected = () => {
    if (selectedItemIds.size === 0) {
      showMessage(t('buildings.market.noItemsSelected'), 'error');
      return;
    }

    const itemsToSell = inventory.items.filter(item => selectedItemIds.has(item.id));
    const totalGold = itemsToSell.reduce((sum, item) => sum + MarketService.calculateSellPrice(item), 0);

    // Show confirmation modal
    setConfirmData({ count: itemsToSell.length, gold: totalGold });
    setShowConfirmModal(true);
  };

  const confirmSellSelected = () => {
    if (!confirmData) return;

    const itemsToSell = inventory.items.filter(item => selectedItemIds.has(item.id));
    let soldCount = 0;
    let earnedGold = 0;

    for (const item of itemsToSell) {
      const result = MarketService.sellItem(item, inventory, playerGold + earnedGold);
      if (result.success) {
        soldCount++;
        earnedGold += MarketService.calculateSellPrice(item);
      }
    }

    onGoldChange(playerGold + earnedGold);
    onInventoryChange(inventory);
    setSelectedItemIds(new Set());
    setShowConfirmModal(false);
    setConfirmData(null);

    const message = t('buildings.market.soldMultiple', { count: soldCount, gold: earnedGold });
    showMessage(message.replace('{{count}}', soldCount.toString()).replace('{{gold}}', earnedGold.toString()), 'success');
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

      {/* Confirmation Modal */}
      <GameModal
        isOpen={showConfirmModal}
        title={t('buildings.market.buttons.sellSelected')}
        icon="💰"
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmData(null);
        }}
        maxWidth="400px"
      >
        <ModalText>
          {confirmData && t('buildings.market.confirmSellMultiple', { count: confirmData.count, gold: confirmData.gold })
            .replace('{{count}}', confirmData.count.toString())
            .replace('{{gold}}', confirmData.gold.toString())}
        </ModalText>
        <div style={{ display: 'flex', gap: SPACING[3], marginTop: SPACING[4] }}>
          <ModalButton
            onClick={() => {
              setShowConfirmModal(false);
              setConfirmData(null);
            }}
            variant="secondary"
          >
            {t('buildings.close')}
          </ModalButton>
          <ModalButton
            onClick={confirmSellSelected}
            variant="primary"
          >
            {t('buildings.market.buttons.sell')}
          </ModalButton>
        </div>
      </GameModal>
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

    const selectedItems = inventory.items.filter(item => selectedItemIds.has(item.id));
    const totalSelectedGold = selectedItems.reduce((sum, item) => sum + MarketService.calculateSellPrice(item), 0);

    // Define actions for multi-select
    const actions: ItemMultiSelectAction[] = [
      {
        label: t('buildings.market.buttons.selectAllGrey'),
        icon: '✅',
        onClick: selectAllGrey
      },
      {
        label: t('buildings.market.buttons.clearSelection'),
        icon: '❌',
        onClick: clearSelection,
        disabled: selectedItemIds.size === 0
      },
      {
        label: `${t('buildings.market.buttons.sellSelected')} (${selectedItemIds.size}) - ${totalSelectedGold}g`,
        icon: '💰',
        onClick: handleSellSelected,
        disabled: selectedItemIds.size === 0,
        variant: 'primary'
      }
    ];

    return (
      <ItemMultiSelect
        items={sortedItems}
        selectedItemIds={selectedItemIds}
        onToggleSelection={toggleItemSelection}
        actions={actions}
        getItemInfo={(item) => `${t('buildings.market.sellPrice')} ${MarketService.calculateSellPrice(item)}g`}
        itemActionLabel={t('buildings.market.buttons.sell')}
        onItemAction={handleSellItem}
        emptyMessage={t('buildings.market.empty.message')}
        onMouseEnter={(item, x, y) => setTooltip({ item, x, y })}
        onMouseMove={(item, x, y) => setTooltip(prev => prev ? { ...prev, x, y } : null)}
        onMouseLeave={() => setTooltip(null)}
      />
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
