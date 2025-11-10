/**
 * Leaderboard Screen Component
 *
 * Displays daily competitive leaderboards across 4 categories.
 * Shows top 100 players and user's current rank with real-time updates.
 * Includes daily reset timer and category-based filtering.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-10
 */

import React, { useState, useEffect } from 'react';
import {
  LeaderboardService,
  type LeaderboardCategory,
  type LeaderboardEntry
} from '../services/LeaderboardService';
import { DailyResetService } from '../services/DailyResetService';
import { t } from '../localization/i18n';

/**
 * Props for LeaderboardScreen component
 */
interface LeaderboardScreenProps {
  /** User ID for fetching player rank */
  userId: string;
  /** Player's display name */
  playerName: string;
  /** Player's current level */
  playerLevel: number;
}

const CATEGORY_CONFIG: Record<
  LeaderboardCategory,
  { icon: string; labelKey: string; descriptionKey: string }
> = {
  deepest_floor: {
    icon: '🕳️',
    labelKey: 'leaderboard.categories.deepestFloor',
    descriptionKey: 'leaderboard.descriptions.deepestFloor'
  },
  total_gold: {
    icon: '💰',
    labelKey: 'leaderboard.categories.totalGold',
    descriptionKey: 'leaderboard.descriptions.totalGold'
  },
  heroes_collected: {
    icon: '👥',
    labelKey: 'leaderboard.categories.heroesCollected',
    descriptionKey: 'leaderboard.descriptions.heroesCollected'
  },
  combat_power: {
    icon: '⚔️',
    labelKey: 'leaderboard.categories.combatPower',
    descriptionKey: 'leaderboard.descriptions.combatPower'
  }
};

/**
 * Leaderboard Screen Component
 *
 * Displays daily leaderboards with filtering by category,
 * player rank display, and countdown to daily reset.
 *
 * @param props - Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * <LeaderboardScreen
 *   userId="user123"
 *   playerName="Hero123"
 *   playerLevel={50}
 * />
 * ```
 */
