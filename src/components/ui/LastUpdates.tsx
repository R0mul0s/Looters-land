/**
 * Last Updates Component
 *
 * Displays recent game updates and changelog from the last 6 versions.
 * Shows version numbers, dates, and categorized changes.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-09
 */

import React, { memo } from 'react';
import { t } from '../../localization/i18n';

interface ChangelogEntry {
  version: string;
  date: string;
  features?: string[];
  fixes?: string[];
  technical?: string[];
  gameplay?: string[];
}

const getChangelog = (): ChangelogEntry[] => [
  {
    version: 'v2.1.0',
    date: '2025-11-09',
    features: [
      t('updates.v2_1_0.features.item1'),
      t('updates.v2_1_0.features.item2'),
      t('updates.v2_1_0.features.item3')
    ],
    fixes: [
      t('updates.v2_1_0.fixes.item1'),
      t('updates.v2_1_0.fixes.item2'),
      t('updates.v2_1_0.fixes.item3'),
      t('updates.v2_1_0.fixes.item4'),
      t('updates.v2_1_0.fixes.item5'),
      t('updates.v2_1_0.fixes.item6'),
      t('updates.v2_1_0.fixes.item7')
    ],
    technical: [
      t('updates.v2_1_0.technical.item1'),
      t('updates.v2_1_0.technical.item2'),
      t('updates.v2_1_0.technical.item3'),
      t('updates.v2_1_0.technical.item4')
    ]
  },
  {
    version: 'v2.0.0',
    date: '2025-11-08',
    features: [
      t('updates.v2_0_0.features.item1'),
      t('updates.v2_0_0.features.item2'),
      t('updates.v2_0_0.features.item3'),
      t('updates.v2_0_0.features.item4'),
      t('updates.v2_0_0.features.item5'),
      t('updates.v2_0_0.features.item6')
    ],
    gameplay: [
      t('updates.v2_0_0.gameplay.item1'),
      t('updates.v2_0_0.gameplay.item2'),
      t('updates.v2_0_0.gameplay.item3'),
      t('updates.v2_0_0.gameplay.item4'),
      t('updates.v2_0_0.gameplay.item5')
    ],
    technical: [
      t('updates.v2_0_0.technical.item1'),
      t('updates.v2_0_0.technical.item2'),
      t('updates.v2_0_0.technical.item3'),
      t('updates.v2_0_0.technical.item4')
    ]
  },
  {
    version: 'v1.0.0',
    date: '2025-11-07',
    features: [
      t('updates.v1_0_0.features.item1'),
      t('updates.v1_0_0.features.item2'),
      t('updates.v1_0_0.features.item3')
    ]
  }
];

interface LastUpdatesProps {
  onClose?: () => void;
}

/**
 * Last Updates component
 *
 * @param props - Component props
 * @returns React component displaying changelog
 *
 * @example
 * ```tsx
 * <LastUpdates onClose={() => console.log('closed')} />
 * ```
 */
export const LastUpdates = memo(function LastUpdates({ onClose }: LastUpdatesProps) {
  const changelog = getChangelog();

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>📋 {t('updates.title')}</h2>
        {onClose && (
          <button style={styles.closeButton} onClick={onClose}>✕</button>
        )}
      </div>

      {/* Changelog List */}
      <div style={styles.content}>
        {changelog.map((entry, index) => (
          <div key={entry.version} style={styles.versionBlock}>
            {/* Version Header */}
            <div style={styles.versionHeader}>
              <div style={styles.versionBadge}>{entry.version}</div>
              <div style={styles.versionDate}>{entry.date}</div>
            </div>

            {/* Features */}
            {entry.features && entry.features.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>✨ {t('updates.features')}</div>
                <ul style={styles.list}>
                  {entry.features.map((item, i) => (
                    <li key={i} style={styles.listItem}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Fixes */}
            {entry.fixes && entry.fixes.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>🐛 {t('updates.fixes')}</div>
                <ul style={styles.list}>
                  {entry.fixes.map((item, i) => (
                    <li key={i} style={styles.listItem}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gameplay */}
            {entry.gameplay && entry.gameplay.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>🎮 {t('updates.gameplay')}</div>
                <ul style={styles.list}>
                  {entry.gameplay.map((item, i) => (
                    <li key={i} style={styles.listItem}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Technical */}
            {entry.technical && entry.technical.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>🔧 {t('updates.technical')}</div>
                <ul style={styles.list}>
                  {entry.technical.map((item, i) => (
                    <li key={i} style={styles.listItem}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Divider */}
            {index < changelog.length - 1 && <div style={styles.divider} />}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.footerText}>
          {t('updates.footer')}{' '}
          <a
            href="https://github.com/yourusername/looters-land"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            {t('updates.github')}
          </a>
        </div>
      </div>
    </div>
  );
});

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    color: '#f1f5f9',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '2px solid #2dd4bf',
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, transparent 100%)'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700'
  },
  closeButton: {
    background: 'transparent',
    border: '2px solid #334155',
    color: '#94a3b8',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: '8px',
    transition: 'all 0.2s'
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px'
  },
  versionBlock: {
    marginBottom: '20px'
  },
  versionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '1px solid rgba(45, 212, 191, 0.2)'
  },
  versionBadge: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#2dd4bf',
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.2) 0%, rgba(20, 184, 166, 0.1) 100%)',
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(45, 212, 191, 0.3)'
  },
  versionDate: {
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: '500'
  },
  section: {
    marginBottom: '15px'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2dd4bf',
    marginBottom: '8px'
  },
  list: {
    margin: '0',
    paddingLeft: '20px',
    listStyleType: 'none'
  },
  listItem: {
    fontSize: '13px',
    color: '#cbd5e1',
    marginBottom: '6px',
    lineHeight: '1.5',
    position: 'relative',
    paddingLeft: '16px'
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent 0%, rgba(45, 212, 191, 0.2) 50%, transparent 100%)',
    margin: '20px 0'
  },
  footer: {
    padding: '15px 20px',
    borderTop: '1px solid rgba(45, 212, 191, 0.1)',
    background: 'linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.5) 100%)',
    textAlign: 'center'
  },
  footerText: {
    fontSize: '12px',
    color: '#64748b'
  },
  link: {
    color: '#2dd4bf',
    textDecoration: 'none',
    fontWeight: '600'
  }
};
