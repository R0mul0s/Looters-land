# Game Loop Design - Looters Land v2.0

**Author:** Roman Hlaváček - rhsoft.cz
**Status:** Design Proposal (Revised) - v0.6.2 Implementation Progress
**Last Updated:** 2025-11-08 (Late Evening)

---

## 🎯 Vision

**Looters Land** is a **Gacha-style party-based dungeon crawler** with **daily roguelike worldmap resets**, deep story progression, and competitive leaderboards. Players collect heroes through a gacha system, form parties of 4, explore procedurally generated daily maps, delve into dungeons, and compete for daily rankings while progressing through a branching story campaign.

---

## 🔄 Core Game Loop (REVISED)

### **Primary Daily Loop**

```
1. Daily Login (00:00 Reset)
   ↓
2. New Worldmap Generated (Fresh Daily Seed)
   ↓
3. Start with 100 Energy (+bonuses)
   ↓
4. Explore Worldmap
   │   ├─ Dungeons (10 energy/floor)
   │   └─ Encounters (5 energy/fight)
   ↓
5. Town Activities (No Energy Cost)
   │   ├─ Gacha Summon (1x free daily)
   │   ├─ Upgrade Equipment (smithy)
   │   ├─ Heal Party (healer)
   │   └─ Accept Quests (tavern)
   ↓
6. Combat & Rewards (XP, Gold, Items)
   ↓
7. Energy Depleted / Day End
   ↓
8. Collect Daily Rewards & Leaderboard Ranks
   ↓
9. Tomorrow: New Map, New Opportunities
```

---

## 🦸 Hero System - Gacha Collection

### **Party-Based Gameplay**

**Core Mechanic:**
- Player controls a **party of 4 heroes** (active in combat)
- Total collection: **50+ unique heroes** (sběratelství)
- Swap heroes before entering dungeons/encounters
- Each hero has unique skills, stats, and role

**Hero Roles:**
- **Tank**: High HP, DEF (Warrior, Paladin, Knight)
- **DPS**: High ATK, CRIT (Mage, Archer, Assassin)
- **Healer**: Support, HP restoration (Cleric, Druid, Shaman)
- **Support**: Buffs, debuffs, utility (Bard, Enchanter, Necromancer)

### **Gacha Summon System**

**Tavern Recruitment (Gold-based):**
- **1x Summon**: 1,000 gold
- **10x Summon**: 9,000 gold (10% discount)
- **Daily Free Summon**: 1x per day (resets at 00:00)

**Premium Summon (Premium Currency or Achievements):**
- Higher Legendary drop rate (5% vs 1%)
- Event-limited heroes
- Guaranteed Epic after 20 summons

**Rarity Distribution:**
| Rarity | Drop Rate | Power Level |
|--------|-----------|-------------|
| Common | 60% | Level 1-10 viable |
| Rare | 25% | Level 10-25 viable |
| Epic | 12% | Level 25-40 viable |
| Legendary | 3% | Endgame viable |

**Hero Synergies:**
- **Class Bonuses**: 2 Warriors = +10% HP, 2 Mages = +15% MP
- **Faction Bonuses**: 4 Kingdom heroes = +20% gold
- **Combo Skills**: Specific hero pairs unlock powerful combos

### **Hero Progression**

**Individual Hero Leveling:**
- Each hero levels independently (Level 1-50)
- XP gained from combat shared across party
- Stats increase per level: HP, ATK, DEF, SPD, CRIT
- Unlock new skills at levels 5, 10, 20, 30, 40

**Hero Ascension (Late Game):**
- Max Level 50 → Ascend to reset level, gain +5% all stats
- Requires duplicate hero + materials
- Max 5 ascensions per hero (+25% total stats)

**Hero Equipment:**
- Each hero has 6 equipment slots (existing system)
- Equipment can be swapped between heroes
- Shared inventory pool

---

## ⚡ Energy System

### **Daily Energy Allocation**

**Starting Energy:**
- Base: **100 energy** at daily reset (00:00)
- VIP Bonus: +20 energy
- Guild Perks: +10 energy
- Premium Pass: +30 energy
- **Maximum**: 160 energy/day with all bonuses

**Energy Costs:**
| Activity | Energy Cost | Rewards |
|----------|-------------|---------|
| Dungeon Floor | 10 energy | XP, Gold, Items, Boss loot |
| Worldmap Encounter | 5 energy | XP, Gold, Chance for items |
| Town Activities | 0 energy | Services, Gacha, Quests |

**Energy Regeneration:**
- Natural regen: **+1 energy every 6 minutes** (240 energy/day total)
- Energy cap: 100 (regen stops at cap)
- Overflow energy from bonuses doesn't decay

**Energy Refills:**
- Daily free refill: 1x (50 energy)
- Premium currency refills: 3x per day (50 energy each)
- Watch Ad refills: 5x per day (10 energy each)
- Guild donation rewards: Random energy potions

**Strategy:**
- **Efficient Players**: Maximize regen by staying below cap
- **Whales**: Buy refills for competitive edge (still capped at 3/day)
- **F2P Friendly**: Natural regen gives 240 energy vs 100 base = 2.4x value

