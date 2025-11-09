# Worldmap System - Concept Document

**Author:** Roman Hlaváček - rhsoft.cz
**Copyright:** 2025
**Last Modified:** 2025-11-08
**Status:** Phase 1 Complete (v0.6.2) - Dungeon Integration Complete

---

## 🆕 Recent Updates (v0.6.2 - 2025-11-08)

### Dungeon Integration Complete ✅
- **Dungeon Entry from Worldmap**: Click dungeon entrances to enter with energy cost
- **Loot Transfer System**: Items and gold properly save to database after dungeon completion
- **Victory Screen**: Full loot display with collect all/sell all functionality
- **Defeat Handling**: Automatic exit to worldmap when all heroes die
- **Enemy Scaling**: Relative difficulty based on hero level vs dungeon recommended level
- **Item Persistence**: Items correctly reconstruct from database with all properties
- **Enchant Menu**: Right-click items to open enchant/sell modal
- **Item Selling**: Sell items for gold directly from equipment screens

**Files Modified:**
- `Router.tsx` - Complete dungeon integration with victory/defeat screens
- `useGameState.ts` - Fixed item reconstruction from database (Item constructor migration)
- `GameSaveService.ts` - Fixed item property mapping (stats vs baseStats)
- `Dungeon.ts` - Added loot statistics tracking
- `WorldMapDemo2.tsx` - Added enchant/sell modal UI

---

## 🎯 Vision

Create a large-scale **HOMAM-style worldmap** that serves as the main game hub, where players can:
- Explore a vast procedurally generated world
- See and interact with other players in real-time (multiplayer server)
- Enter dungeons, fight enemies, collect resources, visit towns
- Strategic movement and positioning matter

---

## 🗺️ Core Concept: Shared World Server

### **Multiplayer Architecture**

```
┌─────────────────────────────────────────┐
│         Game Server (Supabase)          │
│  - World state (50x50 tiles)            │
│  - Player positions                     │
│  - Dynamic encounters                   │
│  - Resource spawns                      │
│  - Real-time updates                    │
└─────────────────────────────────────────┘
              ↕ Websocket/Realtime
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Player 1 │  │ Player 2 │  │ Player 3 │
│  @ (5,7) │  │  @ (12,8)│  │  @ (8,15)│
└──────────┘  └──────────┘  └──────────┘
```

**Key Features:**
- **Persistent world** - Map exists on server, shared by all players
- **Real-time player visibility** - See other players moving on map
- **Instanced dungeons** - When entering dungeon, player enters private instance
- **Shared resources** - First player to reach resource collects it
- **PvP zones** (optional future feature)

---

## 🏗️ Technical Architecture

### **Map Structure**

```typescript
// 50x50 grid for large exploration
interface WorldMap {
  id: string;
  width: 50;
  height: 50;
  tiles: Tile[][];
  players: PlayerOnMap[];
  dynamicObjects: DynamicObject[]; // Encounters, resources that can spawn/despawn
}

interface Tile {
  x: number;
  y: number;
  terrain: TerrainType;
  staticObject: StaticObject | null; // Towns, dungeon entrances (permanent)
  isExplored: boolean; // Per-player fog of war
  movementCost: number;
  biome: BiomeType; // Forest, Plains, Mountains, Desert, etc.
}

interface PlayerOnMap {
  userId: string;
  heroName: string;
  heroClass: HeroClass;
  position: { x: number; y: number };
  level: number;
  isMoving: boolean;
  lastSeen: Date;
}
```

---

## 🌍 Terrain Types & Biomes

### **Terrain Types (Movement Cost)**

| Terrain | Icon | Movement Cost | Description |
|---------|------|---------------|-------------|
| **Plains** | 🟩 | 100 | Fast travel, common encounters |
| **Forest** | 🌲 | 150 | Slower, more resources |
| **Mountains** | ⛰️ | 250 | Very slow, elite encounters |
| **Water** | 🌊 | Impassable | Requires boat (future) |
| **Road** | 🛤️ | 75 | Fastest travel between towns |
| **Desert** | 🏜️ | 175 | Medium speed, harsh encounters |
| **Swamp** | 🕸️ | 200 | Slow, debuff encounters |

