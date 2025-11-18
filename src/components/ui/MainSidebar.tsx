/**
 * Main Sidebar Component
 *
 * Fixed left sidebar navigation for the game.
 * Contains main menu items for switching between game screens.
 * Responsive: Full width on desktop, icons-only on mobile (<991px).
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React, { useState, useEffect } from 'react';
import { t } from '../../localization/i18n';
import logo from '../../assets/images/logo.png';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZE, FONT_WEIGHT, BLUR, Z_INDEX, TRANSITIONS } from '../../styles/tokens';
import { flexCenter } from '../../styles/common';
import { VERSION_DISPLAY, COPYRIGHT } from '../../config/gameConfig';

type GameScreen = 'worldmap' | 'town' | 'dungeon' | 'inventory' | 'heroes' | 'quests' | 'guild' | 'leaderboards' | 'teleport' | 'updates';

interface MainSidebarProps {
  activeScreen: GameScreen;
  onScreenChange: (screen: GameScreen) => void;
  playerLevel?: number;
  combatPower?: number;
}

/**
 * Main Sidebar Component
 *
 * @param props - Component props
 * @returns React component
 */
export function MainSidebar({
  activeScreen,
  onScreenChange,
  combatPower = 0
}: MainSidebarProps) {
  const [isCompact, setIsCompact] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<GameScreen | null>(null);

  // Check window width for responsive behavior
  useEffect(() => {
    const checkWidth = () => {
      setIsCompact(window.innerWidth < 991);
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toUpperCase();

      // Map keys to screens
      const keyMap: Record<string, GameScreen> = {
        'W': 'worldmap',
        'H': 'heroes',
        'I': 'inventory',
        'T': 'teleport',
        'L': 'leaderboards',
        'Q': 'quests',
        'G': 'guild',
        'U': 'updates'
      };

      const screen = keyMap[key];
      if (screen) {
        e.preventDefault();
        onScreenChange(screen);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onScreenChange]);

  const menuItems = [
    { id: 'worldmap' as GameScreen, icon: '🗺️', labelKey: 'sidebar.worldMap', hotkey: 'W' },
    { id: 'heroes' as GameScreen, icon: '🦸', labelKey: 'sidebar.heroes', hotkey: 'H' },
    { id: 'inventory' as GameScreen, icon: '🎒', labelKey: 'sidebar.inventory', hotkey: 'I' },
    { id: 'teleport' as GameScreen, icon: '🌍', labelKey: 'sidebar.teleport', hotkey: 'T' },
    { id: 'leaderboards' as GameScreen, icon: '🏆', labelKey: 'sidebar.leaderboards', hotkey: 'L' },
    { id: 'quests' as GameScreen, icon: '📜', labelKey: 'sidebar.quests', hotkey: 'Q' },
    { id: 'guild' as GameScreen, icon: '👥', labelKey: 'sidebar.guild', hotkey: 'G' },
    { id: 'updates' as GameScreen, icon: '📋', labelKey: 'sidebar.lastUpdates', hotkey: 'U' }
  ];

  return (
    <div style={{
      ...styles.container,
      ...(isCompact ? styles.containerCompact : {})
    }}>
      {/* Logo / Game Title */}
      {!isCompact && (
        <div style={styles.header}>
          <img src={logo} alt="Looters Land" style={styles.logoImage} />
        </div>
      )}

      {isCompact && (
        <div style={styles.headerCompact}>
          <img src={logo} alt="Looters Land" style={styles.logoImageCompact} />
        </div>
      )}

      {/* Combat Power Badge */}
      {!isCompact && (
        <div style={styles.combatPowerBadge}>
          <span style={styles.combatPowerIcon}>🏆</span>
          <span style={styles.combatPowerText}>{combatPower.toLocaleString()}</span>
        </div>
      )}

      {isCompact && (
        <div style={styles.combatPowerBadgeCompact} title={`${t('sidebar.combatPower')}: ${combatPower.toLocaleString()}`}>
          <span style={styles.combatPowerIconCompact}>🏆</span>
          <span style={styles.combatPowerTextCompact}>{(combatPower / 1000).toFixed(1)}k</span>
        </div>
      )}

      {/* Navigation Menu */}
      <div style={styles.menu}>
        {menuItems.map((item) => {
          const isActive = activeScreen === item.id;
          const isHovered = hoveredItem === item.id;

          return (
            <div
              key={item.id}
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <button
                onClick={() => onScreenChange(item.id)}
                style={{
                  ...styles.menuItem,
                  ...(isCompact ? styles.menuItemCompact : {}),
                  ...(isActive ? (isCompact ? styles.menuItemActiveCompact : styles.menuItemActive) : {})
                }}
                title={isCompact ? undefined : `${t(item.labelKey)} (${item.hotkey})`}
              >
                <span style={isCompact ? styles.menuIconCompact : styles.menuIcon}>{item.icon}</span>
                {!isCompact && (
                  <>
                    <span style={styles.menuLabel}>{t(item.labelKey)}</span>
                    <span style={styles.hotkey}>{item.hotkey}</span>
                  </>
                )}
              </button>

              {/* Tooltip for compact mode */}
              {isCompact && isHovered && (
                <div style={styles.tooltip}>
                  <span style={styles.tooltipText}>{t(item.labelKey)}</span>
                  <span style={styles.tooltipHotkey}>{item.hotkey}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {!isCompact && (
        <div style={styles.footer}>
          <div style={styles.version}>{VERSION_DISPLAY}</div>
          <div style={styles.copyright}>{COPYRIGHT}</div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '220px',
    height: '100%',
    background: `linear-gradient(180deg, ${COLORS.bgDarkAlt} 0%, ${COLORS.bgSurface} 100%)`,
    borderRight: `1px solid rgba(45, 212, 191, 0.2)`,
    boxShadow: `4px 0 24px rgba(0, 0, 0, 0.4), inset -1px 0 0 rgba(45, 212, 191, 0.1)`,
    overflow: 'hidden',
    boxSizing: 'border-box',
    transition: `width ${TRANSITIONS.base}`
  },
  containerCompact: {
    width: '70px'
  },
  header: {
    ...flexCenter,
    padding: SPACING.lg,
    background: `linear-gradient(135deg, ${COLORS.bgDarkAlt} 0%, ${COLORS.bgSurface} 100%)`,
    borderBottom: `1px solid rgba(45, 212, 191, 0.2)`
  },
  logoImage: {
    width: '100%',
    maxWidth: '180px',
    height: 'auto',
    filter: 'drop-shadow(0 0 8px rgba(45, 212, 191, 0.3))'
  },
  levelBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[2],
    margin: `${SPACING.md} ${SPACING.lg}`,
    padding: `${SPACING.sm} ${SPACING[3]}`,
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.15) 0%, rgba(20, 184, 166, 0.05) 100%)',
    borderRadius: SPACING.sm,
    border: '1px solid rgba(45, 212, 191, 0.3)',
    boxShadow: '0 4px 12px rgba(45, 212, 191, 0.1)'
  },
  levelIcon: {
    fontSize: FONT_SIZE.xl,
    filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))'
  },
  levelText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.goldLight,
    textShadow: '0 0 8px rgba(251, 191, 36, 0.4)'
  },
  menu: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: SPACING.sm,
    overflowY: 'auto',
    overflowX: 'hidden'
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[3],
    paddingTop: SPACING[3],
    paddingRight: SPACING.md,
    paddingBottom: SPACING[3],
    paddingLeft: SPACING.md,
    background: COLORS.transparent,
    borderTop: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    borderLeft: 'none',
    borderRadius: SPACING.sm,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    color: COLORS.textGray,
    textAlign: 'left',
    position: 'relative'
  },
  menuItemActive: {
    background: 'linear-gradient(90deg, rgba(45, 212, 191, 0.2) 0%, rgba(45, 212, 191, 0.05) 100%)',
    color: COLORS.primary,
    borderLeft: `3px solid ${COLORS.primary}`,
    paddingTop: SPACING[3],
    paddingRight: '25px',
    paddingBottom: SPACING[3],
    paddingLeft: SPACING[3],
    marginLeft: `-${SPACING.sm}`,
    marginRight: `-${SPACING.sm}`,
    boxShadow: '0 4px 12px rgba(45, 212, 191, 0.15), inset 0 1px 0 rgba(45, 212, 191, 0.2)'
  },
  menuIcon: {
    fontSize: FONT_SIZE.xl,
    width: '24px',
    textAlign: 'center',
    transition: 'transform 0.2s'
  },
  menuLabel: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    letterSpacing: '0.3px'
  },
  hotkey: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textDarkGray,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    padding: `${SPACING[1]} 7px`,
    borderRadius: SPACING.xs,
    border: '1px solid rgba(45, 212, 191, 0.2)',
    fontWeight: FONT_WEIGHT.semibold,
    letterSpacing: '0.5px'
  },
  footer: {
    padding: `${SPACING.md} ${SPACING.lg}`,
    borderTop: '1px solid rgba(45, 212, 191, 0.1)',
    textAlign: 'center',
    background: `linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.5) 100%)`
  },
  version: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textDarkGray,
    marginBottom: SPACING.xs,
    fontWeight: FONT_WEIGHT.medium
  },
  copyright: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.bgSurfaceLighter
  },
  // Compact mode styles
  headerCompact: {
    display: 'flex',
    justifyContent: 'center',
    padding: `${SPACING.md} 0`,
    background: `linear-gradient(135deg, ${COLORS.bgDarkAlt} 0%, ${COLORS.bgSurface} 100%)`,
    borderBottom: '1px solid rgba(45, 212, 191, 0.2)'
  },
  logoImageCompact: {
    width: '50px',
    height: 'auto',
    filter: 'drop-shadow(0 0 8px rgba(45, 212, 191, 0.3))'
  },
  levelBadgeCompact: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: SPACING.xxs,
    margin: `${SPACING.sm} ${SPACING.xs}`,
    padding: `${SPACING[2]} ${SPACING.xs}`,
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.15) 0%, rgba(20, 184, 166, 0.05) 100%)',
    borderRadius: SPACING.sm,
    border: '1px solid rgba(45, 212, 191, 0.3)',
    cursor: 'default',
    boxShadow: '0 4px 12px rgba(45, 212, 191, 0.1)'
  },
  levelIconCompact: {
    fontSize: FONT_SIZE.base,
    filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))'
  },
  levelTextCompact: {
    fontSize: FONT_SIZE[11],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.goldLight,
    textShadow: '0 0 8px rgba(251, 191, 36, 0.4)'
  },
  combatPowerBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[2],
    margin: `${SPACING.md} ${SPACING.lg}`,
    padding: `${SPACING.sm} ${SPACING[3]}`,
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(218, 165, 32, 0.05) 100%)',
    borderRadius: SPACING.sm,
    border: '1px solid rgba(255, 215, 0, 0.3)',
    boxShadow: '0 4px 12px rgba(255, 215, 0, 0.1)'
  },
  combatPowerIcon: {
    fontSize: FONT_SIZE.lg,
    filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.6))'
  },
  combatPowerText: {
    fontSize: FONT_SIZE[13],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.gold,
    textShadow: '0 0 8px rgba(255, 215, 0, 0.4)'
  },
  combatPowerBadgeCompact: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: SPACING.xxs,
    margin: `0 ${SPACING.xs} ${SPACING.sm} ${SPACING.xs}`,
    padding: `${SPACING[2]} ${SPACING.xs}`,
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(218, 165, 32, 0.05) 100%)',
    borderRadius: SPACING.sm,
    border: '1px solid rgba(255, 215, 0, 0.3)',
    cursor: 'default',
    boxShadow: SHADOWS.sm
  },
  combatPowerIconCompact: {
    fontSize: FONT_SIZE.lg,
    filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.6))'
  },
  combatPowerTextCompact: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.gold,
    textShadow: '0 0 8px rgba(255, 215, 0, 0.4)'
  },
  menuItemCompact: {
    justifyContent: 'center',
    paddingTop: SPACING[3],
    paddingRight: SPACING.xs,
    paddingBottom: SPACING[3],
    paddingLeft: SPACING.xs,
    gap: '0'
  },
  menuItemActiveCompact: {
    background: 'linear-gradient(90deg, rgba(45, 212, 191, 0.2) 0%, rgba(45, 212, 191, 0.05) 100%)',
    color: COLORS.primary,
    borderLeft: `3px solid ${COLORS.primary}`,
    paddingTop: SPACING[3],
    paddingRight: SPACING.xs,
    paddingBottom: SPACING[3],
    paddingLeft: SPACING.xxs,
    boxShadow: '0 4px 12px rgba(45, 212, 191, 0.15)'
  },
  menuIconCompact: {
    fontSize: FONT_SIZE['2xl'],
    width: 'auto',
    textAlign: 'center'
  },
  tooltip: {
    position: 'absolute',
    left: '70px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: `linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)`,
    border: '1px solid rgba(45, 212, 191, 0.4)',
    borderRadius: BORDER_RADIUS.md,
    padding: `${SPACING.sm} ${SPACING.md}`,
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.sm,
    zIndex: Z_INDEX.modal,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    boxShadow: `${SHADOWS.lg}, 0 0 0 1px rgba(45, 212, 191, 0.1) inset`,
    backdropFilter: BLUR.lg
  },
  tooltipText: {
    fontSize: FONT_SIZE[13],
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textLight,
    letterSpacing: '0.3px'
  },
  tooltipHotkey: {
    fontSize: FONT_SIZE[11],
    color: COLORS.primary,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    padding: `${SPACING[1]} 7px`,
    borderRadius: SPACING.xs,
    border: '1px solid rgba(45, 212, 191, 0.3)',
    fontWeight: FONT_WEIGHT.semibold
  }
};
