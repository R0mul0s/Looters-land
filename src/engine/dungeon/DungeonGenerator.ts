/**
 * Dungeon Generator - Procedurally generates dungeon floors with rooms
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2026-01-19
 */

import type {
  Room,
  Floor,
  RoomType,
  RoomDifficulty,
  DungeonGenerationOptions,
  TierLevel,
  DungeonTierConfig
} from '../../types/dungeon.types';
import { generateRandomEnemy } from '../combat/Enemy';
import { ItemGenerator } from '../item/ItemGenerator';
import { getRandomRarityInRange, DUNGEON_TIER_CONFIGS } from '../../config/BALANCE_CONFIG';

/**
 * Dungeon Generator Class
 */
export class DungeonGenerator {
  /**
   * Generate a complete dungeon floor
   * Now supports tier-based generation with proper enemy scaling
   */
  static generateFloor(options: DungeonGenerationOptions): Floor {
    const {
      floorNumber,
      tierFloorNumber = floorNumber,
      tier = 1 as TierLevel,
      tierConfig = DUNGEON_TIER_CONFIGS[1],
      roomCount,
      difficulty,
      guaranteeBoss = true,
      heroLevel,
      baseEnemyLevel = 5
    } = options;

    // Calculate effective enemy level based on tier
    const effectiveEnemyLevel = Math.floor(baseEnemyLevel * tierConfig.enemyLevelMultiplier);
    const isTierBossFloor = tierFloorNumber === tierConfig.floorsPerTier;

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

    // Generate path through dungeon (pass effectiveEnemyLevel for proper tier scaling)
    const generatedRooms = this.generateRoomPath(
      startRoom.position,
      roomCount - (guaranteeBoss ? 3 : 2), // Account for start, exit, and optional boss
      gridSize,
      floorNumber,
      difficulty,
      heroLevel,
      effectiveEnemyLevel
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

    // Add boss room if guaranteed (pass effectiveEnemyLevel for tier scaling)
    let bossRoomId: string | undefined;
    if (guaranteeBoss) {
      const bossRoom = this.createBossRoom(
        rooms[rooms.length - 1].position,
        gridSize,
        floorNumber,
        difficulty,
        rooms,  // Pass existing rooms for collision detection
        heroLevel,
        effectiveEnemyLevel
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
      heroLevel,
      effectiveEnemyLevel
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
      floorNumber: tierFloorNumber,
      tier,
      rooms,
      currentRoomId: startRoom.id,
      startRoomId: startRoom.id,
      exitRoomId: exitRoom.id,
      bossRoomId,
      difficulty,
      explored: false,
      completed: false,
      isTierBossFloor
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
    heroLevel?: number,
    baseEnemyLevel: number = 5
  ): Room[] {
    const rooms: Room[] = [];
    const occupiedPositions = new Set<string>([`${startPosition.x},${startPosition.y}`]);

    // Start from the startPosition - first room will be placed adjacent to it
    let currentPosition = startPosition;

    for (let i = 0; i < count; i++) {
      // Determine room type
      const roomType = this.determineRoomType(i, count);
      const roomDifficulty = this.determineRoomDifficulty();

      // Find next valid position adjacent to current
      const nextPosition = this.findNextPosition(currentPosition, occupiedPositions, gridSize);

      // Create room at the next position
      const room = this.createRoom(
        roomType,
        nextPosition,
        roomDifficulty,
        floorNumber,
        difficulty,
        heroLevel,
        baseEnemyLevel
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
    heroLevel?: number,
    baseEnemyLevel: number = 5
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
        this.populateCombatRoom(room, baseEnemyLevel, difficulty, floorNumber);
        break;
      case 'treasure':
        this.populateTreasureRoom(room, baseEnemyLevel, difficultyMultiplier, heroLevel);
        break;
      case 'trap':
        this.populateTrapRoom(room, baseEnemyLevel, difficultyMultiplier);
        break;
      case 'rest':
        this.populateRestRoom(room, baseEnemyLevel);
        break;
      case 'boss':
        this.populateBossRoom(room, baseEnemyLevel, floorNumber);
        break;
      case 'shrine':
        this.populateShrineRoom(room);
        break;
      case 'mystery':
        this.populateMysteryRoom(room);
        break;
      case 'elite':
        this.populateEliteRoom(room, baseEnemyLevel, difficulty, floorNumber, heroLevel);
        break;
      case 'miniboss':
        this.populateMiniBossRoom(room, baseEnemyLevel, floorNumber);
        break;
    }

    return room;
  }

  /**
   * Create a boss room
   *
   * Finds a free position adjacent to nearPosition for the boss room.
   * Checks all existing rooms to avoid overlapping positions.
   */
  private static createBossRoom(
    nearPosition: { x: number; y: number },
    gridSize: number,
    floorNumber: number,
    difficulty: number,
    existingRooms: Room[],
    heroLevel?: number,
    baseEnemyLevel: number = 5
  ): Room {
    // Create set of occupied positions for collision detection
    const occupiedPositions = new Set(
      existingRooms.map(room => `${room.position.x},${room.position.y}`)
    );

    // Adjacent positions to try (East preferred, then others)
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

    // Find first free adjacent position
    for (const offset of adjacentOffsets) {
      const testX = nearPosition.x + offset.x;
      const testY = nearPosition.y + offset.y;

      if (testX >= 0 && testX < gridSize && testY >= 0 && testY < gridSize) {
        const posKey = `${testX},${testY}`;
        if (!occupiedPositions.has(posKey)) {
          return this.createRoom('boss', { x: testX, y: testY }, 'elite', floorNumber, difficulty, heroLevel, baseEnemyLevel);
        }
      }
    }

    // Fallback: find any free position in grid
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const posKey = `${x},${y}`;
        if (!occupiedPositions.has(posKey)) {
          return this.createRoom('boss', { x, y }, 'elite', floorNumber, difficulty, heroLevel, baseEnemyLevel);
        }
      }
    }

    // Absolute fallback (should never happen - grid is full)
    return this.createRoom('boss', { x: gridSize, y: gridSize }, 'elite', floorNumber, difficulty, heroLevel, baseEnemyLevel);
  }

  /**
   * Position exit room relative to last room
   *
   * Ensures exit room is placed on a unique position that doesn't overlap
   * with existing rooms. Tries adjacent positions first, then falls back
   * to finding any free position in the grid.
   *
   * @param exitRoom - The exit room to position
   * @param lastRoom - The last room in the dungeon
   * @param gridSize - Size of the dungeon grid
   * @param existingRooms - Array of all existing rooms (for collision detection)
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

    // Adjacent positions to try (East preferred, then others)
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

    // Find first free adjacent position
    for (const offset of adjacentOffsets) {
      const testX = lastRoom.position.x + offset.x;
      const testY = lastRoom.position.y + offset.y;

      if (testX >= 0 && testX < gridSize && testY >= 0 && testY < gridSize) {
        const posKey = `${testX},${testY}`;
        if (!occupiedPositions.has(posKey)) {
          exitRoom.position = { x: testX, y: testY };
          return;
        }
      }
    }

    // Fallback: find any free position in grid
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const posKey = `${x},${y}`;
        if (!occupiedPositions.has(posKey)) {
          exitRoom.position = { x, y };
          return;
        }
      }
    }

    // Absolute fallback (grid is full - shouldn't happen)
    exitRoom.position = { x: gridSize, y: gridSize };
  }

  /**
   * Connect two rooms with directions
   * IMPORTANT: Only connects rooms that are directly adjacent (Manhattan distance = 1)
   */
  private static connectRooms(from: Room, to: Room): void {
    const dx = to.position.x - from.position.x;
    const dy = to.position.y - from.position.y;

    // Only connect if rooms are directly adjacent (Manhattan distance = 1)
    const manhattanDistance = Math.abs(dx) + Math.abs(dy);
    if (manhattanDistance !== 1) {
      // Rooms are not adjacent - skip connection to avoid invalid connections
      // This can happen when findNextPosition falls back to distant positions
      return;
    }

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
   * @param baseEnemyLevel - Tier-scaled base enemy level (e.g., 5 * tierMultiplier)
   * @param floorNumber - Floor within tier (1-5) for minor scaling
   */
  private static populateCombatRoom(
    room: Room,
    baseEnemyLevel: number,
    difficulty: RoomDifficulty,
    floorNumber: number
  ): void {
    // Calculate enemy level based on tier-scaled base level and room difficulty
    const difficultyModifier = {
      easy: 0.8,    // 80% of base level
      normal: 1.0,  // 100% of base level
      hard: 1.2,    // 120% of base level
      elite: 1.4    // 140% of base level
    };

    // Base level comes from tier system, add small floor bonus (1-5)
    const floorBonus = (floorNumber - 1) * 0.1; // 0%, 10%, 20%, 30%, 40% bonus per floor
    const enemyLevel = Math.max(1, Math.floor(baseEnemyLevel * (1 + floorBonus) * difficultyModifier[difficulty]));

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
   * @param baseEnemyLevel - Tier-scaled base level for loot scaling
   */
  private static populateTreasureRoom(
    room: Room,
    baseEnemyLevel: number,
    _difficultyMultiplier: number,
    heroLevel?: number
  ): void {
    // Use hero level if available, otherwise use tier-scaled base level
    const itemLevel = heroLevel ? Math.max(baseEnemyLevel, heroLevel) : baseEnemyLevel;

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
   * @param baseEnemyLevel - Tier-scaled base level for damage scaling
   */
  private static populateTrapRoom(
    room: Room,
    baseEnemyLevel: number,
    _difficultyMultiplier: number
  ): void {
    // Trap damage scales with tier-adjusted enemy level
    const baseDamage = Math.floor(baseEnemyLevel * 5);
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
   * @param baseEnemyLevel - Tier-scaled base level for heal scaling
   */
  private static populateRestRoom(room: Room, baseEnemyLevel: number): void {
    // Heal amount scales with tier-adjusted level
    room.healAmount = Math.floor(50 + baseEnemyLevel * 5);
    room.restUsed = false;
  }

  /**
   * Populate boss room
   * @param baseEnemyLevel - Tier-scaled base enemy level
   * @param floorNumber - Floor within tier (1-5) for minor scaling
   */
  private static populateBossRoom(
    room: Room,
    baseEnemyLevel: number,
    floorNumber: number
  ): void {
    // Boss should be very challenging (1.5x tier-scaled level + floor bonus)
    const floorBonus = (floorNumber - 1) * 0.1; // 0-40% bonus based on floor
    const bossLevel = Math.max(1, Math.floor(baseEnemyLevel * (1 + floorBonus) * 1.5));

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
    room: Room
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
    baseEnemyLevel: number,
    difficulty: RoomDifficulty,
    floorNumber: number,
    heroLevel?: number
  ): void {
    // Elite rooms should always be challenging (1.3x tier-scaled level + floor bonus)
    const floorBonus = (floorNumber - 1) * 0.1;
    const enemyLevel = Math.max(1, Math.floor(baseEnemyLevel * (1 + floorBonus) * 1.3));
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
    baseEnemyLevel: number,
    floorNumber: number
  ): void {
    // Mini-boss is stronger than elite but weaker than boss (1.4x tier-scaled level + floor bonus)
    const floorBonus = (floorNumber - 1) * 0.1;
    const miniBossLevel = Math.max(1, Math.floor(baseEnemyLevel * (1 + floorBonus) * 1.4));

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