### **Biomes (Regions)**

```
🏔️ Mountain Region (Northwest)
  - High-level enemies
  - Rare resources (ore, gems)
  - Challenging dungeons

🌲 Forest Region (Center-West)
  - Medium-level enemies
  - Wood resources
  - Balanced encounters

🏜️ Desert Region (South)
  - Fire-themed enemies
  - Ancient dungeons
  - Rare artifacts

🏰 Kingdom Region (Center)
  - Safe zone around towns
  - Low-level enemies
  - Starting area
```

---

## 🎮 Movement System

### **Turn-Based Movement (Simplified HOMAM)**

**Movement Points:**
- Each hero has **1500 movement points per day**
- Each terrain costs different points (see table above)
- When points run out, wait for next day or rest in town

**Day/Night Cycle:**
- Real-time: 1 day = 20 minutes real time
- Night: Increased enemy encounters, but better loot
- Day: Normal encounters, towns are cheaper

**Movement Actions:**
- **Click to move** - Pathfinding calculates optimal route
- **WASD keys** - Direct movement (1 tile at a time)
- **Auto-travel** - Click distant location, hero auto-moves (cancellable)

---

## 📍 Static Objects (Permanent)

### **🏰 Towns (3-5 per map)**

```typescript
interface Town {
  id: string;
  name: string;
  position: { x: number; y: number };
  level: number; // 1-3 (affects building levels)
  faction: 'Kingdom' | 'Mountain Dwarves' | 'Desert Nomads';

  buildings: {
    tavern: boolean; // Recruit heroes
    smithy: boolean; // Upgrade equipment
    healer: boolean; // Restore HP
    market: boolean; // Buy/sell items
    bank: boolean; // Store gold/items (shared account)
  };

  garrison: Hero[]; // Player's stored heroes
}
```

**Town Locations (Fixed):**
- **Capital (Kingdom)** - Center of map (25, 25) - Level 3
- **Mountain Stronghold** - Northwest (10, 10) - Level 2
- **Desert Oasis** - South (25, 45) - Level 2
- **Forest Outpost** - West (5, 25) - Level 1

---

### **🕳️ Dungeon Entrances (5-10 per map)**

```typescript
interface DungeonEntrance {
  id: string;
  name: string;
  position: { x: number; y: number };
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Nightmare';
  maxFloors: number; // 10, 25, 50, or Infinite
  recommendedLevel: number;
  theme: 'Goblin Caves' | 'Ancient Ruins' | 'Dark Catacombs' | 'Endless Abyss';

  // When player enters:
  // - Create private dungeon instance
  // - Use existing dungeon system
  // - On exit, return to worldmap at this position
}
```

**Fixed Dungeon Locations:**
- Goblin Caves (Easy) - Near starting town (20, 20)
- Forest Ruins (Medium) - Forest region (8, 28)
- Mountain Depths (Hard) - Mountain region (12, 8)
- Ancient Temple (Hard) - Desert region (28, 48)
- Endless Abyss (Nightmare, Infinite) - Center-East (40, 25)

---

## 🎲 Dynamic Objects (Spawn/Despawn)

### **⚔️ Enemy Encounters (Visible on Map)**

```typescript
interface MapEncounter {
  id: string;
  position: { x: number; y: number };
  enemies: Enemy[];
  difficulty: 'Normal' | 'Elite' | 'Boss';
  level: number;
  spawnTime: Date;
  despawnTime: Date; // Disappears after 30 minutes if not engaged

  // When defeated by player:
  // - Rewards given
  // - Encounter removed from map
  // - New encounter spawns elsewhere
}
```

**Spawn Rules:**
- 10-15 active encounters on map at all times
- Spawn in clusters based on biome
- Higher level encounters near dangerous areas
- Respawn rate: 1 new encounter every 2 minutes

---

### **💎 Resource Nodes**

