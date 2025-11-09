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
 * @lastModified 2025-11-09
 */

import React, { useState, useRef, type KeyboardEvent } from 'react';
import { t } from '../localization/i18n';

interface ChatBoxProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
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
export function ChatBox({ onSendMessage, disabled = false }: ChatBoxProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed && trimmed.length > 0) {
      onSendMessage(trimmed);
      setMessage('');
      inputRef.current?.blur();
    }
  };

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
      <div style={styles.charCount}>
        {message.length}/{MAX_MESSAGE_LENGTH}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 900,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px'
  },
  chatBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    border: '2px solid #2dd4bf',
    borderRadius: '12px',
    padding: '10px 12px',
    boxShadow: '0 4px 16px rgba(45, 212, 191, 0.3)',
    minWidth: '300px'
  },
  icon: {
    fontSize: '20px'
  },
  input: {
    flex: 1,
    background: 'rgba(51, 65, 85, 0.5)',
    border: '1px solid #475569',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '14px',
    color: '#f1f5f9',
    outline: 'none',
    transition: 'all 0.2s'
  },
  sendButton: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    border: 'none',
    borderRadius: '6px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
  },
  sendButtonDisabled: {
    background: '#475569',
    cursor: 'not-allowed',
    boxShadow: 'none',
    opacity: 0.5
  },
  charCount: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '600',
    paddingRight: '4px'
  }
};
