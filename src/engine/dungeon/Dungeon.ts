/**
 * Dungeon Class - Manages dungeon state and progression
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2026-01-19
 */

import type {
  Dungeon as IDungeon,
  Floor,
  Room,
  Direction,
  RoomEventResult,
  DungeonConfig,
  TierLevel,
  TierRunState,
  DungeonDefinition,
  TierCompletionResult
} from '../../types/dungeon.types';
import type { Hero } from '../hero/Hero';
import type { Item } from '../item/Item';
import { DungeonGenerator } from './DungeonGenerator';
import { getDungeonDefinition, DUNGEON_TIER_CONFIGS, TIER_REWARDS, getRandomRarityInRange } from '../../config/BALANCE_CONFIG';
import { ItemGenerator } from '../item/ItemGenerator';

/**
 * Default Dungeon Configuration
 */
const DEFAULT_CONFIG: DungeonConfig = {
  name: 'The Forgotten Depths',
  definitionId: 'forgotten-mines',
  startingTier: 1,
  startingFloor: 1,
  roomsPerFloor: { min: 6, max: 8 },
  difficultyScaling: 0.1, // 10% stat increase per floor within tier

  roomTypeProbabilities: {
    combat: 0.5,
    treasure: 0.15,
    trap: 0.2,
    rest: 0.15
  },

  difficultyProbabilities: {
    easy: 0.4,
    normal: 0.35,
    hard: 0.2,
    elite: 0.05
  }
};

/**
 * Dungeon Class
 */
export class Dungeon implements IDungeon {
  id: string;
  name: string;
  definitionId: string;
  floors: Floor[];
  currentFloorIndex: number;
  maxFloorReached: number;
  isActive: boolean;
  startTime?: number;

  // Tier system
  currentTier: TierLevel;
  tierFloorNumber: number;
  tierRunState: TierRunState;

  totalGoldEarned: number = 0;
  totalItemsFound: number = 0;
  totalEnemiesDefeated: number = 0;

  private config: DungeonConfig;
  private definition: DungeonDefinition | undefined;

  constructor(config: Partial<DungeonConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.id = `dungeon-${Date.now()}`;
    this.name = this.config.name;
    this.definitionId = this.config.definitionId || 'forgotten-mines';
    this.floors = [];
    this.currentFloorIndex = 0;
    this.maxFloorReached = 0;
    this.isActive = false;

    // Load dungeon definition if available
    this.definition = getDungeonDefinition(this.definitionId);

    // Initialize tier system
    this.currentTier = this.config.startingTier || 1;
    this.tierFloorNumber = this.config.startingFloor || 1;
    this.tierRunState = {
      dungeonId: this.definitionId,
      currentTier: this.currentTier,
      currentFloor: this.tierFloorNumber,
      floorsCompleted: 0,
      pendingRewards: {
        gold: 0,
        items: [],
        experience: 0
      },
      canContinueToNextTier: false
    };

    // Generate first floor
    this.generateFloor(this.config.startingFloor);
  }

  /**
   * Start the dungeon
   */
  start(): void {
    this.isActive = true;
    this.startTime = Date.now();
  }

  /**
   * End the dungeon
   */
  end(): void {
    this.isActive = false;
  }