```typescript
interface ResourceNode {
  id: string;
  type: 'gold' | 'wood' | 'stone' | 'ore' | 'gems';
  position: { x: number; y: number };
  amount: number;
  regenerates: boolean;
  respawnTime: Date;

  // When collected by player:
  // - Added to player's kingdom resources
  // - Node disappears from map
  // - Regenerates after 1 hour (if regenerates = true)
}
```

**Resource Distribution:**
- Gold: Scattered randomly (25 nodes)
- Wood: Forest biome (15 nodes)
- Stone: Mountain biome (15 nodes)
- Ore: Mountain biome (10 nodes)
- Gems: Rare, random locations (5 nodes)

---

### **❓ Random Events**

```typescript
interface RandomEvent {
  id: string;
  position: { x: number; y: number };
  type: 'TreasureChest' | 'Shrine' | 'Merchant' | 'QuestGiver';
  oneTime: boolean; // Disappears after interaction

  // TreasureChest: Random loot (gold + items)
  // Shrine: Temporary buff (1 hour)
  // Merchant: Special items for sale
  // QuestGiver: Daily/weekly quests
}
```

---

## 👥 Multiplayer Features

### **Player Visibility**

**What Players See:**
- **Player icon** on map (hero class icon)
- **Player name** and level on hover
- **Movement animation** when player moves
- **Chat bubble** for proximity chat (optional)

**Social Features:**
- **Friend List** - See friends' positions on map
- **Party System** - Form parties for dungeon runs
- **Guild System** (future)
- **Trade System** - Trade items with nearby players

---

### **Real-Time Synchronization (Supabase Realtime)**

```typescript
// Subscribe to world updates
supabase
  .channel('worldmap')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'player_positions'
  }, (payload) => {
    updatePlayerPosition(payload.new);
  })
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'encounters'
  }, (payload) => {
    spawnEncounter(payload.new);
  })
  .subscribe();
```

**Update Frequency:**
- Player positions: Every 2 seconds (or on move)
- Encounters: On spawn/defeat
- Resources: On collection/respawn

---

## 🎨 Procedural Map Generation

### **Generation Algorithm**

```typescript
class WorldMapGenerator {
  static generateWorld(): WorldMap {
    // 1. Generate terrain base (Perlin noise)
    const terrain = this.generateTerrain(50, 50);

    // 2. Define biomes (noise-based regions)
    const biomes = this.generateBiomes(terrain);

    // 3. Place fixed towns (strategic positions)
    const towns = this.placeTowns([
      { name: 'Capital', pos: {x: 25, y: 25}, level: 3 },
      { name: 'Stronghold', pos: {x: 10, y: 10}, level: 2 },
      { name: 'Oasis', pos: {x: 25, y: 45}, level: 2 },
      { name: 'Outpost', pos: {x: 5, y: 25}, level: 1 }
    ]);

    // 4. Place fixed dungeon entrances
    const dungeons = this.placeDungeons([
      { name: 'Goblin Caves', pos: {x: 20, y: 20}, difficulty: 'Easy' },
      { name: 'Forest Ruins', pos: {x: 8, y: 28}, difficulty: 'Medium' },
      { name: 'Mountain Depths', pos: {x: 12, y: 8}, difficulty: 'Hard' },
      { name: 'Endless Abyss', pos: {x: 40, y: 25}, difficulty: 'Nightmare' }
    ]);

    // 5. Generate roads between towns (A* pathfinding)
    const roads = this.generateRoads(towns);

    // 6. Spawn dynamic encounters (initial spawn)
    const encounters = this.spawnInitialEncounters(15, biomes);

    // 7. Spawn resource nodes (initial spawn)
    const resources = this.spawnInitialResources(biomes);

    return {
      id: `world-${Date.now()}`,
      width: 50,
      height: 50,
      tiles: terrain,
      staticObjects: [...towns, ...dungeons],
      dynamicObjects: [...encounters, ...resources],
      players: []
    };
  }
}
```

### **Biome Generation (Perlin Noise)**

