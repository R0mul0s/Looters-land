/**
 * Design Tokens - Centralized design constants
 *
 * All color, spacing, border, and other design values used throughout
 * the application. Import these tokens instead of hardcoding values.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

/**
 * Color palette
 */
export const COLORS = {
  // Primary brand colors (most used)
  primary: '#2dd4bf',           // Teal/cyan - primary accent
  primaryDark: '#14b8a6',       // Teal dark variant
  primaryLight: '#5eead4',      // Teal light variant

  // Background colors (structured)
  background: {
    primary: '#1a1a2e',
    secondary: '#16213e',
    tertiary: '#0f3460',
    elevated: '#1e1e2e',
    dark: '#1a1a1a',
    black: '#000000',
    // Legacy support
    bgDark: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    bgDarkSolid: '#0a0f1e',
    bgDarkAlt: '#0f172a',
    bgCard: 'rgba(30, 30, 30, 0.9)',
    bgCardLight: 'rgba(40, 40, 40, 0.95)',
    bgCardDark: '#1a1a1a',
    bgSurface: '#1e293b',
    bgSurfaceLight: '#334155',
    bgSurfaceLighter: '#475569',
    bgButton: 'linear-gradient(135deg, #2a2a3e 0%, #1a1a2e 100%)',
    bgButtonHover: 'linear-gradient(135deg, #3a3a4e 0%, #2a2a3e 100%)',
    bgInput: 'rgba(20, 20, 20, 0.8)',
    bgOverlay: 'rgba(0, 0, 0, 0.7)',
    bgOverlayDark: 'rgba(0, 0, 0, 0.85)',
    bgSemiTransparent: 'rgba(0, 0, 0, 0.5)',
    bgTransparent: 'rgba(0, 0, 0, 0.3)',
  },

  // Text colors (structured)
  text: {
    primary: '#ffffff',
    secondary: '#ccc',
    tertiary: '#999',
    muted: '#888',
    disabled: '#666',
    hint: '#aaa',
  },

  // Border colors (structured)
  border: {
    default: '#333',
    light: '#444',
    medium: '#555',
  },

  // Accent colors (structured)
  accent: {
    primary: '#f59e0b',
    secondary: '#3b82f6',
    success: '#10b981',
    danger: '#ef4444',
    error: '#dc2626',
    purple: '#8b5cf6',
    gold: '#FFD700',
    blue: '#4a9eff',
    green: '#4CAF50',
    darkBlue: '#2a5298',
    brown: '#8b4513',
    darkBrown: '#654321',
    darkGreen: '#2d5016',
    darkerGreen: '#1a3010',
    darkGold: '#f0c000',
    bronze: '#8b6914',
    brightBlue: '#007bff',
  },

  // Rarity colors (structured)
  rarity: {
    common: '#9ca3af',
    uncommon: '#22c55e',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b',
    // Legacy support
    rarityMythic: '#e6cc80',
  },

  // Status colors (structured)
  status: {
    error: '#dc2626',
    success: '#10b981',
    warning: '#f59e0b',
    info: '#3b82f6',
    // Legacy support
    statusActive: '#44ff44',
    statusInactive: '#666666',
    statusDanger: '#ff4444',
  },

  // Overlay colors (structured)
  overlay: {
    dark: 'rgba(0, 0, 0, 0.5)',
    darker: 'rgba(0, 0, 0, 0.7)',
    darkest: 'rgba(0, 0, 0, 0.8)',
    light: 'rgba(255, 255, 255, 0.1)',
  },

  // Legacy flat structure (for backward compatibility)
  success: '#10b981',
  successDark: '#059669',
  successLight: '#4CAF50',
  danger: '#ef4444',
  dangerDark: '#dc2626',
  dangerDarker: '#8B0000',
  warning: '#f59e0b',
  warningDark: '#d97706',
  info: '#3b82f6',
  infoLight: '#60a5fa',
  gold: '#FFD700',
  goldDark: '#DAA520',
  goldLight: '#fbbf24',

  // Buff colors (with transparency for backgrounds)
  buffDamage: 'rgba(255, 77, 77, 0.2)',
  buffDamageSolid: '#ff4d4d',
  buffXP: 'rgba(100, 149, 237, 0.2)',
  buffXPSolid: '#6495ed',
  buffGold: 'rgba(255, 215, 0, 0.2)',
  buffGoldSolid: '#ffd700',
  buffStats: 'rgba(138, 43, 226, 0.2)',
  buffStatsSolid: '#8a2be2',
  buffShrines: 'rgba(135, 206, 235, 0.1)',
  buffShrinesSolid: '#87ceeb',

  // Room type colors
  roomCombat: '#ff6b6b',
  roomTreasure: '#ffd700',
  roomBoss: '#ff0000',
  roomRest: '#00ff00',
  roomTrap: '#ff00ff',
  roomShrine: '#87ceeb',
  roomMystery: '#9370db',
  roomElite: '#ff8c00',
  roomMiniboss: '#dc143c',
  roomExit: '#00ffff',
  roomStart: '#ffffff',

  // Additional utility colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Flat legacy properties (for backward compatibility)
  bgDark: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
  bgDarkSolid: '#0a0f1e',
  bgDarkAlt: '#0f172a',
  bgCard: 'rgba(30, 30, 30, 0.9)',
  bgCardLight: 'rgba(40, 40, 40, 0.95)',
  bgCardDark: '#1a1a1a',
  bgSurface: '#1e293b',
  bgSurfaceLight: '#334155',
  bgSurfaceLighter: '#475569',
  bgButton: 'linear-gradient(135deg, #2a2a3e 0%, #1a1a2e 100%)',
  bgButtonHover: 'linear-gradient(135deg, #3a3a4e 0%, #2a2a3e 100%)',
  bgInput: 'rgba(20, 20, 20, 0.8)',
  bgOverlay: 'rgba(0, 0, 0, 0.7)',
  bgOverlayDark: 'rgba(0, 0, 0, 0.85)',
  bgSemiTransparent: 'rgba(0, 0, 0, 0.5)',
  bgTransparent: 'rgba(0, 0, 0, 0.3)',
  textPrimary: '#ffffff',
  textSecondary: '#a0a0a0',
  textMuted: '#666666',
  textLight: '#f1f5f9',
  textLighter: '#e2e8f0',
  textSlate: '#cbd5e1',
  textGray: '#94a3b8',
  textDarkGray: '#64748b',
  textDanger: '#ff4444',
  textSuccess: '#44ff44',
  textWarning: '#ffaa00',
  borderDark: '#333',
  borderDarker: '#444',
  borderDarkest: '#555',
  borderLight: '#666',
  borderPrimary: '#4a9eff',
  borderTeal: '#20b2aa',
  borderGold: '#ffd700',
  borderSilver: '#c0c0c0',
  borderDanger: '#ff4444',
  borderSuccess: '#44ff44',
  borderWarning: '#ffaa00',
  rarityCommon: '#9d9d9d',
  rarityUncommon: '#1eff00',
  rarityRare: '#0070dd',
  rarityEpic: '#a335ee',
  rarityLegendary: '#ff8000',
  rarityMythic: '#e6cc80',
};

