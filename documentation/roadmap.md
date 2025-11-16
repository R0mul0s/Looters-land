# Looters Land - Development Roadmap

**Author:** Roman Hlaváček - rhsoft.cz
**Copyright:** 2025
**Last Modified:** 2025-11-07

---

## ✅ Completed Features

### Equipment System
- ✅ Complete equipment management (6 slots: Helmet, Chest, Legs, Boots, Weapon, Shield)
- ✅ Item generation with rarities (Common, Uncommon, Rare, Epic, Legendary)
- ✅ Equipment stats bonuses applied to heroes
- ✅ Enchanting system with success/failure mechanics
- ✅ Inventory management with filtering and sorting
- ✅ Item tooltips with full stat display
- ✅ Save/Load game state with Supabase integration

### Combat System
- ✅ Turn-based combat engine with initiative system
- ✅ 5 Hero classes (Warrior, Archer, Mage, Cleric, Paladin)
- ✅ 15 Skills (3 per class) with cooldown system
- ✅ Enemy generation with level scaling
- ✅ Combat log with detailed action reporting
- ✅ Auto combat mode with AI for heroes and enemies
- ✅ Manual combat mode with player control
- ✅ Skill tooltips with descriptions and stats
- ✅ Target validation (damage → enemies, heal → allies)
- ✅ Responsive UI for mobile and desktop

### Status Effects System
- ✅ Complete status effects implementation with buff/debuff mechanics
- ✅ Actual buff application in all skills
  - Battle Cry: +30% ATK for 3 turns (team buff)
  - Evasion: +50% SPD for 2 turns (self buff)
  - Mana Shield: -40% damage taken for 3 turns (self buff)
  - Divine Shield: Immunity for 1 turn (self buff)
  - Blessing: +40% DEF for 3 turns (single ally buff)
  - Shield Bash stun: Skip turn for 1 turn (debuff)
- ✅ Status effect tick system with duration reduction per turn
- ✅ Stat modifiers from active buffs/debuffs applied through getCombatStats()
- ✅ Visual indicators on character cards with buff/debuff tooltips
- ✅ Status effect expiration messages in combat log
- ✅ Stun mechanics preventing character turns
- ✅ Immunity mechanics blocking all damage

## 🚧 In Progress / Planned Features

### Combat System Enhancements

#### 1. **Advanced Combat Features**
- [ ] Ultimate abilities (charge system already exists)
- [ ] Critical hit animations/visual feedback
- [ ] Combo system (skill chains)
- [ ] Enemy AI improvements (smart targeting, skill usage)
- [ ] Boss enemies with special abilities
- [ ] Multiple enemy types with different behaviors

### Progression Systems

#### 2. **Hero Leveling System** ✅ COMPLETED
- ✅ Experience points (XP) from combat victories
- ✅ Level up system with stat increases (HP, ATK, DEF, SPD, CRIT scaling)
- ✅ XP formula: baseXP (50) × average enemy level × number of enemies
- ✅ Required XP scaling: baseXP (100) × (level ^ 1.5)
- ✅ Stat growth per level with Math.ceil() rounding
- ✅ Visual level up notifications in combat log
- ✅ **Talent System Phase 1** (v0.6.2)
  - Duplicate hero merging (same name + class + rarity)
  - Talent points awarded for duplicates (+1 per dupe, max 6)
  - Talent point UI indicators (⭐ badges)
  - Database persistence (talent_points column)
- [ ] **Talent System Phase 2** - Talent Tree
  - Unlock special abilities with talent points
  - Passive stat bonuses
  - Class-specific talent paths
- [ ] Skill unlocking at specific levels
- [ ] Prestige/rebirth system for late game

#### 3. **Loot System** ✅ COMPLETED
- ✅ Item drops from defeated enemies
- ✅ Loot tables based on enemy level/type
- ✅ Drop chances: Normal (30%), Elite (50%), Boss (100%)
- ✅ Rarity distribution: Common 60%, Uncommon 25%, Rare 10%, Epic 4%, Legendary 1%
- ✅ Item level scaling: enemy level ±1-2 range
- ✅ Gold rewards from combat (level × 10 with ±20% variance)
- ✅ Loot UI with individual item collection/selling
- ✅ Modal-based loot interaction with inventory space checks
- [ ] Boss-specific legendary drops (unique items)
- [ ] Crafting materials

