/**
 * Item Display Component
 *
 * Reusable component for displaying item information with icon, name, rarity, and stats.
 * Used in loot modals, inventory, and merchant shops.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-11
 */

import React from 'react';
import type { Item } from '../../engine/item/Item';

interface ItemDisplayProps {
  item: Item;
  onClick?: () => void;
  showPrice?: number;
  compact?: boolean;
}

/**
 * Display an item with its details
 *
 * @param item - Item to display
 * @param onClick - Optional click handler
 * @param showPrice - Optional price to display
 * @param compact - Use compact view (less padding/spacing)
 */
export function ItemDisplay({ item, onClick, showPrice, compact = false }: ItemDisplayProps) {
  const stats = item.getEffectiveStats();
  const rarityColor = item.getRarityColor();

  return (
    <div
      onClick={onClick}
      style={{
        padding: compact ? '8px' : '12px',
        margin: compact ? '4px 0' : '8px 0',
        background: `${rarityColor}10`,
        border: `1px solid ${rarityColor}`,
        borderRadius: '6px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ fontSize: compact ? '18px' : '24px' }}>{item.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <strong style={{ color: rarityColor, fontSize: compact ? '13px' : '14px' }}>
              {item.getDisplayName()}
            </strong>
            <span style={{ color: '#64748b', fontSize: '11px' }}>
              Lv{item.level}
            </span>
            <span style={{
              padding: '2px 6px',
              background: `${rarityColor}20`,
              borderRadius: '4px',
              fontSize: '10px',
              color: rarityColor,
              fontWeight: '600'
            }}>
              {item.getRarityDisplayName()}
            </span>
          </div>
          {showPrice !== undefined && (
            <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '2px' }}>
              💰 {showPrice} gold
            </div>
          )}
        </div>
      </div>

      {/* Item Stats */}
      <div style={{
        fontSize: compact ? '10px' : '11px',
        color: '#94a3b8',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        paddingLeft: compact ? '0' : '32px'
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
