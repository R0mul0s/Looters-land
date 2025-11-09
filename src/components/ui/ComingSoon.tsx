/**
 * Coming Soon Component
 *
 * Placeholder screen for features under development.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-08
 */

import React from 'react';

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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #0a0f1e 100%)',
    padding: '40px',
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
    fontSize: '96px',
    marginBottom: '24px',
    filter: 'drop-shadow(0 4px 24px rgba(45, 212, 191, 0.4))',
    animation: 'pulse 2s ease-in-out infinite'
  },
  title: {
    fontSize: '40px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '20px',
    letterSpacing: '0.5px',
    textShadow: '0 0 40px rgba(45, 212, 191, 0.3)'
  },
  description: {
    fontSize: '18px',
    color: '#94a3b8',
    marginBottom: '36px',
    lineHeight: '1.8',
    fontWeight: '400',
    letterSpacing: '0.3px'
  },
  badge: {
    display: 'inline-block',
    padding: '14px 40px',
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.15) 0%, rgba(20, 184, 166, 0.08) 100%)',
    border: '2px solid rgba(45, 212, 191, 0.5)',
    borderRadius: '32px',
    color: '#2dd4bf',
    fontSize: '15px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    boxShadow: '0 8px 32px rgba(45, 212, 191, 0.2), inset 0 1px 0 rgba(45, 212, 191, 0.2)',
    backdropFilter: 'blur(10px)'
  }
};