---

## 🗺️ Daily Worldmap Reset (Roguelike Element)

### **Daily Map Generation**

**00:00 Daily Reset:**
- **New seed** generates completely new 50×50 worldmap
- **Towns** spawn at different locations (4 towns always present)
- **Dungeons** appear in new positions (5 dungeons)
- **Encounters** spawn fresh (15 enemy groups)

**What Persists:**
- Hero levels and equipment
- Gold and materials
- Story quest progress
- Town building upgrades
- Hero collection
- Achievement progress

**What Resets:**
- Worldmap layout (new seed)
- Fog of war (all tiles unexplored)
- Daily quests
- Leaderboards (new daily rankings)
- Energy (back to 100 + bonuses)

### **Competitive Daily Leaderboards**

**Leaderboard Categories:**
1. **Deepest Dungeon Floor** - Who reached the farthest floor today
2. **Most XP Earned** - Total XP gain across all heroes
3. **Gold Collected** - Total gold earned

**Daily Rewards (Top 100):**
- Rank 1: 1000 gems, 5x Legendary Summon Tickets, Exclusive Title
- Rank 2-10: 500 gems, 3x Epic Summon Tickets
- Rank 11-50: 250 gems, 1x Epic Summon Ticket
- Rank 51-100: 100 gems, Gold bonus

**Weekly Aggregate Leaderboard:**
- Sum of daily rankings across 7 days
- Bigger rewards (Legendary heroes, premium currency)

### **Advantages of Daily Reset**

✅ **Fresh Experience**: New map every day, never gets stale
✅ **Fair Competition**: Everyone starts daily leaderboards from scratch
✅ **FOMO Mitigation**: Missed a day? Tomorrow is a fresh start
✅ **Strategic Depth**: Optimal paths change daily
✅ **Gacha Synergy**: Better heroes = more efficient energy usage
✅ **F2P Friendly**: Skill and strategy matter more than just playtime

---

## 🏰 Town System - Detailed Activities

### **Town Buildings & Services**

Each town (Capital, Stronghold, Oasis, Outpost) has 6 buildings:

#### **1. Tavern (Quest Hub & Gacha)**

**Hero Recruitment (Gacha):**
- **1x Summon**: 1,000 gold → Random hero (60% Common, 25% Rare, 12% Epic, 3% Legendary)
- **10x Summon**: 9,000 gold → 10 heroes with guaranteed Rare or better
- **Daily Free Summon**: 1x per day (00:00 reset)
- **Premium Banner**: Premium currency only, higher Legendary rate (5%)

**Quest Board:**
- **Daily Quests** (3 per day):
  - "Kill 10 Enemies" → 500 gold, 100 gems
  - "Clear 5 Dungeon Floors" → 1,000 gold, 1x Epic Summon Ticket
- **Story Quests**: Main campaign progression (see Story section)
- **Weekly Quests**: Guild objectives, bigger rewards

**Rumors & Hints:**
- NPCs give hints about hidden content on today's map
- "I heard a Legendary boss spawned near the Desert Oasis today!"
- Players can share findings in global chat

#### **2. Smithy (Equipment Services)**

**Forge Equipment:**
- Craft items from materials (wood, stone, ore)
- Recipe unlocks from dungeon bosses
- Crafted items have deterministic stats (no RNG)

**Enhance Equipment:**
- **+1 to +5**: 100% success, moderate cost
- **+6 to +10**: Success rate decreases (80%, 60%, 40%, 20%, 10%)
- **Failure**: No item loss, just wasted materials
- Each enhancement: +5% base stats

**Repair Equipment:**
- Durability system: 100/100 → loses 1 per combat
- 0 durability = item breaks, stats go to 0
- Repair cost: 50 gold × item level × rarity multiplier

**Dismantle Items:**
- Break down unwanted equipment → materials
- Common = 10 materials, Rare = 50, Epic = 200, Legendary = 1000

**Socket System:**
- Epic+ items have 1-3 sockets
- Insert gems (STR, DEX, INT, VIT) for +10-50 stats
- Remove gem: 500 gold, gem is destroyed
- Gems drop from dungeon bosses

#### **3. Healer (Recovery & Resurrection)**

**Restore HP/MP:**
- Full party heal: 100 gold × average hero level
- Individual hero heal: 50 gold × hero level
- Instant, no energy cost

**Remove Debuffs:**
- Cleanse curses, poisons, etc.: 200 gold per hero
- Useful after Mystery Room bad outcomes

**Resurrect Dead Heroes:**
- If hero dies in dungeon: 500 gold × hero level
- Dead heroes can't be used until resurrected
- Free res once per day (first death)

#### **4. Market (Trading & Consumables)**

**Buy Items:**
- **Health Potions**: 50 gold (restore 50% HP to one hero)
- **Mana Potions**: 50 gold (restore 50% MP)
- **Revive Scrolls**: 500 gold (auto-resurrect on death, 1x use)
- **XP Potions**: 1,000 gold (+500 XP to one hero)
- **Energy Potions**: 2,000 gold (+50 energy, max 3/day from market)

