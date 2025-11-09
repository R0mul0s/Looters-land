/**
 * Main Sidebar Component
 *
 * Fixed left sidebar navigation for the game.
 * Contains main menu items for switching between game screens.
 * Responsive: Full width on desktop, icons-only on mobile (<991px).
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-08
 */

import React, { useState, useEffect } from 'react';

type GameScreen = 'worldmap' | 'town' | 'dungeon' | 'inventory' | 'heroes' | 'quests' | 'guild' | 'leaderboards' | 'teleport' | 'updates';

interface MainSidebarProps {
  activeScreen: GameScreen;
  onScreenChange: (screen: GameScreen) => void;
  playerLevel?: number;
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
  playerLevel = 1
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
    { id: 'worldmap' as GameScreen, icon: '🗺️', label: 'World Map', hotkey: 'W' },
    { id: 'heroes' as GameScreen, icon: '🦸', label: 'Heroes', hotkey: 'H' },
    { id: 'inventory' as GameScreen, icon: '🎒', label: 'Inventory', hotkey: 'I' },
    { id: 'teleport' as GameScreen, icon: '🌍', label: 'Teleport', hotkey: 'T' },
    { id: 'leaderboards' as GameScreen, icon: '🏆', label: 'Leaderboards', hotkey: 'L' },
    { id: 'quests' as GameScreen, icon: '📜', label: 'Quests', hotkey: 'Q' },
    { id: 'guild' as GameScreen, icon: '👥', label: 'Guild', hotkey: 'G' },
    { id: 'updates' as GameScreen, icon: '📋', label: 'Last Updates', hotkey: 'U' }
  ];

  return (
    <div style={{
      ...styles.container,
      ...(isCompact ? styles.containerCompact : {})
    }}>
      {/* Logo / Game Title */}
      {!isCompact && (
        <div style={styles.header}>
          <div style={styles.logo}>🗡️</div>
          <div style={styles.title}>Looters<br />Land</div>
        </div>
      )}

      {isCompact && (
        <div style={styles.headerCompact}>
          <div style={styles.logoCompact}>🗡️</div>
        </div>
      )}

      {/* Player Level Badge */}
      {!isCompact && (
        <div style={styles.levelBadge}>
          <span style={styles.levelIcon}>⭐</span>
          <span style={styles.levelText}>Level {playerLevel}</span>
        </div>
      )}

      {isCompact && (
        <div style={styles.levelBadgeCompact} title={`Level ${playerLevel}`}>
          <span style={styles.levelIconCompact}>⭐</span>
          <span style={styles.levelTextCompact}>{playerLevel}</span>
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
                title={isCompact ? undefined : `${item.label} (${item.hotkey})`}
              >
                <span style={isCompact ? styles.menuIconCompact : styles.menuIcon}>{item.icon}</span>
                {!isCompact && (
                  <>
                    <span style={styles.menuLabel}>{item.label}</span>
                    <span style={styles.hotkey}>{item.hotkey}</span>
                  </>
                )}
              </button>

              {/* Tooltip for compact mode */}
              {isCompact && isHovered && (
                <div style={styles.tooltip}>
                  <span style={styles.tooltipText}>{item.label}</span>
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
          <div style={styles.version}>v2.0</div>
          <div style={styles.copyright}>© 2025 rhsoft.cz</div>
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
    background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
    borderRight: '1px solid rgba(45, 212, 191, 0.2)',
    boxShadow: '4px 0 24px rgba(0, 0, 0, 0.4), inset -1px 0 0 rgba(45, 212, 191, 0.1)',
    overflow: 'hidden',
    boxSizing: 'border-box',
    transition: 'width 0.3s ease'
  },
  containerCompact: {
    width: '70px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    borderBottom: '1px solid rgba(45, 212, 191, 0.2)'
  },
  logo: {
    fontSize: '32px',
    filter: 'drop-shadow(0 0 8px rgba(45, 212, 191, 0.5))'
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    lineHeight: '1.2',
    background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  levelBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '15px 20px',
    padding: '10px 12px',
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.15) 0%, rgba(20, 184, 166, 0.05) 100%)',
    borderRadius: '10px',
    border: '1px solid rgba(45, 212, 191, 0.3)',
    boxShadow: '0 4px 12px rgba(45, 212, 191, 0.1)'
  },
  levelIcon: {
    fontSize: '20px',
    filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))'
  },
  levelText: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fbbf24',
    textShadow: '0 0 8px rgba(251, 191, 36, 0.4)'
  },
  menu: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '10px',
    overflowY: 'auto',
    overflowX: 'hidden'
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingTop: '12px',
    paddingRight: '15px',
    paddingBottom: '12px',
    paddingLeft: '15px',
    background: 'transparent',
    borderTop: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    borderLeft: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    color: '#94a3b8',
    textAlign: 'left',
    position: 'relative'
  },
  menuItemActive: {
    background: 'linear-gradient(90deg, rgba(45, 212, 191, 0.2) 0%, rgba(45, 212, 191, 0.05) 100%)',
    color: '#2dd4bf',
    borderLeft: '3px solid #2dd4bf',
    paddingLeft: '12px',
    marginLeft: '-10px',
    marginRight: '-10px',
    paddingRight: '25px',
    boxShadow: '0 4px 12px rgba(45, 212, 191, 0.15), inset 0 1px 0 rgba(45, 212, 191, 0.2)'
  },
  menuIcon: {
    fontSize: '20px',
    width: '24px',
    textAlign: 'center',
    transition: 'transform 0.2s'
  },
  menuLabel: {
    flex: 1,
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '0.3px'
  },
  hotkey: {
    fontSize: '10px',
    color: '#64748b',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    padding: '3px 7px',
    borderRadius: '5px',
    border: '1px solid rgba(45, 212, 191, 0.2)',
    fontWeight: '600',
    letterSpacing: '0.5px'
  },
  footer: {
    padding: '15px 20px',
    borderTop: '1px solid rgba(45, 212, 191, 0.1)',
    textAlign: 'center',
    background: 'linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.5) 100%)'
  },
  version: {
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '5px',
    fontWeight: '500'
  },
  copyright: {
    fontSize: '10px',
    color: '#475569'
  },
  // Compact mode styles
  headerCompact: {
    display: 'flex',
    justifyContent: 'center',
    padding: '15px 0',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    borderBottom: '1px solid rgba(45, 212, 191, 0.2)'
  },
  logoCompact: {
    fontSize: '28px',
    filter: 'drop-shadow(0 0 8px rgba(45, 212, 191, 0.5))'
  },
  levelBadgeCompact: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    margin: '10px 5px',
    padding: '8px 5px',
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.15) 0%, rgba(20, 184, 166, 0.05) 100%)',
    borderRadius: '10px',
    border: '1px solid rgba(45, 212, 191, 0.3)',
    cursor: 'default',
    boxShadow: '0 4px 12px rgba(45, 212, 191, 0.1)'
  },
  levelIconCompact: {
    fontSize: '16px',
    filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))'
  },
  levelTextCompact: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#fbbf24',
    textShadow: '0 0 8px rgba(251, 191, 36, 0.4)'
  },
  menuItemCompact: {
    justifyContent: 'center',
    padding: '12px 5px',
    gap: '0'
  },
  menuItemActiveCompact: {
    background: 'linear-gradient(90deg, rgba(45, 212, 191, 0.2) 0%, rgba(45, 212, 191, 0.05) 100%)',
    color: '#2dd4bf',
    borderLeft: '3px solid #2dd4bf',
    paddingLeft: '2px',
    boxShadow: '0 4px 12px rgba(45, 212, 191, 0.15)'
  },
  menuIconCompact: {
    fontSize: '24px',
    width: 'auto',
    textAlign: 'center'
  },
  tooltip: {
    position: 'absolute',
    left: '70px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
    border: '1px solid rgba(45, 212, 191, 0.4)',
    borderRadius: '8px',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    zIndex: 1000,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(45, 212, 191, 0.1) inset',
    backdropFilter: 'blur(16px)'
  },
  tooltipText: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#f1f5f9',
    letterSpacing: '0.3px'
  },
  tooltipHotkey: {
    fontSize: '11px',
    color: '#2dd4bf',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    padding: '3px 7px',
    borderRadius: '5px',
    border: '1px solid rgba(45, 212, 191, 0.3)',
    fontWeight: '600'
  }
};
