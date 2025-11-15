/**
 * Bottom Navigation Component
 *
 * Main navigation bar for switching between game screens.
 * Displays: Inventory, Heroes, Quests, Guild tabs.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React from 'react';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS } from '../../styles/tokens';
import { flexColumn, flexCenter } from '../../styles/common';

type NavigationTab = 'inventory' | 'heroes' | 'quests' | 'guild';

interface BottomNavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  unreadQuests?: number;
  unreadGuild?: number;
}

/**
 * Bottom Navigation Component
 *
 * @param props - Component props
 * @returns React component
 */
export function BottomNavigation({
  activeTab,
  onTabChange,
  unreadQuests = 0,
  unreadGuild = 0
}: BottomNavigationProps) {
  const tabs = [
    { id: 'inventory' as NavigationTab, icon: '🎒', label: 'Inventory', badge: 0 },
    { id: 'heroes' as NavigationTab, icon: '🦸', label: 'Heroes', badge: 0 },
    { id: 'quests' as NavigationTab, icon: '📜', label: 'Quests', badge: unreadQuests },
    { id: 'guild' as NavigationTab, icon: '👥', label: 'Guild', badge: unreadGuild }
  ];

  return (
    <div style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              ...styles.tab,
              ...(isActive ? styles.tabActive : {})
            }}
          >
            <div style={styles.tabIcon}>
              {tab.icon}
              {tab.badge > 0 && (
                <div style={styles.badge}>{tab.badge > 99 ? '99+' : tab.badge}</div>
              )}
            </div>
            <div
              style={{
                ...styles.tabLabel,
                ...(isActive ? styles.tabLabelActive : {})
              }}
            >
              {tab.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    backgroundColor: COLORS.bgCardDark,
    borderTop: `2px solid ${COLORS.borderDark}`,
    padding: `${SPACING.sm} 0`,
    boxShadow: SHADOWS.md
  },
  tab: {
    flex: 1,
    ...flexColumn,
    ...flexCenter,
    gap: SPACING.xs,
    backgroundColor: COLORS.transparent,
    border: 'none',
    cursor: 'pointer',
    padding: SPACING.sm,
    transition: TRANSITIONS.fast,
    color: COLORS.textSecondary
  },
  tabActive: {
    color: COLORS.successLight
  },
  tabIcon: {
    fontSize: FONT_SIZE['2xl'],
    position: 'relative'
  },
  badge: {
    position: 'absolute',
    top: '-5px',
    right: '-10px',
    backgroundColor: COLORS.danger,
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    padding: `${SPACING.xxs} ${SPACING.xs}`,
    borderRadius: SPACING.sm,
    minWidth: '16px',
    textAlign: 'center'
  },
  tabLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary
  },
  tabLabelActive: {
    color: COLORS.successLight,
    fontWeight: FONT_WEIGHT.bold
  }
};
