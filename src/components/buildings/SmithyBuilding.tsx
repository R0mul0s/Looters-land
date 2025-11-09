/**
 * Smithy Building Component - Equipment enchanting and repair services
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import React, { useState } from 'react';
import type { Inventory } from '../../engine/item/Inventory';
import type { Item } from '../../engine/item/Item';
import { TownService } from '../../services/TownService';

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
      setMessage({ text: 'Item is already at max enchant level (+10)!', type: 'error' });
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
  const equipmentItems = inventory.items.filter(
    item => ['helmet', 'chest', 'legs', 'boots', 'weapon', 'shield', 'accessory'].includes(item.slot)
  );

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
        <h2 style={styles.title}>⚒️ Smithy</h2>
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
            <h3 style={styles.emptyTitle}>No Equipment</h3>
            <p style={styles.emptyText}>
              You don't have any equipment items to enchant. Try exploring dungeons to find gear!
            </p>
          </div>
        ) : (
          <>
            {/* Item Grid */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Select Item to Enchant</h3>
              <div style={styles.itemsGrid}>
                {equipmentItems.map(item => {
                  const enchantCost = TownService.calculateEnchantCost(item);
                  const successRate = TownService.calculateEnchantSuccessRate(item);
                  const canAfford = playerGold >= enchantCost && enchantCost > 0;

                  return (
                    <div
                      key={item.id}
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
                <h3 style={styles.panelTitle}>Enchanting Details</h3>

                <div style={styles.enchantInfo}>
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Current Level:</span>
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
                    <span style={styles.label}>Next Level:</span>
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
                    <span style={styles.label}>Success Rate:</span>
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
                    <span style={styles.label}>Cost:</span>
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
                    ? 'Max Enchant Level'
                    : playerGold < TownService.calculateEnchantCost(selectedItem)
                      ? 'Not Enough Gold'
                      : 'Enchant Item'
                  }
                </button>

                <div style={styles.warningBox}>
                  <strong>Warning:</strong> Enchanting can fail! Gold is spent regardless of success.
                </div>
              </div>
            )}

            {/* Info Box */}
            <div style={styles.infoBox}>
              <h4 style={styles.infoTitle}>Enchanting System</h4>
              <p style={styles.infoText}>
                • Each enchant level adds bonus stats to your equipment
              </p>
              <p style={styles.infoText}>
                • Success rate decreases as enchant level increases
              </p>
              <p style={styles.infoText}>
                • Gold is spent even if enchanting fails
              </p>
              <p style={styles.infoText}>
                • Maximum enchant level is +10
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
  itemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '12px'
  },
  itemCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px',
    background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
    border: '2px solid',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative'
  },
  itemCardSelected: {
    boxShadow: '0 0 20px rgba(45, 212, 191, 0.5)',
    transform: 'scale(1.05)'
  },
  itemIcon: {
    fontSize: '36px',
    marginBottom: '8px'
  },
  itemInfo: {
    textAlign: 'center',
    width: '100%'
  },
  itemName: {
    fontSize: '13px',
    fontWeight: '700',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  itemSlot: {
    fontSize: '11px',
    color: '#94a3b8',
    textTransform: 'capitalize',
    marginBottom: '4px'
  },
  enchantLevel: {
    fontSize: '14px',
    fontWeight: '700'
  },
  selectedBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#2dd4bf',
    color: '#0f172a',
    borderRadius: '50%',
    fontSize: '14px',
    fontWeight: '700'
  },
  enchantPanel: {
    padding: '20px',
    background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
    border: '2px solid #2dd4bf',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(45, 212, 191, 0.2)'
  },
  panelTitle: {
    margin: '0 0 15px 0',
    fontSize: '20px',
    fontWeight: '700',
    color: '#2dd4bf'
  },
  enchantInfo: {
    marginBottom: '20px'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid rgba(51, 65, 85, 0.5)'
  },
  label: {
    color: '#94a3b8',
    fontSize: '14px',
    fontWeight: '500'
  },
  value: {
    fontSize: '14px',
    fontWeight: '700'
  },
  costValue: {
    color: '#fbbf24',
    fontSize: '14px',
    fontWeight: '700'
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent 0%, #334155 50%, transparent 100%)',
    margin: '10px 0'
  },
  enchantButton: {
    width: '100%',
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
    color: '#0f172a',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(45, 212, 191, 0.3)',
    marginBottom: '15px'
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: 'none'
  },
  warningBox: {
    padding: '12px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#fca5a5',
    textAlign: 'center'
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
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '40px'
  },
  emptyIcon: {
    fontSize: '80px',
    marginBottom: '20px'
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#f1f5f9',
    margin: '0 0 15px 0'
  },
  emptyText: {
    fontSize: '16px',
    color: '#94a3b8',
    maxWidth: '400px',
    lineHeight: '1.6',
    margin: 0
  }
};
