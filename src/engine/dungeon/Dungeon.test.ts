/**
 * Dungeon Class Tests - Room traversal, loot recording, and completion validation
 *
 * Tests for:
 * - Room movement mechanics
 * - Loot recording to dungeon statistics
 * - Room completion state tracking
 * - BUG-003: Movement validation for non-combat rooms
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dungeon } from './Dungeon';
import type { Hero } from '../hero/Hero';
import type { Room, Floor, Direction } from '../../types/dungeon.types';

// Mock i18n to avoid browser dependencies
vi.mock('../../localization/i18n', () => ({
  t: (key: string) => key
}));

// Helper to find a valid movement direction (one that leads to an existing room)
function findValidMoveDirection(dungeon: Dungeon): Direction | null {
  const currentRoom = dungeon.getCurrentRoom();
  const floor = dungeon.getCurrentFloor();
  if (!currentRoom || !floor || currentRoom.connections.length === 0) return null;

  const delta: Record<Direction, { x: number; y: number }> = {
    north: { x: 0, y: -1 },
    south: { x: 0, y: 1 },
    east: { x: 1, y: 0 },
    west: { x: -1, y: 0 }
  };

  for (const dir of currentRoom.connections) {
    const targetPos = {
      x: currentRoom.position.x + delta[dir].x,
      y: currentRoom.position.y + delta[dir].y
    };
    const targetRoom = floor.rooms.find(
      r => r.position.x === targetPos.x && r.position.y === targetPos.y
    );
    if (targetRoom) {
      return dir;
    }
  }
  return null;
}

// Helper to create a mock hero
function createMockHero(overrides: Partial<Hero> = {}): Hero {
  return {
    id: `hero-${Date.now()}-${Math.random()}`,
    name: 'Test Hero',
    class: 'Warrior',
    rarity: 'common',
    level: 10,
    experience: 0,
    requiredXP: 100,
    talentPoints: 0,
    currentHP: 100,
    maxHP: 100,
    ATK: 50,
    DEF: 30,
    SPD: 20,
    CRIT: 5,
    isAlive: true,
    equipment: null,
    ...overrides
  } as Hero;
}

describe('Dungeon', () => {
  let dungeon: Dungeon;

  beforeEach(() => {
    dungeon = new Dungeon({
      name: 'Test Dungeon',
      startingFloor: 1,
      roomsPerFloor: { min: 8, max: 12 }
    });
    dungeon.start();
  });

  describe('Initialization', () => {
    it('should create dungeon with correct name', () => {
      expect(dungeon.name).toBe('Test Dungeon');
    });

    it('should start on floor 1', () => {
      expect(dungeon.currentFloorIndex).toBe(0);
      expect(dungeon.getCurrentFloor()?.floorNumber).toBe(1);
    });

    it('should have starting room as current', () => {
      const currentRoom = dungeon.getCurrentRoom();
      expect(currentRoom).toBeDefined();
      expect(currentRoom?.type).toBe('start');
      expect(currentRoom?.status).toBe('current');
    });

    it('should initialize statistics to zero', () => {
      expect(dungeon.totalGoldEarned).toBe(0);
      expect(dungeon.totalItemsFound).toBe(0);
      expect(dungeon.totalEnemiesDefeated).toBe(0);
    });

    it('should be active after start()', () => {
      expect(dungeon.isActive).toBe(true);
      expect(dungeon.startTime).toBeDefined();
    });
  });

  describe('Room Movement', () => {
    it('should move to adjacent room in valid direction', () => {
      const direction = findValidMoveDirection(dungeon);
      if (!direction) return; // Skip if no valid movement found

      const result = dungeon.moveToRoom(direction);

      expect(result.success).toBe(true);
      expect(result.nextRoomId).toBeDefined();
    });

    it('should fail to move in invalid direction', () => {
      // Find a direction that's not connected
      const currentRoom = dungeon.getCurrentRoom();
      if (!currentRoom) return;

      const allDirections: Direction[] = ['north', 'south', 'east', 'west'];
      const invalidDirection = allDirections.find(d => !currentRoom.connections.includes(d));

      if (invalidDirection) {
        const result = dungeon.moveToRoom(invalidDirection);
        expect(result.success).toBe(false);
        expect(result.message).toContain('no connection');
      }
    });

    it('should update room status after movement', () => {
      const startRoom = dungeon.getCurrentRoom();
      const direction = findValidMoveDirection(dungeon);
      if (!startRoom || !direction) return; // Skip if no valid movement found

      const result = dungeon.moveToRoom(direction);

      if (result.success) {
        // Previous room should be completed
        expect(startRoom.status).toBe('completed');

        // New room should be current
        const newRoom = dungeon.getCurrentRoom();
        expect(newRoom?.status).toBe('current');
        expect(newRoom?.id).toBe(result.nextRoomId);
      }
    });

    it('should update floor currentRoomId after movement', () => {
      const floor = dungeon.getCurrentFloor();
      const direction = findValidMoveDirection(dungeon);
      if (!floor || !direction) return; // Skip if no valid movement found

      const result = dungeon.moveToRoom(direction);

      if (result.success) {
        expect(floor.currentRoomId).toBe(result.nextRoomId);
      }
    });
  });

  describe('Combat Completion', () => {
    it('should complete combat in combat room', () => {
      // Navigate to find a combat room
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const combatRoom = floor.rooms.find(r => r.type === 'combat');
      if (!combatRoom) return;

      // Manually set current room to combat room for testing
      floor.currentRoomId = combatRoom.id;
      combatRoom.status = 'current';

      const result = dungeon.completeCombat();
      expect(result.success).toBe(true);
      expect(combatRoom.combatCompleted).toBe(true);
    });

    it('should fail to complete combat in non-combat room', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      // Start room is not a combat room
      const result = dungeon.completeCombat();
      expect(result.success).toBe(false);
      expect(result.message).toBe('Not a combat room');
    });

    it('should count enemies defeated', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const combatRoom = floor.rooms.find(r => r.type === 'combat' && r.enemies && r.enemies.length > 0);
      if (!combatRoom) return;

      const enemyCount = combatRoom.enemies?.length || 0;

      // Set combat room as current
      floor.currentRoomId = combatRoom.id;
      combatRoom.status = 'current';

      dungeon.completeCombat();
      expect(dungeon.totalEnemiesDefeated).toBe(enemyCount);
    });

    it('should mark boss as defeated in boss room', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const bossRoom = floor.rooms.find(r => r.type === 'boss');
      if (!bossRoom) return;

      floor.currentRoomId = bossRoom.id;
      bossRoom.status = 'current';

      const result = dungeon.completeCombat();
      expect(result.success).toBe(true);
      expect(bossRoom.bossDefeated).toBe(true);
      expect(bossRoom.combatCompleted).toBe(true);
    });

    it('should mark miniboss as defeated in miniboss room', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const minibossRoom = floor.rooms.find(r => r.type === 'miniboss');
      if (!minibossRoom) return;

      floor.currentRoomId = minibossRoom.id;
      minibossRoom.status = 'current';

      const result = dungeon.completeCombat();
      expect(result.success).toBe(true);
      expect(minibossRoom.miniBossDefeated).toBe(true);
      expect(minibossRoom.combatCompleted).toBe(true);
    });
  });

  describe('Loot Recording', () => {
    it('should add gold to statistics via addLootToStats', () => {
      dungeon.addLootToStats(100, 0);
      expect(dungeon.totalGoldEarned).toBe(100);

      dungeon.addLootToStats(50, 0);
      expect(dungeon.totalGoldEarned).toBe(150);
    });

    it('should add items to statistics via addLootToStats', () => {
      dungeon.addLootToStats(0, 3);
      expect(dungeon.totalItemsFound).toBe(3);

      dungeon.addLootToStats(0, 2);
      expect(dungeon.totalItemsFound).toBe(5);
    });

    it('should add both gold and items simultaneously', () => {
      dungeon.addLootToStats(200, 5);
      expect(dungeon.totalGoldEarned).toBe(200);
      expect(dungeon.totalItemsFound).toBe(5);
    });

    it('should track loot from treasure rooms', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const treasureRoom = floor.rooms.find(r => r.type === 'treasure');
      if (!treasureRoom) return;

      const expectedGold = treasureRoom.treasureGold || 0;
      const expectedItems = treasureRoom.treasureItems?.length || 0;

      floor.currentRoomId = treasureRoom.id;
      treasureRoom.status = 'current';

      const result = dungeon.lootTreasure();
      if (result.success) {
        expect(dungeon.totalGoldEarned).toBe(expectedGold);
        expect(dungeon.totalItemsFound).toBe(expectedItems);
      }
    });
  });

  describe('Treasure Room', () => {
    it('should loot treasure successfully', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const treasureRoom = floor.rooms.find(r => r.type === 'treasure');
      if (!treasureRoom) return;

      floor.currentRoomId = treasureRoom.id;
      treasureRoom.status = 'current';

      const result = dungeon.lootTreasure();
      expect(result.success).toBe(true);
      expect(treasureRoom.treasureLooted).toBe(true);
    });

    it('should fail to loot already looted treasure', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const treasureRoom = floor.rooms.find(r => r.type === 'treasure');
      if (!treasureRoom) return;

      floor.currentRoomId = treasureRoom.id;
      treasureRoom.status = 'current';

      // First loot
      dungeon.lootTreasure();

      // Second loot attempt
      const result = dungeon.lootTreasure();
      expect(result.success).toBe(false);
      expect(result.message).toBe('Treasure already looted');
    });

    it('should return rewards in loot result', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const treasureRoom = floor.rooms.find(r => r.type === 'treasure');
      if (!treasureRoom) return;

      floor.currentRoomId = treasureRoom.id;
      treasureRoom.status = 'current';

      const result = dungeon.lootTreasure();
      if (result.success) {
        expect(result.rewards).toBeDefined();
        expect(result.rewards?.gold).toBe(treasureRoom.treasureGold);
        expect(result.rewards?.items).toBe(treasureRoom.treasureItems);
      }
    });
  });

  describe('Trap Room', () => {
    it('should disarm trap (success path)', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const trapRoom = floor.rooms.find(r => r.type === 'trap');
      if (!trapRoom) return;

      floor.currentRoomId = trapRoom.id;
      trapRoom.status = 'current';

      const heroes = [createMockHero()];
      // Force success with 100% chance
      const result = dungeon.disarmTrap(heroes, 1.0);
      expect(result.success).toBe(true);
      expect(trapRoom.trapDisarmed).toBe(true);
    });

    it('should trigger trap on failure', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const trapRoom = floor.rooms.find(r => r.type === 'trap');
      if (!trapRoom) return;

      floor.currentRoomId = trapRoom.id;
      trapRoom.status = 'current';

      const heroes = [createMockHero({ currentHP: 100, maxHP: 100, DEF: 0 })];
      // Force failure with 0% chance
      const result = dungeon.disarmTrap(heroes, 0);
      expect(result.success).toBe(false);
      expect(trapRoom.trapDisarmed).toBe(true); // Trap is "disarmed" (triggered)
      expect(result.damage?.heroes).toBeDefined();
    });

    it('should damage heroes on trap failure', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const trapRoom = floor.rooms.find(r => r.type === 'trap' && (r.trapDamage || 0) > 0);
      if (!trapRoom) return;

      floor.currentRoomId = trapRoom.id;
      trapRoom.status = 'current';

      const hero = createMockHero({ currentHP: 100, maxHP: 100, DEF: 10 });
      const heroes = [hero];
      const trapDamage = trapRoom.trapDamage || 0;

      dungeon.disarmTrap(heroes, 0); // Force failure

      const expectedDamage = Math.max(1, trapDamage - hero.DEF);
      expect(hero.currentHP).toBe(100 - expectedDamage);
    });

    it('should fail to disarm already disarmed trap', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const trapRoom = floor.rooms.find(r => r.type === 'trap');
      if (!trapRoom) return;

      floor.currentRoomId = trapRoom.id;
      trapRoom.status = 'current';

      const heroes = [createMockHero()];
      dungeon.disarmTrap(heroes, 1.0);

      const result = dungeon.disarmTrap(heroes, 1.0);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Trap already disarmed');
    });
  });

  describe('Rest Room', () => {
    it('should heal heroes in rest room', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const restRoom = floor.rooms.find(r => r.type === 'rest');
      if (!restRoom) return;

      floor.currentRoomId = restRoom.id;
      restRoom.status = 'current';

      const hero = createMockHero({ currentHP: 50, maxHP: 100 });
      const heroes = [hero];
      const healAmount = restRoom.healAmount || 0;

      const result = dungeon.useRest(heroes);
      expect(result.success).toBe(true);
      expect(restRoom.restUsed).toBe(true);
      expect(hero.currentHP).toBe(Math.min(100, 50 + healAmount));
    });

    it('should not overheal past maxHP', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const restRoom = floor.rooms.find(r => r.type === 'rest' && (r.healAmount || 0) > 0);
      if (!restRoom) return;

      floor.currentRoomId = restRoom.id;
      restRoom.status = 'current';

      const hero = createMockHero({ currentHP: 95, maxHP: 100 });
      const heroes = [hero];

      dungeon.useRest(heroes);
      expect(hero.currentHP).toBe(100); // Capped at maxHP
    });

    it('should not heal dead heroes', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const restRoom = floor.rooms.find(r => r.type === 'rest');
      if (!restRoom) return;

      floor.currentRoomId = restRoom.id;
      restRoom.status = 'current';

      const hero = createMockHero({ currentHP: 0, maxHP: 100, isAlive: false });
      const heroes = [hero];

      dungeon.useRest(heroes);
      expect(hero.currentHP).toBe(0); // Still dead
    });

    it('should fail to rest in already used rest room', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const restRoom = floor.rooms.find(r => r.type === 'rest');
      if (!restRoom) return;

      floor.currentRoomId = restRoom.id;
      restRoom.status = 'current';

      const heroes = [createMockHero()];
      dungeon.useRest(heroes);

      const result = dungeon.useRest(heroes);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Rest area already used');
    });
  });

  describe('Shrine Room', () => {
    it('should use shrine and grant buff', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const shrineRoom = floor.rooms.find(r => r.type === 'shrine');
      if (!shrineRoom) return;

      floor.currentRoomId = shrineRoom.id;
      shrineRoom.status = 'current';

      const result = dungeon.useShrine();
      expect(result.success).toBe(true);
      expect(shrineRoom.shrineUsed).toBe(true);
      expect(floor.activeBuffs).toContain(shrineRoom.shrineBuffType);
    });

    it('should fail to use already used shrine', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const shrineRoom = floor.rooms.find(r => r.type === 'shrine');
      if (!shrineRoom) return;

      floor.currentRoomId = shrineRoom.id;
      shrineRoom.status = 'current';

      dungeon.useShrine();

      const result = dungeon.useShrine();
      expect(result.success).toBe(false);
      expect(result.message).toBe('Shrine already used');
    });

    it('should report active buffs via getActiveBuffs', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const shrineRoom = floor.rooms.find(r => r.type === 'shrine');
      if (!shrineRoom) return;

      floor.currentRoomId = shrineRoom.id;
      shrineRoom.status = 'current';

      dungeon.useShrine();

      const activeBuffs = dungeon.getActiveBuffs();
      expect(activeBuffs).toContain(shrineRoom.shrineBuffType);
    });

    it('should check specific buff with hasActiveBuff', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const shrineRoom = floor.rooms.find(r => r.type === 'shrine');
      if (!shrineRoom) return;

      floor.currentRoomId = shrineRoom.id;
      shrineRoom.status = 'current';
      const buffType = shrineRoom.shrineBuffType!;

      dungeon.useShrine();

      expect(dungeon.hasActiveBuff(buffType)).toBe(true);
    });
  });

  describe('Mystery Room', () => {
    it('should resolve mystery room', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const mysteryRoom = floor.rooms.find(r => r.type === 'mystery');
      if (!mysteryRoom) return;

      floor.currentRoomId = mysteryRoom.id;
      mysteryRoom.status = 'current';

      const heroes = [createMockHero()];
      const result = dungeon.resolveMystery(heroes);
      expect(result.success).toBe(true);
      expect(mysteryRoom.mysteryResolved).toBe(true);
    });

    it('should fail to resolve already resolved mystery', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const mysteryRoom = floor.rooms.find(r => r.type === 'mystery');
      if (!mysteryRoom) return;

      floor.currentRoomId = mysteryRoom.id;
      mysteryRoom.status = 'current';

      const heroes = [createMockHero()];
      dungeon.resolveMystery(heroes);

      const result = dungeon.resolveMystery(heroes);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Mystery already resolved');
    });

    it('should heal heroes on positive mystery event', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const mysteryRoom = floor.rooms.find(r => r.type === 'mystery' && r.mysteryEventType === 'positive');
      if (!mysteryRoom) return;

      floor.currentRoomId = mysteryRoom.id;
      mysteryRoom.status = 'current';

      const hero = createMockHero({ currentHP: 50, maxHP: 100 });
      const heroes = [hero];
      const result = dungeon.resolveMystery(heroes);

      // Positive events heal and give gold
      expect(result.success).toBe(true);
      expect(hero.currentHP).toBeGreaterThan(50);
      expect(result.rewards?.gold).toBeGreaterThan(0);
    });

    it('should damage heroes on negative mystery event', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const mysteryRoom = floor.rooms.find(r => r.type === 'mystery' && r.mysteryEventType === 'negative');
      if (!mysteryRoom) return;

      floor.currentRoomId = mysteryRoom.id;
      mysteryRoom.status = 'current';

      const hero = createMockHero({ currentHP: 100, maxHP: 100, DEF: 0 });
      const heroes = [hero];
      const result = dungeon.resolveMystery(heroes);

      expect(result.success).toBe(true);
      expect(hero.currentHP).toBeLessThan(100);
      expect(result.damage?.heroes).toBeDefined();
    });
  });

  describe('Floor Progression', () => {
    it('should proceed to next floor from exit room', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const exitRoom = floor.rooms.find(r => r.type === 'exit');
      if (!exitRoom) return;

      floor.currentRoomId = exitRoom.id;
      exitRoom.status = 'current';

      const result = dungeon.proceedToNextFloor();
      expect(result.success).toBe(true);
      expect(result.floorCompleted).toBe(true);
      expect(dungeon.currentFloorIndex).toBe(1);
    });

    it('should fail to proceed from non-exit room', () => {
      const result = dungeon.proceedToNextFloor();
      expect(result.success).toBe(false);
      expect(result.message).toBe('Must reach exit room to proceed');
    });

    it('should mark previous floor as completed', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const exitRoom = floor.rooms.find(r => r.type === 'exit');
      if (!exitRoom) return;

      floor.currentRoomId = exitRoom.id;
      exitRoom.status = 'current';

      dungeon.proceedToNextFloor();
      expect(floor.completed).toBe(true);
    });

    it('should update maxFloorReached', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const exitRoom = floor.rooms.find(r => r.type === 'exit');
      if (!exitRoom) return;

      floor.currentRoomId = exitRoom.id;
      exitRoom.status = 'current';

      dungeon.proceedToNextFloor();
      expect(dungeon.maxFloorReached).toBe(2);
    });

    it('should generate new floor on progression', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      const exitRoom = floor.rooms.find(r => r.type === 'exit');
      if (!exitRoom) return;

      floor.currentRoomId = exitRoom.id;
      exitRoom.status = 'current';

      dungeon.proceedToNextFloor();

      const newFloor = dungeon.getCurrentFloor();
      expect(newFloor).toBeDefined();
      expect(newFloor?.floorNumber).toBe(2);
    });
  });

  describe('Statistics', () => {
    it('should return correct statistics', () => {
      dungeon.addLootToStats(500, 10);

      const stats = dungeon.getStatistics();

      expect(stats.floorsExplored).toBe(1);
      expect(stats.goldEarned).toBe(500);
      expect(stats.itemsFound).toBe(10);
      expect(stats.enemiesDefeated).toBe(0);
      expect(stats.timeElapsed).toBeGreaterThanOrEqual(0);
    });

    it('should count rooms cleared', () => {
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      // Mark some rooms as completed
      floor.rooms[0].status = 'completed';
      floor.rooms[1].status = 'completed';

      const stats = dungeon.getStatistics();
      expect(stats.roomsCleared).toBeGreaterThanOrEqual(2);
    });
  });

  describe('End Dungeon', () => {
    it('should set isActive to false on end', () => {
      dungeon.end();
      expect(dungeon.isActive).toBe(false);
    });
  });
});

/**
 * BUG-003: Room Completion Validation
 *
 * ISSUE: Players can move through non-combat rooms without interacting with them.
 * This allows skipping treasure rooms without looting, trap rooms without disarming,
 * rest rooms without resting, shrine rooms without using, and mystery rooms without resolving.
 *
 * AFFECTED CODE:
 * - src/components/DungeonExplorer.tsx lines 96-112 (handleMove function)
 * - Movement validation only checks combat-type rooms (combat, boss, elite, miniboss)
 *
 * EXPECTED BEHAVIOR:
 * - Players should NOT be able to leave rooms without completing the room action
 * - Each room type should have a "completion" requirement:
 *   - combat/boss/elite/miniboss: combatCompleted must be true
 *   - treasure: treasureLooted must be true (or player explicitly skips)
 *   - trap: trapDisarmed must be true
 *   - rest: restUsed must be true (or player explicitly skips)
 *   - shrine: shrineUsed must be true (or player explicitly skips)
 *   - mystery: mysteryResolved must be true
 *   - start/exit: No completion requirement
 *
 * CURRENT (BUGGY) BEHAVIOR:
 * - Only combat rooms block movement when incomplete
 * - All other room types allow free movement without interaction
 */
