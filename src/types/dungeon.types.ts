/**
 * Dungeon System Type Definitions
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2026-01-19
 */

import type { Hero } from '../engine/hero/Hero';
import type { Enemy } from '../engine/combat/Enemy';
import type { Item } from '../engine/item/Item';

/**
 * Dungeon Tier Levels (1-4)
 */
export type TierLevel = 1 | 2 | 3 | 4;

/**
 * Dungeon Tier Names
 */
export type TierName = 'Easy' | 'Normal' | 'Hard' | 'Elite';

/**
 * Dungeon Theme (visual/enemy style)
 */
export type DungeonTheme = 'mines' | 'catacombs' | 'depths' | 'sanctum' | 'lair';

/**
 * Item Rarity for loot tables
 */
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

/**
 * Tier Configuration
 */
export interface DungeonTierConfig {
  tier: TierLevel;
  name: TierName;
  floorsPerTier: number;           // 5
  enemyLevelMultiplier: number;    // 1.0, 1.5, 2.0, 3.0
  lootRarityMin: ItemRarity;       // Minimum rarity for drops
  lootRarityMax: ItemRarity;       // Maximum rarity for drops
  goldMultiplier: number;          // Gold reward multiplier
  bossDropRarity: ItemRarity;      // Guaranteed boss drop rarity
}

/**
 * Dungeon Definition (static configuration)
 */
export interface DungeonDefinition {
  id: string;
  name: string;
  theme: DungeonTheme;
  description: string;
  baseEnemyLevel: number;          // Starting enemy level for tier 1
  tiers: DungeonTierConfig[];
  unlockRequirement?: {
    dungeonId: string;
    tierCompleted: TierLevel;
  };
  // Visual
  icon: string;
  backgroundColor: string;
}

/**
 * Player's progress in a specific dungeon
 */
export interface DungeonProgress {
  dungeonId: string;
  highestTierCompleted: TierLevel | 0;  // 0 = never completed
  tiersUnlocked: TierLevel[];
  totalCompletions: number;
  bestTime?: number;                     // Fastest completion in ms
  lastPlayed?: number;                   // Timestamp
}

/**
 * Tier Run State (active dungeon run)
 */
export interface TierRunState {
  dungeonId: string;
  currentTier: TierLevel;
  currentFloor: number;              // 1-5 within tier
  floorsCompleted: number;
  pendingRewards: {
    gold: number;
    items: Item[];
    experience: number;
  };
  canContinueToNextTier: boolean;    // True after beating tier boss
}

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
  floorNumber: number;               // 1-5 within tier
  tier: TierLevel;                   // Which tier this floor belongs to
  rooms: Room[];
  currentRoomId: string;
  startRoomId: string;
  exitRoomId: string;
  bossRoomId?: string;
  difficulty: number;                // Multiplier for enemy stats
  explored: boolean;
  completed: boolean;
  isTierBossFloor: boolean;          // True for floor 5 of each tier
  activeBuffs?: Array<'damage' | 'xp' | 'gold' | 'stats'>; // Active shrine buffs for this floor
}

/**
 * Dungeon Interface (Runtime state)
 */
export interface Dungeon {
  id: string;
  name: string;
  definitionId: string;            // Reference to DungeonDefinition
  floors: Floor[];
  currentFloorIndex: number;
  maxFloorReached: number;
  isActive: boolean;
  startTime?: number;

  // Tier system
  currentTier: TierLevel;
  tierFloorNumber: number;         // 1-5 within current tier
  tierRunState: TierRunState;

  // Rewards
  totalGoldEarned: number;
  totalItemsFound: number;
  totalEnemiesDefeated: number;
}

/**
 * Dungeon Configuration (for starting a dungeon run)
 */
export interface DungeonConfig {
  name: string;
  definitionId: string;                // Reference to DungeonDefinition
  startingTier: TierLevel;             // Which tier to start
  startingFloor: number;               // Usually 1
  roomsPerFloor: { min: number; max: number };
  difficultyScaling: number;           // How much stats increase per floor
  heroLevel?: number;                  // Average hero level for loot scaling

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
 * Tier completion result
 */
export interface TierCompletionResult {
  tierCompleted: TierLevel;
  rewards: {
    gold: number;
    items: Item[];
    experience: number;
  };
  canContinue: boolean;                // Can continue to next tier?
  nextTier?: TierLevel;
  isLastTier: boolean;
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
  tierCompleted?: boolean;           // Boss of tier 5th floor defeated
  dungeonCompleted?: boolean;        // All 4 tiers completed
  tierCompletionResult?: TierCompletionResult;
}

/**
 * Dungeon Generation Options
 */
export interface DungeonGenerationOptions {
  floorNumber: number;               // 1-5 within tier
  tierFloorNumber: number;           // Same as floorNumber (for clarity)
  tier: TierLevel;                   // Current tier
  tierConfig: DungeonTierConfig;     // Tier configuration
  roomCount: number;
  difficulty: number;
  guaranteeBoss?: boolean;           // True for floor 5 of each tier
  heroLevel?: number;
  baseEnemyLevel: number;            // From DungeonDefinition
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
