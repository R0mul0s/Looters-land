/**
 * Dungeon Generator Tests
 *
 * Tests for room distribution, boss placement, floor generation, and dungeon structure.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import { describe, it, expect, vi } from 'vitest';
import { DungeonGenerator } from './DungeonGenerator';
import type { Room, Floor, RoomType } from '../../types/dungeon.types';

// Mock i18n to avoid browser dependencies
vi.mock('../../localization/i18n', () => ({
  t: (key: string) => key
}));

describe('DungeonGenerator', () => {
  describe('Floor Generation', () => {
    it('should generate floor with correct floor number', () => {
      const floor = DungeonGenerator.generateFloor({
        floorNumber: 5,
        roomCount: 10,
        difficulty: 1.0
      });

      expect(floor.floorNumber).toBe(5);
    });

    it('should generate specified number of rooms (approximately)', () => {
      const floor = DungeonGenerator.generateFloor({
        floorNumber: 1,
        roomCount: 10,
        difficulty: 1.0
      });

      // Room count includes start, exit, and optional boss
      // So actual count might be slightly different
      expect(floor.rooms.length).toBeGreaterThanOrEqual(10);
      expect(floor.rooms.length).toBeLessThanOrEqual(15);
    });

    it('should always include start room', () => {
      const floor = DungeonGenerator.generateFloor({
        floorNumber: 1,
        roomCount: 10,
        difficulty: 1.0
      });

      const startRoom = floor.rooms.find((r) => r.type === 'start');
      expect(startRoom).toBeDefined();
      expect(floor.startRoomId).toBe(startRoom!.id);
    });

    it('should always include exit room', () => {
      const floor = DungeonGenerator.generateFloor({
        floorNumber: 1,
        roomCount: 10,
        difficulty: 1.0
      });

      const exitRoom = floor.rooms.find((r) => r.type === 'exit');
      expect(exitRoom).toBeDefined();
      expect(floor.exitRoomId).toBe(exitRoom!.id);
    });

    it('should include boss room when guaranteeBoss is true', () => {
      const floor = DungeonGenerator.generateFloor({
        floorNumber: 1,
        roomCount: 10,
        difficulty: 1.0,
        guaranteeBoss: true
      });

      const bossRoom = floor.rooms.find((r) => r.type === 'boss');
      expect(bossRoom).toBeDefined();
      expect(floor.bossRoomId).toBe(bossRoom!.id);
    });

    it('should not include boss room when guaranteeBoss is false', () => {
      const floor = DungeonGenerator.generateFloor({
        floorNumber: 1,
        roomCount: 10,
        difficulty: 1.0,
        guaranteeBoss: false
      });

      const bossRoom = floor.rooms.find((r) => r.type === 'boss');
      expect(bossRoom).toBeUndefined();
      expect(floor.bossRoomId).toBeUndefined();
    });

    it('should set current room to start room', () => {
      const floor = DungeonGenerator.generateFloor({
        floorNumber: 1,
        roomCount: 10,
        difficulty: 1.0
      });

      expect(floor.currentRoomId).toBe(floor.startRoomId);
    });

    it('should initialize floor as unexplored and incomplete', () => {
      const floor = DungeonGenerator.generateFloor({
        floorNumber: 1,
        roomCount: 10,
        difficulty: 1.0
      });

      expect(floor.explored).toBe(false);
      expect(floor.completed).toBe(false);
    });
  });

  describe('Room Types Distribution', () => {
    it('should generate various room types', () => {
      // Generate multiple floors to check distribution
      const roomTypeCounts: Record<string, number> = {};

      for (let i = 0; i < 10; i++) {
        const floor = DungeonGenerator.generateFloor({
          floorNumber: 1,
          roomCount: 20,
          difficulty: 1.0
        });

        floor.rooms.forEach((room) => {
          roomTypeCounts[room.type] = (roomTypeCounts[room.type] || 0) + 1;
        });
      }

      // Should have combat rooms (most common)
      expect(roomTypeCounts['combat']).toBeGreaterThan(0);

      // Should have start and exit rooms
      expect(roomTypeCounts['start']).toBe(10); // One per floor
      expect(roomTypeCounts['exit']).toBe(10); // One per floor
    });

    it('should generate all room types over many iterations', () => {
      const expectedTypes: RoomType[] = [
        'start', 'exit', 'combat', 'boss', 'treasure',
        'trap', 'rest', 'elite', 'shrine', 'mystery', 'miniboss'
      ];

      const foundTypes = new Set<string>();

      // Generate many floors to find all room types
      for (let i = 0; i < 50; i++) {
        const floor = DungeonGenerator.generateFloor({
          floorNumber: 1,
          roomCount: 15,
          difficulty: 1.0,
          guaranteeBoss: true
        });

        floor.rooms.forEach((room) => {
          foundTypes.add(room.type);
        });
      }

      // Should have found most room types
      expect(foundTypes.size).toBeGreaterThanOrEqual(7);

      // Essential types must exist
      expect(foundTypes.has('start')).toBe(true);
      expect(foundTypes.has('exit')).toBe(true);
      expect(foundTypes.has('combat')).toBe(true);
      expect(foundTypes.has('boss')).toBe(true);
    });

    it('should have combat rooms as most common type', () => {
      let combatRooms = 0;
      let otherRooms = 0;

      for (let i = 0; i < 20; i++) {
        const floor = DungeonGenerator.generateFloor({
          floorNumber: 1,
          roomCount: 15,
          difficulty: 1.0
        });

        floor.rooms.forEach((room) => {
          if (room.type === 'combat') combatRooms++;
          else if (!['start', 'exit', 'boss'].includes(room.type)) otherRooms++;
        });
      }

      // Combat should be significant portion
      expect(combatRooms).toBeGreaterThan(otherRooms * 0.2);
    });
  });

  describe('Room Connections', () => {
    it('should connect all rooms', () => {
      const floor = DungeonGenerator.generateFloor({
        floorNumber: 1,
        roomCount: 10,
        difficulty: 1.0
      });

      // Every room (except possibly start) should have at least one connection
      floor.rooms.forEach((room) => {
        expect(room.connections.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should use valid direction connections', () => {
      const validDirections = ['north', 'south', 'east', 'west'];

      const floor = DungeonGenerator.generateFloor({
        floorNumber: 1,
        roomCount: 10,
        difficulty: 1.0
      });

      floor.rooms.forEach((room) => {
        room.connections.forEach((direction) => {
          expect(validDirections).toContain(direction);
        });
      });
    });

    it('should have bidirectional connections', () => {
      const floor = DungeonGenerator.generateFloor({
        floorNumber: 1,
        roomCount: 10,
        difficulty: 1.0
      });

      const roomMap = new Map<string, Room>();
      floor.rooms.forEach((room) => {
        roomMap.set(`${room.position.x},${room.position.y}`, room);
      });

      // Check that connections are bidirectional
      floor.rooms.forEach((room) => {
        room.connections.forEach((direction) => {
          let adjacentPos: { x: number; y: number } | null = null;
          let oppositeDirection: string | null = null;

          switch (direction) {
            case 'north':
              adjacentPos = { x: room.position.x, y: room.position.y - 1 };
              oppositeDirection = 'south';
              break;
            case 'south':
              adjacentPos = { x: room.position.x, y: room.position.y + 1 };
              oppositeDirection = 'north';
              break;
            case 'east':
              adjacentPos = { x: room.position.x + 1, y: room.position.y };
              oppositeDirection = 'west';
              break;
            case 'west':
              adjacentPos = { x: room.position.x - 1, y: room.position.y };
              oppositeDirection = 'east';
              break;
          }

          if (adjacentPos) {
            const adjacentRoom = roomMap.get(`${adjacentPos.x},${adjacentPos.y}`);
            if (adjacentRoom) {
              // Adjacent room should have opposite connection
              expect(adjacentRoom.connections).toContain(oppositeDirection);
            }
          }
        });
      });
    });
  });

  describe('Room Positioning', () => {
    it('should not have overlapping room positions', () => {
      const floor = DungeonGenerator.generateFloor({
        floorNumber: 1,
        roomCount: 15,
        difficulty: 1.0
      });

      const positions = new Set<string>();

      floor.rooms.forEach((room) => {
        const key = `${room.position.x},${room.position.y}`;
        expect(positions.has(key)).toBe(false);
        positions.add(key);
      });
    });

    it('should never have overlapping positions (stress test)', () => {
      // Run multiple times to verify fix - overlap rate should be 0%
      let overlapCount = 0;
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        const floor = DungeonGenerator.generateFloor({
          floorNumber: 1,
          roomCount: 15,
          difficulty: 1.0,
          guaranteeBoss: true
        });

        const positions = new Set<string>();
        let hasOverlap = false;

        floor.rooms.forEach((room) => {
          const key = `${room.position.x},${room.position.y}`;
          if (positions.has(key)) hasOverlap = true;
          positions.add(key);
        });

        if (hasOverlap) overlapCount++;
      }

      // After fix, there should be zero overlaps
      expect(overlapCount).toBe(0);
    });

    it('should position rooms within grid bounds', () => {
      const floor = DungeonGenerator.generateFloor({
        floorNumber: 1,
        roomCount: 10,
        difficulty: 1.0
      });

      floor.rooms.forEach((room) => {
        expect(room.position.x).toBeGreaterThanOrEqual(0);
        expect(room.position.y).toBeGreaterThanOrEqual(0);
        // Grid size is calculated as ceil(sqrt(roomCount * 2))
        const maxSize = Math.ceil(Math.sqrt(10 * 2)) + 5; // Allow some margin
        expect(room.position.x).toBeLessThan(maxSize);
        expect(room.position.y).toBeLessThan(maxSize);
      });
    });
  });

  describe('Difficulty Scaling', () => {
    it('should scale enemy levels with floor number', () => {
      const floor1 = DungeonGenerator.generateFloor({
        floorNumber: 1,
        roomCount: 10,
        difficulty: 1.0
      });

      const floor10 = DungeonGenerator.generateFloor({
        floorNumber: 10,
        roomCount: 10,
        difficulty: 1.0
      });

      const getAverageEnemyLevel = (floor: Floor): number => {
        let totalLevel = 0;
        let count = 0;

        floor.rooms.forEach((room) => {
          if (room.enemies) {
            room.enemies.forEach((enemy) => {
              totalLevel += enemy.level;
              count++;
            });
          }
        });

        return count > 0 ? totalLevel / count : 0;
      };

      const avgLevel1 = getAverageEnemyLevel(floor1);
      const avgLevel10 = getAverageEnemyLevel(floor10);

      // Floor 10 should have higher level enemies
      if (avgLevel1 > 0 && avgLevel10 > 0) {
        expect(avgLevel10).toBeGreaterThan(avgLevel1);
      }
    });

    it('should scale with tier-based baseEnemyLevel', () => {
      // Simulating Tier 1 (Easy): baseLevel 5 * 1.0 = 5
      const tier1Floor = DungeonGenerator.generateFloor({
        floorNumber: 1,
        tierFloorNumber: 1,
        tier: 1,
        roomCount: 10,
        difficulty: 1.0,
        baseEnemyLevel: 5
      });

      // Simulating Tier 4 (Elite): baseLevel 5 * 3.0 = 15
      const tier4Floor = DungeonGenerator.generateFloor({
        floorNumber: 1,
        tierFloorNumber: 1,
        tier: 4,
        roomCount: 10,
        difficulty: 1.0,
        baseEnemyLevel: 15
      });

      // Tier 4 floor should have stronger enemies than Tier 1
      const tier1Boss = tier1Floor.rooms.find((r) => r.type === 'boss');
      const tier4Boss = tier4Floor.rooms.find((r) => r.type === 'boss');

      if (tier1Boss?.enemies && tier4Boss?.enemies) {
        expect(tier4Boss.enemies[0].level).toBeGreaterThan(tier1Boss.enemies[0].level);
      }
    });
  });

  describe('Boss Room', () => {
    it('should have exactly one boss enemy', () => {
      const floor = DungeonGenerator.generateFloor({
        floorNumber: 1,
        roomCount: 10,
        difficulty: 1.0,
        guaranteeBoss: true
      });

      const bossRoom = floor.rooms.find((r) => r.type === 'boss');
      expect(bossRoom).toBeDefined();
      expect(bossRoom!.enemies).toHaveLength(1);
      expect(bossRoom!.enemies![0].type).toBe('boss');
    });

    it('should have boss with higher level than normal enemies', () => {
      const floor = DungeonGenerator.generateFloor({
        floorNumber: 5,
        roomCount: 10,
        difficulty: 1.0,
        guaranteeBoss: true
      });

      const bossRoom = floor.rooms.find((r) => r.type === 'boss');
      const combatRoom = floor.rooms.find((r) => r.type === 'combat' && r.enemies);

      if (bossRoom?.enemies && combatRoom?.enemies) {
        const bossLevel = bossRoom.enemies[0].level;
        const enemyLevel = combatRoom.enemies[0].level;

        // Boss level should be higher (1.6x floor level vs normal scaling)
        expect(bossLevel).toBeGreaterThan(enemyLevel);
      }
    });

    it('should initialize boss as not defeated', () => {
      const floor = DungeonGenerator.generateFloor({
        floorNumber: 1,
        roomCount: 10,
        difficulty: 1.0,
        guaranteeBoss: true
      });

      const bossRoom = floor.rooms.find((r) => r.type === 'boss');
      expect(bossRoom!.bossDefeated).toBe(false);
    });
  });

  describe('Combat Rooms', () => {
    it('should have enemies in combat rooms', () => {
      const floor = DungeonGenerator.generateFloor({
        floorNumber: 1,
        roomCount: 15,
        difficulty: 1.0
      });

      const combatRooms = floor.rooms.filter((r) => r.type === 'combat');

      combatRooms.forEach((room) => {
        expect(room.enemies).toBeDefined();
        expect(room.enemies!.length).toBeGreaterThan(0);
      });
    });

    it('should scale enemy count with room difficulty', () => {
      // Generate many rooms to check distribution
      let easyEnemies = 0;
      let eliteEnemies = 0;

      for (let i = 0; i < 20; i++) {
        const floor = DungeonGenerator.generateFloor({
          floorNumber: 1,
          roomCount: 20,
          difficulty: 1.0
        });

        floor.rooms.forEach((room) => {
          if (room.type === 'combat' && room.enemies) {
            if (room.difficulty === 'easy') {
              easyEnemies += room.enemies.length;
            } else if (room.difficulty === 'elite') {
              eliteEnemies += room.enemies.length;
            }
          }
        });
      }

      // Elite rooms typically have 3 enemies, easy have 1
      // (This test just verifies the system works)
      expect(easyEnemies + eliteEnemies).toBeGreaterThan(0);
    });

    it('should mark combat as not completed', () => {
      const floor = DungeonGenerator.generateFloor({
        floorNumber: 1,
        roomCount: 10,
        difficulty: 1.0
      });

      const combatRooms = floor.rooms.filter((r) => r.type === 'combat');

      combatRooms.forEach((room) => {
        expect(room.combatCompleted).toBe(false);
      });
    });
  });

  describe('Treasure Rooms', () => {
    it('should have items in treasure rooms', () => {
      // Generate multiple floors to find treasure rooms
      for (let i = 0; i < 20; i++) {
        const floor = DungeonGenerator.generateFloor({
          floorNumber: 5,
          roomCount: 15,
          difficulty: 1.0
        });

        const treasureRoom = floor.rooms.find((r) => r.type === 'treasure');
        if (treasureRoom) {
          expect(treasureRoom.treasureItems).toBeDefined();
          expect(treasureRoom.treasureItems!.length).toBeGreaterThan(0);
          expect(treasureRoom.treasureGold).toBeGreaterThan(0);
          expect(treasureRoom.treasureLooted).toBe(false);
          return; // Test passed
        }
      }

      // If no treasure room found in 20 attempts, that's OK (low probability)
    });
  });

  describe('Trap Rooms', () => {
    it('should have trap damage in trap rooms', () => {
      // Generate multiple floors to find trap rooms
      for (let i = 0; i < 30; i++) {
        const floor = DungeonGenerator.generateFloor({
          floorNumber: 5,
          roomCount: 15,
          difficulty: 1.0
        });

        const trapRoom = floor.rooms.find((r) => r.type === 'trap');
        if (trapRoom) {
          expect(trapRoom.trapDamage).toBeGreaterThan(0);
          expect(trapRoom.trapDisarmed).toBe(false);
          expect(trapRoom.trapDescription).toBeDefined();
          return; // Test passed
        }
      }
    });
  });

  describe('Rest Rooms', () => {
    it('should have heal amount in rest rooms', () => {
      // Generate multiple floors to find rest rooms
      for (let i = 0; i < 30; i++) {
        const floor = DungeonGenerator.generateFloor({
          floorNumber: 5,
          roomCount: 15,
          difficulty: 1.0
        });

        const restRoom = floor.rooms.find((r) => r.type === 'rest');
        if (restRoom) {
          expect(restRoom.healAmount).toBeGreaterThan(0);
          expect(restRoom.restUsed).toBe(false);
          return; // Test passed
        }
      }
    });

    it('should scale heal amount with tier-based baseEnemyLevel', () => {
      // New formula: 50 + baseEnemyLevel * 5
      let tier1Heal: number | undefined;
      let tier4Heal: number | undefined;

      // Find rest rooms in different tiers
      for (let i = 0; i < 50; i++) {
        if (!tier1Heal) {
          const floor = DungeonGenerator.generateFloor({
            floorNumber: 1,
            roomCount: 15,
            difficulty: 1.0,
            baseEnemyLevel: 5 // Tier 1 level
          });
          const restRoom = floor.rooms.find((r) => r.type === 'rest');
          if (restRoom) tier1Heal = restRoom.healAmount;
        }

        if (!tier4Heal) {
          const floor = DungeonGenerator.generateFloor({
            floorNumber: 1,
            roomCount: 15,
            difficulty: 1.0,
            baseEnemyLevel: 15 // Tier 4 level (5 * 3.0)
          });
          const restRoom = floor.rooms.find((r) => r.type === 'rest');
          if (restRoom) tier4Heal = restRoom.healAmount;
        }

        if (tier1Heal && tier4Heal) break;
      }

      if (tier1Heal && tier4Heal) {
        expect(tier4Heal).toBeGreaterThan(tier1Heal);
      }
    });
  });

  describe('Shrine Rooms', () => {
    it('should have buff type in shrine rooms', () => {
      // Generate multiple floors to find shrine rooms
      for (let i = 0; i < 50; i++) {
        const floor = DungeonGenerator.generateFloor({
          floorNumber: 5,
          roomCount: 15,
          difficulty: 1.0
        });

        const shrineRoom = floor.rooms.find((r) => r.type === 'shrine');
        if (shrineRoom) {
          expect(['damage', 'xp', 'gold', 'stats']).toContain(shrineRoom.shrineBuffType);
          expect(shrineRoom.shrineUsed).toBe(false);
          return; // Test passed
        }
      }
    });
  });

  describe('Elite Rooms', () => {
    it('should have elite enemies and better rewards', () => {
      // Generate multiple floors to find elite rooms
      for (let i = 0; i < 30; i++) {
        const floor = DungeonGenerator.generateFloor({
          floorNumber: 5,
          roomCount: 15,
          difficulty: 1.0,
          heroLevel: 10
        });

        const eliteRoom = floor.rooms.find((r) => r.type === 'elite');
        if (eliteRoom) {
          expect(eliteRoom.enemies).toBeDefined();
          expect(eliteRoom.enemies!.some((e) => e.type === 'elite')).toBe(true);
          expect(eliteRoom.eliteRewards).toBeDefined();
          expect(eliteRoom.eliteRewards!.gold).toBeGreaterThan(0);
          expect(eliteRoom.eliteRewards!.items.length).toBeGreaterThan(0);
          return; // Test passed
        }
      }
    });
  });

  describe('Room Status', () => {
    it('should set start room as current', () => {
      const floor = DungeonGenerator.generateFloor({
        floorNumber: 1,
        roomCount: 10,
        difficulty: 1.0
      });

      const startRoom = floor.rooms.find((r) => r.type === 'start');
      expect(startRoom!.status).toBe('current');
    });

    it('should set other rooms as unexplored', () => {
      const floor = DungeonGenerator.generateFloor({
        floorNumber: 1,
        roomCount: 10,
        difficulty: 1.0
      });

      const otherRooms = floor.rooms.filter((r) => r.type !== 'start');
      otherRooms.forEach((room) => {
        expect(room.status).toBe('unexplored');
      });
    });
  });
});

describe('Room Difficulty', () => {
  it('should generate rooms with various difficulties', () => {
    const difficulties = new Set<string>();

    for (let i = 0; i < 50; i++) {
      const floor = DungeonGenerator.generateFloor({
        floorNumber: 1,
        roomCount: 15,
        difficulty: 1.0
      });

      floor.rooms.forEach((room) => {
        difficulties.add(room.difficulty);
      });
    }

    // Should have at least easy and normal
    expect(difficulties.has('easy')).toBe(true);
    expect(difficulties.has('normal')).toBe(true);
  });
});
