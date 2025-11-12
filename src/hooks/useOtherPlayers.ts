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
 * @lastModified 2025-11-09
 */

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface OtherPlayer {
  id: string;
  nickname: string;
  level: number;
  combatPower: number;
  x: number;
  y: number;
  avatar?: string; // Player avatar filename (e.g., 'hero1.png')
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

    // Fetch initial online players
    const fetchOnlinePlayers = async () => {
      const { data, error} = await supabase
        .from('player_profiles')
        .select('id, nickname, player_level, combat_power, current_map_x, current_map_y, avatar, current_chat_message, chat_message_timestamp, user_id')
        .eq('is_online', true)
        .neq('user_id', currentUserId)
        .not('current_map_x', 'is', null)
        .not('current_map_y', 'is', null);

      if (error) {
        console.error('Error fetching online players:', error);
        return;
      }

      const players: OtherPlayer[] = (data || []).map(p => ({
        id: p.id,
        nickname: p.nickname || 'Unknown',
        level: p.player_level || 1,
        combatPower: p.combat_power || 0,
        x: p.current_map_x!,
        y: p.current_map_y!,
        avatar: p.avatar || 'hero1.png',
        chatMessage: p.current_chat_message || undefined,
        chatTimestamp: p.chat_message_timestamp ? new Date(p.chat_message_timestamp) : undefined
      }));

      setOtherPlayers(players);
    };

    fetchOnlinePlayers();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('online-players')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_profiles',
          filter: `is_online=eq.true`
        },
        (payload) => {
          console.log('Player update:', payload);

          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const updated = payload.new as any;

            // Ignore self
            if (updated.user_id === currentUserId) return;

            // Ignore players without map position
            if (updated.current_map_x == null || updated.current_map_y == null) return;

            setOtherPlayers(prev => {
              // If player went offline, remove them
              if (!updated.is_online) {
                return prev.filter(p => p.id !== updated.id);
              }

              // Create updated player data
              const updatedPlayer = {
                id: updated.id,
                nickname: updated.nickname || 'Unknown',
                level: updated.player_level || 1,
                combatPower: updated.combat_power || 0,
                x: updated.current_map_x,
                y: updated.current_map_y,
                avatar: updated.avatar || 'hero1.png',
                chatMessage: updated.current_chat_message || undefined,
                chatTimestamp: updated.chat_message_timestamp
                  ? new Date(updated.chat_message_timestamp)
                  : undefined
              };

              // Debug log to check combat_power
              console.log('Updating player:', updatedPlayer.nickname, 'CP:', updatedPlayer.combatPower, 'Pos:', `(${updatedPlayer.x}, ${updatedPlayer.y})`);

              // Find existing player index
              const existingIndex = prev.findIndex(p => p.id === updated.id);

              // If player exists, update in place; otherwise add to end
              if (existingIndex >= 0) {
                const newPlayers = [...prev];
                newPlayers[existingIndex] = updatedPlayer;
                return newPlayers;
              } else {
                return [...prev, updatedPlayer];
              }
            });
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as any;
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
