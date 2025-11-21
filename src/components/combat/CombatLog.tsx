/**
 * Enhanced Combat Log Component
 *
 * Displays combat actions with filtering, auto-scroll and export functionality.
 * Shows turn-by-turn combat events with color coding and hero name highlighting.
 *
 * Contains:
 * - CombatLog component - Main log display with filters
 * - Auto-scroll functionality with toggle
 * - Export to text file feature
 * - Hero name highlighting in messages
 * - Collapsible header
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-21
 */
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import type { CombatLogEntry } from '../../types/combat.types';
import { t } from '../../localization/i18n';
import './CombatLog.css';

interface CombatLogProps {
  entries: CombatLogEntry[];
  maxHeight?: number;
  showFilters?: boolean;
  highlightNames?: string[];
}

type LogFilter = 'all' | 'attack' | 'skill' | 'heal' | 'death';

/**
 * Enhanced Combat Log Component
 *
 * Renders a scrollable, filterable log of combat actions with auto-scroll
 * and export capabilities.
 *
 * @param props - Component props
 * @returns React component displaying combat log
 *
 * @example
 * ```tsx
 * <CombatLog
 *   entries={combatLog}
 *   maxHeight={250}
 *   showFilters={true}
 *   highlightNames={['Arthur', 'Merlin']}
 * />
 * ```
 */
export const CombatLog: React.FC<CombatLogProps> = ({
  entries,
  maxHeight = 300,
  showFilters = true,
  highlightNames = []
}) => {
  const logEndRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<LogFilter>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (autoScroll && logEndRef.current && !isCollapsed) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries, autoScroll, isCollapsed]);

  // Filter entries based on selected filter
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      if (filter === 'all') return true;
      return entry.type === filter;
    });
  }, [entries, filter]);

  /**
   * Highlight hero names in combat log message
   *
   * @param message - Original log message
   * @returns React nodes with highlighted hero names
   */
  const highlightMessage = useCallback((message: string): React.ReactNode => {
    if (highlightNames.length === 0) return message;

    const result = message;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    highlightNames.forEach((name) => {
      const regex = new RegExp(`(${name})`, 'g');
      let match;

      while ((match = regex.exec(result)) !== null) {
        if (match.index > lastIndex) {
          parts.push(result.substring(lastIndex, match.index));
        }
        parts.push(
          <span key={`${name}-${match.index}`} className="combat-log-highlight">
            {name}
          </span>
        );
        lastIndex = match.index + name.length;
      }
    });

    if (lastIndex < result.length) {
      parts.push(result.substring(lastIndex));
    }

    return parts.length > 0 ? parts : message;
  }, [highlightNames]);

  /**
   * Export combat log to text file
   *
   * Creates a downloadable .txt file with all combat log entries
   */
  const exportLog = useCallback(() => {
    const logText = entries.map(e =>
      `[Turn ${e.turn}] [${e.type.toUpperCase()}] ${e.message}`
    ).join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `combat-log-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries]);

  return (
    <div className="combat-log-component">
      {/* Header */}
      <div className="combat-log-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <h4 className="combat-log-title">
          📜 {t('combat.log.title')} ({filteredEntries.length})
        </h4>
        <button className="combat-log-toggle">
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Controls */}
          <div className="combat-log-controls">
            {showFilters && (
              <div className="combat-log-filters">
                {(['all', 'attack', 'skill', 'heal', 'death'] as LogFilter[]).map(f => (
                  <button
                    key={f}
                    onClick={(e) => { e.stopPropagation(); setFilter(f); }}
                    className={`combat-log-filter-btn ${filter === f ? 'active' : ''}`}
                  >
                    {t(`combat.log.filter.${f}`)}
                  </button>
                ))}
              </div>
            )}

            <div className="combat-log-actions">
              <label className="combat-log-autoscroll">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                />
                <span>{t('combat.log.autoScroll')}</span>
              </label>

              <button className="combat-log-export-btn" onClick={exportLog}>
                📥 {t('combat.log.export')}
              </button>
            </div>
          </div>

          {/* Entries */}
          <div
            className="combat-log-entries-container"
            style={{ maxHeight: `${maxHeight}px` }}
          >
            {filteredEntries.length === 0 ? (
              <div className="combat-log-empty">
                {filter === 'all'
                  ? t('combat.log.empty')
                  : t('combat.log.noEntries', { filter })}
              </div>
            ) : (
              filteredEntries.map((entry, index) => (
                <div key={`log-${index}`} className={`combat-log-entry ${entry.type}`}>
                  <span className="combat-log-message">
                    {highlightMessage(entry.message)}
                  </span>
                  {entry.turn > 0 && (
                    <span className="combat-log-turn-badge">T{entry.turn}</span>
                  )}
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>

          {/* Footer */}
          <div className="combat-log-footer">
            <span>{t('combat.log.total')}: <strong>{entries.length}</strong></span>
            {entries.length > 0 && (
              <span>{t('combat.log.turns')}: <strong>{entries[entries.length - 1]?.turn || 0}</strong></span>
            )}
          </div>
        </>
      )}
    </div>
  );
};
