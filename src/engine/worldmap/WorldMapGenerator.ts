/**
 * WorldMap Generator - Procedurally generates large-scale worldmap
 *
 * Generates a 50x50 HOMAM-style worldmap with biomes, towns, dungeons,
 * and dynamic content. Uses Perlin noise for natural terrain generation.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-10
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
  Portal,
  HiddenPath,
  TreasureChest,
  RareSpawn,
  ObservationTower,
  WanderingMonster,
  TravelingMerchant,
  WeatherType,
  TimeOfDay,
  TERRAIN_MOVEMENT_COST
} from '../../types/worldmap.types';

import { TERRAIN_MOVEMENT_COST as MOVEMENT_COSTS } from '../../types/worldmap.types';
import { WORLDMAP_CONFIG } from '../../config/BALANCE_CONFIG';

/**
 * Seeded Random Number Generator
 * Uses seed string to generate deterministic random numbers
 */
class SeededRandom {
  private seed: number;

  constructor(seedString: string) {
    // Convert string to number seed
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
      const char = seedString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    this.seed = Math.abs(hash);
  }

  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    // Linear congruential generator
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /**
   * Generate random integer between min and max (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generate random float between min and max
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
}

/**
 * WorldMap Generator class
 */
export class WorldMapGenerator {
  private static rng: SeededRandom;
  /**
   * Generate complete worldmap
   *
   * @param options - Generation options
   * @param playerCombatPower - Player's current combat power (for starting position)
   * @returns Generated worldmap
   *
   * @example
   * ```typescript
   * const worldmap = WorldMapGenerator.generate({
   *   width: 50,
   *   height: 50,
   *   seed: 'my-world-123'
   * }, 5000);
   * ```
   */
  static generate(options: WorldMapGenerationOptions, playerCombatPower: number = 0): WorldMap {
    const {
      width = 50,
      height = 50,
      seed = `world-${Date.now()}`,
      townCount = 4,
      dungeonCount = 5,
      encounterCount = 15
    } = options;

    console.log('🗺️ Generating worldmap...', { width, height, seed, playerCombatPower });

    // Initialize seeded RNG for deterministic generation
    this.rng = new SeededRandom(seed);

    // 1. Generate base terrain with Perlin noise
    const tiles = this.generateTerrain(width, height, seed);

    // 2. Place progressive towns with seeded positions
    const towns = this.placeTowns(tiles, townCount);

    // 3. Place dungeons near towns
    const dungeons = this.placeDungeons(tiles, dungeonCount, towns);

    // 4. Generate roads connecting all towns
    this.generateRoads(tiles, towns);

    // 5. Place portals (for fast travel)
    const portals = this.placePortals(tiles, WORLDMAP_CONFIG.PORTAL_COUNT);

    // 6. Place hidden paths (secret areas)
    const hiddenPaths = this.placeHiddenPaths(tiles, WORLDMAP_CONFIG.HIDDEN_PATH_COUNT);

    // 7. Place treasure chests
    const treasureChests = this.placeTreasureChests(tiles, WORLDMAP_CONFIG.TREASURE_CHEST_COUNT);

    // 8. Place rare spawns
    const rareSpawns = this.placeRareSpawns(tiles, WORLDMAP_CONFIG.RARE_SPAWN_COUNT);

    // 9. Place observation towers
    const observationTowers = this.placeObservationTowers(tiles, 8); // ~8 towers on 50x50 map

    // 10. Spawn wandering monsters
    const wanderingMonsters = this.spawnWanderingMonsters(tiles, WORLDMAP_CONFIG.WANDERING_MONSTER_COUNT);

    // 12. Spawn traveling merchants
    const travelingMerchants = this.spawnTravelingMerchants(tiles, WORLDMAP_CONFIG.TRAVELING_MERCHANT_COUNT);

    // 13. Initialize weather and time of day
    const weather = this.initializeWeather();
    const timeOfDay = this.initializeTimeOfDay();

    console.log('✅ Worldmap generated successfully!');

    return {
      id: seed,
      width,
      height,
      seed,
      tiles,
      staticObjects: [...towns, ...dungeons, ...portals, ...hiddenPaths, ...treasureChests, ...rareSpawns],
      dynamicObjects: [...wanderingMonsters, ...travelingMerchants],
      players: [],
      weather,
      timeOfDay,
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
        else if (value < 0.6) terrain = 'desert';
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
   * Place progressive towns on map with seeded random positions
   *
   * Towns are placed in order of difficulty and must be at least 15 tiles apart
   *
   * @param tiles - Map tiles
   * @param count - Number of towns
   * @returns Array of towns
   */
  private static placeTowns(tiles: Tile[][], count: number): Town[] {
    console.log('🏰 Placing progressive towns with seeded positions...');
    const towns: Town[] = [];
    const width = tiles[0].length;
    const height = tiles.length;

    // Progressive town configs (ordered by difficulty)
    const townConfigs = [
      {
        name: 'Goldhaven',
        faction: 'Humans' as const,
        level: 1 as const,
        cpRange: [0, 12000],
        asset: 'city2.png'
      },
      {
        name: 'Ariandel',
        faction: 'Elves' as const,
        level: 2 as const,
        cpRange: [12000, 22000],
        asset: 'city3.png'
      },
      {
        name: 'Gorundrim',
        faction: 'Dwarves' as const,
        level: 3 as const,
        cpRange: [22000, 32000],
        asset: 'city4.png'
      },
      {
        name: 'Astralheim',
        faction: 'Mages' as const,
        level: 4 as const,
        cpRange: [32001, 999999],
        asset: 'city5.png'
      }
    ];

    const placedPositions: Array<{ x: number; y: number }> = [];
    const MIN_DISTANCE = 15;

    for (let i = 0; i < Math.min(count, townConfigs.length); i++) {
      const config = townConfigs[i];
      let x: number, y: number;
      let attempts = 0;
      let validPosition = false;

      // Try to find a valid position (passable terrain, not too close to other towns)
      while (!validPosition && attempts < 200) {
        // Generate seeded random position
        x = this.rng.nextInt(5, width - 6);
        y = this.rng.nextInt(5, height - 6);

        const tile = tiles[y]?.[x];
        if (!tile) {
          attempts++;
          continue;
        }

        // Check if terrain is passable
        if (tile.terrain === 'water' || tile.terrain === 'mountains') {
          attempts++;
          continue;
        }

        // Check distance from other towns (must be at least 15 tiles apart)
        const tooClose = placedPositions.some(pos => {
          const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
          return distance < MIN_DISTANCE;
        });

        if (tooClose) {
          attempts++;
          continue;
        }

        validPosition = true;
      }

      if (!validPosition) {
        console.warn(`⚠️ Could not find valid position for ${config.name} after ${attempts} attempts`);
        continue;
      }

      // Place town on plains
      tiles[y][x].terrain = 'plains';

      const town: Town = {
        id: `town-${i}`,
        type: 'town',
        name: config.name,
        position: { x, y },
        level: config.level,
        faction: config.faction,
        asset: config.asset, // Store asset filename for rendering
        buildings: {
          tavern: true,   // Always available in all towns
          smithy: true,   // Always available in all towns
          healer: true,   // Always available in all towns
          market: true,   // Always available in all towns
          bank: true,     // Bank Vault System (v0.9.0)
          guild: false    // Coming soon - not yet implemented
        }
      };

      tiles[y][x].staticObject = town;
      towns.push(town);
      placedPositions.push({ x, y });

      console.log(`  🏰 Placed ${town.name} (CP ${config.cpRange[0]}-${config.cpRange[1]}) at (${x}, ${y})`);
    }

    return towns;
  }

  /**
   * Place dungeon entrances near corresponding towns
   *
   * Each town gets a dungeon within 11 tiles, matching difficulty progression
   * Plus one bonus random nightmare dungeon (Endless Abyss)
   *
   * @param tiles - Map tiles
   * @param count - Number of dungeons (4 town dungeons + 1 bonus)
   * @param towns - Array of towns to place dungeons near
   * @returns Array of dungeons
   */
  private static placeDungeons(tiles: Tile[][], count: number, towns: Town[]): DungeonEntrance[] {
    console.log('🕳️ Placing dungeons near towns...');
    const dungeons: DungeonEntrance[] = [];
    const width = tiles[0].length;
    const height = tiles.length;

    // Dungeon configs matching town progression
    const dungeonConfigs = [
      {
        name: 'Forgotten Mines',
        difficulty: 'Easy' as const,
        maxFloors: 10,
        level: 3,
        theme: 'Goblin Caves',
        townIndex: 0 // Goldhaven
      },
      {
        name: 'Elven Catacombs',
        difficulty: 'Medium' as const,
        maxFloors: 25,
        level: 15,
        theme: 'Ancient Ruins',
        townIndex: 1 // Ariandel
      },
      {
        name: 'Dwarven Depths',
        difficulty: 'Hard' as const,
        maxFloors: 50,
        level: 25,
        theme: 'Mountain Depths',
        townIndex: 2 // Gorundrim
      },
      {
        name: 'Arcane Sanctum',
        difficulty: 'Nightmare' as const,
        maxFloors: 75,
        level: 35,
        theme: 'Arcane Tower',
        townIndex: 3 // Astralheim
      }
    ];

    // Place dungeons near their corresponding towns
    for (let i = 0; i < Math.min(4, dungeonConfigs.length); i++) {
      const config = dungeonConfigs[i];
      const town = towns[config.townIndex];

      if (!town) {
        console.warn(`⚠️ Town not found for dungeon ${config.name}`);
        continue;
      }

      let x: number, y: number;
      let attempts = 0;
      let validPosition = false;
      const MAX_DISTANCE = 11;

      // Try to find a valid position near the town (within 11 tiles)
      while (!validPosition && attempts < 100) {
        // Generate position within MAX_DISTANCE of town
        const angle = this.rng.nextFloat(0, Math.PI * 2);
        const distance = this.rng.nextFloat(3, MAX_DISTANCE);

        x = Math.round(town.position.x + Math.cos(angle) * distance);
        y = Math.round(town.position.y + Math.sin(angle) * distance);

        // Ensure within bounds
        if (x < 0 || x >= width || y < 0 || y >= height) {
          attempts++;
          continue;
        }

        const tile = tiles[y]?.[x];
        if (!tile) {
          attempts++;
          continue;
        }

        // Check if position is valid (not water, not occupied)
        if (tile.terrain === 'water' || tile.staticObject) {
          attempts++;
          continue;
        }

        validPosition = true;
      }

      if (!validPosition) {
        console.warn(`⚠️ Could not find valid position for ${config.name} after ${attempts} attempts`);
        continue;
      }

      const dungeon: DungeonEntrance = {
        id: `dungeon-${i}`,
        type: 'dungeon',
        name: config.name,
        position: { x, y },
        difficulty: config.difficulty,
        maxFloors: config.maxFloors,
        recommendedLevel: config.level,
        theme: config.theme
      };

      tiles[y][x].staticObject = dungeon;
      dungeons.push(dungeon);

      const distanceFromTown = Math.sqrt(
        Math.pow(x - town.position.x, 2) + Math.pow(y - town.position.y, 2)
      );

      console.log(`  🕳️ Placed ${dungeon.name} (${dungeon.difficulty}, Lv${dungeon.recommendedLevel}) near ${town.name} - ${distanceFromTown.toFixed(1)} tiles away at (${x}, ${y})`);
    }

    // Place bonus nightmare dungeon (Endless Abyss) - random position
    if (count >= 5) {
      let x: number, y: number;
      let attempts = 0;
      let validPosition = false;

      while (!validPosition && attempts < 100) {
        x = this.rng.nextInt(5, width - 6);
        y = this.rng.nextInt(5, height - 6);

        const tile = tiles[y]?.[x];
        if (!tile || tile.terrain === 'water' || tile.staticObject) {
          attempts++;
          continue;
        }

        // Ensure far from all towns (at least 15 tiles)
        const tooClose = towns.some(town => {
          const distance = Math.sqrt(
            Math.pow(x - town.position.x, 2) + Math.pow(y - town.position.y, 2)
          );
          return distance < 15;
        });

        if (tooClose) {
          attempts++;
          continue;
        }

        validPosition = true;
      }

      if (validPosition) {
        const endlessDungeon: DungeonEntrance = {
          id: 'dungeon-endless',
          type: 'dungeon',
          name: 'Endless Abyss',
          position: { x, y },
          difficulty: 'Nightmare',
          maxFloors: 999,
          recommendedLevel: 50,
          theme: 'Endless Abyss',
          asset: 'dungeon4.png'
        };

        tiles[y][x].staticObject = endlessDungeon;
        dungeons.push(endlessDungeon);
        console.log(`  🕳️ Placed ${endlessDungeon.name} (Bonus, Lv${endlessDungeon.recommendedLevel}) at random position (${x}, ${y})`);
      }
    }

    return dungeons;
  }

  /**
   * Generate roads connecting all towns
   *
   * Creates a network where each town is connected to every other town
   *
   * @param tiles - Map tiles
   * @param towns - Array of towns
   */
  private static generateRoads(tiles: Tile[][], towns: Town[]): void {
    console.log('🛤️ Generating roads connecting all towns...');

    // Connect each town to every other town (full mesh network)
    for (let i = 0; i < towns.length; i++) {
      for (let j = i + 1; j < towns.length; j++) {
        const from = towns[i];
        const to = towns[j];

        // Create road between towns
        this.createRoad(tiles, from.position, to.position);
        console.log(`  🛤️ Road created: ${from.name} ↔ ${to.name}`);
      }
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
   * Place portals for fast travel
   *
   * @param tiles - Map tiles
   * @param count - Number of portals
   * @returns Array of portals
   */
  private static placePortals(tiles: Tile[][], count: number): Portal[] {
    console.log('🌀 Placing portals...');
    const portals: Portal[] = [];
    const width = tiles[0].length;
    const height = tiles.length;

    // Generate portal pairs
    const portalCount = Math.floor(count / 2) * 2; // Ensure even number

    for (let i = 0; i < portalCount; i++) {
      // Find random passable location
      let x: number, y: number, tile: Tile;
      let attempts = 0;
      do {
        x = Math.floor(Math.random() * width);
        y = Math.floor(Math.random() * height);
        tile = tiles[y][x];
        attempts++;
      } while (
        (tile.staticObject || tile.terrain === 'water' || tile.terrain === 'mountains') &&
        attempts < 100
      );

      if (attempts >= 100) continue;

      const portal: Portal = {
        id: `portal-${i}`,
        type: 'portal',
        name: `Portal ${String.fromCharCode(65 + i)}`, // Portal A, Portal B, etc.
        position: { x, y },
        linkedPortalId: null,
        energyCost: WORLDMAP_CONFIG.PORTAL_ENERGY_COST
      };

      tile.staticObject = portal;
      portals.push(portal);
      console.log(`  🌀 Placed ${portal.name} at (${x}, ${y})`);
    }

    // Link portals in pairs
    for (let i = 0; i < portals.length; i += 2) {
      if (i + 1 < portals.length) {
        portals[i].linkedPortalId = portals[i + 1].id;
        portals[i + 1].linkedPortalId = portals[i].id;
        console.log(`  🔗 Linked ${portals[i].name} ↔ ${portals[i + 1].name}`);
      }
    }

    return portals;
  }

  /**
   * Place hidden paths (secret areas)
   *
   * @param tiles - Map tiles
   * @param count - Number of hidden paths
   * @returns Array of hidden paths
   */
  private static placeHiddenPaths(tiles: Tile[][], count: number): HiddenPath[] {
    console.log('🗝️ Placing hidden paths...');
    const hiddenPaths: HiddenPath[] = [];
    const width = tiles[0].length;
    const height = tiles.length;

    const lootQualities: Array<'rare' | 'epic' | 'legendary'> = ['rare', 'epic', 'legendary'];

    for (let i = 0; i < count; i++) {
      // Place in remote areas (far from center)
      const centerX = width / 2;
      const centerY = height / 2;

      let x: number, y: number, tile: Tile;
      let attempts = 0;
      do {
        x = Math.floor(Math.random() * width);
        y = Math.floor(Math.random() * height);
        tile = tiles[y][x];

        const distFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        attempts++;
      } while (
        (tile.staticObject ||
          tile.terrain === 'water' ||
          tile.terrain === 'road' ||
          Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)) < 15) && // Far from center
        attempts < 100
      );

      if (attempts >= 100) continue;

      const lootQuality = lootQualities[Math.floor(Math.random() * lootQualities.length)];

      const hiddenPath: HiddenPath = {
        id: `hidden-path-${i}`,
        type: 'hiddenPath',
        name: 'Hidden Path',
        position: { x, y },
        discovered: false,
        lootQuality,
        requiredCombatPower: lootQuality === 'legendary' ? 15000 : lootQuality === 'epic' ? 8000 : 3000
      };

      tile.staticObject = hiddenPath;
      hiddenPaths.push(hiddenPath);
      console.log(`  🗝️ Placed Hidden Path (${lootQuality}) at (${x}, ${y})`);
    }

    return hiddenPaths;
  }

  /**
   * Place treasure chests
   *
   * @param tiles - Map tiles
   * @param count - Number of treasure chests
   * @returns Array of treasure chests
   */
  private static placeTreasureChests(tiles: Tile[][], count: number): TreasureChest[] {
    console.log('📦 Placing treasure chests...');
    const treasureChests: TreasureChest[] = [];
    const width = tiles[0].length;
    const height = tiles.length;

    const lootQualities: Array<'common' | 'uncommon' | 'rare' | 'epic'> = [
      'common',
      'common',
      'uncommon',
      'uncommon',
      'rare',
      'epic'
    ];

    for (let i = 0; i < count; i++) {
      let x: number, y: number, tile: Tile;
      let attempts = 0;
      do {
        x = Math.floor(Math.random() * width);
        y = Math.floor(Math.random() * height);
        tile = tiles[y][x];
        attempts++;
      } while (
        (tile.staticObject || tile.terrain === 'water' || tile.terrain === 'road') &&
        attempts < 100
      );

      if (attempts >= 100) continue;

      const lootQuality = lootQualities[Math.floor(Math.random() * lootQualities.length)];
      const goldMultiplier = {
        common: 1,
        uncommon: 2,
        rare: 5,
        epic: 10
      };

      const treasureChest: TreasureChest = {
        id: `chest-${i}`,
        type: 'treasureChest',
        name: 'Treasure Chest',
        position: { x, y },
        opened: false,
        lootQuality,
        goldAmount: Math.floor((Math.random() * 500 + 100) * goldMultiplier[lootQuality])
      };

      tile.staticObject = treasureChest;
      treasureChests.push(treasureChest);
      console.log(`  📦 Placed Treasure Chest (${lootQuality}) at (${x}, ${y})`);
    }

    return treasureChests;
  }

  /**
   * Place rare spawns (rare enemies with guaranteed drops)
   *
   * @param tiles - Map tiles
   * @param count - Number of rare spawns
   * @returns Array of rare spawns
   */
  private static placeRareSpawns(tiles: Tile[][], count: number): RareSpawn[] {
    console.log('👹 Placing rare spawns...');
    const rareSpawns: RareSpawn[] = [];
    const width = tiles[0].length;
    const height = tiles.length;

    const rareEnemies = [
      { name: 'Ancient Golem', minLevel: 15 },
      { name: 'Shadow Dragon', minLevel: 25 },
      { name: 'Frost Giant', minLevel: 20 },
      { name: 'Phoenix', minLevel: 30 }
    ];

    for (let i = 0; i < count; i++) {
      let x: number, y: number, tile: Tile;
      let attempts = 0;
      do {
        x = Math.floor(Math.random() * width);
        y = Math.floor(Math.random() * height);
        tile = tiles[y][x];
        attempts++;
      } while (
        (tile.staticObject || tile.terrain === 'water' || tile.terrain === 'road') &&
        attempts < 100
      );

      if (attempts >= 100) continue;

      const enemy = rareEnemies[Math.floor(Math.random() * rareEnemies.length)];
      const guaranteedDrop: 'rare' | 'epic' = Math.random() > 0.5 ? 'epic' : 'rare';

      const rareSpawn: RareSpawn = {
        id: `rare-spawn-${i}`,
        type: 'rareSpawn',
        name: enemy.name,
        position: { x, y },
        enemyName: enemy.name,
        enemyLevel: enemy.minLevel + Math.floor(Math.random() * 10),
        guaranteedDrop,
        defeated: false
      };

      tile.staticObject = rareSpawn;
      rareSpawns.push(rareSpawn);
      console.log(`  👹 Placed ${rareSpawn.enemyName} (Lv${rareSpawn.enemyLevel}) at (${x}, ${y})`);
    }

    return rareSpawns;
  }

  /**
   * Place observation towers (reveal fog of war in large radius)
   *
   * @param tiles - Map tiles
   * @param count - Number of observation towers
   * @returns Array of observation towers
   */
  private static placeObservationTowers(tiles: Tile[][], count: number): ObservationTower[] {
    console.log('🗼 Placing observation towers...');
    const observationTowers: ObservationTower[] = [];
    const width = tiles[0].length;
    const height = tiles.length;

    const towerAssets = ['observation-tower1.png', 'observation-tower2.png', 'observation-tower3.png'];

    for (let i = 0; i < count; i++) {
      let x: number, y: number, tile: Tile;
      let attempts = 0;
      do {
        x = Math.floor(Math.random() * width);
        y = Math.floor(Math.random() * height);
        tile = tiles[y][x];
        attempts++;
      } while (
        (tile.staticObject || tile.terrain === 'water' || tile.terrain === 'road') &&
        attempts < 100
      );

      if (attempts >= 100) continue;

      // Prefer placing towers on elevated terrain (mountains) for thematic reasons
      const preferMountains = Math.random() > 0.5 && tile.terrain === 'mountains';

      const observationTower: ObservationTower = {
        id: `tower-${i}`,
        type: 'observationTower',
        name: 'Observation Tower',
        position: { x, y },
        used: false,
        revealRadius: 10, // 2x normal vision (assuming normal is 5)
        asset: towerAssets[Math.floor(Math.random() * towerAssets.length)]
      };

      tile.staticObject = observationTower;
      observationTowers.push(observationTower);
      console.log(`  🗼 Placed Observation Tower at (${x}, ${y}) - Asset: ${observationTower.asset}`);
    }

    return observationTowers;
  }

  /**
   * Spawn wandering monsters
   *
   * @param tiles - Map tiles
   * @param count - Number of wandering monsters
   * @returns Array of wandering monsters
   */
  private static spawnWanderingMonsters(tiles: Tile[][], count: number): WanderingMonster[] {
    console.log('🐺 Spawning wandering monsters...');
    const wanderingMonsters: WanderingMonster[] = [];
    const width = tiles[0].length;
    const height = tiles.length;

    const monsterNames = [
      'Dire Wolf',
      'Ogre',
      'Troll',
      'Harpy',
      'Manticore',
      'Wyvern',
      'Bandit Leader',
      'Dark Knight'
    ];

    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const tile = tiles[y][x];

      // Only spawn on passable, empty terrain
      if (!tile.staticObject && tile.terrain !== 'water' && tile.terrain !== 'road') {
        const monster: WanderingMonster = {
          id: `wandering-${Date.now()}-${i}`,
          type: 'wanderingMonster',
          position: { x, y },
          enemyName: monsterNames[Math.floor(Math.random() * monsterNames.length)],
          enemyLevel: Math.floor(Math.random() * 20) + 5,
          difficulty: Math.random() > 0.7 ? 'Elite' : 'Normal',
          defeated: false,
          respawnMinutes: WORLDMAP_CONFIG.WANDERING_MONSTER_RESPAWN,
          spawnTime: new Date(),
          isActive: true
        };

        wanderingMonsters.push(monster);
        console.log(`  🐺 Spawned ${monster.enemyName} (${monster.difficulty}) at (${x}, ${y})`);
      }
    }

    return wanderingMonsters;
  }

  /**
   * Spawn traveling merchants
   *
   * @param tiles - Map tiles
   * @param count - Number of traveling merchants
   * @returns Array of traveling merchants
   */
  private static spawnTravelingMerchants(tiles: Tile[][], count: number): TravelingMerchant[] {
    console.log('🛒 Spawning traveling merchants...');
    const merchants: TravelingMerchant[] = [];
    const width = tiles[0].length;
    const height = tiles.length;

    const merchantNames = [
      'Wandering Trader Marcus',
      'Mysterious Merchant Aria',
      'Desert Vendor Khalid',
      'Forest Merchant Elena'
    ];

    const itemTypes = [
      'Rare Weapon',
      'Epic Armor',
      'Legendary Accessory',
      'Ancient Scroll',
      'Magic Potion',
      'Enchanted Ring'
    ];

    for (let i = 0; i < count; i++) {
      // Spawn near roads if possible
      let x: number, y: number, tile: Tile;
      let attempts = 0;
      do {
        x = Math.floor(Math.random() * width);
        y = Math.floor(Math.random() * height);
        tile = tiles[y][x];
        attempts++;
      } while (
        (tile.staticObject || tile.terrain === 'water' || tile.terrain === 'mountains') &&
        attempts < 100
      );

      if (attempts >= 100) continue;

      // Generate random inventory
      const inventorySize = Math.floor(Math.random() * 4) + 2; // 2-5 items
      const inventory: TravelingMerchant['inventory'] = [];

      for (let j = 0; j < inventorySize; j++) {
        const rarities: Array<'uncommon' | 'rare' | 'epic'> = ['uncommon', 'rare', 'epic'];
        const rarity = rarities[Math.floor(Math.random() * rarities.length)];
        const priceMultiplier = { uncommon: 1, rare: 3, epic: 8 };

        inventory.push({
          itemType: itemTypes[Math.floor(Math.random() * itemTypes.length)],
          price: Math.floor((Math.random() * 1000 + 500) * priceMultiplier[rarity]),
          rarity
        });
      }

      const merchant: TravelingMerchant = {
        id: `merchant-${Date.now()}-${i}`,
        type: 'travelingMerchant',
        position: { x, y },
        merchantName: merchantNames[Math.floor(Math.random() * merchantNames.length)],
        inventory,
        staysUntil: new Date(Date.now() + WORLDMAP_CONFIG.TRAVELING_MERCHANT_DURATION * 60 * 60 * 1000),
        spawnTime: new Date(),
        isActive: true
      };

      merchants.push(merchant);
      console.log(`  🛒 Spawned ${merchant.merchantName} at (${x}, ${y})`);
    }

    return merchants;
  }

  /**
   * Initialize weather state
   *
   * @returns Initial weather state
   */
  private static initializeWeather() {
    const weatherTypes: WeatherType[] = ['clear', 'rain', 'storm', 'fog', 'snow'];
    const current = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    const next = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];

    const spawnRateModifiers: Record<WeatherType, number> = {
      clear: 1.0,
      rain: 0.8,
      storm: 0.5,
      fog: 1.2,
      snow: 0.7
    };

    return {
      current,
      changesAt: new Date(Date.now() + WORLDMAP_CONFIG.WEATHER_CHANGE_INTERVAL * 60 * 60 * 1000),
      next,
      spawnRateModifier: spawnRateModifiers[current]
    };
  }

