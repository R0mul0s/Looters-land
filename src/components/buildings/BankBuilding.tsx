/**
 * Bank Building Component - Item vault storage and vault upgrades
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-18
 */

import React, { useState, useEffect } from 'react';
import type { Inventory } from '../../engine/item/Inventory';
import type { Item } from '../../engine/item/Item';
import { BankService, type BankInventoryItem } from '../../services/BankService';
import { getBankVaultSlots, getBankUpgradeCost, getBankEnergyBonus, calculateDepositFee } from '../../config/BALANCE_CONFIG';
import { ItemMultiSelect, type ItemMultiSelectAction } from '../ui/ItemMultiSelect';
import { GameModal } from '../ui/GameModal';
import { ModalText, ModalButton } from '../ui/ModalContent';
import { t } from '../../localization/i18n';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS } from '../../styles/tokens';
import { flexBetween, flexColumn } from '../../styles/common';

interface BankBuildingProps {
  userId: string;
  inventory: Inventory;
  playerGold: number;
  energy: number;
  maxEnergy: number;
  bankVaultTier: number;
  bankVaultMaxSlots: number;
  bankTotalItems: number;
  onClose: () => void;
  onInventoryChange: (inventory: Inventory) => void;
  onGoldChange: (newGold: number) => void;
  // onEnergyChange: removed - energy is updated directly in database by BankService
  onBankVaultChange: (tier: number, maxSlots: number, totalItems: number) => void;
  onMaxEnergyChange: (newMaxEnergy: number) => void;
}

