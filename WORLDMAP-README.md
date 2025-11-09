# Worldmap System - Implementation Guide

**Author:** Roman Hlaváček - rhsoft.cz
**Status:** Phase 1 Complete (Basic Generation)
**Last Updated:** 2025-11-07

---

## 🎯 Quick Start

### Generate and View Worldmap

```typescript
import { WorldMapGenerator } from './engine/worldmap/WorldMapGenerator';
import { WorldMapViewer } from './components/WorldMapViewer';

// Generate worldmap
const worldMap = WorldMapGenerator.generate({
  width: 50,
  height: 50,
  seed: 'my-world-123',
  townCount: 4,
  dungeonCount: 5,
  encounterCount: 15,
  resourceCount: 50
});

// Render in React
<WorldMapViewer
  worldMap={worldMap}
  playerPosition={{ x: 25, y: 25 }}
  onTileClick={(x, y) => console.log('Clicked', x, y)}
  onObjectClick={(obj) => console.log('Object', obj)}
/>
```

---

## 📁 File Structure

```
src/
├── types/
│   └── worldmap.types.ts          # Type definitions
├── engine/
│   └── worldmap/
│       ├── PerlinNoise.ts         # Terrain generation
│       └── WorldMapGenerator.ts   # Main generator
└── components/
    ├── WorldMapViewer.tsx         # Canvas renderer
    └── WorldMapDemo.tsx           # Test UI

ROADMAP-WORLDMAP-IDEA.md          # Complete design document
worldmap-test.html                 # Info page
```

---

## 🗺️ Map Features

### Terrain Types

| Type | Icon | Movement Cost | Description |
|------|------|---------------|-------------|
| Plains | 🟩 | 100 | Fast travel, common |
| Forest | 🌲 | 150 | Slower, more resources |
| Mountains | ⛰️ | 250 | Very slow, elite enemies |
| Water | 🌊 | 9999 | Impassable |
| Road | 🛤️ | 75 | Fastest between towns |
| Desert | 🏜️ | 175 | Medium speed |
| Swamp | 🕸️ | 200 | Slow, debuffs |

### Static Objects

**Towns (4):**
- Capital (25, 25) - Level 3, Kingdom
- Mountain Stronghold (10, 10) - Level 2, Dwarves
- Desert Oasis (25, 45) - Level 2, Nomads
- Forest Outpost (5, 25) - Level 1, Elves

**Dungeons (5):**
- Goblin Caves - Easy, 10 floors
- Forest Ruins - Medium, 25 floors
- Mountain Depths - Hard, 50 floors
- Ancient Temple - Hard, 50 floors
- Endless Abyss - Nightmare, 999 floors

### Dynamic Objects

- **Encounters:** 15 enemy groups (spawn/despawn)
- **Resources:** 50 nodes (gold, wood, stone, ore, gems)

---

## 🎮 Usage Examples

### Example 1: Generate World from Seed

```typescript
const world1 = WorldMapGenerator.generate({
  width: 50,
  height: 50,
  seed: 'world-alpha'
});

const world2 = WorldMapGenerator.generate({
  width: 50,
  height: 50,
  seed: 'world-alpha' // Same seed = same world
});

// world1 and world2 will have identical terrain!
```

### Example 2: Custom Configuration

```typescript
const customWorld = WorldMapGenerator.generate({
  width: 30,           // Smaller map
  height: 30,
  seed: 'test-123',
  townCount: 2,        // Less towns
  dungeonCount: 3,     // Less dungeons
  encounterCount: 5,   // Fewer enemies
  resourceCount: 20    // Fewer resources
});
```

### Example 3: Access Map Data

