/**
 * Profile/Settings Screen Component
 *
 * Displays user profile information and provides dangerous actions:
 * - Reset Progress: Clears all game data (heroes, items, progress) but keeps account
 * - Delete Account: Permanently deletes the user account and all associated data
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React, { useState } from 'react';
import * as AuthService from '../services/AuthService';
import { ProfileService, updateAvatar } from '../services/ProfileService';
import { t, setLanguage, getLanguage, type Language } from '../localization/i18n';
import { AVAILABLE_AVATARS, getAvatarDisplayName } from '../config/AVATAR_CONFIG';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS } from '../styles/tokens';
import { flexBetween, flexColumn } from '../styles/common';
import hero1Img from '../assets/images/hero/hero1.png';
import hero2Img from '../assets/images/hero/hero2.png';
import hero3Img from '../assets/images/hero/hero3.png';
import hero4Img from '../assets/images/hero/hero4.png';
import hero5Img from '../assets/images/hero/hero5.png';

/**
 * ProfileScreen component props
 *
 * @property playerName - Player's display name
 * @property playerEmail - Optional player email address
 * @property playerLevel - Optional player level (defaults to 1)
 * @property playerAvatar - Optional current avatar filename (defaults to 'hero1.png')
 * @property gold - Player's current gold amount
 * @property gems - Player's current gems amount
 * @property heroCount - Total number of heroes in collection
 * @property itemCount - Total number of items in inventory
 * @property onClose - Optional callback when profile screen is closed
 * @property onResetProgress - Optional callback after progress reset completes
 * @property onAccountDeleted - Optional callback after account deletion completes
 */
interface ProfileScreenProps {
  playerName: string;
  playerEmail?: string;
  playerLevel?: number;
  playerAvatar?: string;
  gold: number;
  gems: number;
  heroCount: number;
  itemCount: number;
  onClose?: () => void;
  onResetProgress?: () => void;
  onAccountDeleted?: () => void;
}

/**
 * Profile/Settings Screen Component
 *
 * @description Comprehensive profile management screen displaying player information,
 * avatar selection, language settings, and dangerous account actions.
 * Provides three-step confirmation for destructive operations (reset progress, delete account).
 *
 * Features:
 * - Player profile information display (name, email, level, resources)
 * - Editable username with save/cancel functionality
 * - Avatar selection with 5 hero avatars
 * - Language switcher (English/Czech)
 * - Progress reset (clears game data, keeps account)
 * - Account deletion (permanent, cannot be undone)
 *
 * @param props - Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * <ProfileScreen
 *   playerName="DragonSlayer"
 *   playerEmail="player@example.com"
 *   playerLevel={42}
 *   playerAvatar="hero2.png"
 *   gold={15000}
 *   gems={250}
 *   heroCount={25}
 *   itemCount={150}
 *   onClose={() => console.log('Profile closed')}
 * />
 * ```
 */
