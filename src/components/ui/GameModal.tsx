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
 * @lastModified 2025-11-15
 */

import React from 'react';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZE, FONT_WEIGHT, BLUR, Z_INDEX } from '../../styles/tokens';
import { flexBetween, flexCenter, flexColumn } from '../../styles/common';

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
    backgroundColor: COLORS.bgOverlayDark,
    backdropFilter: BLUR.md,
    ...flexCenter,
    zIndex: Z_INDEX.modal,
    padding: SPACING.lg
  },
  modalContent: {
    background: `linear-gradient(135deg, ${COLORS.bgSurface} 0%, ${COLORS.bgDarkAlt} 100%)`,
    borderRadius: BORDER_RADIUS.lg,
    border: `2px solid ${COLORS.primary}`,
    boxShadow: SHADOWS.glowTeal,
    width: '100%',
    maxHeight: '80vh',
    overflow: 'hidden',
    ...flexColumn
  },
  modalHeader: {
    ...flexBetween,
    padding: SPACING.lg,
    borderBottom: `1px solid ${COLORS.bgSurfaceLight}`,
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, transparent 100%)'
  },
  modalTitle: {
    margin: 0,
    fontSize: FONT_SIZE['2xl'],
    color: COLORS.textLight,
    fontWeight: FONT_WEIGHT.bold
  },
  closeButton: {
    background: COLORS.transparent,
    border: 'none',
    color: COLORS.textGray,
    fontSize: FONT_SIZE['2xl'],
    cursor: 'pointer',
    padding: `${SPACING[1]} ${SPACING[2]}`,
    transition: 'all 0.2s',
    borderRadius: BORDER_RADIUS.sm
  },
  modalBody: {
    padding: SPACING.lg,
    overflow: 'auto',
    flex: 1
  }
};
