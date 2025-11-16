/**
 * Game Balance Configuration
 *
 * Centralized configuration for all game balance constants and magic numbers.
 * Modify these values to adjust game difficulty and progression rates.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-10
 */

// ============================================================================
// COMBAT SYSTEM
// ============================================================================

export const COMBAT_CONFIG = {
  /** Base critical hit chance percentage (5%) */
  BASE_CRIT_CHANCE: 5,

  /** Critical hit damage multiplier (1.5x) */
  CRIT_DAMAGE_MULTIPLIER: 1.5,

  /** Minimum damage per hit (prevents zero damage) */
  MIN_DAMAGE: 1,

  /** Random initiative bonus range (0-10) */
  INITIATIVE_RANDOM_RANGE: 10,

  /** Auto-combat delay between turns in milliseconds */
  AUTO_COMBAT_DELAY: 1000,

  /** Delay before showing defeat alert (ms) */
  DEFEAT_ALERT_DELAY: 500,
} as const;

// ============================================================================
// DUNGEON SYSTEM
// ============================================================================

export const DUNGEON_CONFIG = {
  /** Rooms per floor configuration by difficulty */
  ROOMS_PER_FLOOR: {
    Easy: { min: 4, max: 6 },
    Medium: { min: 5, max: 8 },
    Hard: { min: 6, max: 10 },
    Nightmare: { min: 8, max: 12 },
  },

  /** Difficulty scaling per floor (10% per floor) - REDUCED for better balance */
  DIFFICULTY_SCALING_PER_FLOOR: 0.10,

  /** Enemy difficulty multipliers by dungeon difficulty - REBALANCED */
  DIFFICULTY_MULTIPLIERS: {
    Easy: 0.6,       // Increased from 0.5 (was too easy)
    Medium: 1.0,     // Unchanged
    Hard: 1.4,       // Reduced from 1.5 (was too hard)
    Nightmare: 1.8,  // Reduced from 2.0 (was brutal)
  },

  /** Enemy probabilities by level difference */
  ENEMY_PROBABILITIES: {
    /** Heroes 3+ levels above dungeon (very easy) */
    veryEasy: {
      easy: 0.7,
      normal: 0.25,
      hard: 0.04,
      elite: 0.01,
    },
    /** Heroes 1-2 levels above dungeon (easy) */
    easy: {
      easy: 0.5,
      normal: 0.35,
      hard: 0.12,
      elite: 0.03,
    },
    /** Around same level (balanced) */
    balanced: {
      easy: 0.3,
      normal: 0.4,
      hard: 0.25,
      elite: 0.05,
    },
    /** Dungeon 2-3 levels above heroes (challenging) */
    challenging: {
      easy: 0.15,
      normal: 0.3,
      hard: 0.4,
      elite: 0.15,
    },
    /** Dungeon 4+ levels above heroes (very hard) */
    veryHard: {
      easy: 0.05,
      normal: 0.2,
      hard: 0.5,
      elite: 0.25,
    },
  },

  /** Level difference thresholds */
  LEVEL_DIFFERENCE_THRESHOLDS: {
    veryEasy: -3,
    easy: -1,
    balanced: 1,
    challenging: 3,
  },

  /** Maximum probability caps after difficulty adjustment */
  MAX_ELITE_PROBABILITY: 0.4,
  MAX_HARD_PROBABILITY: 0.6,
} as const;

// ============================================================================
// ENERGY SYSTEM
// ============================================================================

export const ENERGY_CONFIG = {
  /** Energy regeneration rate per hour */
  REGEN_RATE: 10,

  /** Maximum energy capacity (24 hours worth at 10/hour) */
  MAX_ENERGY: 240,

  /** Energy cost for entering a dungeon */
  DUNGEON_ENTRY_COST: 10,

  /** Energy cost for teleporting to discovered location */
  TELEPORT_COST: 40,

  /** Energy cost multiplier for worldmap movement */
  MOVEMENT_COST_MULTIPLIER: 0.01,

  /** Daily energy reset time (UTC hour) */
  DAILY_RESET_HOUR: 0,
} as const;

// ============================================================================
// WORLDMAP SYSTEM
// ============================================================================

