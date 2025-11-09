# Looters Land - React + TypeScript

**Author:** Roman Hlaváček - rhsoft.cz
**Copyright:** 2025
**Last Modified:** 2025-11-08

---

## Overview

This is **Looters Land**, an idle RPG adventure built with **React + TypeScript** for optimal scalability, type safety, and maintainability.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Supabase** - Cloud database & authentication
- **Custom Hooks** - useGameState for centralized state management

## Project Structure

```
looters-land/
├── src/
│   ├── engine/              # Game engine (core logic)
│   │   ├── hero/           # Hero system
│   │   │   └── Hero.ts
│   │   ├── item/           # Item system
│   │   │   ├── Item.ts
│   │   │   └── ItemGenerator.ts
│   │   ├── equipment/      # Equipment system
│   │   │   ├── Equipment.ts
│   │   │   └── SetBonusManager.ts
│   │   ├── combat/         # Combat system (TBD)
│   │   └── dungeon/        # Dungeon system (TBD)
│   ├── components/         # React components (TBD)
│   ├── hooks/              # Custom React hooks (TBD)
│   ├── stores/             # State management (TBD)
│   ├── types/              # TypeScript type definitions
│   │   ├── hero.types.ts
│   │   ├── item.types.ts
│   │   └── equipment.types.ts
│   ├── utils/              # Utility functions (TBD)
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
└── package.json
```

## Migration Status

### ✅ Completed

- [x] Project setup (Vite + React + TypeScript)
- [x] Hero system migrated to TypeScript
- [x] Item system migrated to TypeScript
- [x] Equipment system migrated to TypeScript
- [x] Set bonus system migrated
- [x] Combat system complete with turn-based mechanics
- [x] 5 Hero classes with unique skills
- [x] Status effects system (buffs/debuffs/stun/immunity)
- [x] Hero leveling system with XP and stat growth
- [x] Loot system with drop rates and rarity distribution
- [x] Enemy types (Normal/Elite/Boss) with visual distinction
- [x] Inventory system with filtering, sorting, and capacity expansion
- [x] Enchanting system with success/failure mechanics
- [x] Dungeon system with 10 room types (Combat, Boss, Treasure, Trap, Rest, Shrine, Mystery, Elite, Mini-Boss)
- [x] Procedural worldmap generation (50x50 with Perlin Noise)
- [x] Fog of war system with exploration
- [x] Database integration (Supabase) - player profiles, game saves
- [x] Authentication system (Supabase) with signup/login/logout
- [x] Auto-save system with cloud sync
- [x] useGameState hook for centralized state management
- [x] Complete UI with responsive design

### ✅ Completed (v0.7.0)

- [x] Hero collection system (party of 4)
- [x] Gacha summon system (gold-based, daily free summon)
- [x] Hero collection screen UI
- [x] Party manager UI
- [x] Hero rarity system (Common, Rare, Epic, Legendary)
- [x] **Talent System Phase 1** - Duplicate hero merging
  - Automatic duplicate detection and merging
  - Talent points awarded for duplicates (+1 per dupe)
  - Talent point UI indicators on hero cards
  - "Coming Soon" placeholder for talent tree

### 🔄 In Progress (v0.8.0 - Next)

- [ ] Party-based 4v4 combat
- [ ] Talent Tree Phase 2 (unlock abilities with talent points)

### 📋 Planned

- [ ] Energy system with daily reset
- [ ] Daily worldmap reset with new seed
- [ ] Town system with 6 buildings
- [ ] Quest system with branching story
- [ ] Leaderboards and endgame content
- [ ] Multiplayer features (guilds, real-time positions)
- [ ] Boss-specific unique item drops
- [ ] Achievement system

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+ (currently using 20.17.0 - upgrade recommended)
- npm or yarn

### Installation

```bash
cd looters-land
npm install
```

### Development

```bash
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
npm run preview
```

## Current Features (v0.6.1)

The game currently includes:

