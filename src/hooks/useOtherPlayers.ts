/**
 * useOtherPlayers Hook - Real-time tracking of other players on the map
 *
 * Subscribes to profile changes and tracks online players' positions and chat messages.
 * Provides real-time updates when players move or send chat messages.
 *
 * Features:
 * - Real-time position tracking
 * - Online/offline status
 * - Chat message display
 * - Automatic cleanup on unmount
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-18
 */

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface PlayerProfileUpdate {
  id: string;
  nickname?: string;
  player_level?: number;
  combat_power?: number;
  current_world_x?: number;
  current_world_y?: number;
  avatar?: string;
  is_online?: boolean;
  current_chat_message?: string | null;
  chat_message_timestamp?: string | null;
  user_id?: string;
}

export interface OtherPlayer {
  id: string;
  nickname: string;
  level: number;
  combatPower: number;
  x: number;
  y: number;
  avatar?: string; // Player avatar filename (e.g., 'hero1.png')
  isOnline?: boolean; // Whether player is currently online
  chatMessage?: string;
  chatTimestamp?: Date;
}

/**
 * Hook for tracking other online players
 *
 * @param currentUserId - Current user's ID to exclude from list
 * @returns Array of other online players
 *
 * @example
 * ```tsx
 * const otherPlayers = useOtherPlayers(userId);
 * ```
 */
export function useOtherPlayers(currentUserId: string | undefined): OtherPlayer[] {
  const [otherPlayers, setOtherPlayers] = useState<OtherPlayer[]>([]);

  useEffect(() => {
    if (!currentUserId) return;

    // Fetch all players (online and offline) to show their positions with status indicators
    const fetchAllPlayers = async () => {
      console.log('[OtherPlayers] Fetching all players...');
      const { data, error} = await supabase
        .from('player_profiles')
        .select('id, nickname, player_level, combat_power, current_world_x, current_world_y, avatar, current_chat_message, chat_message_timestamp, user_id, is_online')
        .neq('user_id', currentUserId)
        .not('current_world_x', 'is', null)
        .not('current_world_y', 'is', null);

      if (error) {
        console.error('[OtherPlayers] Error fetching online players:', error);
        return;
      }

      const players: OtherPlayer[] = (data || []).map(p => ({
        id: p.id,
        nickname: p.nickname || 'Unknown',
        level: p.player_level || 1,
        combatPower: p.combat_power || 0,
        x: p.current_world_x!,
        y: p.current_world_y!,
        avatar: p.avatar || 'hero1.png',
        isOnline: p.is_online !== false, // Use actual online status from database
        chatMessage: p.current_chat_message || undefined,
        chatTimestamp: p.chat_message_timestamp ? new Date(p.chat_message_timestamp) : undefined
      }));

      console.log('[OtherPlayers] Loaded', players.length, 'players:', players.map(p => `${p.nickname} (${p.isOnline ? 'online' : 'offline'}, CP: ${p.combatPower})`).join(', '));
      setOtherPlayers(players);
    };

    fetchAllPlayers();

    // Subscribe to real-time changes
    // Note: Don't filter by is_online in subscription, because updates to position
    // don't always include is_online field, causing missed notifications
    const channel = supabase
      .channel('online-players')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_profiles'
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const updated = payload.new as PlayerProfileUpdate;

            // Ignore self
            if (updated.user_id === currentUserId) return;

            setOtherPlayers(prev => {
              // Find existing player index
              const existingIndex = prev.findIndex(p => p.id === updated.id);

              // If player doesn't exist yet, ignore updates without position
              if (existingIndex < 0 && (updated.current_world_x == null || updated.current_world_y == null)) {
                console.log('[OtherPlayers] Ignoring new player without position:', updated.nickname);
                return prev;
              }

              // Get existing player data to preserve fields that might be missing in UPDATE
              const existingPlayer = existingIndex >= 0 ? prev[existingIndex] : null;

              // Create updated player data - preserve existing values if new ones are missing
              const updatedPlayer = {
                id: updated.id,
                nickname: updated.nickname || existingPlayer?.nickname || 'Unknown',
                level: updated.player_level ?? existingPlayer?.level ?? 1,
                combatPower: updated.combat_power ?? existingPlayer?.combatPower ?? 0,
                x: updated.current_world_x ?? existingPlayer?.x ?? 0,
                y: updated.current_world_y ?? existingPlayer?.y ?? 0,
                avatar: updated.avatar || existingPlayer?.avatar || 'hero1.png',
                isOnline: updated.is_online !== false, // Show offline players with badge
                chatMessage: updated.current_chat_message ?? existingPlayer?.chatMessage ?? undefined,
                chatTimestamp: updated.chat_message_timestamp
                  ? new Date(updated.chat_message_timestamp)
                  : existingPlayer?.chatTimestamp
              };

              // Debug log to check updates
              console.log('[OtherPlayers] Updating player:', updatedPlayer.nickname,
                'Online:', updatedPlayer.isOnline,
                'CP:', updatedPlayer.combatPower,
                'Pos:', `(${updatedPlayer.x}, ${updatedPlayer.y})`,
                'Existing:', existingIndex >= 0 ? 'Yes' : 'No',
                'Total players before:', prev.length);

              // If player exists, update in place; otherwise add to end
              if (existingIndex >= 0) {
                const newPlayers = [...prev];
                newPlayers[existingIndex] = updatedPlayer;
                console.log('[OtherPlayers] Updated existing player at index', existingIndex, 'Total players after:', newPlayers.length);
                return newPlayers;
              } else {
                const newPlayers = [...prev, updatedPlayer];
                console.log('[OtherPlayers] Added new player. Total players after:', newPlayers.length);
                return newPlayers;
              }
            });
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as PlayerProfileUpdate;
            setOtherPlayers(prev => prev.filter(p => p.id !== deleted.id));
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return otherPlayers;
}