### Idle Mechanics

#### 4. **Active Idle System** (Prioritized over true offline)
- [ ] Auto-Farm mode (continuous auto-battles)
- [ ] AFK rewards (bonus gold/XP when tab is active but user inactive)
- [ ] Auto-loot collection with inventory management
- [ ] Stop conditions (time limit, deaths, full inventory)
- [ ] Daily login rewards and streak system
- [ ] Auto-battle statistics tracking
- [ ] Prestige currency for permanent upgrades

#### 5. **Dungeon System** ✅ COMPLETED (Base Implementation)
- ✅ Procedurally generated dungeons with random rooms
- ✅ Progressive difficulty (floor-based scaling)
- ✅ Room types: Start, Combat, Boss, Treasure, Trap, Rest, Exit
- ✅ Dungeon exploration UI with minimap
- ✅ Floor progression and checkpoints
- ✅ Boss encounters every 5 floors
- ✅ Loot drops from combat
- ✅ Victory screen with rewards
- ✅ Movement blocking during combat
- ✅ Auto-combat and Manual combat in dungeons

#### 5.1. **New Dungeon Room Types** (🔨 IN PROGRESS)
- 🔨 **Shrine/Blessing Room** (⛪) - Provides temporary floor-wide buffs
  - Options: +10% damage, +15% XP, +20% gold drop, +1 to all stats
  - One-time use per floor

- 🔨 **Mystery Room** (❓) - Random events with risk/reward
  - Positive outcomes: Extra loot, healing, buffs
  - Negative outcomes: Curses, damage, debuffs
  - Gambling mechanics - player choice to engage or skip

- 🔨 **Elite Combat Room** (💪) - Harder fights with better rewards
  - 1-2 powerful elite enemies
  - Guaranteed rare+ item drops
  - Higher gold rewards
  - More challenging than normal combat

- 🔨 **Mini-Boss Room** (👹) - Mid-tier boss encounters
  - Unique enemy with special abilities
  - Less HP than floor boss but stronger than elite
  - Guaranteed good loot
  - Appears randomly between floors

#### 5.2. **Dungeon System Enhancements** (Future Ideas)
- [ ] **Multiple Dungeon Types** - Different dungeons with varying max floors
  - Tutorial Dungeon (10 floors)
  - Main Story Dungeon (50 floors)
  - Endless Dungeon (infinite floors)
  - Challenge Dungeons (special modifiers)
- [ ] **Prestige System** - Reset dungeon with permanent bonuses
  - Prestige currency from deep floors
  - Permanent stat boosts
  - Unlock new room types
- [ ] **Dungeon Modifiers** - Random buffs/debuffs per run
  - Increased enemy damage
  - More loot drops
  - Reduced healing
  - Boss rush mode
- [ ] **Leaderboards** - Track deepest floor reached
  - Global rankings
  - Friend rankings
  - Season-based resets

#### 5.3. **Additional Room Types** (Planned)
- [ ] **Merchant Room** (🏪) - Buy/sell items, equipment upgrades
- [ ] **Library/Skill Room** (📚) - Temporary skill boosts, cooldown reductions
- [ ] **Fountain Room** (⛲) - Full heal or temporary HP bonus
- [ ] **Puzzle Room** (🧩) - Mini-game challenges with rewards
- [ ] **Cursed Room** (👿) - High-value loot with curses/debuffs
- [ ] **Arena Room** (⚔️) - Wave-based combat with escalating rewards
- [ ] **Garden Room** (🌿) - Resource gathering, crafting materials
- [ ] **Teleporter Room** (🌀) - Skip rooms or return to start

