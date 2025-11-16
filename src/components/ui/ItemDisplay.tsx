/**
 * Item Display Component
 *
 * Reusable component for displaying item information with icon, name, rarity, and stats.
 * Used in loot modals, inventory, and merchant shops.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React from 'react';
import type { Item } from '../../engine/item/Item';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS } from '../../styles/tokens';

interface ItemDisplayProps {
  item: Item;
  onClick?: () => void;
  showPrice?: number;
  compact?: boolean;
  heroLevel?: number;
}

/**
 * Display an item with its details
 *
 * @param item - Item to display
 * @param onClick - Optional click handler
 * @param showPrice - Optional price to display
 * @param compact - Use compact view (less padding/spacing)
 * @param heroLevel - Optional hero level to check if item can be equipped
 */
export function ItemDisplay({ item, onClick, showPrice, compact = false, heroLevel }: ItemDisplayProps) {
  const stats = item.getEffectiveStats();
  const rarityColor = item.getRarityColor();
  const canEquip = heroLevel !== undefined ? item.level <= heroLevel : true;

  return (
    <div
      onClick={onClick}
      style={{
        padding: compact ? SPACING[2] : SPACING[3],
        margin: compact ? `${SPACING[1]} 0` : `${SPACING[2]} 0`,
        background: `${rarityColor}10`,
        border: `1px solid ${rarityColor}`,
        borderRadius: BORDER_RADIUS.md,
        cursor: onClick ? 'pointer' : 'default',
        transition: TRANSITIONS.allBase,
        ...(onClick && {
          ':hover': {
            background: `${rarityColor}20`,
            transform: 'translateY(-1px)',
            boxShadow: `0 4px 8px ${rarityColor}40`
          }
        })
      }}
    >
      {/* Item Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[2], marginBottom: SPACING[2] }}>
        <span style={{ fontSize: compact ? FONT_SIZE.lg : FONT_SIZE['2xl'] }}>{item.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[2], flexWrap: 'wrap' }}>
            <strong style={{ color: rarityColor, fontSize: compact ? FONT_SIZE.sm : FONT_SIZE.md }}>
              {item.getDisplayName()}
            </strong>
            <span style={{ color: canEquip ? COLORS.textDarkGray : '#f44336', fontSize: FONT_SIZE.xs, fontWeight: canEquip ? undefined : 'bold' }}>
              Lv{item.level}
            </span>
            <span style={{
              padding: `${SPACING.xxs} ${SPACING[2]}`,
              background: `${rarityColor}20`,
              borderRadius: BORDER_RADIUS.sm,
              fontSize: FONT_SIZE.xs,
              color: rarityColor,
              fontWeight: FONT_WEIGHT.semibold
            }}>
              {item.getRarityDisplayName()}
            </span>
          </div>
          {showPrice !== undefined && (
            <div style={{ fontSize: FONT_SIZE.sm, color: COLORS.warning, marginTop: SPACING.xxs }}>
              💰 {showPrice} gold
            </div>
          )}
        </div>
      </div>

      {/* Item Stats */}
      <div style={{
        fontSize: compact ? FONT_SIZE.xs : FONT_SIZE.xs,
        color: COLORS.textGray,
        display: 'flex',
        gap: SPACING[3],
        flexWrap: 'wrap',
        paddingLeft: compact ? '0' : SPACING[8]
      }}>
        {stats.HP > 0 && <span title="Health Points">❤️ +{stats.HP}</span>}
        {stats.ATK > 0 && <span title="Attack">⚔️ +{stats.ATK}</span>}
        {stats.DEF > 0 && <span title="Defense">🛡️ +{stats.DEF}</span>}
        {stats.SPD > 0 && <span title="Speed">⚡ +{stats.SPD}</span>}
        {stats.CRIT > 0 && <span title="Critical Hit Chance">💥 +{stats.CRIT}%</span>}
      </div>
    </div>
  );
}
