/**
 * WorldMap Generator - Procedurally generates large-scale worldmap
 *
 * Generates a 50x50 HOMAM-style worldmap with biomes, towns, dungeons,
 * and dynamic content. Uses Perlin noise for natural terrain generation.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-07
 */

import { PerlinNoise } from './PerlinNoise';
import type {
  WorldMap,
  Tile,
  TerrainType,
  BiomeType,
  Town,
  DungeonEntrance,
  WorldMapGenerationOptions,
  MapEncounter,
  ResourceNode,
  TERRAIN_MOVEMENT_COST
} from '../../types/worldmap.types';

import { TERRAIN_MOVEMENT_COST as MOVEMENT_COSTS } from '../../types/worldmap.types';

/**
 * WorldMap Generator class
 */
export class WorldMapGenerator {
  /**
   * Generate complete worldmap
   *
   * @param options - Generation options
   * @returns Generated worldmap
   *
   * @example
   * ```typescript
   * const worldmap = WorldMapGenerator.generate({
   *   width: 50,
   *   height: 50,
   *   seed: 'my-world-123'
   * });
   * ```
   */
  static generate(options: WorldMapGenerationOptions): WorldMap {
    const {
      width = 50,
      height = 50,
      seed = `world-${Date.now()}`,
      townCount = 4,
      dungeonCount = 5,
      encounterCount = 15,
      resourceCount = 50
    } = options;

    console.log('🗺️ Generating worldmap...', { width, height, seed });

    // 1. Generate base terrain with Perlin noise
    const tiles = this.generateTerrain(width, height, seed);

    // 2. Place fixed towns
    const towns = this.placeTowns(tiles, townCount);

    // 3. Place fixed dungeons
    const dungeons = this.placeDungeons(tiles, dungeonCount);

    // 4. Generate roads between towns
    this.generateRoads(tiles, towns);

    // 5. Spawn initial dynamic encounters
    const encounters = this.spawnInitialEncounters(tiles, encounterCount);

    // 6. Spawn initial resource nodes
    const resources = this.spawnInitialResources(tiles, resourceCount);

    console.log('✅ Worldmap generated successfully!');

    return {
      id: seed,
      width,
      height,
      seed,
      tiles,
      staticObjects: [...towns, ...dungeons],
      dynamicObjects: [...encounters, ...resources],
      players: [],
      createdAt: new Date()
    };
  }

  /**
   * Generate terrain using Perlin noise
   *
   * @param width - Map width
   * @param height - Map height
   * @param seed - World seed
   * @returns 2D array of tiles
   */
  private static generateTerrain(width: number, height: number, seed: string): Tile[][] {
    console.log('🌍 Generating terrain with Perlin noise...');
    const noise = new PerlinNoise(seed);
    const tiles: Tile[][] = [];

    for (let y = 0; y < height; y++) {
      tiles[y] = [];
      for (let x = 0; x < width; x++) {
        // Use octave noise for more natural terrain
        const value = noise.getOctave(x * 0.08, y * 0.08, 4, 0.5);

        // Determine terrain based on noise value
        let terrain: TerrainType;
        if (value < -0.4) terrain = 'water';
        else if (value < -0.2) terrain = 'swamp';
        else if (value < 0.0) terrain = 'plains';
        else if (value < 0.3) terrain = 'forest';
        else if (value < 0.5) terrain = 'desert';
        else terrain = 'mountains';

        // Determine biome based on position and terrain
        const biome = this.determineBiome(x, y, width, height, terrain);

        tiles[y][x] = {
          x,
          y,
          terrain,
          biome,
          staticObject: null,
          isExplored: false,
          movementCost: MOVEMENT_COSTS[terrain]
        };
      }
    }

    return tiles;
  }

  /**
   * Determine biome based on position
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param width - Map width
   * @param height - Map height
   * @param terrain - Terrain type
   * @returns Biome type
   */
  private static determineBiome(
    x: number,
    y: number,
    width: number,
    height: number,
    terrain: TerrainType
  ): BiomeType {
    const centerX = width / 2;
    const centerY = height / 2;

    // Distance from center
    const distX = x - centerX;
    const distY = y - centerY;

    // Kingdom region (center)
    if (Math.abs(distX) < 10 && Math.abs(distY) < 10) {
      return 'kingdom';
    }

    // Mountain region (northwest)
    if (distX < 0 && distY < 0 && terrain === 'mountains') {
      return 'mountain_region';
    }

    // Desert region (south)
    if (distY > 10 && terrain === 'desert') {
      return 'desert_region';
    }

    // Forest region (west)
    if (distX < 0 && terrain === 'forest') {
      return 'forest_region';
    }

    // Swamp region
    if (terrain === 'swamp') {
      return 'swamp_region';
    }

    // Default to kingdom for other areas
    return 'kingdom';
  }

