/**
 * Sync Status Indicator Component
 *
 * Displays the current synchronization status with Supabase database.
 * Shows saving state, last save time, and error states.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-10
 */

import React from 'react';
import { t, getLanguage } from '../localization/i18n';

export type SyncStatus = 'idle' | 'saving' | 'success' | 'error';

/**
 * Props for SyncStatusIndicator component
 */
interface SyncStatusIndicatorProps {
  /** Current sync status */
  status: SyncStatus;
  /** Last successful save timestamp */
  lastSaveTime?: Date;
  /** Error message if status is 'error' */
  errorMessage?: string;
}

/**
 * Renders a sync status indicator
 *
 * @param props - Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * <SyncStatusIndicator status="success" lastSaveTime={new Date()} />
 * ```
 */
export function SyncStatusIndicator({
  status,
  lastSaveTime,
  errorMessage
}: SyncStatusIndicatorProps) {
  /**
   * Get status configuration (icon, text, colors) based on sync status
   *
   * @returns Configuration object for current status
   */
  const getStatusConfig = (): { icon: string; text: string; color: string; bgColor: string } => {
    switch (status) {
      case 'saving':
        return {
          icon: '💾',
          text: t('sync.saving'),
          color: '#3b82f6', // Blue
          bgColor: 'rgba(59, 130, 246, 0.1)'
        };
      case 'success':
        return {
          icon: '✓',
          text: lastSaveTime ? t('sync.savedAt', { time: formatTime(lastSaveTime) }) : t('sync.saved'),
          color: '#10b981', // Green
          bgColor: 'rgba(16, 185, 129, 0.1)'
        };
      case 'error':
        return {
          icon: '⚠',
          text: errorMessage || t('sync.error'),
          color: '#ef4444', // Red
          bgColor: 'rgba(239, 68, 68, 0.1)'
        };
      case 'idle':
      default:
        return {
          icon: '○',
          text: t('sync.connected'),
          color: '#6b7280', // Gray
          bgColor: 'rgba(107, 114, 128, 0.1)'
        };
    }
  };

  const config = getStatusConfig();

  // Don't show if idle and no last save
  if (status === 'idle' && !lastSaveTime) {
    return null;
  }

  return (
    <div style={{
      ...styles.container,
      backgroundColor: config.bgColor,
      borderColor: config.color
    }}>
      <span style={{ ...styles.icon, color: config.color }}>
        {config.icon}
      </span>
      <span style={{ ...styles.text, color: config.color }}>
        {config.text}
      </span>
    </div>
  );
}

/**
 * Format time as relative string (e.g., "před 2m" or "2m ago")
 *
 * Converts timestamp to human-readable relative time in current language.
 * Uses localized strings from i18n system.
 *
 * @param date - Date to format
 * @returns Localized relative time string
 *
 * @example
 * ```typescript
 * formatTime(new Date(Date.now() - 120000)) // "před 2m" or "2m ago"
 * ```
 */
function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const currentLang = getLanguage();

  if (diffSec < 60) {
    return t('sync.timeJustNow');
  } else if (diffMin < 60) {
    return t('sync.timeMinutesAgo', { minutes: diffMin.toString() });
  } else if (diffHour < 24) {
    return t('sync.timeHoursAgo', { hours: diffHour.toString() });
  } else {
    const locale = currentLang === 'cs' ? 'cs-CZ' : 'en-US';
    return date.toLocaleDateString(locale, { hour: '2-digit', minute: '2-digit' });
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  icon: {
    fontSize: '14px',
    lineHeight: 1
  },
  text: {
    lineHeight: 1,
    whiteSpace: 'nowrap'
  }
};
