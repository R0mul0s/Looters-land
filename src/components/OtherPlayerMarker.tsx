/**
 * Other Player Marker Component
 *
 * Displays other online players on the world map with their nickname and combat power.
 * Shows player avatar image with text label above.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-18
 */

import React, { useState, useEffect } from 'react';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../styles/tokens';
import { flexColumn, flexCenter } from '../styles/common';

// Import hero images
import hero1Img from '../assets/images/hero/hero1.png';
import hero2Img from '../assets/images/hero/hero2.png';
import hero3Img from '../assets/images/hero/hero3.png';
import hero4Img from '../assets/images/hero/hero4.png';
import hero5Img from '../assets/images/hero/hero5.png';

interface OtherPlayerMarkerProps {
  nickname: string;
  combatPower: number;
  level?: number; // Fallback if combat power is not available
  avatar?: string; // Avatar filename (e.g., 'hero1.png')
  color?: string; // Optional color for fallback icon
  scale?: number; // Scale factor based on zoom level
  isOnline?: boolean; // Whether the player is currently online
}

/**
 * Renders a player marker with nickname and combat power
 *
 * @param props - Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * <OtherPlayerMarker nickname="Dragon123" combatPower={1250} avatar="hero2.png" />
 * ```
 */
export function OtherPlayerMarker({
  nickname,
  combatPower,
  level: _level, // eslint-disable-line @typescript-eslint/no-unused-vars
  avatar = 'hero1.png',
  color = '#3b82f6', // Blue by default
  scale = 1, // Default scale
  isOnline = true // Default to online
}: OtherPlayerMarkerProps) {
  const [avatarSrc, setAvatarSrc] = useState<string>('');

  // Load avatar image based on filename
  useEffect(() => {
    switch (avatar) {
      case 'hero2.png':
        setAvatarSrc(hero2Img);
        break;
      case 'hero3.png':
        setAvatarSrc(hero3Img);
        break;
      case 'hero4.png':
        setAvatarSrc(hero4Img);
        break;
      case 'hero5.png':
        setAvatarSrc(hero5Img);
        break;
      default:
        setAvatarSrc(hero1Img);
    }
  }, [avatar]);

  // Scale all sizes based on zoom level - 1.2x to match main player avatar size
  const iconSize = Math.floor(32 * scale * 1.2);
  const labelPadding = `${Math.floor(4 * scale)}px ${Math.floor(8 * scale)}px`;
  const nicknameFontSize = Math.max(9, Math.floor(11 * scale));
  const combatPowerFontSize = Math.max(8, Math.floor(9 * scale));

  // Always display combat power (even if 0)
  const displayValue = combatPower;
  const displayLabel = `⚔️ ${displayValue}`;

  return (
    <div style={styles.container}>
      {/* Nickname and Combat Power/Level Label */}
      <div style={{
        ...styles.label,
        padding: labelPadding,
        ...(isOnline ? {} : styles.labelOffline)
      }}>
        <span style={{ ...styles.nickname, fontSize: `${nicknameFontSize}px` }}>
          {nickname}
          {!isOnline && <span style={styles.offlineText}> (Offline)</span>}
        </span>
        <span style={{ ...styles.combatPower, fontSize: `${combatPowerFontSize}px` }}>{displayLabel}</span>
      </div>

      {/* Player Avatar Image */}
      <div style={styles.avatarWrapper}>
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={nickname}
            style={{
              ...styles.playerAvatar,
              width: `${iconSize}px`,
              height: `${iconSize}px`,
              ...(isOnline ? {} : styles.avatarOffline)
            }}
          />
        ) : (
          // Fallback to emoji if image not loaded
          <div style={{
            ...styles.playerIcon,
            backgroundColor: color,
            width: `${iconSize}px`,
            height: `${iconSize}px`,
            fontSize: `${Math.floor(18 * scale)}px`,
            ...(isOnline ? {} : styles.avatarOffline)
          }}>
            👤
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    ...flexColumn,
    alignItems: 'center',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    zIndex: 100
  },
  label: {
    ...flexColumn,
    alignItems: 'center',
    background: COLORS.bgOverlayDark,
    borderRadius: BORDER_RADIUS.md,
    padding: `${SPACING[1]} ${SPACING[2]}`,
    marginBottom: SPACING[1],
    border: `1px solid ${COLORS.info}80`,
    boxShadow: SHADOWS.md,
    minWidth: '60px'
  },
  labelOffline: {
    border: `1px solid ${COLORS.danger}`,
    background: COLORS.bgOverlayDark
  },
  nickname: {
    fontSize: FONT_SIZE[11],
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textLight,
    whiteSpace: 'nowrap',
    textShadow: SHADOWS.md
  },
  offlineText: {
    color: COLORS.danger,
    fontSize: '0.85em',
    fontStyle: 'italic'
  },
  combatPower: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.danger,
    marginTop: '1px'
  },
  avatarWrapper: {
    position: 'relative',
    display: 'inline-block'
  },
  playerIcon: {
    borderRadius: BORDER_RADIUS.round,
    ...flexCenter,
    border: `2px solid rgba(255, 255, 255, 0.8)`,
    boxShadow: SHADOWS.md,
    animation: 'pulse 2s ease-in-out infinite'
  },
  playerAvatar: {
    objectFit: 'contain'
  },
  avatarOffline: {
    opacity: 0.5,
    filter: 'grayscale(50%)'
  }
};