  /**
   * Generate a new floor using tier-based configuration
   */
  private generateFloor(floorNumber: number): Floor {
    const tierConfig = DUNGEON_TIER_CONFIGS[this.currentTier];
    const baseEnemyLevel = this.definition?.baseEnemyLevel || 5;

    // Progressive room count: slightly increases within tier
    const baseMin = this.config.roomsPerFloor.min;
    const baseMax = this.config.roomsPerFloor.max;
    const roomsPerFloor = Math.floor((this.tierFloorNumber - 1) * 0.3);

    const adjustedMin = baseMin + roomsPerFloor;
    const adjustedMax = baseMax + roomsPerFloor;

    const roomCount =
      Math.floor(
        Math.random() * (adjustedMax - adjustedMin + 1)
      ) + adjustedMin;

    // Difficulty scales within tier (10% per floor)
    const difficulty = 1 + (this.tierFloorNumber - 1) * this.config.difficultyScaling;

    // Boss on floor 5 of each tier
    const isTierBossFloor = this.tierFloorNumber === tierConfig.floorsPerTier;

    const floor = DungeonGenerator.generateFloor({
      floorNumber: this.tierFloorNumber,
      tierFloorNumber: this.tierFloorNumber,
      tier: this.currentTier,
      tierConfig,
      roomCount,
      difficulty,
      guaranteeBoss: isTierBossFloor,
      heroLevel: this.config.heroLevel,
      baseEnemyLevel
    });

    this.floors.push(floor);
    return floor;
  }

  /**
   * Get current floor
   */
  getCurrentFloor(): Floor | null {
    return this.floors[this.currentFloorIndex] || null;
  }

  /**
   * Get current room
   */
  getCurrentRoom(): Room | null {
    const floor = this.getCurrentFloor();
    if (!floor) return null;

    return floor.rooms.find(r => r.id === floor.currentRoomId) || null;
  }

  /**
   * Move to a room in a direction
   */
  moveToRoom(direction: Direction): RoomEventResult {
    const currentRoom = this.getCurrentRoom();
    const currentFloor = this.getCurrentFloor();

    if (!currentRoom || !currentFloor) {
      return {
        success: false,
        message: 'Cannot move - no active room or floor'
      };
    }

    // Check if direction is valid
    if (!currentRoom.connections.includes(direction)) {
      return {
        success: false,
        message: `Cannot move ${direction} - no connection in that direction`
      };
    }

    // Find target room
    const targetPosition = this.getTargetPosition(currentRoom.position, direction);
    const targetRoom = currentFloor.rooms.find(
      r => r.position.x === targetPosition.x && r.position.y === targetPosition.y
    );

    if (!targetRoom) {
      return {
        success: false,
        message: 'Target room not found'
      };
    }

    // Update room status
    currentRoom.status = 'completed';
    targetRoom.status = 'current';
    currentFloor.currentRoomId = targetRoom.id;

    return {
      success: true,
      message: `Moved ${direction} to ${this.getRoomDescription(targetRoom)}`,
      nextRoomId: targetRoom.id
    };
  }

  /**
   * Get target position from direction
   */
  private getTargetPosition(
    current: { x: number; y: number },
    direction: Direction
  ): { x: number; y: number } {
    const delta = {
      north: { x: 0, y: -1 },
      south: { x: 0, y: 1 },
      east: { x: 1, y: 0 },
      west: { x: -1, y: 0 }
    };

    const d = delta[direction];
    return {
      x: current.x + d.x,
      y: current.y + d.y
    };
  }

  /**
   * Complete combat in current room
   */
  completeCombat(): RoomEventResult {
    const currentRoom = this.getCurrentRoom();

    if (!currentRoom) {
      return { success: false, message: 'No active room' };
    }

    if (currentRoom.type !== 'combat' && currentRoom.type !== 'boss' && currentRoom.type !== 'elite' && currentRoom.type !== 'miniboss') {
      return { success: false, message: 'Not a combat room' };
    }

    // Mark combat as completed
    currentRoom.combatCompleted = true;
    if (currentRoom.type === 'boss') {
      currentRoom.bossDefeated = true;
    }
    if (currentRoom.type === 'miniboss') {
      currentRoom.miniBossDefeated = true;
    }

    // Count defeated enemies
    this.totalEnemiesDefeated += currentRoom.enemies?.length || 0;

    return {
      success: true,
      message: currentRoom.type === 'boss' ? 'Boss defeated!' :
               currentRoom.type === 'miniboss' ? 'Mini-Boss defeated!' :
               currentRoom.type === 'elite' ? 'Elite enemies defeated!' :
               'Combat completed!'
    };
  }