export const WORLDMAP_CONFIG = {
  /** Map dimensions */
  WIDTH: 50,
  HEIGHT: 50,

  /** Number of towns on map */
  TOWN_COUNT: 4,

  /** Number of dungeons on map */
  DUNGEON_COUNT: 5,

  /** Number of portals on map (for fast travel) */
  PORTAL_COUNT: 6,

  /** Number of hidden paths on map */
  HIDDEN_PATH_COUNT: 3,

  /** Number of treasure chests on map */
  TREASURE_CHEST_COUNT: 8,

  /** Number of rare spawn locations on map */
  RARE_SPAWN_COUNT: 4,

  /** Number of wandering monsters */
  WANDERING_MONSTER_COUNT: 10,

  /** Wandering monster respawn time (minutes) */
  WANDERING_MONSTER_RESPAWN: 30,

  /** Number of traveling merchants */
  TRAVELING_MERCHANT_COUNT: 2,

  /** Traveling merchant stay duration (hours) */
  TRAVELING_MERCHANT_DURATION: 4,

  /** Random event spawn chance per hour (%) */
  RANDOM_EVENT_CHANCE: 20,

  /** Portal energy cost */
  PORTAL_ENERGY_COST: 20,

  /** Weather change interval (hours) */
  WEATHER_CHANGE_INTERVAL: 3,

  /** Time of day change interval (hours) - simulates 4 periods per real day */
  TIME_CHANGE_INTERVAL: 6,

  /** Fog of war reveal radius */
  FOG_REVEAL_RADIUS: 2,

  /** Daily map seed reset */
  DAILY_SEED_RESET: true,
} as const;

// ============================================================================
// HERO PROGRESSION
// ============================================================================

export const HERO_CONFIG = {
  /** Starting level for new heroes */
  STARTING_LEVEL: 1,

  /** Maximum hero level */
  MAX_LEVEL: 100,

  /** Base XP required for level 2 */
  BASE_XP_REQUIREMENT: 100,

  /** XP scaling factor per level (exponential growth) */
  XP_SCALING_FACTOR: 1.5,

  /** Stat growth per level */
  STAT_GROWTH: {
    HP: 10,
    ATK: 2,
    DEF: 1,
    SPD: 1,
    CRIT: 0.5,
  },
} as const;

// ============================================================================
// EQUIPMENT SYSTEM
// ============================================================================

export const EQUIPMENT_CONFIG = {
  /** Enchant success rates by level */
  ENCHANT_SUCCESS_RATES: {
    0: 1.0,   // 100% success 0→1
    1: 0.95,  // 95% success 1→2
    2: 0.90,  // 90% success 2→3
    3: 0.80,  // 80% success 3→4
    4: 0.70,  // 70% success 4→5
    5: 0.60,  // 60% success 5→6
    6: 0.50,  // 50% success 6→7
    7: 0.40,  // 40% success 7→8
    8: 0.30,  // 30% success 8→9
    9: 0.20,  // 20% success 9→10
  },

  /** Maximum enchant level */
  MAX_ENCHANT_LEVEL: 10,

  /** Enchant stat bonus per level (%) */
  ENCHANT_STAT_BONUS_PERCENT: 10,

  /** Enchant gold cost base */
  ENCHANT_BASE_COST: 100,

  /** Enchant cost multiplier per level */
  ENCHANT_COST_MULTIPLIER: 1.5,

  /** Equipment slots */
  SLOTS: ['helmet', 'chest', 'legs', 'boots', 'weapon', 'shield', 'accessory'] as const,

  /** Item rarity drop rates */
  RARITY_DROP_RATES: {
    common: 0.50,    // 50%
    uncommon: 0.30,  // 30%
    rare: 0.15,      // 15%
    epic: 0.04,      // 4%
    legendary: 0.01, // 1%
  },
} as const;

// ============================================================================
// INVENTORY SYSTEM
// ============================================================================

export const INVENTORY_CONFIG = {
  /** Default inventory slots */
  DEFAULT_SLOTS: 30,

  /** Maximum inventory slots */
  MAX_SLOTS: 100,

  /** Slot expansion cost base */
  SLOT_EXPANSION_BASE_COST: 1000,

  /** Slot expansion cost multiplier */
  SLOT_EXPANSION_COST_MULTIPLIER: 1.2,
} as const;

// ============================================================================
// AUTO-SAVE SYSTEM
// ============================================================================

export const SAVE_CONFIG = {
  /** Auto-save delay in milliseconds (2 seconds) */
  AUTO_SAVE_DELAY: 2000,

  /** Default save name */
  DEFAULT_SAVE_NAME: 'autosave',

  /** Maximum number of manual saves per user */
  MAX_MANUAL_SAVES: 5,
} as const;

// ============================================================================
// UI CONFIGURATION
// ============================================================================

export const UI_CONFIG = {
  /** Combat log maximum entries displayed */
  COMBAT_LOG_MAX_ENTRIES: 20,

  /** Toast notification duration (ms) */
  TOAST_DURATION: 3000,

  /** Animation durations */
  ANIMATIONS: {
    /** Fade in/out duration */
    FADE_DURATION: 300,
    /** Slide transition duration */
    SLIDE_DURATION: 400,
    /** Modal open/close duration */
    MODAL_DURATION: 250,
  },
} as const;

// ============================================================================
// GACHA SYSTEM (IMPLEMENTED)
// ============================================================================

