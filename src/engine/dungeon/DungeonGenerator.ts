/**
 * Dungeon Generator - Procedurally generates dungeon floors with rooms
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import type {
  Room,
  Floor,
  RoomType,
  RoomDifficulty,
  DungeonGenerationOptions
} from '../../types/dungeon.types';
import { generateRandomEnemy } from '../combat/Enemy';
import { ItemGenerator } from '../item/ItemGenerator';

/**
 * Dungeon Generator Class
 */
export class DungeonGenerator {
  /**
   * Generate a complete dungeon floor
   */
  static generateFloor(options: DungeonGenerationOptions): Floor {
    const { floorNumber, roomCount, difficulty, guaranteeBoss = true, heroLevel } = options;

    // Generate rooms
    const rooms: Room[] = [];
    const gridSize = Math.ceil(Math.sqrt(roomCount * 2)); // Sparse grid

    // Create start room
    const startRoom = this.createRoom(
      'start',
      { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) },
      'easy',
      floorNumber,
      difficulty,
      heroLevel
    );
    rooms.push(startRoom);

    // Generate path through dungeon
    const generatedRooms = this.generateRoomPath(
      startRoom.position,
      roomCount - (guaranteeBoss ? 3 : 2), // Account for start, exit, and optional boss
      gridSize,
      floorNumber,
      difficulty,
      heroLevel
    );

    // Connect start room to first generated room
    if (generatedRooms.length > 0) {
      this.connectRooms(startRoom, generatedRooms[0]);
      console.log('🔗 Start room position:', startRoom.position);
      console.log('🔗 First room position:', generatedRooms[0].position);
      console.log('🔗 Distance:', Math.abs(startRoom.position.x - generatedRooms[0].position.x) + Math.abs(startRoom.position.y - generatedRooms[0].position.y));
      console.log('🔗 Start room connections:', startRoom.connections);
      console.log('🔗 First room connections:', generatedRooms[0].connections);
    } else {
      console.error('❌ ERROR: No rooms generated! This will create an inaccessible dungeon.');
    }

    rooms.push(...generatedRooms);

    // Add boss room if guaranteed
    let bossRoomId: string | undefined;
    if (guaranteeBoss) {
      const bossRoom = this.createBossRoom(
        rooms[rooms.length - 1].position,
        gridSize,
        floorNumber,
        difficulty,
        heroLevel
      );
      rooms.push(bossRoom);
      bossRoomId = bossRoom.id;

      // Connect last room to boss room
      this.connectRooms(rooms[rooms.length - 2], bossRoom);
    }

    // Create exit room with unique position
    const exitRoom = this.createRoom(
      'exit',
      { x: 0, y: 0 }, // Temporary position, will be updated by positionExitRoom
      'easy',
      floorNumber,
      difficulty,
      heroLevel
    );
    // Position exit room ensuring it doesn't overlap with any existing room (including boss)
    this.positionExitRoom(exitRoom, rooms[rooms.length - 1], gridSize, rooms);
    rooms.push(exitRoom);

    // Connect last room to exit
    this.connectRooms(rooms[rooms.length - 2], exitRoom);

    // CRITICAL: Create grid-based connections between all adjacent rooms
    // This ensures rooms can navigate to any adjacent room, not just the linear path
    this.createGridConnections(rooms);

