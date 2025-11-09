/**
 * Chat Bubble Component
 *
 * Displays a speech bubble above a player with their chat message.
 * Automatically fades out after 10 seconds.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-09
 */

import React, { useEffect, useState } from 'react';

interface ChatBubbleProps {
  message: string;
  timestamp: Date;
  offsetY?: number; // Vertical offset from player (default: -80px)
}

/**
 * Renders a chat bubble above a player
 *
 * @param props - Component props
 * @returns React component or null if expired
 *
 * @example
 * ```tsx
 * <ChatBubble message="Hello world!" timestamp={new Date()} />
 * ```
 */
export function ChatBubble({
  message,
  timestamp,
  offsetY = -80
}: ChatBubbleProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Reset visibility when timestamp changes (new message)
    setIsVisible(true);

    // Check if message is older than 10 seconds
    const age = Date.now() - timestamp.getTime();
    if (age > 10000) {
      setIsVisible(false);
      return;
    }

    // Set timer to hide after 10 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 10000 - age);

    return () => clearTimeout(timer);
  }, [timestamp]);

  if (!isVisible || !message) return null;

  return (
    <div style={{ ...styles.bubble, top: `${offsetY}px` }}>
      <div style={styles.bubbleText}>{message}</div>
      <div style={styles.bubbleTail} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bubble: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    padding: '8px 12px',
    maxWidth: '200px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    border: '2px solid rgba(45, 212, 191, 0.6)',
    zIndex: 101,
    animation: 'fadeIn 0.2s ease-out',
    pointerEvents: 'none'
  },
  bubbleText: {
    fontSize: '13px',
    color: '#0f172a',
    fontWeight: '600',
    wordWrap: 'break-word',
    lineHeight: '1.4'
  },
  bubbleTail: {
    position: 'absolute',
    bottom: '-8px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '8px solid transparent',
    borderRight: '8px solid transparent',
    borderTop: '8px solid rgba(255, 255, 255, 0.95)'
  }
};
