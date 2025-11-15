/**
 * Chat Bubble Component
 *
 * Displays a speech bubble above a player with their chat message.
 * Automatically fades out after 10 seconds.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React, { useEffect, useState, useRef } from 'react';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS, SHADOWS } from '../styles/tokens';
import { flexColumn, flexCenter, flexBetween } from '../styles/common';

interface ChatBubbleProps {
  message: string;
  timestamp: Date;
  offsetY?: number; // Base vertical offset (will be adjusted by bubble height)
  centered?: boolean; // If true, centers bubble horizontally (default: true)
}

const MAX_COLLAPSED_LENGTH = 50; // Max characters before truncating
const TAIL_HEIGHT = 8; // Height of the bubble tail
const AVATAR_CLEARANCE = 10; // Extra space between bubble and avatar

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
  offsetY,
  centered = true
}: ChatBubbleProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [bubbleHeight, setBubbleHeight] = useState(0);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset visibility when timestamp changes (new message)
    setIsVisible(true);
    setIsExpanded(false); // Reset expansion on new message

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

  // Measure bubble height whenever message or expansion changes
  useEffect(() => {
    if (bubbleRef.current) {
      const height = bubbleRef.current.offsetHeight;
      setBubbleHeight(height);
    }
  }, [message, isExpanded]);

  if (!isVisible || !message) return null;

  const isLongMessage = message.length > MAX_COLLAPSED_LENGTH;
  const displayMessage = isLongMessage && !isExpanded
    ? message.slice(0, MAX_COLLAPSED_LENGTH) + '...'
    : message;

  // Calculate dynamic offset: position bubble above avatar
  // Negative value = move up. We need: -(bubble height + tail height + clearance)
  const dynamicOffsetY = offsetY !== undefined ? offsetY : (bubbleHeight > 0 ? -(bubbleHeight + TAIL_HEIGHT + AVATAR_CLEARANCE) : -60);

  return (
    <div
      ref={bubbleRef}
      style={{
        ...styles.bubble,
        top: `${dynamicOffsetY}px`,
        left: centered ? '50%' : undefined,
        transform: centered ? 'translateX(-50%)' : undefined
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (isLongMessage) {
          setIsExpanded(!isExpanded);
        }
      }}
    >
      <div style={{
        ...styles.bubbleText,
        cursor: isLongMessage ? 'pointer' : 'default',
        maxWidth: isExpanded ? '300px' : '200px'
      }}>
        {displayMessage}
      </div>
      <div style={styles.bubbleTail} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bubble: {
    position: 'absolute',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BORDER_RADIUS.lg,
    padding: `${SPACING[2]} ${SPACING[3]}`,
    maxWidth: '200px',
    boxShadow: SHADOWS.card,
    border: `2px solid rgba(45, 212, 191, 0.6)`,
    zIndex: 105, // Above player name tooltip (100) to ensure chat is always visible
    animation: 'fadeIn 0.2s ease-out',
    pointerEvents: 'auto', // Enable click events for expansion
    transition: 'all 0.3s ease'
  },
  bubbleText: {
    fontSize: FONT_SIZE[13],
    color: COLORS.bgDarkAlt,
    fontWeight: FONT_WEIGHT.semibold,
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
