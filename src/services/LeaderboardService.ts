/**
 * Leaderboard Service
 *
 * Manages daily leaderboards across 4 categories:
 * - Deepest Floor Reached
 * - Total Gold Earned
 * - Heroes Collected
 * - Combat Power
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-08
 */

import { supabase } from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export type LeaderboardCategory =
  | 'deepest_floor'
  | 'total_gold'
  | 'heroes_collected'
  | 'combat_power';

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  date: string;
  category: LeaderboardCategory;
  rank: number | null;
  score: number;
  player_name: string | null;
  player_level: number | null;
  deepest_floor: number;
  total_gold: number;
  heroes_collected: number;
  combat_power: number;
  dungeon_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardStats {
  current_deepest_floor: number;
  current_total_gold: number;
  current_heroes_collected: number;
  current_combat_power: number;
  best_deepest_floor: number;
  best_total_gold: number;
  best_heroes_collected: number;
  best_combat_power: number;
  last_updated: string;
  last_reset_date: string;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// LEADERBOARD QUERIES
// ============================================================================

/**
 * Get top players for a specific category and date
 * @param category - Leaderboard category
 * @param date - Date string (YYYY-MM-DD), defaults to today
 * @param limit - Number of entries to return (default: 100)
 * @returns Service result with leaderboard entries
 */
export async function getLeaderboard(
  category: LeaderboardCategory,
  date?: string,
  limit: number = 100
): Promise<ServiceResult<LeaderboardEntry[]>> {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_leaderboards')
      .select('*')
      .eq('category', category)
      .eq('date', targetDate)
      .order('score', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      success: true,
      data: data as LeaderboardEntry[]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to get ${category} leaderboard:`, errorMessage);
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Get player's rank and entry for a specific category
 * @param userId - User ID
 * @param category - Leaderboard category
 * @param date - Date string (YYYY-MM-DD), defaults to today
 * @returns Service result with player's leaderboard entry
 */
export async function getPlayerRank(
  userId: string,
  category: LeaderboardCategory,
  date?: string
): Promise<ServiceResult<LeaderboardEntry>> {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_leaderboards')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .eq('date', targetDate)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No entry found
        return {
          success: true,
          data: undefined,
          message: 'No leaderboard entry found for this player'
        };
      }
      throw error;
    }

    return {
      success: true,
      data: data as LeaderboardEntry
    };
  } catch (error) {
    console.error(`Failed to get player rank for ${category}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update player's leaderboard entry
 * @param userId - User ID
 * @param category - Leaderboard category
 * @param score - New score value
 * @param playerName - Player nickname
 * @param playerLevel - Player level
 * @param dungeonName - Name of the dungeon (for deepest_floor category)
 * @param combatPower - Player's combat power (stored in all categories)
 * @returns Service result
 */
export async function updateLeaderboardEntry(
  userId: string,
  category: LeaderboardCategory,
  score: number,
  playerName?: string,
  playerLevel?: number,
  dungeonName?: string,
  combatPower?: number
): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabase.rpc('update_leaderboard_entry', {
      p_user_id: userId,
      p_category: category,
      p_score: score,
      p_player_name: playerName || null,
      p_player_level: playerLevel || 1,
      p_dungeon_name: dungeonName || null,
      p_combat_power: combatPower || 0
    });

    if (error) throw error;

    return {
      success: true,
      message: 'Leaderboard entry updated successfully'
    };
  } catch (error) {
    console.error(`Failed to update leaderboard entry for ${category}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get all leaderboards for a specific date
 * @param date - Date string (YYYY-MM-DD), defaults to today
 * @param limit - Number of entries per category (default: 100)
 * @returns Service result with all 4 leaderboards
 */
export async function getAllLeaderboards(
  date?: string,
  limit: number = 100
): Promise<ServiceResult<Record<LeaderboardCategory, LeaderboardEntry[]>>> {
  try {
    const categories: LeaderboardCategory[] = [
      'deepest_floor',
      'total_gold',
      'heroes_collected',
      'combat_power'
    ];

    const results = await Promise.all(
      categories.map(category => getLeaderboard(category, date, limit))
    );

    const leaderboards: Record<LeaderboardCategory, LeaderboardEntry[]> = {
      deepest_floor: results[0].data || [],
      total_gold: results[1].data || [],
      heroes_collected: results[2].data || [],
      combat_power: results[3].data || []
    };

    return {
      success: true,
      data: leaderboards
    };
  } catch (error) {
    console.error('Failed to get all leaderboards:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get player's stats across all categories
 * @param userId - User ID
 * @returns Service result with player's leaderboard stats
 */
export async function getPlayerStats(
  userId: string
): Promise<ServiceResult<LeaderboardStats>> {
  try {
    const { data, error } = await supabase
      .from('player_leaderboard_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No stats found, create default entry
        return {
          success: true,
          data: {
            current_deepest_floor: 0,
            current_total_gold: 0,
            current_heroes_collected: 0,
            current_combat_power: 0,
            best_deepest_floor: 0,
            best_total_gold: 0,
            best_heroes_collected: 0,
            best_combat_power: 0,
            last_updated: new Date().toISOString(),
            last_reset_date: new Date().toISOString().split('T')[0]
          }
        };
      }
      throw error;
    }

    return {
      success: true,
      data: data as LeaderboardStats
    };
  } catch (error) {
    console.error('Failed to get player stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update all leaderboard categories for a player at once
 * @param userId - User ID
 * @param stats - Object with scores for each category
 * @param playerName - Player nickname
 * @param playerLevel - Player level
 * @returns Service result
 */
export async function updateAllCategories(
  userId: string,
  stats: {
    deepest_floor?: number;
    total_gold?: number;
    heroes_collected?: number;
    combat_power?: number;
  },
  playerName?: string,
  playerLevel?: number
): Promise<ServiceResult<void>> {
  try {
    const categories: Array<{
      category: LeaderboardCategory;
      score: number | undefined;
    }> = [
      { category: 'deepest_floor', score: stats.deepest_floor },
      { category: 'total_gold', score: stats.total_gold },
      { category: 'heroes_collected', score: stats.heroes_collected },
      { category: 'combat_power', score: stats.combat_power }
    ];

    // Update each category that has a value
    const updates = categories
      .filter(cat => cat.score !== undefined)
      .map(cat =>
        updateLeaderboardEntry(
          userId,
          cat.category,
          cat.score!,
          playerName,
          playerLevel
        )
      );

    await Promise.all(updates);

    return {
      success: true,
      message: 'All leaderboard categories updated successfully'
    };
  } catch (error) {
    console.error('Failed to update all categories:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// LEADERBOARD SERVICE EXPORT
// ============================================================================

export const LeaderboardService = {
  getLeaderboard,
  getPlayerRank,
  updateLeaderboardEntry,
  getAllLeaderboards,
  getPlayerStats,
  updateAllCategories
};