**Sell Loot:**
- Convert items to gold (dynamic pricing based on rarity)
- Common = 50g, Rare = 200g, Epic = 1,000g, Legendary = 5,000g

**Trade Materials:**
- Material bundles for premium currency

**Black Market (Unlock at Town Level 3):**
- Rare items for premium currency
- Event-limited cosmetics
- Legendary hero shards (collect 100 → summon specific hero)

#### **5. Bank (Storage & Economy)**

**Gold Vault:**
- Store unlimited gold (safe from death penalties)
- Free deposits, no withdrawals needed
- Earns 1% interest daily (capped at 10,000g/day)

**Item Vault:**
- Store 100 items (expandable to 500 with upgrades)
- Store duplicate heroes
- Guild shared vault (50 slots, guild-wide access)

**Currency Exchange:**
- Convert gold ↔ premium currency (rate fluctuates daily)
- Premium currency can also be earned (achievements, leaderboards)

#### **6. Guild Hall (Social Hub)**

**Guild Features:**
- Create guild: 10,000 gold
- Join guild: Free
- Max 50 members

**Guild Perks (Research System):**
- **XP Boost**: +5/10/15/20% XP for all members (costs guild currency)
- **Gold Boost**: +5/10/15/20% gold
- **Energy Boost**: +5/10/15/20 max energy
- **Summon Discount**: -5/10/15/20% gacha costs

**Guild Bank:**
- Members donate gold/materials
- Officers distribute for guild wars
- Shared loot from guild bosses

**Guild Wars (Weekly Event):**
- Guild vs Guild battles
- Territory control on worldmap
- Winning guild gets bonuses for 1 week

**Guild Chat & Social:**
- Real-time chat
- Share map findings ("Legendary boss at X:25, Y:40!")
- Recruit members

---

## 📖 Quest System - Deep Branching Story

### **Main Story Campaign (15-20 Hours)**

The story unfolds **across multiple daily map resets** (persistent progress):

#### **Chapter 1: "The Awakening" (Tutorial)**

**Objectives:**
1. Complete first gacha summon (get starting heroes)
2. Form party of 4 heroes
3. Explore Capital and surrounding tiles
4. Enter first dungeon (Goblin Caves)
5. Clear Floor 1-3 of Goblin Caves

**Rewards:**
- 3x Common Heroes (guaranteed: Warrior, Mage, Cleric)
- 5,000 gold
- 10x Health Potions
- Unlock: Smithy, Healer, Market

**Story:**
- Player is a summoner awakening ancient heroes
- Tutorial NPC: "The world resets every dawn, but your heroes are eternal"
- Introduces daily map reset mechanic in-lore

---

#### **Chapter 2: "Fractured Kingdoms" (Exploration)**

**Objectives:**
1. Discover all 4 towns on worldmap (may take 2-3 days)
2. Talk to faction leaders in each town
3. Complete side quest for each faction
4. **CHOICE POINT**: Pledge allegiance to one faction

**Factions:**
- **Kingdom** (Capital): Lawful, balanced rewards
- **Mountain Dwarves** (Stronghold): Defensive buffs, smithing bonuses
- **Desert Nomads** (Oasis): Speed/Agility focus, trade bonuses
- **Forest Elves** (Outpost): Magic/Healing focus, nature affinity

**Branching:**
- Choice affects available quests, guild perks, and story ending
- Can change faction later (penalty: lose reputation, gold cost)

**Rewards:**
- Faction-specific Legendary hero (guaranteed summon)
- Unlock Guild Hall
- +50 max energy (permanent)

---

#### **Chapter 3: "The Depths Stir" (Dungeon Focus)**

**Objectives:**
1. Clear Forest Ruins (Medium Dungeon) to Floor 15
2. Defeat the "Awakened Treant" boss (Floor 15)
3. Investigate ancient prophecy (lore collectible)
4. Clear Mountain Depths (Hard Dungeon) to Floor 10

**Story:**
- Dungeons are portals to ancient evils
- Each dungeon boss drops lore fragments
- Collecting all fragments reveals true endgame threat

**Rewards:**
- Unlock Hard difficulty dungeons
- Epic equipment set (4 pieces)
- 10,000 gold
- 1,000 gems

---

#### **Chapter 4: "War of the Abyss" (World Bosses)**

**Objectives:**
1. Participate in first World Boss event
2. Deal 100,000+ damage to World Boss
3. Clear Ancient Temple (Hard Dungeon) to Floor 20
4. **CHOICE POINT**: Seal the Abyss or Harness its Power

**Branching Consequences:**
- **Seal**: Peaceful ending, unlock prestige system, +10% all stats
- **Harness**: Dark ending, unlock Endless Abyss, +20% damage but -10% HP

**Rewards:**
- Legendary equipment piece
- Unlock Endless Abyss dungeon
- Title: "Abyssal Victor" or "Sealer of Darkness"

---

#### **Chapter 5: "Endless Cycle" (Endgame Reveal)**