  /**
   * Add loot to dungeon statistics (called after combat)
   */
  addLootToStats(gold: number, itemsCount: number): void {
    this.totalGoldEarned += gold;
    this.totalItemsFound += itemsCount;
  }

  /**
   * Loot treasure room
   */
  lootTreasure(): RoomEventResult {
    const currentRoom = this.getCurrentRoom();

    if (!currentRoom) {
      return { success: false, message: 'No active room' };
    }

    if (currentRoom.type !== 'treasure') {
      return { success: false, message: 'Not a treasure room' };
    }

    if (currentRoom.treasureLooted) {
      return { success: false, message: 'Treasure already looted' };
    }

    currentRoom.treasureLooted = true;

    this.totalGoldEarned += currentRoom.treasureGold || 0;
    this.totalItemsFound += currentRoom.treasureItems?.length || 0;

    return {
      success: true,
      message: 'Treasure looted!',
      rewards: {
        gold: currentRoom.treasureGold,
        items: currentRoom.treasureItems
      }
    };
  }

  /**
   * Disarm trap
   */
  disarmTrap(heroes: Hero[], successChance: number = 0.6): RoomEventResult {
    const currentRoom = this.getCurrentRoom();

    if (!currentRoom) {
      return { success: false, message: 'No active room' };
    }

    if (currentRoom.type !== 'trap') {
      return { success: false, message: 'Not a trap room' };
    }

    if (currentRoom.trapDisarmed) {
      return { success: false, message: 'Trap already disarmed' };
    }

    const success = Math.random() < successChance;

    if (success) {
      currentRoom.trapDisarmed = true;
      return {
        success: true,
        message: `Trap disarmed successfully! ${currentRoom.trapDescription}`
      };
    } else {
      // Apply damage to heroes
      const damage = currentRoom.trapDamage || 0;
      const damagedHeroes = heroes.map(hero => {
        const actualDamage = Math.max(1, damage - hero.DEF);
        hero.currentHP = Math.max(0, hero.currentHP - actualDamage);
        if (hero.currentHP === 0) hero.isAlive = false;
        return { hero, damage: actualDamage };
      });

      currentRoom.trapDisarmed = true; // Trap triggered

      return {
        success: false,
        message: `Failed to disarm trap! ${currentRoom.trapDescription}`,
        damage: { heroes: damagedHeroes }
      };
    }
  }

  /**
   * Use rest room
   */
  useRest(heroes: Hero[]): RoomEventResult {
    const currentRoom = this.getCurrentRoom();

    if (!currentRoom) {
      return { success: false, message: 'No active room' };
    }

    if (currentRoom.type !== 'rest') {
      return { success: false, message: 'Not a rest room' };
    }

    if (currentRoom.restUsed) {
      return { success: false, message: 'Rest area already used' };
    }

    const healAmount = currentRoom.healAmount || 0;

    heroes.forEach(hero => {
      if (hero.isAlive) {
        hero.currentHP = Math.min(hero.maxHP, hero.currentHP + healAmount);
      }
    });

    currentRoom.restUsed = true;

    return {
      success: true,
      message: `Party rested and recovered ${healAmount} HP!`
    };
  }

  /**
   * Use shrine room
   */
  useShrine(): RoomEventResult {
    const currentRoom = this.getCurrentRoom();
    const currentFloor = this.getCurrentFloor();

    if (!currentRoom) {
      return { success: false, message: 'No active room' };
    }

    if (currentRoom.type !== 'shrine') {
      return { success: false, message: 'Not a shrine room' };
    }

    if (currentRoom.shrineUsed) {
      return { success: false, message: 'Shrine already used' };
    }

    currentRoom.shrineUsed = true;

    // Add buff to current floor
    const buffType = currentRoom.shrineBuffType || 'damage';
    if (currentFloor) {
      if (!currentFloor.activeBuffs) {
        currentFloor.activeBuffs = [];
      }
      currentFloor.activeBuffs.push(buffType);
    }

    const buffMessages = {
      damage: '⚔️ The shrine grants +10% damage for this floor!',
      xp: '📖 The shrine grants +15% XP for this floor!',
      gold: '💰 The shrine grants +20% gold drops for this floor!',
      stats: '✨ The shrine grants +10% to all stats for this floor!'
    };

    return {
      success: true,
      message: buffMessages[buffType]
    };
  }