#### 6. **Kingdom Management**
- [ ] Building system (barracks, smithy, tavern, etc.)
- [ ] Resource gathering (wood, stone, food)
- [ ] Hero recruitment system
- [ ] Town upgrades providing passive bonuses
- [ ] Quest/mission system

### Quality of Life

#### 6. **UI/UX Improvements**
- [ ] Better mobile responsiveness (ongoing)
- [ ] Keyboard shortcuts for combat
- [ ] Settings menu (sound, animations, etc.)
- [ ] Tutorial system for new players
- [ ] Achievement system
- [ ] Statistics tracking (battles won, damage dealt, etc.)

#### 7. **Performance Optimizations**
- [ ] Combat animation system (optional)
- [ ] Reduce re-renders in React components
- [ ] Optimize large inventory management
- [ ] Background worker for idle calculations

### Content Expansion

#### 8. **New Content**
- [ ] More hero classes (Ranger, Necromancer, Bard, etc.)
- [ ] More enemy types and bosses
- [ ] Campaign/story mode with stages
- [ ] Arena/PvP mode (vs AI-controlled parties)
- [ ] Endless dungeon mode
- [ ] Seasonal events

#### 9. **Social Features**
- [ ] Guild system
- [ ] Leaderboards
- [ ] Friend system
- [ ] Trading system
- [ ] Cooperative raids

## 📝 Technical Debt

### Code Quality
- [ ] Add comprehensive TypeScript types for all combat actions
- [ ] Unit tests for combat engine
- [ ] Integration tests for equipment system
- [ ] Error boundary components
- [ ] Better state management (Context API or Zustand)

### Documentation
- [ ] API documentation for game systems
- [ ] Code comments for complex algorithms
- [ ] Player guide/wiki
- [ ] Developer setup guide

## 🎯 Immediate Next Steps (REVISED - New Game Loop)

**See [GAME-LOOP-DESIGN.md](./GAME-LOOP-DESIGN.md) for complete v2.0 design document.**

### **NEW CORE FEATURES:**

1. ✅ **Dungeon System** - Complete with extended room types (v0.4.1)
2. ✅ **Worldmap System** - Procedural 50x50 map foundation (v0.6.0)
3. 🔨 **Hero Collection & Gacha** - Party of 4, gacha summons (v0.7.0 - NEXT)
4. **Energy System & Daily Reset** - Daily map reset, energy limits (v0.8.0)
5. **Town System** - 6 buildings with full services (v0.9.0)
6. **Quest System & Story** - Branching story campaign (v1.0.0)
7. **Leaderboards & Endgame** - Daily competition, prestige (v1.1.0)
8. **Multiplayer & Social** - Real-time visibility, guilds (v1.2.0)

### Current Priority: v0.7.0 - Hero Collection & Gacha System (🔨 NEXT)

**v0.6.0 Worldmap Foundation - ✅ COMPLETE:**
- ✅ Perlin Noise terrain generation
- ✅ 50x50 worldmap with biomes
- ✅ 4 towns, 5 dungeons, roads, encounters, resources
- ✅ Fog of war system
- ✅ Canvas-based viewer with zoom

**v0.7.0 Goals - Hero Collection & Gacha (2 weeks) - ✅ 100% COMPLETE:**

Transition from **single hero** to **party-based gameplay** with **gacha collection mechanics** - **SUCCESSFULLY COMPLETED**.

**Core Changes:**
1. **Hero Collection System** ✅ 100% COMPLETE
   - ✅ Party of 4 active heroes
   - ✅ Collection of 50+ unique heroes (60 heroes in pool)
   - ✅ Hero roles: Tank, DPS, Healer, Support
   - ✅ Individual hero leveling (each hero levels independently)
   - ✅ Hero pool with rarities (Common, Rare, Epic, Legendary)
   - ✅ Hero metadata (faction, special abilities, descriptions)
   - ✅ Talent System Phase 1 (duplicate merging, +5% stats per point, max 6)