1. **Hero System** - 5 classes (Warrior, Archer, Mage, Cleric, Paladin) with unique skills
2. **Combat System** - Turn-based combat with initiative, manual/auto modes
3. **Equipment System** - 7 equipment slots with set bonuses and stat modifiers
4. **Inventory** - Filtering, sorting, item selling, enchanting, capacity expansion
5. **Leveling** - XP gain, level ups, stat growth scaling
6. **Loot System** - Item drops with rarity distribution, gold rewards
7. **Enemy Types** - Normal/Elite/Boss enemies with different drop rates
8. **Status Effects** - Buffs, debuffs, stun, immunity mechanics
9. **Dungeon System** - Procedural dungeons with 10 room types, floor progression
10. **Worldmap System** - 50x50 procedural map with biomes, towns, dungeons, fog of war
11. **Database Integration** - Cloud saves with Supabase (player profiles, game saves, auto-sync)
12. **Authentication** - User registration, login, logout with secure session management
13. **Centralized State** - useGameState hook managing all game data with auto-save
14. **UI Enhancements** - Mouse wheel zoom, keyboard shortcuts (W/H/I/T/L/Q/G)

## Migration Benefits

### Type Safety

```typescript
// Before (JS)
function equipItem(item) {
  // No type checking
}

// After (TS)
function equipItem(item: Item): EquipResult {
  // Full type safety
}
```

### Better IDE Support

- Autocomplete for all properties and methods
- Inline documentation
- Refactoring support
- Error detection before runtime

### Scalability

- Component-based architecture
- Reusable UI components
- Easy to add new features
- Proper state management

### Maintainability

- Clear type definitions
- Separation of concerns (engine vs UI)
- Easier debugging
- Better code organization

## Next Steps

1. **Migrate Combat System** - Convert combat engine to TypeScript
2. **Migrate Dungeon System** - Convert dungeon generation and exploration
3. **Create React Components** - Build UI components for all systems
4. **State Management** - Set up Zustand or Context API
5. **Integration** - Connect all systems together
6. **Testing** - Add unit tests for engine logic

## Differences from Vanilla Version

### Architecture

- **Vanilla JS**: Global variables, manual DOM manipulation
- **React TS**: Component-based, declarative UI, type-safe

### State Management

- **Vanilla JS**: Direct object mutation
- **React TS**: Immutable state updates, React hooks

### File Organization

- **Vanilla JS**: Flat structure, script tags
- **React TS**: Module system, organized folders

### Development Workflow

- **Vanilla JS**: Refresh browser, check console
- **React TS**: Hot module reload, compile-time errors

## Testing the Current Build

1. Start the dev server: `npm run dev`
2. Click "Create Test Hero" - Creates a warrior with equipment manager
3. Click "Generate Test Items" - Creates 3 random items
4. Click any item card - Equips it to the hero
5. Watch hero stats update in real-time

## Performance Notes

The migration uses:
- React 18 with automatic batching
- Vite for fast HMR (Hot Module Replacement)
- TypeScript for compile-time optimization
- Minimal re-renders with proper state management

## Contributing

When adding new features:

1. Create types in `/src/types/`
2. Create engine logic in `/src/engine/`
3. Create React components in `/src/components/`
4. Use TypeScript strictly (no `any` types)

## Known Issues

- Node.js version warning (20.17.0 vs 20.19+ recommended)
- Energy system not yet implemented
- Town system buildings not interactive yet
- Gacha/hero collection system pending (v0.7.0)

## Documentation

### Project Documentation

- **[Roadmap](documentation/roadmap.md)** - Development roadmap and version planning
- **[Game Design](documentation/GAME-LOOP-DESIGN.md)** - Complete game loop design document
- **[Project Status](documentation/project_status.md)** - Current development status
- **[Documentation Index](documentation/INDEX.md)** - Complete documentation overview

### Technical Guides

- **[Coding Rules](documentation/technical/coding_rules.md)** - Coding standards and patterns
- **[Localization](documentation/technical/LOCALIZATION.md)** - i18n implementation guide
- **[Supabase Setup](documentation/technical/SUPABASE_SETUP.md)** - Database configuration
- **[Deployment](documentation/technical/DEPLOY_INSTRUCTIONS.md)** - Production deployment guide

### External Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Supabase Documentation](https://supabase.com/docs)

---

**Version**: 0.6.1
**Last Updated**: 2025-11-09
**Status**: Active development - UI improvements complete (zoom, keyboard shortcuts), preparing v0.7.0 (Hero Collection & Gacha)