```typescript
const world = WorldMapGenerator.generate({ width: 50, height: 50 });

// Get specific tile
const tile = world.tiles[10][15]; // y=10, x=15
console.log(tile.terrain);  // 'forest'
console.log(tile.movementCost); // 150

// Find all towns
const towns = world.staticObjects.filter(obj => obj.type === 'town');
console.log(towns); // Array of 4 towns

// Find all dungeons
const dungeons = world.staticObjects.filter(obj => obj.type === 'dungeon');
console.log(dungeons); // Array of 5 dungeons

// Get active encounters
const encounters = world.dynamicObjects.filter(
  obj => obj.type === 'encounter' && obj.isActive
);
console.log(encounters.length); // 15
```

---

## 🔧 API Reference

### WorldMapGenerator

```typescript
class WorldMapGenerator {
  static generate(options: WorldMapGenerationOptions): WorldMap;
}

interface WorldMapGenerationOptions {
  width: number;        // Map width (default: 50)
  height: number;       // Map height (default: 50)
  seed?: string;        // World seed (default: auto-generated)
  townCount?: number;   // Number of towns (default: 4)
  dungeonCount?: number; // Number of dungeons (default: 5)
  encounterCount?: number; // Initial encounters (default: 15)
  resourceCount?: number; // Initial resources (default: 50)
}
```

### PerlinNoise

```typescript
class PerlinNoise {
  constructor(seed: string);

  get(x: number, y: number): number; // Returns -1 to 1

  getOctave(
    x: number,
    y: number,
    octaves: number,
    persistence: number
  ): number; // Returns -1 to 1
}
```

### WorldMapViewer Props

```typescript
interface WorldMapViewerProps {
  worldMap: WorldMap;                // The map to render
  playerPosition: { x: number; y: number }; // Player coords
  onTileClick?: (x: number, y: number) => void; // Tile clicked
  onObjectClick?: (object: StaticObject) => void; // Object clicked
}
```

---

## 🎨 Rendering Details

### Canvas Rendering

- **Tile Size:** 32px × 32px (adjustable with zoom)
- **Viewport:** 800px × 600px (shows ~25×19 tiles at zoom 1.0)
- **Fog of War:** Unexplored tiles are darkened (70% opacity)
- **Player Icon:** 🧙 with yellow glow effect

### Performance

- **Viewport Culling:** Only renders visible tiles
- **60 FPS:** Smooth rendering even with 50×50 grid
- **Canvas Optimizations:** Minimal re-draws

---

## 🚀 Next Steps

### Phase 2: Game Integration

1. **Add to Main App:** Replace dungeon-only flow with worldmap hub
2. **Hero Movement:** Implement click-to-move with pathfinding
3. **Dungeon Integration:** Enter dungeons from worldmap
4. **Town Interaction:** Add town UI (tavern, smithy, etc.)

### Phase 3: Multiplayer

1. **Supabase Setup:** Real-time player positions table
2. **Player Sync:** Show other players on map
3. **Movement Updates:** Broadcast position changes
4. **Dynamic Objects:** Sync encounters and resources

### Phase 4: Advanced Features

1. **Combat on Map:** Reuse combat engine for encounters
2. **Resource Collection:** Add to inventory
3. **Day/Night Cycle:** Time-based mechanics
4. **Party System:** Group up for dungeons

---

## 🐛 Known Issues

- None yet! This is the initial implementation.

---

## 📚 Related Documentation

- **[ROADMAP-WORLDMAP-IDEA.md](./ROADMAP-WORLDMAP-IDEA.md)** - Complete design document
- **[ROADMAP.md](./ROADMAP.md)** - Main project roadmap
- **[CODING_RULES.md](./CODING_RULES.md)** - Coding standards

---

## 🤝 Contributing

When working on worldmap features:

1. ✅ Follow [CODING_RULES.md](./CODING_RULES.md)
2. ✅ Add JSDoc documentation
3. ✅ Use localization for all user-facing text
4. ✅ Test with multiple seeds
5. ✅ Update this README if adding features

---

**Questions?** Check [ROADMAP-WORLDMAP-IDEA.md](./ROADMAP-WORLDMAP-IDEA.md) for detailed design decisions.
