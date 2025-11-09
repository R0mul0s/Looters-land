/**
 * Player Profile Service - Handles player profile data
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface PlayerProfile {
  id: string;
  user_id: string;
  nickname: string | null;
  player_level: number;
  experience: number;
  gold: number;
  gems: number;
  energy: number;
  max_energy: number;
  current_world_x: number;
  current_world_y: number;
  world_map_data?: any;
  discovered_locations?: string[];
  gacha_summon_count: number;
  gacha_last_free_summon: string | null;
  gacha_pity_summons: number;
  created_at: string;
  updated_at: string;
  last_login: string;
}

export interface PlayerProfileUpdate {
  nickname?: string;
  player_level?: number;
  experience?: number;
  gold?: number;
  gems?: number;
  energy?: number;
  max_energy?: number;
  current_world_x?: number;
  current_world_y?: number;
  world_map_data?: any;
  discovered_locations?: string[];
  gacha_summon_count?: number;
  gacha_last_free_summon?: string | null;
  gacha_pity_summons?: number;
}

export class PlayerProfileService {
  /**
   * Get player profile by user ID
   */
  static async getProfile(userId: string): Promise<{
    success: boolean;
    message: string;
    profile?: PlayerProfile;
  }> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Supabase not configured'
      };
    }

    try {
      const { data, error } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If profile doesn't exist, that's ok - we'll create one
        if (error.code === 'PGRST116') {
          return {
            success: true,
            message: 'Profile not found',
            profile: undefined
          };
        }

        return {
          success: false,
          message: `Failed to get profile: ${error.message}`
        };
      }

      return {
        success: true,
        message: 'Profile loaded',
        profile: data as PlayerProfile
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Unexpected error: ${error.message}`
      };
    }
  }

  /**
   * Create new player profile
   */
  static async createProfile(userId: string, nickname?: string): Promise<{
    success: boolean;
    message: string;
    profile?: PlayerProfile;
  }> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Supabase not configured'
      };
    }

    try {
      const { data, error } = await supabase
        .from('player_profiles')
        .insert({
          user_id: userId,
          nickname: nickname || null,
          player_level: 1,
          experience: 0,
          gold: 0,
          gems: 100, // Starting gems
          energy: 100,
          max_energy: 100,
          current_world_x: 25,
          current_world_y: 25
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          message: `Failed to create profile: ${error.message}`
        };
      }

      return {
        success: true,
        message: 'Profile created',
        profile: data as PlayerProfile
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Unexpected error: ${error.message}`
      };
    }
  }

  /**
   * Update player profile
   */
  static async updateProfile(
    userId: string,
    updates: PlayerProfileUpdate
  ): Promise<{
    success: boolean;
    message: string;
    profile?: PlayerProfile;
  }> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Supabase not configured'
      };
    }

    try {
      const { data, error } = await supabase
        .from('player_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          message: `Failed to update profile: ${error.message}`
        };
      }

      return {
        success: true,
        message: 'Profile updated',
        profile: data as PlayerProfile
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Unexpected error: ${error.message}`
      };
    }
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(userId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    try {
      await supabase
        .from('player_profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Failed to update last login:', error);
    }
  }

  /**
   * Check if nickname is available
   */
  static async isNicknameAvailable(nickname: string, currentUserId?: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;

    try {
      let query = supabase
        .from('player_profiles')
        .select('user_id')
        .eq('nickname', nickname);

      if (currentUserId) {
        query = query.neq('user_id', currentUserId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Nickname check error:', error);
        return false;
      }

      return !data || data.length === 0;
    } catch (error) {
      console.error('Nickname check error:', error);
      return false;
    }
  }

  /**
   * Get or create profile - convenience method
   */
  static async getOrCreateProfile(userId: string, nickname?: string): Promise<{
    success: boolean;
    message: string;
    profile?: PlayerProfile;
    isNew?: boolean;
  }> {
    // Try to get existing profile
    const getResult = await this.getProfile(userId);

    if (getResult.success && getResult.profile) {
      // Update last login
      await this.updateLastLogin(userId);

      return {
        ...getResult,
        isNew: false
      };
    }

    // Only create if profile was not found (success but no profile)
    if (getResult.success && !getResult.profile) {
      // Create new profile
      const createResult = await this.createProfile(userId, nickname);

      return {
        ...createResult,
        isNew: true
      };
    }

    // If there was an error getting the profile, return the error
    return {
      success: false,
      message: getResult.message,
      isNew: false
    };
  }
}
