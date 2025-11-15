/**
 * Common Style Utilities - Reusable style objects
 *
 * Commonly used style combinations that can be imported and reused
 * across components. Use object spread to compose styles.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  FONT_SIZE,
  FONT_WEIGHT,
  TRANSITIONS,
  BLUR,
  WIDTHS
} from './tokens';
import type { CSSProperties } from 'react';

/**
 * Card container style
 */
export const cardStyle: CSSProperties = {
  backgroundColor: COLORS.bgCard,
  border: `2px solid ${COLORS.borderTeal}`,
  borderRadius: BORDER_RADIUS.md,
  padding: SPACING.md,
  boxShadow: SHADOWS.md
};

/**
 * Light card variant
 */
export const cardLightStyle: CSSProperties = {
  ...cardStyle,
  backgroundColor: COLORS.bgCardLight
};

/**
 * Button style
 */
export const buttonStyle: CSSProperties = {
  background: COLORS.bgButton,
  border: `2px solid ${COLORS.borderPrimary}`,
  borderRadius: BORDER_RADIUS.sm,
  padding: `${SPACING.sm} ${SPACING.md}`,
  color: COLORS.textPrimary,
  fontSize: FONT_SIZE.md,
  fontWeight: FONT_WEIGHT.medium,
  cursor: 'pointer',
  transition: 'all 150ms ease'
};

/**
 * Button hover effect (use with onMouseEnter/Leave)
 */
export const buttonHoverStyle: CSSProperties = {
  ...buttonStyle,
  background: COLORS.bgButtonHover,
  boxShadow: SHADOWS.glow
};

/**
 * Danger button (delete, reset, etc.)
 */
export const buttonDangerStyle: CSSProperties = {
  ...buttonStyle,
  borderColor: COLORS.borderDanger,
  color: COLORS.textDanger
};

/**
 * Success button (confirm, save, etc.)
 */
export const buttonSuccessStyle: CSSProperties = {
  ...buttonStyle,
  borderColor: COLORS.borderSuccess,
  color: COLORS.textSuccess
};

/**
 * Disabled button
 */
export const buttonDisabledStyle: CSSProperties = {
  ...buttonStyle,
  opacity: 0.5,
  cursor: 'not-allowed'
};

/**
 * Flexbox utilities
 */
export const flexCenter: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

export const flexRow: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center'
};

export const flexColumn: CSSProperties = {
  display: 'flex',
  flexDirection: 'column'
};

export const flexBetween: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
};

export const flexWrap: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: SPACING.sm
};

/**
 * Input field style
 */
export const inputStyle: CSSProperties = {
  background: COLORS.bgInput,
  border: `2px solid ${COLORS.borderDark}`,
  borderRadius: BORDER_RADIUS.sm,
  padding: `${SPACING.sm} ${SPACING.md}`,
  color: COLORS.textPrimary,
  fontSize: FONT_SIZE.md,
  outline: 'none'
};

/**
 * Input focus style
 */
export const inputFocusStyle: CSSProperties = {
  ...inputStyle,
  borderColor: COLORS.borderPrimary,
  boxShadow: SHADOWS.glow
};

/**
 * Modal backdrop
 */
export const modalBackdropStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: COLORS.bgOverlay,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

/**
 * Modal content
 */
export const modalContentStyle: CSSProperties = {
  background: COLORS.bgDark,
  border: `3px solid ${COLORS.borderTeal}`,
  borderRadius: BORDER_RADIUS.lg,
  padding: SPACING.lg,
  maxWidth: '500px',
  maxHeight: '80vh',
  overflowY: 'auto',
  boxShadow: SHADOWS.xl
};

/**
 * Scrollbar style (for containers with overflow)
 */
export const scrollableStyle: CSSProperties = {
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: `${COLORS.borderPrimary} ${COLORS.bgCard}`
};

/**
 * Text truncate with ellipsis
 */
export const textTruncate: CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};

/**
 * Stat item display (label: value)
 */
export const statItemStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: `${SPACING.xs} 0`,
  borderBottom: `1px solid ${COLORS.borderDark}`,
  fontSize: FONT_SIZE.md
};

/**
 * Badge/tag style
 */
export const badgeStyle: CSSProperties = {
  padding: `${SPACING.xxs} ${SPACING.sm}`,
  borderRadius: BORDER_RADIUS.sm,
  fontSize: FONT_SIZE.sm,
  fontWeight: FONT_WEIGHT.medium,
  display: 'inline-block'
};

/**
 * Tooltip style
 */
export const tooltipStyle: CSSProperties = {
  position: 'fixed',
  background: COLORS.bgCard,
  border: `2px solid ${COLORS.borderTeal}`,
  borderRadius: BORDER_RADIUS.md,
  padding: SPACING.md,
  boxShadow: SHADOWS.lg,
  zIndex: 2000,
  pointerEvents: 'none',
  maxWidth: '300px'
};