  /**
   * Place fixed towns on map
   *
   * @param tiles - Map tiles
   * @param count - Number of towns
   * @returns Array of towns
   */
  private static placeTowns(tiles: Tile[][], count: number): Town[] {
    console.log('🏰 Placing towns...');
    const towns: Town[] = [];
    const width = tiles[0].length;
    const height = tiles.length;

    // Fixed town positions (strategic locations)
    const townPositions = [
      { name: 'Capital', x: Math.floor(width / 2), y: Math.floor(height / 2), level: 3 as const, faction: 'Kingdom' as const },
      { name: 'Mountain Stronghold', x: Math.floor(width * 0.2), y: Math.floor(height * 0.2), level: 2 as const, faction: 'Mountain Dwarves' as const },
      { name: 'Desert Oasis', x: Math.floor(width * 0.5), y: Math.floor(height * 0.9), level: 2 as const, faction: 'Desert Nomads' as const },
      { name: 'Forest Outpost', x: Math.floor(width * 0.1), y: Math.floor(height * 0.5), level: 1 as const, faction: 'Forest Elves' as const }
    ];

    for (let i = 0; i < Math.min(count, townPositions.length); i++) {
      const pos = townPositions[i];

      // Ensure town is on passable terrain
      if (tiles[pos.y] && tiles[pos.y][pos.x]) {
        const tile = tiles[pos.y][pos.x];
        if (tile.terrain !== 'water' && tile.terrain !== 'mountains') {
          tile.terrain = 'plains'; // Towns always on plains

          const town: Town = {
            id: `town-${i}`,
            type: 'town',
            name: pos.name,
            position: { x: pos.x, y: pos.y },
            level: pos.level,
            faction: pos.faction,
            buildings: {
              tavern: true,
              smithy: pos.level >= 2,
              healer: true,
              market: pos.level >= 2,
              bank: pos.level >= 3
            }
          };

          tile.staticObject = town;
          towns.push(town);
          console.log(`  🏰 Placed ${town.name} at (${pos.x}, ${pos.y})`);
        }
      }
    }

    return towns;
  }

  /**
   * Place fixed dungeon entrances on map
   *
   * @param tiles - Map tiles
   * @param count - Number of dungeons
   * @returns Array of dungeons
   */
  private static placeDungeons(tiles: Tile[][], count: number): DungeonEntrance[] {
    console.log('🕳️ Placing dungeons...');
    const dungeons: DungeonEntrance[] = [];
    const width = tiles[0].length;
    const height = tiles.length;

    // Fixed dungeon positions
    const dungeonConfigs = [
      { name: 'Goblin Caves', x: Math.floor(width * 0.4), y: Math.floor(height * 0.4), difficulty: 'Easy' as const, maxFloors: 10, level: 1, theme: 'Goblin Caves' },
      { name: 'Forest Ruins', x: Math.floor(width * 0.15), y: Math.floor(height * 0.55), difficulty: 'Medium' as const, maxFloors: 25, level: 10, theme: 'Ancient Ruins' },
      { name: 'Mountain Depths', x: Math.floor(width * 0.25), y: Math.floor(height * 0.15), difficulty: 'Hard' as const, maxFloors: 50, level: 20, theme: 'Mountain Depths' },
      { name: 'Ancient Temple', x: Math.floor(width * 0.55), y: Math.floor(height * 0.95), difficulty: 'Hard' as const, maxFloors: 50, level: 25, theme: 'Desert Temple' },
      { name: 'Endless Abyss', x: Math.floor(width * 0.8), y: Math.floor(height * 0.5), difficulty: 'Nightmare' as const, maxFloors: 999, level: 30, theme: 'Endless Abyss' }
    ];

    for (let i = 0; i < Math.min(count, dungeonConfigs.length); i++) {
      const config = dungeonConfigs[i];

      if (tiles[config.y] && tiles[config.y][config.x]) {
        const tile = tiles[config.y][config.x];

        const dungeon: DungeonEntrance = {
          id: `dungeon-${i}`,
          type: 'dungeon',
          name: config.name,
          position: { x: config.x, y: config.y },
          difficulty: config.difficulty,
          maxFloors: config.maxFloors,
          recommendedLevel: config.level,
          theme: config.theme
        };

        tile.staticObject = dungeon;
        dungeons.push(dungeon);
        console.log(`  🕳️ Placed ${dungeon.name} (${dungeon.difficulty}) at (${config.x}, ${config.y})`);
      }
    }

    return dungeons;
  }

