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
 * @lastModified 2025-11-09
 */

import React from 'react';
import type { Item } from '../../engine/item/Item';

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '32px' }}>{item.icon}</span>
          <div style={{ flex: 1 }}>
            <div
              className="tooltip-name"
              style={{
                fontSize: '1.25em',
                fontWeight: '700',
                color: item.getRarityColor(),
                letterSpacing: '0.3px',
                marginBottom: '4px'
              }}
            >
              {item.getDisplayName()}
            </div>
            <div style={{ fontSize: '0.9em', color: '#94a3b8', textTransform: 'capitalize' }}>
              {item.getRarityDisplayName()}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.85em', color: '#64748b', marginBottom: '6px' }}>
          {item.slot.charAt(0).toUpperCase() + item.slot.slice(1)} | Lv.{item.level}
        </div>

        {item.enchantLevel > 0 && (
          <div style={{ fontSize: '0.85em', color: '#a855f7', fontWeight: '600', marginBottom: '4px' }}>
            +{item.enchantLevel} Enchant
          </div>
        )}

        {item.setName && (
          <div style={{ fontSize: '0.85em', color: '#3b82f6', fontWeight: '600' }}>
            {item.setName} Set
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="tooltip-stats" style={{ padding: '12px', borderTop: '1px solid rgba(45, 212, 191, 0.2)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {effectiveStats.HP > 0 && (
            <div className="tooltip-stat stat-positive" style={{ color: '#2dd4bf', fontWeight: '600' }}>
              ❤️ HP: +{effectiveStats.HP}
            </div>
          )}
          {effectiveStats.ATK > 0 && (
            <div className="tooltip-stat stat-positive" style={{ color: '#2dd4bf', fontWeight: '600' }}>
              ⚔️ ATK: +{effectiveStats.ATK}
            </div>
          )}
          {effectiveStats.DEF > 0 && (
            <div className="tooltip-stat stat-positive" style={{ color: '#2dd4bf', fontWeight: '600' }}>
              🛡️ DEF: +{effectiveStats.DEF}
            </div>
          )}
          {effectiveStats.SPD > 0 && (
            <div className="tooltip-stat stat-positive" style={{ color: '#2dd4bf', fontWeight: '600' }}>
              ⚡ SPD: +{effectiveStats.SPD}
            </div>
          )}
          {effectiveStats.CRIT > 0 && (
            <div className="tooltip-stat stat-positive" style={{ color: '#2dd4bf', fontWeight: '600' }}>
              💥 CRIT: +{effectiveStats.CRIT}%
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div
          className="tooltip-actions"
          style={{
            padding: '10px 12px',
            borderTop: '1px solid rgba(45, 212, 191, 0.2)',
            fontSize: '0.9em',
            color: '#94a3b8'
          }}
        >
          <div style={{ marginBottom: '4px' }}>💰 {item.goldValue}g</div>
          <div style={{ fontSize: '0.85em', color: '#64748b' }}>
            {customActions || 'Left-click to equip | Right-click to enchant'}
          </div>
        </div>
      )}
    </div>
  );
}