/**
 * Divider line
 */
export const dividerStyle: CSSProperties = {
  height: '1px',
  backgroundColor: COLORS.borderDark,
  margin: `${SPACING.md} 0`,
  border: 'none'
};

/**
 * Icon button (small square button with icon)
 */
export const iconButtonStyle: CSSProperties = {
  ...flexCenter,
  width: '40px',
  height: '40px',
  background: COLORS.bgButton,
  border: `2px solid ${COLORS.borderPrimary}`,
  borderRadius: BORDER_RADIUS.sm,
  cursor: 'pointer',
  fontSize: FONT_SIZE.lg,
  transition: 'all 150ms ease'
};

/**
 * Progress bar container
 */
export const progressBarContainerStyle: CSSProperties = {
  width: '100%',
  height: '20px',
  backgroundColor: COLORS.bgInput,
  border: `1px solid ${COLORS.borderDark}`,
  borderRadius: BORDER_RADIUS.sm,
  overflow: 'hidden',
  position: 'relative'
};

/**
 * Progress bar fill (use with dynamic width)
 */
export const progressBarFillStyle: CSSProperties = {
  height: '100%',
  backgroundColor: COLORS.success,
  transition: 'width 300ms ease'
};

/**
 * Grid layout utility
 */
export const gridStyle: CSSProperties = {
  display: 'grid',
  gap: SPACING.md
};

/**
 * Create grid with specified columns
 *
 * @param columns - Number of columns
 * @returns Grid style with columns
 *
 * @example
 * ```typescript
 * const styles = {
 *   container: gridColumns(3) // 3 column grid
 * };
 * ```
 */
export function gridColumns(columns: number): CSSProperties {
  return {
    ...gridStyle,
    gridTemplateColumns: `repeat(${columns}, 1fr)`
  };
}

/**
 * Helper to get rarity color
 *
 * @param rarity - Item rarity
 * @returns Rarity color
 *
 * @example
 * ```typescript
 * const color = getRarityColor('legendary'); // '#ff8000'
 * ```
 */
export function getRarityColor(rarity: string): string {
  const rarityMap: Record<string, string> = {
    common: COLORS.rarityCommon,
    uncommon: COLORS.rarityUncommon,
    rare: COLORS.rarityRare,
    epic: COLORS.rarityEpic,
    legendary: COLORS.rarityLegendary,
    mythic: COLORS.rarityMythic
  };
  return rarityMap[rarity.toLowerCase()] || COLORS.rarityCommon;
}

/**
 * Helper to get room type color
 *
 * @param roomType - Room type
 * @returns Room color
 *
 * @example
 * ```typescript
 * const color = getRoomColor('boss'); // '#ff0000'
 * ```
 */
export function getRoomColor(roomType: string): string {
  const roomColorMap: Record<string, string> = {
    combat: COLORS.roomCombat,
    treasure: COLORS.roomTreasure,
    boss: COLORS.roomBoss,
    rest: COLORS.roomRest,
    trap: COLORS.roomTrap,
    shrine: COLORS.roomShrine,
    mystery: COLORS.roomMystery,
    elite: COLORS.roomElite,
    miniboss: COLORS.roomMiniboss,
    exit: COLORS.roomExit,
    start: COLORS.roomStart
  };
  return roomColorMap[roomType.toLowerCase()] || COLORS.borderPrimary;
}

/**
 * Container with backdrop blur effect
 */
export const blurContainerStyle: CSSProperties = {
  backdropFilter: BLUR.md,
  backgroundColor: COLORS.bgSemiTransparent,
  border: `2px solid ${COLORS.borderDark}`,
  borderRadius: BORDER_RADIUS.md,
  padding: SPACING.md
};

/**
 * Full screen overlay
 */
export const fullScreenOverlayStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: COLORS.bgOverlayDark,
  backdropFilter: BLUR.md,
  zIndex: 1000
};

/**
 * Centered container
 */
export const centeredContainerStyle: CSSProperties = {
  ...flexCenter,
  minHeight: '100vh',
  padding: SPACING.lg
};

/**
 * Tab navigation button
 */
export const tabButtonStyle: CSSProperties = {
  padding: `${SPACING.sm} ${SPACING.lg}`,
  backgroundColor: COLORS.bgCard,
  border: `2px solid ${COLORS.borderDark}`,
  borderRadius: BORDER_RADIUS.sm,
  color: COLORS.textSecondary,
  fontSize: FONT_SIZE.md,
  fontWeight: FONT_WEIGHT.medium,
  cursor: 'pointer',
  transition: TRANSITIONS.allFast
};

/**
 * Active tab button
 */
export const tabButtonActiveStyle: CSSProperties = {
  ...tabButtonStyle,
  backgroundColor: COLORS.primary,
  borderColor: COLORS.primary,
  color: COLORS.textPrimary,
  fontWeight: FONT_WEIGHT.bold
};

