/**
 * Coming Soon Component
 *
 * Placeholder screen for features under development.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React from 'react';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, BLUR } from '../../styles/tokens';
import { flexCenter } from '../../styles/common';

interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: string;
}

/**
 * Coming Soon Component
 *
 * @param props - Component props
 * @returns React component
 */
export function ComingSoon({
  title,
  description = 'This feature is currently under development.',
  icon = '🚧'
}: ComingSoonProps) {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.icon}>{icon}</div>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.description}>{description}</p>
        <div style={styles.badge}>Coming Soon</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    ...flexCenter,
    width: '100%',
    height: '100%',
    background: `linear-gradient(135deg, ${COLORS.bgDarkSolid} 0%, ${COLORS.bgDarkAlt} 50%, ${COLORS.bgDarkSolid} 100%)`,
    padding: SPACING[10],
    position: 'relative',
    overflow: 'hidden'
  },
  content: {
    textAlign: 'center',
    maxWidth: '600px',
    position: 'relative',
    zIndex: 1
  },
  icon: {
    fontSize: FONT_SIZE['9xl'],
    marginBottom: SPACING[6],
    filter: 'drop-shadow(0 4px 24px rgba(45, 212, 191, 0.4))',
    animation: 'pulse 2s ease-in-out infinite'
  },
  title: {
    fontSize: FONT_SIZE['5xl'],
    fontWeight: FONT_WEIGHT.bold,
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: SPACING.lg,
    letterSpacing: '0.5px',
    textShadow: '0 0 40px rgba(45, 212, 191, 0.3)'
  },
  description: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textGray,
    marginBottom: SPACING[9],
    lineHeight: '1.8',
    fontWeight: FONT_WEIGHT.normal,
    letterSpacing: '0.3px'
  },
  badge: {
    display: 'inline-block',
    padding: `${SPACING[3.5]} ${SPACING[10]}`,
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.15) 0%, rgba(20, 184, 166, 0.08) 100%)',
    border: '2px solid rgba(45, 212, 191, 0.5)',
    borderRadius: BORDER_RADIUS.round,
    color: COLORS.primary,
    fontSize: FONT_SIZE[15],
    fontWeight: FONT_WEIGHT.bold,
    textTransform: 'uppercase',
    letterSpacing: '2px',
    boxShadow: '0 8px 32px rgba(45, 212, 191, 0.2), inset 0 1px 0 rgba(45, 212, 191, 0.2)',
    backdropFilter: BLUR.md
  }
};