  /**
   * Resolve mystery room
   */
  resolveMystery(heroes: Hero[]): RoomEventResult {
    const currentRoom = this.getCurrentRoom();

    if (!currentRoom) {
      return { success: false, message: 'No active room' };
    }

    if (currentRoom.type !== 'mystery') {
      return { success: false, message: 'Not a mystery room' };
    }

    if (currentRoom.mysteryResolved) {
      return { success: false, message: 'Mystery already resolved' };
    }

    currentRoom.mysteryResolved = true;

    const eventType = currentRoom.mysteryEventType || 'neutral';
    const description = currentRoom.mysteryDescription || 'Something mysterious happens...';

    const result: RoomEventResult = {
      success: true,
      message: description
    };

    // Apply effects based on event type
    switch (eventType) {
      case 'positive': {
        // Heal party
        const healAmount = 30 + Math.floor(Math.random() * 20);
        heroes.forEach(hero => {
          if (hero.isAlive) {
            hero.currentHP = Math.min(hero.maxHP, hero.currentHP + healAmount);
          }
        });
        result.message += `\n✨ Your party is healed for ${healAmount} HP!`;
        result.rewards = {
          gold: Math.floor(50 + Math.random() * 100)
        };
        break;
      }

      case 'negative': {
        // Damage party
        const damage = 15 + Math.floor(Math.random() * 20);
        const damagedHeroes = heroes.map(hero => {
          const actualDamage = Math.max(1, damage - hero.DEF);
          hero.currentHP = Math.max(0, hero.currentHP - actualDamage);
          if (hero.currentHP === 0) hero.isAlive = false;
          return { hero, damage: actualDamage };
        });
        result.message += `\n⚠️ Your party takes damage!`;
        result.damage = { heroes: damagedHeroes };
        break;
      }

      case 'neutral':
        // Small gold reward
        result.rewards = {
          gold: Math.floor(20 + Math.random() * 30)
        };
        result.message += '\n💰 You find some gold.';
        break;
    }

    return result;
  }

  /**
   * Proceed to next floor (handles tier progression)
   */
  proceedToNextFloor(): RoomEventResult {
    const currentRoom = this.getCurrentRoom();

    if (!currentRoom || currentRoom.type !== 'exit') {
      return {
        success: false,
        message: 'Must reach exit room to proceed'
      };
    }

    const currentFloor = this.getCurrentFloor();
    if (currentFloor) {
      currentFloor.completed = true;
    }

    // Update tier run state
    this.tierRunState.floorsCompleted++;

    const tierConfig = DUNGEON_TIER_CONFIGS[this.currentTier];
    const isTierBossFloor = this.tierFloorNumber === tierConfig.floorsPerTier;

    // Check if this was the tier boss floor
    if (isTierBossFloor && currentFloor?.isTierBossFloor) {
      // Tier completed! Calculate tier rewards
      const tierRewards = this.calculateTierRewards();

      // Add rewards to pending
      this.tierRunState.pendingRewards.gold += tierRewards.gold;
      this.tierRunState.pendingRewards.items.push(...tierRewards.items);
      this.tierRunState.pendingRewards.experience += tierRewards.experience;

      // Can continue to next tier if not tier 4
      this.tierRunState.canContinueToNextTier = this.currentTier < 4;

      const tierCompletionResult: TierCompletionResult = {
        tierCompleted: this.currentTier,
        rewards: tierRewards,
        canContinue: this.currentTier < 4,
        nextTier: this.currentTier < 4 ? (this.currentTier + 1) as TierLevel : undefined,
        isLastTier: this.currentTier === 4
      };

      return {
        success: true,
        message: `🏆 Tier ${this.currentTier} (${tierConfig.name}) completed!`,
        floorCompleted: true,
        tierCompleted: true,
        dungeonCompleted: this.currentTier === 4,
        tierCompletionResult
      };
    }

    // Not tier boss floor - advance to next floor within tier
    this.currentFloorIndex++;
    this.tierFloorNumber++;
    this.tierRunState.currentFloor = this.tierFloorNumber;
    this.maxFloorReached = Math.max(this.maxFloorReached, this.currentFloorIndex + 1);

    // Generate next floor if it doesn't exist
    if (!this.floors[this.currentFloorIndex]) {
      this.generateFloor(this.tierFloorNumber);
    }

    return {
      success: true,
      message: `Descended to Floor ${this.tierFloorNumber} (Tier ${this.currentTier})`,
      floorCompleted: true
    };
  }

