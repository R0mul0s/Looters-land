/**
 * Last Updates Component
 *
 * Displays recent game updates and changelog from the last 6 versions.
 * Shows version numbers, dates, and categorized changes.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React, { memo } from 'react';
import { t } from '../../localization/i18n';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS } from '../../styles/tokens';
import { flexBetween, flexColumn } from '../../styles/common';

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
    version: 'v2.3.6',
    date: '2025-11-15',
    technical: [
      t('updates.v2_3_6.technical.item1'),
      t('updates.v2_3_6.technical.item2'),
      t('updates.v2_3_6.technical.item3'),
      t('updates.v2_3_6.technical.item4'),
      t('updates.v2_3_6.technical.item5'),
      t('updates.v2_3_6.technical.item6'),
      t('updates.v2_3_6.technical.item7'),
      t('updates.v2_3_6.technical.item8')
    ]
  },
  {
    version: 'v2.3.4',
    date: '2025-11-15',
    fixes: [
      t('updates.v2_3_4.fixes.item1'),
      t('updates.v2_3_4.fixes.item2')
    ],
    features: [
      t('updates.v2_3_4.features.item1'),
      t('updates.v2_3_4.features.item2'),
      t('updates.v2_3_4.features.item3')
    ],
    technical: [
      t('updates.v2_3_4.technical.item1'),
      t('updates.v2_3_4.technical.item2')
    ]
  },
  {
    version: 'v2.3.3',
    date: '2025-11-13',
    features: [
      t('updates.v2_3_3.features.item1'),
      t('updates.v2_3_3.features.item2'),
      t('updates.v2_3_3.features.item3'),
      t('updates.v2_3_3.features.item4'),
      t('updates.v2_3_3.features.item5'),
      t('updates.v2_3_3.features.item6'),
      t('updates.v2_3_3.features.item7')
    ],
    fixes: [
      t('updates.v2_3_3.fixes.item1'),
      t('updates.v2_3_3.fixes.item2'),
      t('updates.v2_3_3.fixes.item3')
    ],
    technical: [
      t('updates.v2_3_3.technical.item1'),
      t('updates.v2_3_3.technical.item2'),
      t('updates.v2_3_3.technical.item3'),
      t('updates.v2_3_3.technical.item4'),
      t('updates.v2_3_3.technical.item5'),
      t('updates.v2_3_3.technical.item6'),
      t('updates.v2_3_3.technical.item7'),
      t('updates.v2_3_3.technical.item8')
    ]
  },
  {
    version: 'v2.3.2',
    date: '2025-11-12',
    technical: [
      t('updates.v2_3_2.technical.item1'),
      t('updates.v2_3_2.technical.item2'),
      t('updates.v2_3_2.technical.item3'),
      t('updates.v2_3_2.technical.item4'),
      t('updates.v2_3_2.technical.item5'),
      t('updates.v2_3_2.technical.item6'),
      t('updates.v2_3_2.technical.item7'),
      t('updates.v2_3_2.technical.item8')
    ]
  },
  {
    version: 'v2.3.1',
    date: '2025-11-11',
    features: [
      t('updates.v2_3_1.features.item1'),
      t('updates.v2_3_1.features.item2'),
      t('updates.v2_3_1.features.item3'),
      t('updates.v2_3_1.features.item4'),
      t('updates.v2_3_1.features.item5'),
      t('updates.v2_3_1.features.item6'),
      t('updates.v2_3_1.features.item7')
    ],
    technical: [
      t('updates.v2_3_1.technical.item1'),
      t('updates.v2_3_1.technical.item2')
    ]
  },
  {
    version: 'v2.3.0',
    date: '2025-11-10',
    features: [
      t('updates.v2_3_0.features.item1'),
      t('updates.v2_3_0.features.item2'),
      t('updates.v2_3_0.features.item3'),
      t('updates.v2_3_0.features.item4'),
      t('updates.v2_3_0.features.item5'),
      t('updates.v2_3_0.features.item6'),
      t('updates.v2_3_0.features.item7'),
      t('updates.v2_3_0.features.item8'),
      t('updates.v2_3_0.features.item9')
    ],
    technical: [
      t('updates.v2_3_0.technical.item1'),
      t('updates.v2_3_0.technical.item2'),
      t('updates.v2_3_0.technical.item3')
    ]
  },
  {
    version: 'v2.2.0',
    date: '2025-11-10',
    features: [
      t('updates.v2_2_0.features.item1'),
      t('updates.v2_2_0.features.item2'),
      t('updates.v2_2_0.features.item3')
    ],
    fixes: [
      t('updates.v2_2_0.fixes.item1')
    ],
    technical: [
      t('updates.v2_2_0.technical.item1'),
      t('updates.v2_2_0.technical.item2'),
      t('updates.v2_2_0.technical.item3')
    ]
  },
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
      t('updates.v2_1_0.fixes.item7'),
      t('updates.v2_1_0.fixes.item8')
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
  versionBlock: {
    marginBottom: SPACING[5]
  },
  versionHeader: {
    ...flexBetween,
    marginBottom: SPACING[4],
    paddingBottom: SPACING[3],
    borderBottom: '1px solid rgba(45, 212, 191, 0.2)'
  },
  versionBadge: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.2) 0%, rgba(20, 184, 166, 0.1) 100%)',
    padding: `${SPACING[2]} ${SPACING[3]}`,
    borderRadius: BORDER_RADIUS.md,
    border: '1px solid rgba(45, 212, 191, 0.3)'
  },
  versionDate: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textGray,
    fontWeight: FONT_WEIGHT.medium
  },
  section: {
    marginBottom: SPACING[4]
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
    marginBottom: SPACING[2]
  },
  list: {
    margin: '0',
    paddingLeft: SPACING[5],
    listStyleType: 'none'
  },
  listItem: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSlate,
    marginBottom: SPACING[2],
    lineHeight: '1.5',
    position: 'relative',
    paddingLeft: SPACING[4]
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