2. **Gacha Summon System** ✅ 100% COMPLETE
   - ✅ Gold-based summons (1,000g = 1x, 9,000g = 10x)
   - ✅ Daily free summon (resets at midnight)
   - ✅ Rarity distribution: Common 60%, Rare 25%, Epic 12%, Legendary 3%
   - ✅ Pity system (guaranteed Epic after 100 summons)
   - ✅ Gacha state persistence (database sync)
   - ✅ Daily free summon tracking with proper date comparison
   - ✅ Summon animations with rarity reveal

3. **Combat Integration** ✅ 100% COMPLETE
   - ✅ 4v4 party battles (fully functional)
   - ✅ XP distribution across party
   - 📋 Hero synergies and combo skills (planned for v1.0.0)

4. **UI Components** ✅ 100% COMPLETE
   - ✅ Hero collection screen (filter by rarity, role, class)
   - ✅ Party manager (swap active party of 4)
   - ✅ Gacha summon screen with animations
   - ✅ Hero details view with stats and equipment
   - ✅ Tavern building integration in Town system
   - ✅ Combat Power display (MainSidebar badge)
   - ✅ Hero/Item scoring tooltips

5. **Database Integration** ✅ 100% COMPLETE
   - ✅ Gacha state persistence (pity counter, daily summon)
   - ✅ Hero collection persistence to database
   - ✅ Party composition persistence
   - ✅ Daily free summon date tracking (fixes Ctrl+F5 reset issue)
   - ✅ Talent points persistence

**Implementation Complete:**
- ✅ Created `hero.types.ts` with full hero definitions
- ✅ Built `GachaSystem.ts` engine with pity system
- ✅ Created `HeroPool.ts` with 60 unique heroes
- ✅ Created `HeroCollection.tsx` UI
- ✅ Built `PartyManager.tsx` for hero swapping
- ✅ Built `GachaSummon.tsx` with summon animations
- ✅ Integrated Tavern building in Town system
- ✅ Fixed daily free summon persistence bug (date comparison)
- ✅ Added SQL migration for gacha state columns

**v0.7.1 - Hero & Item Scoring System (✅ COMPLETE - Nov 10, 2025):**

Implemented comprehensive scoring system for power ratings and progression gates.

1. **Score Calculation Formulas** ✅ COMPLETE
   - ✅ Hero score: Base (rarity) × Level Multiplier × Equipment Bonus
   - ✅ Item score: Base (rarity) × Level × Enchant × Slot Multiplier
   - ✅ Combat Power: Sum of active party hero scores

2. **Hero Scoring** ✅ COMPLETE
   - ✅ Rarity base scores (Common: 100, Rare: 250, Epic: 500, Legendary: 1000)
   - ✅ Level multiplier: 1 + (level - 1) × 0.1
   - ✅ Equipment bonus: +1% per 100 equipment score
   - ✅ `Hero.getScore()` method

3. **Item Scoring** ✅ COMPLETE
   - ✅ Rarity base scores (Common: 10 to Legendary: 250)
   - ✅ Level scaling: +2% per level
   - ✅ Enchant bonus: +15% per enchant level
   - ✅ Slot multipliers (Weapon: 1.5x, Chest/Shield: 1.2x, Accessory: 1.3x)
   - ✅ `Item.getScore()` method

4. **UI Integration** ✅ COMPLETE
   - ✅ Hero Collection cards show hero score
   - ✅ Hero detail panel shows hero score
   - ✅ Item tooltips show item score
   - ✅ MainSidebar displays Combat Power badge
   - ✅ Real-time combat power updates via useGameState

5. **Progression System** ✅ COMPLETE
   - ✅ Recommendation system for dungeon difficulty
   - ✅ Foundation for leaderboard rankings
   - ✅ Party optimization metrics

**Implementation Files:**
- ✅ `src/utils/scoreCalculator.ts` - Core scoring algorithms
- ✅ `src/engine/hero/Hero.ts` - Hero score method
- ✅ `src/engine/item/Item.ts` - Item score method
- ✅ `src/hooks/useGameState.ts` - Combat power state management
- ✅ `src/components/gacha/HeroCollection.tsx` - Score display
- ✅ `src/components/ui/ItemTooltip.tsx` - Item score display
- ✅ `src/components/ui/MainSidebar.tsx` - Combat power badge