export function ProfileScreen({
  playerName,
  playerEmail,
  playerLevel = 1,
  playerAvatar = 'hero1.png',
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
  const [selectedAvatar, setSelectedAvatar] = useState(playerAvatar);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

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

        alert(t('profile.resetProgressSuccess'));

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

        alert(t('profile.deleteAccountSuccess'));

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
   * Handle avatar change
   *
   * @description Saves the selected avatar to the profile
   * @param avatarFilename - Avatar filename (e.g., 'hero1.png')
   *
   * @example
   * ```tsx
   * handleAvatarChange('hero2.png');
   * ```
   */
  const handleAvatarChange = async (avatarFilename: string) => {
    setIsSavingAvatar(true);
    setError(null);

    try {
      const session = await AuthService.getCurrentSession();
      if (!session?.user?.id) {
        setError(t('errors.notLoggedIn'));
        return;
      }

      const result = await updateAvatar(session.user.id, avatarFilename);

      if (result.success) {
        setSelectedAvatar(avatarFilename);
        // Reload to apply avatar change
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setError(result.error || t('errors.avatarUpdateFailed'));
      }
    } catch (err) {
      console.error('Avatar update error:', err);
      setError(t('errors.avatarUpdateFailed'));
    } finally {
      setIsSavingAvatar(false);
    }
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

      {/* Avatar Selection */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>🎭 {t('profile.avatarSectionTitle')}</h3>
        <div style={styles.avatarContainer}>
          <div style={styles.avatarGrid}>
            {AVAILABLE_AVATARS.map((avatar) => {
              const isSelected = selectedAvatar === avatar.filename;
              // Map avatar filename to imported image
              let avatarImage: string;
              switch (avatar.filename) {
                case 'hero2.png':
                  avatarImage = hero2Img;
                  break;
                case 'hero3.png':
                  avatarImage = hero3Img;
                  break;
                case 'hero4.png':
                  avatarImage = hero4Img;
                  break;
                case 'hero5.png':
                  avatarImage = hero5Img;
                  break;
                default:
                  avatarImage = hero1Img;
              }

              return (
                <div
                  key={avatar.id}
                  style={{
                    ...styles.avatarOption,
                    ...(isSelected ? styles.avatarOptionSelected : {}),
                    cursor: isSavingAvatar ? 'not-allowed' : 'pointer',
                    opacity: isSavingAvatar ? 0.6 : 1
                  }}
                  onClick={() => !isSavingAvatar && handleAvatarChange(avatar.filename)}
                >
                  <img
                    src={avatarImage}
                    alt={getAvatarDisplayName(avatar.id)}
                    style={styles.avatarPreview}
                  />
                  <div style={styles.avatarName}>{getAvatarDisplayName(avatar.id)}</div>
                  {isSelected && (
                    <div style={styles.avatarSelectedBadge}>✓ {t('profile.avatarSelectedBadge')}</div>
                  )}
                </div>
              );
            })}
          </div>
          {isSavingAvatar && (
            <div style={styles.savingIndicator}>💾 {t('profile.avatarSaving')}</div>
          )}
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
    ...flexColumn,
    background: `linear-gradient(135deg, ${COLORS.bgSurface} 0%, ${COLORS.bgDarkAlt} 100%)`,
    color: COLORS.textLight,
    overflow: 'auto'
  },
  header: {
    ...flexBetween,
    padding: SPACING.lg,
    borderBottom: `2px solid ${COLORS.primary}`,
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, transparent 100%)'
  },
  title: {
    margin: 0,
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold
  },
  closeButton: {
    background: COLORS.transparent,
    border: `2px solid ${COLORS.bgSurfaceLight}`,
    color: COLORS.textGray,
    fontSize: FONT_SIZE['2xl'],
    cursor: 'pointer',
    padding: `${SPACING[2]} ${SPACING[4]}`,
    borderRadius: BORDER_RADIUS.md,
    transition: TRANSITIONS.fast
  },
  logoutButton: {
    background: `linear-gradient(135deg, ${COLORS.warning} 0%, ${COLORS.warningDark} 100%)`,
    border: 'none',
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    cursor: 'pointer',
    padding: `${SPACING.sm} ${SPACING[4]}`,
    borderRadius: BORDER_RADIUS.md,
    transition: TRANSITIONS.fast,
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
  },
  editButton: {
    background: COLORS.transparent,
    border: '1px solid rgba(45, 212, 191, 0.4)',
    color: COLORS.primary,
    fontSize: FONT_SIZE.base,
    cursor: 'pointer',
    padding: `${SPACING[1]} ${SPACING[2]}`,
    borderRadius: '6px',
    transition: TRANSITIONS.fast
  },
  nameInput: {
    width: '100%',
    padding: SPACING.sm,
    background: 'rgba(15, 23, 42, 0.8)',
    border: '2px solid rgba(45, 212, 191, 0.4)',
    borderRadius: BORDER_RADIUS.md,
    color: COLORS.textLight,
    fontSize: FONT_SIZE.md,
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  saveButton: {
    flex: 1,
    padding: `${SPACING[2]} ${SPACING[3]}`,
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    border: 'none',
    borderRadius: '6px',
    color: COLORS.white,
    fontSize: FONT_SIZE[13],
    fontWeight: FONT_WEIGHT.semibold,
    cursor: 'pointer',
    transition: TRANSITIONS.fast,
    boxShadow: SHADOWS.glowTeal
  },
  cancelEditButton: {
    flex: 1,
    padding: `${SPACING[2]} ${SPACING[3]}`,
    background: COLORS.bgSurfaceLight,
    border: 'none',
    borderRadius: '6px',
    color: COLORS.textLight,
    fontSize: FONT_SIZE[13],
    fontWeight: FONT_WEIGHT.semibold,
    cursor: 'pointer',
    transition: TRANSITIONS.fast
  },
  section: {
    padding: SPACING.lg,
    borderBottom: '1px solid rgba(45, 212, 191, 0.1)'
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING.md,
    color: COLORS.primary
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: SPACING.md
  },
  infoItem: {
    background: 'rgba(30, 41, 59, 0.5)',
    padding: SPACING[3],
    borderRadius: BORDER_RADIUS.md,
    border: '1px solid rgba(45, 212, 191, 0.2)'
  },
  infoLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textGray,
    marginBottom: SPACING[1]
  },
  infoValue: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textLight
  },
  errorMessage: {
    margin: `${SPACING.sm} ${SPACING.lg}`,
    padding: SPACING[3],
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    borderRadius: BORDER_RADIUS.md,
    color: '#fca5a5',
    fontSize: FONT_SIZE.md
  },
  dangerCard: {
    background: 'rgba(30, 41, 59, 0.5)',
    border: '2px solid rgba(239, 68, 68, 0.3)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md
  },
  dangerHeader: {
    display: 'flex',
    gap: SPACING.md,
    marginBottom: SPACING.md
  },
  dangerIcon: {
    fontSize: FONT_SIZE['4xl']
  },
  dangerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.danger,
    marginBottom: SPACING.xs
  },
  dangerDescription: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textGray
  },
  dangerButton: {
    width: '100%',
    padding: SPACING[3],
    background: COLORS.danger,
    border: 'none',
    borderRadius: BORDER_RADIUS.md,
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    cursor: 'pointer',
    transition: TRANSITIONS.fast
  },
  confirmBox: {
    background: 'rgba(15, 23, 42, 0.8)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    border: '1px solid rgba(239, 68, 68, 0.4)'
  },
  confirmText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
    lineHeight: '1.6'
  },
  confirmButtons: {
    display: 'flex',
    gap: SPACING.sm
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.sm,
    background: COLORS.bgSurfaceLight,
    border: 'none',
    borderRadius: BORDER_RADIUS.md,
    color: COLORS.textLight,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    cursor: 'pointer',
    transition: TRANSITIONS.fast
  },
  confirmButton: {
    flex: 1,
    padding: SPACING.sm,
    background: COLORS.danger,
    border: 'none',
    borderRadius: BORDER_RADIUS.md,
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    cursor: 'pointer',
    transition: TRANSITIONS.fast
  },
  languageContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.md,
    background: 'rgba(30, 41, 59, 0.5)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    border: '1px solid rgba(45, 212, 191, 0.2)'
  },
  languageSelect: {
    flex: 1,
    padding: `${SPACING.sm} ${SPACING.md}`,
    background: 'rgba(15, 23, 42, 0.8)',
    border: '2px solid rgba(45, 212, 191, 0.4)',
    borderRadius: BORDER_RADIUS.md,
    color: COLORS.textLight,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    cursor: 'pointer',
    outline: 'none',
    transition: TRANSITIONS.fast,
    fontFamily: 'inherit'
  },
  avatarContainer: {
    position: 'relative'
  },
  avatarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: SPACING.md,
    padding: SPACING.sm
  },
  avatarOption: {
    background: 'rgba(30, 41, 59, 0.5)',
    border: '2px solid rgba(45, 212, 191, 0.2)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: SPACING.sm,
    transition: TRANSITIONS.base,
    position: 'relative' as const
  },
  avatarOptionSelected: {
    borderColor: COLORS.primary,
    background: 'rgba(45, 212, 191, 0.15)',
    boxShadow: SHADOWS.glowTeal
  },
  avatarPreview: {
    width: '96px',
    height: '96px',
    objectFit: 'contain' as const,
    borderRadius: BORDER_RADIUS.md,
    background: 'rgba(15, 23, 42, 0.6)'
  },
  avatarName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textLight,
    textAlign: 'center' as const
  },
  avatarSelectedBadge: {
    position: 'absolute' as const,
    top: SPACING.sm,
    right: SPACING.sm,
    background: COLORS.primary,
    color: COLORS.bgDarkAlt,
    padding: `${SPACING[1]} ${SPACING[2]}`,
    borderRadius: SPACING[3],
    fontSize: FONT_SIZE[11],
    fontWeight: FONT_WEIGHT.bold
  },
  savingIndicator: {
    textAlign: 'center' as const,
    marginTop: SPACING.sm,
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold
  }
};
