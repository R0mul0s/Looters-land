/**
 * Worldmap Type Definitions
 *
 * Type definitions for the worldmap system including tiles, biomes,
 * static and dynamic objects, and player positions.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-10
 */

// ============================================================================
// TERRAIN & BIOMES
// ============================================================================

export type TerrainType =
  | 'plains'
  | 'forest'
  | 'mountains'
  | 'water'
  | 'road'
  | 'desert'
  | 'swamp';

export type BiomeType =
  | 'kingdom'
  | 'forest_region'
  | 'mountain_region'
  | 'desert_region'
  | 'swamp_region';

export const TERRAIN_ICONS: Record<TerrainType, string> = {
  plains: '🟩',
  forest: '🌲',
  mountains: '⛰️',
  water: '🌊',
  road: '🛤️',
  desert: '🏜️',
  swamp: '🕸️'
};

export const TERRAIN_MOVEMENT_COST: Record<TerrainType, number> = {
  plains: 100,
  forest: 150,
  mountains: 250,
  water: 9999, // Impassable
  road: 75,
  desert: 175,
  swamp: 200
};

// ============================================================================
// TILE
// ============================================================================

export interface Tile {
  x: number;
  y: number;
  terrain: TerrainType;
  biome: BiomeType;
  staticObject: StaticObject | null;
  isExplored: boolean; // Per-player fog of war
  movementCost: number;
}

// ============================================================================
// STATIC OBJECTS (Permanent)
// ============================================================================

export type StaticObjectType = 'town' | 'dungeon' | 'portal' | 'hiddenPath' | 'treasureChest' | 'rareSpawn';

export interface StaticObject {
  id: string;
  type: StaticObjectType;
  position: { x: number; y: number };
  name: string;
}

export interface Town extends StaticObject {
  type: 'town';
  level: 1 | 2 | 3 | 4;
  faction: 'Humans' | 'Elves' | 'Dwarves' | 'Mages' | 'Kingdom' | 'Mountain Dwarves' | 'Desert Nomads' | 'Forest Elves';
  asset?: string; // Asset filename (e.g., 'city2.png', 'city3.png')
  buildings: {
    tavern: boolean;
    smithy: boolean;
    healer: boolean;
    market: boolean;
    bank: boolean;
    guild: boolean;
  };
}

export interface DungeonEntrance extends StaticObject {
  type: 'dungeon';
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Nightmare';
  maxFloors: number;
  recommendedLevel: number;
  theme: string;
}

export interface Portal extends StaticObject {
  type: 'portal';
  linkedPortalId: string | null; // ID of connected portal
  energyCost: number;
}

export interface HiddenPath extends StaticObject {
  type: 'hiddenPath';
  discovered: boolean;
  lootQuality: 'rare' | 'epic' | 'legendary';
  requiredCombatPower: number;
}

export interface TreasureChest extends StaticObject {
  type: 'treasureChest';
  opened: boolean;
  lootQuality: 'common' | 'uncommon' | 'rare' | 'epic';
  goldAmount: number;
}

export interface RareSpawn extends StaticObject {
  type: 'rareSpawn';
  enemyName: string;
  enemyLevel: number;
  guaranteedDrop: 'rare' | 'epic';
  defeated: boolean;
}

// ============================================================================
// DYNAMIC OBJECTS (Spawn/Despawn)
// ============================================================================

export type DynamicObjectType = 'encounter' | 'resource' | 'event' | 'wanderingMonster' | 'travelingMerchant';

export interface DynamicObject {
  id: string;
  type: DynamicObjectType;
  position: { x: number; y: number };
  spawnTime: Date;
  despawnTime?: Date;
  isActive: boolean;
}

export interface MapEncounter extends DynamicObject {
  type: 'encounter';
  enemyLevel: number;
  enemyCount: number;
  difficulty: 'Normal' | 'Elite' | 'Boss';
  defeated: boolean;
}

export interface ResourceNode extends DynamicObject {
  type: 'resource';
  resourceType: 'gold' | 'wood' | 'stone' | 'ore' | 'gems';
  amount: number;
  regenerates: boolean;
  respawnTime?: Date;
}

export interface RandomEvent extends DynamicObject {
  type: 'event';
  eventType: 'RescueNPC' | 'BossFight' | 'TreasureHunt';
  oneTime: boolean;
  completed: boolean;
  reward: {
    gold?: number;
    items?: string[];
    exp?: number;
  };
}

export interface WanderingMonster extends DynamicObject {
  type: 'wanderingMonster';
  enemyName: string;
  enemyLevel: number;
  difficulty: 'Normal' | 'Elite';
  defeated: boolean;
  respawnMinutes: number;
}

export interface TravelingMerchant extends DynamicObject {
  type: 'travelingMerchant';
  merchantName: string;
  inventory: {
    itemType: string;
    price: number;
    rarity: 'uncommon' | 'rare' | 'epic';
  }[];
  staysUntil: Date;
}

// ============================================================================
// PLAYER ON MAP
// ============================================================================

export interface PlayerOnMap {
  userId: string;
  heroName: string;
  heroClass: string;
  position: { x: number; y: number };
  level: number;
  isMoving: boolean;
  isOnline: boolean;
  lastSeen: Date;
}

// ============================================================================
// WEATHER & TIME
// ============================================================================

export type WeatherType = 'clear' | 'rain' | 'storm' | 'fog' | 'snow';
export type TimeOfDay = 'day' | 'night' | 'dawn' | 'dusk';

export interface WeatherState {
  current: WeatherType;
  changesAt: Date;
  next: WeatherType;
  spawnRateModifier: number; // 0.5 = half spawns, 2.0 = double spawns
}

export interface TimeState {
  current: TimeOfDay;
  changesAt: Date;
  next: TimeOfDay;
  enemyModifier: {
    dayEnemies: boolean;
    nightEnemies: boolean;
  };
}

// ============================================================================
// WORLDMAP
// ============================================================================

export interface WorldMap {
  id: string;
  width: number;
  height: number;
  seed: string;
  tiles: Tile[][];
  staticObjects: StaticObject[];
  dynamicObjects: DynamicObject[];
  players: PlayerOnMap[];
  weather: WeatherState;
  timeOfDay: TimeState;
  createdAt: Date;
}

// ============================================================================
// GENERATION OPTIONS
// ============================================================================

export interface WorldMapGenerationOptions {
  width: number;
  height: number;
  seed?: string;
  townCount?: number;
  dungeonCount?: number;
  encounterCount?: number;
  resourceCount?: number;
}

// ============================================================================
// MOVEMENT
// ============================================================================

export interface MovementResult {
  success: boolean;
  message: string;
  newPosition?: { x: number; y: number };
  movementCost?: number;
  remainingMovement?: number;
}

export interface PathNode {
  x: number;
  y: number;
  cost: number;
}
