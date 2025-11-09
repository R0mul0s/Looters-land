/**
 * Game Layout Component
 *
 * Main game layout structure with header, content area, and bottom navigation.
 * This is the primary UI shell for the v2.0 game loop.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-08
 */

import React, { useState } from 'react';
import { GameHeader } from './ui/GameHeader';
import { MainSidebar } from './ui/MainSidebar';
import { ComingSoon } from './ui/ComingSoon';
import { ProfileScreen } from './ProfileScreen';

type GameScreen = 'worldmap' | 'town' | 'dungeon' | 'inventory' | 'heroes' | 'quests' | 'guild' | 'leaderboards' | 'teleport';

interface GameLayoutProps {
  playerName: string;
  playerEmail?: string;
  userId?: string; // For leaderboards
  gold: number;
  gems: number;
  energy: number;
  maxEnergy: number;
  energyRegenRate?: number; // Energy per hour (default: 10)
  playerLevel?: number;
  heroCount?: number; // For profile screen
  itemCount?: number; // For profile screen
  // Screen components
  worldmapScreen?: React.ReactNode;
  heroesScreen?: React.ReactNode;
  inventoryScreen?: React.ReactNode;
  teleportScreen?: React.ReactNode;
  questsScreen?: React.ReactNode;
  guildScreen?: React.ReactNode;
  leaderboardsScreen?: React.ReactNode;
}

/**
 * Game Layout Component
 *
 * @param props - Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * <GameLayout
 *   playerName="Adventurer"
 *   gold={12345}
 *   gems={567}
 *   energy={85}
 *   maxEnergy={100}
 * >
 *   <WorldMapViewer ... />
 * </GameLayout>
 * ```
 */
export function GameLayout({
  playerName,
  playerEmail,
  userId,
  gold,
  gems,
  energy,
  maxEnergy,
  energyRegenRate = 10, // Default: 10 energy per hour
  playerLevel = 1,
  heroCount = 0,
  itemCount = 0,
  worldmapScreen,
  heroesScreen,
  inventoryScreen,
  teleportScreen,
  questsScreen,
  guildScreen,
  leaderboardsScreen
}: GameLayoutProps) {
  const [activeScreen, setActiveScreen] = useState<GameScreen>('worldmap');
  const [showSettings, setShowSettings] = useState(false);

  const handleScreenChange = (screen: GameScreen) => {
    setActiveScreen(screen);
    console.log('Switched to screen:', screen);
  };

  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
  };

  // Render active screen content
  const renderScreen = () => {
    switch (activeScreen) {
      case 'worldmap':
        return worldmapScreen || <ComingSoon title="World Map" icon="🗺️" />;
      case 'heroes':
        return heroesScreen || <ComingSoon title="Heroes" icon="🦸" description="Manage your hero collection and party composition." />;
      case 'inventory':
        return inventoryScreen || <ComingSoon title="Inventory" icon="🎒" description="View and manage your items and equipment." />;
      case 'teleport':
        return teleportScreen || <ComingSoon title="Teleport" icon="🌍" description="Fast travel to discovered locations for 40 energy." />;
      case 'leaderboards':
        return leaderboardsScreen || <ComingSoon title="Leaderboards" icon="🏆" description="Compete for daily rankings across 4 categories." />;
      case 'quests':
        return questsScreen || <ComingSoon title="Quests" icon="📜" description="Track your active quests and story progress." />;
      case 'guild':
        return guildScreen || <ComingSoon title="Guild" icon="👥" description="Join a guild and participate in guild activities." />;
      default:
        return <ComingSoon title="Unknown Screen" icon="❓" />;
    }
  };

  return (
    <div style={styles.container}>
      {/* Fixed Left Sidebar */}
      <MainSidebar
        activeScreen={activeScreen}
        onScreenChange={handleScreenChange}
        playerLevel={playerLevel}
      />

      {/* Right Content Area (scrollable) */}
      <div style={styles.rightColumn}>
        {/* Header */}
        <GameHeader
          playerName={playerName}
          gold={gold}
          gems={gems}
          energy={energy}
          maxEnergy={maxEnergy}
          energyRegenRate={energyRegenRate}
          onSettingsClick={handleSettingsClick}
        />

        {/* Main Content Area */}
        <div style={styles.content}>
          {renderScreen()}
        </div>
      </div>

      {/* Profile/Settings Modal */}
      {showSettings && (
        <div style={styles.modal} onClick={() => setShowSettings(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <ProfileScreen
              playerName={playerName}
              playerEmail={playerEmail}
              playerLevel={playerLevel}
              gold={gold}
              gems={gems}
              heroCount={heroCount}
              itemCount={itemCount}
              onClose={() => setShowSettings(false)}
              onResetProgress={() => window.location.reload()}
              onAccountDeleted={() => window.location.href = '/'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    height: '100vh',
    width: '100%',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    color: '#f1f5f9',
    overflow: 'hidden',
    boxSizing: 'border-box'
  },
  rightColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    boxSizing: 'border-box'
  },
  content: {
    flex: 1,
    overflow: 'auto',
    position: 'relative',
    background: '#0a0f1e'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease-out'
  },
  modalContent: {
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    borderRadius: '16px',
    border: '1px solid rgba(45, 212, 191, 0.3)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(45, 212, 191, 0.1) inset',
    width: '500px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderBottom: '1px solid rgba(45, 212, 191, 0.2)',
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)'
  },
  modalTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  closeButton: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
  },
  settingsContent: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1
  },
  settingSection: {
    marginBottom: '28px',
    paddingBottom: '24px',
    borderBottom: '1px solid rgba(45, 212, 191, 0.1)'
  },
  settingLabel: {
    display: 'block',
    fontSize: '16px',
    fontWeight: '600',
    color: '#2dd4bf',
    marginBottom: '12px',
    letterSpacing: '0.3px'
  },
  settingValue: {
    padding: '12px 16px',
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%)',
    border: '1px solid rgba(45, 212, 191, 0.2)',
    borderRadius: '8px',
    color: '#94a3b8',
    fontSize: '14px',
    marginBottom: '8px',
    fontFamily: 'monospace'
  },
  settingInput: {
    width: '100%',
    padding: '12px 16px',
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%)',
    border: '1px solid rgba(45, 212, 191, 0.2)',
    borderRadius: '8px',
    color: '#f1f5f9',
    fontSize: '14px',
    marginBottom: '12px',
    boxSizing: 'border-box',
    transition: 'all 0.2s',
    outline: 'none'
  },
  settingHint: {
    fontSize: '12px',
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: '8px'
  },
  settingButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
    color: '#0f172a',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(45, 212, 191, 0.3)',
    marginTop: '8px'
  },
  logoutButton: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
  }
};
