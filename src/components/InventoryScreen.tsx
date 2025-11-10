/**
 * Inventory Screen Component
 *
 * Displays hero equipment and inventory management.
 * Shows equipped items, inventory grid, and equipment actions.
 * Supports item equipping, unequipping, enchanting, and auto-equip.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-10
 */

import React, { useState } from 'react';
import type { Hero } from '../engine/hero/Hero';
import type { Item } from '../engine/item/Item';
import type { Inventory } from '../engine/item/Inventory';
import { CLASS_ICONS, RARITY_COLORS } from '../types/hero.types';
import { t } from '../localization/i18n';
import '../App.css';

/**
 * Props for InventoryScreen component
 */
interface InventoryScreenProps {
  /** Array of heroes to manage equipment for */
  heroes: Hero[];
  /** Inventory containing all items */
  inventory: Inventory;
  /** Callback when equipping an item */
  onEquipItem: (hero: Hero, item: Item) => void;
  /** Callback when unequipping an item */
  onUnequipItem: (hero: Hero, slotName: string) => void;
  /** Callback for auto-equip best items */
  onAutoEquipBest: (hero: Hero) => void;
  /** Callback for expanding inventory capacity */
  onExpandInventory: () => void;
  /** Callback for auto-selling common items */
  onAutoSellCommon: () => void;
  /** Optional callback when opening enchant panel */
  onOpenEnchantPanel?: (item: Item) => void;
  /** Whether player is in town (enables selling/expanding/enchanting) */
  isInTown?: boolean;
}

/**
 * Inventory Screen Component
 *
 * @param props - Component props
 * @returns React component
 */
