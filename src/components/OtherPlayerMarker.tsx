/**
 * Other Player Marker Component
 *
 * Displays other online players on the world map with their nickname and level.
 * Shows player icon with text label above.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-09
 */

import React from 'react';

interface OtherPlayerMarkerProps {
  nickname: string;
  level: number;
  color?: string; // Optional color for player icon
  scale?: number; // Scale factor based on zoom level
}

/**
 * Renders a player marker with nickname and level
 *
 * @param props - Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * <OtherPlayerMarker nickname="Dragon123" level={15} />
 * ```
 */
export function OtherPlayerMarker({
  nickname,
  level,
  color = '#3b82f6', // Blue by default
  scale = 1 // Default scale
}: OtherPlayerMarkerProps) {
  // Scale all sizes based on zoom level
  const iconSize = Math.floor(32 * scale);
  const fontSize = Math.floor(18 * scale);
  const labelPadding = `${Math.floor(4 * scale)}px ${Math.floor(8 * scale)}px`;
  const nicknameFontSize = Math.max(9, Math.floor(11 * scale));
  const levelFontSize = Math.max(8, Math.floor(9 * scale));

  return (
    <div style={styles.container}>
      {/* Nickname and Level Label */}
      <div style={{ ...styles.label, padding: labelPadding }}>
        <span style={{ ...styles.nickname, fontSize: `${nicknameFontSize}px` }}>{nickname}</span>
        <span style={{ ...styles.level, fontSize: `${levelFontSize}px` }}>Lv.{level}</span>
      </div>

      {/* Player Icon */}
      <div style={{
        ...styles.playerIcon,
        backgroundColor: color,
        width: `${iconSize}px`,
        height: `${iconSize}px`,
        fontSize: `${fontSize}px`
      }}>
        👤
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    zIndex: 100
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.85)',
    borderRadius: '6px',
    padding: '4px 8px',
    marginBottom: '4px',
    border: '1px solid rgba(59, 130, 246, 0.5)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    minWidth: '60px'
  },
  nickname: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#f1f5f9',
    whiteSpace: 'nowrap',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)'
  },
  level: {
    fontSize: '9px',
    fontWeight: '600',
    color: '#fbbf24',
    marginTop: '1px'
  },
  playerIcon: {
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid rgba(255, 255, 255, 0.8)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    animation: 'pulse 2s ease-in-out infinite'
  }
};
