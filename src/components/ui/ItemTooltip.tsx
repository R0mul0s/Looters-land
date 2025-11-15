/**
 * Item Tooltip Component
 *
 * Reusable tooltip component for displaying item information on hover.
 * Shows item stats, rarity, enchant level, and other details.
 *
 * Usage:
 * ```tsx
 * const [tooltip, setTooltip] = useState<{ item: Item; x: number; y: number } | null>(null);
 *
 * <div
 *   onMouseEnter={(e) => setTooltip({ item, x: e.clientX, y: e.clientY })}
 *   onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
 *   onMouseLeave={() => setTooltip(null)}
 * >
 *   Item card
 * </div>
 *
 * {tooltip && <ItemTooltip item={tooltip.item} x={tooltip.x} y={tooltip.y} />}
 * ```
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React from 'react';
import type { Item } from '../../engine/item/Item';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, Z_INDEX } from '../../styles/tokens';

interface ItemTooltipProps {
  item: Item;
  x: number;
  y: number;
  showActions?: boolean;
  customActions?: string;
}

export function ItemTooltip({
  item,
  x,
  y,
  showActions = true,
  customActions
}: ItemTooltipProps) {
  const effectiveStats = item.getEffectiveStats();

  return (
    <div
      className="item-tooltip"
      style={{
        position: 'fixed',
        left: x + 15,
        top: y + 15,
        zIndex: 999,
        pointerEvents: 'none'
      }}
    >
      {/* Header */}
      <div className="tooltip-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[3], marginBottom: SPACING[2] }}>
          <span style={{ fontSize: FONT_SIZE['4xl'] }}>{item.icon}</span>
          <div style={{ flex: 1 }}>
            <div
              className="tooltip-name"
              style={{
                fontSize: FONT_SIZE.lg,
                fontWeight: FONT_WEIGHT.bold,
                color: item.getRarityColor(),
                letterSpacing: '0.3px',
                marginBottom: SPACING[1]
              }}
            >
              {item.getDisplayName()}
            </div>
            <div style={{ fontSize: FONT_SIZE.md, color: COLORS.textGray, textTransform: 'capitalize' }}>
              {item.getRarityDisplayName()}
            </div>
          </div>
        </div>

        <div style={{ fontSize: FONT_SIZE.sm, color: COLORS.textDarkGray, marginBottom: SPACING[2] }}>
          {item.slot.charAt(0).toUpperCase() + item.slot.slice(1)} | Lv.{item.level}
        </div>

        {item.enchantLevel > 0 && (
          <div style={{ fontSize: FONT_SIZE.sm, color: '#a855f7', fontWeight: FONT_WEIGHT.semibold, marginBottom: SPACING[1] }}>
            +{item.enchantLevel} Enchant
          </div>
        )}

        {item.setName && (
          <div style={{ fontSize: FONT_SIZE.sm, color: COLORS.info, fontWeight: FONT_WEIGHT.semibold }}>
            {item.setName} Set
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="tooltip-stats" style={{ padding: SPACING[3], borderTop: '1px solid rgba(45, 212, 191, 0.2)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACING[2] }}>
          {effectiveStats.HP > 0 && (
            <div className="tooltip-stat stat-positive" style={{ color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold }}>
              ❤️ HP: +{effectiveStats.HP}
            </div>
          )}
          {effectiveStats.ATK > 0 && (
            <div className="tooltip-stat stat-positive" style={{ color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold }}>
              ⚔️ ATK: +{effectiveStats.ATK}
            </div>
          )}
          {effectiveStats.DEF > 0 && (
            <div className="tooltip-stat stat-positive" style={{ color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold }}>
              🛡️ DEF: +{effectiveStats.DEF}
            </div>
          )}
          {effectiveStats.SPD > 0 && (
            <div className="tooltip-stat stat-positive" style={{ color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold }}>
              ⚡ SPD: +{effectiveStats.SPD}
            </div>
          )}
          {effectiveStats.CRIT > 0 && (
            <div className="tooltip-stat stat-positive" style={{ color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold }}>
              💥 CRIT: +{effectiveStats.CRIT}%
            </div>
          )}
        </div>

        {/* Item Score */}
        <div style={{
          marginTop: SPACING[3],
          paddingTop: SPACING[2],
          borderTop: '1px solid rgba(45, 212, 191, 0.15)',
          textAlign: 'center'
        }}>
          <div style={{ color: COLORS.gold, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md }}>
            🏆 Item Score: {item.getScore().toLocaleString()}
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div
          className="tooltip-actions"
          style={{
            padding: `${SPACING[3]} ${SPACING[3]}`,
            borderTop: '1px solid rgba(45, 212, 191, 0.2)',
            fontSize: FONT_SIZE.md,
            color: COLORS.textGray
          }}
        >
          <div style={{ marginBottom: SPACING[1] }}>💰 {item.goldValue}g</div>
          <div style={{ fontSize: FONT_SIZE.sm, color: COLORS.textDarkGray }}>
            {customActions || 'Left-click to equip | Right-click to enchant'}
          </div>
        </div>
      )}
    </div>
  );
}