  /**
   * Calculate tier completion rewards based on tier config
   */
  private calculateTierRewards(): { gold: number; items: Item[]; experience: number } {
    const tierConfig = DUNGEON_TIER_CONFIGS[this.currentTier];

    // Base gold with tier multiplier
    const goldBase = TIER_REWARDS.BASE_GOLD[this.currentTier];
    const totalGold = Math.floor(goldBase * tierConfig.goldMultiplier);

    // Experience based on tier
    const experience = TIER_REWARDS.EXPERIENCE[this.currentTier];

    // Generate guaranteed boss drop item
    const items: Item[] = [];
    const bossDropRarity = tierConfig.bossDropRarity;
    const heroLevel = this.config.heroLevel || 1;

    try {
      const bossItem = ItemGenerator.generate(heroLevel + 2, bossDropRarity);
      items.push(bossItem);
    } catch {
      // ItemGenerator may not be fully implemented yet
    }

    // Chance for additional drops based on tier (increases with tier)
    const additionalDropChance = 0.3 + (this.currentTier - 1) * 0.15; // 30%, 45%, 60%, 75%
    if (Math.random() < additionalDropChance) {
      try {
        const bonusRarity = getRandomRarityInRange(
          tierConfig.lootRarityMin,
          tierConfig.lootRarityMax
        );
        const bonusItem = ItemGenerator.generate(heroLevel + 1, bonusRarity);
        items.push(bonusItem);
      } catch {
        // ItemGenerator may not be fully implemented yet
      }
    }

    return { gold: totalGold, items, experience };
  }

  /**
   * Advance to next tier (called after tier completion)
   */
  advanceToNextTier(): RoomEventResult {
    if (!this.tierRunState.canContinueToNextTier) {
      return {
        success: false,
        message: 'Cannot advance - tier not completed or already at max tier'
      };
    }

    if (this.currentTier >= 4) {
      return {
        success: false,
        message: 'Already at maximum tier (Elite)'
      };
    }

    // Advance to next tier
    this.currentTier = (this.currentTier + 1) as TierLevel;
    this.tierFloorNumber = 1;
    this.tierRunState.currentTier = this.currentTier;
    this.tierRunState.currentFloor = 1;
    this.tierRunState.canContinueToNextTier = false;

    // Increment floor index and generate first floor of new tier
    this.currentFloorIndex++;
    this.generateFloor(1);
    this.maxFloorReached = Math.max(this.maxFloorReached, this.currentFloorIndex + 1);

    const tierConfig = DUNGEON_TIER_CONFIGS[this.currentTier];

    return {
      success: true,
      message: `⬆️ Advanced to Tier ${this.currentTier} (${tierConfig.name})!`
    };
  }

  /**
   * Claim pending tier rewards
   */
  claimTierRewards(): { gold: number; items: Item[]; experience: number } {
    const rewards = { ...this.tierRunState.pendingRewards };

    // Add to totals
    this.totalGoldEarned += rewards.gold;
    this.totalItemsFound += rewards.items.length;

    // Clear pending rewards
    this.tierRunState.pendingRewards = {
      gold: 0,
      items: [],
      experience: 0
    };

    return rewards;
  }

