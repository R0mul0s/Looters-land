/**
 * Modal Content Components
 *
 * Reusable content components for use inside GameModal.
 * Provides consistent styling for common modal elements.
 *
 * Components:
 * - ModalText - Styled text paragraph
 * - ModalDivider - Horizontal divider line
 * - ModalInfoBox - Info box with tip/warning styling
 * - ModalInfoRow - Label/value row for displaying information
 * - ModalButton - Styled action button
 * - ModalButtonGroup - Container for multiple buttons in a row
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React from 'react';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS, SHADOWS } from '../../styles/tokens';
import { flexBetween } from '../../styles/common';

/**
 * Styled text paragraph for modal body
 */
export function ModalText({ children }: { children: React.ReactNode }) {
  return <p style={styles.text}>{children}</p>;
}

/**
 * Horizontal divider line
 */
export function ModalDivider() {
  return <div style={styles.divider} />;
}

/**
 * Info box with icon and styled background
 */
export function ModalInfoBox({
  children,
  variant = 'info'
}: {
  children: React.ReactNode;
  variant?: 'info' | 'warning' | 'success' | 'error';
}) {
  const variantStyles = {
    info: {
      background: `${COLORS.info}1A`,
      border: `1px solid ${COLORS.info}4D`
    },
    warning: {
      background: `${COLORS.goldLight}1A`,
      border: `1px solid ${COLORS.goldLight}4D`
    },
    success: {
      background: `${COLORS.success}1A`,
      border: `1px solid ${COLORS.success}4D`
    },
    error: {
      background: `${COLORS.danger}1A`,
      border: `1px solid ${COLORS.danger}4D`
    }
  };

  return (
    <div style={{ ...styles.infoBox, ...variantStyles[variant] }}>
      <div style={styles.infoText}>{children}</div>
    </div>
  );
}

/**
 * Info row displaying label and value
 */
export function ModalInfoRow({
  label,
  value,
  valueColor
}: {
  label: string;
  value: React.ReactNode;
  valueColor?: 'default' | 'energy' | 'warning' | 'gold' | 'info';
}) {
  const valueColors = {
    default: COLORS.textLight,
    energy: COLORS.goldLight,
    warning: COLORS.danger,
    gold: COLORS.goldLight,
    info: COLORS.info
  };

  return (
    <div style={styles.infoRow}>
      <span style={styles.label}>{label}</span>
      <span style={{ ...styles.value, color: valueColors[valueColor || 'default'] }}>
        {value}
      </span>
    </div>
  );
}

/**
 * Container for multiple buttons in a row
 */
export function ModalButtonGroup({ children }: { children: React.ReactNode }) {
  return <div style={styles.buttonGroup}>{children}</div>;
}

/**
 * Styled action button for modal
 */
export function ModalButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  fullWidth = true
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  const variantStyles = {
    primary: {
      background: `linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.successDark} 100%)`,
      color: COLORS.white,
      boxShadow: SHADOWS.md
    },
    secondary: {
      background: `linear-gradient(135deg, ${COLORS.bgSurfaceLighter} 0%, ${COLORS.bgSurfaceLight} 100%)`,
      color: COLORS.textLight,
      boxShadow: SHADOWS.md
    },
    danger: {
      background: `linear-gradient(135deg, ${COLORS.danger} 0%, ${COLORS.dangerDark} 100%)`,
      color: COLORS.white,
      boxShadow: SHADOWS.md
    }
  };

  const disabledStyle = disabled
    ? {
        background: COLORS.bgSurfaceLighter,
        cursor: 'not-allowed',
        boxShadow: SHADOWS.none,
        opacity: 0.5
      }
    : {};

  return (
    <button
      style={{
        ...styles.button,
        ...variantStyles[variant],
        ...disabledStyle,
        ...(fullWidth ? {} : { width: 'auto', flex: 1 })
      }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  text: {
    margin: `0 0 ${SPACING[4]} 0`,
    fontSize: FONT_SIZE[15],
    color: COLORS.white,
    lineHeight: '1.6'
  },
  divider: {
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${COLORS.bgSurfaceLight}, transparent)`,
    margin: `${SPACING[4]} 0`
  },
  infoBox: {
    padding: `${SPACING[3]} ${SPACING[4]}`,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING[4]
  },
  infoText: {
    margin: 0,
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
    lineHeight: '1.6'
  },
  infoRow: {
    ...flexBetween,
    padding: `${SPACING[2]} 0`,
    borderBottom: `1px solid ${COLORS.bgSurface}`
  },
  label: {
    color: COLORS.textLighter,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium
  },
  value: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold
  },
  buttonGroup: {
    display: 'flex',
    gap: SPACING[2],
    marginTop: SPACING[4]
  },
  button: {
    width: '100%',
    padding: `${SPACING[3]} ${SPACING[6]}`,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    border: 'none',
    borderRadius: BORDER_RADIUS.md,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase,
    marginTop: SPACING[2]
  }
};
