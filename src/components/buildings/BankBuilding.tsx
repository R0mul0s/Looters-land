/**
 * Bank Building Component - Placeholder for future bank system
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import React from 'react';

interface BankBuildingProps {
  playerGold: number;
  storedGold: number;
  onClose: () => void;
  onGoldChange: (newGold: number) => void;
  onStoredGoldChange: (newStoredGold: number) => void;
}

export function BankBuilding({ onClose }: BankBuildingProps) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🏦 Bank</h2>
        <button style={styles.closeButton} onClick={onClose}>✕</button>
      </div>

      <div style={styles.content}>
        <div style={styles.comingSoon}>
          <div style={styles.icon}>🚧</div>
          <h3 style={styles.comingSoonTitle}>Coming Soon!</h3>
          <p style={styles.comingSoonText}>
            Bank system will be available in v0.9.0
          </p>
          <div style={styles.featuresList}>
            <div style={styles.featureItem}>✨ Store gold securely</div>
            <div style={styles.featureItem}>✨ Earn daily interest</div>
            <div style={styles.featureItem}>✨ Deposit and withdraw services</div>
            <div style={styles.featureItem}>✨ Transaction history tracking</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    color: '#f1f5f9'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '2px solid #2dd4bf',
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, transparent 100%)'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700'
  },
  closeButton: {
    background: 'transparent',
    border: '2px solid #334155',
    color: '#94a3b8',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: '8px',
    transition: 'all 0.2s'
  },
  content: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px'
  },
  comingSoon: {
    textAlign: 'center',
    maxWidth: '500px'
  },
  icon: {
    fontSize: '80px',
    marginBottom: '20px'
  },
  comingSoonTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#2dd4bf',
    margin: '0 0 15px 0'
  },
  comingSoonText: {
    fontSize: '18px',
    color: '#94a3b8',
    margin: '0 0 30px 0'
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  featureItem: {
    fontSize: '16px',
    color: '#f1f5f9',
    padding: '12px 20px',
    background: 'rgba(45, 212, 191, 0.1)',
    border: '1px solid rgba(45, 212, 191, 0.3)',
    borderRadius: '8px'
  }
};
