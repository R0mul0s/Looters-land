/**
 * Dungeon Class - Manages dungeon state and progression
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import type {
  Dungeon as IDungeon,
  Floor,
  Room,
  Direction,
  RoomEventResult,
  DungeonConfig
} from '../../types/dungeon.types';
import type { Hero } from '../hero/Hero';
import { DungeonGenerator } from './DungeonGenerator';

/**
 * Default Dungeon Configuration
 */
const DEFAULT_CONFIG: DungeonConfig = {
  name: 'The Forgotten Depths',
  startingFloor: 1,
  roomsPerFloor: { min: 8, max: 12 },
  difficultyScaling: 0.3, // 30% stat increase per floor

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
  floors: Floor[];
  currentFloorIndex: number;
  maxFloorReached: number;
  isActive: boolean;
  startTime?: number;

  totalGoldEarned: number = 0;
  totalItemsFound: number = 0;
  totalEnemiesDefeated: number = 0;

  private config: DungeonConfig;

  constructor(config: Partial<DungeonConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.id = `dungeon-${Date.now()}`;
    this.name = this.config.name;
    this.floors = [];
    this.currentFloorIndex = 0;
    this.maxFloorReached = 0;
    this.isActive = false;

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
   * Generate a new floor
   */
  private generateFloor(floorNumber: number): Floor {
    // Progressive room count: increases with floor number
    // Formula: base rooms + (floor - 1) * 0.5 rooms per floor
    // Example: Floor 1 = 4-6 rooms, Floor 5 = 6-8 rooms, Floor 10 = 8-11 rooms
    const baseMin = this.config.roomsPerFloor.min;
    const baseMax = this.config.roomsPerFloor.max;
    const roomsPerFloor = Math.floor((floorNumber - 1) * 0.5);

    const adjustedMin = baseMin + roomsPerFloor;
    const adjustedMax = baseMax + roomsPerFloor;

    const roomCount =
      Math.floor(
        Math.random() * (adjustedMax - adjustedMin + 1)
      ) + adjustedMin;

    const difficulty = 1 + (floorNumber - 1) * this.config.difficultyScaling;

    const floor = DungeonGenerator.generateFloor({
      floorNumber,
      roomCount,
      difficulty,
      guaranteeBoss: floorNumber % 5 === 0, // Boss every 5 floors
      heroLevel: this.config.heroLevel
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
  completeCombat(_heroes: Hero[]): RoomEventResult {
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

    let result: RoomEventResult = {
      success: true,
      message: description
    };

    // Apply effects based on event type
    switch (eventType) {
      case 'positive':
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

      case 'negative':
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
   * Proceed to next floor
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

    this.currentFloorIndex++;
    this.maxFloorReached = Math.max(this.maxFloorReached, this.currentFloorIndex + 1);

    // Generate next floor if it doesn't exist
    if (!this.floors[this.currentFloorIndex]) {
      this.generateFloor(this.currentFloorIndex + 1);
    }

    return {
      success: true,
      message: `Descended to Floor ${this.currentFloorIndex + 1}`,
      floorCompleted: true
    };
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