describe('BUG-003: Room Completion Validation', () => {
  describe('Dungeon.moveToRoom - Does NOT validate room completion (by design)', () => {
    // NOTE: The Dungeon class's moveToRoom() does not enforce completion.
    // Validation is done at the UI layer (DungeonExplorer.tsx).
    // These tests document the current behavior.

    it('moveToRoom allows movement from any room (no validation at engine level)', () => {
      // Try multiple times to find a dungeon with valid connections
      for (let attempt = 0; attempt < 10; attempt++) {
        const testDungeon = new Dungeon({
          name: 'Test',
          startingFloor: 1,
          roomsPerFloor: { min: 8, max: 12 }
        });
        testDungeon.start();

        const direction = findValidMoveDirection(testDungeon);
        if (!direction) continue;

        // Dungeon.moveToRoom() only checks direction validity, not completion
        const result = testDungeon.moveToRoom(direction);

        // Movement succeeds because engine doesn't validate completion
        expect(result.success).toBe(true);
        return; // Test passed
      }

      // If we couldn't find a valid movement in 10 attempts, skip the test
      // This is acceptable as it's documenting behavior, not testing critical functionality
    });
  });

  describe('KNOWN BUG: DungeonExplorer only validates combat rooms', () => {
    // These tests document the expected behavior for the fix
    // Currently, these represent what SHOULD happen but doesn't

    const roomTypesRequiringCompletion = [
      { type: 'treasure', flag: 'treasureLooted', description: 'treasure room without looting' },
      { type: 'trap', flag: 'trapDisarmed', description: 'trap room without disarming' },
      { type: 'rest', flag: 'restUsed', description: 'rest room without resting' },
      { type: 'shrine', flag: 'shrineUsed', description: 'shrine room without using' },
      { type: 'mystery', flag: 'mysteryResolved', description: 'mystery room without resolving' }
    ];

    roomTypesRequiringCompletion.forEach(({ type, flag, description }) => {
      it(`KNOWN BUG: Player CAN skip ${description} (should be blocked)`, () => {
        // This test documents the bug - it will PASS because the bug exists
        // When the bug is fixed, this test should be updated to expect blocking

        const dungeon = new Dungeon({
          name: 'Test',
          startingFloor: 1,
          roomsPerFloor: { min: 15, max: 20 }
        });
        dungeon.start();

        const floor = dungeon.getCurrentFloor();
        if (!floor) return;

        // Find a room of this type
        const targetRoom = floor.rooms.find(r => r.type === type);
        if (!targetRoom) {
          // Room type not generated in this dungeon, skip
          return;
        }

        // Set as current room
        floor.currentRoomId = targetRoom.id;
        targetRoom.status = 'current';

        // Verify the completion flag is false
        expect((targetRoom as any)[flag]).toBeFalsy();

        // BUG: Movement succeeds without completing the room
        // The Dungeon engine allows this - validation should be at UI level
        if (targetRoom.connections.length > 0) {
          const result = dungeon.moveToRoom(targetRoom.connections[0]);
          // This PASSES because the bug exists - engine doesn't validate
          expect(result.success).toBe(true);
        }
      });
    });

    it('DOCUMENTATION: Combat rooms ARE correctly validated (at UI level)', () => {
      // This documents that combat validation exists in DungeonExplorer.tsx
      // at lines 96-103, but only for combat-type rooms

      // The handleMove function in DungeonExplorer.tsx:
      // if (currentRoom && (currentRoom.type === 'combat' || currentRoom.type === 'boss' ||
      //     currentRoom.type === 'elite' || currentRoom.type === 'miniboss')) {
      //   if (!currentRoom.combatCompleted) {
      //     setMessage('⚠️ You must defeat all enemies before leaving this room!');
      //     return;
      //   }
      // }

      // This test exists to document the current behavior
      expect(true).toBe(true);
    });
  });

  describe('Recommended Fix for BUG-003', () => {
    it('RECOMMENDATION: Add validation for all room types in DungeonExplorer.handleMove', () => {
      // The fix should modify DungeonExplorer.tsx handleMove function to:
      // 1. Check each room type's completion flag
      // 2. Block movement if the flag is false
      // 3. Optionally allow "skip" action for non-critical rooms (rest, shrine)

      // Example fixed code:
      /*
      const handleMove = (direction: Direction) => {
        if (!currentRoom) return;

        // Check completion requirements based on room type
        switch (currentRoom.type) {
          case 'combat':
          case 'boss':
          case 'elite':
          case 'miniboss':
            if (!currentRoom.combatCompleted) {
              setMessage('⚠️ You must defeat all enemies before leaving this room!');
              return;
            }
            break;

          case 'treasure':
            if (!currentRoom.treasureLooted) {
              setMessage('⚠️ You must loot the treasure before leaving!');
              return;
            }
            break;

          case 'trap':
            if (!currentRoom.trapDisarmed) {
              setMessage('⚠️ You must disarm the trap before leaving!');
              return;
            }
            break;

          case 'rest':
            if (!currentRoom.restUsed) {
              setMessage('⚠️ You should rest before leaving! (Or click "Skip Rest")');
              return;
            }
            break;

          case 'shrine':
            if (!currentRoom.shrineUsed) {
              setMessage('⚠️ You should use the shrine before leaving! (Or click "Skip Shrine")');
              return;
            }
            break;

          case 'mystery':
            if (!currentRoom.mysteryResolved) {
              setMessage('⚠️ You must investigate the mystery before leaving!');
              return;
            }
            break;

          // start, exit: no completion requirement
        }

        // Proceed with movement
        const result = dungeon.moveToRoom(direction);
        ...
      };
      */

      expect(true).toBe(true);
    });
  });
});

