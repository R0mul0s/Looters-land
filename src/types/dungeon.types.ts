/**
 * Dungeon System Type Definitions
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import type { Hero } from '../engine/hero/Hero';
import type { Enemy } from '../engine/combat/Enemy';
import type { Item } from '../engine/item/Item';

/**
 * Room Types
 */
export type RoomType =
  | 'combat'
  | 'treasure'
  | 'boss'
  | 'trap'
  | 'rest'
  | 'start'
  | 'exit'
  | 'shrine'      // Blessing/buff room
  | 'mystery'     // Random event room
  | 'elite'       // Elite combat room
  | 'miniboss';   // Mini-boss room

/**
 * Room Status
 */
export type RoomStatus = 'unexplored' | 'current' | 'completed' | 'locked';

/**
 * Direction for room connections
 */
export type Direction = 'north' | 'south' | 'east' | 'west';

/**
 * Room Difficulty
 */
export type RoomDifficulty = 'easy' | 'normal' | 'hard' | 'elite';

/**
 * Room Interface
 */
export interface Room {
  id: string;
  type: RoomType;
  status: RoomStatus;
  difficulty: RoomDifficulty;
  position: { x: number; y: number };
  connections: Direction[];

  // Combat room data
  enemies?: Enemy[];
  combatCompleted?: boolean;

  // Treasure room data
  treasureItems?: Item[];
  treasureGold?: number;
  treasureLooted?: boolean;

  // Trap room data
  trapDamage?: number;
  trapDisarmed?: boolean;
  trapDescription?: string;

  // Rest room data
  healAmount?: number;
  restUsed?: boolean;

  // Boss room data
  bossDefeated?: boolean;

  // Shrine room data
  shrineBuffType?: 'damage' | 'xp' | 'gold' | 'stats';
  shrineUsed?: boolean;

  // Mystery room data
  mysteryEventType?: 'positive' | 'negative' | 'neutral';
  mysteryResolved?: boolean;
  mysteryDescription?: string;

  // Elite combat room data (uses enemies and combatCompleted from combat)
  eliteRewards?: { gold: number; items: Item[] };

  // Mini-boss room data (uses enemies and combatCompleted from combat)
  miniBossDefeated?: boolean;
}

/**
 * Floor Interface
 */
export interface Floor {
  floorNumber: number;
  rooms: Room[];
  currentRoomId: string;
  startRoomId: string;
  exitRoomId: string;
  bossRoomId?: string;
  difficulty: number; // Multiplier for enemy stats
  explored: boolean;
  completed: boolean;
  activeBuffs?: Array<'damage' | 'xp' | 'gold' | 'stats'>; // Active shrine buffs for this floor
}

/**
 * Dungeon Interface
 */
export interface Dungeon {
  id: string;
  name: string;
  floors: Floor[];
  currentFloorIndex: number;
  maxFloorReached: number;
  isActive: boolean;
  startTime?: number;

  // Rewards
  totalGoldEarned: number;
  totalItemsFound: number;
  totalEnemiesDefeated: number;
}

/**
 * Dungeon Configuration
 */
export interface DungeonConfig {
  name: string;
  startingFloor: number;
  roomsPerFloor: { min: number; max: number };
  difficultyScaling: number; // How much stats increase per floor
  heroLevel?: number; // Average hero level for loot scaling

  // Room type probabilities (should sum to 1.0)
  roomTypeProbabilities: {
    combat: number;
    treasure: number;
    trap: number;
    rest: number;
  };

  // Difficulty probabilities per floor
  difficultyProbabilities: {
    easy: number;
    normal: number;
    hard: number;
    elite: number;
  };
}

/**
 * Room Event Result
 */
export interface RoomEventResult {
  success: boolean;
  message: string;
  rewards?: {
    gold?: number;
    items?: Item[];
    experience?: number;
  };
  damage?: {
    heroes: { hero: Hero; damage: number }[];
  };
  nextRoomId?: string;
  floorCompleted?: boolean;
  dungeonCompleted?: boolean;
}

/**
 * Dungeon Generation Options
 */
export interface DungeonGenerationOptions {
  floorNumber: number;
  roomCount: number;
  difficulty: number;
  guaranteeBoss?: boolean;
  heroLevel?: number;
}

/**
 * Minimap Data
 */
export interface MinimapData {
  rooms: {
    id: string;
    type: RoomType;
    status: RoomStatus;
    position: { x: number; y: number };
    isCurrent: boolean;
  }[];
  currentPosition: { x: number; y: number };
  gridSize: { width: number; height: number };
}
