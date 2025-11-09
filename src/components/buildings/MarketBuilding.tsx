/**
 * Market Building Component - Buy and sell items
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-08
 */

import React, { useState, useEffect } from 'react';
import type { Inventory } from '../../engine/item/Inventory';
import type { Item } from '../../engine/item/Item';
import { MarketService, type ShopItem } from '../../services/MarketService';
import { RARITY_COLORS } from '../../types/item.types';
import { ItemTooltip } from '../ui/ItemTooltip';

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
    const dailyShop = MarketService.generateDailyShop(playerLevel, dateString);
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
        <h2 style={styles.title}>🏪 Market</h2>
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
          🛒 Buy Items
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'sell' ? styles.tabActive : {})
          }}
          onClick={() => setActiveTab('sell')}
        >
          💸 Sell Items
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
              {playerGold < shopItem.price ? 'Not Enough Gold' : 'Buy'}
            </button>
          </div>
        ))}
      </div>
    );
  }

  function renderSellTab() {
    return (
      <div style={styles.inventoryGrid}>
        {inventory.items.length === 0 ? (
          <div style={styles.emptyMessage}>
            No items to sell. Go explore dungeons to find loot!
          </div>
        ) : (
          inventory.items.map((item) => {
            const sellPrice = MarketService.calculateSellPrice(item);
            return (
              <div
                key={item.id}
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

                <div style={styles.sellPrice}>Sell: {sellPrice}g</div>

                <button
                  style={styles.sellButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSellItem(item);
                  }}
                >
                  Sell
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
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    color: '#f1f5f9'
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
  goldDisplay: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fbbf24',
    background: 'rgba(251, 191, 36, 0.1)',
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid rgba(251, 191, 36, 0.3)'
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
  tabs: {
    display: 'flex',
    gap: '10px',
    padding: '15px 20px',
    borderBottom: '1px solid rgba(45, 212, 191, 0.2)'
  },
  tab: {
    flex: 1,
    padding: '12px 20px',
    background: 'rgba(45, 212, 191, 0.1)',
    border: '1px solid rgba(45, 212, 191, 0.3)',
    borderRadius: '8px',
    color: '#94a3b8',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  tabActive: {
    background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
    color: '#0f172a',
    border: '1px solid #2dd4bf',
    boxShadow: '0 4px 12px rgba(45, 212, 191, 0.4)'
  },
  message: {
    padding: '12px 20px',
    margin: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
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
    padding: '20px'
  },
  shopGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '15px'
  },
  shopItemCard: {
    position: 'relative',
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
    border: '1px solid rgba(45, 212, 191, 0.2)',
    borderRadius: '12px',
    padding: '15px',
    textAlign: 'center',
    transition: 'all 0.3s',
    cursor: 'pointer'
  },
  rarityBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    padding: '4px 8px',
    fontSize: '10px',
    fontWeight: '700',
    color: 'white',
    borderRadius: '6px',
    textTransform: 'capitalize',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
    zIndex: 1
  },
  itemIcon: {
    fontSize: '48px',
    marginBottom: '10px'
  },
  itemName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: '4px'
  },
  itemType: {
    fontSize: '12px',
    color: '#94a3b8',
    marginBottom: '4px',
    textTransform: 'capitalize'
  },
  itemLevel: {
    fontSize: '11px',
    color: '#64748b',
    marginBottom: '8px'
  },
  statsPreview: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '11px',
    color: '#2dd4bf',
    marginBottom: '10px'
  },
  itemPrice: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#fbbf24',
    marginBottom: '10px'
  },
  buyButton: {
    width: '100%',
    padding: '10px',
    background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#0f172a',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  buyButtonDisabled: {
    background: '#334155',
    color: '#64748b',
    cursor: 'not-allowed',
    opacity: 0.5
  },
  inventoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '12px'
  },
  inventoryItemCard: {
    position: 'relative',
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
    border: '1px solid rgba(45, 212, 191, 0.2)',
    borderRadius: '12px',
    padding: '12px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  inventoryItemSelected: {
    border: '2px solid #2dd4bf',
    boxShadow: '0 0 15px rgba(45, 212, 191, 0.3)'
  },
  enchantBadge: {
    display: 'inline-block',
    padding: '3px 8px',
    background: 'rgba(251, 191, 36, 0.2)',
    border: '1px solid rgba(251, 191, 36, 0.4)',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#fbbf24',
    marginBottom: '6px'
  },
  sellPrice: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#22c55e',
    marginBottom: '8px'
  },
  sellButton: {
    width: '100%',
    padding: '8px',
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  emptyMessage: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '16px',
    color: '#64748b'
  }
};