```typescript
// Use noise to create natural-looking regions
private static generateBiomes(terrain: Tile[][]): void {
  const noise = new PerlinNoise(seed);

  for (let y = 0; y < 50; y++) {
    for (let x = 0; x < 50; x++) {
      const value = noise.get(x * 0.1, y * 0.1);

      if (value < -0.3) terrain[y][x].terrain = 'water';
      else if (value < -0.1) terrain[y][x].terrain = 'swamp';
      else if (value < 0.2) terrain[y][x].terrain = 'plains';
      else if (value < 0.5) terrain[y][x].terrain = 'forest';
      else if (value < 0.7) terrain[y][x].terrain = 'desert';
      else terrain[y][x].terrain = 'mountains';
    }
  }
}
```

---

## 📊 Database Schema (Supabase)

### **Tables**

```sql
-- World Map State
CREATE TABLE world_map (
  id UUID PRIMARY KEY,
  width INTEGER DEFAULT 50,
  height INTEGER DEFAULT 50,
  seed TEXT, -- For procedural consistency
  created_at TIMESTAMP DEFAULT NOW()
);

-- Player Positions (Real-time)
CREATE TABLE player_positions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  hero_name TEXT,
  hero_class TEXT,
  position_x INTEGER,
  position_y INTEGER,
  level INTEGER,
  is_online BOOLEAN DEFAULT TRUE,
  last_update TIMESTAMP DEFAULT NOW()
);

-- Static Objects (Towns, Dungeons)
CREATE TABLE static_objects (
  id UUID PRIMARY KEY,
  world_map_id UUID REFERENCES world_map(id),
  type TEXT, -- 'town' | 'dungeon'
  name TEXT,
  position_x INTEGER,
  position_y INTEGER,
  data JSONB -- Town/Dungeon specific data
);

-- Dynamic Objects (Encounters, Resources, Events)
CREATE TABLE dynamic_objects (
  id UUID PRIMARY KEY,
  world_map_id UUID REFERENCES world_map(id),
  type TEXT, -- 'encounter' | 'resource' | 'event'
  position_x INTEGER,
  position_y INTEGER,
  data JSONB, -- Object-specific data
  spawn_time TIMESTAMP DEFAULT NOW(),
  despawn_time TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Fog of War (Per Player)
CREATE TABLE player_fog_of_war (
  user_id UUID REFERENCES auth.users(id),
  explored_tiles INTEGER[], -- Array of tile indices
  PRIMARY KEY (user_id)
);
```

---

## 🚀 Implementation Phases

### **Phase 1: Basic Worldmap (v0.6.2)** ✅ COMPLETED
- [x] Procedurally generate 50x50 map with biomes (Perlin Noise)
- [x] Hero movement system (click to move)
- [x] Fixed town placements (4 towns)
- [x] Fixed dungeon entrances (5 dungeons)
- [x] Basic fog of war (client-side)
- [x] Visual worldmap UI with canvas rendering
- [x] **Dungeon integration (enter/exit)** - COMPLETE (v0.6.2)
- [x] **Loot transfer from dungeons** - COMPLETE (v0.6.2)
- [x] **Victory/Defeat screens** - COMPLETE (v0.6.2)
- [x] **Enemy level scaling** - COMPLETE (v0.6.2)
- [x] **Item enchant/sell system** - COMPLETE (v0.6.2)
- [ ] WASD movement - Not yet implemented

**Implementation Notes:**
- Used Perlin Noise for terrain generation (src/engine/worldmap/PerlinNoise.ts)
- Canvas-based rendering with zoom controls (src/components/WorldMapViewer.tsx)
- Fog of war reveals on movement
- Static objects (towns, dungeons) placed on map
- Integration with useGameState for persistence
- **Full dungeon loop working**: Enter dungeon → Clear floors → Collect loot → Return to worldmap
- **Enemy scaling**: Relative difficulty based on party level vs dungeon level difference
- **Item persistence**: Complete fix for Item constructor migration (config object pattern)

---

### **Phase 2: Hero Collection & Gacha (v0.7.0)** 🔄 NEXT (Different from original plan)
**Note:** Roadmap revised to prioritize hero collection system before multiplayer.
- [ ] Hero collection system (50+ unique heroes)
- [ ] Party of 4 active heroes
- [ ] Gacha summon system with daily free summon
- [ ] Hero collection UI
- [ ] Party manager UI
- [ ] 4v4 combat engine

