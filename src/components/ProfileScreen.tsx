/**
 * Profile/Settings Screen Component
 *
 * Displays user profile information and provides dangerous actions:
 * - Reset Progress: Clears all game data (heroes, items, progress) but keeps account
 * - Delete Account: Permanently deletes the user account and all associated data
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-10
 */

import React, { useState } from 'react';
import * as AuthService from '../services/AuthService';
import { ProfileService } from '../services/ProfileService';
import { t, setLanguage, getLanguage, type Language } from '../localization/i18n';

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
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(playerName);
  const [isSavingName, setIsSavingName] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(getLanguage());

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
      setError(t('profile.resetError'));
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
      setError(t('profile.deleteError'));
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

  /**
   * Handle logout
   *
   * @description Logs out the user after confirmation
   * @returns Promise that resolves when logout is complete
   *
   * @example
   * ```tsx
   * handleLogout();
   * ```
   */
  const handleLogout = async () => {
    const confirmed = window.confirm(t('profile.logoutConfirm'));
    if (!confirmed) return;

    try {
      await AuthService.logout();
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
      setError(t('auth.loginFailed'));
    }
  };

  /**
   * Save edited username
   *
   * @description Saves the edited username to the profile
   * @returns Promise that resolves when save is complete
   *
   * @example
   * ```tsx
   * handleSaveUsername();
   * ```
   */
  const handleSaveUsername = async () => {
    if (!editedName.trim()) {
      setError(t('profile.nameEmpty'));
      return;
    }

    setIsSavingName(true);
    setError(null);

    try {
      const session = await AuthService.getCurrentSession();
      if (!session?.user?.id) {
        setError(t('profile.notLoggedIn'));
        return;
      }

      const result = await ProfileService.updateUsername(session.user.id, editedName.trim());

      if (result.success) {
        setIsEditingName(false);
        // Reload to refresh the name everywhere
        window.location.reload();
      } else {
        setError(result.message || t('profile.saveNameFailed'));
      }
    } catch (err) {
      console.error('Save username error:', err);
      setError(t('profile.saveNameError'));
    } finally {
      setIsSavingName(false);
    }
  };

  /**
   * Cancel name editing
   *
   * @description Cancels the name editing mode and resets the edited name
   *
   * @example
   * ```tsx
   * cancelEditName();
   * ```
   */
  const cancelEditName = () => {
    setEditedName(playerName);
    setIsEditingName(false);
    setError(null);
  };

  /**
   * Handle language change
   *
   * @description Changes the application language
   * @param lang - Language code ('en' or 'cs')
   *
   * @example
   * ```tsx
   * handleLanguageChange('cs');
   * ```
   */
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setCurrentLanguage(lang);
    // Reload to apply language changes throughout the app
    window.location.reload();
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>⚙️ {t('profile.title')}</h2>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          <button style={styles.logoutButton} onClick={handleLogout}>
            🚪 {t('profile.logout')}
          </button>
          {onClose && (
            <button style={styles.closeButton} onClick={onClose}>✕</button>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>👤 {t('profile.title')}</h3>
        <div style={styles.infoGrid}>
          <div style={{...styles.infoItem, gridColumn: isEditingName ? '1 / -1' : 'auto'}}>
            <div style={styles.infoLabel}>{t('profile.nameLabel')}</div>
            {!isEditingName ? (
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div style={styles.infoValue}>{playerName}</div>
                <button
                  style={styles.editButton}
                  onClick={() => setIsEditingName(true)}
                  title={t('profile.editName')}
                >
                  ✏️
                </button>
              </div>
            ) : (
              <div style={{marginTop: '8px'}}>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  style={styles.nameInput}
                  placeholder={t('profile.enterNewName')}
                  maxLength={20}
                  autoFocus
                />
                <div style={{display: 'flex', gap: '8px', marginTop: '8px'}}>
                  <button
                    style={styles.saveButton}
                    onClick={handleSaveUsername}
                    disabled={isSavingName || !editedName.trim()}
                  >
                    {isSavingName ? t('profile.saving') : `💾 ${t('profile.saveButton')}`}
                  </button>
                  <button
                    style={styles.cancelEditButton}
                    onClick={cancelEditName}
                    disabled={isSavingName}
                  >
                    ❌ {t('profile.cancelButton')}
                  </button>
                </div>
              </div>
            )}
          </div>
          {playerEmail && (
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>{t('profile.emailLabel')}</div>
              <div style={styles.infoValue}>{playerEmail}</div>
            </div>
          )}
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>{t('profile.levelLabel')}</div>
            <div style={styles.infoValue}>{playerLevel}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>{t('profile.goldLabel')}</div>
            <div style={styles.infoValue}>{gold.toLocaleString()}g</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>{t('profile.gemsLabel')}</div>
            <div style={styles.infoValue}>{gems.toLocaleString()} 💎</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>{t('town.heroRoster')}:</div>
            <div style={styles.infoValue}>{heroCount}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>{t('dungeon.items')}:</div>
            <div style={styles.infoValue}>{itemCount}</div>
          </div>
        </div>
      </div>

      {/* Language Settings */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>🌍 {t('profile.languageSettings')}</h3>
        <div style={styles.languageContainer}>
          <div style={styles.infoLabel}>{t('profile.languageLabel')}:</div>
          <select
            style={styles.languageSelect}
            value={currentLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
          >
            <option value="en">🇬🇧 English</option>
            <option value="cs">🇨🇿 Čeština</option>
          </select>
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
        <h3 style={{...styles.sectionTitle, color: '#ef4444'}}>⚠️ {t('profile.dangerousActions')}</h3>

        {/* Reset Progress */}
        <div style={styles.dangerCard}>
          <div style={styles.dangerHeader}>
            <div style={styles.dangerIcon}>🔄</div>
            <div>
              <div style={styles.dangerTitle}>{t('profile.resetProgressTitle')}</div>
              <div style={styles.dangerDescription}>
                {t('profile.resetProgressDesc')}
              </div>
            </div>
          </div>

          {!showResetConfirm ? (
            <button
              style={styles.dangerButton}
              onClick={() => setShowResetConfirm(true)}
              disabled={isProcessing}
            >
              {t('profile.resetProgressButton')}
            </button>
          ) : (
            <div style={styles.confirmBox}>
              {resetStep === 0 && (
                <>
                  <div style={styles.confirmText}>
                    {t('profile.resetProgressConfirm1')}
                  </div>
                  <div style={styles.confirmButtons}>
                    <button style={styles.cancelButton} onClick={cancelReset}>
                      {t('ui.cancel')}
                    </button>
                    <button style={styles.confirmButton} onClick={handleResetProgress}>
                      {t('profile.yesReset')}
                    </button>
                  </div>
                </>
              )}
              {resetStep === 1 && (
                <>
                  <div style={styles.confirmText}>
                    ⚠️ {t('profile.resetProgressConfirm2Warning')}<br/>
                    • {heroCount} {t('profile.resetProgressConfirm2Heroes')}<br/>
                    • {itemCount} {t('profile.resetProgressConfirm2Items')}<br/>
                    • {t('profile.resetProgressConfirm2AllProgress')}<br/><br/>
                    {t('profile.resetProgressConfirm2Question')}
                  </div>
                  <div style={styles.confirmButtons}>
                    <button style={styles.cancelButton} onClick={cancelReset}>
                      {t('ui.cancel')}
                    </button>
                    <button style={styles.confirmButton} onClick={handleResetProgress}>
                      {t('profile.yesSure')}
                    </button>
                  </div>
                </>
              )}
              {resetStep === 2 && (
                <>
                  <div style={styles.confirmText}>
                    🔴 {t('profile.resetProgressConfirm3')}
                  </div>
                  <div style={styles.confirmButtons}>
                    <button style={styles.cancelButton} onClick={cancelReset}>
                      {t('profile.noCancel')}
                    </button>
                    <button
                      style={{...styles.confirmButton, background: '#dc2626'}}
                      onClick={handleResetProgress}
                      disabled={isProcessing}
                    >
                      {isProcessing ? t('profile.processing') : t('profile.yesDeleteAll')}
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
              <div style={styles.dangerTitle}>{t('profile.deleteAccountTitle')}</div>
              <div style={styles.dangerDescription}>
                {t('profile.deleteAccountDesc')}
              </div>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <button
              style={{...styles.dangerButton, background: '#dc2626'}}
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isProcessing}
            >
              {t('profile.deleteAccountButton')}
            </button>
          ) : (
            <div style={styles.confirmBox}>
              {deleteStep === 0 && (
                <>
                  <div style={styles.confirmText}>
                    {t('profile.deleteAccountConfirm1')}
                  </div>
                  <div style={styles.confirmButtons}>
                    <button style={styles.cancelButton} onClick={cancelDelete}>
                      {t('ui.cancel')}
                    </button>
                    <button
                      style={{...styles.confirmButton, background: '#dc2626'}}
                      onClick={handleDeleteAccount}
                    >
                      {t('profile.yesDeleteAccount')}
                    </button>
                  </div>
                </>
              )}
              {deleteStep === 1 && (
                <>
                  <div style={styles.confirmText}>
                    ❌ {t('profile.deleteAccountConfirm2Warning')}<br/>
                    {t('profile.deleteAccountConfirm2Text', { email: playerEmail })}
                  </div>
                  <div style={styles.confirmButtons}>
                    <button style={styles.cancelButton} onClick={cancelDelete}>
                      {t('ui.cancel')}
                    </button>
                    <button
                      style={{...styles.confirmButton, background: '#dc2626'}}
                      onClick={handleDeleteAccount}
                    >
                      {t('profile.yesSure')}
                    </button>
                  </div>
                </>
              )}
              {deleteStep === 2 && (
                <>
                  <div style={styles.confirmText}>
                    🔴 {t('profile.deleteAccountConfirm3')}
                  </div>
                  <div style={styles.confirmButtons}>
                    <button style={styles.cancelButton} onClick={cancelDelete}>
                      {t('profile.noKeepAccount')}
                    </button>
                    <button
                      style={{...styles.confirmButton, background: '#991b1b'}}
                      onClick={handleDeleteAccount}
                      disabled={isProcessing}
                    >
                      {isProcessing ? t('profile.processing') : t('profile.yesDeletePermanently')}
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
  logoutButton: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    border: 'none',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '10px 16px',
    borderRadius: '8px',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
  },
  editButton: {
    background: 'transparent',
    border: '1px solid rgba(45, 212, 191, 0.4)',
    color: '#2dd4bf',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'all 0.2s'
  },
  nameInput: {
    width: '100%',
    padding: '10px',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '2px solid rgba(45, 212, 191, 0.4)',
    borderRadius: '8px',
    color: '#f1f5f9',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  saveButton: {
    flex: 1,
    padding: '8px 12px',
    background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(45, 212, 191, 0.3)'
  },
  cancelEditButton: {
    flex: 1,
    padding: '8px 12px',
    background: '#334155',
    border: 'none',
    borderRadius: '6px',
    color: '#f1f5f9',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
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
  },
  languageContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    background: 'rgba(30, 41, 59, 0.5)',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid rgba(45, 212, 191, 0.2)'
  },
  languageSelect: {
    flex: 1,
    padding: '10px 15px',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '2px solid rgba(45, 212, 191, 0.4)',
    borderRadius: '8px',
    color: '#f1f5f9',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s',
    fontFamily: 'inherit'
  }
};
