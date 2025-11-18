/**
 * ItemMultiSelect Component - Reusable multi-select item grid
 *
 * Used for selecting multiple items with checkboxes in various contexts:
 * - Market: Sell multiple items
 * - Bank: Deposit/withdraw multiple items
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-18
 */

import React from 'react';
import type { Item } from '../../engine/item/Item';
import { RARITY_COLORS } from '../../types/item.types';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS } from '../../styles/tokens';

export interface ItemMultiSelectAction {
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface ItemMultiSelectProps {
  /** Items to display in the grid */
  items: Item[];

  /** Set of selected item IDs */
  selectedItemIds: Set<string>;

  /** Callback when item selection is toggled */
  onToggleSelection: (itemId: string) => void;

  /** Action buttons to display above the grid */
  actions: ItemMultiSelectAction[];

  /** Optional: Additional info to display per item (e.g., "Sell: 100g") */
  getItemInfo?: (item: Item) => string;

  /** Optional: Primary action button for individual items (e.g., "Sell") */
  itemActionLabel?: string;

  /** Optional: Callback for individual item action */
  onItemAction?: (item: Item) => void;

  /** Optional: Message to show when no items */
  emptyMessage?: string;

  /** Optional: Tooltip handler */
  onMouseEnter?: (item: Item, x: number, y: number) => void;
  onMouseMove?: (item: Item, x: number, y: number) => void;
  onMouseLeave?: () => void;
}

/**
 * Reusable multi-select item grid component
 *
 * Features:
 * - Checkbox selection for multiple items
 * - Action buttons (Select All, Clear, etc.)
 * - Individual item action button
 * - Rarity-based styling
 * - Enchant level badge
 * - Tooltip support
 *
 * @example
 * ```tsx
 * <ItemMultiSelect
 *   items={inventory.items}
 *   selectedItemIds={selectedIds}
 *   onToggleSelection={(id) => toggleSelection(id)}
 *   actions={[
 *     { label: 'Select All Grey', icon: '✅', onClick: selectAllGrey },
 *     { label: 'Clear', icon: '❌', onClick: clearSelection },
 *     { label: `Sell Selected (${count})`, icon: '💰', onClick: sellSelected, variant: 'primary' }
 *   ]}
 *   getItemInfo={(item) => `Sell: ${calculatePrice(item)}g`}
 *   itemActionLabel="Sell"
 *   onItemAction={(item) => handleSell(item)}
 *   emptyMessage="No items to sell"
 * />
 * ```
 */
export function ItemMultiSelect({
  items,
  selectedItemIds,
  onToggleSelection,
  actions,
  getItemInfo,
  itemActionLabel,
  onItemAction,
  emptyMessage = 'No items available',
  onMouseEnter,
  onMouseMove,
  onMouseLeave
}: ItemMultiSelectProps) {
  return (
    <div style={styles.container}>
      {/* Action buttons */}
      <div style={styles.actions}>
        {actions.map((action, index) => (
          <button
            key={index}
            style={{
              ...styles.actionButton,
              ...(action.variant === 'primary' ? styles.actionButtonPrimary : {}),
              ...(action.variant === 'danger' ? styles.actionButtonDanger : {}),
              ...(action.disabled ? styles.actionButtonDisabled : {})
            }}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.icon} {action.label}
          </button>
        ))}
      </div>

      {/* Item grid */}
      <div style={styles.grid}>
        {items.length === 0 ? (
          <div style={styles.emptyMessage}>{emptyMessage}</div>
        ) : (
          items.map((item) => {
            const isSelected = selectedItemIds.has(item.id);
            return (
              <div
                key={item.id}
                style={{
                  ...styles.itemCard,
                  ...(isSelected ? styles.itemCardSelected : {})
                }}
                onMouseEnter={(e) => onMouseEnter?.(item, e.clientX, e.clientY)}
                onMouseMove={(e) => onMouseMove?.(item, e.clientX, e.clientY)}
                onMouseLeave={() => onMouseLeave?.()}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelection(item.id)}
                  style={styles.checkbox}
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Rarity badge */}
                <div
                  style={{
                    ...styles.rarityBadge,
                    background: RARITY_COLORS[item.rarity]
                  }}
                >
                  {item.rarity}
                </div>

                {/* Item content */}
                <div style={styles.itemIcon}>{item.icon}</div>
                <div style={styles.itemName}>{item.name}</div>
                <div style={styles.itemType}>{item.type}</div>

                {/* Enchant level badge */}
                {item.enchantLevel > 0 && (
                  <div style={styles.enchantBadge}>+{item.enchantLevel}</div>
                )}

                {/* Item info (e.g., sell price, deposit fee) */}
                {getItemInfo && (
                  <div style={styles.itemInfo}>{getItemInfo(item)}</div>
                )}

                {/* Individual item action button */}
                {itemActionLabel && onItemAction && (
                  <button
                    style={styles.itemActionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemAction(item);
                    }}
                  >
                    {itemActionLabel}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING[4],
    height: '100%'
  },
  actions: {
    display: 'flex',
    gap: SPACING[3],
    padding: SPACING[4],
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: BORDER_RADIUS.md,
    flexWrap: 'wrap'
  },
  actionButton: {
    padding: `${SPACING[2]} ${SPACING[4]}`,
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    border: 'none',
    borderRadius: BORDER_RADIUS.sm,
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase
  },
  actionButtonPrimary: {
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    fontWeight: FONT_WEIGHT.bold,
    marginLeft: 'auto'
  },
  actionButtonDanger: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
  },
  actionButtonDisabled: {
    background: '#4b5563',
    cursor: 'not-allowed',
    opacity: 0.5
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: SPACING[4],
    padding: SPACING[4],
    overflowY: 'auto',
    maxHeight: '600px'
  },
  itemCard: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: SPACING[2],
    padding: SPACING[4],
    background: `linear-gradient(135deg, ${COLORS.bgSurface} 0%, ${COLORS.bgDark} 100%)`,
    border: `2px solid ${COLORS.bgSurfaceLight}`,
    borderRadius: BORDER_RADIUS.md,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase
  },
  itemCardSelected: {
    border: `2px solid ${COLORS.primary}`,
    background: `linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, ${COLORS.bgDark} 100%)`,
    boxShadow: `0 0 15px rgba(45, 212, 191, 0.3)`
  },
  checkbox: {
    position: 'absolute',
    top: SPACING[2],
    left: SPACING[2],
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    accentColor: COLORS.primary,
    zIndex: 10
  },
  rarityBadge: {
    position: 'absolute',
    top: SPACING[2],
    right: SPACING[2],
    padding: `${SPACING[1]} ${SPACING[2]}`,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    borderRadius: BORDER_RADIUS.sm,
    color: COLORS.white,
    textTransform: 'uppercase',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)'
  },
  itemIcon: {
    fontSize: '40px',
    marginTop: SPACING[4]
  },
  itemName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textLight,
    textAlign: 'center'
  },
  itemType: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textGray,
    textTransform: 'capitalize'
  },
  enchantBadge: {
    padding: `${SPACING[1]} ${SPACING[2]}`,
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    borderRadius: BORDER_RADIUS.sm,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white
  },
  itemInfo: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: '#22c55e',
    marginBottom: SPACING[2]
  },
  itemActionButton: {
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