/**
 * Info box variants
 */
export const infoBoxStyle: CSSProperties = {
  padding: SPACING.md,
  borderRadius: BORDER_RADIUS.md,
  fontSize: FONT_SIZE.md,
  marginBottom: SPACING.md
};

export const infoBoxInfoStyle: CSSProperties = {
  ...infoBoxStyle,
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  border: `2px solid ${COLORS.info}`,
  color: COLORS.textLight
};

export const infoBoxWarningStyle: CSSProperties = {
  ...infoBoxStyle,
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  border: `2px solid ${COLORS.warning}`,
  color: COLORS.textWarning
};

export const infoBoxSuccessStyle: CSSProperties = {
  ...infoBoxStyle,
  backgroundColor: 'rgba(16, 185, 129, 0.1)',
  border: `2px solid ${COLORS.success}`,
  color: COLORS.textSuccess
};

export const infoBoxDangerStyle: CSSProperties = {
  ...infoBoxStyle,
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  border: `2px solid ${COLORS.danger}`,
  color: COLORS.textDanger
};

/**
 * Helper to get info box style by variant
 */
export function getInfoBoxStyle(variant: 'info' | 'warning' | 'success' | 'danger'): CSSProperties {
  const styles = {
    info: infoBoxInfoStyle,
    warning: infoBoxWarningStyle,
    success: infoBoxSuccessStyle,
    danger: infoBoxDangerStyle
  };
  return styles[variant] || infoBoxInfoStyle;
}

/**
 * Sidebar style (for MainSidebar)
 */
export const sidebarStyle: CSSProperties = {
  width: WIDTHS.sidebar,
  height: '100vh',
  backgroundColor: COLORS.bgCardDark,
  borderRight: `2px solid ${COLORS.borderDark}`,
  padding: SPACING.md,
  overflowY: 'auto',
  transition: `width ${TRANSITIONS.base}`
};

/**
 * Compact sidebar style
 */
export const sidebarCompactStyle: CSSProperties = {
  ...sidebarStyle,
  width: WIDTHS.sidebarCompact
};

/**
 * Header style (for GameHeader)
 */
export const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${SPACING.sm} ${SPACING.lg}`,
  backgroundColor: COLORS.bgCardDark,
  borderBottom: `2px solid ${COLORS.borderDark}`,
  boxShadow: SHADOWS.md
};

/**
 * Card with hover effect
 */
export const cardHoverStyle: CSSProperties = {
  ...cardStyle,
  cursor: 'pointer',
  transition: TRANSITIONS.allFast
};

/**
 * Badge styles by type
 */
export const badgeInfoStyle: CSSProperties = {
  ...badgeStyle,
  backgroundColor: COLORS.info,
  color: COLORS.white
};

export const badgeSuccessStyle: CSSProperties = {
  ...badgeStyle,
  backgroundColor: COLORS.success,
  color: COLORS.white
};

export const badgeWarningStyle: CSSProperties = {
  ...badgeStyle,
  backgroundColor: COLORS.warning,
  color: COLORS.white
};

export const badgeDangerStyle: CSSProperties = {
  ...badgeStyle,
  backgroundColor: COLORS.danger,
  color: COLORS.white
};

/**
 * Helper to get badge style by type
 */
export function getBadgeStyle(type: 'info' | 'success' | 'warning' | 'danger'): CSSProperties {
  const styles = {
    info: badgeInfoStyle,
    success: badgeSuccessStyle,
    warning: badgeWarningStyle,
    danger: badgeDangerStyle
  };
  return styles[type] || badgeInfoStyle;
}

/**
 * Resource display (gold, energy, etc.)
 */
export const resourceDisplayStyle: CSSProperties = {
  ...flexRow,
  gap: SPACING.xs,
  padding: `${SPACING.xs} ${SPACING.sm}`,
  backgroundColor: COLORS.bgCard,
  border: `2px solid ${COLORS.borderDark}`,
  borderRadius: BORDER_RADIUS.md,
  fontSize: FONT_SIZE.md,
  fontWeight: FONT_WEIGHT.medium
};

/**
 * HP/Energy bar container
 */
export const barContainerStyle: CSSProperties = {
  ...progressBarContainerStyle,
  height: '24px'
};

/**
 * HP bar fill (green)
 */
export const hpBarFillStyle: CSSProperties = {
  ...progressBarFillStyle,
  backgroundColor: COLORS.success
};

/**
 * Energy bar fill (blue)
 */
export const energyBarFillStyle: CSSProperties = {
  ...progressBarFillStyle,
  backgroundColor: COLORS.info
};

/**
 * Mana bar fill (cyan)
 */
export const manaBarFillStyle: CSSProperties = {
  ...progressBarFillStyle,
  backgroundColor: COLORS.primary
};
