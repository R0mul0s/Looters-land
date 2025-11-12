/**
 * Profile Service
 *
 * Manages player profile data including nickname, level, and resources.
 * Supports multiplayer with online presence and chat features.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-10
 */

import { supabase } from '../lib/supabase';
import { ENERGY_CONFIG } from '../config/BALANCE_CONFIG';

// ============================================================================
// TYPES
// ============================================================================

export interface PlayerProfile {
  id: string;
  user_id: string;
  nickname: string | null;
  avatar: string; // Avatar image filename (e.g., 'hero1.png', 'hero2.png')
  player_level: number;
  experience: number;
  gold: number;
  gems: number;
  energy: number;
  max_energy: number;
  current_world_x: number;
  current_world_y: number;
  world_map_data?: any; // JSONB - serialized WorldMap
  discovered_locations?: any[]; // JSONB array
  // Multiplayer fields
  is_online?: boolean;
  last_seen?: string;
  current_map_x?: number;
  current_map_y?: number;
  current_chat_message?: string;
  chat_message_timestamp?: string;
  created_at: string;
  updated_at: string;
  last_login: string;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// PROFILE QUERIES
// ============================================================================

/**
 * Get player profile by user ID
 * @param userId - User ID from auth
 * @returns Service result with player profile
 */
export async function getPlayerProfile(userId: string): Promise<ServiceResult<PlayerProfile>> {
  try {
    const { data, error } = await supabase
      .from('player_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If profile doesn't exist, that's okay (will be created on first save)
      if (error.code === 'PGRST116') {
        return {
          success: true,
          data: undefined,
          message: 'Profile not found'
        };
      }
      throw error;
    }

    return {
      success: true,
      data: data as PlayerProfile
    };
  } catch (error) {
    console.error('Failed to get player profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update player nickname
 * @param userId - User ID
 * @param nickname - New nickname
 * @returns Service result
 */
export async function updateNickname(
  userId: string,
  nickname: string
): Promise<ServiceResult<void>> {
  try {
    // Validate nickname
    if (!nickname || nickname.trim().length < 3) {
      return {
        success: false,
        error: 'Nickname must be at least 3 characters long'
      };
    }

    if (nickname.length > 20) {
      return {
        success: false,
        error: 'Nickname must be 20 characters or less'
      };
    }

    const trimmedNickname = nickname.trim();

    // Check if nickname is already taken
    const { data: existing, error: checkError } = await supabase
      .from('player_profiles')
      .select('user_id')
      .eq('nickname', trimmedNickname)
      .neq('user_id', userId)
      .limit(1);

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      return {
        success: false,
        error: 'Nickname is already taken'
      };
    }

    // Update or insert profile
    const { error } = await supabase
      .from('player_profiles')
      .upsert(
        {
          user_id: userId,
          nickname: trimmedNickname,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id'
        }
      );

    if (error) throw error;

    return {
      success: true,
      message: `Nickname updated to "${trimmedNickname}"`
    };
  } catch (error) {
    console.error('Failed to update nickname:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update player avatar
 * @param userId - User ID
 * @param avatar - Avatar filename (e.g., 'hero1.png', 'hero2.png')
 * @returns Service result
 */
export async function updateAvatar(
  userId: string,
  avatar: string
): Promise<ServiceResult<void>> {
  try {
    // Validate avatar filename
    if (!avatar || !avatar.endsWith('.png')) {
      return {
        success: false,
        error: 'Invalid avatar filename'
      };
    }

    const { error } = await supabase
      .from('player_profiles')
      .upsert(
        {
          user_id: userId,
          avatar: avatar,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id'
        }
      );

    if (error) throw error;

    return {
      success: true,
      message: `Avatar updated to "${avatar}"`
    };
  } catch (error) {
    console.error('Failed to update avatar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update player profile fields
 * @param userId - User ID
 * @param updates - Fields to update
 * @returns Service result
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Omit<PlayerProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase
      .from('player_profiles')
      .upsert(
        {
          user_id: userId,
          ...updates,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id'
        }
      );

    if (error) throw error;

    return {
      success: true,
      message: 'Profile updated successfully'
    };
  } catch (error) {
    console.error('Failed to update profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// DANGEROUS ACTIONS
// ============================================================================

/**
 * Reset Progress - Clears all game data but keeps the account
 * Deletes: heroes, items, inventory, game state, world map data
 * Keeps: user account, email, authentication
 * @returns Service result
 */
export async function resetProgress(): Promise<ServiceResult<void>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Delete all player data in order (respecting foreign keys)
    console.log('🔄 Resetting progress for user:', user.id);

    // 1. Get game_save_id for this user
    const { data: gameSaves, error: gameSaveQueryError } = await supabase
      .from('game_saves')
      .select('id')
      .eq('user_id', user.id);

    if (gameSaveQueryError) {
      console.error('Error querying game saves:', gameSaveQueryError);
      throw new Error(`Failed to query game saves: ${gameSaveQueryError.message}`);
    }

    // 2. If there are game saves, delete all associated data
    if (gameSaves && gameSaves.length > 0) {
      const gameSaveIds = gameSaves.map(save => save.id);

      // Delete heroes (this will cascade delete equipment_slots)
      const { error: heroesError } = await supabase
        .from('heroes')
        .delete()
        .in('game_save_id', gameSaveIds);

      if (heroesError) {
        console.error('Error deleting heroes:', heroesError);
        throw new Error(`Failed to delete heroes: ${heroesError.message}`);
      }

      // Delete inventory items
      const { error: itemsError } = await supabase
        .from('inventory_items')
        .delete()
        .in('game_save_id', gameSaveIds);

      if (itemsError) {
        console.error('Error deleting inventory items:', itemsError);
        throw new Error(`Failed to delete inventory items: ${itemsError.message}`);
      }

      // Delete game saves themselves
      const { error: deleteSaveError } = await supabase
        .from('game_saves')
        .delete()
        .eq('user_id', user.id);

      if (deleteSaveError) {
        console.error('Error deleting game saves:', deleteSaveError);
        throw new Error(`Failed to delete game saves: ${deleteSaveError.message}`);
      }
    }

    // 3. Reset player profile to default values
    const { error: profileError } = await supabase
      .from('player_profiles')
      .update({
        player_level: 1,
        experience: 0,
        gold: 0,
        gems: 0,
        energy: ENERGY_CONFIG.MAX_ENERGY,
        max_energy: ENERGY_CONFIG.MAX_ENERGY,
        current_world_x: 25,
        current_world_y: 25,
        world_map_data: null,
        discovered_locations: [],
        gacha_summon_count: 0,
        gacha_pity_summons: 0,
        gacha_last_free_summon: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Error resetting profile:', profileError);
      throw new Error(`Failed to reset profile: ${profileError.message}`);
    }

    console.log('✅ Progress reset successfully');

    return {
      success: true,
      message: 'Progress reset successfully'
    };
  } catch (error) {
    console.error('Failed to reset progress:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Delete Account - Permanently deletes the user account and ALL associated data
 * This action is IRREVERSIBLE
 * @returns Service result
 */
export async function deleteAccount(): Promise<ServiceResult<void>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    console.log('🗑️ Deleting account for user:', user.id);

    // 1. Get game_save_id for this user
    const { data: gameSaves, error: gameSaveQueryError } = await supabase
      .from('game_saves')
      .select('id')
      .eq('user_id', user.id);

    if (gameSaveQueryError) {
      console.error('Error querying game saves:', gameSaveQueryError);
      throw new Error(`Failed to query game saves: ${gameSaveQueryError.message}`);
    }

    // 2. If there are game saves, delete all associated data
    if (gameSaves && gameSaves.length > 0) {
      const gameSaveIds = gameSaves.map(save => save.id);

      // Delete heroes (this will cascade delete equipment_slots)
      const { error: heroesError } = await supabase
        .from('heroes')
        .delete()
        .in('game_save_id', gameSaveIds);

      if (heroesError) {
        console.error('Error deleting heroes:', heroesError);
        throw new Error(`Failed to delete heroes: ${heroesError.message}`);
      }

      // Delete inventory items
      const { error: itemsError } = await supabase
        .from('inventory_items')
        .delete()
        .in('game_save_id', gameSaveIds);

      if (itemsError) {
        console.error('Error deleting inventory items:', itemsError);
        throw new Error(`Failed to delete inventory items: ${itemsError.message}`);
      }

      // Delete game saves themselves
      const { error: deleteSaveError } = await supabase
        .from('game_saves')
        .delete()
        .eq('user_id', user.id);

      if (deleteSaveError) {
        console.error('Error deleting game saves:', deleteSaveError);
        throw new Error(`Failed to delete game saves: ${deleteSaveError.message}`);
      }
    }

    // 3. Delete player profile
    const { error: profileError } = await supabase
      .from('player_profiles')
      .delete()
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      throw new Error(`Failed to delete profile: ${profileError.message}`);
    }

    // 4. Delete the user account from Supabase Auth
    // NOTE: This requires admin API access. If not available, user must delete via Supabase dashboard
    // or we mark the account as deleted in player_profiles
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

    if (authError) {
      console.warn('Could not delete auth user (may require admin API):', authError);
      // Still return success as game data was deleted
      return {
        success: true,
        message: 'Game data deleted. Please contact support to complete account deletion.'
      };
    }

    console.log('✅ Account deleted successfully');

    return {
      success: true,
      message: 'Account deleted successfully'
    };
  } catch (error) {
    console.error('Failed to delete account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// PROFILE SERVICE EXPORT
// ============================================================================

export const ProfileService = {
  getPlayerProfile,
  updateNickname,
  updateUsername: updateNickname, // Alias for better clarity
  updateProfile,
  resetProgress,
  deleteAccount
};
