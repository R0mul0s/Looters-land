/**
 * Leaderboard Screen Component
 *
 * Displays daily competitive leaderboards across 4 categories.
 * Shows top 100 players and user's current rank with real-time updates.
 * Includes daily reset timer and category-based filtering.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React, { useState, useEffect } from 'react';
import {
  LeaderboardService,
  type LeaderboardCategory,
  type LeaderboardEntry
} from '../services/LeaderboardService';
import { DailyResetService } from '../services/DailyResetService';
import { t } from '../localization/i18n';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS } from '../styles/tokens';
import { flexColumn, flexBetween } from '../styles/common';

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
    descriptionKey: 'leaderboard.categoryDescriptions.deepestFloor'
  },
  total_gold: {
    icon: '💰',
    labelKey: 'leaderboard.categories.totalGold',
    descriptionKey: 'leaderboard.categoryDescriptions.totalGold'
  },
  heroes_collected: {
    icon: '👥',
    labelKey: 'leaderboard.categories.heroesCollected',
    descriptionKey: 'leaderboard.categoryDescriptions.heroesCollected'
  },
  combat_power: {
    icon: '⚔️',
    labelKey: 'leaderboard.categories.combatPower',
    descriptionKey: 'leaderboard.categoryDescriptions.combatPower'
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
  playerLevel: _playerLevel // eslint-disable-line @typescript-eslint/no-unused-vars
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
            <div style={styles.playerRankLevel}>
              🏆 {playerEntry.combat_power.toLocaleString()}
              {activeCategory === 'deepest_floor' && playerEntry.dungeon_name && (
                <span style={{ marginLeft: '8px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  • {playerEntry.dungeon_name}
                </span>
              )}
            </div>
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
                    <div style={styles.entryLevel}>
                      🏆 {entry.combat_power.toLocaleString()}
                      {activeCategory === 'deepest_floor' && entry.dungeon_name && (
                        <span style={{ marginLeft: '8px', color: COLORS.textMuted }}>
                          • {entry.dungeon_name}
                        </span>
                      )}
                    </div>
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
    background: `linear-gradient(135deg, ${COLORS.bgDarkSolid} 0%, #1a1f2e 100%)`,
    overflow: 'auto',
    padding: SPACING.lg,
    boxSizing: 'border-box'
  },
  header: {
    ...flexBetween,
    marginBottom: SPACING[6],
    flexWrap: 'wrap',
    gap: SPACING[3]
  },
  title: {
    margin: 0,
    fontSize: FONT_SIZE['4xl'],
    fontWeight: FONT_WEIGHT.bold,
    background: `linear-gradient(135deg, ${COLORS.goldLight} 0%, #ffed4e 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  resetTimer: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[2],
    padding: `${SPACING[2]} ${SPACING[4]}`,
    background: 'rgba(45, 212, 191, 0.1)',
    border: `1px solid rgba(45, 212, 191, 0.3)`,
    borderRadius: BORDER_RADIUS.md
  },
  resetIcon: {
    fontSize: FONT_SIZE.lg
  },
  resetText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold
  },
  categoryTabs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: SPACING[3],
    marginBottom: SPACING[4]
  },
  categoryTab: {
    ...flexColumn,
    alignItems: 'center',
    gap: SPACING[2],
    padding: SPACING[4],
    background: 'rgba(30, 41, 59, 0.6)',
    border: `1px solid rgba(45, 212, 191, 0.2)`,
    borderRadius: BORDER_RADIUS.lg,
    cursor: 'pointer',
    transition: TRANSITIONS.base,
    color: COLORS.textSecondary
  },
  categoryTabActive: {
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.2) 0%, rgba(20, 184, 166, 0.1) 100%)',
    border: `2px solid ${COLORS.primary}`,
    color: COLORS.primary,
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 20px rgba(45, 212, 191, 0.3)'
  },
  categoryIcon: {
    fontSize: FONT_SIZE['3xl']
  },
  categoryLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    textAlign: 'center'
  },
  categoryDescription: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.lg,
    padding: SPACING[3],
    background: 'rgba(15, 23, 42, 0.4)',
    borderRadius: BORDER_RADIUS.md
  },
  playerRankCard: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[4],
    padding: SPACING.lg,
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.15) 0%, rgba(20, 184, 166, 0.05) 100%)',
    border: `2px solid ${COLORS.primary}`,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    boxShadow: '0 8px 24px rgba(45, 212, 191, 0.2)'
  },
  playerRankBadge: {
    fontSize: FONT_SIZE['4xl'],
    fontWeight: FONT_WEIGHT.bold,
    minWidth: '60px',
    textAlign: 'center',
    color: COLORS.goldLight
  },
  playerRankInfo: {
    flex: 1
  },
  playerRankName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textLight,
    marginBottom: SPACING[1]
  },
  playerRankLevel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary
  },
  playerRankScore: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary
  },
  noRankCard: {
    textAlign: 'center',
    padding: SPACING[8],
    background: 'rgba(30, 41, 59, 0.4)',
    border: `1px dashed rgba(100, 116, 139, 0.3)`,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg
  },
  noRankIcon: {
    fontSize: FONT_SIZE['6xl'],
    marginBottom: SPACING[3]
  },
  noRankText: {
    color: COLORS.textGray,
    fontSize: FONT_SIZE.base,
    marginBottom: SPACING[2]
  },
  noRankHint: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.md
  },
  leaderboardContainer: {
    background: 'rgba(15, 23, 42, 0.6)',
    borderRadius: BORDER_RADIUS.lg,
    border: `1px solid rgba(45, 212, 191, 0.2)`,
    overflow: 'hidden'
  },
  loading: {
    textAlign: 'center',
    padding: SPACING[12],
    color: COLORS.textMuted
  },
  loadingIcon: {
    fontSize: FONT_SIZE['6xl'],
    marginBottom: SPACING[3],
    animation: 'spin 2s linear infinite'
  },
  loadingText: {
    fontSize: FONT_SIZE.base
  },
  emptyState: {
    textAlign: 'center',
    padding: SPACING[12],
    color: COLORS.textMuted
  },
  emptyIcon: {
    fontSize: FONT_SIZE['8xl'],
    marginBottom: SPACING[4],
    opacity: 0.5
  },
  emptyText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textGray,
    marginBottom: SPACING[2]
  },
  emptyHint: {
    fontSize: FONT_SIZE.md
  },
  leaderboardList: {
    ...flexColumn,
    gap: SPACING[0.5]
  },
  leaderboardEntry: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[4],
    padding: `${SPACING[4]} ${SPACING.lg}`,
    background: 'rgba(30, 41, 59, 0.4)',
    transition: TRANSITIONS.base
  },
  leaderboardEntryPlayer: {
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.2) 0%, rgba(20, 184, 166, 0.1) 100%)',
    borderLeft: `4px solid ${COLORS.primary}`
  },
  entryRank: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    minWidth: '50px',
    textAlign: 'center',
    color: COLORS.goldLight
  },
  entryInfo: {
    flex: 1
  },
  entryName: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textLight,
    marginBottom: SPACING[1],
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[2]
  },
  youBadge: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    padding: `${SPACING[0.5]} ${SPACING[1.5]}`,
    background: COLORS.primary,
    color: COLORS.bgDarkAlt,
    borderRadius: BORDER_RADIUS.sm
  },
  entryLevel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary
  },
  entryScore: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
    minWidth: '100px',
    textAlign: 'right'
  }
};
