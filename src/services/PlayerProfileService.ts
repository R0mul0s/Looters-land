/**
 * Player Profile Service - Handles player profile data
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ENERGY_CONFIG } from '../config/BALANCE_CONFIG';
import { WorldMapGenerator } from '../engine/worldmap/WorldMapGenerator';

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
  combat_power: number; // Total party combat power
  current_world_x: number;
  current_world_y: number;
  world_map_data?: unknown;
  discovered_locations?: string[];
  gacha_summon_count: number;
  gacha_last_free_summon: string | null;
  gacha_pity_summons: number;
  bank_vault_tier: number;
  bank_vault_max_slots: number;
  bank_total_items: number;
  healer_cooldown_until: string | null; // ISO timestamp when healer party heal becomes available
  created_at: string;
  updated_at: string;
  last_login: string;
}

export interface PlayerProfileUpdate {
  nickname?: string;
  avatar?: string;
  player_level?: number;
  experience?: number;
  gold?: number;
  gems?: number;
  energy?: number;
  max_energy?: number;
  combat_power?: number; // Total party combat power
  current_world_x?: number;
  current_world_y?: number;
  world_map_data?: unknown;
  discovered_locations?: string[];
  gacha_summon_count?: number;
  gacha_last_free_summon?: string | null;
  gacha_pity_summons?: number;
  bank_vault_tier?: number;
  bank_vault_max_slots?: number;
  bank_total_items?: number;
  healer_cooldown_until?: string | null;
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
          message: `Failed to get profile: ${error instanceof Error ? error.message : String(error)}`
        };
      }

      return {
        success: true,
        message: 'Profile loaded',
        profile: data as PlayerProfile
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
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
      // Get starting position (random town)
      const startPos = WorldMapGenerator.getStartingPosition(50, 50);

      const { data, error } = await supabase
        .from('player_profiles')
        .insert({
          user_id: userId,
          nickname: nickname || null,
          avatar: 'hero1.png', // Default avatar
          player_level: 1,
          experience: 0,
          gold: 0,
          gems: 100, // Starting gems
          energy: ENERGY_CONFIG.MAX_ENERGY,
          max_energy: ENERGY_CONFIG.MAX_ENERGY,
          current_world_x: startPos.x,
          current_world_y: startPos.y
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          message: `Failed to create profile: ${error instanceof Error ? error.message : String(error)}`
        };
      }

      return {
        success: true,
        message: 'Profile created',
        profile: data as PlayerProfile
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
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
      // Update without .select() or .single() to avoid API issues
      const { error } = await supabase
        .from('player_profiles')
        .update(updates)
        .eq('user_id', userId);

      if (error) {
        console.error('Update profile error:', error);
        return {
          success: false,
          message: `Failed to update profile: ${error instanceof Error ? error.message : String(error)}`
        };
      }

      // Fetch the updated profile separately
      const { data: profile, error: fetchError } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        console.error('Fetch profile error:', fetchError);
        // Update succeeded but fetch failed - still return success
        return {
          success: true,
          message: 'Profile updated (fetch failed)'
        };
      }

      return {
        success: true,
        message: 'Profile updated',
        profile: profile as PlayerProfile
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
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