export function InventoryScreen({
  heroes,
  inventory,
  onEquipItem,
  onUnequipItem,
  onAutoEquipBest,
  onExpandInventory,
  onAutoSellCommon,
  onOpenEnchantPanel,
  isInTown = true
}: InventoryScreenProps) {
  const [selectedHeroIndex, setSelectedHeroIndex] = useState(0);
  const [tooltip, setTooltip] = useState<{ item: Item; x: number; y: number } | null>(null);

  const selectedHero = heroes[selectedHeroIndex];

  // Show loading state if no heroes available
  if (!selectedHero || heroes.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        fontSize: '18px',
        color: '#888'
      }}>
        {t('inventoryScreen.loading')}
      </div>
    );
  }

  /**
   * Show item tooltip at mouse position
   *
   * @param item - Item to show in tooltip
   * @param e - Mouse event with position
   */
  const showTooltip = (item: Item, e: React.MouseEvent): void => {
    setTooltip({ item, x: e.clientX, y: e.clientY });
  };

  /**
   * Update tooltip position as mouse moves
   *
   * @param e - Mouse event with new position
   */
  const updateTooltipPosition = (e: React.MouseEvent): void => {
    if (tooltip) {
      setTooltip({ ...tooltip, x: e.clientX, y: e.clientY });
    }
  };

  /**
   * Hide the item tooltip
   */
  const hideTooltip = (): void => {
    setTooltip(null);
  };

  return (
    <div style={styles.container}>
      {/* Hero Selector */}
      <div className="hero-selector">
        <h3>{t('inventoryScreen.selectHero')}</h3>
        <div className="hero-buttons">
          {heroes.map((hero, index) => (
            <button
              key={hero.id}
              className={`hero-btn ${index === selectedHeroIndex ? 'active' : ''}`}
              onClick={() => setSelectedHeroIndex(index)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span
                style={{
                  padding: '2px 6px',
                  fontSize: '9px',
                  fontWeight: '700',
                  color: 'white',
                  borderRadius: '4px',
                  textTransform: 'capitalize',
                  background: RARITY_COLORS[hero.rarity],
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.3)'
                }}
              >
                {hero.rarity}
              </span>
              {CLASS_ICONS[hero.class]} {hero.name} {t('inventoryScreen.levelFormat')}{hero.level})
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="equipment-grid">
        {/* Equipment Panel */}
        <div className="equipment-panel">
          <h3>⚔️ {t('inventoryScreen.equipment.title')}</h3>

          {/* Hero Info */}
          <div className="hero-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <h2 style={{ margin: 0 }}>
                {CLASS_ICONS[selectedHero.class]} {selectedHero.name}
              </h2>
              <div
                style={{
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'white',
                  borderRadius: '6px',
                  textTransform: 'capitalize',
                  letterSpacing: '0.5px',
                  background: RARITY_COLORS[selectedHero.rarity],
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
                }}
              >
                {selectedHero.rarity}
              </div>
            </div>

            {/* XP Progress Bar */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '5px',
                fontSize: '0.9em',
                color: '#ccc'
              }}>
                <span>{t('inventoryScreen.labels.level')} {selectedHero.level}</span>
                <span>{selectedHero.xp}/{selectedHero.xpToNextLevel} {t('inventoryScreen.labels.xp')}</span>
              </div>
              <div style={{
                width: '100%',
                height: '20px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{
                  width: `${(selectedHero.xp / selectedHero.xpToNextLevel) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #4a90e2, #63b3ed)',
                  transition: 'width 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75em',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {((selectedHero.xp / selectedHero.xpToNextLevel) * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <div id="hero-stats">
              <div className="stat-item">
                <strong>{t('inventoryScreen.equipment.stats.hp')}</strong>
                <span>{selectedHero.currentHP}/{selectedHero.maxHP}</span>
              </div>
              <div className="stat-item">
                <strong>{t('inventoryScreen.equipment.stats.atk')}</strong>
                <span>{selectedHero.ATK}</span>
              </div>
              <div className="stat-item">
                <strong>{t('inventoryScreen.equipment.stats.def')}</strong>
                <span>{selectedHero.DEF}</span>
              </div>
              <div className="stat-item">
                <strong>{t('inventoryScreen.equipment.stats.spd')}</strong>
                <span>{selectedHero.SPD}</span>
              </div>
              <div className="stat-item">
                <strong>{t('inventoryScreen.equipment.stats.crit')}</strong>
                <span>{selectedHero.CRIT}%</span>
              </div>
              <div className="stat-item">
                <strong>{t('inventoryScreen.equipment.stats.power')}</strong>
                <span>{selectedHero.equipment?.getPowerScore().toFixed(0) || 0}</span>
              </div>
            </div>
          </div>

          {/* Equipment Slots */}
          <div className="equipment-slots">
            {Object.entries(selectedHero.equipment?.slots || {}).map(([slotName, item]) => (
              <div
                key={slotName}
                className={`equipment-slot ${item ? 'has-item' : 'empty'}`}
                onMouseEnter={(e) => item && showTooltip(item, e)}
                onMouseMove={(e) => item && updateTooltipPosition(e)}
                onMouseLeave={hideTooltip}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (!isInTown) {
                    alert(t('inventoryScreen.equipment.warnings.enchantingTownOnly'));
                    return;
                  }
                  if (item && onOpenEnchantPanel) onOpenEnchantPanel(item);
                }}
              >
                <div className="slot-label">{slotName}</div>
                {item ? (
                  <div className="equipped-item">
                    <div className="item-icon">{item.icon}</div>
                    <div className="item-name" style={{ color: item.getRarityColor() }}>
                      {item.getDisplayName()}
                    </div>
                    <div className="item-stats-preview" style={{ fontSize: '0.75em' }}>
                      {item.getRarityDisplayName()}
                    </div>
                    <button
                      className="unequip-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnequipItem(selectedHero, slotName);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="empty-slot">{t('inventoryScreen.equipment.empty')}</div>
                )}
              </div>
            ))}
          </div>

          {/* Set Bonuses */}
          <div className="set-bonuses">
            <h4>{t('inventoryScreen.equipment.setBonuses')}</h4>
            {selectedHero.equipment?.getActiveSetBonuses().length === 0 ? (
              <p style={{ color: '#999', fontSize: '0.9em' }}>{t('inventoryScreen.equipment.noSetBonuses')}</p>
            ) : (
              selectedHero.equipment?.getActiveSetBonuses().map((setInfo, index) => (
                <div key={index} className="set-bonus-item">
                  <h5>{setInfo.setName} ({setInfo.pieces} pieces)</h5>
                  {setInfo.bonuses.map((bonus, bIndex) => (
                    <div key={bIndex} className={`bonus-line ${bonus.active ? 'active' : 'inactive'}`}>
                      {bonus.pieces} pieces: {Object.entries(bonus.bonus)
                        .filter(([key]) => key !== 'special')
                        .map(([stat, value]) => `${stat} +${value}`)
                        .join(', ')}
                      {bonus.bonus.special && ` (${bonus.bonus.special})`}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Equipment Actions */}
          <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-success" onClick={() => onAutoEquipBest(selectedHero)}>
              {t('inventoryScreen.equipment.buttons.autoEquipBest')}
            </button>
          </div>
        </div>

        {/* Inventory Panel */}
        <div className="inventory-panel">
          <h3>🎒 {t('inventoryScreen.inventoryPanel.title')}</h3>

          {/* Inventory Info */}
          <div className="inventory-info">
            <div className="info-row">
              <span><strong>{t('inventoryScreen.inventoryPanel.slots')}</strong> {inventory.items.length}/{inventory.maxSlots}</span>
              <span><strong>{t('inventoryScreen.inventoryPanel.gold')}</strong> 💰 {inventory.gold}</span>
            </div>
          </div>

          {/* Inventory Grid */}
          <div className="inventory-grid">
            {inventory.getFilteredItems().length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#999' }}>
                <p>{t('inventoryScreen.inventoryPanel.emptyTitle')}</p>
                <p style={{ fontSize: '0.9em' }}>{t('inventoryScreen.inventoryPanel.emptyMessage')}</p>
              </div>
            ) : (
              inventory.getFilteredItems().map((item) => (
                <div
                  key={item.id}
                  className={`inventory-item rarity-${item.rarity}`}
                  onClick={() => onEquipItem(selectedHero, item)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (!isInTown) {
                      alert(t('inventoryScreen.equipment.warnings.enchantingTownOnly'));
                      return;
                    }
                    if (onOpenEnchantPanel) onOpenEnchantPanel(item);
                  }}
                  onMouseEnter={(e) => showTooltip(item, e)}
                  onMouseMove={updateTooltipPosition}
                  onMouseLeave={hideTooltip}
                >
                  <div className="item-icon">{item.icon}</div>
                  <div className="item-name">{item.getDisplayName()}</div>
                  <div className="item-level">Lv.{item.level}</div>
                </div>
              ))
            )}
          </div>

          {/* Inventory Actions */}
          {isInTown && (
            <div className="inventory-actions">
              <button className="btn btn-primary" onClick={onExpandInventory}>
                {t('inventoryScreen.inventoryPanel.buttons.expand')}
              </button>
              <button className="btn btn-warning" onClick={onAutoSellCommon}>
                {t('inventoryScreen.inventoryPanel.buttons.autoSellCommon')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="item-tooltip"
          style={{ left: tooltip.x + 15, top: tooltip.y + 15 }}
        >
          <div className="tooltip-header">
            <div className="tooltip-name" style={{ color: tooltip.item.getRarityColor() }}>
              {tooltip.item.icon} {tooltip.item.getDisplayName()}
            </div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>
              {tooltip.item.getRarityDisplayName()} {tooltip.item.slot.charAt(0).toUpperCase() + tooltip.item.slot.slice(1)} | Lv.{tooltip.item.level}
            </div>
            {tooltip.item.enchantLevel > 0 && (
              <div style={{ fontSize: '0.9em', color: '#9c27b0', fontWeight: 'bold' }}>
                +{tooltip.item.enchantLevel} Enchant
              </div>
            )}
            {tooltip.item.setName && (
              <div style={{ fontSize: '0.9em', color: '#2196f3', fontWeight: 'bold' }}>
                {tooltip.item.setName} Set
              </div>
            )}
          </div>

          <div className="tooltip-stats">
            {(() => {
              const stats = tooltip.item.getEffectiveStats();
              return (
                <>
                  {stats.HP > 0 && (
                    <div className="tooltip-stat">
                      <span>{t('inventoryScreen.equipment.tooltip.hp')}</span>
                      <span className="stat-positive">+{stats.HP}</span>
                    </div>
                  )}
                  {stats.ATK > 0 && (
                    <div className="tooltip-stat">
                      <span>{t('inventoryScreen.equipment.tooltip.atk')}</span>
                      <span className="stat-positive">+{stats.ATK}</span>
                    </div>
                  )}
                  {stats.DEF > 0 && (
                    <div className="tooltip-stat">
                      <span>{t('inventoryScreen.equipment.tooltip.def')}</span>
                      <span className="stat-positive">+{stats.DEF}</span>
                    </div>
                  )}
                  {stats.SPD > 0 && (
                    <div className="tooltip-stat">
                      <span>{t('inventoryScreen.equipment.tooltip.spd')}</span>
                      <span className="stat-positive">+{stats.SPD}</span>
                    </div>
                  )}
                  {stats.CRIT > 0 && (
                    <div className="tooltip-stat">
                      <span>{t('inventoryScreen.equipment.tooltip.crit')}</span>
                      <span className="stat-positive">+{stats.CRIT}%</span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <div className="tooltip-actions">
            <div>{t('inventoryScreen.equipment.tooltip.value', { value: tooltip.item.goldValue.toString() })}</div>
            <div style={{ marginTop: '5px', fontSize: '0.85em', fontStyle: 'italic' }}>
              {t('inventoryScreen.equipment.tooltip.clickInstructions')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 100%)',
    overflow: 'auto',
    padding: '20px',
    boxSizing: 'border-box'
  }
};
