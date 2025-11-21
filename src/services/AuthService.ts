/**
 * Authentication Service - Supabase Auth Integration
 *
 * Handles user authentication using Supabase Auth.
 * Provides login, registration, logout, and session management.
 *
 * Contains:
 * - Email/password registration
 * - Email/password login
 * - Session management
 * - User state tracking
 * - Auto-restore session on app startup
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-18
 */

import { supabase } from '../lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { sessionManager } from './SessionManager';

/**
 * Authentication result with success/error handling
 */
export interface AuthResult {
  success: boolean;
  message: string;
  user?: User;
  session?: Session;
  error?: AuthError;
}

/**
 * Register new user with email and password
 *
 * Creates a new user account in Supabase Auth.
 * Sends confirmation email if email confirmation is enabled.
 *
 * @param email - User email address
 * @param password - User password (min 6 characters)
 * @returns Authentication result with user data
 *
 * @example
 * ```typescript
 * const result = await AuthService.register('user@example.com', 'password123');
 * if (result.success) {
 *   console.log('User registered:', result.user);
 * }
 * ```
 */
export async function register(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Auto-confirm email for development (no email verification needed)
        emailRedirectTo: undefined,
      }
    });

    if (error) {
      console.error('❌ Registration failed:', error.message);
      return {
        success: false,
        message: error.message,
        error
      };
    }

    if (!data.user) {
      return {
        success: false,
        message: 'Registration failed - no user data returned'
      };
    }

    console.log('✅ User registered successfully:', data.user.email);

    // If session exists, user can login immediately (email confirmation disabled)
    if (data.session) {
      // Note: SessionManager will be initialized by Router with proper callback
      // We don't initialize it here to avoid callback conflicts

      return {
        success: true,
        message: 'Registration successful! You are now logged in.',
        user: data.user,
        session: data.session
      };
    }

    // If no session, email confirmation is required (should not happen in dev mode)
    return {
      success: true,
      message: 'Registration successful! Please check your email to confirm your account.',
      user: data.user,
      session: undefined
    };
  } catch (error: unknown) {
    console.error('❌ Registration error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Registration failed'
    };
  }
}

/**
 * Login existing user with email and password
 *
 * Authenticates user and creates a session.
 * Session is automatically stored in localStorage by Supabase.
 *
 * @param email - User email address
 * @param password - User password
 * @returns Authentication result with user and session data
 *
 * @example
 * ```typescript
 * const result = await AuthService.login('user@example.com', 'password123');
 * if (result.success) {
 *   console.log('Logged in:', result.user?.email);
 * }
 * ```
 */
export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Login failed:', error.message);
      return {
        success: false,
        message: error.message,
        error
      };
    }

    if (!data.user || !data.session) {
      return {
        success: false,
        message: 'Login failed - no session created'
      };
    }

    console.log('✅ User logged in successfully:', data.user.email);

    // Note: SessionManager will be initialized by Router with proper callback
    // We don't initialize it here to avoid callback conflicts

    return {
      success: true,
      message: 'Login successful!',
      user: data.user,
      session: data.session
    };
  } catch (error: unknown) {
    console.error('❌ Login error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Login failed'
    };
  }
}

/**
 * Logout current user
 *
 * Ends the current session and clears stored credentials.
 *
 * @returns Authentication result
 *
 * @example
 * ```typescript
 * const result = await AuthService.logout();
 * if (result.success) {
 *   console.log('Logged out successfully');
 * }
 * ```
 */
export async function logout(): Promise<AuthResult> {
  try {
    // Destroy session manager first
    await sessionManager.destroy();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('❌ Logout failed:', error.message);
      return {
        success: false,
        message: error.message,
        error
      };
    }

    console.log('✅ User logged out successfully');
    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error: unknown) {
    console.error('❌ Logout error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Logout failed'
    };
  }
}

/**
 * Get current user session
 *
 * Retrieves the current authenticated user and session.
 * Returns null if no active session exists.
 * Automatically clears invalid refresh tokens.
 *
 * @returns Current session data or null
 *
 * @example
 * ```typescript
 * const session = await AuthService.getCurrentSession();
 * if (session) {
 *   console.log('User ID:', session.user.id);
 * }
 * ```
 */
export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Failed to get session:', error.message);

      // If refresh token is invalid, clear it
      if (error.message.includes('Invalid Refresh Token') || error.message.includes('Refresh Token Not Found')) {
        console.log('🧹 Clearing invalid refresh token...');
        await supabase.auth.signOut();
      }

      return null;
    }

    return data.session;
  } catch (error) {
    console.error('❌ Session error:', error);
    return null;
  }
}

/**
 * Get current user
 *
 * Retrieves the currently authenticated user.
 * Returns null if no user is logged in.
 *
 * @returns Current user or null
 *
 * @example
 * ```typescript
 * const user = await AuthService.getCurrentUser();
 * if (user) {
 *   console.log('Email:', user.email);
 * }
 * ```
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error('❌ Failed to get user:', error.message);
      return null;
    }

    return data.user;
  } catch (error) {
    console.error('❌ User error:', error);
    return null;
  }
}

/**
 * Subscribe to auth state changes
 *
 * Listens for authentication events (login, logout, token refresh).
 * Useful for updating UI when auth state changes.
 *
 * @param callback - Function called when auth state changes
 * @returns Unsubscribe function
 *
 * @example
 * ```typescript
 * const unsubscribe = AuthService.onAuthStateChange((event, session) => {
 *   if (event === 'SIGNED_IN') {
 *     console.log('User signed in:', session?.user.email);
 *   }
 * });
 *
 * // Later: unsubscribe();
 * ```
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  const { data } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
    callback(event, session);
  });

  return data.subscription.unsubscribe;
}