---

### **Phase 3: Energy System & Daily Reset (v0.8.0)** 📋 PLANNED
- [ ] Energy system (100/day + regen)
- [ ] Daily worldmap reset (new seed daily)
- [ ] Energy bar UI
- [ ] Daily leaderboard preparation

---

### **Phase 4: Town System (v0.9.0)** 📋 PLANNED
- [ ] Town interiors (UI screens)
- [ ] Tavern - Gacha summons, recruit heroes
- [ ] Smithy - Upgrade equipment, enchant, repair
- [ ] Healer - Restore HP services
- [ ] Market - Buy/sell items
- [ ] Bank - Gold storage, interest
- [ ] Guild Hall - Guild management
- [ ] Resource economy (gold, wood, stone)

---

### **Phase 5: Quest System & Story (v1.0.0)** 📋 PLANNED
- [ ] Main story campaign (5 chapters)
- [ ] Branching story choices
- [ ] Daily quests (3 per day)
- [ ] Hero-specific stories
- [ ] Quest tracking UI
- [ ] Dialogue system

---

### **Phase 6: Leaderboards & Endgame (v1.1.0)** 📋 PLANNED
- [ ] Daily leaderboards (4 categories)
- [ ] World Boss events
- [ ] Endless Abyss infinite scaling
- [ ] Prestige system

---

### **Phase 7: Multiplayer & Social (v1.2.0)** 📋 PLANNED (Original Phase 2)
- [ ] Supabase real-time player positions
- [ ] Player visibility on map (icons, names)
- [ ] Real-time position updates
- [ ] Guild system with perks
- [ ] Guild wars (territory control)
- [ ] Global chat, guild chat
- [ ] Friend list system
- [ ] Cooperative dungeons
- [ ] Player trading

---

### **Phase 8: Advanced Multiplayer Features (v1.3.0+)** 📋 FUTURE
- [ ] Dynamic enemy encounters (spawn/despawn on server)
- [ ] Resource nodes (server-managed, first-come-first-served)
- [ ] Random events (treasure, shrines, merchants)
- [ ] PvP zones (optional)
- [ ] World bosses (raid encounters)
- [ ] Seasonal events

---

## 🎯 Design Philosophy

**Key Principles:**
1. **Exploration is rewarding** - Players feel excited to discover new areas
2. **Social interaction** - Seeing other players creates a living world
3. **Strategic movement** - Terrain and positioning matter
4. **Seamless integration** - Worldmap enhances, doesn't replace, existing systems
5. **Performance first** - Large map with many players must run smoothly

**Player Journey:**
```
Start in Capital → Explore nearby forest → Find easy dungeon →
Clear dungeon → Return to town → Upgrade gear → Travel to harder areas →
Meet other players → Form party → Tackle harder dungeons together →
Collect resources → Build kingdom → Explore world bosses
```

---

## 🛠️ Technical Challenges

### **Challenge 1: Performance with 50x50 Grid**
**Solution:**
- Render only visible tiles (viewport culling)
- Use canvas/WebGL for map rendering
- Lazy load tile data

### **Challenge 2: Real-Time Sync with Many Players**
**Solution:**
- Update positions only on move (not every frame)
- Throttle updates to 2 seconds
- Use Supabase realtime subscriptions

### **Challenge 3: Procedural Generation Consistency**
**Solution:**
- Store world seed in database
- Generate same world from seed on each client
- Only sync dynamic objects (encounters, resources)

### **Challenge 4: Fog of War (Per-Player)**
**Solution:**
- Store explored tiles as bitmap in database
- Update on each tile discovery
- Client-side rendering of fog

---

## 📝 Next Steps

1. **Create basic worldmap generator** (this session)
2. **Implement tile-based rendering UI**
3. **Add hero movement system**
4. **Integrate with existing dungeon system**
5. **Set up Supabase real-time for multiplayer**

---

**Status:** Ready for implementation
**Priority:** High - This will be the foundation for all future features
**Dependencies:** None - Can start immediately
