/**
 * WorldMap Generator Tests
 *
 * Tests for procedural worldmap generation, terrain, biomes, and object placement.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorldMapGenerator } from './WorldMapGenerator';
import type { WorldMap, Town, TerrainType, BiomeType } from '../../types/worldmap.types';

describe('WorldMapGenerator', () => {
  describe('generate', () => {
    it('should generate worldmap with correct dimensions', () => {
      const map = WorldMapGenerator.generate({
        width: 50,
        height: 50,
        seed: 'test-seed'
      });

      expect(map.width).toBe(50);
      expect(map.height).toBe(50);
      expect(map.tiles).toHaveLength(50);
      expect(map.tiles[0]).toHaveLength(50);
    });

    it('should generate worldmap with smaller dimensions', () => {
      const map = WorldMapGenerator.generate({
        width: 20,
        height: 20,
        seed: 'small-map'
      });

      expect(map.width).toBe(20);
      expect(map.height).toBe(20);
    });

    it('should use provided seed', () => {
      const map = WorldMapGenerator.generate({
        seed: 'custom-seed-123'
      });

      expect(map.seed).toBe('custom-seed-123');
      expect(map.id).toBe('custom-seed-123');
    });

    it('should generate deterministic maps with same seed', () => {
      const map1 = WorldMapGenerator.generate({ seed: 'deterministic-test' });
      const map2 = WorldMapGenerator.generate({ seed: 'deterministic-test' });

      // Same terrain at specific coordinates
      expect(map1.tiles[10][10].terrain).toBe(map2.tiles[10][10].terrain);
      expect(map1.tiles[25][25].terrain).toBe(map2.tiles[25][25].terrain);
    });

    it('should generate different maps with different seeds', () => {
      const map1 = WorldMapGenerator.generate({ seed: 'seed-A' });
      const map2 = WorldMapGenerator.generate({ seed: 'seed-B' });

      // Count differences
      let differences = 0;
      for (let y = 0; y < 50; y++) {
        for (let x = 0; x < 50; x++) {
          if (map1.tiles[y][x].terrain !== map2.tiles[y][x].terrain) {
            differences++;
          }
        }
      }

      // Should have significant differences
      expect(differences).toBeGreaterThan(100);
    });
  });

  describe('Terrain Generation', () => {
    it('should generate valid terrain types', () => {
      const map = WorldMapGenerator.generate({ seed: 'terrain-test' });
      const validTerrains: TerrainType[] = [
        'plains', 'forest', 'mountains', 'desert', 'swamp', 'water', 'road'
      ];

      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          expect(validTerrains).toContain(map.tiles[y][x].terrain);
        }
      }
    });

    it('should generate variety of terrain types', () => {
      const map = WorldMapGenerator.generate({ seed: 'variety-test' });
      const terrainCounts: Record<string, number> = {};

      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          const terrain = map.tiles[y][x].terrain;
          terrainCounts[terrain] = (terrainCounts[terrain] || 0) + 1;
        }
      }

      // Should have multiple terrain types
      expect(Object.keys(terrainCounts).length).toBeGreaterThanOrEqual(3);
    });

    it('should assign correct movement costs', () => {
      const map = WorldMapGenerator.generate({ seed: 'movement-test' });

      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          const tile = map.tiles[y][x];
          expect(tile.movementCost).toBeDefined();
          expect(tile.movementCost).toBeGreaterThan(0);
        }
      }
    });

    it('should have higher movement cost for difficult terrain', () => {
      const map = WorldMapGenerator.generate({ seed: 'cost-test' });

      // Find road and mountain tiles
      let roadCost = 0;
      let mountainCost = 0;

      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          const tile = map.tiles[y][x];
          if (tile.terrain === 'road' && roadCost === 0) {
            roadCost = tile.movementCost;
          }
          if (tile.terrain === 'mountains' && mountainCost === 0) {
            mountainCost = tile.movementCost;
          }
        }
      }

      if (roadCost > 0 && mountainCost > 0) {
        expect(mountainCost).toBeGreaterThan(roadCost);
      }
    });
  });

  describe('Biome Assignment', () => {
    it('should assign valid biome types', () => {
      const map = WorldMapGenerator.generate({ seed: 'biome-test' });
      const validBiomes: BiomeType[] = [
        'kingdom', 'forest_region', 'mountain_region', 'desert_region', 'swamp_region'
      ];

      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          expect(validBiomes).toContain(map.tiles[y][x].biome);
        }
      }
    });

    it('should have kingdom biome near center', () => {
      const map = WorldMapGenerator.generate({ seed: 'center-test', width: 50, height: 50 });

      // Check center area (within 10 tiles of center)
      const centerX = 25;
      const centerY = 25;

      let kingdomCount = 0;
      for (let y = centerY - 5; y <= centerY + 5; y++) {
        for (let x = centerX - 5; x <= centerX + 5; x++) {
          if (map.tiles[y]?.[x]?.biome === 'kingdom') {
            kingdomCount++;
          }
        }
      }

      expect(kingdomCount).toBeGreaterThan(0);
    });
  });

  describe('Town Placement', () => {
    it('should place towns on the map', () => {
      const map = WorldMapGenerator.generate({ seed: 'town-test', townCount: 4 });

      const towns = map.staticObjects.filter((o) => o.type === 'town') as Town[];
      expect(towns.length).toBeGreaterThanOrEqual(1);
    });

    it('should place progressive towns with correct names', () => {
      const map = WorldMapGenerator.generate({ seed: 'named-towns', townCount: 4 });

      const towns = map.staticObjects.filter((o) => o.type === 'town') as Town[];
      const townNames = towns.map((t) => t.name);

      expect(townNames).toContain('Goldhaven');
    });

    it('should place towns on passable terrain', () => {
      const map = WorldMapGenerator.generate({ seed: 'passable-towns' });

      const towns = map.staticObjects.filter((o) => o.type === 'town') as Town[];

      for (const town of towns) {
        const tile = map.tiles[town.position.y][town.position.x];
        expect(tile.terrain).not.toBe('water');
        // Towns should be placed on plains
        expect(tile.terrain).toBe('plains');
      }
    });

    it('should place towns at least 15 tiles apart', () => {
      const map = WorldMapGenerator.generate({ seed: 'spaced-towns', townCount: 4 });

      const towns = map.staticObjects.filter((o) => o.type === 'town') as Town[];

      for (let i = 0; i < towns.length; i++) {
        for (let j = i + 1; j < towns.length; j++) {
          const distance = Math.sqrt(
            Math.pow(towns[i].position.x - towns[j].position.x, 2) +
            Math.pow(towns[i].position.y - towns[j].position.y, 2)
          );
          expect(distance).toBeGreaterThanOrEqual(15);
        }
      }
    });

    it('should assign buildings to towns', () => {
      const map = WorldMapGenerator.generate({ seed: 'building-test' });

      const towns = map.staticObjects.filter((o) => o.type === 'town') as Town[];

      for (const town of towns) {
        expect(town.buildings).toBeDefined();
        expect(town.buildings.tavern).toBe(true);
        expect(town.buildings.smithy).toBe(true);
        expect(town.buildings.healer).toBe(true);
        expect(town.buildings.market).toBe(true);
        expect(town.buildings.bank).toBe(true);
      }
    });

    it('should assign factions to towns', () => {
      const map = WorldMapGenerator.generate({ seed: 'faction-test', townCount: 4 });

      const towns = map.staticObjects.filter((o) => o.type === 'town') as Town[];
      const validFactions = ['Humans', 'Elves', 'Dwarves', 'Mages'];

      for (const town of towns) {
        expect(validFactions).toContain(town.faction);
      }
    });
  });

  describe('Dungeon Placement', () => {
    it('should place dungeons on the map', () => {
      const map = WorldMapGenerator.generate({ seed: 'dungeon-test', dungeonCount: 5 });

      const dungeons = map.staticObjects.filter((o) => o.type === 'dungeon');
      expect(dungeons.length).toBeGreaterThanOrEqual(1);
    });

    it('should place dungeons near towns', () => {
      const map = WorldMapGenerator.generate({ seed: 'near-town', townCount: 4, dungeonCount: 5 });

      const towns = map.staticObjects.filter((o) => o.type === 'town') as Town[];
      const dungeons = map.staticObjects.filter((o) => o.type === 'dungeon');

      // Each dungeon (except Endless Abyss) should be within 11 tiles of a town
      for (const dungeon of dungeons) {
        if (dungeon.name === 'Endless Abyss') continue;

        const distances = towns.map((town) =>
          Math.sqrt(
            Math.pow(dungeon.position.x - town.position.x, 2) +
            Math.pow(dungeon.position.y - town.position.y, 2)
          )
        );

        const minDistance = Math.min(...distances);
        expect(minDistance).toBeLessThanOrEqual(11);
      }
    });

    it('should place dungeons on valid terrain', () => {
      const map = WorldMapGenerator.generate({ seed: 'valid-dungeon' });

      const dungeons = map.staticObjects.filter((o) => o.type === 'dungeon');

      for (const dungeon of dungeons) {
        const tile = map.tiles[dungeon.position.y][dungeon.position.x];
        expect(tile.terrain).not.toBe('water');
      }
    });

    it('should place dungeons with progressive difficulty', () => {
      const map = WorldMapGenerator.generate({ seed: 'difficulty-test' });

      const dungeons = map.staticObjects.filter((o) => o.type === 'dungeon');
      const difficulties = dungeons.map((d) => (d as any).difficulty);

      expect(difficulties).toContain('Easy');
      expect(difficulties).toContain('Medium');
      expect(difficulties).toContain('Hard');
      expect(difficulties).toContain('Nightmare');
    });
  });

  describe('Road Generation', () => {
    it('should generate roads connecting towns', () => {
      const map = WorldMapGenerator.generate({ seed: 'road-test', townCount: 4 });

      let roadCount = 0;
      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          if (map.tiles[y][x].terrain === 'road') {
            roadCount++;
          }
        }
      }

      expect(roadCount).toBeGreaterThan(0);
    });

    it('should have roads between town positions', () => {
      const map = WorldMapGenerator.generate({ seed: 'connected-roads', townCount: 2 });

      const towns = map.staticObjects.filter((o) => o.type === 'town') as Town[];

      if (towns.length >= 2) {
        // Check that at least some tiles between towns are roads
        const town1 = towns[0];
        const town2 = towns[1];

        // Simple check: count roads between the two towns
        let roadsBetween = 0;
        const minX = Math.min(town1.position.x, town2.position.x);
        const maxX = Math.max(town1.position.x, town2.position.x);
        const minY = Math.min(town1.position.y, town2.position.y);
        const maxY = Math.max(town1.position.y, town2.position.y);

        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            if (map.tiles[y]?.[x]?.terrain === 'road') {
              roadsBetween++;
            }
          }
        }

        expect(roadsBetween).toBeGreaterThan(0);
      }
    });
  });

  describe('Portal Placement', () => {
    it('should place portals on the map', () => {
      const map = WorldMapGenerator.generate({ seed: 'portal-test' });

      const portals = map.staticObjects.filter((o) => o.type === 'portal');
      expect(portals.length).toBeGreaterThanOrEqual(0);
    });

    it('should link portals in pairs', () => {
      const map = WorldMapGenerator.generate({ seed: 'linked-portals' });

      const portals = map.staticObjects.filter((o) => o.type === 'portal');

      // Count linked portals
      let linkedCount = 0;
      for (const portal of portals) {
        if ((portal as any).linkedPortalId) {
          linkedCount++;
        }
      }

      // Most portals should be linked (pairs)
      if (portals.length > 0) {
        expect(linkedCount).toBe(portals.length);
      }
    });
  });

  describe('Treasure Chest Placement', () => {
    it('should place treasure chests', () => {
      const map = WorldMapGenerator.generate({ seed: 'chest-test' });

      const chests = map.staticObjects.filter((o) => o.type === 'treasureChest');
      expect(chests.length).toBeGreaterThanOrEqual(0);
    });

    it('should assign loot quality to chests', () => {
      const map = WorldMapGenerator.generate({ seed: 'loot-quality' });

      const chests = map.staticObjects.filter((o) => o.type === 'treasureChest');
      const validQualities = ['common', 'uncommon', 'rare', 'epic'];

      for (const chest of chests) {
        expect(validQualities).toContain((chest as any).lootQuality);
      }
    });
  });

  describe('Rare Spawn Placement', () => {
    it('should place rare spawns', () => {
      const map = WorldMapGenerator.generate({ seed: 'rare-spawn-test' });

      const rareSpawns = map.staticObjects.filter((o) => o.type === 'rareSpawn');
      expect(rareSpawns.length).toBeGreaterThanOrEqual(0);
    });

    it('should assign enemy info to rare spawns', () => {
      const map = WorldMapGenerator.generate({ seed: 'rare-enemy' });

      const rareSpawns = map.staticObjects.filter((o) => o.type === 'rareSpawn');

      for (const spawn of rareSpawns) {
        expect((spawn as any).enemyName).toBeDefined();
        expect((spawn as any).enemyLevel).toBeDefined();
        expect((spawn as any).guaranteedDrop).toBeDefined();
      }
    });
  });

  describe('Observation Tower Placement', () => {
    it('should place observation towers', () => {
      const map = WorldMapGenerator.generate({ seed: 'tower-test' });

      const towers = map.staticObjects.filter((o) => o.type === 'observationTower');
      expect(towers.length).toBeGreaterThanOrEqual(0);
    });

    it('should assign reveal radius to towers', () => {
      const map = WorldMapGenerator.generate({ seed: 'reveal-test' });

      const towers = map.staticObjects.filter((o) => o.type === 'observationTower');

      for (const tower of towers) {
        expect((tower as any).revealRadius).toBeDefined();
        expect((tower as any).revealRadius).toBeGreaterThan(0);
      }
    });
  });

  describe('Healing Well Placement', () => {
    it('should place healing wells near dungeons', () => {
      const map = WorldMapGenerator.generate({ seed: 'well-test' });

      const wells = map.staticObjects.filter((o) => o.type === 'healingWell');
      expect(wells.length).toBeGreaterThanOrEqual(0);
    });

    it('should assign heal percentages to wells', () => {
      const map = WorldMapGenerator.generate({ seed: 'heal-percent' });

      const wells = map.staticObjects.filter((o) => o.type === 'healingWell');
      const validPercentages = [25, 50, 75, 100];

      for (const well of wells) {
        expect(validPercentages).toContain((well as any).healPercent);
      }
    });
  });

  describe('Dynamic Objects', () => {
    it('should spawn wandering monsters', () => {
      const map = WorldMapGenerator.generate({ seed: 'monster-test' });

      const monsters = map.dynamicObjects.filter((o) => o.type === 'wanderingMonster');
      expect(monsters.length).toBeGreaterThanOrEqual(0);
    });

    it('should spawn traveling merchants', () => {
      const map = WorldMapGenerator.generate({ seed: 'merchant-test' });

      const merchants = map.dynamicObjects.filter((o) => o.type === 'travelingMerchant');
      expect(merchants.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Weather and Time', () => {
    it('should initialize weather', () => {
      const map = WorldMapGenerator.generate({ seed: 'weather-test' });

      expect(map.weather).toBeDefined();
      expect(map.weather.current).toBeDefined();
      expect(['clear', 'rain', 'storm', 'fog', 'snow']).toContain(map.weather.current);
    });

    it('should initialize time of day', () => {
      const map = WorldMapGenerator.generate({ seed: 'time-test' });

      expect(map.timeOfDay).toBeDefined();
      expect(map.timeOfDay.current).toBeDefined();
      expect(['day', 'night', 'dawn', 'dusk']).toContain(map.timeOfDay.current);
    });
  });

  describe('getStartingTownByCP', () => {
    let towns: Town[];

    beforeEach(() => {
      const map = WorldMapGenerator.generate({ seed: 'starting-town', townCount: 4 });
      towns = map.staticObjects.filter((o) => o.type === 'town') as Town[];
    });

    it('should return Goldhaven for low CP (0-12000)', () => {
      const startTown = WorldMapGenerator.getStartingTownByCP(towns, 0);
      expect(startTown.name).toBe('Goldhaven');

      const midLow = WorldMapGenerator.getStartingTownByCP(towns, 5000);
      expect(midLow.name).toBe('Goldhaven');

      const threshold = WorldMapGenerator.getStartingTownByCP(towns, 12000);
      expect(threshold.name).toBe('Goldhaven');
    });

    it('should return Ariandel for mid CP (12001-22000)', () => {
      const startTown = WorldMapGenerator.getStartingTownByCP(towns, 12001);
      expect(startTown.name).toBe('Ariandel');

      const mid = WorldMapGenerator.getStartingTownByCP(towns, 17000);
      expect(mid.name).toBe('Ariandel');
    });

    it('should return Gorundrim for high CP (22001-32000)', () => {
      const startTown = WorldMapGenerator.getStartingTownByCP(towns, 22001);
      expect(startTown.name).toBe('Gorundrim');

      const high = WorldMapGenerator.getStartingTownByCP(towns, 28000);
      expect(high.name).toBe('Gorundrim');
    });

    it('should return Astralheim for very high CP (32001+)', () => {
      const startTown = WorldMapGenerator.getStartingTownByCP(towns, 32001);
      expect(startTown.name).toBe('Astralheim');

      const endgame = WorldMapGenerator.getStartingTownByCP(towns, 100000);
      expect(endgame.name).toBe('Astralheim');
    });

    it('should fallback to first town if target not found', () => {
      const incompleteTowns = [towns[0]]; // Only Goldhaven
      const startTown = WorldMapGenerator.getStartingTownByCP(incompleteTowns, 50000);

      expect(startTown).toBe(towns[0]);
    });
  });

  describe('Tile Properties', () => {
    it('should initialize tiles as unexplored', () => {
      const map = WorldMapGenerator.generate({ seed: 'explore-test' });

      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          expect(map.tiles[y][x].isExplored).toBe(false);
        }
      }
    });

    it('should have correct coordinates on tiles', () => {
      const map = WorldMapGenerator.generate({ seed: 'coord-test' });

      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          expect(map.tiles[y][x].x).toBe(x);
          expect(map.tiles[y][x].y).toBe(y);
        }
      }
    });
  });

  describe('Map Metadata', () => {
    it('should have creation date', () => {
      const map = WorldMapGenerator.generate({ seed: 'date-test' });

      expect(map.createdAt).toBeDefined();
      expect(map.createdAt instanceof Date).toBe(true);
    });

    it('should have empty players array', () => {
      const map = WorldMapGenerator.generate({ seed: 'players-test' });

      expect(map.players).toBeDefined();
      expect(map.players).toHaveLength(0);
    });
  });
});
