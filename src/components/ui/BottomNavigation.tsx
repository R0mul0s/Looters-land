/**
 * Bottom Navigation Component
 *
 * Main navigation bar for switching between game screens.
 * Displays: Inventory, Heroes, Quests, Guild tabs.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-08
 */

import React from 'react';

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
    backgroundColor: '#1a1a1a',
    borderTop: '2px solid #333',
    padding: '10px 0',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.5)'
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '10px',
    transition: 'all 0.2s',
    color: '#888'
  },
  tabActive: {
    color: '#4CAF50'
  },
  tabIcon: {
    fontSize: '24px',
    position: 'relative'
  },
  badge: {
    position: 'absolute',
    top: '-5px',
    right: '-10px',
    backgroundColor: '#f44336',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 'bold',
    padding: '2px 5px',
    borderRadius: '10px',
    minWidth: '16px',
    textAlign: 'center'
  },
  tabLabel: {
    fontSize: '12px',
    color: '#888'
  },
  tabLabelActive: {
    color: '#4CAF50',
    fontWeight: 'bold'
  }
};