/**
 * Spacing scale (4px base grid)
 */
export const SPACING = {
  0: '0',
  1: '4px',      // 0.25rem
  1.25: '5px',   // Special case
  1.5: '6px',    // Special case
  2: '8px',      // 0.5rem
  2.5: '10px',   // Special case
  3: '12px',     // 0.75rem
  3.5: '14px',   // Special case
  4: '16px',     // 1rem
  5: '20px',     // 1.25rem
  6: '24px',     // 1.5rem
  8: '32px',     // 2rem
  10: '40px',    // 2.5rem
  12: '48px',    // 3rem
  16: '64px',    // 4rem
  20: '80px',    // 5rem
  24: '96px',    // 6rem

  // Semantic aliases (for backward compatibility)
  xxs: '2px',
  xs: '5px',
  sm: '10px',
  md: '15px',
  lg: '20px',
  xl: '30px',
  xxl: '40px'
};

/**
 * Border radius scale
 */
export const BORDER_RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  round: '50%'
};

/**
 * Font sizes
 */
export const FONT_SIZE = {
  xs: '10px',
  sm: '12px',
  md: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '28px',
  '4xl': '32px',
  '5xl': '40px',
  '6xl': '48px',
  '7xl': '64px',
  '8xl': '80px',
  '9xl': '96px',

  // Specific sizes found in codebase
  11: '11px',
  13: '13px',
  15: '15px'
};

/**
 * Font weights
 */
export const FONT_WEIGHT = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700
};

/**
 * Shadows
 */
export const SHADOWS = {
  none: 'none',
  sm: '0 2px 4px rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px rgba(0, 0, 0, 0.3)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.4)',
  xl: '0 12px 24px rgba(0, 0, 0, 0.5)',
  '2xl': '0 16px 32px rgba(0, 0, 0, 0.6)',
  inset: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
  insetLg: 'inset 0 4px 8px rgba(0, 0, 0, 0.4)',

  // Glow effects
  glow: '0 0 20px rgba(74, 158, 255, 0.5)',
  glowTeal: '0 0 20px rgba(45, 212, 191, 0.5)',
  glowGold: '0 0 20px rgba(255, 215, 0, 0.5)',
  glowRed: '0 0 20px rgba(239, 68, 68, 0.5)',
  glowGreen: '0 0 20px rgba(16, 185, 129, 0.5)',

  // Common shadow patterns from codebase
  subtle: '0 2px 8px rgba(0, 0, 0, 0.15)',
  card: '0 4px 12px rgba(0, 0, 0, 0.25)',
  strong: '0 8px 24px rgba(0, 0, 0, 0.35)'
};

/**
 * Z-index scale
 */
export const Z_INDEX = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 1000,
  tooltip: 2000,
  notification: 3000
};

/**
 * Transitions
 */
export const TRANSITIONS = {
  fast: '150ms ease',
  base: '300ms ease',
  slow: '500ms ease',
  allFast: 'all 150ms ease',
  allBase: 'all 300ms ease',
  allSlow: 'all 500ms ease'
};

/**
 * Breakpoints (for responsive design)
 */
export const BREAKPOINTS = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
  ultrawide: '1920px'
};

/**
 * Backdrop blur values
 */
export const BLUR = {
  none: 'none',
  sm: 'blur(4px)',
  md: 'blur(8px)',
  lg: 'blur(16px)',
  xl: 'blur(24px)'
};

/**
 * Common width values
 */
export const WIDTHS = {
  sidebar: '220px',
  sidebarCompact: '80px',
  modal: '500px',
  modalLg: '600px',
  modalXl: '800px',
  full: '100%'
};

/**
 * Common height values
 */
export const HEIGHTS = {
  header: '60px',
  navigation: '70px',
  full: '100%',
  screen: '100vh'
};