**Objectives:**
1. Reach Floor 50 of Endless Abyss
2. Discover the truth about daily resets (meta lore twist)
3. **Prestige for first time**
4. Reach Floor 100 of Endless Abyss (post-prestige)

**Story Twist:**
- The daily reset is a curse/blessing cycle
- Prestige = breaking free of one cycle, entering a higher one
- True ending requires 3+ prestiges + Floor 200 clear

**Rewards:**
- Mythic hero (unique, 1 per account)
- Prestige currency unlocked
- Infinite progression begins

---

### **Side Quests & Character Stories**

**Hero-Specific Stories:**
- Each Legendary hero has 3-chapter personal story
- Unlocks by leveling hero to 20, 30, 40
- Rewards: Hero-specific equipment, cosmetics, lore

**Daily Quests (Repeatable):**
- Kill X enemies: 500g, 100 gems
- Clear Y floors: 1,000g, Epic Summon Ticket
- Reset daily at 00:00

**Weekly Quests:**
- Guild objectives (contribute to guild goals)
- Leaderboard participation (rank in top 500)
- Prestige currency rewards

**Dynamic Events (Random, 2x per week):**
- "Bandit Raid!": Defend town, 10 waves, exclusive loot
- "Double XP Dungeon": Specific dungeon gives 2x XP for 24 hours

---

## 🎮 Detailed Gameplay Flow

### **New Player Experience (Day 1)**

**0:00 - Account Creation:**
1. Tutorial cutscene (2 minutes)
2. First gacha summon (guaranteed: Warrior, Mage, Cleric, Archer)
3. Form party of 4 from starting heroes
4. Name your party

**0:05 - First Exploration:**
5. Spawn at Capital on worldmap (100 energy)
6. Tutorial markers guide to Goblin Caves (Easy Dungeon)
7. Enter dungeon → Clear Floor 1 (Combat Room tutorial)
8. Collect first loot (Common equipment)
9. Level up to Level 2

**0:20 - Town Services:**
10. Return to Capital via Exit Room
11. Visit Healer (free tutorial heal)
12. Visit Smithy (equip new items)
13. Visit Tavern (accept first quest)

**0:30 - Free Roam:**
14. Explore worldmap (reveal fog of war)
15. Fight 2-3 encounters (15 energy)
16. Collect resource nodes (5 energy)
17. Clear 2 more dungeon floors (20 energy)

**End of Day 1:**
- Heroes at Level 3-5
- 2,000-5,000 gold earned
- 5-10 equipment pieces
- 40-60 energy remaining
- Tutorial complete

---

### **Mid-Game Session (Day 10, Level 20 Heroes)**

**Daily Routine (30-60 min):**

1. **Login** (0:00) → Collect daily rewards, new map generates
2. **Tavern** → Free daily summon (hope for Epic/Legendary!)
3. **Quest Check** → Accept 3 daily quests
4. **Worldmap Exploration** (20 min):
   - Explore 30-40 tiles (reveal fog)
   - Fight 5 encounters (25 energy)
   - Mark dungeon locations
5. **Dungeon Run** (30 min):
   - Enter Forest Ruins (Medium Dungeon)
   - Clear 5 floors (50 energy)
   - Boss fight on Floor 5 (guaranteed Epic item)
6. **Town Services**:
   - Sell unwanted loot (500-1,000g)
   - Enhance equipment (+5 → +6 attempt)
   - Heal party
7. **Energy Depletion** (5 energy left)
8. **Leaderboard Check** → Rank 250 (Deepest Floor: 15)

**Progression:**
- 3,000 XP earned (1 level up for 2 heroes)
- 8,000 gold earned
- 2 Epic items, 5 Rare items
- Daily quests: 2/3 complete
- Story progress: Chapter 2 (40%)

---

### **Endgame Session (Day 100, Level 40+ Heroes, Prestige 2)**

**Optimized Daily Grind (60-90 min):**

