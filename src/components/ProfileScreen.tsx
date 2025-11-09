/**
 * Profile/Settings Screen Component
 *
 * Displays user profile information and provides dangerous actions:
 * - Reset Progress: Clears all game data (heroes, items, progress) but keeps account
 * - Delete Account: Permanently deletes the user account and all associated data
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-09
 */

import React, { useState } from 'react';
import * as AuthService from '../services/AuthService';
import { ProfileService } from '../services/ProfileService';

interface ProfileScreenProps {
  playerName: string;
  playerEmail?: string;
  playerLevel?: number;
  gold: number;
  gems: number;
  heroCount: number;
  itemCount: number;
  onClose?: () => void;
  onResetProgress?: () => void; // Callback after progress reset
  onAccountDeleted?: () => void; // Callback after account deletion
}

export function ProfileScreen({
  playerName,
  playerEmail,
  playerLevel = 1,
  gold,
  gems,
  heroCount,
  itemCount,
  onClose,
  onResetProgress,
  onAccountDeleted
}: ProfileScreenProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [resetStep, setResetStep] = useState(0); // 0 = initial, 1 = first confirm, 2 = final confirm
  const [deleteStep, setDeleteStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Reset Progress - Clears all game data but keeps account
   */
  const handleResetProgress = async () => {
    if (resetStep === 0) {
      setResetStep(1);
      return;
    }

    if (resetStep === 1) {
      setResetStep(2);
      return;
    }

    // Final confirmation - actually reset
    setIsProcessing(true);
    setError(null);

    try {
      const result = await ProfileService.resetProgress();

      if (result.success) {
        // Clear all cached data
        console.log('🧹 Clearing localStorage and sessionStorage...');
        localStorage.clear();
        sessionStorage.clear();

        alert('✅ Progres byl úspěšně resetován! Budete odhlášeni pro načtení nového stavu...');

        // Sign out to prevent auto-save from recreating data
        await AuthService.logout();

        // Redirect to login or home page
        setResetStep(0);
        setShowResetConfirm(false);

        if (onResetProgress) {
          onResetProgress();
        } else {
          window.location.href = '/';
        }
      } else {
        setError(result.message || 'Nepodařilo se resetovat progres');
        setResetStep(0);
      }
    } catch (err) {
      console.error('Reset progress error:', err);
      setError('Nastala chyba při resetování progressu');
      setResetStep(0);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Delete Account - Permanently deletes user account and all data
   */
  const handleDeleteAccount = async () => {
    if (deleteStep === 0) {
      setDeleteStep(1);
      return;
    }

    if (deleteStep === 1) {
      setDeleteStep(2);
      return;
    }

    // Final confirmation - actually delete
    setIsProcessing(true);
    setError(null);

    try {
      const result = await ProfileService.deleteAccount();

      if (result.success) {
        // Clear localStorage to remove all cached data
        console.log('🧹 Clearing localStorage...');
        localStorage.clear();

        alert('❌ Účet byl úspěšně smazán. Budete odhlášeni...');

        // Sign out and redirect
        await AuthService.logout();

        if (onAccountDeleted) {
          onAccountDeleted();
        } else {
          window.location.href = '/';
        }
      } else {
        setError(result.message || 'Nepodařilo se smazat účet');
        setDeleteStep(0);
      }
    } catch (err) {
      console.error('Delete account error:', err);
      setError('Nastala chyba při mazání účtu');
      setDeleteStep(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelReset = () => {
    setResetStep(0);
    setShowResetConfirm(false);
  };

  const cancelDelete = () => {
    setDeleteStep(0);
    setShowDeleteConfirm(false);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>⚙️ Profil & Nastavení</h2>
        {onClose && (
          <button style={styles.closeButton} onClick={onClose}>✕</button>
        )}
      </div>

      {/* Profile Info */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>👤 Informace o hráči</h3>
        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Jméno:</div>
            <div style={styles.infoValue}>{playerName}</div>
          </div>
          {playerEmail && (
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Email:</div>
              <div style={styles.infoValue}>{playerEmail}</div>
            </div>
          )}
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Level:</div>
            <div style={styles.infoValue}>{playerLevel}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Zlato:</div>
            <div style={styles.infoValue}>{gold.toLocaleString()}g</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Drahokamy:</div>
            <div style={styles.infoValue}>{gems.toLocaleString()} 💎</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Hrdinové:</div>
            <div style={styles.infoValue}>{heroCount}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Předměty:</div>
            <div style={styles.infoValue}>{itemCount}</div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.errorMessage}>
          ❌ {error}
        </div>
      )}

      {/* Dangerous Actions */}
      <div style={styles.section}>
        <h3 style={{...styles.sectionTitle, color: '#ef4444'}}>⚠️ Nebezpečné akce</h3>

        {/* Reset Progress */}
        <div style={styles.dangerCard}>
          <div style={styles.dangerHeader}>
            <div style={styles.dangerIcon}>🔄</div>
            <div>
              <div style={styles.dangerTitle}>Resetovat progres (DEBUG)</div>
              <div style={styles.dangerDescription}>
                Smaže všechny hrdiny, předměty a progres. Účet zůstane aktivní.
              </div>
            </div>
          </div>

          {!showResetConfirm ? (
            <button
              style={styles.dangerButton}
              onClick={() => setShowResetConfirm(true)}
              disabled={isProcessing}
            >
              Resetovat progres
            </button>
          ) : (
            <div style={styles.confirmBox}>
              {resetStep === 0 && (
                <>
                  <div style={styles.confirmText}>
                    Opravdu chcete smazat veškerý progres?
                  </div>
                  <div style={styles.confirmButtons}>
                    <button style={styles.cancelButton} onClick={cancelReset}>
                      Zrušit
                    </button>
                    <button style={styles.confirmButton} onClick={handleResetProgress}>
                      Ano, resetovat
                    </button>
                  </div>
                </>
              )}
              {resetStep === 1 && (
                <>
                  <div style={styles.confirmText}>
                    ⚠️ Tato akce je NEVRATNÁ! Ztratíte:<br/>
                    • {heroCount} hrdinů<br/>
                    • {itemCount} předmětů<br/>
                    • Veškerý progres a zlato<br/><br/>
                    Pokračovat?
                  </div>
                  <div style={styles.confirmButtons}>
                    <button style={styles.cancelButton} onClick={cancelReset}>
                      Zrušit
                    </button>
                    <button style={styles.confirmButton} onClick={handleResetProgress}>
                      Ano, jsem si jistý
                    </button>
                  </div>
                </>
              )}
              {resetStep === 2 && (
                <>
                  <div style={styles.confirmText}>
                    🔴 POSLEDNÍ VAROVÁNÍ!<br/>
                    Toto NELZE vrátit zpět. Opravdu smazat vše?
                  </div>
                  <div style={styles.confirmButtons}>
                    <button style={styles.cancelButton} onClick={cancelReset}>
                      Ne, zrušit
                    </button>
                    <button
                      style={{...styles.confirmButton, background: '#dc2626'}}
                      onClick={handleResetProgress}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Probíhá...' : 'ANO, SMAZAT VŠE'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Delete Account */}
        <div style={styles.dangerCard}>
          <div style={styles.dangerHeader}>
            <div style={styles.dangerIcon}>🗑️</div>
            <div>
              <div style={styles.dangerTitle}>Smazat účet</div>
              <div style={styles.dangerDescription}>
                Trvale smaže váš účet a VŠECHNA data. Tuto akci NELZE vrátit zpět!
              </div>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <button
              style={{...styles.dangerButton, background: '#dc2626'}}
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isProcessing}
            >
              Smazat účet
            </button>
          ) : (
            <div style={styles.confirmBox}>
              {deleteStep === 0 && (
                <>
                  <div style={styles.confirmText}>
                    Opravdu chcete TRVALE smazat svůj účet?
                  </div>
                  <div style={styles.confirmButtons}>
                    <button style={styles.cancelButton} onClick={cancelDelete}>
                      Zrušit
                    </button>
                    <button
                      style={{...styles.confirmButton, background: '#dc2626'}}
                      onClick={handleDeleteAccount}
                    >
                      Ano, smazat účet
                    </button>
                  </div>
                </>
              )}
              {deleteStep === 1 && (
                <>
                  <div style={styles.confirmText}>
                    ❌ POSLEDNÍ VAROVÁNÍ!<br/>
                    Váš účet ({playerEmail}) bude TRVALE SMAZÁN.<br/>
                    Ztratíte přístup NAVŽDY. Pokračovat?
                  </div>
                  <div style={styles.confirmButtons}>
                    <button style={styles.cancelButton} onClick={cancelDelete}>
                      Zrušit
                    </button>
                    <button
                      style={{...styles.confirmButton, background: '#dc2626'}}
                      onClick={handleDeleteAccount}
                    >
                      Ano, jsem si jistý
                    </button>
                  </div>
                </>
              )}
              {deleteStep === 2 && (
                <>
                  <div style={styles.confirmText}>
                    🔴 OPRAVDU POSLEDNÍ ŠANCE!<br/>
                    Toto NELZE vrátit zpět. Smazat účet NAVŽDY?
                  </div>
                  <div style={styles.confirmButtons}>
                    <button style={styles.cancelButton} onClick={cancelDelete}>
                      Ne, zachovat účet
                    </button>
                    <button
                      style={{...styles.confirmButton, background: '#991b1b'}}
                      onClick={handleDeleteAccount}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Probíhá...' : 'ANO, SMAZAT TRVALE'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
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
    color: '#f1f5f9',
    overflow: 'auto'
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
  section: {
    padding: '20px',
    borderBottom: '1px solid rgba(45, 212, 191, 0.1)'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '15px',
    color: '#2dd4bf'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  infoItem: {
    background: 'rgba(30, 41, 59, 0.5)',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid rgba(45, 212, 191, 0.2)'
  },
  infoLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    marginBottom: '4px'
  },
  infoValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#f1f5f9'
  },
  errorMessage: {
    margin: '10px 20px',
    padding: '12px',
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    borderRadius: '8px',
    color: '#fca5a5',
    fontSize: '14px'
  },
  dangerCard: {
    background: 'rgba(30, 41, 59, 0.5)',
    border: '2px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '15px'
  },
  dangerHeader: {
    display: 'flex',
    gap: '15px',
    marginBottom: '15px'
  },
  dangerIcon: {
    fontSize: '32px'
  },
  dangerTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: '5px'
  },
  dangerDescription: {
    fontSize: '14px',
    color: '#94a3b8'
  },
  dangerButton: {
    width: '100%',
    padding: '12px',
    background: '#ef4444',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  confirmBox: {
    background: 'rgba(15, 23, 42, 0.8)',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid rgba(239, 68, 68, 0.4)'
  },
  confirmText: {
    fontSize: '14px',
    color: '#f1f5f9',
    marginBottom: '15px',
    lineHeight: '1.6'
  },
  confirmButtons: {
    display: 'flex',
    gap: '10px'
  },
  cancelButton: {
    flex: 1,
    padding: '10px',
    background: '#334155',
    border: 'none',
    borderRadius: '8px',
    color: '#f1f5f9',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  confirmButton: {
    flex: 1,
    padding: '10px',
    background: '#ef4444',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};
