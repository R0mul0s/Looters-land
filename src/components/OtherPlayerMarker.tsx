/**
 * Other Player Marker Component
 *
 * Displays other online players on the world map with their nickname and combat power.
 * Shows player avatar image with text label above.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-12
 */

import React, { useState, useEffect } from 'react';

// Import hero images
import hero1Img from '../assets/images/hero/hero1.png';
import hero2Img from '../assets/images/hero/hero2.png';
import hero3Img from '../assets/images/hero/hero3.png';
import hero4Img from '../assets/images/hero/hero4.png';
import hero5Img from '../assets/images/hero/hero5.png';

interface OtherPlayerMarkerProps {
  nickname: string;
  combatPower: number;
  avatar?: string; // Avatar filename (e.g., 'hero1.png')
  color?: string; // Optional color for fallback icon
  scale?: number; // Scale factor based on zoom level
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
  avatar = 'hero1.png',
  color = '#3b82f6', // Blue by default
  scale = 1 // Default scale
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

  return (
    <div style={styles.container}>
      {/* Nickname and Combat Power Label */}
      <div style={{ ...styles.label, padding: labelPadding }}>
        <span style={{ ...styles.nickname, fontSize: `${nicknameFontSize}px` }}>{nickname}</span>
        <span style={{ ...styles.combatPower, fontSize: `${combatPowerFontSize}px` }}>⚔️ {combatPower}</span>
      </div>

      {/* Player Avatar Image */}
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt={nickname}
          style={{
            ...styles.playerAvatar,
            width: `${iconSize}px`,
            height: `${iconSize}px`
          }}
        />
      ) : (
        // Fallback to emoji if image not loaded
        <div style={{
          ...styles.playerIcon,
          backgroundColor: color,
          width: `${iconSize}px`,
          height: `${iconSize}px`,
          fontSize: `${Math.floor(18 * scale)}px`
        }}>
          👤
        </div>
      )}
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
  combatPower: {
    fontSize: '9px',
    fontWeight: '600',
    color: '#ef4444',
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
  },
  playerAvatar: {
    objectFit: 'contain'
  }
};