  /**
   * Generate roads between towns
   *
   * @param tiles - Map tiles
   * @param towns - Array of towns
   */
  private static generateRoads(tiles: Tile[][], towns: Town[]): void {
    console.log('🛤️ Generating roads between towns...');

    // Connect each town to capital (center town)
    const capital = towns.find(t => t.name === 'Capital');
    if (!capital) return;

    for (const town of towns) {
      if (town.id === capital.id) continue;

      // Simple straight line road (can be improved with A*)
      this.createRoad(tiles, capital.position, town.position);
    }
  }

  /**
   * Create road between two points
   *
   * @param tiles - Map tiles
   * @param from - Start position
   * @param to - End position
   */
  private static createRoad(tiles: Tile[][], from: { x: number; y: number }, to: { x: number; y: number }): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const x = Math.round(from.x + dx * t);
      const y = Math.round(from.y + dy * t);

      if (tiles[y] && tiles[y][x]) {
        const tile = tiles[y][x];
        // Only create road on passable terrain, don't overwrite towns/dungeons
        if (!tile.staticObject && tile.terrain !== 'water' && tile.terrain !== 'mountains') {
          tile.terrain = 'road';
          tile.movementCost = MOVEMENT_COSTS.road;
        }
      }
    }
  }

  /**
   * Spawn initial enemy encounters
   *
   * @param tiles - Map tiles
   * @param count - Number of encounters
   * @returns Array of encounters
   */
  private static spawnInitialEncounters(tiles: Tile[][], count: number): MapEncounter[] {
    console.log('⚔️ Spawning initial encounters...');
    const encounters: MapEncounter[] = [];
    const width = tiles[0].length;
    const height = tiles.length;

    for (let i = 0; i < count; i++) {
      // Random position
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const tile = tiles[y][x];

      // Only spawn on passable, empty terrain
      if (!tile.staticObject && tile.terrain !== 'water' && tile.terrain !== 'road') {
        const encounter: MapEncounter = {
          id: `encounter-${Date.now()}-${i}`,
          type: 'encounter',
          position: { x, y },
          enemyLevel: Math.floor(Math.random() * 10) + 1,
          enemyCount: Math.floor(Math.random() * 3) + 1,
          difficulty: Math.random() > 0.8 ? 'Elite' : 'Normal',
          spawnTime: new Date(),
          despawnTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          isActive: true
        };

        encounters.push(encounter);
      }
    }

    console.log(`  ⚔️ Spawned ${encounters.length} encounters`);
    return encounters;
  }

  /**
   * Spawn initial resource nodes
   *
   * @param tiles - Map tiles
   * @param count - Number of resources
   * @returns Array of resources
   */
  private static spawnInitialResources(tiles: Tile[][], count: number): ResourceNode[] {
    console.log('💎 Spawning initial resources...');
    const resources: ResourceNode[] = [];
    const width = tiles[0].length;
    const height = tiles.length;

    const resourceTypes: Array<'gold' | 'wood' | 'stone' | 'ore' | 'gems'> = [
      'gold', 'wood', 'stone', 'ore', 'gems'
    ];

    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const tile = tiles[y][x];

      // Only spawn on passable, empty terrain
      if (!tile.staticObject && tile.terrain !== 'water' && tile.terrain !== 'road') {
        const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];

        const resource: ResourceNode = {
          id: `resource-${Date.now()}-${i}`,
          type: 'resource',
          position: { x, y },
          resourceType,
          amount: Math.floor(Math.random() * 500) + 100,
          regenerates: true,
          respawnTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          spawnTime: new Date(),
          isActive: true
        };

        resources.push(resource);
      }
    }

    console.log(`  💎 Spawned ${resources.length} resource nodes`);
    return resources;
  }
}
