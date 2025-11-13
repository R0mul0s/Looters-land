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
 * @lastModified 2025-11-09
 */

import React from 'react';

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
      background: 'rgba(59, 130, 246, 0.1)',
      border: '1px solid rgba(59, 130, 246, 0.3)'
    },
    warning: {
      background: 'rgba(251, 191, 36, 0.1)',
      border: '1px solid rgba(251, 191, 36, 0.3)'
    },
    success: {
      background: 'rgba(16, 185, 129, 0.1)',
      border: '1px solid rgba(16, 185, 129, 0.3)'
    },
    error: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)'
    }
  };

  return (
    <div style={{ ...styles.infoBox, ...variantStyles[variant] }}>
      <p style={styles.infoText}>{children}</p>
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
    default: '#f1f5f9',
    energy: '#fbbf24',
    warning: '#ef4444',
    gold: '#fbbf24',
    info: '#3b82f6'
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
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
    },
    secondary: {
      background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
      color: '#f1f5f9',
      boxShadow: '0 2px 8px rgba(71, 85, 105, 0.4)'
    },
    danger: {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: 'white',
      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
    }
  };

  const disabledStyle = disabled
    ? {
        background: '#475569',
        cursor: 'not-allowed',
        boxShadow: 'none',
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
    margin: '0 0 15px 0',
    fontSize: '15px',
    color: '#ffffff',
    lineHeight: '1.6'
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, #334155, transparent)',
    margin: '15px 0'
  },
  infoBox: {
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '15px'
  },
  infoText: {
    margin: 0,
    fontSize: '14px',
    color: '#f1f5f9',
    lineHeight: '1.6'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #1e293b'
  },
  label: {
    color: '#e2e8f0',
    fontSize: '14px',
    fontWeight: '500'
  },
  value: {
    fontSize: '14px',
    fontWeight: '600'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px'
  },
  button: {
    width: '100%',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '700',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '10px'
  }
};