export function LeaderboardScreen({
  userId,
  playerName,
  playerLevel
}: LeaderboardScreenProps) {
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('deepest_floor');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerEntry, setPlayerEntry] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeUntilReset, setTimeUntilReset] = useState('');

  // Load leaderboard data
  useEffect(() => {
    loadLeaderboard();
  }, [activeCategory, userId]);

  // Update countdown timer
  useEffect(() => {
    const updateTimer = () => {
      setTimeUntilReset(DailyResetService.getTimeUntilResetFormatted());
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  /**
   * Load leaderboard data for current category
   *
   * Fetches top 100 players and player's rank from LeaderboardService.
   */
  const loadLeaderboard = async (): Promise<void> => {
    setLoading(true);

    try {
      // Load top 100 players
      const leaderboardResult = await LeaderboardService.getLeaderboard(activeCategory, undefined, 100);

      if (leaderboardResult.success && leaderboardResult.data) {
        setLeaderboard(leaderboardResult.data);
      }

      // Load player's rank
      const playerRankResult = await LeaderboardService.getPlayerRank(userId, activeCategory);

      if (playerRankResult.success && playerRankResult.data) {
        setPlayerEntry(playerRankResult.data);
      } else {
        setPlayerEntry(null);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get rank badge emoji for top 3, or rank number for others
   *
   * @param rank - Player's rank (1-based)
   * @returns Medal emoji for top 3, or #rank for others
   */
  const getRankBadge = (rank: number | null): string => {
    if (!rank) return '';
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  /**
   * Format score based on category (adds 'g' suffix for gold)
   *
   * @param score - Score value to format
   * @param category - Leaderboard category
   * @returns Formatted score string
   */
  const formatScore = (score: number, category: LeaderboardCategory): string => {
    if (category === 'total_gold') {
      return `${score.toLocaleString()}g`;
    }
    return score.toLocaleString();
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🏆 {t('leaderboard.title')}</h1>
        <div style={styles.resetTimer}>
          <span style={styles.resetIcon}>{t('leaderboard.resetIcon')}</span>
          <span style={styles.resetText}>{t('leaderboard.resetLabel')} {timeUntilReset}</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={styles.categoryTabs}>
        {Object.entries(CATEGORY_CONFIG).map(([category, config]) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category as LeaderboardCategory)}
            style={{
              ...styles.categoryTab,
              ...(activeCategory === category ? styles.categoryTabActive : {})
            }}
          >
            <span style={styles.categoryIcon}>{config.icon}</span>
            <span style={styles.categoryLabel}>{t(config.labelKey)}</span>
          </button>
        ))}
      </div>

      {/* Category Description */}
      <div style={styles.categoryDescription}>
        {t(CATEGORY_CONFIG[activeCategory].descriptionKey)}
      </div>

      {/* Player's Rank Card */}
      {playerEntry && (
        <div style={styles.playerRankCard}>
          <div style={styles.playerRankBadge}>
            {getRankBadge(playerEntry.rank)}
          </div>
          <div style={styles.playerRankInfo}>
            <div style={styles.playerRankName}>{playerName}</div>
            <div style={styles.playerRankLevel}>{t('leaderboard.levelLabel')} {playerLevel}</div>
          </div>
          <div style={styles.playerRankScore}>
            {formatScore(playerEntry.score, activeCategory)}
          </div>
        </div>
      )}

      {!playerEntry && !loading && (
        <div style={styles.noRankCard}>
          <div style={styles.noRankIcon}>📊</div>
          <div style={styles.noRankText}>
            {t('leaderboard.noRank.message')}
          </div>
          <div style={styles.noRankHint}>
            {t('leaderboard.noRank.hint')}
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div style={styles.leaderboardContainer}>
        {loading ? (
          <div style={styles.loading}>
            <div style={styles.loadingIcon}>⏳</div>
            <div style={styles.loadingText}>{t('leaderboard.loading')}</div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📋</div>
            <div style={styles.emptyText}>{t('leaderboard.empty.message')}</div>
            <div style={styles.emptyHint}>{t('leaderboard.empty.hint')}</div>
          </div>
        ) : (
          <div style={styles.leaderboardList}>
            {leaderboard.map((entry, index) => {
              const isPlayer = entry.user_id === userId;
              const rank = index + 1; // Use index as rank if rank is not set

              return (
                <div
                  key={entry.id}
                  style={{
                    ...styles.leaderboardEntry,
                    ...(isPlayer ? styles.leaderboardEntryPlayer : {})
                  }}
                >
                  <div style={styles.entryRank}>
                    {getRankBadge(entry.rank || rank)}
                  </div>
                  <div style={styles.entryInfo}>
                    <div style={styles.entryName}>
                      {entry.player_name || t('leaderboard.anonymous')}
                      {isPlayer && <span style={styles.youBadge}>{t('leaderboard.youBadge')}</span>}
                    </div>
                    <div style={styles.entryLevel}>{t('leaderboard.levelLabel')} {entry.player_level || 1}</div>
                  </div>
                  <div style={styles.entryScore}>
                    {formatScore(entry.score, activeCategory)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #0a0f1e 0%, #1a1f2e 100%)',
    overflow: 'auto',
    padding: '20px',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  resetTimer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'rgba(45, 212, 191, 0.1)',
    border: '1px solid rgba(45, 212, 191, 0.3)',
    borderRadius: '8px'
  },
  resetIcon: {
    fontSize: '18px'
  },
  resetText: {
    color: '#2dd4bf',
    fontSize: '14px',
    fontWeight: '600'
  },
  categoryTabs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginBottom: '16px'
  },
  categoryTab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '16px',
    background: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid rgba(45, 212, 191, 0.2)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: '#94a3b8'
  },
  categoryTabActive: {
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.2) 0%, rgba(20, 184, 166, 0.1) 100%)',
    border: '2px solid #2dd4bf',
    color: '#2dd4bf',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 20px rgba(45, 212, 191, 0.3)'
  },
  categoryIcon: {
    fontSize: '28px'
  },
  categoryLabel: {
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'center'
  },
  categoryDescription: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: '14px',
    marginBottom: '20px',
    padding: '12px',
    background: 'rgba(15, 23, 42, 0.4)',
    borderRadius: '8px'
  },
  playerRankCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.15) 0%, rgba(20, 184, 166, 0.05) 100%)',
    border: '2px solid #2dd4bf',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 8px 24px rgba(45, 212, 191, 0.2)'
  },
  playerRankBadge: {
    fontSize: '32px',
    fontWeight: '700',
    minWidth: '60px',
    textAlign: 'center',
    color: '#ffd700'
  },
  playerRankInfo: {
    flex: 1
  },
  playerRankName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: '4px'
  },
  playerRankLevel: {
    fontSize: '14px',
    color: '#94a3b8'
  },
  playerRankScore: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#2dd4bf'
  },
  noRankCard: {
    textAlign: 'center',
    padding: '32px',
    background: 'rgba(30, 41, 59, 0.4)',
    border: '1px dashed rgba(100, 116, 139, 0.3)',
    borderRadius: '12px',
    marginBottom: '20px'
  },
  noRankIcon: {
    fontSize: '48px',
    marginBottom: '12px'
  },
  noRankText: {
    color: '#cbd5e1',
    fontSize: '16px',
    marginBottom: '8px'
  },
  noRankHint: {
    color: '#64748b',
    fontSize: '14px'
  },
  leaderboardContainer: {
    background: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '12px',
    border: '1px solid rgba(45, 212, 191, 0.2)',
    overflow: 'hidden'
  },
  loading: {
    textAlign: 'center',
    padding: '48px',
    color: '#64748b'
  },
  loadingIcon: {
    fontSize: '48px',
    marginBottom: '12px',
    animation: 'spin 2s linear infinite'
  },
  loadingText: {
    fontSize: '16px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px',
    color: '#64748b'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
    opacity: 0.5
  },
  emptyText: {
    fontSize: '18px',
    color: '#cbd5e1',
    marginBottom: '8px'
  },
  emptyHint: {
    fontSize: '14px'
  },
  leaderboardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  leaderboardEntry: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    background: 'rgba(30, 41, 59, 0.4)',
    transition: 'all 0.2s'
  },
  leaderboardEntryPlayer: {
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.2) 0%, rgba(20, 184, 166, 0.1) 100%)',
    borderLeft: '4px solid #2dd4bf'
  },
  entryRank: {
    fontSize: '20px',
    fontWeight: '700',
    minWidth: '50px',
    textAlign: 'center',
    color: '#ffd700'
  },
  entryInfo: {
    flex: 1
  },
  entryName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  youBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 6px',
    background: '#2dd4bf',
    color: '#0f172a',
    borderRadius: '4px'
  },
  entryLevel: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  entryScore: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2dd4bf',
    minWidth: '100px',
    textAlign: 'right'
  }
};