**v0.7.2 - Mobile Optimizations & Sync Status (✅ COMPLETE - Nov 10, 2025):**

Improved mobile experience and added real-time sync status indicator.

1. **Mobile Map Fixes** ✅ 100% COMPLETE
   - ✅ Fixed map rendering on mobile devices (stretched appearance)
   - ✅ Fixed tap position calculations (incorrect target tiles)
   - ✅ High-DPI canvas support using devicePixelRatio
   - ✅ Proper zoom centering on player avatar
   - ✅ Fixed viewport calculations with decimal coordinates
   - ✅ Separated BASE_TILE_SIZE and TILE_SIZE for correct scaling

2. **Player Marker Scaling** ✅ 100% COMPLETE
   - ✅ Other player markers scale with zoom level
   - ✅ Dynamic sizing for icon, nickname, and level text
   - ✅ Fixed transform positioning (translate -50%, -50%)

3. **Sync Status Indicator** ✅ 100% COMPLETE
   - ✅ Created SyncStatusIndicator component
   - ✅ Real-time sync status in GameHeader (💾 Saving, ✓ Saved, ⚠ Error)
   - ✅ Last save timestamp with relative time display (před 2m)
   - ✅ Integrated into useGameState hook
   - ✅ Status updates during save operations

**Implementation Files:**
- ✅ `src/components/WorldMapViewer.tsx` - Mobile map fixes
- ✅ `src/components/OtherPlayerMarker.tsx` - Scaling support
- ✅ `src/components/SyncStatusIndicator.tsx` - Sync status component
- ✅ `src/hooks/useGameState.ts` - Sync status tracking
- ✅ `src/components/ui/GameHeader.tsx` - Status display
- ✅ `src/components/GameLayout.tsx` - Props passing

---

**v0.7.3 - Global Weather, Time & Named Enemies (✅ COMPLETE - Nov 13, 2025):**

Real-time global world state and special enemy encounters.

1. **Global Weather & Time System** ✅ 100% COMPLETE
   - ✅ Global weather states (Clear, Rain, Storm, Snow, Fog)
   - ✅ Time of day system (Morning, Afternoon, Evening, Night)
   - ✅ Automatic updates every 15 minutes via Supabase cron job
   - ✅ Real-time subscriptions using useGlobalWorldState hook
   - ✅ Weather & Time Widget with countdown timers
   - ✅ Database table: global_world_state with RLS policies

2. **Named Enemy System** ✅ 100% COMPLETE
   - ✅ 4 Rare Spawn Bosses (3x stats): Ancient Golem, Frost Giant, Shadow Dragon, Phoenix
   - ✅ 8 Wandering Monsters (1.5x stats): Dire Wolf, Troll, Ogre, Harpy, Minotaur, Chimera, Demon, Lich
   - ✅ Spawn in groups of 1-3 enemies with higher drop rates
   - ✅ 24-hour respawn cooldown for rare bosses
   - ✅ 30-minute respawn for wandering monsters
   - ✅ Red glow effect for rare bosses, yellow for wandering monsters

3. **Quick Combat System** ✅ 100% COMPLETE
   - ✅ Fast worldmap encounters with auto/manual combat modes
   - ✅ Victory/Defeat modals with loot display
   - ✅ Enemy respawn tracking
   - ✅ Proper hero HP saving after defeat (10% HP)
   - ✅ Fixed hero XP/level synchronization after combat

4. **Enhanced UI Components** ✅ 100% COMPLETE
   - ✅ ModalText, ModalDivider, ModalInfoBox (4 variants)
   - ✅ ModalInfoRow for structured data display
   - ✅ ModalButton with 3 variants (primary, secondary, danger)
   - ✅ Color-coded glow effects (red=bosses, blue=towns/portals, yellow=content)

