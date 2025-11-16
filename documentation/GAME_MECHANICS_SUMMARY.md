# Looters Land - Game Mechanics Summary

**Last Updated:** 2025-11-16
**Current Version:** v0.7.3
**Game Type:** Gacha-style Idle RPG with Daily Roguelike Worldmap Resets

---

## 🎮 Core Game Loop (30-60 min daily session)

```
1. Daily Login (00:00 UTC Reset - PLANNED)
   ↓
2. New Worldmap Generated (Fresh Daily Seed - PLANNED)
   ↓
3. Energy Restored (240 max with +10/hour regen) ✅
   ↓
4. Town Activities (No Energy Cost)
   - Free Daily Gacha Summon ✅
   - Accept Daily Quests (PLANNED)
   - Upgrade Equipment (Smithy) ✅
   - Heal Party (Healer - PLANNED)
   ↓
5. Worldmap Exploration (Energy-Based)
   - Reveal Fog of War (2-tile radius) ✅
   - Fight Wandering Monsters (5 energy each) ✅
   - Discover Dungeons/Towns/Portals ✅
   - Collect Treasure Chests ✅
   ↓
6. Dungeon Runs (10 energy per floor)
   - Clear 5-10 floors per session ✅
   - Boss fights every 5 floors ✅
   - Collect loot and XP ✅
   ↓
7. Inventory Management
   - Equip better items ✅
   - Sell unwanted loot ✅
   - Enchant equipment (+1 to +10) ✅
   ↓
8. Energy Depletion / Session End
   ↓
9. Check Leaderboards (4 categories) ✅
   - Deepest Floor
   - Total Gold
   - Heroes Collected
   - Combat Power
   ↓
10. Logout (Auto-save triggered) ✅
   ↓
11. Tomorrow: New Map, New Opportunities (PLANNED)
```

---

## 🦸 Hero System (✅ COMPLETE - v0.7.0)

### Hero Collection & Gacha
- **60+ Unique Heroes** across 5 classes (Warrior, Archer, Mage, Cleric, Paladin)
- **Party of 4** active heroes for combat
- **Gacha Summons:**
  - 1x Summon: 1,000 gold
  - 10x Summon: 9,000 gold (10% discount)
  - Daily Free Summon (resets at 00:00 UTC)
- **Rarity Distribution:**
  - Common: 60% (Level 1-10 viable)
  - Rare: 25% (Level 10-25 viable)
  - Epic: 12% (Level 25-40 viable)
  - Legendary: 3% (Endgame viable, 2x stats)
- **Pity System:** Guaranteed Epic after 100 summons without Epic+

### Hero Progression
- **Leveling:** 1-100 (XP shared across active party)
- **Stat Growth per Level:** +10 HP, +2 ATK, +1 DEF, +1 SPD, +0.5 CRIT
- **XP Formula:** 50 × avg enemy level × enemy count
- **Required XP:** 100 × (level ^ 1.5)
- **Talent System Phase 1:**
  - Duplicate heroes merge automatically
  - +1 talent point per duplicate (max 6 per hero)
  - +5% all stats per talent point
  - ⭐ badges on hero cards
  - Database persistence

### Hero Classes & Skills
| Class | Role | HP | ATK | DEF | SPD | CRIT | Skills |
|-------|------|-----|-----|-----|-----|------|--------|
| **Warrior** | Tank | 150 | 15 | 12 | 5 | 5% | Heavy Slash, Shield Bash (Stun), Battle Cry (+30% ATK) |
| **Archer** | DPS | 80 | 20 | 5 | 12 | 10% | Power Shot, Multi-Shot, Evasion (+50% SPD) |
| **Mage** | Magic DPS | 90 | 22 | 4 | 8 | 7% | Fireball, Frost Nova (AOE), Mana Shield (-40% dmg) |
| **Cleric** | Healer | 100 | 8 | 8 | 7 | 5% | Heal (50 HP), Group Heal (30 HP all), Blessing (+40% DEF) |
| **Paladin** | Hybrid | 120 | 12 | 10 | 6 | 6% | Righteous Strike (dmg+heal), Holy Strike, Divine Shield (Immunity) |