  /**
   * Initialize time of day state
   *
   * @returns Initial time state
   */
  private static initializeTimeOfDay() {
    const times: TimeOfDay[] = ['day', 'night', 'dawn', 'dusk'];
    const current = times[Math.floor(Math.random() * times.length)];
    const nextIndex = (times.indexOf(current) + 1) % times.length;
    const next = times[nextIndex];

    return {
      current,
      changesAt: new Date(Date.now() + WORLDMAP_CONFIG.TIME_CHANGE_INTERVAL * 60 * 60 * 1000),
      next,
      enemyModifier: {
        dayEnemies: current === 'day' || current === 'dawn',
        nightEnemies: current === 'night' || current === 'dusk'
      }
    };
  }

  /**
   * Get starting town based on player's combat power
   *
   * Players start in the town that matches their progression level:
   * - 0-12000 CP: Goldhaven (starter town)
   * - 12000-22000 CP: Ariandel (mid-game)
   * - 22000-32000 CP: Gorundrim (advanced)
   * - 32001+ CP: Astralheim (end-game)
   *
   * @param towns - Array of towns on the map
   * @param combatPower - Player's current combat power
   * @returns Starting town
   *
   * @example
   * ```typescript
   * const startTown = WorldMapGenerator.getStartingTownByCP(towns, 5000);
   * console.log(`Starting in ${startTown.name}`); // "Goldhaven"
   * ```
   */
  static getStartingTownByCP(towns: Town[], combatPower: number): Town {
    // CP thresholds for each town (matching town configs)
    const cpThresholds = [
      { max: 12000, townName: 'Goldhaven' },
      { max: 22000, townName: 'Ariandel' },
      { max: 32000, townName: 'Gorundrim' },
      { max: 999999, townName: 'Astralheim' }
    ];

    // Find appropriate town based on CP
    let targetTownName = 'Goldhaven'; // Default to starter town
    for (const threshold of cpThresholds) {
      if (combatPower <= threshold.max) {
        targetTownName = threshold.townName;
        break;
      }
    }

    // Find the town in the array
    const startTown = towns.find(t => t.name === targetTownName);

    if (startTown) {
      console.log(`🎯 Player CP ${combatPower} → Starting in ${startTown.name} at (${startTown.position.x}, ${startTown.position.y})`);
      return startTown;
    }

    // Fallback to first town if not found
    console.warn(`⚠️ Town ${targetTownName} not found, using first town`);
    return towns[0];
  }

  /**
   * Get starting position for a new player (DEPRECATED - use getStartingTownByCP instead)
   *
   * @param width - Map width
   * @param height - Map height
   * @returns Starting coordinates { x, y }
   */
  static getStartingPosition(width: number = 50, height: number = 50): { x: number; y: number } {
    console.warn('⚠️ getStartingPosition is deprecated, use getStartingTownByCP instead');
    return { x: Math.floor(width / 2), y: Math.floor(height / 2) };
  }
}