    return {
      floorNumber,
      rooms,
      currentRoomId: startRoom.id,
      startRoomId: startRoom.id,
      exitRoomId: exitRoom.id,
      bossRoomId,
      difficulty,
      explored: false,
      completed: false
    };
  }

  /**
   * Generate a path of connected rooms
   */
  private static generateRoomPath(
    startPosition: { x: number; y: number },
    count: number,
    gridSize: number,
    floorNumber: number,
    difficulty: number,
    heroLevel?: number
  ): Room[] {
    const rooms: Room[] = [];
    const occupiedPositions = new Set<string>([`${startPosition.x},${startPosition.y}`]);

    // CRITICAL: Start from a position adjacent to startPosition, not from startPosition itself
    // This ensures the first room is always connected to the start room
    let currentPosition = this.findNextPosition(startPosition, occupiedPositions, gridSize);

    for (let i = 0; i < count; i++) {
      // Determine room type
      const roomType = this.determineRoomType(i, count);
      const roomDifficulty = this.determineRoomDifficulty();

      // Find next valid position
      const nextPosition = this.findNextPosition(currentPosition, occupiedPositions, gridSize);

      // Create room
      const room = this.createRoom(
        roomType,
        nextPosition,
        roomDifficulty,
        floorNumber,
        difficulty,
        heroLevel
      );

      // Connect to previous room if exists
      if (rooms.length > 0) {
        this.connectRooms(rooms[rooms.length - 1], room);
      }

      rooms.push(room);
      occupiedPositions.add(`${nextPosition.x},${nextPosition.y}`);
      currentPosition = nextPosition;
    }

    return rooms;
  }

  /**
   * Create a room
   */
  private static createRoom(
    type: RoomType,
    position: { x: number; y: number },
    difficulty: RoomDifficulty,
    floorNumber: number,
    difficultyMultiplier: number,
    heroLevel?: number
  ): Room {
    const room: Room = {
      id: `${type}-${position.x}-${position.y}-${Date.now()}-${Math.random()}`,
      type,
      status: type === 'start' ? 'current' : 'unexplored',
      difficulty,
      position,
      connections: []
    };

    // Populate room based on type
    switch (type) {
      case 'combat':
        this.populateCombatRoom(room, floorNumber, difficulty, difficultyMultiplier);
        break;
      case 'treasure':
        this.populateTreasureRoom(room, floorNumber, difficultyMultiplier, heroLevel);
        break;
      case 'trap':
        this.populateTrapRoom(room, floorNumber, difficultyMultiplier);
        break;
      case 'rest':
        this.populateRestRoom(room, floorNumber);
        break;
      case 'boss':
        this.populateBossRoom(room, floorNumber, difficultyMultiplier, heroLevel);
        break;
      case 'shrine':
        this.populateShrineRoom(room);
        break;
      case 'mystery':
        this.populateMysteryRoom(room, floorNumber, difficultyMultiplier, heroLevel);
        break;
      case 'elite':
        this.populateEliteRoom(room, floorNumber, difficulty, difficultyMultiplier, heroLevel);
        break;
      case 'miniboss':
        this.populateMiniBossRoom(room, floorNumber, difficultyMultiplier, heroLevel);
        break;
    }

    return room;
  }

  /**
   * Create a boss room
   */
  private static createBossRoom(
    nearPosition: { x: number; y: number },
    gridSize: number,
    floorNumber: number,
    difficulty: number,
    heroLevel?: number
  ): Room {
    // Position boss room away from current position
    const bossPosition = {
      x: Math.min(gridSize - 1, nearPosition.x + 1),
      y: nearPosition.y
    };

    return this.createRoom('boss', bossPosition, 'elite', floorNumber, difficulty, heroLevel);
  }

  /**
   * Position exit room relative to last room
   *
   * Ensures exit room is placed on a unique position that doesn't overlap
   * with existing rooms. Tries to place east of last room first, then
   * checks all adjacent positions if needed.
   *
   * @param exitRoom - The exit room to position
   * @param lastRoom - The last room in the dungeon
   * @param gridSize - Size of the dungeon grid
   * @param existingRooms - Array of all existing rooms (for collision detection)
   *
   * @example
   * ```typescript
   * this.positionExitRoom(exitRoom, lastRoom, 10, allRooms);
   * ```
   */
  private static positionExitRoom(
    exitRoom: Room,
    lastRoom: Room,
    gridSize: number,
    existingRooms: Room[]
  ): void {
    // Create a set of occupied positions for quick lookup
    const occupiedPositions = new Set(
      existingRooms.map(room => `${room.position.x},${room.position.y}`)
    );

    // Try to place exit room to the east of last room
    let candidatePosition = {
      x: Math.min(gridSize - 1, lastRoom.position.x + 1),
      y: lastRoom.position.y
    };

    // If that position is occupied, try other adjacent positions
    const adjacentOffsets = [
      { x: 1, y: 0 },  // East
      { x: 0, y: 1 },  // South
      { x: -1, y: 0 }, // West
      { x: 0, y: -1 }, // North
      { x: 1, y: 1 },  // Southeast
      { x: 1, y: -1 }, // Northeast
      { x: -1, y: 1 }, // Southwest
      { x: -1, y: -1 } // Northwest
    ];

    for (const offset of adjacentOffsets) {
      const testX = lastRoom.position.x + offset.x;
      const testY = lastRoom.position.y + offset.y;

      // Check if position is within grid bounds
      if (testX >= 0 && testX < gridSize && testY >= 0 && testY < gridSize) {
        const posKey = `${testX},${testY}`;
        if (!occupiedPositions.has(posKey)) {
          candidatePosition = { x: testX, y: testY };
          break;
        }
      }
    }

    exitRoom.position = candidatePosition;
  }

  /**
   * Connect two rooms with directions
   */
  private static connectRooms(from: Room, to: Room): void {
    const dx = to.position.x - from.position.x;
    const dy = to.position.y - from.position.y;

    if (dx > 0) {
      if (!from.connections.includes('east')) from.connections.push('east');
      if (!to.connections.includes('west')) to.connections.push('west');
    } else if (dx < 0) {
      if (!from.connections.includes('west')) from.connections.push('west');
      if (!to.connections.includes('east')) to.connections.push('east');
    }

    if (dy > 0) {
      if (!from.connections.includes('south')) from.connections.push('south');
      if (!to.connections.includes('north')) to.connections.push('north');
    } else if (dy < 0) {
      if (!from.connections.includes('north')) from.connections.push('north');
      if (!to.connections.includes('south')) to.connections.push('south');
    }
  }

  /**
   * Create grid-based connections between all adjacent rooms
   * This ensures rooms positioned next to each other in the grid are connected
   */
  private static createGridConnections(rooms: Room[]): void {
    // Create a map of positions to rooms for quick lookup
    const roomMap = new Map<string, Room>();
    rooms.forEach(room => {
      roomMap.set(`${room.position.x},${room.position.y}`, room);
    });

    // For each room, check for adjacent rooms and connect them
    rooms.forEach(room => {
      const { x, y } = room.position;

      // Check all 4 directions
      const adjacentPositions = [
        { x: x + 1, y, direction: 'east' as const },
        { x: x - 1, y, direction: 'west' as const },
        { x, y: y + 1, direction: 'south' as const },
        { x, y: y - 1, direction: 'north' as const }
      ];

      adjacentPositions.forEach(({ x: adjX, y: adjY }) => {
        const adjacentRoom = roomMap.get(`${adjX},${adjY}`);
        if (adjacentRoom) {
          // Connect the rooms if not already connected
          this.connectRooms(room, adjacentRoom);
        }
      });
    });
  }

  /**
   * Find next valid position
   */
  private static findNextPosition(
    current: { x: number; y: number },
    occupied: Set<string>,
    gridSize: number
  ): { x: number; y: number } {
    const directions = [
      { x: 1, y: 0 },  // East
      { x: 0, y: 1 },  // South
      { x: -1, y: 0 }, // West
      { x: 0, y: -1 }  // North
    ];

    // Shuffle directions for variety
    directions.sort(() => Math.random() - 0.5);

    for (const dir of directions) {
      const newPos = {
        x: current.x + dir.x,
        y: current.y + dir.y
      };

      const key = `${newPos.x},${newPos.y}`;

      if (
        newPos.x >= 0 &&
        newPos.x < gridSize &&
        newPos.y >= 0 &&
        newPos.y < gridSize &&
        !occupied.has(key)
      ) {
        return newPos;
      }
    }

    // Fallback: find any free position
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const key = `${x},${y}`;
        if (!occupied.has(key)) {
          return { x, y };
        }
      }
    }

    // Should never reach here
    return current;
  }

  /**
   * Determine room type based on probabilities
   */
  private static determineRoomType(index: number, totalRooms: number): RoomType {
    const rand = Math.random();

    // Higher chance of treasure/rest near middle
    const isMidSection = index > totalRooms * 0.3 && index < totalRooms * 0.7;

    if (rand < 0.35) return 'combat';
    if (rand < 0.50 && isMidSection) return 'treasure';
    if (rand < 0.60) return 'trap';
    if (rand < 0.68 && isMidSection) return 'rest';
    if (rand < 0.75) return 'elite'; // Elite combat
    if (rand < 0.82 && isMidSection) return 'shrine'; // Shrine/blessing
    if (rand < 0.88) return 'mystery'; // Mystery event
    if (rand < 0.93) return 'miniboss'; // Mini-boss
    return 'combat'; // Default to combat
  }

  /**
   * Determine room difficulty
   */
  private static determineRoomDifficulty(): RoomDifficulty {
    const rand = Math.random();
    if (rand < 0.4) return 'easy';
    if (rand < 0.75) return 'normal';
    if (rand < 0.95) return 'hard';
    return 'elite';
  }

  /**
   * Populate combat room
   */
  private static populateCombatRoom(
    room: Room,
    floorNumber: number,
    difficulty: RoomDifficulty,
    difficultyMultiplier: number
  ): void {
    // Calculate enemy level based on floor and room difficulty
    // Base level is floor number, modified by room difficulty
    const difficultyModifier = {
      easy: 0.7,    // 70% of floor level
      normal: 1.0,  // 100% of floor level
      hard: 1.3,    // 130% of floor level
      elite: 1.5    // 150% of floor level
    };

    const baseLevel = floorNumber * difficultyMultiplier;
    const enemyLevel = Math.max(1, Math.floor(baseLevel * difficultyModifier[difficulty]));

    const enemyCount = difficulty === 'easy' ? 1 : difficulty === 'elite' ? 3 : 2;
    const enemyType = difficulty === 'elite' ? 'elite' : 'normal';

    room.enemies = [];
    for (let i = 0; i < enemyCount; i++) {
      room.enemies.push(generateRandomEnemy(enemyLevel, enemyType));
    }

    room.combatCompleted = false;
  }

  /**
   * Populate treasure room
   */
  private static populateTreasureRoom(
    room: Room,
    floorNumber: number,
    difficultyMultiplier: number,
    heroLevel?: number
  ): void {
    // Use hero level if available, otherwise use floor-based calculation
    const floorBasedLevel = Math.max(1, Math.floor(floorNumber * difficultyMultiplier));
    const itemLevel = heroLevel ? Math.max(floorBasedLevel, heroLevel) : floorBasedLevel;

    const itemCount = Math.floor(Math.random() * 2) + 1; // 1-2 items

    room.treasureItems = [];
    for (let i = 0; i < itemCount; i++) {
      const rarities: Array<'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'> = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
      const rarity = rarities[Math.min(Math.floor(Math.random() * 3), rarities.length - 1)]; // Mostly common/uncommon/rare
      room.treasureItems.push(ItemGenerator.generate(itemLevel, rarity));
    }

    room.treasureGold = Math.floor((itemLevel * 50) * (0.8 + Math.random() * 0.4));
    room.treasureLooted = false;
  }

  /**
   * Populate trap room
   */
  private static populateTrapRoom(
    room: Room,
    floorNumber: number,
    difficultyMultiplier: number
  ): void {
    const baseDamage = Math.floor(floorNumber * difficultyMultiplier * 10);
    room.trapDamage = Math.floor(baseDamage * (0.8 + Math.random() * 0.4));
    room.trapDisarmed = false;

    const trapTypes = [
      'A poison dart trap!',
      'A swinging blade trap!',
      'A spike pit trap!',
      'A fire burst trap!',
      'A falling boulder trap!'
    ];

    room.trapDescription = trapTypes[Math.floor(Math.random() * trapTypes.length)];
  }

  /**
   * Populate rest room
   */
  private static populateRestRoom(room: Room, floorNumber: number): void {
    room.healAmount = Math.floor(50 + floorNumber * 10); // Scales with floor
    room.restUsed = false;
  }

  /**
   * Populate boss room
   */
  private static populateBossRoom(
    room: Room,
    floorNumber: number,
    difficultyMultiplier: number,
    heroLevel?: number
  ): void {
    // Boss should be very challenging (1.6x floor level)
    const baseLevel = floorNumber * difficultyMultiplier;
    const bossLevel = Math.max(1, Math.floor(baseLevel * 1.6));

    room.enemies = [generateRandomEnemy(bossLevel, 'boss')];
    room.combatCompleted = false;
    room.bossDefeated = false;
  }

  /**
   * Populate shrine room
   */
  private static populateShrineRoom(room: Room): void {
    const buffTypes: Array<'damage' | 'xp' | 'gold' | 'stats'> = ['damage', 'xp', 'gold', 'stats'];
    room.shrineBuffType = buffTypes[Math.floor(Math.random() * buffTypes.length)];
    room.shrineUsed = false;
  }

  /**
   * Populate mystery room
   */
  private static populateMysteryRoom(
    room: Room,
    floorNumber: number,
    difficultyMultiplier: number,
    heroLevel?: number
  ): void {
    const eventTypes: Array<'positive' | 'negative' | 'neutral'> = ['positive', 'negative', 'neutral'];
    room.mysteryEventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    room.mysteryResolved = false;

    // Generate description based on event type
    const positiveEvents = [
      'A mysterious merchant offers you a gift!',
      'You find a hidden stash of treasures!',
      'An ancient fountain restores your vitality!',
      'A friendly spirit blesses your party!'
    ];

    const negativeEvents = [
      'A cursed artifact drains your strength...',
      'Poisonous gas fills the room!',
      'Dark magic weakens your defenses...',
      'A malevolent spirit attacks!'
    ];

    const neutralEvents = [
      'You find an ancient inscription on the wall.',
      'A strange device sits in the center of the room.',
      'Mysterious runes glow faintly...',
      'An abandoned campsite with burned-out fire.'
    ];

    switch (room.mysteryEventType) {
      case 'positive':
        room.mysteryDescription = positiveEvents[Math.floor(Math.random() * positiveEvents.length)];
        break;
      case 'negative':
        room.mysteryDescription = negativeEvents[Math.floor(Math.random() * negativeEvents.length)];
        break;
      case 'neutral':
        room.mysteryDescription = neutralEvents[Math.floor(Math.random() * neutralEvents.length)];
        break;
    }
  }

  /**
   * Populate elite combat room
   */
  private static populateEliteRoom(
    room: Room,
    floorNumber: number,
    difficulty: RoomDifficulty,
    difficultyMultiplier: number,
    heroLevel?: number
  ): void {
    // Elite rooms should always be challenging (1.4x floor level)
    const baseLevel = floorNumber * difficultyMultiplier;
    const enemyLevel = Math.max(1, Math.floor(baseLevel * 1.4));
    const enemyCount = Math.random() < 0.5 ? 1 : 2; // 1-2 elite enemies

    room.enemies = [];
    for (let i = 0; i < enemyCount; i++) {
      room.enemies.push(generateRandomEnemy(enemyLevel, 'elite'));
    }

    room.combatCompleted = false;

    // Better rewards - guaranteed rare+ item and more gold
    const itemLevel = heroLevel ? Math.max(enemyLevel, heroLevel) : enemyLevel;
    const rarities: Array<'rare' | 'epic' | 'legendary'> = ['rare', 'epic', 'legendary'];
    const rarity = rarities[Math.min(Math.floor(Math.random() * 2), rarities.length - 1)]; // Mostly rare/epic

    room.eliteRewards = {
      gold: Math.floor(itemLevel * 100 * (1 + Math.random() * 0.5)),
      items: [ItemGenerator.generate(itemLevel, rarity)]
    };
  }

  /**
   * Populate mini-boss room
   */
  private static populateMiniBossRoom(
    room: Room,
    floorNumber: number,
    difficultyMultiplier: number,
    heroLevel?: number
  ): void {
    // Mini-boss is stronger than elite but weaker than boss (1.5x floor level)
    const baseLevel = floorNumber * difficultyMultiplier;
    const miniBossLevel = Math.max(1, Math.floor(baseLevel * 1.5));

    // Create elite enemy and boost stats for mini-boss
    const miniBoss = generateRandomEnemy(miniBossLevel, 'elite');

    // Boost stats for mini-boss (stronger than regular elite)
    miniBoss.maxHP = Math.floor(miniBoss.maxHP * 1.5);
    miniBoss.currentHP = miniBoss.maxHP;
    miniBoss.ATK = Math.floor(miniBoss.ATK * 1.3);
    miniBoss.DEF = Math.floor(miniBoss.DEF * 1.3);

    room.enemies = [miniBoss];
    room.combatCompleted = false;
    room.miniBossDefeated = false;
  }
}
