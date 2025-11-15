/**
 * Last Updates Component
 *
 * Displays recent game updates and changelog from GitHub commits.
 * Automatically fetches commit messages from GitHub API.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React, { memo, useState, useEffect } from 'react';
import { t } from '../../localization/i18n';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS } from '../../styles/tokens';
import { flexBetween, flexColumn, flexCenter } from '../../styles/common';
import {
  fetchGitHubCommits,
  parseCommits,
  groupCommitsByDate,
  groupCommitsByType,
  getCommitTypeEmoji,
  getCommitTypeLabel,
  type ParsedCommit
} from '../../services/GitHubService';

interface DayCommits {
  date: string;
  commits: ParsedCommit[];
  commitsByType: Map<string, ParsedCommit[]>;
}

interface LastUpdatesProps {
  onClose?: () => void;
}

/**
 * Last Updates component
 *
 * @param props - Component props
 * @returns React component displaying changelog from GitHub
 *
 * @example
 * ```tsx
 * <LastUpdates onClose={() => console.log('closed')} />
 * ```
 */
export const LastUpdates = memo(function LastUpdates({ onClose }: LastUpdatesProps) {
  const [dayCommits, setDayCommits] = useState<DayCommits[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCommits() {
      try {
        setLoading(true);
        setError(null);

        // Fetch last 50 commits
        const commits = await fetchGitHubCommits(1, 50);
        const parsed = parseCommits(commits);

        // Group by date
        const byDate = groupCommitsByDate(parsed);

        // Convert to array and sort by date (newest first)
        const days: DayCommits[] = Array.from(byDate.entries())
          .map(([date, commits]) => ({
            date,
            commits,
            commitsByType: groupCommitsByType(commits)
          }))
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 14); // Show last 14 days

        setDayCommits(days);
      } catch (err) {
        console.error('Failed to load GitHub commits:', err);
        setError(err instanceof Error ? err.message : 'Failed to load commits');
      } finally {
        setLoading(false);
      }
    }

    loadCommits();
  }, []);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>📋 {t('updates.title')}</h2>
        {onClose && (
          <button style={styles.closeButton} onClick={onClose}>✕</button>
        )}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {loading && (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}>⏳</div>
            <div style={styles.loadingText}>Loading commits from GitHub...</div>
          </div>
        )}

        {error && (
          <div style={styles.errorContainer}>
            <div style={styles.errorIcon}>⚠️</div>
            <div style={styles.errorText}>Failed to load commits</div>
            <div style={styles.errorDetail}>{error}</div>
          </div>
        )}

        {!loading && !error && dayCommits.length === 0 && (
          <div style={styles.emptyContainer}>
            <div style={styles.emptyIcon}>📭</div>
            <div style={styles.emptyText}>No commits found</div>
          </div>
        )}

        {!loading && !error && dayCommits.map((day, dayIndex) => (
          <div key={day.date} style={styles.dayBlock}>
            {/* Date Header */}
            <div style={styles.dateHeader}>
              <div style={styles.dateBadge}>
                📅 {formatDate(day.date)}
              </div>
              <div style={styles.commitCount}>
                {day.commits.length} commit{day.commits.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Commits grouped by type */}
            {Array.from(day.commitsByType.entries()).map(([type, commits]) => (
              <div key={type} style={styles.typeSection}>
                <div style={styles.typeHeader}>
                  {getCommitTypeEmoji(type)} {getCommitTypeLabel(type)}
                  <span style={styles.typeCount}>({commits.length})</span>
                </div>

                <ul style={styles.commitList}>
                  {commits.map((commit, index) => (
                    <li
                      key={commit.sha}
                      style={{
                        ...styles.commitItem,
                        background: index % 2 === 0
                          ? `linear-gradient(135deg, ${COLORS.bgSurfaceLight} 0%, ${COLORS.bgSurface} 100%)`
                          : 'rgba(15, 23, 42, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.borderColor = 'rgba(45, 212, 191, 0.5)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(45, 212, 191, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.borderColor = COLORS.bgSurfaceLighter;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <a
                        href={commit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.commitLink}
                      >
                        <div>
                          <span style={styles.commitSha}>{commit.sha}</span>
                        </div>
                        <div style={styles.commitMessage}>
                          {commit.scope && (
                            <span style={styles.commitScope}>({commit.scope})</span>
                          )}{commit.scope && ' '}
                          {commit.message}
                        </div>
                      </a>
                      {commit.body && (
                        <div style={styles.commitBody}>
                          {commit.body.split('\n').map((line, i) => (
                            <div key={i} style={{ marginBottom: line.trim() ? SPACING[1] : SPACING[2] }}>
                              {line.trim() || '\u00A0'}
                            </div>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Divider */}
            {dayIndex < dayCommits.length - 1 && <div style={styles.divider} />}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.footerText}>
          View full history on{' '}
          <a
            href="https://github.com/R0mul0s/Looters-land/commits"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
});

/**
 * Format date string to human-readable format
 *
 * @param dateStr - ISO date string (YYYY-MM-DD)
 * @returns Formatted date string
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time to midnight for comparison
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return 'Today';
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return 'Yesterday';
  } else {
    // Format as "Nov 15, 2025"
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    ...flexColumn,
    width: '100%',
    height: '100%',
    background: `linear-gradient(135deg, ${COLORS.bgSurface} 0%, ${COLORS.bgDarkAlt} 100%)`,
    color: COLORS.textLight,
    overflow: 'hidden'
  },
  header: {
    ...flexBetween,
    padding: SPACING[5],
    borderBottom: `2px solid ${COLORS.primary}`,
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, transparent 100%)'
  },
  title: {
    margin: 0,
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold
  },
  closeButton: {
    background: COLORS.transparent,
    border: `2px solid ${COLORS.bgSurfaceLight}`,
    color: COLORS.textGray,
    fontSize: FONT_SIZE['2xl'],
    cursor: 'pointer',
    padding: `${SPACING[2]} ${SPACING[4]}`,
    borderRadius: BORDER_RADIUS.md,
    transition: TRANSITIONS.allBase
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: SPACING[5]
  },
  loadingContainer: {
    ...flexCenter,
    ...flexColumn,
    padding: SPACING[10],
    textAlign: 'center'
  },
  loadingSpinner: {
    fontSize: FONT_SIZE['6xl'],
    marginBottom: SPACING[4],
    animation: 'pulse 1.5s ease-in-out infinite'
  },
  loadingText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textGray
  },
  errorContainer: {
    ...flexCenter,
    ...flexColumn,
    padding: SPACING[10],
    textAlign: 'center'
  },
  errorIcon: {
    fontSize: FONT_SIZE['6xl'],
    marginBottom: SPACING[4]
  },
  errorText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.danger,
    marginBottom: SPACING[2]
  },
  errorDetail: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textGray
  },
  emptyContainer: {
    ...flexCenter,
    ...flexColumn,
    padding: SPACING[10],
    textAlign: 'center'
  },
  emptyIcon: {
    fontSize: FONT_SIZE['8xl'],
    marginBottom: SPACING[4],
    opacity: 0.5
  },
  emptyText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textGray
  },
  dayBlock: {
    marginBottom: SPACING[6]
  },
  dateHeader: {
    ...flexBetween,
    marginBottom: SPACING[4],
    paddingBottom: SPACING[3],
    borderBottom: '1px solid rgba(45, 212, 191, 0.2)'
  },
  dateBadge: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.2) 0%, rgba(20, 184, 166, 0.1) 100%)',
    padding: `${SPACING[2]} ${SPACING[3]}`,
    borderRadius: BORDER_RADIUS.md,
    border: '1px solid rgba(45, 212, 191, 0.3)'
  },
  commitCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textGray,
    fontWeight: FONT_WEIGHT.medium
  },
  typeSection: {
    marginBottom: SPACING[4]
  },
  typeHeader: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
    marginBottom: SPACING[2],
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[2]
  },
  typeCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textGray,
    fontWeight: FONT_WEIGHT.normal
  },
  commitList: {
    margin: 0,
    padding: 0,
    listStyleType: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING[2]
  },
  commitItem: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSlate,
    lineHeight: '1.6',
    position: 'relative',
    background: `linear-gradient(135deg, ${COLORS.bgSurfaceLight} 0%, ${COLORS.bgSurface} 100%)`,
    border: `1px solid ${COLORS.bgSurfaceLighter}`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING[3],
    transition: TRANSITIONS.fast
  },
  commitLink: {
    color: COLORS.textLight,
    textDecoration: 'none',
    display: 'block',
    transition: TRANSITIONS.fast
  },
  commitSha: {
    fontFamily: 'monospace',
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    background: 'rgba(45, 212, 191, 0.15)',
    padding: `${SPACING[1]} ${SPACING[2]}`,
    borderRadius: BORDER_RADIUS.sm,
    border: '1px solid rgba(45, 212, 191, 0.3)',
    display: 'inline-block',
    marginBottom: SPACING[1.5],
    fontWeight: FONT_WEIGHT.semibold
  },
  commitMessage: {
    color: COLORS.textLight,
    display: 'block',
    marginBottom: SPACING[1]
  },
  commitScope: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold
  },
  commitBody: {
    marginTop: SPACING[2],
    fontSize: FONT_SIZE.sm,
    color: COLORS.white,
    fontStyle: 'italic',
    lineHeight: '1.6',
    paddingLeft: SPACING[3],
    borderLeft: `3px solid rgba(45, 212, 191, 0.3)`,
    paddingTop: SPACING[1.5],
    paddingBottom: SPACING[1.5]
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent 0%, rgba(45, 212, 191, 0.2) 50%, transparent 100%)',
    margin: `${SPACING[5]} 0`
  },
  footer: {
    padding: `${SPACING[4]} ${SPACING[5]}`,
    borderTop: '1px solid rgba(45, 212, 191, 0.1)',
    background: 'linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.5) 100%)',
    textAlign: 'center'
  },
  footerText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textDarkGray
  },
  link: {
    color: COLORS.primary,
    textDecoration: 'none',
    fontWeight: FONT_WEIGHT.semibold
  }
};
