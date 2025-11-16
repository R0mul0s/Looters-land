# Special Abilities System - Design Document

**Game:** Kingdom of Idle Lords
**Feature:** Epic & Legendary Hero Special Abilities
**Version:** 1.0
**Date:** 2025-11-16
**Author:** Design Documentation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current System Analysis](#2-current-system-analysis)
3. [Design Goals](#3-design-goals)
4. [Special Abilities Mechanics](#4-special-abilities-mechanics)
5. [Activation System](#5-activation-system)
6. [Balance & Power Budget](#6-balance--power-budget)
7. [Individual Ability Design](#7-individual-ability-design)
8. [UI/UX Considerations](#8-uiux-considerations)
9. [Technical Implementation](#9-technical-implementation)
10. [Progression & Upgrade Path](#10-progression--upgrade-path)
11. [Balancing Common/Rare Heroes](#11-balancing-commonrare-heroes)
12. [Testing & Tuning](#12-testing--tuning)
13. [Future Expansion](#13-future-expansion)

---

## 1. Executive Summary

### Purpose
Implement the Special Ability system for Epic and Legendary heroes to:
- Differentiate high-rarity heroes from Common/Rare tiers
- Create meaningful progression incentive for gacha summons
- Add strategic depth to combat and team composition
- Reward investment in rare heroes with game-changing abilities

### Current Status
- ✅ **Data Layer Complete**: 20 Epic/Legendary heroes have special abilities defined in metadata
- ✅ **Infrastructure Ready**: Combat system supports skills, cooldowns, status effects
- ❌ **Mechanics Missing**: Special abilities are not mechanically implemented in combat
- ❌ **UI Missing**: No interface for special ability activation/display

### High-Level Design
Special abilities will be **4th skill slot exclusive to Epic/Legendary heroes** that:
- Auto-activates when available (fits idle game philosophy)
- 8-10 turn cooldown (usable 1-2x per normal fight, 3-4x per boss)
- 2-3x more powerful than class skills
- Unique effects not available to lower rarities

---

## 2. Current System Analysis

### 2.1 Existing Combat Infrastructure

**Turn-Based Combat** ([CombatEngine.ts](../src/engine/combat/CombatEngine.ts))
- Initiative system (SPD + random 0-10)
- Turn order calculated each round
- Status effect tick system
- Cooldown management per character
- Victory/defeat detection
- XP/loot rewards

**Skill System** ([Skill.ts](../src/engine/combat/Skill.ts))
- 15 class-based skills (3 per class × 5 classes)
- Cooldowns: 2-5 turns
- Types: damage, heal, buff, AoE
- Execute functions with CombatActionResult
- Status effect application (buffs, debuffs, stun, immunity)

**Hero Classes** ([Hero.ts](../src/engine/hero/Hero.ts))
- 5 classes: Warrior, Archer, Mage, Cleric, Paladin
- Stats: HP, ATK, DEF, SPD, CRIT
- Equipment integration
- Level progression with XP
- cooldowns: Map&lt;string, number&gt;
- ultimateCharge: number (unused)
- statusEffects: StatusEffect[]

### 2.2 Rarity System

**Current Multipliers:**
```typescript
Common: 1.0x combat power
Rare: 1.2x combat power
Epic: 1.4x combat power
Legendary: 1.6x combat power
```

**Gacha Rates:**
- Common: 60%
- Rare: 25%
- Epic: 12%
- Legendary: 3%

### 2.3 Gap Analysis

**What We Have:**
- ✅ Cooldown management system
- ✅ Status effects (buffs/debuffs/stun/immunity)
- ✅ Skill execution framework
- ✅ Combat log system
- ✅ Turn-based action processing
- ✅ Hero metadata with special ability descriptions

**What We Need:**
- ❌ 4th skill slot for Epic/Legendary heroes
- ❌ Special ability execution logic
- ❌ Unique mechanics (resurrection, freeze, summon, etc.)
- ❌ UI indicators for special ability availability
- ❌ Visual feedback for special ability activation
- ❌ Balance tuning for power levels

---

## 3. Design Goals

### 3.1 Core Principles

1. **Idle-Friendly Automation**
   - Special abilities auto-activate when available
   - No manual input required for progression
   - Clear visual feedback when abilities trigger

2. **Meaningful Rarity Differentiation**
   - Epic heroes feel noticeably stronger than Rare
   - Legendary heroes are game-changing but not mandatory
   - Clear power progression: Common < Rare < Epic < Legendary

3. **Strategic Depth (Optional)**
   - Team composition matters (synergies between abilities)
   - Boss fights have different optimal strategies
   - Multiple viable team compositions

4. **Balanced Power Ceiling**
   - Special abilities powerful but not auto-win
   - Gear/levels still matter
   - Lower rarity teams can still succeed with good strategy

### 3.2 Player Experience Goals

**For Gacha Players:**
- "Wow" moment when seeing Epic/Legendary in action
- Clear reason to pull for higher rarities
- Satisfaction from collecting unique abilities

**For F2P Players:**
- Can still progress without Legendary heroes
- Epic heroes feel achievable and rewarding
- Common/Rare teams remain viable with skill

**For Endgame Players:**
- Build diverse teams around special abilities
- Optimize cooldowns and synergies
- Challenge content requires strategic ability usage

---

## 4. Special Abilities Mechanics

### 4.1 Ability Slot System

**Implementation:**
```typescript
// Epic/Legendary heroes have 4 skill slots
class Hero {
  getSkills(): Skill[] {
    const classSkills = getSkillsForClass(this.class); // 3 skills

    if (this.rarity === 'epic' || this.rarity === 'legendary') {
      const specialSkill = this.getSpecialAbility(); // +1 skill
      return [...classSkills, specialSkill];
    }

    return classSkills;
  }
}
```

**Why 4th Slot:**
- ✅ Clear visual differentiation (3 vs 4 skills)
- ✅ Doesn't replace class identity
- ✅ Easy to understand for players
- ✅ Scales well with future talent trees

### 4.2 Activation Mechanics

**Auto-Activation System:**

```typescript
// Hero AI prioritizes special ability when available
heroAI(hero: Hero): CombatActionResult {
  const skills = hero.getSkills();

  // Priority 1: Special Ability (if Epic/Legendary and off cooldown)
  if (hero.rarity === 'epic' || hero.rarity === 'legendary') {
    const specialAbility = skills[3]; // 4th slot
    if (hero.cooldowns.get(specialAbility.name) === 0) {
      return hero.useSkill(3, selectTargets(specialAbility));
    }
  }

  // Priority 2: Class skills
  // ... existing AI logic
}
```

**Activation Priority:**
1. **Special Ability** (if available)
2. **Emergency Heal** (if ally < 30% HP)
3. **Offensive Skills** (if off cooldown)
4. **Basic Attack** (default)

### 4.3 Cooldown System

**Cooldown Values:**
- **Epic Abilities**: 8 turns
- **Legendary Abilities**: 10 turns

**Rationale:**
- Normal fights (10-15 turns): 1-2 uses
- Boss fights (25-40 turns): 3-4 uses
- Not spammable, but impactful
- Longer than class skills (2-5 turns) to emphasize power

**First Use:**
- Available from turn 1 (no initial cooldown)
- Creates immediate "wow" moment
- Rewards summoning Epic/Legendary

### 4.4 Power Level Categories

**Legendary (1.6x multiplier + special ability):**
- Game-changing ultimate effects
- Multi-target with massive numbers
- Unique mechanics (resurrection, time stop)
- 300%+ damage or full party effects

**Epic (1.4x multiplier + special ability):**
- Strong single-target or limited AoE
- Powerful buffs/debuffs
- 200-250% damage or significant utility
- Enhanced versions of class abilities

**Rare (1.2x multiplier, no special ability):**
- Better stats than Common
- Class skills only
- Compensation: talent points give better returns

**Common (1.0x multiplier, no special ability):**
- Baseline power level
- Fully viable with equipment/levels
- Compensation: easier to max talent points

---

## 5. Activation System

### 5.1 Automatic Activation

**Decision Tree:**
```
Turn Start
  ↓
Is Special Ability off cooldown?
  ↓ YES
Check targeting requirements
  ↓
Auto-select optimal targets
  ↓
Execute special ability
  ↓
Apply cooldown (8-10 turns)
  ↓
Log combat event
```

**Target Selection AI:**
```typescript
function selectSpecialAbilityTargets(
  ability: Skill,
  hero: Hero,
  allies: Hero[],
  enemies: Enemy[]
): Combatant[] {
  switch (ability.type) {
    case 'damage':
      // Highest HP enemy for single target
      return [enemies.filter(e => e.isAlive)
        .reduce((a, b) => a.currentHP > b.currentHP ? a : b)];

    case 'aoe':
      // All alive enemies
      return enemies.filter(e => e.isAlive);

    case 'heal':
      // Lowest HP ally
      return [allies.filter(a => a.isAlive)
        .reduce((a, b) => a.currentHP < b.currentHP ? a : b)];

    case 'resurrection':
      // All dead allies
      return allies.filter(a => !a.isAlive);

    case 'buff':
      // All alive allies
      return allies.filter(a => a.isAlive);

    default:
      return [];
  }
}
```

### 5.2 Manual Override (Future)

**Phase 2 Enhancement:**
- Hold ability for better timing
- Manual target selection
- Combo with other abilities
- Advanced player option (not required)

---

## 6. Balance & Power Budget

### 6.1 Power Budget Framework

**Baseline: Class Skill Power = 100**

| Skill Tier | Power Budget | Cooldown | Example |
|------------|-------------|----------|---------|
| Class Skill | 100 | 2-5 turns | Fireball: 200% ATK |
| Epic Special | 220 | 8 turns | Shadow Strike: 200% crit dmg guaranteed |
| Legendary Special | 300 | 10 turns | Excalibur: 300% dmg + 20% party heal |

**Power Budget Components:**
- **Base Damage**: 100% ATK = 50 points
- **Multipliers**: +50% damage = +25 points
- **Status Effects**: 2-turn debuff = 20 points
- **AoE**: Hits all enemies = +50 points
- **Healing**: 10% max HP = 15 points
- **Resurrection**: 1 ally at 50% HP = 150 points
- **Stun/Freeze**: 1 turn all enemies = 100 points

### 6.2 Epic Abilities Power Level

**Target Power: 220 points**

**Example Breakdowns:**

**Shadow Strike** (Shadow Blade - Epic Warrior)
- Base: 200% crit damage = 100 points
- Guaranteed crit = +50 points
- Single target = 0 points
- **Total: 150 points** *(Balanced: CD 6 turns)*

**Dragon Roar** (Dragonslayer - Epic Warrior)
- AoE stun 1 turn = 100 points
- +50% DEF self 3 turns = 60 points
- **Total: 160 points** *(Balanced: CD 7 turns)*

**Frozen Prison** (Frost Queen - Epic Mage)
- Freeze all enemies 1 turn = 120 points
- 100% ATK AoE damage = 75 points
- **Total: 195 points** *(Balanced: CD 8 turns)*

### 6.3 Legendary Abilities Power Level

**Target Power: 300 points**

**Example Breakdowns:**

**Excalibur Strike** (King Arthur - Legendary Warrior)
- 300% ATK damage = 150 points
- Heal all allies 20% max HP = 80 points
- AoE heal effect = +40 points
- **Total: 270 points** *(Balanced: CD 9 turns)*

**Time Stop** (Merlin - Legendary Mage)
- Freeze all enemies 2 turns = 240 points
- 200% ATK AoE damage = 100 points
- **Total: 340 points** *(Slightly OP: CD 10 turns, late availability)*

**Divine Resurrection** (Valkyrie - Legendary Paladin)
- Resurrect all dead allies = 300 points
- 50% HP restoration = +80 points
- **Total: 380 points** *(High power, but situational)*

### 6.4 Balancing Mechanisms

**Natural Balancing Factors:**
1. **Cooldown Gating**: Long cooldowns limit usage
2. **Situational Value**: Resurrection only useful if allies died
3. **Stat Scaling**: Still requires good base stats
4. **Opportunity Cost**: Takes a turn (can't use other actions)
5. **Equipment Matters**: Legendary hero with bad gear < Epic with good gear

**Compensation for Lower Rarities:**
1. **Talent System**: Common/Rare easier to get duplicates → more talent points
2. **Equipment**: All rarities benefit equally from good loot
3. **Level Scaling**: Stats still primary power source
4. **Team Synergy**: Multiple Epics > single Legendary in some cases

---

## 7. Individual Ability Design

### 7.1 Legendary Heroes (5 Total)

---

#### **King Arthur** (Legendary Warrior - Tank)
**Special Ability:** Excalibur Strike

```typescript
new Skill(
  'Excalibur Strike',
  'Deal 300% ATK damage to single enemy and heal all allies for 20% max HP',
  9, // cooldown
  'damage_heal_aoe',
  (caster, targets) => {
    // Damage phase
    const enemy = targets[0];
    const damage = Math.floor(caster.ATK * 3.0);
    const isCrit = Math.random() * 100 < caster.CRIT;
    const finalDamage = enemy.takeDamage(damage, isCrit);

    // Heal phase
    const allies = getAllies(caster);
    const healResults = allies.map(ally => {
      const healAmount = ally.heal(Math.floor(ally.maxHP * 0.2));
      return { target: ally, healAmount };
    });

    return {
      attacker: caster,
      target: enemy,
      damage: finalDamage,
      isCrit,
      skillName: 'Excalibur Strike',
      type: 'skill_special_legendary',
      healResults,
      effect: 'The legendary sword shines with holy light!'
    };
  }
)
```

**Power Analysis:**
- 300% ATK single target: 150 pts
- 20% max HP AoE heal: 120 pts
- **Total: 270 pts** → Balanced for 9-turn CD

**Tactical Use:**
- Boss killer with sustainability
- Keeps team alive in long fights
- Strong opener and finisher

---

#### **Merlin the Archmage** (Legendary Mage - DPS)
**Special Ability:** Time Stop

```typescript
new Skill(
  'Time Stop',
  'Freeze all enemies for 2 turns and deal 200% ATK damage',
  10,
  'aoe_freeze',
  (caster, targets) => {
    const results = targets.map(enemy => {
      if (!enemy.isAlive) return null;

      // Apply 2-turn freeze
      enemy.addStatusEffect({
        name: 'Time Stop',
        duration: 2,
        type: 'debuff',
        stun: true
      });

      // Deal damage
      const damage = Math.floor(caster.ATK * 2.0);
      const isCrit = Math.random() * 100 < caster.CRIT;
      const finalDamage = enemy.takeDamage(damage, isCrit);

      return { target: enemy, damage: finalDamage, isCrit };
    }).filter(r => r !== null);

    return {
      attacker: caster,
      skillName: 'Time Stop',
      type: 'skill_special_legendary',
      results,
      effect: 'Time freezes as Merlin commands reality itself!'
    };
  }
)
```

**Power Analysis:**
- 2-turn freeze all enemies: 240 pts
- 200% ATK AoE damage: 100 pts
- **Total: 340 pts** → Very strong, 10-turn CD + high rarity justified

**Tactical Use:**
- Boss fight control (2 free turns)
- Emergency team save
- Combo enabler

---

#### **Valkyrie** (Legendary Paladin - Support)
**Special Ability:** Divine Resurrection

```typescript
new Skill(
  'Divine Resurrection',
  'Revive all dead allies with 50% HP',
  10,
  'resurrection',
  (caster, targets) => {
    // Resurrect all dead allies
    const deadAllies = getAllies(caster).filter(a => !a.isAlive);

    const resurrectionResults = deadAllies.map(ally => {
      const reviveHP = Math.floor(ally.maxHP * 0.5);
      ally.currentHP = reviveHP;
      ally.isAlive = true;

      // Clear all debuffs on resurrection
      ally.statusEffects = ally.statusEffects.filter(e => e.type !== 'debuff');

      return { target: ally, healAmount: reviveHP };
    });

    return {
      attacker: caster,
      skillName: 'Divine Resurrection',
      type: 'skill_special_legendary',
      resurrectionResults,
      effect: `Revived ${resurrectionResults.length} fallen heroes!`
    };
  }
)
```

**Power Analysis:**
- Resurrect mechanic: 300 pts
- 50% HP restoration: 80 pts
- Clear debuffs: 20 pts
- **Total: 400 pts** → Very high, but situational (only useful if allies died)

**Tactical Use:**
- Ultimate safety net
- Turns defeat into victory
- Boss fight insurance

---

#### **Phoenix Archer** (Legendary Archer - DPS)
**Special Ability:** Phoenix Storm

```typescript
new Skill(
  'Phoenix Storm',
  'Deal 250% ATK damage to all enemies, apply Burn for 3 turns (20 damage/turn)',
  9,
  'aoe_dot',
  (caster, targets) => {
    const results = targets.map(enemy => {
      if (!enemy.isAlive) return null;

      // Initial damage
      const damage = Math.floor(caster.ATK * 2.5);
      const isCrit = Math.random() * 100 < caster.CRIT;
      const finalDamage = enemy.takeDamage(damage, isCrit);

      // Apply Burn DoT
      enemy.addStatusEffect({
        name: 'Phoenix Burn',
        duration: 3,
        type: 'debuff',
        stat: 'burn',
        value: 20 // damage per turn
      });

      return { target: enemy, damage: finalDamage, isCrit };
    }).filter(r => r !== null);

    return {
      attacker: caster,
      skillName: 'Phoenix Storm',
      type: 'skill_special_legendary',
      results,
      effect: 'Flames engulf all enemies!'
    };
  }
)
```

**Power Analysis:**
- 250% ATK AoE: 125 pts
- Burn 20/turn × 3 turns × enemies (avg 3): 180 pts
- **Total: 305 pts** → Balanced for 9-turn CD

**Tactical Use:**
- AoE damage dealer
- Sustained damage over time
- Strong against multiple enemies

---

#### **Ancient Sage** (Legendary Cleric - Healer)
**Special Ability:** Eternal Blessing

```typescript
new Skill(
  'Eternal Blessing',
  'Fully heal all allies and grant immunity for 2 turns',
  10,
  'heal_immunity',
  (caster, targets) => {
    const allies = getAllies(caster).filter(a => a.isAlive);

    const results = allies.map(ally => {
      // Full heal
      const healAmount = ally.heal(ally.maxHP - ally.currentHP);

      // Grant immunity
      ally.addStatusEffect({
        name: 'Eternal Blessing',
        duration: 2,
        type: 'buff',
        immunity: true
      });

      return { target: ally, healAmount };
    });

    return {
      attacker: caster,
      skillName: 'Eternal Blessing',
      type: 'skill_special_legendary',
      results,
      effect: 'Divine light shields the party!'
    };
  }
)
```

**Power Analysis:**
- Full heal all allies: 150 pts
- 2-turn immunity: 200 pts
- **Total: 350 pts** → Very strong, but defensive (doesn't end fights faster)

**Tactical Use:**
- Boss mechanic survival
- Team wipe prevention
- Long fight sustain

---

### 7.2 Epic Heroes (15 Total)

---

#### **Dragonslayer** (Epic Warrior - Tank)
**Special Ability:** Dragon Roar

```typescript
new Skill(
  'Dragon Roar',
  'Stun all enemies for 1 turn and increase own DEF by 50% for 3 turns',
  8,
  'aoe_stun_buff',
  (caster, targets) => {
    // Stun all enemies
    targets.forEach(enemy => {
      if (enemy.isAlive) {
        enemy.addStatusEffect({
          name: 'Dragon Fear',
          duration: 1,
          type: 'debuff',
          stun: true
        });
      }
    });

    // Self DEF buff
    caster.addStatusEffect({
      name: 'Dragon Scales',
      duration: 3,
      type: 'buff',
      stat: 'DEF',
      value: 50
    });

    return {
      attacker: caster,
      targets,
      skillName: 'Dragon Roar',
      type: 'skill_special_epic',
      effect: 'A mighty roar shakes the battlefield!'
    };
  }
)
```

**Power Budget:** 160 pts (AoE stun 100 + DEF buff 60)
**Cooldown:** 8 turns
**Role:** Tank enabler, crowd control

---

#### **Shadow Blade** (Epic Warrior - DPS)
**Special Ability:** Shadow Strike

```typescript
new Skill(
  'Shadow Strike',
  'Deal 200% critical damage with guaranteed crit',
  7,
  'damage_crit',
  (caster, targets) => {
    const target = targets[0];
    const baseDamage = Math.floor(caster.ATK * 2.0);
    // Guaranteed crit with 200% crit multiplier (instead of 150%)
    const damage = Math.floor(baseDamage * 2.0);
    const finalDamage = target.takeDamage(damage, true, 2.0); // custom crit mult

    return {
      attacker: caster,
      target,
      damage: finalDamage,
      isCrit: true,
      skillName: 'Shadow Strike',
      type: 'skill_special_epic',
      effect: 'A shadow strikes from nowhere!'
    };
  }
)
```

**Power Budget:** 200 pts (200% base + guaranteed crit + enhanced multiplier)
**Cooldown:** 7 turns
**Role:** Burst damage, boss execution

---

#### **Hunt Master** (Epic Archer - DPS)
**Special Ability:** Multi-Shot Barrage

```typescript
new Skill(
  'Multi-Shot Barrage',
  'Hit all enemies 3 times for 80% ATK each',
  8,
  'aoe_multi',
  (caster, targets) => {
    const allResults = [];

    // 3 volleys
    for (let volley = 0; volley < 3; volley++) {
      const volleyResults = targets.map(enemy => {
        if (!enemy.isAlive) return null;

        const damage = Math.floor(caster.ATK * 0.8);
        const isCrit = Math.random() * 100 < caster.CRIT;
        const finalDamage = enemy.takeDamage(damage, isCrit);

        return { target: enemy, damage: finalDamage, isCrit, volley };
      }).filter(r => r !== null);

      allResults.push(...volleyResults);
    }

    return {
      attacker: caster,
      skillName: 'Multi-Shot Barrage',
      type: 'skill_special_epic',
      results: allResults,
      effect: 'A storm of arrows fills the sky!'
    };
  }
)
```

**Power Budget:** 240 pts (80% × 3 × 3 enemies = 720% total AoE damage)
**Cooldown:** 8 turns
**Role:** AoE clear, sustained damage

---

#### **Storm Caller** (Epic Mage - DPS)
**Special Ability:** Lightning Storm

```typescript
new Skill(
  'Lightning Storm',
  'Chain lightning to all enemies for 150% ATK damage',
  7,
  'aoe_damage',
  (caster, targets) => {
    const results = targets.map((enemy, index) => {
      if (!enemy.isAlive) return null;

      // Damage decreases slightly per chain (150% → 135% → 120%)
      const multiplier = 1.5 - (index * 0.15);
      const damage = Math.floor(caster.ATK * Math.max(multiplier, 1.0));
      const isCrit = Math.random() * 100 < caster.CRIT;
      const finalDamage = enemy.takeDamage(damage, isCrit);

      return { target: enemy, damage: finalDamage, isCrit };
    }).filter(r => r !== null);

    return {
      attacker: caster,
      skillName: 'Lightning Storm',
      type: 'skill_special_epic',
      results,
      effect: 'Lightning arcs between enemies!'
    };
  }
)
```

**Power Budget:** 195 pts (150% AoE with scaling)
**Cooldown:** 7 turns
**Role:** AoE damage, chain clear

---

#### **Frost Queen** (Epic Mage - Support)
**Special Ability:** Frozen Prison

```typescript
new Skill(
  'Frozen Prison',
  'Freeze all enemies for 1 turn and deal 100% ATK damage',
  8,
  'aoe_freeze_damage',
  (caster, targets) => {
    const results = targets.map(enemy => {
      if (!enemy.isAlive) return null;

      // Freeze
      enemy.addStatusEffect({
        name: 'Frozen',
        duration: 1,
        type: 'debuff',
        stun: true
      });

      // Damage
      const damage = caster.ATK;
      const isCrit = Math.random() * 100 < caster.CRIT;
      const finalDamage = enemy.takeDamage(damage, isCrit);

      return { target: enemy, damage: finalDamage, isCrit };
    }).filter(r => r !== null);

    return {
      attacker: caster,
      skillName: 'Frozen Prison',
      type: 'skill_special_epic',
      results,
      effect: 'Ice crystals entomb all foes!'
    };
  }
)
```

**Power Budget:** 195 pts (AoE freeze 120 + 100% AoE damage 75)
**Cooldown:** 8 turns
**Role:** Crowd control, setup

---

#### **High Priest** (Epic Cleric - Healer)
**Special Ability:** Mass Heal

```typescript
new Skill(
  'Mass Heal',
  'Heal all allies for 100 HP',
  7,
  'heal_aoe',
  (caster, targets) => {
    const allies = getAllies(caster).filter(a => a.isAlive);

    const results = allies.map(ally => {
      const healAmount = ally.heal(100);
      return { target: ally, healAmount };
    });

    return {
      attacker: caster,
      skillName: 'Mass Heal',
      type: 'skill_special_epic',
      results,
      effect: 'Divine light washes over the party!'
    };
  }
)
```

**Power Budget:** 150 pts (100 HP × avg 3 allies)
**Cooldown:** 7 turns
**Role:** Sustained healing, group sustain

---

#### **Nature Warden** (Epic Cleric - Support)
**Special Ability:** Nature's Blessing

```typescript
new Skill(
  'Nature\'s Blessing',
  'Heal all allies for 50 HP immediately, then 30 HP/turn for 3 turns',
  8,
  'heal_hot',
  (caster, targets) => {
    const allies = getAllies(caster).filter(a => a.isAlive);

    const results = allies.map(ally => {
      // Immediate heal
      const healAmount = ally.heal(50);

      // Apply HoT (Heal over Time)
      ally.addStatusEffect({
        name: 'Nature\'s Blessing',
        duration: 3,
        type: 'buff',
        stat: 'regen',
        value: 30 // HP per turn
      });

      return { target: ally, healAmount };
    });

    return {
      attacker: caster,
      skillName: 'Nature\'s Blessing',
      type: 'skill_special_epic',
      results,
      effect: 'Nature\'s energy flows through the party!'
    };
  }
)
```

**Power Budget:** 220 pts (50 instant + 90 over time × 3 allies)
**Cooldown:** 8 turns
**Role:** Sustained healing, long fights

---

#### **Divine Champion** (Epic Paladin - Tank)
**Special Ability:** Holy Aegis

```typescript
new Skill(
  'Holy Aegis',
  'Block all damage for 1 turn',
  8,
  'immunity_self',
  (caster, targets) => {
    caster.addStatusEffect({
      name: 'Holy Aegis',
      duration: 1,
      type: 'buff',
      immunity: true
    });

    return {
      attacker: caster,
      skillName: 'Holy Aegis',
      type: 'skill_special_epic',
      effect: 'Divine shields protect the champion!'
    };
  }
)
```

**Power Budget:** 150 pts (1-turn immunity single target)
**Cooldown:** 8 turns
**Role:** Tank survival, boss mechanic dodge

---

#### **Dread Knight** (Epic Paladin - DPS)
**Special Ability:** Life Drain

```typescript
new Skill(
  'Life Drain',
  'Deal 200% ATK damage and heal self for 50% damage dealt',
  7,
  'damage_lifesteal',
  (caster, targets) => {
    const target = targets[0];
    const damage = Math.floor(caster.ATK * 2.0);
    const isCrit = Math.random() * 100 < caster.CRIT;
    const finalDamage = target.takeDamage(damage, isCrit);
    const healAmount = caster.heal(Math.floor(finalDamage * 0.5));

    return {
      attacker: caster,
      target,
      damage: finalDamage,
      isCrit,
      healAmount,
      skillName: 'Life Drain',
      type: 'skill_special_epic',
      effect: 'Life energy flows from foe to hero!'
    };
  }
)
```

**Power Budget:** 175 pts (200% damage + 50% lifesteal)
**Cooldown:** 7 turns
**Role:** Sustain DPS, solo carry

---

#### **Berserker Chief** (Epic Warrior - DPS)
**Special Ability:** Rage Mode

```typescript
new Skill(
  'Rage Mode',
  'Increase ATK by 100% but reduce DEF by 50% for 3 turns',
  7,
  'buff_debuff_self',
  (caster, targets) => {
    // ATK buff
    caster.addStatusEffect({
      name: 'Berserk Rage',
      duration: 3,
      type: 'buff',
      stat: 'ATK',
      value: 100
    });

    // DEF debuff
    caster.addStatusEffect({
      name: 'Reckless Fury',
      duration: 3,
      type: 'debuff',
      stat: 'DEF',
      value: -50
    });

    return {
      attacker: caster,
      skillName: 'Rage Mode',
      type: 'skill_special_epic',
      effect: 'Berserker enters a frenzy!'
    };
  }
)
```

**Power Budget:** 180 pts (Glass cannon transformation)
**Cooldown:** 7 turns
**Role:** High-risk high-reward DPS

---

#### **Elite Sniper** (Epic Archer - DPS)
**Special Ability:** Headshot

```typescript
new Skill(
  'Headshot',
  'Deal 300% ATK damage to single target, ignores 50% DEF',
  8,
  'damage_armor_pen',
  (caster, targets) => {
    const target = targets[0];
    const damage = Math.floor(caster.ATK * 3.0);
    const isCrit = Math.random() * 100 < caster.CRIT;

    // Custom damage calculation with armor penetration
    const armorPen = 0.5;
    const effectiveDEF = target.DEF * (1 - armorPen);
    const damageReduction = 100 / (100 + effectiveDEF);
    let finalDamage = Math.floor(damage * damageReduction);

    if (isCrit) {
      finalDamage = Math.floor(finalDamage * 1.5);
    }

    target.currentHP -= finalDamage;
    if (target.currentHP <= 0) {
      target.currentHP = 0;
      target.isAlive = false;
    }

    return {
      attacker: caster,
      target,
      damage: finalDamage,
      isCrit,
      skillName: 'Headshot',
      type: 'skill_special_epic',
      effect: 'A perfect shot pierces armor!'
    };
  }
)
```

**Power Budget:** 240 pts (300% damage + armor pen)
**Cooldown:** 8 turns
**Role:** Tank buster, boss killer

---

#### **Necromancer** (Epic Mage - Support)
**Special Ability:** Raise Dead

```typescript
new Skill(
  'Raise Dead',
  'Summon skeleton warrior (50% caster stats) for 5 turns',
  9,
  'summon',
  (caster, targets) => {
    // Create skeleton minion
    const skeleton = createMinion({
      name: 'Skeleton Warrior',
      maxHP: Math.floor(caster.maxHP * 0.5),
      ATK: Math.floor(caster.ATK * 0.5),
      DEF: Math.floor(caster.DEF * 0.5),
      SPD: Math.floor(caster.SPD * 0.5),
      CRIT: caster.CRIT * 0.5,
      duration: 5 // turns until despawn
    });

    // Add to combat
    addAllyToCombat(skeleton);

    return {
      attacker: caster,
      skillName: 'Raise Dead',
      type: 'skill_special_epic',
      summon: skeleton,
      effect: 'A skeleton warrior rises to fight!'
    };
  }
)
```

**Power Budget:** 200 pts (Summon mechanic, 5 turn duration)
**Cooldown:** 9 turns
**Role:** Unique summon mechanic, action economy

**Note:** Requires additional summon system implementation

---

#### **Oracle** (Epic Cleric - Support)
**Special Ability:** Foresight

```typescript
new Skill(
  'Foresight',
  'Reveal enemy next action, grant allies +20% dodge for 2 turns',
  7,
  'utility_buff',
  (caster, targets) => {
    // Dodge buff (implemented as SPD increase)
    const allies = getAllies(caster).filter(a => a.isAlive);
    allies.forEach(ally => {
      ally.addStatusEffect({
        name: 'Foresight',
        duration: 2,
        type: 'buff',
        stat: 'SPD',
        value: 20
      });
    });

    // TODO: Enemy action reveal (UI feature)

    return {
      attacker: caster,
      skillName: 'Foresight',
      type: 'skill_special_epic',
      effect: 'The future reveals itself!'
    };
  }
)
```

**Power Budget:** 120 pts (Utility + moderate buff)
**Cooldown:** 7 turns
**Role:** Support utility, team speed

---

#### **Crusader** (Epic Paladin - Tank)
**Special Ability:** Holy Smite

```typescript
new Skill(
  'Holy Smite',
  'Deal 180% ATK damage and heal all allies for 15% max HP',
  7,
  'damage_heal_combo',
  (caster, targets) => {
    // Damage phase
    const enemy = targets[0];
    const damage = Math.floor(caster.ATK * 1.8);
    const isCrit = Math.random() * 100 < caster.CRIT;
    const finalDamage = enemy.takeDamage(damage, isCrit);

    // Heal phase
    const allies = getAllies(caster).filter(a => a.isAlive);
    const healResults = allies.map(ally => {
      const healAmount = ally.heal(Math.floor(ally.maxHP * 0.15));
      return { target: ally, healAmount };
    });

    return {
      attacker: caster,
      target: enemy,
      damage: finalDamage,
      isCrit,
      skillName: 'Holy Smite',
      type: 'skill_special_epic',
      healResults,
      effect: 'Holy energy smites the enemy and heals allies!'
    };
  }
)
```

**Power Budget:** 195 pts (180% damage + 15% AoE heal)
**Cooldown:** 7 turns
**Role:** Hybrid damage/support

---

#### **Blade Dancer** (Epic Warrior - DPS)
**Special Ability:** Blade Whirlwind

```typescript
new Skill(
  'Blade Whirlwind',
  'Hit all enemies twice for 90% ATK each',
  8,
  'aoe_double',
  (caster, targets) => {
    const allResults = [];

    // Two strikes
    for (let strike = 0; strike < 2; strike++) {
      const strikeResults = targets.map(enemy => {
        if (!enemy.isAlive) return null;

        const damage = Math.floor(caster.ATK * 0.9);
        const isCrit = Math.random() * 100 < caster.CRIT;
        const finalDamage = enemy.takeDamage(damage, isCrit);

        return { target: enemy, damage: finalDamage, isCrit };
      }).filter(r => r !== null);

      allResults.push(...strikeResults);
    }

    return {
      attacker: caster,
      skillName: 'Blade Whirlwind',
      type: 'skill_special_epic',
      results: allResults,
      effect: 'Blades whirl in a deadly dance!'
    };
  }
)
```

**Power Budget:** 216 pts (90% × 2 × 3 enemies = 540% total)
**Cooldown:** 8 turns
**Role:** AoE DPS, clear waves

---

### 7.3 Summary Table

| Hero | Rarity | Class | Special Ability | Power | CD | Primary Effect |
|------|--------|-------|-----------------|-------|-----|----------------|
| King Arthur | Legendary | Warrior | Excalibur Strike | 270 | 9 | 300% dmg + 20% AoE heal |
| Merlin | Legendary | Mage | Time Stop | 340 | 10 | Freeze all 2 turns + 200% AoE |
| Valkyrie | Legendary | Paladin | Divine Resurrection | 400 | 10 | Resurrect all at 50% HP |
| Phoenix Archer | Legendary | Archer | Phoenix Storm | 305 | 9 | 250% AoE + Burn DoT |
| Ancient Sage | Legendary | Cleric | Eternal Blessing | 350 | 10 | Full heal + 2 turn immunity |
| Dragonslayer | Epic | Warrior | Dragon Roar | 160 | 8 | AoE stun + 50% DEF self |
| Shadow Blade | Epic | Warrior | Shadow Strike | 200 | 7 | 200% guaranteed crit |
| Hunt Master | Epic | Archer | Multi-Shot Barrage | 240 | 8 | 80% × 3 volleys AoE |
| Storm Caller | Epic | Mage | Lightning Storm | 195 | 7 | 150% chain lightning |
| Frost Queen | Epic | Mage | Frozen Prison | 195 | 8 | Freeze all + 100% AoE |
| High Priest | Epic | Cleric | Mass Heal | 150 | 7 | Heal all 100 HP |
| Nature Warden | Epic | Cleric | Nature's Blessing | 220 | 8 | 50 + 30/turn HoT |
| Divine Champion | Epic | Paladin | Holy Aegis | 150 | 8 | Immunity 1 turn |
| Dread Knight | Epic | Paladin | Life Drain | 175 | 7 | 200% dmg + 50% lifesteal |
| Berserker Chief | Epic | Warrior | Rage Mode | 180 | 7 | +100% ATK, -50% DEF |
| Elite Sniper | Epic | Archer | Headshot | 240 | 8 | 300% dmg, ignore 50% DEF |
| Necromancer | Epic | Mage | Raise Dead | 200 | 9 | Summon skeleton 5 turns |
| Oracle | Epic | Cleric | Foresight | 120 | 7 | +20% dodge 2 turns |
| Crusader | Epic | Paladin | Holy Smite | 195 | 7 | 180% dmg + 15% heal |
| Blade Dancer | Epic | Warrior | Blade Whirlwind | 216 | 8 | 90% × 2 hits AoE |

---

## 8. UI/UX Considerations

### 8.1 Visual Indicators

**Hero Card Display:**
```
┌─────────────────────────┐
│ ⭐ King Arthur (Lv.15) │
│ Legendary Warrior       │
├─────────────────────────┤
│ Skills:                 │
│ [1] Heavy Slash (2)     │ ← Class skills
│ [2] Shield Bash (3)     │
│ [3] Battle Cry (5)      │
│ [✨] Excalibur (9) 🔥   │ ← Special ability (fire icon = ready)
└─────────────────────────┘
```

**Ability Readiness:**
- ⏳ Cooldown remaining (grey icon + number)
- 🔥 Ready to use (glowing gold icon)
- ✨ Special ability indicator (different visual from class skills)

### 8.2 Combat Log Format

```
=== TURN 5 ===
King Arthur uses Excalibur Strike! ✨
 → Enemy Boss takes 1,250 damage [CRIT!]
 → All heroes healed for 180 HP
 → "The legendary sword shines with holy light!"
```

**Visual Enhancements:**
- Special abilities have unique icon prefix ✨
- Different color coding (gold for legendary, purple for epic)
- Flavor text in italics
- Combat log auto-scrolls to special ability usage

### 8.3 Hero Collection UI

**Filter by Special Abilities:**
- Show/hide heroes with special abilities
- Sort by special ability type (damage, heal, control)
- Tooltip on hover shows full ability description

**Special Ability Preview:**
```
┌─────────────────────────────────┐
│ Excalibur Strike (Legendary)    │
│ Cooldown: 9 turns               │
│                                 │
│ Deal 300% ATK damage to single │
│ enemy and heal all allies for  │
│ 20% max HP.                     │
│                                 │
│ "The legendary sword shines     │
│ with holy light!"               │
└─────────────────────────────────┘
```

### 8.4 Animation Hooks (Future)

**Special Ability Triggers:**
- Screen shake on legendary activation
- Particle effects (lightning, fire, holy light)
- Unique sound effects per ability
- Slow-motion hit frames (juice)

---

## 9. Technical Implementation

### 9.1 Code Architecture

**File Structure:**
```
src/engine/combat/
├── Skill.ts                    (existing - class skills)
├── SpecialAbility.ts          (NEW - special ability definitions)
├── SpecialAbilityFactory.ts   (NEW - create abilities from hero templates)
└── CombatEngine.ts             (existing - integrate special abilities)

src/engine/hero/
└── Hero.ts                     (MODIFY - add getSpecialAbility())

src/types/
├── combat.types.ts             (MODIFY - new action result types)
└── hero.types.ts               (existing - already has specialAbility field)
```

### 9.2 Implementation Steps

**Phase 1: Core Mechanics (Week 1)**
1. Create `SpecialAbility.ts` with 5 Legendary abilities
2. Modify `Hero.getSkills()` to include 4th slot
3. Update `CombatEngine.heroAI()` to prioritize special abilities
4. Add new `CombatActionResult` types
5. Test in combat simulation

**Phase 2: Epic Abilities (Week 2)**
6. Implement all 15 Epic abilities in `SpecialAbility.ts`
7. Create `SpecialAbilityFactory` to map hero IDs to abilities
8. Add combat log formatting for special abilities
9. Balance testing with mixed teams

**Phase 3: Polish & UI (Week 3)**
10. UI indicators for ability readiness
11. Combat log visual enhancements
12. Hero card display updates
13. Tooltips and ability previews

**Phase 4: Advanced Mechanics (Week 4)**
14. Implement DoT (Damage over Time) system for burns/HoT
15. Summon system for Necromancer
16. Enemy action reveal for Oracle
17. Final balance pass

### 9.3 Code Examples

**SpecialAbility.ts Structure:**
```typescript
import { Skill } from './Skill';
import type { HeroTemplate } from '../../types/hero.types';

export class SpecialAbilityFactory {
  static create(heroTemplate: HeroTemplate): Skill | null {
    const abilityMap: Record<string, Skill> = {
      'legendary_arthur': this.excaliburStrike(),
      'legendary_merlin': this.timeStop(),
      // ... all 20 abilities
    };

    return abilityMap[heroTemplate.id] || null;
  }

  private static excaliburStrike(): Skill {
    return new Skill(
      'Excalibur Strike',
      'Deal 300% ATK damage and heal all allies for 20% max HP',
      9,
      'special_legendary',
      (caster, targets) => {
        // Implementation from section 7.1
      }
    );
  }

  // ... other ability factory methods
}
```

**Hero.ts Modification:**
```typescript
export class Hero {
  // ... existing fields

  getSkills(): Skill[] {
    const classSkills = getSkillsForClass(this.class);

    // Add special ability for Epic/Legendary
    if (this.rarity === 'epic' || this.rarity === 'legendary') {
      const specialAbility = this.getSpecialAbility();
      if (specialAbility) {
        return [...classSkills, specialAbility];
      }
    }

    return classSkills;
  }

  getSpecialAbility(): Skill | null {
    // Get hero template by ID (from HeroPool)
    const template = HERO_POOL.find(t => t.name === this.name);
    if (!template) return null;

    return SpecialAbilityFactory.create(template);
  }
}
```

**CombatEngine.ts Modification:**
```typescript
private heroAI(hero: Combatant): CombatActionResult | null {
  const skills = 'getSkills' in hero ? (hero as any).getSkills() : [];

  // PRIORITY 1: Special Ability (4th slot if exists)
  if (skills.length === 4) {
    const specialAbility = skills[3];
    const cooldown = hero.cooldowns.get(specialAbility.name) || 0;

    if (cooldown === 0) {
      const targets = this.selectTargetsForAbility(specialAbility, hero);
      return (hero as any).useSkill(3, targets);
    }
  }

  // PRIORITY 2: Emergency heals
  if ('class' in hero && (hero as any).class === 'cleric') {
    // ... existing heal logic
  }

  // PRIORITY 3: Class skills
  // ... existing skill logic

  // PRIORITY 4: Basic attack
  // ... existing attack logic
}

private selectTargetsForAbility(ability: Skill, caster: Combatant): Combatant[] {
  const aliveEnemies = this.enemies.filter(e => e.isAlive);
  const aliveAllies = this.heroes.filter(h => h.isAlive);
  const deadAllies = this.heroes.filter(h => !h.isAlive);

  switch (ability.type) {
    case 'damage':
    case 'damage_lifesteal':
    case 'damage_armor_pen':
    case 'damage_crit':
      // Highest HP enemy
      return [aliveEnemies.reduce((a, b) =>
        a.currentHP > b.currentHP ? a : b
      )];

    case 'aoe':
    case 'aoe_freeze':
    case 'aoe_stun_buff':
    case 'aoe_freeze_damage':
    case 'aoe_multi':
    case 'aoe_double':
    case 'aoe_dot':
      // All enemies
      return aliveEnemies;

    case 'heal':
    case 'heal_aoe':
    case 'heal_hot':
      // All allies
      return aliveAllies;

    case 'resurrection':
      // All dead allies
      return deadAllies;

    case 'buff':
    case 'utility_buff':
    case 'immunity_self':
    case 'buff_debuff_self':
      // Self or all allies
      return ability.name.includes('self') ? [caster] : aliveAllies;

    case 'damage_heal_combo':
    case 'damage_heal_aoe':
      // Highest HP enemy (damage will also heal)
      return [aliveEnemies.reduce((a, b) =>
        a.currentHP > b.currentHP ? a : b
      )];

    default:
      return aliveEnemies;
  }
}
```

### 9.4 New Combat Action Types

**combat.types.ts Extension:**
```typescript
export type SkillType =
  | 'damage'
  | 'heal'
  | 'buff'
  | 'debuff'
  | 'aoe'
  // NEW: Special ability types
  | 'special_legendary'
  | 'special_epic'
  | 'resurrection'
  | 'summon'
  | 'damage_heal_aoe'
  | 'aoe_freeze'
  | 'aoe_stun_buff'
  | 'damage_lifesteal'
  | 'damage_armor_pen'
  | 'damage_crit'
  | 'heal_hot'
  | 'heal_immunity'
  | 'immunity_self'
  | 'buff_debuff_self'
  | 'utility_buff'
  | 'aoe_dot'
  | 'aoe_multi'
  | 'aoe_double'
  | 'damage_heal_combo';

export interface CombatActionResult {
  // ... existing fields

  // NEW: Special ability fields
  resurrectionResults?: Array<{ target: Combatant; healAmount: number }>;
  summon?: Combatant;
  healResults?: Array<{ target: Combatant; healAmount: number }>;
}
```

### 9.5 Testing Strategy

**Unit Tests:**
```typescript
describe('Special Abilities', () => {
  test('King Arthur Excalibur Strike', () => {
    const arthur = new Hero('King Arthur', 'warrior', 10, 'legendary');
    const enemy = new Enemy('Dragon', 15);
    const allies = [arthur, new Hero('Ally 1', 'cleric', 10)];

    // Get special ability
    const skills = arthur.getSkills();
    expect(skills.length).toBe(4); // 3 class + 1 special

    const excalibur = skills[3];
    expect(excalibur.name).toBe('Excalibur Strike');
    expect(excalibur.cooldown).toBe(9);

    // Execute ability
    const result = excalibur.execute(arthur, [enemy]);

    // Verify damage
    expect(result.damage).toBeGreaterThan(arthur.ATK * 2.5);
    expect(enemy.currentHP).toBeLessThan(enemy.maxHP);

    // Verify healing
    expect(result.healResults).toBeDefined();
    expect(result.healResults.length).toBe(2);
  });

  test('Valkyrie Divine Resurrection', () => {
    const valkyrie = new Hero('Valkyrie', 'paladin', 10, 'legendary');
    const deadAlly = new Hero('Dead Hero', 'warrior', 10);
    deadAlly.currentHP = 0;
    deadAlly.isAlive = false;

    const skills = valkyrie.getSkills();
    const resurrection = skills[3];

    const result = resurrection.execute(valkyrie, [deadAlly]);

    expect(deadAlly.isAlive).toBe(true);
    expect(deadAlly.currentHP).toBe(Math.floor(deadAlly.maxHP * 0.5));
  });

  test('Epic cooldowns longer than class skills', () => {
    const epic = new Hero('Dragonslayer', 'warrior', 10, 'epic');
    const skills = epic.getSkills();

    const classSkillCooldowns = skills.slice(0, 3).map(s => s.cooldown);
    const specialCooldown = skills[3].cooldown;

    expect(specialCooldown).toBeGreaterThanOrEqual(7);
    expect(Math.max(...classSkillCooldowns)).toBeLessThan(specialCooldown);
  });
});
```

**Integration Tests:**
```typescript
describe('Special Abilities in Combat', () => {
  test('Special ability activates automatically', () => {
    const combat = new CombatEngine();
    const arthur = new Hero('King Arthur', 'warrior', 15, 'legendary');
    const enemy = new Enemy('Boss', 20);

    combat.initialize([arthur], [enemy]);

    // Run until special ability is used
    let usedSpecial = false;
    while (combat.isActive && !usedSpecial) {
      combat.executeTurn();

      // Check combat log
      const lastLog = combat.combatLog[combat.combatLog.length - 1];
      if (lastLog.message.includes('Excalibur Strike')) {
        usedSpecial = true;
      }
    }

    expect(usedSpecial).toBe(true);
  });
});
```

---

## 10. Progression & Upgrade Path

### 10.1 Current System (No Changes Required)

**Level Scaling:**
- All abilities scale with hero stats (ATK, DEF, HP, etc.)
- Higher level = stronger special abilities naturally
- No additional progression needed for Phase 1

**Talent Points:**
- Existing system applies (+5% stats per point, max 6)
- Epic/Legendary get talent points from duplicates
- Special abilities benefit from stat increases

### 10.2 Future Enhancement (Phase 2+)

**Special Ability Upgrades:**
```typescript
interface SpecialAbilityUpgrade {
  level: number;              // Upgrade level (1-5)
  requirement: number;        // Duplicate heroes needed
  effects: {
    cooldownReduction?: number;   // -1 turn per level
    damageIncrease?: number;      // +10% per level
    durationIncrease?: number;    // +1 turn per level
    targetIncrease?: number;      // +1 target per level
  };
}

// Example: Excalibur Strike upgrades
const excaliburUpgrades: SpecialAbilityUpgrade[] = [
  { level: 1, requirement: 0, effects: {} }, // Base
  { level: 2, requirement: 1, effects: { damageIncrease: 10 } }, // 330% dmg
  { level: 3, requirement: 2, effects: { damageIncrease: 20 } }, // 360% dmg
  { level: 4, requirement: 3, effects: { cooldownReduction: 1 } }, // 8 turn CD
  { level: 5, requirement: 5, effects: { damageIncrease: 30 } }, // 390% dmg
];
```

**Why Future:**
- Adds complexity to initial launch
- Requires UI for upgrade tracking
- Needs careful balance testing
- Better suited for post-launch content update

### 10.3 Synergy System (Phase 3)

**Team Composition Bonuses:**
```typescript
// Example: "Divine Trinity" - Valkyrie + Ancient Sage + Divine Champion
interface TeamSynergy {
  name: string;
  heroes: string[];           // Hero IDs required
  bonus: {
    description: string;
    effect: StatusEffect;
  };
}

const divineTrinity: TeamSynergy = {
  name: 'Divine Trinity',
  heroes: ['legendary_valkyrie', 'legendary_sage', 'epic_divine_champion'],
  bonus: {
    description: 'All allies gain +20% DEF and heal 2% max HP per turn',
    effect: {
      name: 'Divine Trinity',
      duration: 999, // Permanent while trio alive
      type: 'buff',
      stat: 'DEF',
      value: 20
      // regen: 2% max HP
    }
  }
};
```

---

## 11. Balancing Common/Rare Heroes

### 11.1 The Problem

Without special abilities, Common and Rare heroes might feel underpowered compared to Epic/Legendary. We need to ensure they remain viable.

### 11.2 Compensation Mechanisms

**1. Talent Point Advantage**
```typescript
// Duplicate summoning rates
Common: 60% chance → Easier to max talent points (6/6)
Rare: 25% chance → Moderate talent point accumulation
Epic: 12% chance → Slower talent point accumulation
Legendary: 3% chance → Very slow talent point accumulation

// Talent scaling
Each talent point = +5% to all stats
6/6 talents = +30% stats

// Example comparison:
Legendary hero (0 talents, 1.6x base, special ability)
  vs
Common hero (6 talents, 1.3x from talents, no special)

Effective power:
- Legendary: 1.6x * special ability value
- Common: 1.3x * better gear potential (more drops)
```

**2. Equipment Scaling**
- All rarities benefit equally from equipment
- F2P players can farm better gear over time
- Late game: Equipment > Special abilities in power contribution

**3. Role Specialization**
```typescript
// Common/Rare heroes excel at specific roles
const commonWarriorTank = {
  stats: { HP: high, DEF: high, ATK: medium },
  strengths: ['Pure tank', 'No special needed for role'],
  useCase: 'Absorb damage while Epic DPS carries'
};

const rareClericHealer = {
  stats: { healing: high, survivability: medium },
  strengths: ['Consistent healing', 'Lower cooldown skills'],
  useCase: 'Primary healer, Epic abilities are bonus not required'
};
```

**4. Team Composition Flexibility**
```typescript
// Viable team archetypes
const f2pTeam = {
  tank: 'Common Warrior (6 talents, good tank gear)',
  healer: 'Rare Cleric (4 talents, healing focus)',
  dps1: 'Rare Archer (5 talents, crit gear)',
  dps2: 'Epic Mage (1 talent, AoE special)',
  result: 'Clears medium difficulty content'
};

const whaleTeam = {
  tank: 'Legendary King Arthur (3 talents, best gear)',
  healer: 'Legendary Ancient Sage (2 talents)',
  dps1: 'Epic Shadow Blade (3 talents)',
  dps2: 'Epic Phoenix Archer (2 talents)',
  result: 'Clears nightmare difficulty faster'
};
```

### 11.3 Content Tuning

**Easy/Medium Dungeons:**
- Balanced for Common/Rare teams
- Special abilities provide speed, not necessity

**Hard Dungeons:**
- Benefit from 1-2 Epic heroes
- Doable with well-geared Commons

**Nightmare Dungeons:**
- Require at least 1 Epic
- Legendary heroes provide significant advantage
- Endgame aspirational content

### 11.4 PvP Considerations (Future)

**Arena Matchmaking:**
- Match by total team power (includes talents, gear, rarity)
- Legendary + Commons ≈ Full Epic team in matchmaking score
- Skill-based strategy can overcome rarity disadvantage

---

## 12. Testing & Tuning

### 12.1 Testing Checklist

**Functional Testing:**
- [ ] All 20 special abilities execute without errors
- [ ] Cooldowns apply and tick correctly
- [ ] Damage calculations match design specs
- [ ] Healing caps at max HP
- [ ] Status effects apply with correct duration
- [ ] Resurrection restores hero to alive state
- [ ] AoE abilities hit all valid targets
- [ ] Combat log displays ability usage
- [ ] Special abilities appear as 4th skill
- [ ] Common/Rare heroes have 3 skills only

**Balance Testing:**
- [ ] Epic abilities ~2x stronger than class skills
- [ ] Legendary abilities ~3x stronger than class skills
- [ ] Cooldowns prevent ability spam
- [ ] Epic hero clears medium dungeon ~30% faster than Rare
- [ ] Legendary hero clears hard dungeon ~50% faster than Epic
- [ ] Common team can clear medium difficulty (gear-dependent)
- [ ] Mixed rarity teams viable (1 Epic + 3 Commons works)

**AI Testing:**
- [ ] Heroes prioritize special abilities when available
- [ ] Targeting selects optimal targets (lowest HP for heal, etc.)
- [ ] No infinite loops or stuck states
- [ ] Special abilities used before death if available

**Edge Cases:**
- [ ] Resurrection works if all allies dead except caster
- [ ] Abilities handle 1v1 combat (single enemy/ally)
- [ ] Cooldowns persist between dungeon rooms
- [ ] Abilities work correctly with status effects (stun, immunity)
- [ ] Critical hits work correctly for special abilities

### 12.2 Tuning Parameters

**Adjustable Values:**
```typescript
const TUNING_CONFIG = {
  EPIC_ABILITY_COOLDOWN: 8,        // 7-9 range
  LEGENDARY_ABILITY_COOLDOWN: 10,  // 9-11 range
  EPIC_POWER_MULTIPLIER: 2.2,      // 2.0-2.5x class skills
  LEGENDARY_POWER_MULTIPLIER: 3.0, // 2.5-3.5x class skills

  // Individual ability tuning
  EXCALIBUR_DAMAGE: 3.0,          // 2.5-3.5 ATK multiplier
  EXCALIBUR_HEAL: 0.2,            // 15-25% max HP
  TIME_STOP_DURATION: 2,          // 1-3 turns
  RESURRECTION_HP: 0.5,           // 40-60% max HP
};
```

**Metrics to Track:**
```typescript
interface AbilityMetrics {
  abilityName: string;
  usageCount: number;
  averageDamage: number;
  averageHealing: number;
  killRate: number;              // % of times enemy killed
  survivalImpact: number;        // % fights won due to ability
  cooldownUtilization: number;   // % of cooldowns fully utilized
}
```

**Balance Indicators:**
```
Good Balance:
- Epic heroes used in 60-80% of hard dungeon clears
- Legendary heroes used in 80-95% of nightmare clears
- Common teams can clear 70%+ of medium dungeons
- No single ability has >50% usage rate in endgame

Needs Tuning:
- One ability dominates (>70% usage)
- Legendary feels mandatory (>95% usage)
- Common teams fail >50% of medium dungeons
- Epic abilities barely stronger than class skills
```

### 12.3 Player Feedback Loop

**Data Collection:**
```typescript
interface CombatTelemetry {
  teamComposition: {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
  };
  dungeonDifficulty: 'easy' | 'medium' | 'hard' | 'nightmare';
  victory: boolean;
  combatDuration: number; // turns
  specialAbilitiesUsed: string[];
  heroesDied: number;
}
```

**Iteration Cycle:**
1. **Week 1-2:** Launch with conservative balance (longer CDs, lower damage)
2. **Week 3:** Analyze telemetry, identify underperforming abilities
3. **Week 4:** Buff week (increase power of weak abilities)
4. **Week 5:** Nerf week if needed (reduce OP abilities)
5. **Week 6+:** Fine-tuning based on player feedback

---

## 13. Future Expansion

### 13.1 Phase 2 Features

**Ability Upgrades (3-6 months post-launch):**
- Duplicate heroes unlock ability upgrades
- 5 upgrade levels per ability
- Cooldown reduction, damage increase, new effects

**Awakening System:**
```typescript
interface AwakenedAbility {
  baseAbility: Skill;
  awakening: {
    level: number;              // 1-3 awakening tiers
    newEffect: string;
    powerIncrease: number;

    // Example: Excalibur Strike Awakening 3
    // "Now also grants all allies +30% ATK for 2 turns"
  };
}
```

**Manual Control Mode:**
- Toggle auto-ability usage
- Hold abilities for strategic timing
- Combo abilities with manual timing

### 13.2 Phase 3 Features

**New Rarity: Mythic (6-12 months):**
```typescript
const mythicHero = {
  rarity: 'mythic',
  gachaRate: 0.5%, // 1/200
  specialAbilities: 2, // Two special abilities
  combatMultiplier: 2.0,
  uniqueMechanic: 'Transform mid-combat'
};
```

**Ability Customization:**
```typescript
interface AbilityMod {
  slotType: 'damage' | 'cooldown' | 'effect';
  options: [
    { name: 'Increased Damage', effect: '+20% damage' },
    { name: 'Reduced Cooldown', effect: '-2 turns CD' },
    { name: 'Added Effect', effect: '+1 turn stun' }
  ];
}

// Players choose 1 mod per ability
// Allows customization without breaking balance
```

**Team Synergies:**
- Faction bonuses (Kingdom, Divine, Elementals, etc.)
- Class synergies (All warriors = +20% DEF)
- Ability combo chains (Time Stop → Headshot = guaranteed crit)

### 13.3 PvP Arena

**Special Ability Considerations:**
```typescript
interface PvPAbilityBalance {
  // Some abilities may need PvP-specific tuning
  resurrectionalternativeEffectInPvP: 'Restore 30% HP to living allies instead';
  timeStopCounterplay: 'Immunity abilities can be used while frozen';
  balancingMechanism: 'First ability usage limited to turn 3+';
}
```

### 13.4 Seasonal/Event Abilities

**Limited-Time Abilities:**
```typescript
interface EventAbility {
  name: 'Frostmas Blizzard';
  availability: 'December seasonal event';
  heroRequired: 'Frost Queen';
  effect: 'Enhanced Frozen Prison with +50% damage and 2 turn freeze';
  powerLevel: 'Between Epic and Legendary';
}
```

---

## Appendix A: Quick Reference

### Common/Rare Heroes (No Special Abilities)
- **Strengths:** Easier to obtain, faster talent point accumulation, viable with good gear
- **Weaknesses:** No 4th skill, lower base multiplier
- **Best Use:** F2P progression, role specialists, budget team building

### Epic Heroes (15 heroes, 7-8 turn cooldowns)
- **Strengths:** Strong special abilities, 1.4x multiplier, reasonably obtainable
- **Weaknesses:** Harder to max talents, needs duplicates for upgrades
- **Best Use:** Core team members, specialist roles, hard dungeon clears

### Legendary Heroes (5 heroes, 9-10 turn cooldowns)
- **Strengths:** Game-changing abilities, 1.6x multiplier, prestige factor
- **Weaknesses:** Very rare (3%), slow talent accumulation, not mandatory
- **Best Use:** Endgame content, boss fights, collection goals

### Power Budget Guidelines
- **Class Skill:** 100 points, 2-5 turn cooldown
- **Epic Ability:** 180-240 points, 7-8 turn cooldown
- **Legendary Ability:** 270-400 points, 9-10 turn cooldown

### Implementation Priority
1. **Phase 1 (Week 1-2):** Core mechanics, 5 Legendary abilities, combat integration
2. **Phase 2 (Week 3-4):** 15 Epic abilities, balance testing, polish
3. **Phase 3 (Month 2):** UI enhancements, advanced mechanics (DoT, summons)
4. **Phase 4 (Month 3+):** Ability upgrades, synergies, seasonal content

---

## Appendix B: Changelog

**v1.0 - 2025-11-16**
- Initial design document
- Defined all 20 special abilities
- Established power budget framework
- Created implementation roadmap
- Balance tuning guidelines

---

## Document Approval

**Status:** Draft - Pending Review
**Next Steps:**
1. Review with dev team
2. Prototype 3 abilities (1 Legendary, 2 Epic)
3. Playtest in isolated combat scenarios
4. Adjust cooldowns/power based on testing
5. Green-light full implementation

---

**END OF DESIGN DOCUMENT**