**Implementation Files:**
- ✅ `src/hooks/useGlobalWorldState.ts` - Real-time weather/time subscription
- ✅ `src/services/GlobalWorldStateService.ts` - Weather/time data management
- ✅ `src/engine/combat/NamedEnemies.ts` - Special boss and elite enemies
- ✅ `src/components/WeatherTimeWidget.tsx` - Live countdown widget
- ✅ `src/components/ui/ModalContent.tsx` - Enhanced modal components
- ✅ `supabase/migrations/20251113_add_global_world_state.sql` - Database migration
- ✅ `supabase/functions/update-global-world-state/` - Edge function for cron

See [GAME-LOOP-DESIGN.md](./GAME-LOOP-DESIGN.md) for complete v2.0 game design.

### Alternate Priority: v0.5.0 - Active Idle System

The dungeon system is now complete with all planned room types. The next major feature is implementing an **Active Idle System** that allows players to continuously farm dungeons automatically while the game is running. This includes:

1. **Auto-Farm Mode**
   - Continuous auto-battles without manual intervention
   - Configurable stop conditions (time limit, party deaths, inventory full)
   - Auto-loot collection with inventory management
   - Statistics tracking (battles fought, gold earned, items collected)

2. **AFK Rewards**
   - Bonus rewards for leaving game active
   - Time-based accumulation of resources
   - Daily login bonuses and streak system

3. **Boss-Specific Unique Items**
   - Legendary items that only drop from specific bosses
   - Boss-themed equipment with special effects
   - Collection system for unique boss loot

4. **Prestige Currency** (Optional - Future consideration)
   - Currency earned from deep dungeon runs
   - Permanent upgrades that persist across resets
   - Meta-progression system

## 📅 Version Planning (REVISED - v2.0 Game Loop)

### ✅ COMPLETED VERSIONS

**v0.2.0 - Combat Enhancement**
- ✅ Status effects, buffs/debuffs
- ✅ Combat balance
- ✅ Mobile UI polish

**v0.3.0 - Progression**
- ✅ Hero leveling with XP scaling
- ✅ Loot drops and rewards
- ✅ Enemy types (Normal/Elite/Boss)
- ✅ Inventory system

**v0.4.1 - Complete Dungeon System**
- ✅ Procedural generation (10 room types)
- ✅ Extended rooms (Shrine, Mystery, Elite, Mini-Boss)
- ✅ Floor progression and bosses
- ✅ Loot confirmation dialogs

**v0.6.0 - Worldmap Foundation**
- ✅ Perlin Noise terrain generation
- ✅ 50x50 map with biomes
- ✅ 4 towns, 5 dungeons
- ✅ Fog of war, canvas rendering

---

### 🔨 IN DEVELOPMENT

**v0.7.0 - Hero Collection & Gacha (2 weeks) - CURRENT**
- Party-based gameplay (4 heroes)
- Gacha summon system
- Hero collection UI
- Combat engine: 4v4 battles

**v0.8.0 - Energy System & Daily Reset (1 week)**
- Energy system (100/day + regen)
- Daily worldmap reset (new seed daily)
- Energy bar UI
- Daily leaderboards

**v0.9.0 - Town System (2 weeks)**
- 6 buildings (Tavern, Smithy, Healer, Market, Bank, Guild)
- Gacha UI in Tavern
- Equipment services (forge, enhance, repair)
- Resource economy

**v1.0.0 - Quest System & Story (3 weeks)**
- Main story campaign (5 chapters)
- Branching story choices
- Daily quests (3 per day)
- Hero-specific stories

**v1.1.0 - Leaderboards & Endgame (2 weeks)**
- Daily leaderboards (4 categories)
- World Boss events
- Endless Abyss infinite scaling
- Prestige system

**v1.2.0 - Multiplayer & Social (3 weeks) - FULL RELEASE**
- Real-time player positions (Supabase)
- Guild system with perks
- Guild wars (territory control)
- Global chat, guild chat

---

### 🎯 Timeline Summary

