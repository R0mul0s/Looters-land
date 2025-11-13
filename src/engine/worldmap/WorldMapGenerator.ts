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
  ResourceNode,
  Portal,
  HiddenPath,
  TreasureChest,
  RareSpawn,
  WanderingMonster,
  TravelingMerchant,
  WeatherType,
  TimeOfDay,
  TERRAIN_MOVEMENT_COST
} from '../../types/worldmap.types';

import { TERRAIN_MOVEMENT_COST as MOVEMENT_COSTS } from '../../types/worldmap.types';
import { WORLDMAP_CONFIG } from '../../config/BALANCE_CONFIG';

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

    // 5. Place portals (for fast travel)
    const portals = this.placePortals(tiles, WORLDMAP_CONFIG.PORTAL_COUNT);

    // 6. Place hidden paths (secret areas)
    const hiddenPaths = this.placeHiddenPaths(tiles, WORLDMAP_CONFIG.HIDDEN_PATH_COUNT);

    // 7. Place treasure chests
    const treasureChests = this.placeTreasureChests(tiles, WORLDMAP_CONFIG.TREASURE_CHEST_COUNT);

    // 8. Place rare spawns
    const rareSpawns = this.placeRareSpawns(tiles, WORLDMAP_CONFIG.RARE_SPAWN_COUNT);

    // 9. Spawn initial dynamic encounters
    const encounters = this.spawnInitialEncounters(tiles, encounterCount);

    // 10. Spawn initial resource nodes
    const resources = this.spawnInitialResources(tiles, resourceCount);

    // 11. Spawn wandering monsters
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
      dynamicObjects: [...encounters, ...resources, ...wanderingMonsters, ...travelingMerchants],
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
              bank: pos.level >= 3,
              guild: pos.level >= 3
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
        requiredLevel: lootQuality === 'legendary' ? 20 : lootQuality === 'epic' ? 15 : 10
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
   * Get starting position for a new player
   * Returns coordinates of a random town so the player starts in a safe location
   *
   * @param width - Map width
   * @param height - Map height
   * @returns Starting coordinates { x, y }
   *
   * @example
   * ```typescript
   * const startPos = WorldMapGenerator.getStartingPosition(50, 50);
   * console.log(`Player starts at (${startPos.x}, ${startPos.y})`);
   * ```
   */
  static getStartingPosition(width: number = 50, height: number = 50): { x: number; y: number } {
    // Define same town positions as in placeTowns() method
    const townPositions = [
      { x: Math.floor(width / 2), y: Math.floor(height / 2) }, // Capital (center)
      { x: Math.floor(width * 0.2), y: Math.floor(height * 0.2) }, // Mountain Stronghold (northwest)
      { x: Math.floor(width * 0.5), y: Math.floor(height * 0.9) }, // Desert Oasis (south)
      { x: Math.floor(width * 0.1), y: Math.floor(height * 0.5) } // Forest Outpost (west)
    ];

    // Pick a random town
    const randomTown = townPositions[Math.floor(Math.random() * townPositions.length)];

    console.log(`🎯 Starting position selected: (${randomTown.x}, ${randomTown.y})`);

    return randomTown;
  }
}