---

## ⚔️ Combat System (✅ COMPLETE - v0.2.0)

### Turn-Based 4v4 Battles
- **Initiative:** SPD + random(0-10) determines turn order
- **Combat Modes:**
  - Manual: Player selects skills and targets
  - Auto: AI makes decisions automatically
- **Combat Actions:**
  - 3 active skills per hero class + basic attack
  - Target validation (damage → enemies, heal → allies)
  - Cooldown system (2-6 turns per skill)

### Status Effects
- **Buffs:** ATK Boost (+30%), DEF Boost (+40%), SPD Boost (+50%), Damage Reduction (-40%), Immunity
- **Debuffs:** Stun (skip turn), ATK Reduction, DEF Reduction, Poison, Curse
- **Duration:** 1-3 turns, decrements each turn
- **Visual Indicators:** Tooltips on character cards

### Damage Calculation
```typescript
baseDamage = (attacker.ATK × skill multiplier) - target.DEF
actualDamage = Math.max(baseDamage, MIN_DAMAGE) // Min 1 damage

// Apply buffs/debuffs
if (target.hasEffect('Mana Shield')) actualDamage *= 0.6
if (attacker.hasEffect('ATK Boost')) actualDamage *= 1.3

// Critical Hit
if (Math.random() * 100 < attacker.CRIT) {
  actualDamage *= CRIT_DAMAGE_MULTIPLIER // 1.5x
  isCrit = true
}
```

### Enemy Types
| Type | HP Mult | ATK Mult | DEF Mult | Drop Chance | Appearance |
|------|---------|----------|----------|-------------|------------|
| **Normal** | 1.0x | 1.0x | 1.0x | 30% | Standard sprites |
| **Elite** 💪 | 1.5x | 1.3x | 1.2x | 50% | Yellow glow |
| **Boss** 👑 | 3.0x | 1.5x | 1.3x | 100% | Red glow, very large |

---

## 🏰 Dungeon System (✅ COMPLETE - v0.4.1)

### Procedural Generation
- **Seed-based:** Random room layouts per dungeon instance
- **Floor Progression:** +10% enemy stats per floor
- **Checkpoints:** Exit and resume from last floor
- **Max Floors:** Easy: 10, Medium: 50, Hard: 100, Endless: 999

### Room Types (10 Total)
1. **Start Room** - Dungeon entry point
2. **Combat Room (40%)** - 2-5 enemies, standard loot
3. **Elite Room (5%)** - 1-2 elite enemies, better rewards
4. **Mini-Boss Room** - Mid-tier boss encounter
5. **Boss Room (Every 5 floors)** - Major boss, guaranteed epic loot
6. **Treasure Room (15%)** - Guaranteed chest with rare loot
7. **Trap Room (10%)** - Damage heroes, can be disarmed (future)
8. **Rest Room (15%)** - Heal 10% HP, one-time use
9. **Shrine Room** - Buffs (+10% dmg, +15% XP, +20% gold, +1 stats)
10. **Mystery Room** - Random events with risk/reward choices
11. **Exit Room** - Leave dungeon

### Dungeon Actions
- Room navigation (click adjacent rooms)
- Combat encounters
- Loot collection
- Shrine buffs
- Mystery event choices
- Boss battles (every 5 floors)
- Exit dungeon (keep loot/XP)

---

## 🗺️ Worldmap System (✅ COMPLETE - v0.6.0)

### Procedural 50x50 Map Generation
- **Perlin Noise** terrain generation (7 biomes)
- **Daily Seed System** (resets daily - PLANNED)
- **Fog of War:** 2-tile reveal radius around player
- **Terrain-based Energy Costs:**
  - Plains: 100 energy per tile
  - Forest: 150 energy per tile
  - Mountains: 250 energy per tile

