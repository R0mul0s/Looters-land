/**
 * Chat Box Component
 *
 * Small chat input box positioned in corner of screen.
 * Allows players to send messages that appear as bubbles above their character.
 *
 * Features:
 * - Compact input field
 * - Enter to send, Escape to clear
 * - Character limit (100 chars)
 * - Auto-clear after sending
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React, { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { t } from '../localization/i18n';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS, SHADOWS } from '../styles/tokens';
import { flexColumn, flexCenter, flexBetween } from '../styles/common';

interface ChatBoxProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  lastMessage?: string;
  lastMessageTimestamp?: Date;
}

const MAX_MESSAGE_LENGTH = 100;

/**
 * Renders a chat input box
 *
 * @param props - Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * <ChatBox onSendMessage={(msg) => console.log(msg)} />
 * ```
 */
export function ChatBox({
  onSendMessage,
  disabled = false,
  lastMessage,
  lastMessageTimestamp
}: ChatBoxProps) {
  const [message, setMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed && trimmed.length > 0) {
      onSendMessage(trimmed);
      setMessage('');
      setShowConfirmation(true);
      inputRef.current?.blur();
    }
  };

  // Show confirmation flash for 2 seconds when message is sent
  useEffect(() => {
    if (lastMessageTimestamp) {
      setShowConfirmation(true);
      const timer = setTimeout(() => {
        setShowConfirmation(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastMessageTimestamp]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      setMessage('');
      inputRef.current?.blur();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.chatBox}>
        <span style={styles.icon}>💬</span>
        <input
          ref={inputRef}
          type="text"
          style={styles.input}
          placeholder={t('chat.placeholder')}
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          maxLength={MAX_MESSAGE_LENGTH}
        />
        <button
          style={{
            ...styles.sendButton,
            ...(disabled || !message.trim() ? styles.sendButtonDisabled : {})
          }}
          onClick={handleSend}
          disabled={disabled || !message.trim()}
        >
          ↗
        </button>
      </div>

      {/* Confirmation message */}
      {showConfirmation && lastMessage && (
        <div style={styles.confirmation}>
          <span style={styles.confirmationIcon}>✓</span>
          <span style={styles.confirmationText}>"{lastMessage}"</span>
        </div>
      )}

      {/* Character count */}
      {!showConfirmation && (
        <div style={styles.charCount}>
          {message.length}/{MAX_MESSAGE_LENGTH}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: SPACING[5],
    right: SPACING[5],
    zIndex: 900,
    ...flexColumn,
    alignItems: 'flex-end',
    gap: SPACING[1]
  },
  chatBox: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[2],
    background: `linear-gradient(135deg, ${COLORS.bgSurface} 0%, ${COLORS.bgDarkAlt} 100%)`,
    border: `2px solid ${COLORS.primary}`,
    borderRadius: BORDER_RADIUS.lg,
    padding: `${SPACING.sm} ${SPACING[3]}`,
    boxShadow: SHADOWS.glowTeal,
    minWidth: '300px'
  },
  icon: {
    fontSize: FONT_SIZE.xl
  },
  input: {
    flex: 1,
    background: COLORS.bgSurfaceLight,
    border: `1px solid ${COLORS.bgSurfaceLighter}`,
    borderRadius: BORDER_RADIUS.sm,
    padding: `${SPACING[2]} ${SPACING[3]}`,
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
    outline: 'none',
    transition: TRANSITIONS.allBase
  },
  sendButton: {
    background: `linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.successDark} 100%)`,
    border: 'none',
    borderRadius: BORDER_RADIUS.sm,
    width: '36px',
    height: '36px',
    ...flexCenter,
    fontSize: FONT_SIZE.lg,
    color: COLORS.white,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase,
    boxShadow: SHADOWS.glowGreen
  },
  sendButtonDisabled: {
    background: COLORS.bgSurfaceLighter,
    cursor: 'not-allowed',
    boxShadow: SHADOWS.none,
    opacity: 0.5
  },
  charCount: {
    fontSize: FONT_SIZE[11],
    color: COLORS.textDarkGray,
    fontWeight: FONT_WEIGHT.semibold,
    paddingRight: SPACING[1]
  },
  confirmation: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    color: COLORS.success,
    fontWeight: FONT_WEIGHT.semibold,
    paddingRight: SPACING[1],
    animation: 'fadeIn 0.2s ease-out'
  },
  confirmationIcon: {
    fontSize: FONT_SIZE.md,
    color: COLORS.success
  },
  confirmationText: {
    color: COLORS.textGray,
    fontStyle: 'italic',
    maxWidth: '280px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }
};
