/**
 * Inventory Screen Component
 *
 * Displays hero equipment and inventory management.
 * Shows equipped items, inventory grid, and equipment actions.
 * Supports item equipping, unequipping, enchanting, and auto-equip.
 *
 * Updated to sort heroes with active party members first and highlight them
 * with green border and "Active" badge for better visibility.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-19
 */

import React, { useState } from 'react';
import type { Hero } from '../engine/hero/Hero';
import type { Item } from '../engine/item/Item';
import type { Inventory } from '../engine/item/Inventory';
import { CLASS_ICONS, RARITY_COLORS } from '../types/hero.types';
import { t } from '../localization/i18n';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS } from '../styles/tokens';
import { flexCenter } from '../styles/common';
import { GameModal } from './ui/GameModal';
import { ModalButton, ModalButtonGroup, ModalDivider, ModalText } from './ui/ModalContent';
import '../App.css';

/**
 * Props for InventoryScreen component
 */
interface InventoryScreenProps {
  /** Array of heroes to manage equipment for */
  heroes: Hero[];
  /** Array of heroes in active party (for highlighting) */
  activeParty?: Hero[];
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
  /** Callback when discarding/destroying an item */
  onDiscardItem: (itemId: string) => void;
  /** Callback when discarding all grey/common items */
  onDiscardAllGrey?: () => void;
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
  activeParty = [],
  inventory,
  onEquipItem,
  onUnequipItem,
  onAutoEquipBest,
  onExpandInventory,
  onAutoSellCommon,
  onOpenEnchantPanel,
  onDiscardItem,
  onDiscardAllGrey,
  isInTown = true
}: InventoryScreenProps) {
  const [selectedHeroIndex, setSelectedHeroIndex] = useState(0);
  const [tooltip, setTooltip] = useState<{ item: Item; equippedItem: Item | null; x: number; y: number } | null>(null);
  const [itemDetailModal, setItemDetailModal] = useState<Item | null>(null);
  const [showDestroyModal, setShowDestroyModal] = useState<{ item: Item; itemName: string } | null>(null);
  const [showAllHeroes, setShowAllHeroes] = useState(false);

  // Sort heroes: active party members first, then others
  const activePartyIds = new Set(activeParty.map(hero => hero.id));
  const sortedHeroes = [...heroes].sort((a, b) => {
    const aIsActive = activePartyIds.has(a.id);
    const bIsActive = activePartyIds.has(b.id);

    // Active heroes first
    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;

    // Within same group, maintain original order
    return 0;
  });

  // Show only first 4 heroes initially, or all if toggled
  const INITIAL_HEROES_COUNT = 4;
  const displayedHeroes = showAllHeroes ? sortedHeroes : sortedHeroes.slice(0, INITIAL_HEROES_COUNT);
  const hasMoreHeroes = sortedHeroes.length > INITIAL_HEROES_COUNT;

  const selectedHero = sortedHeroes[selectedHeroIndex];

  // Show loading state if no heroes available
  if (!selectedHero || heroes.length === 0) {
    return (
      <div style={{
        ...flexCenter,
        height: '100%',
        fontSize: SPACING[4.5],
        color: COLORS.textMuted
      }}>
        {t('inventoryScreen.loading')}
      </div>
    );
  }

  /**
   * Calculate tooltip position with edge detection
   *
   * @param mouseX - Mouse X position
   * @param mouseY - Mouse Y position
   * @param hasComparison - Whether tooltip shows comparison (affects width)
   * @returns Adjusted X and Y coordinates
   */
  const calculateTooltipPosition = (mouseX: number, mouseY: number, hasComparison: boolean): { x: number; y: number } => {
    // Tooltip dimensions based on content
    const tooltipWidth = hasComparison ? 650 : 320;
    const tooltipHeight = 400; // Approximate height

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Default position (offset from cursor)
    let x = mouseX + 15;
    let y = mouseY + 15;

    // Check right edge - show on left side of cursor if tooltip would overflow
    if (x + tooltipWidth > viewportWidth) {
      x = mouseX - tooltipWidth - 15;
    }

    // Check bottom edge - move up if tooltip would overflow
    if (y + tooltipHeight > viewportHeight) {
      y = viewportHeight - tooltipHeight - 10;
    }

    // Ensure tooltip doesn't go off left edge
    if (x < 10) {
      x = 10;
    }

    // Ensure tooltip doesn't go off top edge
    if (y < 10) {
      y = 10;
    }

    return { x, y };
  };

  /**
   * Show item tooltip at mouse position
   * Also shows equipped item in the same slot for comparison
   *
   * @param item - Item to show in tooltip
   * @param e - Mouse event with position
   * @param isEquippedItem - Whether the item is currently equipped (don't show comparison)
   */
  const showTooltip = (item: Item, e: React.MouseEvent, isEquippedItem: boolean = false): void => {
    // Get currently equipped item in the same slot for comparison
    // Only show comparison if hovering over inventory item (not equipped item)
    const equippedItem = isEquippedItem ? null : (selectedHero.equipment?.slots[item.slot] || null);

    // Calculate position with edge detection
    const { x, y } = calculateTooltipPosition(e.clientX, e.clientY, !!equippedItem);

    setTooltip({ item, equippedItem, x, y });
  };

  /**
   * Update tooltip position as mouse moves
   *
   * @param e - Mouse event with new position
   */
  const updateTooltipPosition = (e: React.MouseEvent): void => {
    if (tooltip) {
      // Recalculate position with edge detection
      const { x, y } = calculateTooltipPosition(e.clientX, e.clientY, !!tooltip.equippedItem);
      setTooltip({ ...tooltip, x, y });
    }
  };

  /**
   * Hide the item tooltip
   */
  const hideTooltip = (): void => {
    setTooltip(null);
  };

  /**
   * Render item panel for tooltip (used for both inventory item and equipped item)
   *
   * @param item - Item to render
   * @param isEquipped - Whether this is the currently equipped item
   * @returns JSX element
   */
  const renderItemPanel = (item: Item, isEquipped: boolean = false): React.JSX.Element => {
    const stats = item.getEffectiveStats();
    const rarityColor = item.getRarityColor();
    const canEquip = item.level <= selectedHero.level;

    // Convert hex color to rgba for background
    const hexToRgba = (hex: string, alpha: number): string => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    return (
      <div style={{
        flex: 1,
        padding: '10px',
        backgroundColor: hexToRgba(rarityColor, 0.1),
        borderRadius: '8px',
        border: `2px solid ${hexToRgba(rarityColor, 0.4)}`,
        position: 'relative'
      }}>
        {isEquipped && (
          <div style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            fontSize: '0.85em',
            color: '#4caf50',
            fontWeight: 'bold',
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            ✓ Equipped
          </div>
        )}
        <div className="tooltip-header">
          <div className="tooltip-name" style={{ color: rarityColor }}>
            {item.icon} {item.getDisplayName()}
          </div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>
            {item.getRarityDisplayName()} {item.slot.charAt(0).toUpperCase() + item.slot.slice(1)} | <span style={{ color: canEquip ? '#666' : '#f44336', fontWeight: canEquip ? 'normal' : 'bold' }}>Lv.{item.level}</span>
          </div>
          {item.enchantLevel > 0 && (
            <div style={{ fontSize: '0.9em', color: '#9c27b0', fontWeight: 'bold' }}>
              +{item.enchantLevel} Enchant
            </div>
          )}
          {item.setName && (
            <div style={{ fontSize: '0.9em', color: '#2196f3', fontWeight: 'bold' }}>
              {item.setName} Set
            </div>
          )}
        </div>

        <div className="tooltip-stats">
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
        </div>

        <div className="tooltip-actions">
          <div>{t('inventoryScreen.equipment.tooltip.value', { value: item.goldValue.toString() })}</div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Hero Tabs */}
      <div style={styles.tabsContainer}>
        {displayedHeroes.map((hero, index) => {
          const isActive = activePartyIds.has(hero.id);
          return (
            <button
              key={hero.id}
              style={{
                ...styles.tab,
                ...(index === selectedHeroIndex ? styles.tabActive : {}),
                ...(isActive && {
                  border: '2px solid #10b981',
                  boxShadow: index === selectedHeroIndex
                    ? '0 4px 12px rgba(16, 185, 129, 0.6)'
                    : '0 0 8px rgba(16, 185, 129, 0.4)',
                  background: index === selectedHeroIndex
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)'
                })
              }}
              onClick={() => setSelectedHeroIndex(index)}
            >
              {isActive && (
                <span
                  style={{
                    marginRight: SPACING[1],
                    fontSize: FONT_SIZE.xs,
                    fontWeight: FONT_WEIGHT.bold
                  }}
                >
                  ✓
                </span>
              )}
              {hero.name} (Lv.{hero.level})
            </button>
          );
        })}

        {/* Show All/Show Less Toggle */}
        {hasMoreHeroes && (
          <button
            style={styles.toggleButton}
            onClick={() => setShowAllHeroes(!showAllHeroes)}
          >
            {showAllHeroes ? '▲ Skrýt' : `▼ Zobrazit vše (${sortedHeroes.length - INITIAL_HEROES_COUNT})`}
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="equipment-grid" style={{ padding: SPACING.lg, flex: 1, overflow: 'auto' }}>
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
                key={`equipped-${slotName}-${item?.id || 'empty'}`}
                className={`equipment-slot ${item ? 'has-item' : 'empty'}`}
                onMouseEnter={(e) => {
                  if (item) {
                    // Force immediate hide then show
                    setTooltip(null);
                    setTimeout(() => showTooltip(item, e, true), 0);
                  }
                }}
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
                    <div className="item-stats-preview" style={{ fontSize: '0.75em', color: '#94a3b8' }}>
                      Lv.{item.level} | {item.getRarityDisplayName()}
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
                <div key={`setbonus-${setInfo.setId}-${index}`} className="set-bonus-item">
                  <h5>{setInfo.setName} ({setInfo.pieces} pieces)</h5>
                  {setInfo.bonuses.map((bonus, bIndex) => (
                    <div key={`bonus-${setInfo.setId}-${bonus.pieces}-${bIndex}`} className={`bonus-line ${bonus.active ? 'active' : 'inactive'}`}>
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
              inventory.getFilteredItems().map((item, index) => {
                const canEquip = item.level <= selectedHero.level;
                return (
                  <div
                    key={`inventory-${item.id}-${index}`}
                    className={`inventory-item rarity-${item.rarity}`}
                    onClick={() => setItemDetailModal(item)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      // Right-click does nothing in inventory
                      // Enchant only available at smithy in town
                    }}
                    onMouseEnter={(e) => {
                      // Force immediate hide then show
                      setTooltip(null);
                      setTimeout(() => showTooltip(item, e), 0);
                    }}
                    onMouseMove={updateTooltipPosition}
                    onMouseLeave={hideTooltip}
                  >
                    <div className="item-icon">{item.icon}</div>
                    <div className="item-name">{item.getDisplayName()}</div>
                    <div className="item-level" style={{ color: canEquip ? undefined : '#f44336', fontWeight: canEquip ? undefined : 'bold' }}>Lv.{item.level}</div>
                  </div>
                );
              })
            )}
          </div>

          {/* Inventory Actions */}
          <div className="inventory-actions">
            {isInTown && (
              <>
                <button className="btn btn-primary" onClick={onExpandInventory}>
                  {t('inventoryScreen.inventoryPanel.buttons.expand')}
                </button>
                <button className="btn btn-warning" onClick={onAutoSellCommon}>
                  {t('inventoryScreen.inventoryPanel.buttons.autoSellCommon')}
                </button>
              </>
            )}
            {onDiscardAllGrey && (
              <button className="btn btn-danger" onClick={onDiscardAllGrey}>
                🗑️ {t('inventoryScreen.inventoryPanel.buttons.discardAllGrey')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Tooltip */}
      {tooltip && (
        <div
          className="item-tooltip"
          style={{
            left: tooltip.x + 15,
            top: tooltip.y + 15,
            minWidth: tooltip.equippedItem ? '600px' : '300px',
            maxWidth: tooltip.equippedItem ? '800px' : '400px'
          }}
        >
          {tooltip.equippedItem ? (
            /* Show comparison view when there's an equipped item */
            <>
              <div style={{
                display: 'flex',
                gap: '15px',
                marginBottom: '10px'
              }}>
                {renderItemPanel(tooltip.equippedItem, true)}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '24px',
                  color: '#666'
                }}>
                  ⇄
                </div>
                {renderItemPanel(tooltip.item, false)}
              </div>
              <div style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
                fontSize: '0.85em',
                fontStyle: 'italic',
                textAlign: 'center',
                color: '#aaa'
              }}>
                {t('inventoryScreen.equipment.tooltip.clickInstructions')}
              </div>
            </>
          ) : (
            /* Show single item view when no equipped item */
            <>
              {renderItemPanel(tooltip.item, false)}
              <div style={{
                marginTop: '10px',
                padding: '5px',
                fontSize: '0.85em',
                fontStyle: 'italic',
                textAlign: 'center',
                color: '#aaa'
              }}>
                {t('inventoryScreen.equipment.tooltip.clickInstructions')}
              </div>
            </>
          )}
        </div>
      )}

      {/* Item Detail Modal */}
      {itemDetailModal && (
        <GameModal
          isOpen={true}
          title={itemDetailModal.getDisplayName()}
          icon={itemDetailModal.icon}
          onClose={() => setItemDetailModal(null)}
          maxWidth="500px"
        >
          <div style={{ padding: '10px' }}>
            {/* Item Info */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '0.9em',
                color: itemDetailModal.getRarityColor(),
                fontWeight: 'bold',
                marginBottom: '5px'
              }}>
                {itemDetailModal.getRarityDisplayName()} {itemDetailModal.slot.charAt(0).toUpperCase() + itemDetailModal.slot.slice(1)} | Lv.{itemDetailModal.level}
              </div>
              {itemDetailModal.enchantLevel > 0 && (
                <div style={{ fontSize: '0.9em', color: '#9c27b0', fontWeight: 'bold' }}>
                  +{itemDetailModal.enchantLevel} {t('inventoryScreen.inventoryPanel.itemDetail.enchant')}
                </div>
              )}
              {itemDetailModal.setName && (
                <div style={{ fontSize: '0.9em', color: '#2196f3', fontWeight: 'bold' }}>
                  {itemDetailModal.setName} {t('inventoryScreen.inventoryPanel.itemDetail.set')}
                </div>
              )}
            </div>

            <ModalDivider />

            {/* Stats */}
            <div style={{ marginBottom: '20px' }}>
              <strong style={{ display: 'block', marginBottom: '10px' }}>{t('inventoryScreen.inventoryPanel.itemDetail.stats')}</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {(() => {
                  const stats = itemDetailModal.getEffectiveStats();
                  return (
                    <>
                      {stats.HP > 0 && <div>❤️ HP: +{stats.HP}</div>}
                      {stats.ATK > 0 && <div>⚔️ ATK: +{stats.ATK}</div>}
                      {stats.DEF > 0 && <div>🛡️ DEF: +{stats.DEF}</div>}
                      {stats.SPD > 0 && <div>⚡ SPD: +{stats.SPD}</div>}
                      {stats.CRIT > 0 && <div>💥 CRIT: +{stats.CRIT}%</div>}
                    </>
                  );
                })()}
              </div>
            </div>

            <ModalDivider />

            {/* Value */}
            <div style={{ marginBottom: '20px', fontSize: '0.9em', color: '#ffd700' }}>
              💰 {t('inventoryScreen.inventoryPanel.itemDetail.value')} {itemDetailModal.goldValue} {t('inventoryScreen.inventoryPanel.itemDetail.gold')}
            </div>

            <ModalDivider />

            {/* Actions */}
            <ModalButtonGroup>
              <ModalButton
                onClick={() => {
                  onEquipItem(selectedHero, itemDetailModal);
                  setItemDetailModal(null);
                }}
                variant="primary"
                disabled={itemDetailModal.level > selectedHero.level}
              >
                {t('inventoryScreen.inventoryPanel.itemDetail.equipItem')}
              </ModalButton>
              <ModalButton
                onClick={() => {
                  setShowDestroyModal({
                    item: itemDetailModal,
                    itemName: itemDetailModal.getDisplayName()
                  });
                  setItemDetailModal(null);
                }}
                variant="danger"
              >
                {t('inventoryScreen.inventoryPanel.itemDetail.destroyItem')}
              </ModalButton>
            </ModalButtonGroup>
          </div>
        </GameModal>
      )}

      {/* Destroy Item Confirmation Modal */}
      {showDestroyModal && (
        <GameModal
          isOpen={true}
          title={t('inventoryScreen.inventoryPanel.itemDetail.destroyItem')}
          icon="🗑️"
          onClose={() => setShowDestroyModal(null)}
          maxWidth="400px"
        >
          <ModalText>
            {t('inventoryScreen.inventoryPanel.confirmDestroyItem', { itemName: showDestroyModal.itemName })}
          </ModalText>
          <div style={{ marginTop: SPACING[4] }}>
            <ModalButtonGroup>
              <ModalButton
                onClick={() => setShowDestroyModal(null)}
                variant="secondary"
              >
                {t('common.cancel')}
              </ModalButton>
              <ModalButton
                onClick={() => {
                  onDiscardItem(showDestroyModal.item.id);
                  setShowDestroyModal(null);
                }}
                variant="danger"
              >
                {t('common.confirm')}
              </ModalButton>
            </ModalButtonGroup>
          </div>
        </GameModal>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    background: `linear-gradient(135deg, ${COLORS.bgDarkSolid} 0%, ${COLORS.bgDarkAlt} 100%)`,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box'
  },
  tabsContainer: {
    display: 'flex',
    gap: SPACING[2],
    padding: `${SPACING.md} ${SPACING.lg}`,
    borderBottom: '1px solid rgba(45, 212, 191, 0.2)',
    overflowX: 'auto',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(15, 23, 42, 0.5)'
  },
  tab: {
    padding: `${SPACING[2]} ${SPACING.md}`,
    background: 'rgba(45, 212, 191, 0.1)',
    border: '1px solid rgba(45, 212, 191, 0.3)',
    borderRadius: BORDER_RADIUS.md,
    color: COLORS.textGray,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase,
    whiteSpace: 'nowrap'
  },
  tabActive: {
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    color: COLORS.bgDarkAlt,
    border: `1px solid ${COLORS.primary}`,
    boxShadow: '0 4px 12px rgba(45, 212, 191, 0.4)'
  },
  toggleButton: {
    padding: `${SPACING[2]} ${SPACING.md}`,
    background: 'rgba(100, 116, 139, 0.2)',
    border: '1px solid rgba(100, 116, 139, 0.4)',
    borderRadius: BORDER_RADIUS.md,
    color: COLORS.textGray,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase,
    whiteSpace: 'nowrap',
    opacity: 0.8
  }
};