### Static Objects (Always Present)
- **4 Towns:** Capital, Stronghold, Oasis, Outpost
- **5 Dungeons:** Easy, Medium, Hard, Nightmare difficulties
- **6 Portals:** Fast travel (20 energy cost)
- **8 Treasure Chests:** 500-5,000 gold
- **3 Hidden Paths:** Secret areas with epic/legendary loot

### Dynamic Objects (Respawn System)
- **4 Rare Spawn Bosses** (24-hour cooldown):
  - Ancient Golem (Desert) - Earth legendary items
  - Frost Giant (Snow) - Ice legendary items
  - Shadow Dragon (Mountains) - Shadow legendary items
  - Phoenix (Volcano) - Fire legendary items
- **10 Wandering Monsters** (30-min respawn):
  - Dire Wolf, Troll, Ogre, Harpy, Minotaur, Chimera, Demon, Lich

### Global Systems
- **Weather System:** Clear, Rain, Storm, Snow, Fog (15-min cycles)
- **Time of Day:** Morning, Afternoon, Evening, Night (15-min cycles)
- **Real-Time Updates:** Supabase Edge Function cron job

### Multiplayer Visibility
- See other players' positions and avatars in real-time
- Global chat system
- Online/offline status (gray overlay if offline >5 min)
- 5 avatar choices: Knight, Ranger, Mage, Shieldbearer, Bard

---

## ⚡ Energy System (✅ COMPLETE - v0.8.0)

### Energy Mechanics
- **Max Capacity:** 240 energy (base: 100 + bonuses)
- **Regeneration:** +10 energy/hour (1 every 6 minutes)
- **Continues Offline:** Natural regen persists while logged out

### Energy Costs
| Activity | Energy Cost |
|----------|-------------|
| Dungeon Floor | 10 energy |
| Worldmap Encounter | 5 energy |
| Teleport (Portal) | 20 energy |
| Movement | Terrain-dependent (100-250) |
| Town Activities | 0 energy (free) |

### Energy Refills (PLANNED)
- Daily free refill: +50 energy (1×/day)
- Premium currency: 100 gems = +50 energy (max 3/day)
- Market potions: 2,000g = +50 energy (max 3/day stock)
- Watch ads: +10 energy (5×/day) (future)

---

## 🏙️ Town System (70% COMPLETE)

### 6 Buildings per Town

#### 1. Tavern (✅ 100% - Gacha Hub)
- **Hero Recruitment (Gacha):**
  - 1x Summon: 1,000g
  - 10x Summon: 9,000g
  - Daily Free Summon
- **Quest Board (PLANNED):**
  - Daily quests (3/day)
  - Story quests
  - Weekly quests

#### 2. Smithy (✅ 100% - Equipment Services)
- **Enhance Equipment:** +1 to +10 enchanting
  - Success rates: 100% (0→1) down to 20% (9→10)
  - Cost: 100g × 1.5^level
  - +10% stats per enchant level
- **Forge (PLANNED):** Craft items from materials
- **Repair (PLANNED):** Fix durability
- **Dismantle (PLANNED):** Break down for materials

#### 3. Healer (📋 PLANNED)
- Restore HP/MP: 100g × avg hero level
- Remove Debuffs: 200g per hero
- Resurrect Dead Heroes: 500g × hero level

#### 4. Market (📋 PLANNED)
- Buy Items: Potions, materials, consumables
- Sell Loot: 50% of item value
- Daily Shop Rotation: 6 random items/day
- Black Market (Town Level 3): Rare items, legendary shards

#### 5. Bank (📋 PLANNED)
- Gold Vault: 1% daily interest (max 10,000g/day)
- Item Vault: Store 100 items (expandable to 500)
- Currency Exchange: Gold ↔ Gems

#### 6. Guild Hall (📋 PLANNED)
- Create/Join Guild: Max 50 members
- Guild Perks: XP/gold/energy boosts
- Guild Bank: Donate resources
- Guild Wars: Weekly events (Saturday)
- Guild Chat: Real-time communication

---

## 🎒 Equipment & Inventory (✅ COMPLETE)