export const GACHA_CONFIG = {
  /** Daily free summons */
  DAILY_FREE_SUMMONS: 1,

  /** Cost per single summon */
  COST_SINGLE: 1000,

  /** Multi-summon count (10-pull) */
  MULTI_SUMMON_COUNT: 10,

  /** Cost for 10-pull summon (10% discount) */
  COST_TEN: 9000,

  /** Hero rarity rates (percentage values) */
  RATES: {
    common: 60,     // 60%
    rare: 25,       // 25%
    epic: 12,       // 12%
    legendary: 3,   // 3%
  },

  /** Pity system - guaranteed legendary after N summons */
  PITY_THRESHOLD: 100,
} as const;

// ============================================================================
// LEADERBOARD SYSTEM (IMPLEMENTED)
// ============================================================================

export const LEADERBOARD_CONFIG = {
  /** Daily leaderboard reset time (UTC hour) */
  DAILY_RESET_HOUR: 0,

  /** Number of entries to display */
  ENTRIES_DISPLAYED: 100,

  /** Points for dungeon completion */
  DUNGEON_COMPLETION_POINTS: 100,

  /** Points per enemy defeated */
  ENEMY_DEFEAT_POINTS: 10,

  /** Points per boss defeated */
  BOSS_DEFEAT_POINTS: 50,
} as const;

// ============================================================================
// TALENT SYSTEM (PHASE 1 - DUPLICATE MERGING)
// ============================================================================

export const TALENT_CONFIG = {
  /** Maximum talent points per hero */
  MAX_TALENT_POINTS: 6,

  /** Talent points gained per duplicate summon */
  POINTS_PER_DUPLICATE: 1,

  /** Stat bonus per talent point (percentage) */
  STAT_BONUS_PER_POINT: 5,

  /** Whether talent tree is currently enabled (Phase 2 feature) */
  TALENT_TREE_ENABLED: false,

  /** Number of talent tiers (for future talent tree) */
  TALENT_TIERS: 3,

  /** Talents per tier (for future talent tree) */
  TALENTS_PER_TIER: 3,
} as const;

// ============================================================================
// MARKET SYSTEM (IMPLEMENTED)
// ============================================================================

export const MARKET_CONFIG = {
  /** Daily shop inventory size */
  DAILY_SHOP_SIZE: 6,

  /** Sell price multiplier (% of item value) */
  SELL_PRICE_MULTIPLIER: 0.5,

  /** Buy price markup (% above item value) */
  BUY_PRICE_MARKUP: 1.5,

  /** Daily shop reset time (UTC hour) */
  DAILY_RESET_HOUR: 0,

  /** Shop item level range (player level ±2) */
  ITEM_LEVEL_VARIANCE: 2,

  /** Shop item rarity distribution */
  SHOP_RARITY_RATES: {
    common: 0.50,    // 50%
    uncommon: 0.30,  // 30%
    rare: 0.15,      // 15%
    epic: 0.04,      // 4%
    legendary: 0.01, // 1%
  },

  /** Health potion configs */
  POTIONS: {
    SMALL_POTION_HEAL: 50,
    SMALL_POTION_COST: 100,
    MEDIUM_POTION_HEAL: 150,
    MEDIUM_POTION_COST: 250,
    LARGE_POTION_HEAL: 300,
    LARGE_POTION_COST: 500,
  },
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type DungeonDifficulty = keyof typeof DUNGEON_CONFIG.ROOMS_PER_FLOOR;
export type EnemyDifficulty = keyof typeof DUNGEON_CONFIG.ENEMY_PROBABILITIES;
export type EquipmentSlot = typeof EQUIPMENT_CONFIG.SLOTS[number];
export type Rarity = keyof typeof EQUIPMENT_CONFIG.RARITY_DROP_RATES;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate if a value is within acceptable range
 */
export function validateRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get XP required for next level
 */
export function getRequiredXP(level: number): number {
  return Math.floor(
    HERO_CONFIG.BASE_XP_REQUIREMENT * Math.pow(HERO_CONFIG.XP_SCALING_FACTOR, level - 1)
  );
}

/**
 * Get enchant cost for current level
 */
export function getEnchantCost(currentLevel: number): number {
  return Math.floor(
    EQUIPMENT_CONFIG.ENCHANT_BASE_COST *
    Math.pow(EQUIPMENT_CONFIG.ENCHANT_COST_MULTIPLIER, currentLevel)
  );
}

/**
 * Get enchant success rate for current level
 */
export function getEnchantSuccessRate(currentLevel: number): number {
  const rate = EQUIPMENT_CONFIG.ENCHANT_SUCCESS_RATES[currentLevel as keyof typeof EQUIPMENT_CONFIG.ENCHANT_SUCCESS_RATES];
  return rate ?? 0;
}