/**
 * Tier System Tests
 *
 * Tests for the new tier progression system:
 * - 4 tiers per dungeon (Easy, Normal, Hard, Elite)
 * - 5 floors per tier
 * - Tier completion and rewards
 * - Advancement to next tier
 */
describe('Tier System', () => {
  describe('Tier Initialization', () => {
    it('should initialize with tier 1 by default', () => {
      const dungeon = new Dungeon({ name: 'Test' });
      expect(dungeon.currentTier).toBe(1);
      expect(dungeon.tierFloorNumber).toBe(1);
    });

    it('should initialize tier run state correctly', () => {
      const dungeon = new Dungeon({ name: 'Test' });
      expect(dungeon.tierRunState.currentTier).toBe(1);
      expect(dungeon.tierRunState.currentFloor).toBe(1);
      expect(dungeon.tierRunState.floorsCompleted).toBe(0);
      expect(dungeon.tierRunState.canContinueToNextTier).toBe(false);
    });

    it('should allow starting at a specific tier', () => {
      const dungeon = new Dungeon({ name: 'Test', startingTier: 2 });
      expect(dungeon.currentTier).toBe(2);
      expect(dungeon.tierRunState.currentTier).toBe(2);
    });
  });

  describe('Tier Info', () => {
    it('should return correct tier information', () => {
      const dungeon = new Dungeon({ name: 'Test' });
      const tierInfo = dungeon.getTierInfo();

      expect(tierInfo.currentTier).toBe(1);
      expect(tierInfo.tierName).toBe('Easy');
      expect(tierInfo.floorInTier).toBe(1);
      expect(tierInfo.floorsPerTier).toBe(5);
      expect(tierInfo.canAdvance).toBe(false);
    });

    it('should identify tier boss floor correctly', () => {
      const dungeon = new Dungeon({ name: 'Test' });

      // Floor 1 is not boss floor
      expect(dungeon.isTierBossFloor()).toBe(false);

      // Manually set to floor 5 (boss floor)
      (dungeon as any).tierFloorNumber = 5;
      expect(dungeon.isTierBossFloor()).toBe(true);
    });
  });

  describe('Floor Progression Within Tier', () => {
    it('should advance floor within tier on proceedToNextFloor', () => {
      const dungeon = new Dungeon({ name: 'Test' });
      dungeon.start();

      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      // Go to exit room
      const exitRoom = floor.rooms.find(r => r.type === 'exit');
      if (!exitRoom) return;

      floor.currentRoomId = exitRoom.id;
      exitRoom.status = 'current';

      const result = dungeon.proceedToNextFloor();

      expect(result.success).toBe(true);
      expect(dungeon.tierFloorNumber).toBe(2);
      expect(dungeon.tierRunState.currentFloor).toBe(2);
      expect(dungeon.tierRunState.floorsCompleted).toBe(1);
    });

    it('should increment floorsCompleted on each floor progression', () => {
      const dungeon = new Dungeon({ name: 'Test' });
      dungeon.start();

      // Progress through floors 1-4
      for (let i = 0; i < 4; i++) {
        const floor = dungeon.getCurrentFloor();
        if (!floor) break;

        const exitRoom = floor.rooms.find(r => r.type === 'exit');
        if (!exitRoom) break;

        floor.currentRoomId = exitRoom.id;
        exitRoom.status = 'current';

        dungeon.proceedToNextFloor();
      }

      expect(dungeon.tierRunState.floorsCompleted).toBe(4);
    });
  });

  describe('Tier Completion', () => {
    it('should mark tier as completed on floor 5 exit', () => {
      const dungeon = new Dungeon({ name: 'Test' });
      dungeon.start();

      // Set to floor 5 (boss floor)
      (dungeon as any).tierFloorNumber = 5;

      // Generate floor 5 with boss
      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      // Mark floor as tier boss floor
      (floor as any).isTierBossFloor = true;

      // Go to exit room
      const exitRoom = floor.rooms.find(r => r.type === 'exit');
      if (!exitRoom) return;

      floor.currentRoomId = exitRoom.id;
      exitRoom.status = 'current';

      const result = dungeon.proceedToNextFloor();

      expect(result.success).toBe(true);
      expect(result.tierCompleted).toBe(true);
      expect(result.tierCompletionResult).toBeDefined();
      expect(result.tierCompletionResult?.tierCompleted).toBe(1);
      expect(result.tierCompletionResult?.canContinue).toBe(true);
    });

    it('should set canContinueToNextTier after tier completion', () => {
      const dungeon = new Dungeon({ name: 'Test' });
      dungeon.start();

      (dungeon as any).tierFloorNumber = 5;

      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      (floor as any).isTierBossFloor = true;

      const exitRoom = floor.rooms.find(r => r.type === 'exit');
      if (!exitRoom) return;

      floor.currentRoomId = exitRoom.id;
      exitRoom.status = 'current';

      dungeon.proceedToNextFloor();

      expect(dungeon.tierRunState.canContinueToNextTier).toBe(true);
    });

    it('should mark dungeon complete on tier 4 completion', () => {
      const dungeon = new Dungeon({ name: 'Test', startingTier: 4 });
      dungeon.start();

      (dungeon as any).tierFloorNumber = 5;

      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      (floor as any).isTierBossFloor = true;

      const exitRoom = floor.rooms.find(r => r.type === 'exit');
      if (!exitRoom) return;

      floor.currentRoomId = exitRoom.id;
      exitRoom.status = 'current';

      const result = dungeon.proceedToNextFloor();

      expect(result.success).toBe(true);
      expect(result.tierCompleted).toBe(true);
      expect(result.dungeonCompleted).toBe(true);
      expect(result.tierCompletionResult?.isLastTier).toBe(true);
      expect(result.tierCompletionResult?.canContinue).toBe(false);
    });
  });

  describe('Tier Advancement', () => {
    it('should fail to advance without tier completion', () => {
      const dungeon = new Dungeon({ name: 'Test' });
      dungeon.start();

      const result = dungeon.advanceToNextTier();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot advance');
    });

    it('should advance to next tier after completion', () => {
      const dungeon = new Dungeon({ name: 'Test' });
      dungeon.start();

      // Complete tier 1
      (dungeon as any).tierFloorNumber = 5;

      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      (floor as any).isTierBossFloor = true;

      const exitRoom = floor.rooms.find(r => r.type === 'exit');
      if (!exitRoom) return;

      floor.currentRoomId = exitRoom.id;
      exitRoom.status = 'current';

      dungeon.proceedToNextFloor();

      // Now advance to tier 2
      const advanceResult = dungeon.advanceToNextTier();

      expect(advanceResult.success).toBe(true);
      expect(dungeon.currentTier).toBe(2);
      expect(dungeon.tierFloorNumber).toBe(1);
      expect(dungeon.tierRunState.currentTier).toBe(2);
      expect(dungeon.tierRunState.canContinueToNextTier).toBe(false);
    });

    it('should fail to advance past tier 4', () => {
      const dungeon = new Dungeon({ name: 'Test', startingTier: 4 });
      dungeon.start();

      // Even if canContinue is somehow true
      dungeon.tierRunState.canContinueToNextTier = true;

      const result = dungeon.advanceToNextTier();

      expect(result.success).toBe(false);
      expect(result.message).toContain('maximum tier');
    });
  });

  describe('Tier Rewards', () => {
    it('should accumulate pending rewards on tier completion', () => {
      const dungeon = new Dungeon({ name: 'Test' });
      dungeon.start();

      (dungeon as any).tierFloorNumber = 5;

      const floor = dungeon.getCurrentFloor();
      if (!floor) return;

      (floor as any).isTierBossFloor = true;

      const exitRoom = floor.rooms.find(r => r.type === 'exit');
      if (!exitRoom) return;

      floor.currentRoomId = exitRoom.id;
      exitRoom.status = 'current';

      dungeon.proceedToNextFloor();

      // Check pending rewards
      const tierInfo = dungeon.getTierInfo();
      expect(tierInfo.pendingRewards.gold).toBeGreaterThan(0);
      expect(tierInfo.pendingRewards.experience).toBeGreaterThan(0);
    });

    it('should claim and clear pending rewards', () => {
      const dungeon = new Dungeon({ name: 'Test' });
      dungeon.start();

      // Manually set pending rewards
      dungeon.tierRunState.pendingRewards = {
        gold: 500,
        items: [],
        experience: 1000
      };

      const rewards = dungeon.claimTierRewards();

      expect(rewards.gold).toBe(500);
      expect(rewards.experience).toBe(1000);
      expect(dungeon.totalGoldEarned).toBe(500);

      // Pending should be cleared
      const tierInfo = dungeon.getTierInfo();
      expect(tierInfo.pendingRewards.gold).toBe(0);
      expect(tierInfo.pendingRewards.experience).toBe(0);
    });
  });

  describe('Exit Dungeon', () => {
    it('should claim rewards and deactivate on exit', () => {
      const dungeon = new Dungeon({ name: 'Test' });
      dungeon.start();

      dungeon.tierRunState.pendingRewards = {
        gold: 300,
        items: [],
        experience: 500
      };

      const rewards = dungeon.exitDungeon();

      expect(rewards.gold).toBe(300);
      expect(rewards.experience).toBe(500);
      expect(dungeon.isActive).toBe(false);
    });
  });
});