### Equipment Slots (6 per hero)
1. **Helmet** ⛑️ - HP, DEF
2. **Chest** 🛡️ - HP, DEF
3. **Legs** 👖 - HP, DEF
4. **Boots** 👢 - SPD
5. **Weapon** ⚔️ - ATK, CRIT
6. **Accessory** 💍 - All stats

### Item Rarities & Stats
| Rarity | Drop Rate | Stat Multiplier | Visual |
|--------|-----------|-----------------|--------|
| Common | 60% | 1.0x | Gray border |
| Uncommon | 30% | 1.2x | Green border |
| Rare | 15% | 1.5x | Blue border |
| Epic | 4% | 2.0x | Purple border |
| Legendary | 1% | 3.0x | Orange border |
| Mythic (Future) | - | 5.0x | Red border |

### Enchanting System
- **Enchant Levels:** +1 to +10
- **Stat Bonus:** +10% per level (max +100% at +10)
- **Success Rates:**
  - +0→+1: 100%
  - +1→+2: 95%
  - +2→+3: 90%
  - +3→+4: 80%
  - +4→+5: 70%
  - +5→+6: 60%
  - +6→+7: 50%
  - +7→+8: 40%
  - +8→+9: 30%
  - +9→+10: 20%
- **Failure:** Item NOT destroyed, only gold lost

### Inventory Management
- **Default Capacity:** 30 slots
- **Expansion:** +10 slots for 1,000g × 1.2^expansion
- **Max Capacity:** 100 slots
- **Filtering:** By slot, rarity, level
- **Sorting:** By level, rarity, name, stats
- **Actions:** Equip, sell (50% value), enchant, compare

---

## 🏆 Leaderboards (✅ COMPLETE - v0.8.0)

### 4 Daily Categories (00:00 UTC Reset - PLANNED)
1. **Deepest Floor:** Highest dungeon floor reached today
2. **Total Gold:** Most gold earned in 24 hours
3. **Heroes Collected:** Number of unique heroes
4. **Combat Power:** Total party combat power score

### Rewards (Top 100)
| Rank | Reward |
|------|--------|
| Rank 1 | 1,000 gems + 5× Legendary Summon Tickets + Exclusive Title |
| Rank 2-10 | 500 gems + 3× Epic Summon Tickets |
| Rank 11-50 | 250 gems + 1× Epic Summon Ticket |
| Rank 51-100 | 100 gems + Gold bonus |

### Leaderboard Features
- Real-time updates (every 5 minutes)
- Personal rank display (highlighted row)
- Top 100 shown
- Filter by category (tabs)
- "Your Best Today" summary

---

## 💰 Currency & Economy

### Primary Currencies

#### Gold 🪙 (Main Currency)
**Income:**
- Combat: 10 × enemy level × (0.8 to 1.2 variance)
- Quests: 500-2,000g per quest (PLANNED)
- Selling items: item value × 0.5
- Bank interest: 1% daily (max 10,000g/day) (PLANNED)
- Treasure chests: 500-5,000g

**Expenditures:**
- Gacha summons: 1,000g (1x) or 9,000g (10x)
- Enchanting: 100g × 1.5^level (up to ~7,600g for +9→+10)
- Inventory expansion: 1,000g × 1.2^expansion
- Healer services: 100g × avg hero level (PLANNED)
- Market purchases: Potions, materials (PLANNED)

#### Gems 💎 (Premium Currency - F2P Friendly)
**Income (F2P):**
- Daily quests: 150 gems/day (3 × 50 gems) (PLANNED)
- Weekly quests: ~500 gems/week (PLANNED)
- Leaderboard rewards: 100-1,000 gems (PLANNED)
- Achievements: 5,000+ gems total (PLANNED)
- **Total F2P:** ~8,000 gems/month

**Expenditures:**
- Energy refills: 100 gems = +50 energy (max 3/day) (PLANNED)
- Premium gacha: 300 gems = 1 summon (5% legendary rate) (PLANNED)
- Hero slots: 500 gems = +10 collection slots (PLANNED)
- Cosmetics: 1,000-5,000 gems (PLANNED)