| Version | Features | Duration | Status |
|---------|----------|----------|--------|
| v0.7.0 | Hero Collection & Gacha | 2 weeks | NEXT |
| v0.8.0 | Energy & Daily Reset | 1 week | Planned |
| v0.9.0 | Town System | 2 weeks | Planned |
| v1.0.0 | Story & Quests | 3 weeks | Planned |
| v1.1.0 | Leaderboards | 2 weeks | Planned |
| v1.2.0 | Multiplayer | 3 weeks | Planned |

**Total to Full Release: 13 weeks**
**First Playable Demo (v0.8.0): 3 weeks**

---

**Last Updated:** 2025-11-16 (Documentation Overhaul + v0.7.3 Complete)
**Current Version:** v0.7.3 (Global Weather/Time + Named Enemies Complete)
**Next Version:** v0.8.0 (Daily Reset & Quest System - 0% Started)
**Overall Progress:** ~40% complete to v1.2.0 full release

### ✅ v0.6.1 UI Enhancements (2025-11-09)
- ✅ **Mouse Wheel Zoom** - Zoom in/out on worldmap using mouse wheel
- ✅ **Keyboard Shortcuts** - Navigate with W/H/I/T/L/Q/G keys
- ✅ **Bottom Bar Info** - Fixed "Denní Pořadí #250" → "Level {playerLevel}"
- ✅ **Bottom Bar Gold** - Fixed "TODO 15" → "{gold} Gold" with formatting
- ✅ **Code Compliance** - All changes follow coding_rules.md standards

### ✅ v0.7.0 Gacha System & Persistence (2025-11-08 Night)
- ✅ **Hero Collection System** - 60 unique heroes with rarities, roles, factions
- ✅ **Gacha Summon Mechanics** - 1x, 10x summons with gold cost
- ✅ **Pity System** - Guaranteed Epic after 100 summons
- ✅ **Daily Free Summon** - Resets at midnight with proper date tracking
- ✅ **Database Persistence** - Gacha state (pity, daily summon) syncs to Supabase
- ✅ **Daily Summon Bug Fix** - Fixed Ctrl+F5 reset issue with ISO date comparison
- ✅ **Party Manager** - Swap active party of 4 heroes
- ✅ **Hero Collection UI** - Filter by rarity, role, view stats
- ✅ **Tavern Integration** - Gacha UI in town building
- ✅ **SQL Migration** - Added gacha_summon_count, gacha_last_free_summon, gacha_pity_summons columns

### ✅ v0.6.2 Complete Integration (2025-11-08 Late Evening)
- ✅ **Dungeon Entry from Worldmap** - Click dungeon on map to enter with energy cost
- ✅ **Dungeon Loot Transfer** - Items and gold properly save to database after dungeon
- ✅ **Victory Screen** - Full loot display with collect all/sell all buttons
- ✅ **Defeat Handling** - Automatic exit to worldmap on party wipe
- ✅ **Enemy Scaling** - Relative difficulty based on hero level vs dungeon level
- ✅ **Item Persistence Fix** - Items properly reconstruct from database (stats, rarity, enchants)
- ✅ **Enchant Menu** - Right-click items to open enchant/sell modal
- ✅ **Item Selling** - Sell items for gold directly from enchant menu

### ✅ v0.6.1 Hotfix (2025-11-08 Evening)
- Fixed hero loading from empty database saves
- Added comprehensive debug logging to useGameState
- Starter heroes now create when save exists but is empty
- Improved error visibility with emoji-prefixed console logs

---

## 🚀 Major Game Design Shift (v2.0)

**From:** Single hero, persistent map, unlimited playtime
**To:** Party-based gacha, daily map reset, energy system

**Why This Change:**
- ✅ Higher engagement (daily login for free summon)
- ✅ Fair competition (daily leaderboards reset)
- ✅ Collection mindset (50+ heroes to collect)
- ✅ Balanced economy (energy limits whale advantage)
- ✅ Fresh content daily (new map every day)

**Complete design:** [GAME-LOOP-DESIGN.md](./GAME-LOOP-DESIGN.md)
