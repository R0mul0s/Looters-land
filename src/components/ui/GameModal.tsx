/**
 * Game Modal Component
 *
 * Reusable modal component for displaying dialogs, confirmations, and info screens.
 * Provides consistent styling and behavior across all modals in the game.
 *
 * Features:
 * - Click outside to close (optional)
 * - Close button in header
 * - Customizable title and content
 * - Scrollable body for long content
 * - Backdrop blur effect
 *
 * Usage:
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <GameModal
 *   isOpen={isOpen}
 *   title="Modal Title"
 *   onClose={() => setIsOpen(false)}
 * >
 *   <p>Modal content goes here</p>
 * </GameModal>
 * ```
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-09
 */

import React from 'react';

interface GameModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  closeOnBackdropClick?: boolean; // Default: true
  maxWidth?: string; // Default: '500px'
  icon?: string; // Optional emoji icon for title
}

/**
 * Renders a modal dialog with consistent game styling
 *
 * @param props - Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * <GameModal
 *   isOpen={showModal}
 *   title="Unexplored Territory"
 *   icon="🌑"
 *   onClose={() => setShowModal(false)}
 * >
 *   <p>This area is shrouded in darkness.</p>
 * </GameModal>
 * ```
 */
export function GameModal({
  isOpen,
  title,
  onClose,
  children,
  closeOnBackdropClick = true,
  maxWidth = '500px',
  icon
}: GameModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (closeOnBackdropClick) {
      onClose();
    }
  };

  return (
    <div style={styles.modal} onClick={handleBackdropClick}>
      <div
        style={{ ...styles.modalContent, maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>
            {icon && `${icon} `}{title}
          </h2>
          <button
            style={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    borderRadius: '12px',
    border: '2px solid #2dd4bf',
    boxShadow: '0 8px 32px rgba(45, 212, 191, 0.3)',
    width: '100%',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #334155',
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, transparent 100%)'
  },
  modalTitle: {
    margin: 0,
    fontSize: '24px',
    color: '#f1f5f9',
    fontWeight: '700'
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '4px 8px',
    transition: 'all 0.2s',
    borderRadius: '4px'
  },
  modalBody: {
    padding: '20px',
    overflow: 'auto',
    flex: 1
  }
};