#### Energy ⚡ (Daily Activity Limiter)
- Max: 240 energy
- Regen: +10/hour (continues offline)
- Refills: Free (1/day), Premium (3/day), Potions (3/day) (ALL PLANNED)

---

## 📊 Scoring & Power Rating (✅ COMPLETE - v0.7.1)

### Hero Score Formula
```
heroScore = (rarityBase) × (levelMultiplier) × (equipmentBonus)

rarityBase = {
  Common: 100,
  Rare: 250,
  Epic: 500,
  Legendary: 1000
}

levelMultiplier = 1 + (level - 1) × 0.1

equipmentBonus = 1 + (totalEquipmentScore / 100) × 0.01
```

### Item Score Formula
```
itemScore = (rarityBase) × (levelScaling) × (enchantBonus) × (slotMultiplier)

rarityBase = {
  Common: 10,
  Uncommon: 25,
  Rare: 50,
  Epic: 100,
  Legendary: 250
}

levelScaling = 1 + (level × 0.02)
enchantBonus = 1 + (enchantLevel × 0.15)

slotMultiplier = {
  Weapon: 1.5,
  Chest: 1.2,
  Shield: 1.2,
  Accessory: 1.3,
  Others: 1.0
}
```

### Combat Power
- **Formula:** Sum of all 4 active party heroes' scores
- **Display:** MainSidebar badge (real-time updates)
- **Usage:** Leaderboard category, progression gates, party optimization

---

## 📅 Implementation Status Summary

| System | Status | Completion | Version |
|--------|--------|-----------|---------|
| Hero Collection & Gacha | ✅ Complete | 100% | v0.7.0 |
| Combat System (4v4) | ✅ Complete | 100% | v0.2.0 |
| Dungeon System | ✅ Complete | 100% | v0.4.1 |
| Worldmap System | ✅ Complete | 100% | v0.6.0 |
| Equipment & Inventory | ✅ Complete | 100% | v0.3.0 |
| Energy System | ✅ Complete | 100% | v0.8.0 |
| Leaderboards | ✅ Complete | 90% | v0.8.0 |
| Global Weather/Time | ✅ Complete | 100% | v0.7.3 |
| Named Enemies | ✅ Complete | 100% | v0.7.3 |
| Multiplayer (Positions/Chat) | ✅ Complete | 90% | v0.7.2 |
| Database Integration | ✅ Complete | 100% | v0.6.1 |
| Authentication | ✅ Complete | 100% | v0.6.0 |
| Daily Reset Logic | 📋 Planned | 0% | v0.8.0 |
| Daily Quests System | 📋 Planned | 0% | v0.8.0 |
| Town Services (Interactive) | 🔄 Partial | 30% | v0.9.0 |
| Story Campaign | 📋 Planned | 0% | v1.0.0 |
| Guild System | 📋 Planned | 10% | v1.2.0 |
| PvP Arena | 📋 Planned | 0% | v1.2.0 |
| Prestige System | 📋 Planned | 0% | v1.1.0 |

**Overall Game Completion:** ~40% of full design (v1.2.0)

---

## 🎯 Next Priorities (v0.8.0 - 1-2 weeks)

1. **Daily Worldmap Reset Logic**
   - New seed generation at 00:00 UTC
   - Fog of war reset
   - Energy reset to 240
   - Persist hero levels, gold, equipment

2. **Daily Quests System**
   - 3 random quests per day
   - Quest types: Kill X enemies, Clear Y floors, Earn X gold
   - Rewards: 500g + 50 gems per quest
   - Quest tracking UI

3. **Quest Tracking UI**
   - Active quests tab (max 10 concurrent)
   - Quest details: Objectives, progress, rewards
   - Auto-track nearest objective on worldmap
   - Claim rewards button

---

**Version:** 2.0.0 (Design Document)
**Game Loop Design:** v2.0 (Gacha + Daily Reset)
**Total Development Time to v1.2.0:** ~13 weeks
**Current Progress:** ~40% complete
