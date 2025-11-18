/**
 * Session Manager Service
 *
 * Manages single-session authentication across multiple devices/tabs.
 * Ensures only one active session per user at a time.
 *
 * Features:
 * - Creates unique session ID for each login
 * - Invalidates sessions on other devices/tabs
 * - Real-time session monitoring via Supabase Realtime
 * - Heartbeat mechanism to detect stale sessions
 * - Auto-logout when session is invalidated
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-18
 */

import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Device information for session tracking
 */
interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timestamp: number;
}

/**
 * Session invalidation callback
 */
export type SessionInvalidatedCallback = (reason: string) => void;

/**
 * SessionManager class
 * Singleton pattern to ensure only one instance per app
 */
class SessionManager {
  private static instance: SessionManager;
  private sessionId: string | null = null;
  private userId: string | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private realtimeChannel: RealtimeChannel | null = null;
  private onSessionInvalidated: SessionInvalidatedCallback | null = null;

  // Configuration
  private readonly HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds
  private readonly HEARTBEAT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Initialize session manager for a user
   * Creates new session and invalidates all other sessions
   */
  public async initialize(
    userId: string,
    onSessionInvalidated?: SessionInvalidatedCallback
  ): Promise<boolean> {
    try {
      // Check if already initialized for this user
      if (this.userId === userId && this.sessionId) {
        console.log('⚠️ SessionManager already initialized for this user, skipping');
        // Update callback if provided
        if (onSessionInvalidated) {
          this.onSessionInvalidated = onSessionInvalidated;
        }
        return true;
      }

      // If initialized for different user, destroy first
      if (this.userId && this.userId !== userId) {
        console.log('🔄 Different user detected, destroying old session');
        await this.destroy();
      }

      console.log('🔐 Initializing session manager for user:', userId);

      // Store user ID and callback
      this.userId = userId;
      if (onSessionInvalidated) {
        this.onSessionInvalidated = onSessionInvalidated;
      }

      // Generate unique session ID
      this.sessionId = this.generateSessionId();

      // Get device info
      const deviceInfo = this.getDeviceInfo();

      // Create new session in database (invalidates other sessions)
      const { data, error } = await supabase.rpc('create_new_session', {
        p_user_id: userId,
        p_session_id: this.sessionId,
        p_device_info: deviceInfo
      });

      if (error) {
        console.error('❌ Failed to create session:', error);
        return false;
      }

      console.log('✅ Session created:', data);
      if (data && data.length > 0 && data[0].invalidated_count > 0) {
        console.log(`🔄 Invalidated ${data[0].invalidated_count} other session(s)`);
      }

      // Start real-time monitoring
      this.subscribeToSessionChanges();

      // Start heartbeat
      this.startHeartbeat();

      return true;
    } catch (error) {
      console.error('❌ Session initialization error:', error);
      return false;
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    // Use crypto.randomUUID if available, otherwise fallback
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Get device information for session tracking
   */
  private getDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timestamp: Date.now()
    };
  }

  /**
   * Subscribe to real-time session changes
   * Listens for session invalidations from other devices
   */
  private subscribeToSessionChanges(): void {
    if (!this.userId || !this.sessionId) {
      console.warn('⚠️ Cannot subscribe without userId and sessionId');
      return;
    }

    console.log('👂 Subscribing to session changes for:', this.sessionId);

    // Create unique channel name for this user
    const channelName = `session:${this.userId}`;

    // Subscribe to database changes
    this.realtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_sessions',
          filter: `session_id=eq.${this.sessionId}`
        },
        (payload) => {
          console.log('🔔 Session update received:', payload);

          // Check if our session was invalidated
          if (payload.new && !payload.new.is_active) {
            console.warn('⚠️ Session was invalidated!');
            this.handleSessionInvalidated('You have been logged in from another device/tab');
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
      });
  }

  /**
   * Start heartbeat mechanism
   * Periodically updates last_heartbeat in database
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    console.log('💓 Starting heartbeat...');

    this.heartbeatInterval = setInterval(async () => {
      await this.sendHeartbeat();
    }, this.HEARTBEAT_INTERVAL_MS);

    // Send first heartbeat immediately
    this.sendHeartbeat();
  }

  /**
   * Send heartbeat to server
   * Updates last_heartbeat timestamp and checks if session is still active
   */
  private async sendHeartbeat(): Promise<void> {
    if (!this.sessionId) {
      console.warn('⚠️ Cannot send heartbeat without sessionId');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('update_session_heartbeat', {
        p_session_id: this.sessionId
      });

      if (error) {
        console.error('❌ Heartbeat error:', error);
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];

        if (!result.success) {
          console.error('❌ Heartbeat failed:', result.message);
          return;
        }

        // Check if session is still active
        if (!result.is_still_active) {
          console.warn('⚠️ Session is no longer active (detected via heartbeat)');
          this.handleSessionInvalidated('Your session has expired or was logged in from another device');
        } else {
          console.log('💓 Heartbeat sent successfully');
        }
      }
    } catch (error) {
      console.error('❌ Heartbeat exception:', error);
    }
  }

  /**
   * Handle session invalidation
   * Stops heartbeat, unsubscribes from realtime, and calls callback
   */
  private handleSessionInvalidated(reason: string): void {
    console.warn('🚫 Handling session invalidation:', reason);

    // Stop heartbeat
    this.stopHeartbeat();

    // Unsubscribe from realtime
    this.unsubscribeFromSessionChanges();

    // Call callback if provided
    if (this.onSessionInvalidated) {
      this.onSessionInvalidated(reason);
    }
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      console.log('💔 Stopping heartbeat');
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Unsubscribe from realtime session changes
   */
  private unsubscribeFromSessionChanges(): void {
    if (this.realtimeChannel) {
      console.log('👋 Unsubscribing from session changes');
      this.realtimeChannel.unsubscribe();
      this.realtimeChannel = null;
    }
  }

  /**
   * Cleanup and destroy session
   * Call this on logout
   */
  public async destroy(): Promise<void> {
    console.log('🧹 Destroying session manager');

    // Stop heartbeat
    this.stopHeartbeat();

    // Unsubscribe from realtime
    this.unsubscribeFromSessionChanges();

    // Mark session as inactive and player as offline in database
    if (this.sessionId && this.userId) {
      try {
        const { error: sessionError } = await supabase
          .from('user_sessions')
          .update({ is_active: false })
          .eq('session_id', this.sessionId)
          .eq('user_id', this.userId);

        if (sessionError) {
          console.error('❌ Failed to deactivate session:', sessionError);
        } else {
          console.log('✅ Session deactivated');
        }

        // Mark player as offline in player_profiles
        const { error: playerError } = await supabase
          .from('player_profiles')
          .update({ is_online: false })
          .eq('user_id', this.userId);

        if (playerError) {
          console.error('❌ Failed to mark player offline:', playerError);
        } else {
          console.log('✅ Player marked as offline');
        }
      } catch (error) {
        console.error('❌ Session cleanup error:', error);
      }
    }

    // Clear state
    this.sessionId = null;
    this.userId = null;
    this.onSessionInvalidated = null;
  }

  /**
   * Get current session ID
   */
  public getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Check if session manager is active
   */
  public isActive(): boolean {
    return this.sessionId !== null && this.userId !== null;
  }

  /**
   * Get active sessions for current user (for debugging/UI)
   */
  public async getActiveSessions(): Promise<unknown[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_active_sessions');

      if (error) {
        console.error('❌ Failed to get active sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Get active sessions error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

// Export class for testing
export { SessionManager };
