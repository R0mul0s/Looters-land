/**
 * Game Layout Component
 *
 * Main game layout structure with header, content area, and bottom navigation.
 * This is the primary UI shell for the v2.0 game loop.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React, { useState } from 'react';
import { GameHeader } from './ui/GameHeader';
import { MainSidebar } from './ui/MainSidebar';
import { ComingSoon } from './ui/ComingSoon';
import { ProfileScreen } from './ProfileScreen';
import { LastUpdates } from './ui/LastUpdates';
import type { SyncStatus } from './SyncStatusIndicator';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZE, FONT_WEIGHT, BLUR, Z_INDEX, WIDTHS } from '../styles/tokens';
import { flexCenter, flexColumn } from '../styles/common';

type GameScreen = 'worldmap' | 'town' | 'dungeon' | 'inventory' | 'heroes' | 'quests' | 'guild' | 'leaderboards' | 'teleport' | 'updates';

interface GameLayoutProps {
  playerName: string;
  playerEmail?: string;
  userId?: string; // For leaderboards
  playerAvatar?: string; // Avatar image filename (e.g., 'hero1.png', 'hero2.png')
  gold: number;
  gems: number;
  energy: number;
  maxEnergy: number;
  energyRegenRate?: number; // Energy per hour (default: 10)
  playerLevel?: number;
  combatPower?: number; // Total party score
  heroCount?: number; // For profile screen
  itemCount?: number; // For profile screen
  syncStatus?: SyncStatus; // Database sync status
  lastSaveTime?: Date | null; // Last successful save time
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
  playerAvatar = 'hero1.png',
  gold,
  gems,
  energy,
  maxEnergy,
  energyRegenRate = 10, // Default: 10 energy per hour
  playerLevel = 1,
  combatPower = 0,
  heroCount = 0,
  itemCount = 0,
  syncStatus,
  lastSaveTime,
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
      case 'updates':
        return <LastUpdates />;
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
        combatPower={combatPower}
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
          syncStatus={syncStatus}
          lastSaveTime={lastSaveTime}
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
              playerAvatar={playerAvatar}
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
    background: `linear-gradient(135deg, ${COLORS.bgDarkAlt} 0%, ${COLORS.bgSurface} 50%, ${COLORS.bgDarkAlt} 100%)`,
    color: COLORS.textLight,
    overflow: 'hidden',
    boxSizing: 'border-box'
  },
  rightColumn: {
    flex: 1,
    ...flexColumn,
    height: '100vh',
    overflow: 'hidden',
    boxSizing: 'border-box'
  },
  content: {
    flex: 1,
    overflow: 'auto',
    position: 'relative',
    background: COLORS.bgDarkSolid
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.bgOverlayDark,
    backdropFilter: BLUR.md,
    ...flexCenter,
    zIndex: Z_INDEX.modal,
    animation: 'fadeIn 0.2s ease-out'
  },
  modalContent: {
    background: `linear-gradient(135deg, ${COLORS.bgSurface} 0%, ${COLORS.bgDarkAlt} 100%)`,
    borderRadius: BORDER_RADIUS.xl,
    border: `1px solid rgba(45, 212, 191, 0.3)`,
    boxShadow: `${SHADOWS['2xl']}, 0 0 0 1px rgba(45, 212, 191, 0.1) inset`,
    width: WIDTHS.modal,
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'hidden',
    ...flexColumn
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING[6],
    borderBottom: `1px solid rgba(45, 212, 191, 0.2)`,
    background: `linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)`
  },
  modalTitle: {
    margin: 0,
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  closeButton: {
    width: '36px',
    height: '36px',
    borderRadius: BORDER_RADIUS.round,
    border: 'none',
    background: `linear-gradient(135deg, ${COLORS.danger} 0%, ${COLORS.dangerDark} 100%)`,
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    cursor: 'pointer',
    ...flexCenter,
    transition: 'all 0.2s',
    boxShadow: SHADOWS.glowRed
  },
  settingsContent: {
    padding: SPACING[6],
    overflowY: 'auto',
    flex: 1
  },
  settingSection: {
    marginBottom: '28px',
    paddingBottom: SPACING[6],
    borderBottom: '1px solid rgba(45, 212, 191, 0.1)'
  },
  settingLabel: {
    display: 'block',
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
    marginBottom: SPACING[3],
    letterSpacing: '0.3px'
  },
  settingValue: {
    padding: `${SPACING[3]} ${SPACING[4]}`,
    background: `linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%)`,
    border: `1px solid rgba(45, 212, 191, 0.2)`,
    borderRadius: BORDER_RADIUS.md,
    color: COLORS.textGray,
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING[2],
    fontFamily: 'monospace'
  },
  settingInput: {
    width: '100%',
    padding: `${SPACING[3]} ${SPACING[4]}`,
    background: `linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%)`,
    border: `1px solid rgba(45, 212, 191, 0.2)`,
    borderRadius: BORDER_RADIUS.md,
    color: COLORS.textLight,
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING[3],
    boxSizing: 'border-box',
    transition: 'all 0.2s',
    outline: 'none'
  },
  settingHint: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textDarkGray,
    fontStyle: 'italic',
    marginTop: SPACING[2]
  },
  settingButton: {
    padding: `${SPACING[3]} ${SPACING[6]}`,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    color: COLORS.bgDarkAlt,
    border: 'none',
    borderRadius: BORDER_RADIUS.md,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: SHADOWS.glowTeal,
    marginTop: SPACING[2]
  },
  logoutButton: {
    width: '100%',
    padding: SPACING.md,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    background: `linear-gradient(135deg, ${COLORS.danger} 0%, ${COLORS.dangerDark} 100%)`,
    color: COLORS.white,
    border: 'none',
    borderRadius: BORDER_RADIUS.md,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: SHADOWS.glowRed
  }
};