1. **Login** → 160 energy (all bonuses), new map
2. **Tavern** → Free summon (collecting hero #48/50)
3. **Guild Chat** → Coordinate World Boss spawn (16:00 today)
4. **Efficient Route Planning**:
   - Identify optimal dungeon (closest to Capital)
   - Plan encounter route
5. **Speed Clear**:
   - Endless Abyss Floors 80-95 (150 energy, 15 floors)
   - Auto-combat enabled (optimized team)
   - Collect 30+ items (mostly vendor trash)
   - Sell all non-Epic+ loot → 15,000g
6. **Enhancement Session**:
   - Attempt +9 → +10 on Legendary weapon (40% chance)
   - Success! Now +10 (+50% stats)
7. **World Boss Event** (16:00-16:30):
   - 50 players attacking
   - Deal 2.5M damage (Rank 5 contribution)
   - Rewards: Legendary equipment, 500 gems
8. **Leaderboard**:
   - Deepest Floor: 95 (Rank 12 → Rewards: 500 gems, 3x Epic Tickets)
   - Daily complete

**Progression:**
- Still farming for final 2 Legendary heroes
- Working toward Prestige 3
- Competing for top 10 weekly leaderboard
- Guild Wars preparation (Saturday event)

---

## 🏆 Endgame Content

### **Endless Abyss (Infinite Progression)**

**Mechanics:**
- 999 floors (functionally infinite)
- Difficulty: +5% enemy stats per floor (exponential scaling)
- Boss every 10 floors (guaranteed loot)
- Checkpoint every 10 floors (can resume next day)
- Energy cost: 10 per floor (same as other dungeons)

**Leaderboard:**
- Daily: Deepest floor reached today
- All-time: Deepest floor ever reached
- Prestige ranking (separate ladder per prestige level)

**Exclusive Rewards:**
- Floor 50+: Epic items guaranteed
- Floor 100+: Legendary items guaranteed
- Floor 150+: Mythic items (1% drop)
- Floor 200+: Prestige currency (10 per floor)

**Strategy:**
- Energy efficiency: Can clear ~15 floors/day with 150 energy
- Requires perfect team composition and +10 gear
- Prestige bonuses make earlier floors trivial

---

### **World Bosses (Weekly Events)**

**Schedule:**
- 2x per week (Wednesday 18:00, Sunday 12:00)
- Announced 24 hours in advance in-game
- Spawns at random worldmap location (revealed to all)

**Mechanics:**
- Open raid: 10-100 players can participate
- 30-minute time limit
- Contribution-based rewards (damage + healing)
- Boss HP: Scales with server population

**Rewards:**
| Rank | Reward |
|------|--------|
| Top 1 | 5x Legendary Summon Tickets, Mythic Equipment, 2,000 gems |
| Top 10 | 3x Legendary Tickets, Legendary Equipment, 1,000 gems |
| Top 50 | 1x Legendary Ticket, Epic Equipment, 500 gems |
| Participation | 100 gems, Gold bonus |

---

### **PvP Arena (Optional Competitive Mode)**

**Modes:**
- **Ranked**: Climb ladder (Bronze → Diamond)
- **Casual**: Practice, no rank change
- **Daily Tournament**: Single elimination, big rewards

**Mechanics:**
- Async PvP: Fight against other players' saved teams (AI-controlled)
- Best of 3 battles
- Ban phase: Each player bans 1 hero from opponent's collection

**Rewards:**
- Weekly rank rewards (gems, summon tickets)
- Exclusive PvP cosmetics (hero skins, titles)

---

### **Guild Wars (Territory Control)**

**Weekly Event (Saturday 20:00-21:00):**
- Guilds compete for 10 worldmap territories
- Each territory grants bonuses for 1 week:
  - +5% XP for guild members
  - Guild bank daily bonus

**Mechanics:**
- 50v50 guild battles (async, attack enemy defenses)
- Point-based scoring
- Winning guild claims territory

---

### **Prestige System (Infinite Meta-Progression)**

**How It Works:**
1. Reach Hero Level 50 (any hero in party)
2. Option to **Prestige** unlocks
3. Prestige resets:
   - All hero levels → 1
   - Equipment → removed (items kept in inventory)
   - Worldmap → fresh map (normal daily reset)
4. Prestige rewards:
   - **+5% all stats** (permanent, stacks infinitely)
   - **1 Prestige Point** per prestige
   - **Prestige-only heroes** (unlock at P3, P5, P10)
   - **Prestige cosmetics** (glowing hero portraits)

**Prestige Leaderboard:**
- Separate ladder for Prestige 1, 2, 3, 4, 5+
- Bragging rights for highest prestige level

**Endgame Grind:**
- Prestige 10 players have +50% all stats (godlike power)
- Can clear Endless Abyss Floor 500+
- Still competing for daily leaderboards

---

## 📱 UI/UX Flow (Complete Redesign)

### **Main Screen - Worldmap Hub**

```
┌──────────────────────────────────────────────────────┐
│  [Player Name]  [Gold: 12,345]  [Gems: 567]  [⚙️]   │
│  Energy: ████████░░ 85/100 (+10/hour)               │
├──────────────────────────────────────────────────────┤
│                                                      │
│               🗺️ WORLDMAP CANVAS                    │
│                  (800x600 viewport)                  │
│                                                      │
│   🏰 Capital    🕳️ Goblin Caves    ⚔️ Encounter     │
│   💎 Gold Node  🧙 Player          🛤️ Road          │
│                                                      │
│   Fog of War: ▓▓▓▓ (unexplored)                     │
│                                                      │
├──────────────────────────────────────────────────────┤
│  [🎒 Inventory] [🦸 Heroes] [📜 Quests] [👥 Guild]   │
│  Daily: Deepest Floor: 15 (Rank #250)  [Rewards]   │
└──────────────────────────────────────────────────────┘
```

---

### **Heroes Screen (New!)**

```
┌──────────────────────────────────────────────────────┐
│  🦸 HERO COLLECTION                    [Gacha Summon]│
├──────────────────────────────────────────────────────┤
│  Active Party (4/4):                                 │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐           │
│  │ ⚔️ Lvl30│ │ 🏹 Lvl28│ │ 🔮 Lvl30│ │ 💚 Lvl25│           │
│  │Warrior│ │Archer │ │ Mage  │ │Cleric │           │
│  │  HP:800│ │ HP:500│ │ HP:400│ │ HP:600│           │
│  │[Equip]│ │[Equip]│ │[Equip]│ │[Equip]│           │
│  └───────┘ └───────┘ └───────┘ └───────┘           │
│                                                      │
│  Collection (25/50 Heroes):                          │
│  Filter: [All] [Tank] [DPS] [Healer] [Support]      │
│                                                      │
│  ⭐⭐⭐⭐ Legendary (2):                                 │
│  [👑 Arthur Lvl35] [🗡️ Excalibur Lvl30]              │
│                                                      │
│  ⭐⭐⭐ Epic (5):                                       │
│  [🛡️ Aegis Lvl28] [🔥 Ignis Lvl25] [❄️ Frost Lvl22]  │
│  [⚡ Bolt Lvl20] [🌿 Sylvan Lvl18]                    │
│                                                      │
│  ⭐⭐ Rare (10): [Collapsed, click to expand]         │
│  ⭐ Common (8): [Collapsed]                          │
│                                                      │
│  [Swap Party] [Ascend Hero] [View Skills]           │
└──────────────────────────────────────────────────────┘
```

---

### **Gacha Summon Screen**

```
┌──────────────────────────────────────────────────────┐
│  🎰 TAVERN RECRUITMENT                               │
├──────────────────────────────────────────────────────┤
│  Daily Free Summon: ✅ Available (Resets in 8h)      │
│                                                      │
│  ┌─────────────────┐  ┌─────────────────┐           │
│  │   1x SUMMON     │  │   10x SUMMON    │           │
│  │                 │  │                 │           │
│  │   1,000 Gold    │  │   9,000 Gold    │           │
│  │                 │  │  (10% Discount) │           │
│  │   [SUMMON]      │  │   [SUMMON x10]  │           │
│  └─────────────────┘  └─────────────────┘           │
│                                                      │
│  Drop Rates:                                         │
│  ⭐ Common: 60%  |  ⭐⭐ Rare: 25%                      │
│  ⭐⭐⭐ Epic: 12%  |  ⭐⭐⭐⭐ Legendary: 3%                │
│                                                      │
│  Pity System: 47/100 summons (Guaranteed Epic)      │
│                                                      │
│  [Premium Banner] (Gems) - 5% Legendary Rate!       │
└──────────────────────────────────────────────────────┘
```

---

### **Town View (Clicking Town on Map)**

```
┌──────────────────────────────────────────────────────┐
│  🏰 CAPITAL - Level 3 Town                           │
├──────────────────────────────────────────────────────┤
│  Buildings:                                          │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │🍺 Tavern │ │⚒️ Smithy  │ │💚 Healer │             │
│  │Quests &  │ │Forge &   │ │HP/MP &   │             │
│  │Gacha     │ │Enhance   │ │Resurrect │             │
│  │ [ENTER]  │ │ [ENTER]  │ │ [ENTER]  │             │
│  └──────────┘ └──────────┘ └──────────┘             │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │🛒 Market │ │🏦 Bank   │ │🛡️ Guild  │             │
│  │Buy/Sell  │ │Storage & │ │Social &  │             │
│  │Items     │ │Vault     │ │Wars      │             │
│  │ [ENTER]  │ │ [ENTER]  │ │ [ENTER]  │             │
│  └──────────┘ └──────────┘ └──────────┘             │
│                                                      │
│  [🗺️ Leave Town] ← Back to worldmap                 │
└──────────────────────────────────────────────────────┘
```

---

### **Daily Leaderboard Screen**

```
┌──────────────────────────────────────────────────────┐
│  🏆 DAILY LEADERBOARD - November 8, 2025             │
├──────────────────────────────────────────────────────┤
│  Resets in: 08:42:15                                │
│                                                      │
│  Category: [Deepest Floor] [Most XP] [Gold]            │
│                                                      │
│  Deepest Dungeon Floor:                              │
│  Rank  Player         Floor    Reward               │
│  #1    DragonSlayer   127      1000💎 5🎟️ 👑          │
│  #2    MageKing        118      500💎  3🎟️            │
│  #3    WarriorQueen    115      500💎  3🎟️            │
│  ...                                                 │
│  #250  [YOU]            15      -                    │
│  ...                                                 │
│  #1000 Newbie           3       -                    │
│                                                      │
│  Your Best Today: Floor 15 (85 energy spent)        │
│  Potential: Rank #150 if you reach Floor 25         │
│                                                      │
│  [View Weekly] [View All-Time] [My History]         │
└──────────────────────────────────────────────────────┘
```

---

## 🛠️ Technical Implementation Plan (Revised)

### **Phase 1: Hero Collection & Gacha (v0.7.0)** - 2 weeks

**Goal:** Party-based system with gacha summons

**Tasks:**
1. Create hero collection types
   - `Hero` interface (id, name, class, level, stats, skills, rarity)
   - `HeroCollection` state management
   - `ActiveParty` (4 heroes)
2. Implement gacha summon system
   - Summon logic with rarity distribution
   - Pity system (guaranteed Epic after 100 summons)
   - Daily free summon tracking
3. Heroes UI
   - Hero collection grid
   - Active party selector
   - Gacha summon screen with animations
4. Integrate with existing combat
   - Replace single hero with party of 4
   - Combat engine supports 4v4 battles
   - XP distribution across party

**Files to Create:**
- `src/types/hero.types.ts`
- `src/engine/GachaSystem.ts`
- `src/components/heroes/HeroCollection.tsx`
- `src/components/heroes/GachaSummon.tsx`
- `src/components/heroes/PartyManager.tsx`

**Files to Modify:**
- `src/engine/CombatEngine.ts` - Party support
- `src/App.tsx` - Hero collection state

---

### **Phase 2: Energy System & Daily Reset (v0.8.0)** - 1 week

**Goal:** Daily worldmap reset with energy limits

**Tasks:**
1. Energy system implementation
   - Energy state (current, max, regen rate)
   - Energy costs for activities
   - Refill system (free, premium, ads)
2. Daily reset logic
   - Generate new worldmap seed at 00:00
   - Reset energy to 100 + bonuses
   - Clear fog of war
   - Persist hero levels, gold, equipment
3. Daily reset UI
   - Energy bar on main screen
   - "New Day" notification
   - Reset countdown timer

**Files to Create:**
- `src/engine/EnergySystem.ts`
- `src/engine/DailyResetManager.ts`
- `src/components/ui/EnergyBar.tsx`

**Files to Modify:**
- `src/engine/worldmap/WorldMapGenerator.ts` - Seed rotation
- `src/App.tsx` - Daily reset integration

---

### **Phase 3: Town System & Services (v0.9.0)** - 2 weeks

**Goal:** Full town functionality with all 6 buildings

**Tasks:**
1. Town UI framework
   - TownView component (building grid)
   - Transition from worldmap → town → building
2. Implement each building:
   - Tavern: Gacha + Quest board
   - Smithy: Forge, Enhance, Repair, Dismantle
   - Healer: Heal, Resurrect, Remove debuffs
   - Market: Buy, Sell, Trade
   - Bank: Vault, Interest, Currency exchange
   - Guild Hall: Create, Join, Perks, Chat
3. Building upgrade system
   - Town level progression
   - Unlock new services at higher levels

**Files to Create:**
- `src/components/town/TownView.tsx`
- `src/components/town/Tavern.tsx`
- `src/components/town/Smithy.tsx`
- `src/components/town/Healer.tsx`
- `src/components/town/Market.tsx`
- `src/components/town/Bank.tsx`
- `src/components/town/GuildHall.tsx`
- `src/types/town.types.ts`

---

### **Phase 4: Quest System & Story (v1.0.0)** - 3 weeks

**Goal:** Main story campaign with branching choices

**Tasks:**
1. Quest framework
   - Quest types (Main, Daily, Weekly, Hero)
   - Quest tracking (objectives, progress)
   - Quest rewards
2. Story implementation
   - Chapter 1-5 main quests
   - Branching choice system
   - Faction allegiance mechanics
3. Daily quest rotation
   - 3 random daily quests per day
   - Reset at 00:00
4. Character story quests
   - Legendary hero personal stories
   - Unlock conditions

**Files to Create:**
- `src/types/quest.types.ts`
- `src/engine/QuestManager.ts`
- `src/engine/StoryManager.ts`
- `src/components/quest/QuestLog.tsx`
- `src/components/quest/StoryDialog.tsx`
- `src/data/quests/` (quest definitions)

---

### **Phase 5: Leaderboards & Endgame (v1.1.0)** - 2 weeks

**Goal:** Competitive features and infinite progression

**Tasks:**
1. Daily leaderboard system
   - Track: Deepest Floor, XP, Gold
   - Reset at 00:00
   - Reward distribution
2. World Boss events
   - Boss spawning system
   - Multi-player damage tracking
   - Contribution rewards
3. Endless Abyss enhancements
   - Infinite scaling
   - Checkpoints
   - Mythic loot drops
4. Prestige system
   - Prestige logic (+5% stats per prestige)
   - Prestige UI
   - Prestige leaderboard

**Files to Create:**
- `src/engine/LeaderboardManager.ts`
- `src/engine/WorldBossManager.ts`
- `src/engine/PrestigeSystem.ts`
- `src/components/leaderboard/DailyLeaderboard.tsx`
- `src/components/endgame/PrestigeView.tsx`

---

### **Phase 6: Multiplayer & Social (v1.2.0)** - 3 weeks

**Goal:** Real-time social features

**Tasks:**
1. Supabase integration
   - `players` table (hero collection, progress)
   - `worldmap_positions` table (real-time positions)
   - `guilds` table
   - `leaderboards` table
2. Real-time player visibility
   - Show other players on worldmap
   - Update positions every 1 second
3. Guild system
   - Create/join guilds
   - Guild perks research
   - Guild wars
4. Chat system
   - Global chat
   - Guild chat
   - Whisper

**Files to Create:**
- `src/lib/supabase/players.ts`
- `src/lib/supabase/guilds.ts`
- `src/lib/supabase/leaderboards.ts`
- `src/components/social/Chat.tsx`
- `src/components/social/GuildManager.tsx`

---

## 🎨 Monetization (Ethical F2P - Revised)

### **Free-to-Play Core:**

✅ **100% of gameplay free**
- All heroes obtainable with gold (gacha)
- All dungeons accessible
- All story content free
- No energy paywalls (natural regen gives 240/day)

### **Premium Currency (Gems):**

**Earning Gems (F2P Methods):**
- Daily quests: 150 gems/day
- Weekly quests: 500 gems/week
- Leaderboard rewards: 100-1000 gems/day
- Achievements: 5,000+ gems total
- **Total F2P gems/month**: ~8,000 gems

**Spending Gems:**
- Energy refills: 100 gems = 50 energy (max 3/day)
- Premium gacha: 300 gems = 1 summon (5% Legendary rate)
- Hero slots: 500 gems = +10 collection slots
- Cosmetics: 1,000-5,000 gems

### **Premium Battle Pass ($10/month):**

**Free Track:**
- Gold, XP potions, common materials

**Premium Track:**
- +30 max energy (permanent for season)
- Exclusive Legendary hero
- 3,000 gems
- Cosmetics (hero skins, titles)

**NO PAY-TO-WIN:**
- Premium heroes = same stats as F2P heroes
- Energy refills capped (whales can't buy infinite energy)
- Cosmetics only advantages

---

## 📊 Success Metrics (Revised)

### **Engagement Targets:**

- **Daily Active Users**: 10,000+
- **Average session length**: 45 minutes
- **Login streak**: 60% players login 5+ days/week
- **Daily energy usage**: 70% of players use 80+ energy/day

### **Retention:**

- **Day 1**: 60%
- **Day 7**: 35%
- **Day 30**: 15%

### **Monetization:**

- **Conversion rate**: 8% (gacha games industry standard)
- **ARPPU**: $25/month
- **Battle Pass purchase**: 25%

### **Social:**

- **Guild participation**: 70%
- **Chat activity**: 50% send 1+ message/day
- **Leaderboard participation**: 80% compete for top 500

---

## 🎯 Summary - Revised Game Loop

### **What Changed from v1.0:**

1. ✅ **Single Hero** → **Party of 4 Heroes** (Gacha collection)
2. ✅ **Persistent Map** → **Daily Worldmap Reset** (Roguelike)
3. ✅ **Unlimited Playtime** → **Energy System** (100/day + regen)
4. ✅ **Basic Quests** → **Deep Branching Story** (15-20 hour campaign)
5. ✅ **Simple Town** → **6-Building Town System** (Detailed services)
6. ✅ **No Competition** → **Daily Leaderboards** (4 categories)

### **Why This Design Excels:**

✅ **Gacha = High Engagement**: Collection mindset drives daily logins
✅ **Daily Reset = Fresh Content**: Never stale, always new map
✅ **Energy = Balanced Economy**: F2P friendly, limits whale advantage
✅ **Story = Retention**: Players invested in campaign
✅ **Leaderboards = Competition**: Skill-based daily rankings
✅ **Social = Virality**: Guilds, chat, sharing map findings

### **Core Pillars (Validated):**

- ✅ **Collection** (Gacha heroes)
- ✅ **Strategy** (Party composition, energy management)
- ✅ **Exploration** (Daily maps, fog of war)
- ✅ **Progression** (Levels, equipment, story, prestige)
- ✅ **Competition** (Leaderboards, guild wars)
- ✅ **Social** (Guilds, chat, multiplayer visibility)

---

## 🎯 Current Implementation Status (2025-11-08)

**v0.6.2 - Worldmap + Dungeon Integration Complete ✅**

### What's Working Now:
- ✅ Worldmap exploration (50×50 procedural map)
- ✅ Dungeon entry from worldmap (click to enter)
- ✅ Complete dungeon loop (enter → clear → loot → exit)
- ✅ Victory screen with loot display
- ✅ Defeat handling (party wipe returns to worldmap)
- ✅ Enemy scaling based on relative difficulty
- ✅ Item persistence (database save/load working)
- ✅ Enchant/sell system (right-click items)
- ✅ Full combat system with skills and status effects

### Next Steps:
**Phase 1 (v0.7.0): Hero Collection & Gacha** - 2 weeks
- Implement gacha summon system
- Create party of 4 heroes
- Build hero collection UI

**Estimated Timeline to Full Release:**
- Phase 1 (Gacha): 2 weeks
- Phase 2 (Energy): 1 week
- Phase 3 (Towns): 2 weeks
- Phase 4 (Story): 3 weeks
- Phase 5 (Leaderboards): 2 weeks
- Phase 6 (Multiplayer): 3 weeks

**Total: 13 weeks to v1.2.0 (Full Multiplayer Release)**

**Current progress: ~25% of full game design implemented** ✅