  /**
   * Get current tier information
   */
  getTierInfo(): {
    currentTier: TierLevel;
    tierName: string;
    floorInTier: number;
    floorsPerTier: number;
    canAdvance: boolean;
    pendingRewards: { gold: number; items: Item[]; experience: number };
  } {
    const tierConfig = DUNGEON_TIER_CONFIGS[this.currentTier];
    return {
      currentTier: this.currentTier,
      tierName: tierConfig.name,
      floorInTier: this.tierFloorNumber,
      floorsPerTier: tierConfig.floorsPerTier,
      canAdvance: this.tierRunState.canContinueToNextTier,
      pendingRewards: this.tierRunState.pendingRewards
    };
  }

  /**
   * Check if current floor is the tier boss floor
   */
  isTierBossFloor(): boolean {
    const tierConfig = DUNGEON_TIER_CONFIGS[this.currentTier];
    return this.tierFloorNumber === tierConfig.floorsPerTier;
  }

  /**
   * Exit dungeon and collect all rewards (forfeit remaining tiers)
   */
  exitDungeon(): { gold: number; items: Item[]; experience: number } {
    this.isActive = false;
    return this.claimTierRewards();
  }

  /**
   * Get room description
   */
  private getRoomDescription(room: Room): string {
    const descriptions: Record<string, string> = {
      start: 'the entrance',
      combat: 'a combat room',
      treasure: 'a treasure room',
      trap: 'a trapped room',
      rest: 'a rest area',
      boss: 'the boss chamber',
      exit: 'the exit',
      shrine: 'a shrine',
      mystery: 'a mysterious room',
      elite: 'an elite combat room',
      miniboss: 'a mini-boss chamber'
    };

    return descriptions[room.type] || 'an unknown room';
  }

  /**
   * Get active shrine buffs for current floor
   *
   * Returns an array of active buff types that were granted by shrines
   * on the current floor. Buffs persist for the entire floor.
   *
   * @returns Array of active buff types (damage, xp, gold, stats)
   *
   * @example
   * ```typescript
   * const buffs = dungeon.getActiveBuffs();
   * console.log(buffs); // ['damage', 'gold']
   * ```
   */
  getActiveBuffs(): Array<'damage' | 'xp' | 'gold' | 'stats'> {
    const currentFloor = this.getCurrentFloor();
    return currentFloor?.activeBuffs || [];
  }

  /**
   * Check if a specific shrine buff is active on current floor
   *
   * Used to determine if buff modifiers should be applied to
   * combat calculations, XP rewards, or gold drops.
   *
   * @param buffType - Type of buff to check (damage/xp/gold/stats)
   * @returns True if buff is active, false otherwise
   *
   * @example
   * ```typescript
   * if (dungeon.hasActiveBuff('gold')) {
   *   goldAmount = Math.floor(goldAmount * 1.20); // +20% gold
   * }
   * ```
   */
  hasActiveBuff(buffType: 'damage' | 'xp' | 'gold' | 'stats'): boolean {
    return this.getActiveBuffs().includes(buffType);
  }

  /**
   * Get dungeon statistics
   */
  getStatistics(): {
    floorsExplored: number;
    roomsCleared: number;
    enemiesDefeated: number;
    goldEarned: number;
    itemsFound: number;
    timeElapsed: number;
  } {
    const currentFloor = this.getCurrentFloor();
    const roomsCleared = currentFloor
      ? currentFloor.rooms.filter(r => r.status === 'completed').length
      : 0;

    const timeElapsed = this.startTime ? Date.now() - this.startTime : 0;

    return {
      floorsExplored: this.currentFloorIndex + 1,
      roomsCleared,
      enemiesDefeated: this.totalEnemiesDefeated,
      goldEarned: this.totalGoldEarned,
      itemsFound: this.totalItemsFound,
      timeElapsed
    };
  }
}
