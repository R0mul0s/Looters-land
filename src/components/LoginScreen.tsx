/**
 * Login Screen Component
 *
 * Full-screen authentication UI for user login and registration.
 * Displays before the main game when user is not authenticated.
 *
 * Features:
 * - Email/password login
 * - New user registration
 * - Toggle between login/register modes
 * - Error handling and validation
 * - Responsive design
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import { useState, useEffect } from 'react';
import * as AuthService from '../services/AuthService';
import { t } from '../localization/i18n';
import logo from '../assets/images/logo.png';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT } from '../styles/tokens';

interface LoginScreenProps {
  onLoginSuccess: (userId: string) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load Google Fonts for medieval/fantasy style
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password) {
      setError(t('auth.fillAllFields'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        // Register new user
        const result = await AuthService.register(email, password);

        if (result.success && result.user) {
          alert(result.message);
          // Auto-login after registration
          if (result.session) {
            onLoginSuccess(result.user.id);
          } else {
            // If email confirmation required, switch to login mode
            setIsRegistering(false);
            setError(t('auth.checkEmailConfirmation'));
          }
        } else {
          setError(result.message);
        }
      } else {
        // Login existing user
        const result = await AuthService.login(email, password);

        if (result.success && result.user) {
          onLoginSuccess(result.user.id);
        } else {
          setError(result.message);
        }
      }
    } catch (err: any) {
      setError(err.message || t('auth.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #2c1810 0%, #1a0f0a 50%, #0a0505 100%)',
      fontFamily: '"Cinzel", "Playfair Display", "Georgia", serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 30%, rgba(218, 165, 32, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(139, 69, 19, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }}/>

      <div className="login-container" style={{
        background: 'linear-gradient(145deg, rgba(101, 67, 33, 0.9) 0%, rgba(139, 69, 19, 0.8) 100%)',
        backdropFilter: 'blur(10px)',
        border: '4px solid',
        borderImage: 'linear-gradient(145deg, #DAA520, #8B4513, #DAA520) 1',
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING[7],
        width: '400px',
        maxWidth: '90%',
        boxShadow: '0 15px 50px rgba(218, 165, 32, 0.3), inset 0 2px 10px rgba(255, 215, 0, 0.2), 0 0 30px rgba(139, 69, 19, 0.4)',
        position: 'relative',
        transform: 'perspective(1000px) rotateX(2deg)',
        animation: 'float 3s ease-in-out infinite'
      }}>
        {/* Decorative corner elements */}
        <div className="corner-decoration" style={{
          position: 'absolute',
          top: '-10px',
          left: '-10px',
          width: '30px',
          height: '30px',
          background: 'radial-gradient(circle, #FFD700 0%, #DAA520 100%)',
          borderRadius: '50%',
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.6)'
        }}/>
        <div className="corner-decoration" style={{
          position: 'absolute',
          top: '-10px',
          right: '-10px',
          width: '30px',
          height: '30px',
          background: 'radial-gradient(circle, #FFD700 0%, #DAA520 100%)',
          borderRadius: '50%',
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.6)'
        }}/>
        <div className="corner-decoration" style={{
          position: 'absolute',
          bottom: '-10px',
          left: '-10px',
          width: '30px',
          height: '30px',
          background: 'radial-gradient(circle, #FFD700 0%, #DAA520 100%)',
          borderRadius: '50%',
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.6)'
        }}/>
        <div className="corner-decoration" style={{
          position: 'absolute',
          bottom: '-10px',
          right: '-10px',
          width: '30px',
          height: '30px',
          background: 'radial-gradient(circle, #FFD700 0%, #DAA520 100%)',
          borderRadius: '50%',
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.6)'
        }}/>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: SPACING[6] }}>
          <img
            className="login-logo"
            src={logo}
            alt="Looters Land"
            style={{
              width: '240px',
              height: 'auto',
              marginBottom: SPACING[4],
              filter: 'drop-shadow(0 5px 25px rgba(218, 165, 32, 0.6))',
              animation: 'logoFloat 2s ease-in-out infinite'
            }}
          />
          <h2 className="login-title" style={{
            margin: '0',
            color: '#FFD700',
            fontSize: FONT_SIZE.xl,
            fontWeight: FONT_WEIGHT.bold,
            textShadow: '3px 3px 6px rgba(0, 0, 0, 0.9), 0 0 15px rgba(255, 215, 0, 0.4)',
            letterSpacing: '2px',
            fontFamily: '"Cinzel Decorative", "Playfair Display", "Georgia", serif'
          }}>
            {isRegistering ? 'Join the Adventure!' : 'Welcome Back, Looter!'}
          </h2>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: perspective(1000px) rotateX(2deg) translateY(0px); }
            50% { transform: perspective(1000px) rotateX(2deg) translateY(-10px); }
          }
          @keyframes logoFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }

          @media (max-width: 768px) {
            .login-container {
              padding: 25px !important;
              width: 95% !important;
              margin: 10px;
              animation: none !important;
              transform: none !important;
            }
            .login-logo {
              width: 200px !important;
              margin-bottom: 12px !important;
            }
            .login-title {
              font-size: 18px !important;
              letter-spacing: 1px !important;
              margin-bottom: 25px !important;
            }
            .login-input {
              padding: 12px !important;
              font-size: 16px !important;
            }
            .login-label {
              font-size: 14px !important;
              margin-bottom: 6px !important;
            }
            .login-button {
              padding: 14px !important;
              font-size: 16px !important;
            }
            .corner-decoration {
              width: 20px !important;
              height: 20px !important;
            }
            .toggle-text {
              font-size: 13px !important;
              margin-top: 20px !important;
            }
            .toggle-button {
              font-size: 12px !important;
              padding: 6px 12px !important;
              display: block !important;
              margin: 8px auto 0 !important;
            }
          }

          @media (max-width: 480px) {
            .login-container {
              padding: 20px !important;
              border-width: 3px !important;
              animation: none !important;
              transform: none !important;
            }
            .login-logo {
              width: 160px !important;
              margin-bottom: 10px !important;
            }
            .login-title {
              font-size: 16px !important;
              letter-spacing: 0.5px !important;
              margin-bottom: 20px !important;
            }
            .login-input {
              padding: 10px !important;
              font-size: 14px !important;
            }
            .login-label {
              font-size: 13px !important;
            }
            .login-button {
              padding: 12px !important;
              font-size: 15px !important;
            }
            .corner-decoration {
              width: 15px !important;
              height: 15px !important;
            }
            .toggle-text {
              font-size: 12px !important;
            }
            .toggle-button {
              font-size: 11px !important;
              padding: 5px 10px !important;
            }
          }

          /* Landscape orientation on mobile */
          @media (max-height: 600px) and (orientation: landscape) {
            .login-container {
              padding: 15px !important;
              margin: 5px !important;
            }
            .login-logo {
              width: 120px !important;
              margin-bottom: 8px !important;
            }
            .login-title {
              font-size: 14px !important;
              margin-bottom: 10px !important;
            }
            .login-input, .login-button {
              padding: 8px !important;
              font-size: 13px !important;
            }
            .login-label {
              font-size: 12px !important;
              margin-bottom: 4px !important;
            }
            .toggle-text {
              margin-top: 10px !important;
            }
          }
        `}</style>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: SPACING[4] }}>
            <label className="login-label" style={{
              display: 'block',
              marginBottom: SPACING[1.5],
              color: '#FFD700',
              fontSize: FONT_SIZE.md,
              fontWeight: FONT_WEIGHT.bold,
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
              letterSpacing: '1px'
            }}>
              Email
            </label>
            <input
              className="login-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="your.treasure@map.com"
              style={{
                width: '100%',
                padding: SPACING[3],
                border: '3px solid #8B4513',
                borderRadius: BORDER_RADIUS.lg,
                background: 'rgba(255, 248, 220, 0.95)',
                color: '#2c1810',
                fontSize: FONT_SIZE.base,
                outline: 'none',
                transition: 'all 0.3s',
                boxSizing: 'border-box',
                boxShadow: 'inset 0 2px 5px rgba(0, 0, 0, 0.3)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#DAA520';
                e.target.style.transform = 'scale(1.02)';
                e.target.style.boxShadow = '0 0 15px rgba(218, 165, 32, 0.5), inset 0 2px 5px rgba(0, 0, 0, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#8B4513';
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'inset 0 2px 5px rgba(0, 0, 0, 0.3)';
              }}
            />
          </div>

          <div style={{ marginBottom: SPACING[4] }}>
            <label className="login-label" style={{
              display: 'block',
              marginBottom: SPACING[1.5],
              color: '#FFD700',
              fontSize: FONT_SIZE.md,
              fontWeight: FONT_WEIGHT.bold,
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
              letterSpacing: '1px'
            }}>
              Password
            </label>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: SPACING[3],
                border: '3px solid #8B4513',
                borderRadius: BORDER_RADIUS.lg,
                background: 'rgba(255, 248, 220, 0.95)',
                color: '#2c1810',
                fontSize: FONT_SIZE.base,
                outline: 'none',
                transition: 'all 0.3s',
                boxSizing: 'border-box',
                boxShadow: 'inset 0 2px 5px rgba(0, 0, 0, 0.3)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#DAA520';
                e.target.style.transform = 'scale(1.02)';
                e.target.style.boxShadow = '0 0 15px rgba(218, 165, 32, 0.5), inset 0 2px 5px rgba(0, 0, 0, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#8B4513';
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'inset 0 2px 5px rgba(0, 0, 0, 0.3)';
              }}
            />
          </div>

          {isRegistering && (
            <div style={{ marginBottom: SPACING[4] }}>
              <label className="login-label" style={{
                display: 'block',
                marginBottom: SPACING[1.5],
                color: '#FFD700',
                fontSize: FONT_SIZE.md,
                fontWeight: FONT_WEIGHT.bold,
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
                letterSpacing: '1px'
              }}>
                Confirm Password
              </label>
              <input
                className="login-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: SPACING[3],
                  border: '3px solid #8B4513',
                  borderRadius: BORDER_RADIUS.lg,
                  background: 'rgba(255, 248, 220, 0.95)',
                  color: '#2c1810',
                  fontSize: FONT_SIZE.base,
                  outline: 'none',
                  transition: 'all 0.3s',
                  boxSizing: 'border-box',
                  boxShadow: 'inset 0 2px 5px rgba(0, 0, 0, 0.3)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#DAA520';
                  e.target.style.transform = 'scale(1.02)';
                  e.target.style.boxShadow = '0 0 15px rgba(218, 165, 32, 0.5), inset 0 2px 5px rgba(0, 0, 0, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#8B4513';
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = 'inset 0 2px 5px rgba(0, 0, 0, 0.3)';
                }}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              padding: SPACING[3],
              marginBottom: SPACING[4],
              background: 'linear-gradient(135deg, rgba(139, 0, 0, 0.8), rgba(178, 34, 34, 0.7))',
              border: '3px solid #8B0000',
              borderRadius: BORDER_RADIUS.lg,
              color: '#FFE4E1',
              fontSize: FONT_SIZE.sm,
              fontWeight: FONT_WEIGHT.bold,
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
              boxShadow: '0 4px 15px rgba(139, 0, 0, 0.4)'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            className="login-button"
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: SPACING[3.5],
              border: '4px solid #654321',
              borderRadius: BORDER_RADIUS.xl,
              background: loading
                ? 'linear-gradient(135deg, #666 0%, #444 100%)'
                : 'linear-gradient(135deg, #DAA520 0%, #B8860B 50%, #8B6914 100%)',
              color: loading ? '#999' : COLORS.white,
              fontSize: '17px',
              fontWeight: FONT_WEIGHT.bold,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
              boxShadow: loading
                ? '0 4px 8px rgba(0, 0, 0, 0.3)'
                : '0 8px 20px rgba(218, 165, 32, 0.4), inset 0 2px 5px rgba(255, 255, 255, 0.3)',
              boxSizing: 'border-box',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(218, 165, 32, 0.6), inset 0 2px 5px rgba(255, 255, 255, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(218, 165, 32, 0.4), inset 0 2px 5px rgba(255, 255, 255, 0.3)';
              }
            }}
          >
            {loading ? 'Loading...' : (isRegistering ? 'Start Adventure' : 'Enter Looters Land')}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="toggle-text" style={{
          marginTop: SPACING[4.5],
          textAlign: 'center',
          color: '#FFD700',
          fontSize: FONT_SIZE.md,
          fontWeight: FONT_WEIGHT.bold,
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
        }}>
          {isRegistering ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
          {' '}
          <button
            className="toggle-button"
            onClick={toggleMode}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #CD853F, #8B4513)',
              border: '2px solid #654321',
              borderRadius: BORDER_RADIUS.md,
              padding: `${SPACING[1.5]} ${SPACING[3.5]}`,
              color: '#FFD700',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: FONT_SIZE.sm,
              fontWeight: FONT_WEIGHT.bold,
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.3s',
              marginLeft: SPACING[2],
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 15px rgba(218, 165, 32, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.4)';
              }
            }}
          >
            {isRegistering ? '🔑 Login' : '⚔️ Register'}
          </button>
        </div>
      </div>
    </div>
  );
}