export function BankBuilding({
  userId,
  inventory,
  playerGold,
  energy,
  maxEnergy,
  bankVaultTier,
  bankVaultMaxSlots,
  bankTotalItems,
  onClose,
  onInventoryChange,
  onGoldChange,
  onBankVaultChange,
  onMaxEnergyChange
}: BankBuildingProps) {
  const [bankItems, setBankItems] = useState<BankInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'inventory' | 'bank'>('inventory');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [selectedBankItemIds, setSelectedBankItemIds] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [confirmData, setConfirmData] = useState<{ count: number; fee: number } | null>(null);
  const [withdrawData, setWithdrawData] = useState<{ count: number } | null>(null);

  // Load bank inventory on mount
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (isMounted) {
        await loadBankInventory();
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const loadBankInventory = async () => {
    setLoading(true);
    const items = await BankService.getBankInventory(userId);
    setBankItems(items);
    setLoading(false);
  };

  const handleDeposit = async (item: Item) => {
    const fee = calculateDepositFee(item.goldValue);

    if (playerGold < fee) {
      setMessage({ text: `Not enough gold! Deposit fee: ${fee.toLocaleString()}g`, type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (bankTotalItems >= bankVaultMaxSlots) {
      setMessage({ text: `Bank vault is full! (${bankTotalItems}/${bankVaultMaxSlots} slots)`, type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const result = await BankService.depositItem(userId, item.id, playerGold);

    if (result.success && result.newGold !== undefined && result.newBankCount !== undefined) {
      // Remove item from local inventory (it's now in bank in database)
      inventory.removeItem(item.id);
      onInventoryChange(inventory);
      onGoldChange(result.newGold);
      onBankVaultChange(bankVaultTier, bankVaultMaxSlots, result.newBankCount);

      // Reload bank inventory to show the deposited item
      await loadBankInventory();

      setMessage({ text: result.message, type: 'success' });
    } else {
      setMessage({ text: result.message, type: 'error' });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  const handleWithdraw = async (bankItem: BankInventoryItem) => {
    const currentInventoryCount = inventory.items.length;
    const maxInventorySlots = inventory.maxSlots;

    if (currentInventoryCount >= maxInventorySlots) {
      setMessage({ text: `Inventory is full! (${currentInventoryCount}/${maxInventorySlots} slots)`, type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const result = await BankService.withdrawItem(userId, bankItem.item_id, currentInventoryCount, maxInventorySlots);

    if (result.success && result.newBankCount !== undefined) {
      // Add item to local inventory with location='inventory'
      const item = BankService.convertBankItemToItem(bankItem);
      inventory.addItem(item);
      onInventoryChange(inventory);
      onBankVaultChange(bankVaultTier, bankVaultMaxSlots, result.newBankCount);

      // Reload bank inventory to remove the withdrawn item from display
      await loadBankInventory();

      setMessage({ text: result.message, type: 'success' });
    } else {
      setMessage({ text: result.message, type: 'error' });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpgradeVault = async () => {
    const result = await BankService.upgradeVault(userId, playerGold, maxEnergy, energy);

    if (result.success && result.newTier && result.newMaxSlots && result.newGold !== undefined && result.newEnergy !== undefined && result.newMaxEnergy) {
      onGoldChange(result.newGold);
      // NOTE: Energy is already updated in database by BankService.upgradeVault()
      // Calling onEnergyChange() here would add energy twice (db + local state)
      // The state will sync from database on next update/realtime event
      // onEnergyChange(result.newEnergy); // REMOVED - causes duplicate energy add
      onBankVaultChange(result.newTier, result.newMaxSlots, bankTotalItems);
      onMaxEnergyChange(result.newMaxEnergy);

      setMessage({ text: result.message, type: 'success' });
    } else {
      setMessage({ text: result.message, type: 'error' });
    }

    setTimeout(() => setMessage(null), 3000);
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

  const selectAllItems = () => {
    const allItemIds = inventoryItems.map(item => item.id);
    setSelectedItemIds(new Set(allItemIds));
  };

  const clearSelection = () => {
    setSelectedItemIds(new Set());
  };

  const handleDepositSelected = () => {
    if (selectedItemIds.size === 0) {
      setMessage({ text: t('buildings.bank.noItemsSelected'), type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const itemsToDeposit = inventoryItems.filter(item => selectedItemIds.has(item.id));
    const totalFee = itemsToDeposit.reduce((sum, item) => sum + calculateDepositFee(item.goldValue), 0);

    // Show confirmation modal
    setConfirmData({ count: itemsToDeposit.length, fee: totalFee });
    setShowConfirmModal(true);
  };

  const confirmDepositSelected = async () => {
    if (!confirmData) return;

    const itemsToDeposit = inventoryItems.filter(item => selectedItemIds.has(item.id));
    let depositedCount = 0;
    let totalFeePaid = 0;

    for (const item of itemsToDeposit) {
      const fee = calculateDepositFee(item.goldValue);

      if (playerGold - totalFeePaid < fee) {
        break; // Not enough gold for more deposits
      }

      if (bankTotalItems + depositedCount >= bankVaultMaxSlots) {
        break; // Bank is full
      }

      const result = await BankService.depositItem(userId, item.id, playerGold - totalFeePaid);

      if (result.success && result.newGold !== undefined && result.newBankCount !== undefined) {
        inventory.removeItem(item.id);
        depositedCount++;
        totalFeePaid += fee;
      }
    }

    if (depositedCount > 0) {
      onInventoryChange(inventory);
      onGoldChange(playerGold - totalFeePaid);
      onBankVaultChange(bankVaultTier, bankVaultMaxSlots, bankTotalItems + depositedCount);
      await loadBankInventory();

      const message = t('buildings.bank.depositedMultiple', { count: depositedCount, fee: totalFeePaid });
      setMessage({
        text: message.replace('{{count}}', depositedCount.toString()).replace('{{fee}}', totalFeePaid.toString()),
        type: 'success'
      });
    }

    setSelectedItemIds(new Set());
    setShowConfirmModal(false);
    setConfirmData(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const toggleBankItemSelection = (itemId: string) => {
    setSelectedBankItemIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAllBankItems = () => {
    const allBankItemIds = bankItems.map(item => item.item_id);
    setSelectedBankItemIds(new Set(allBankItemIds));
  };

  const clearBankSelection = () => {
    setSelectedBankItemIds(new Set());
  };

  const handleWithdrawSelected = () => {
    if (selectedBankItemIds.size === 0) {
      setMessage({ text: t('buildings.bank.noItemsSelected'), type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    // Show confirmation modal
    setWithdrawData({ count: selectedBankItemIds.size });
    setShowWithdrawModal(true);
  };

  const confirmWithdrawSelected = async () => {
    if (!withdrawData) return;

    const currentInventoryCount = inventory.items.length;
    const maxInventorySlots = inventory.maxSlots;

    const itemsToWithdraw = bankItems.filter(item => selectedBankItemIds.has(item.item_id));
    let withdrawnCount = 0;

    for (const bankItem of itemsToWithdraw) {
      if (currentInventoryCount + withdrawnCount >= maxInventorySlots) {
        break; // Inventory is full
      }

      const result = await BankService.withdrawItem(userId, bankItem.item_id, currentInventoryCount + withdrawnCount, maxInventorySlots);

      if (result.success && result.newBankCount !== undefined) {
        // Add item to local inventory
        const item = BankService.convertBankItemToItem(bankItem);
        inventory.addItem(item);
        withdrawnCount++;
      }
    }

    if (withdrawnCount > 0) {
      onInventoryChange(inventory);
      onBankVaultChange(bankVaultTier, bankVaultMaxSlots, bankTotalItems - withdrawnCount);
      await loadBankInventory();

      const message = t('buildings.bank.withdrawnMultiple', { count: withdrawnCount });
      setMessage({
        text: message.replace('{{count}}', withdrawnCount.toString()),
        type: 'success'
      });
    }

    setSelectedBankItemIds(new Set());
    setShowWithdrawModal(false);
    setWithdrawData(null);
    setTimeout(() => setMessage(null), 3000);
  };

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

  // Filter inventory items (only equipment, not in bank)
  const inventoryItems = inventory.items.filter(
    item => ['helmet', 'chest', 'legs', 'boots', 'weapon', 'shield', 'accessory'].includes(item.slot)
  );

  const upgradeCost = getBankUpgradeCost(bankVaultTier);
  const nextTierSlots = getBankVaultSlots(bankVaultTier + 1);
  const nextTierEnergyBonus = getBankEnergyBonus(bankVaultTier + 1);
  const currentEnergyBonus = getBankEnergyBonus(bankVaultTier);
  const energyBonusIncrease = nextTierEnergyBonus - currentEnergyBonus;
  const canUpgrade = bankVaultTier < 5 && playerGold >= upgradeCost;
  const capacityPercent = bankVaultMaxSlots > 0 ? (bankTotalItems / bankVaultMaxSlots) * 100 : 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>🏦 {t('buildings.bank.title')}</h2>
        <button style={styles.closeButton} onClick={onClose}>✕</button>
      </div>

      {/* Message Banner */}
      {message && (
        <div style={{
          ...styles.messageBanner,
          background: message.type === 'success'
            ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%)'
            : 'linear-gradient(90deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.05) 100%)',
          borderLeft: `4px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Vault Info Panel */}
      <div style={styles.vaultInfoPanel}>
        <div style={styles.vaultInfo}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>💰 Your Gold:</span>
            <span style={styles.infoValue}>{playerGold.toLocaleString()}g</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>🏦 Vault Tier:</span>
            <span style={styles.infoValue}>
              Tier {bankVaultTier} ({bankVaultMaxSlots} slots)
            </span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>📦 Items Stored:</span>
            <span style={styles.infoValue}>
              {bankTotalItems} / {bankVaultMaxSlots}
            </span>
          </div>
          <div style={styles.capacityBar}>
            <div style={{
              ...styles.capacityBarFill,
              width: `${capacityPercent}%`,
              background: capacityPercent > 90 ? '#ef4444' : capacityPercent > 70 ? '#f59e0b' : '#10b981'
            }} />
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>⚡ Energy Bonus:</span>
            <span style={styles.infoValue}>+{currentEnergyBonus} max energy</span>
          </div>
        </div>

        {/* Upgrade Section */}
        {bankVaultTier < 5 && (
          <div style={styles.upgradeSection}>
            <h3 style={styles.upgradeTitle}>💎 Upgrade Vault</h3>
            <div style={styles.upgradeStat}>
              Next: Tier {bankVaultTier + 1} ({nextTierSlots} slots)
            </div>
            <div style={styles.upgradeStat}>
              Energy Bonus: +{energyBonusIncrease} ({currentEnergyBonus} → {nextTierEnergyBonus})
            </div>
            <div style={styles.upgradeStat}>
              Cost: {upgradeCost.toLocaleString()}g
            </div>
            <button
              style={{
                ...styles.upgradeButton,
                opacity: canUpgrade ? 1 : 0.5,
                cursor: canUpgrade ? 'pointer' : 'not-allowed'
              }}
              onClick={handleUpgradeVault}
              disabled={!canUpgrade}
            >
              {canUpgrade ? `Upgrade to Tier ${bankVaultTier + 1}` : 'Insufficient Gold'}
            </button>
          </div>
        )}
        {bankVaultTier === 5 && (
          <div style={styles.upgradeSection}>
            <div style={styles.maxTierMessage}>
              ✨ Maximum vault tier reached!
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabBar}>
        <button
          style={{
            ...styles.tab,
            ...(selectedTab === 'inventory' ? styles.tabActive : {})
          }}
          onClick={() => setSelectedTab('inventory')}
        >
          🎒 Your Inventory ({inventoryItems.length}/{inventory.maxSlots})
        </button>
        <button
          style={{
            ...styles.tab,
            ...(selectedTab === 'bank' ? styles.tabActive : {})
          }}
          onClick={() => setSelectedTab('bank')}
        >
          🏦 Bank Storage ({bankTotalItems}/{bankVaultMaxSlots})
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : (
          <>
            {/* Inventory Tab */}
            {selectedTab === 'inventory' && (() => {
              const selectedItems = inventoryItems.filter(item => selectedItemIds.has(item.id));
              const totalFee = selectedItems.reduce((sum, item) => sum + calculateDepositFee(item.goldValue), 0);

              const actions: ItemMultiSelectAction[] = [
                {
                  label: t('buildings.bank.buttons.selectAll'),
                  icon: '✅',
                  onClick: selectAllItems
                },
                {
                  label: t('buildings.bank.buttons.clearSelection'),
                  icon: '❌',
                  onClick: clearSelection,
                  disabled: selectedItemIds.size === 0
                },
                {
                  label: `${t('buildings.bank.buttons.depositSelected')} (${selectedItemIds.size}) - ${totalFee}g`,
                  icon: '🏦',
                  onClick: handleDepositSelected,
                  disabled: selectedItemIds.size === 0,
                  variant: 'primary'
                }
              ];

              return (
                <ItemMultiSelect
                  items={inventoryItems}
                  selectedItemIds={selectedItemIds}
                  onToggleSelection={toggleItemSelection}
                  actions={actions}
                  getItemInfo={(item) => `Deposit fee: ${calculateDepositFee(item.goldValue)}g`}
                  itemActionLabel="Deposit"
                  onItemAction={handleDeposit}
                  emptyMessage="No items in inventory"
                />
              );
            })()}

            {/* Bank Tab */}
            {selectedTab === 'bank' && (() => {
              // Convert BankInventoryItem to Item for ItemMultiSelect
              const bankItemsAsItems = bankItems.map(bankItem => BankService.convertBankItemToItem(bankItem));

              const actions: ItemMultiSelectAction[] = [
                { label: t('buildings.bank.buttons.selectAll'), icon: '✅', onClick: selectAllBankItems },
                { label: t('buildings.bank.buttons.clearSelection'), icon: '❌', onClick: clearBankSelection, disabled: selectedBankItemIds.size === 0 },
                {
                  label: `${t('buildings.bank.buttons.withdrawSelected')} (${selectedBankItemIds.size})`,
                  icon: '📤',
                  onClick: handleWithdrawSelected,
                  disabled: selectedBankItemIds.size === 0,
                  variant: 'primary'
                }
              ];

              return (
                <ItemMultiSelect
                  items={bankItemsAsItems}
                  selectedItemIds={selectedBankItemIds}
                  onToggleSelection={toggleBankItemSelection}
                  actions={actions}
                  getItemInfo={() => 'Withdraw: Free'}
                  itemActionLabel="Withdraw"
                  onItemAction={(item) => {
                    const bankItem = bankItems.find(bi => bi.item_id === item.id);
                    if (bankItem) handleWithdraw(bankItem);
                  }}
                  emptyMessage="No items in bank vault"
                />
              );
            })()}
          </>
        )}
      </div>

      {/* Deposit Confirmation Modal */}
      <GameModal
        isOpen={showConfirmModal}
        title={t('buildings.bank.buttons.depositSelected')}
        icon="🏦"
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmData(null);
        }}
        maxWidth="400px"
      >
        <ModalText>
          {confirmData && t('buildings.bank.confirmDepositMultiple', { count: confirmData.count, fee: confirmData.fee })
            .replace('{{count}}', confirmData.count.toString())
            .replace('{{fee}}', confirmData.fee.toString())}
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
            onClick={confirmDepositSelected}
            variant="primary"
          >
            Deposit
          </ModalButton>
        </div>
      </GameModal>

      {/* Withdraw Confirmation Modal */}
      <GameModal
        isOpen={showWithdrawModal}
        title={t('buildings.bank.buttons.withdrawSelected')}
        icon="📤"
        onClose={() => {
          setShowWithdrawModal(false);
          setWithdrawData(null);
        }}
        maxWidth="400px"
      >
        <ModalText>
          {withdrawData && t('buildings.bank.confirmWithdrawMultiple', { count: withdrawData.count })
            .replace('{{count}}', withdrawData.count.toString())}
        </ModalText>
        <div style={{ display: 'flex', gap: SPACING[3], marginTop: SPACING[4] }}>
          <ModalButton
            onClick={() => {
              setShowWithdrawModal(false);
              setWithdrawData(null);
            }}
            variant="secondary"
          >
            {t('buildings.close')}
          </ModalButton>
          <ModalButton
            onClick={confirmWithdrawSelected}
            variant="primary"
          >
            Withdraw
          </ModalButton>
        </div>
      </GameModal>
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
    padding: SPACING.lg,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.medium
  },
  vaultInfoPanel: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: SPACING.lg,
    padding: SPACING.lg,
    background: 'rgba(0, 0, 0, 0.2)',
    borderBottom: `1px solid ${COLORS.bgSurfaceLight}`
  },
  vaultInfo: {
    ...flexColumn,
    gap: SPACING[2]
  },
  infoRow: {
    ...flexBetween,
    fontSize: FONT_SIZE.base
  },
  infoLabel: {
    color: COLORS.textGray
  },
  infoValue: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semibold
  },
  capacityBar: {
    width: '100%',
    height: '8px',
    background: COLORS.bgDark,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
    marginTop: SPACING[1]
  },
  capacityBarFill: {
    height: '100%',
    transition: 'width 0.3s ease, background 0.3s ease',
    borderRadius: BORDER_RADIUS.round
  },
  upgradeSection: {
    ...flexColumn,
    gap: SPACING[2],
    padding: SPACING.lg,
    background: 'rgba(45, 212, 191, 0.05)',
    border: '1px solid rgba(45, 212, 191, 0.2)',
    borderRadius: BORDER_RADIUS.lg
  },
  upgradeTitle: {
    margin: 0,
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary
  },
  upgradeStat: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight
  },
  upgradeButton: {
    marginTop: SPACING[2],
    padding: `${SPACING[3]} ${SPACING.lg}`,
    background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
    border: 'none',
    borderRadius: BORDER_RADIUS.md,
    color: COLORS.textLight,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    transition: TRANSITIONS.allBase
  },
  maxTierMessage: {
    padding: SPACING.lg,
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: '#ff8c00',
    textAlign: 'center'
  },
  tabBar: {
    display: 'flex',
    borderBottom: `2px solid ${COLORS.bgSurfaceLight}`,
    background: COLORS.bgDark
  },
  tab: {
    flex: 1,
    padding: SPACING.lg,
    background: 'transparent',
    border: 'none',
    color: COLORS.textGray,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.medium,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase,
    borderBottom: '2px solid transparent'
  },
  tabActive: {
    color: COLORS.primary,
    borderBottom: `2px solid ${COLORS.primary}`,
    background: 'rgba(45, 212, 191, 0.05)'
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    overflow: 'auto'
  },
  loading: {
    textAlign: 'center',
    fontSize: FONT_SIZE.xl,
    color: COLORS.textGray,
    padding: SPACING.xxl
  },
  emptyMessage: {
    textAlign: 'center',
    fontSize: FONT_SIZE.lg,
    color: COLORS.textGray,
    padding: SPACING.xxl
  },
  itemGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: SPACING.lg
  },
  itemCard: {
    ...flexColumn,
    gap: SPACING[2],
    padding: SPACING.lg,
    background: COLORS.bgSurface,
    border: `1px solid ${COLORS.bgSurfaceLight}`,
    borderRadius: BORDER_RADIUS.lg,
    transition: TRANSITIONS.allBase
  },
  itemHeader: {
    ...flexBetween,
    alignItems: 'center'
  },
  itemName: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold
  },
  enchantBadge: {
    padding: `${SPACING[1]} ${SPACING[2]}`,
    borderRadius: BORDER_RADIUS.md,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textLight
  },
  itemDetails: {
    ...flexColumn,
    gap: SPACING[1],
    fontSize: FONT_SIZE.sm,
    color: COLORS.textGray
  },
  actionButton: {
    marginTop: SPACING[2],
    padding: `${SPACING[2]} ${SPACING.lg}`,
    border: 'none',
    borderRadius: BORDER_RADIUS.md,
    color: COLORS.textLight,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase
  }
};
