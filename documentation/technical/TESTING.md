# Automatizované Testování

**Vytvořeno:** 2026-01-19
**Verze:** 1.8
**Test Framework:** Vitest 4.0.17

---

## Obsah

1. [Přehled](#přehled)
2. [Jak Spustit Testy](#jak-spustit-testy)
3. [Struktura Testů](#struktura-testů)
4. [Testované Systémy](#testované-systémy)
5. [Nalezené a Opravené Bugy](#nalezené-a-opravené-bugy)
6. [Psaní Nových Testů](#psaní-nových-testů)
7. [Best Practices](#best-practices)

---

## Přehled

Projekt používá **Vitest** jako test framework. Vitest je rychlý, Vite-native test runner s podporou TypeScript, ESM modulů a watch mode.

### Statistiky

| Metrika | Hodnota |
|---------|---------|
| Celkem testů | 637 |
| Prošlo | 637 |
| Přeskočeno | 0 |
| Test souborů | 14 |
| Pokrytí | ~70% engine + services |

---

## Jak Spustit Testy

### Základní Příkazy

```bash
# Watch mode (automaticky spouští testy při změně souborů)
npm test

# Jednorázové spuštění všech testů
npm run test:run

# S code coverage reportem
npm run test:coverage
```

### Watch Mode

Watch mode je ideální pro vývoj - testy se automaticky spustí při uložení souboru:

```bash
npm test
```

Výstup:
```
✓ src/engine/combat/CombatEngine.test.ts (29 tests)
✓ src/engine/combat/Enemy.test.ts (35 tests)
✓ src/engine/combat/Skill.test.ts (42 tests)
✓ src/engine/hero/Hero.test.ts (55 tests)
✓ src/engine/item/ItemGenerator.test.ts (40 tests)
✓ src/engine/dungeon/DungeonGenerator.test.ts (39 tests)
✓ src/engine/dungeon/Dungeon.test.ts (53 tests)
✓ src/engine/worldmap/PerlinNoise.test.ts (21 tests)
✓ src/engine/worldmap/WorldMapGenerator.test.ts (46 tests)
✓ src/engine/gacha/GachaSystem.test.ts (68 tests)
✓ src/engine/equipment/Equipment.test.ts (51 tests)
✓ src/config/BALANCE_CONFIG.test.ts (81 tests)
✓ src/services/LocalStorageService.test.ts (44 tests)
✓ src/services/GameSaveService.test.ts (13 tests)

Test Files  14 passed (14)
Tests       637 passed (637)
```

### Code Coverage

Pro generování coverage reportu:

```bash
npm run test:coverage
```

Report se vygeneruje do `coverage/` složky jako HTML.

---

## Struktura Testů

Testovací soubory jsou umístěny vedle zdrojového kódu s příponou `.test.ts`:

```
src/
├── engine/
│   ├── combat/
│   │   ├── CombatEngine.ts
│   │   ├── CombatEngine.test.ts    ← Testy pro combat engine
│   │   ├── Enemy.ts
│   │   ├── Enemy.test.ts           ← Testy pro enemy system
│   │   ├── Skill.ts
│   │   └── Skill.test.ts           ← Testy pro skill system
│   ├── hero/
│   │   ├── Hero.ts
│   │   └── Hero.test.ts            ← Testy pro hero system
│   ├── item/
│   │   ├── Item.ts
│   │   ├── ItemGenerator.ts
│   │   └── ItemGenerator.test.ts   ← Testy pro item generation
│   ├── dungeon/
│   │   ├── Dungeon.ts
│   │   ├── Dungeon.test.ts          ← Testy pro dungeon traversal, loot
│   │   ├── DungeonGenerator.ts
│   │   └── DungeonGenerator.test.ts ← Testy pro dungeon generation
│   ├── worldmap/
│   │   ├── PerlinNoise.ts
│   │   ├── PerlinNoise.test.ts     ← Testy pro procedurální generování
│   │   ├── WorldMapGenerator.ts
│   │   └── WorldMapGenerator.test.ts ← Testy pro world map
│   ├── gacha/
│   │   ├── GachaSystem.ts
│   │   └── GachaSystem.test.ts     ← Testy pro gacha systém
│   └── equipment/
│       ├── Equipment.ts
│       └── Equipment.test.ts       ← Testy pro equipment
├── config/
│   ├── BALANCE_CONFIG.ts
│   └── BALANCE_CONFIG.test.ts      ← Testy pro herní balance
├── services/
│   ├── LocalStorageService.ts
│   ├── LocalStorageService.test.ts ← Testy pro localStorage save/load
│   ├── GameSaveService.ts
│   └── GameSaveService.test.ts     ← Testy pro Supabase save/load
└── test/
    └── setup.ts                    ← Globální setup pro testy
```

### Konfigurace

Vitest konfigurace je v `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],  // Globální mock pro localStorage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/engine/**/*.ts'],
      exclude: ['src/**/*.test.ts']
    }
  }
});
```

### Globální Test Setup

Soubor `src/test/setup.ts` poskytuje mock pro `localStorage` (potřebný pro i18n modul):

```typescript
function createLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null
  };
}
```

---

## Testované Systémy

### 1. Combat Engine (`CombatEngine.test.ts`)

**29 testů** pokrývá:

| Oblast | Testy |
|--------|-------|
| Inicializace | Default values, combat setup |
| Damage kalkulace | Base damage, crit, defense reduction |
| Elemental systém | Weakness (+50%), resistance |
| Status effects | Buffs, debuffs, stun, immunity |
| Combo systém | Multiplier calculation |
| Victory/Defeat | Win/lose detection |
| Enemy generation | Level scaling, type multipliers |

**Klíčové formule testované:**
- Damage: `rawDamage * (100 / (100 + DEF))`
- Crit: `damage * 1.5 * (100 / (100 + DEF * 0.5))`
- Combo: `1.0 + min(comboCount, 5) * 0.1`

### 2. Hero System (`Hero.test.ts`)

**55 testů** pokrývá:

| Oblast | Testy |
|--------|-------|
| Hero creation | All 5 classes, stats, UUID |
| Class stats | Warrior, Archer, Mage, Cleric, Paladin |
| XP/Leveling | XP formula, level up, stat growth |
| Combat Power | Score calculation, rarity multipliers |
| Status effects | Buffs, debuffs, immunity |
| Position system | Front/Middle/Back |
| Skills | 3 skills per class, cooldowns |

**Klíčové formule testované:**
- Required XP: `100 * (level ^ 1.5)`
- Stat growth: +5% HP, +3% ATK/DEF, +2% SPD, +0.5% CRIT per level
- Combat Power: `(HP*0.5) + (ATK*5) + (DEF*3) + (SPD*2) + (CRIT*10) * rarityMultiplier`

### 3. Item Generation (`ItemGenerator.test.ts`)

**37 testů** pokrývá:

| Oblast | Testy |
|--------|-------|
| Basic generation | Level, rarity, slot |
| Rarity scaling | Multipliers (1.0x → 5.0x) |
| Level scaling | Exponential (level^1.2) |
| Slot-specific stats | Weapon=ATK, Armor=HP/DEF, etc. |
| Name generation | Prefixes, slot names |
| Gold value | Rarity, level, enchant scaling |
| Enchanting | Success chance, stat boost |
| Serialization | toJSON, fromJSON, clone |

**Rarity multiplikátory:**
| Rarity | Multiplier |
|--------|------------|
| Common | 1.0x |
| Uncommon | 1.2x |
| Rare | 1.5x |
| Epic | 2.0x |
| Legendary | 3.0x |
| Mythic | 5.0x |

### 4. Dungeon Generator (`DungeonGenerator.test.ts`)

**39 testů** pokrývá:

| Oblast | Testy |
|--------|-------|
| Floor generation | Room count, start/exit/boss rooms |
| Room types | 10 types distribution |
| Connections | Bidirectional, valid directions |
| Room positioning | No overlaps, grid bounds |
| Difficulty scaling | Enemy levels, multipliers |
| Boss rooms | Level boost (1.6x), single boss |
| Special rooms | Treasure, trap, rest, shrine, elite |

**Room typy:**
- `start`, `exit`, `combat`, `boss`, `treasure`
- `trap`, `rest`, `elite`, `shrine`, `mystery`, `miniboss`

### 5. Dungeon System (`Dungeon.test.ts`)

**53 testů** pokrývá:

| Oblast | Testy |
|--------|-------|
| Initialization | Name, floor, room, statistics |
| Room Movement | Valid/invalid directions, status updates |
| Combat Completion | Combat rooms, boss, miniboss flags |
| Loot Recording | Gold, items, statistics tracking |
| Treasure Rooms | Looting, rewards, duplicate prevention |
| Trap Rooms | Disarm success/fail, damage to heroes |
| Rest Rooms | Healing, max HP cap, dead heroes |
| Shrine Rooms | Buffs, active buff tracking |
| Mystery Rooms | Positive/negative events, rewards/damage |
| Floor Progression | Exit validation, floor completion |
| BUG-003 | Room completion validation documentation |

**Klíčové testy:**
- Loot recording: `addLootToStats(gold, itemCount)` správně aktualizuje statistiky
- Room completion: Každý room type má completion flag (treasureLooted, trapDisarmed, etc.)
- Movement validation: Engine nevaliduje completion - validace je na UI vrstvě

**BUG-003 Dokumentace:**
Testy dokumentují bug kde hráči mohou projít non-combat místnostmi bez interakce.

### 6. Perlin Noise (`PerlinNoise.test.ts`)

**21 testů** pokrývá:

| Oblast | Testy |
|--------|-------|
| Determinism | Same seed = same results, reproducibility |
| Value range | Output between -1 and 1 |
| Variety | Positive/negative values, unique outputs |
| Smoothness | Adjacent values similar, scale affects smoothness |
| Octave noise | Multiple layers, persistence parameter |
| Edge cases | Empty seed, unicode, large coordinates |

**Klíčové vlastnosti:**
- Deterministický výstup pro stejný seed
- Hodnoty vždy v rozsahu [-1, 1]
- Plynulé přechody mezi sousedními souřadnicemi
- Octave noise pro detailnější terén

### 7. Enemy System (`Enemy.test.ts`)

**35 testů** pokrývá:

| Oblast | Testy |
|--------|-------|
| Enemy creation | All enemy types, level scaling |
| Type multipliers | HP/ATK/DEF/SPD per type |
| Elite enemies | Double stats, increased rewards |
| Boss enemies | Triple stats, guaranteed drops |
| AI targeting | Position-based, low HP priority |
| Loot generation | XP, gold, drop rates |

### 8. Skill System (`Skill.test.ts`)

**42 testů** pokrývá:

| Oblast | Testy |
|--------|-------|
| Skill definitions | 15 skills across 5 classes |
| Class skills | Warrior, Archer, Mage, Cleric, Paladin |
| Skill types | Attack, heal, buff, debuff |
| Cooldown system | Turn-based cooldowns |
| Damage calculation | Base damage, scaling |
| Effect application | Status effects, healing |

### 9. World Map Generator (`WorldMapGenerator.test.ts`)

**46 testů** pokrývá:

| Oblast | Testy |
|--------|-------|
| Map generation | Size, boundaries, seed |
| Terrain types | Mountains, water, forest, desert |
| Static objects | Dungeons, towns, shrines |
| Enemy spawning | Level zones, spawn density |
| Merchant NPCs | Traveling merchants, shops |
| Determinism | Same seed = same map |

### 10. Gacha System (`GachaSystem.test.ts`)

**68 testů** pokrývá:

| Oblast | Testy |
|--------|-------|
| Drop rates | Rarity distribution |
| Pity system | Guaranteed rare at 10 pulls |
| 10x guarantee | At least one rare in multi |
| Free summons | Daily free summon logic |
| Hero templates | All heroes in pool |
| Probability math | Rate verification |

### 11. Equipment System (`Equipment.test.ts`)

**51 testů** pokrývá:

| Oblast | Testy |
|--------|-------|
| Equipment slots | 8 slot types per hero |
| Equip/unequip | Slot management |
| Stat calculation | Equipment bonuses |
| Set bonuses | 2/4 piece bonuses |
| Slot restrictions | Correct slot types |
| Equipment swapping | Item replacement |

### 12. Balance Config (`BALANCE_CONFIG.test.ts`)

**81 testů** pokrývá:

| Oblast | Testy |
|--------|-------|
| XP formulas | Level requirements |
| Stat growth | Per-level increases |
| Drop rates | Rarity probabilities |
| Combat formulas | Damage, defense, crit |
| Economy | Gold rewards, costs |
| Energy system | Regeneration, costs |

### 13. LocalStorage Service (`LocalStorageService.test.ts`)

**44 testů** pokrývá:

| Oblast | Testy |
|--------|-------|
| Save/Load cycle | Hero persistence |
| Data integrity | ID, XP, HP preservation |
| Hero stats | All fields saved (v1.1.0) |
| Inventory | Items, gold, slots |
| Version migration | v1.0.0 → v1.1.0 |
| Edge cases | Empty data, duplicates |

**Nová pole v v1.1.0:**
- `rarity` - vzácnost hrdiny
- `talentPoints` - talentové body
- `maxHP`, `ATK`, `DEF`, `SPD`, `CRIT` - bojové statistiky

### 14. Game Save Service (`GameSaveService.test.ts`)

**13 testů** pokrývá:

| Oblast | Testy |
|--------|-------|
| Supabase UPSERT | Hero ID preservation |
| Duplicate heroes | Same name, different ID |
| Party order | Active party positions |
| Equipment sync | Equipped items |
| Error handling | DB errors, validation |
| Data integrity | XP mismatch detection |

---

## Nalezené a Opravené Bugy

### BUG-001: Překrývající se pozice místností v DungeonGenerator

**Závažnost:** 🔴 Kritická
**Stav:** ✅ Opraveno (2026-01-19)
**Soubor:** `src/engine/dungeon/DungeonGenerator.ts`
**Funkce:** `positionExitRoom()`, `createBossRoom()`

**Popis:**
Funkce `positionExitRoom()` a `createBossRoom()` mohly vytvořit místnost na pozici, která je již obsazena jinou místností. Bug se vyskytoval v ~60% případů.

**Příčina:**
1. `createBossRoom()` vždy umístila boss na pozici `lastRoom.x + 1` bez kontroly kolize
2. `positionExitRoom()` nastavila `candidatePosition` před smyčkou a použila ji jako fallback i když byla obsazená

**Oprava:**
1. `createBossRoom()` nyní přijímá `existingRooms` parametr a hledá volnou pozici
2. `positionExitRoom()` nyní správně prochází všechny sousední pozice a má fallback pro celý grid
3. Obě funkce mají absolutní fallback pro případ zaplněného gridu

**Změny v kódu:**
```typescript
// createBossRoom() - nový parametr
private static createBossRoom(
  nearPosition: { x: number; y: number },
  gridSize: number,
  floorNumber: number,
  difficulty: number,
  existingRooms: Room[],  // NEW
  heroLevel?: number
): Room

// positionExitRoom() - opravená logika
for (const offset of adjacentOffsets) {
  // ... find free position
  if (!occupiedPositions.has(posKey)) {
    exitRoom.position = { x: testX, y: testY };
    return;  // Early return when found
  }
}
```

**Test:**
Stress test s 50 iteracemi potvrzuje 0% míru kolizí.

### BUG-002: Mizející hrdinové při save/load

**Závažnost:** 🔴 Kritická
**Stav:** ✅ Opraveno (2026-01-19)
**Soubory:**
- `src/services/LocalStorageService.ts`
- `src/hooks/useGameState.ts`

**Popis:**
Hrdinové mizeli z účtu při ukládání/načítání hry. Problém měl 3 příčiny.

**Příčina 1: LocalStorage neukládala všechna pole hrdinů**
```typescript
// PŘED: Chyběla pole
heroes: {
  id, name, class, level, experience, requiredXP, currentHP, equippedItems
}

// PO: Přidána všechna pole
heroes: {
  id, name, class, rarity, level, experience, requiredXP, talentPoints,
  currentHP, maxHP, ATK, DEF, SPD, CRIT, equippedItems
}
```

**Příčina 2: Deduplikace používala name+class místo ID**
```typescript
// PŘED: Slučovala gacha duplikáty
const heroKey = `${hero.name}-${hero.class}`;

// PO: Zachovává gacha duplikáty (různá ID)
const heroKey = hero.id;
```

**Příčina 3: Active party lookup při merge mohl selhat**
```typescript
// PŘED: Hledání pouze podle name+class
return uniqueHeroes.find(h => h.name === partyHero.name && h.class === partyHero.class);

// PO: Nejdřív ID, pak name+class
const sameHero = uniqueHeroes.find(h => h.id === partyHero.id);
if (sameHero) return sameHero;
return uniqueHeroes.find(h => h.name === partyHero.name && h.class === partyHero.class);
```

**Oprava:**
1. LocalStorageService verze zvýšena na 1.1.0
2. Přidána migrace pro staré uložené hry
3. Deduplikace změněna na ID-based
4. Party lookup vylepšen

**Test:**
44 testů v `LocalStorageService.test.ts` ověřuje správné ukládání všech polí.

### BUG-003: Hráči mohou projít místnostmi bez interakce

**Závažnost:** 🟡 Střední
**Stav:** ✅ Opraveno (2026-01-19)
**Soubor:** `src/components/DungeonExplorer.tsx`
**Funkce:** `handleMove()`, `getRoomBlockMessage()`

**Popis:**
Hráči mohli opustit non-combat místnosti (treasure, trap, rest, shrine, mystery) bez provedení akce v místnosti. To jim umožňovalo přeskočit obsah a potenciálně zmeškávat loot.

**Příčina:**
Funkce `handleMove()` v `DungeonExplorer.tsx` pouze validovala combat místnosti.

**Oprava:**
Přidána nová funkce `getRoomBlockMessage()` která kontroluje completion flag pro každý typ místnosti:

```typescript
const getRoomBlockMessage = (): string | null => {
  if (!currentRoom) return null;

  switch (currentRoom.type) {
    case 'combat':
    case 'elite':
      if (!currentRoom.combatCompleted) return t('dungeon.mustDefeatEnemies');
      break;
    case 'boss':
      if (!currentRoom.bossDefeated) return t('dungeon.mustDefeatBoss');
      break;
    case 'treasure':
      if (!currentRoom.treasureLooted) return t('dungeon.mustLootTreasure');
      break;
    case 'trap':
      if (!currentRoom.trapDisarmed) return t('dungeon.mustDisarmTrap');
      break;
    // ... atd.
  }
  return null;
};
```

**Validované místnosti (po opravě):**
| Room Type | Completion Flag | Blokuje pohyb? |
|-----------|-----------------|----------------|
| combat | combatCompleted | ✅ Ano |
| boss | bossDefeated | ✅ Ano |
| elite | combatCompleted | ✅ Ano |
| miniboss | miniBossDefeated | ✅ Ano |
| treasure | treasureLooted | ✅ Ano |
| trap | trapDisarmed | ✅ Ano |
| rest | restUsed | ❌ Ne (volitelné) |
| shrine | shrineUsed | ❌ Ne (volitelné) |
| mystery | mysteryResolved | ✅ Ano |
| start | - | ❌ Ne (žádný požadavek) |
| exit | - | ❌ Ne (žádný požadavek) |

**Poznámka (2026-01-19):** Rest a shrine místnosti byly změněny na volitelné - hráč je může přeskočit.

**Změny:**
1. `DungeonExplorer.tsx`: Přidána funkce `getRoomBlockMessage()`
2. `DungeonExplorer.tsx`: Aktualizován `handleMove()` pro použití nové funkce
3. `DungeonExplorer.tsx`: Aktualizován `isMovementBlocked` prop pro DungeonMinimap
4. `en.ts` + `cs.ts`: Přidány lokalizační klíče pro zprávy

**Test:**
53 testů v `Dungeon.test.ts` dokumentuje chování dungeon systému.

### BUG-004: Inventory DELETE+INSERT pattern může ztratit itemy

**Závažnost:** 🔴 Kritická
**Stav:** ✅ Opraveno (2026-01-19)
**Soubor:** `src/services/GameSaveService.ts`
**Funkce:** `saveGame()`

**Popis:**
Při ukládání inventáře se používal DELETE + INSERT pattern. Pokud DELETE uspěl ale INSERT selhal (např. kvůli síťové chybě), položky byly nenávratně ztraceny.

**Příčina:**
```typescript
// PŘED: Nebezpečný pattern
await supabase.from('inventory_items').delete().eq('game_save_id', id);
await supabase.from('inventory_items').insert(items); // Pokud selže, itemy jsou ztraceny!
```

**Oprava:**
Implementován bezpečný transakční pattern s dočasnou lokací:
```typescript
// PO: Bezpečný pattern
const tempLocation = `inventory_temp_${Date.now()}`;

// 1. Insert nové položky s temp lokací
await supabase.from('inventory_items').insert(items.map(i => ({...i, location: tempLocation})));

// 2. Pokud uspělo, delete staré
await supabase.from('inventory_items').delete().eq('location', 'inventory');

// 3. Update temp na finální lokaci
await supabase.from('inventory_items').update({location: 'inventory'}).eq('location', tempLocation);
```

**Výhody:**
- Pokud INSERT selže, cleanup odstraní temp položky a staré zůstávají
- Atomický přechod - nikdy neztrácíme data
- Fallback pro prázdný inventář

### BUG-005: Dungeon generátor vytváří neplatné spojení

**Závažnost:** 🟡 Střední
**Stav:** ✅ Opraveno (2026-01-19)
**Soubor:** `src/engine/dungeon/DungeonGenerator.ts`
**Funkce:** `connectRooms()`

**Popis:**
Když `findNextPosition()` nenašel sousední volnou pozici, vrátil vzdálenější pozici v gridu. Funkce `connectRooms()` pak vytvořila spojení mezi místnostmi, které nebyly sousední, což způsobovalo, že hráč nemohl projít (spojení vedlo do prázdna).

**Příčina:**
```typescript
// PŘED: connectRooms() nevěřovala vzdálenost
private static connectRooms(from: Room, to: Room): void {
  const dx = to.position.x - from.position.x;
  const dy = to.position.y - from.position.y;
  // Vytvořilo spojení i pro dx=5, dy=3 atd.
}
```

**Oprava:**
Přidána validace manhattanské vzdálenosti:
```typescript
// PO: Pouze sousední místnosti (vzdálenost = 1)
private static connectRooms(from: Room, to: Room): void {
  const dx = to.position.x - from.position.x;
  const dy = to.position.y - from.position.y;

  const manhattanDistance = Math.abs(dx) + Math.abs(dy);
  if (manhattanDistance !== 1) {
    return; // Přeskočit neplatné spojení
  }
  // ... zbytek logiky
}
```

**Test:**
`DungeonGenerator.test.ts` ověřuje validní spojení mezi místnostmi.

---

## Psaní Nových Testů

### Základní Struktura

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MyClass } from './MyClass';

// Mock i18n (browser dependencies)
vi.mock('../../localization/i18n', () => ({
  t: (key: string) => key
}));

describe('MyClass', () => {
  let instance: MyClass;

  beforeEach(() => {
    instance = new MyClass();
  });

  describe('methodName', () => {
    it('should do something specific', () => {
      const result = instance.methodName();
      expect(result).toBe(expectedValue);
    });
  });
});
```

### Mockování i18n

Většina engine souborů používá lokalizaci. Pro testy je potřeba mockovat:

```typescript
vi.mock('../../localization/i18n', () => ({
  t: (key: string) => key
}));
```

### Testování Náhodných Hodnot

Pro testy s náhodností použij více iterací:

```typescript
it('should generate various rarities', () => {
  const rarities = new Set<string>();

  for (let i = 0; i < 100; i++) {
    const item = ItemGenerator.generate(5, 'rare');
    rarities.add(item.rarity);
  }

  expect(rarities.size).toBeGreaterThan(1);
});
```

### Testování Probabilistických Systémů

```typescript
it('should have ~15% crit rate', () => {
  let crits = 0;
  const iterations = 1000;

  for (let i = 0; i < iterations; i++) {
    const result = hero.attack(enemy);
    if (result?.isCrit) crits++;
  }

  const critRate = crits / iterations;
  expect(critRate).toBeGreaterThan(0.10);
  expect(critRate).toBeLessThan(0.25);
});
```

---

## Best Practices

### DO ✅

1. **Testuj business logiku, ne implementaci**
   ```typescript
   // Good: Test výsledku
   expect(hero.level).toBe(2);

   // Bad: Test interních proměnných
   expect(hero._internalLevelCounter).toBe(2);
   ```

2. **Používej descriptivní názvy testů**
   ```typescript
   // Good
   it('should increase ATK by 30% when buff is applied')

   // Bad
   it('buff test')
   ```

3. **Izoluj testy pomocí beforeEach**
   ```typescript
   beforeEach(() => {
     hero = new Hero('Test', 'warrior', 1);
   });
   ```

4. **Testuj edge cases**
   - Nulové hodnoty
   - Maximální hodnoty
   - Negativní hodnoty
   - Prázdné pole

### DON'T ❌

1. **Netestuj privátní metody přímo**
2. **Nevytvářej testy závislé na pořadí**
3. **Nepoužívej hardcoded timeouts** (kromě async testů)
4. **Nemockuj více než je nutné**

---

## Přidání Nového Test Souboru

1. Vytvoř soubor `*.test.ts` vedle testovaného kódu
2. Přidej mock pro i18n
3. Napiš testy
4. Spusť `npm test` pro ověření

---

## Troubleshooting

### Testy nevidí změny

```bash
# Restartuj watch mode
Ctrl+C
npm test
```

### Mock nefunguje

Ujisti se, že cesta v `vi.mock()` je správná relativní cesta k souboru.

### Test timeout

Pro dlouhé testy přidej timeout:

```typescript
it('long running test', async () => {
  // ...
}, 10000); // 10 sekund
```

---

## Changelog

### 2026-01-19 - v1.7
- **Opraven BUG-003** (hráči mohli projít místnostmi bez interakce)
- DungeonExplorer: Přidána funkce `getRoomBlockMessage()` pro validaci všech místností
- DungeonExplorer: Aktualizován `handleMove()` a `isMovementBlocked`
- Přidány lokalizační klíče pro nové zprávy (EN + CS)
- **Celkem 637 testů, všechny procházejí**

### 2026-01-19 - v1.6
- **Zdokumentován BUG-003** (hráči mohou projít místnostmi bez interakce)
- Přidány testy pro Dungeon System (53 testů)
- Testy pro room traversal, loot recording, completion flags
- Testy dokumentující bug v DungeonExplorer.tsx
- **Celkem 637 testů, všechny procházejí**

### 2026-01-19 - v1.5
- **Opraven BUG-002** (mizející hrdinové při save/load)
- LocalStorageService: Přidána pole rarity, talentPoints, maxHP, ATK, DEF, SPD, CRIT
- LocalStorageService: Přidána migrace z v1.0.0 na v1.1.0
- useGameState: Opravena deduplikace z name+class na ID
- useGameState: Vylepšen party lookup při merge hrdinů
- Přidány testy pro LocalStorageService (44 testů)
- Přidány testy pro GameSaveService (13 testů)
- **Celkem 584 testů, všechny procházejí**

### 2026-01-19 - v1.4
- Přidány testy pro Enemy System (35 testů)
- Přidány testy pro Skill System (42 testů)
- Celkem 530 testů, všechny procházejí

### 2026-01-19 - v1.3
- Přidány testy pro GachaSystem (68 testů)
- Přidány testy pro Equipment (51 testů)
- Přidány testy pro WorldMapGenerator (46 testů)
- Přidány testy pro BALANCE_CONFIG (81 testů)
- Přidán globální test setup pro localStorage mock
- Celkem 453 testů, všechny procházejí

### 2026-01-19 - v1.2
- Přidány testy pro PerlinNoise (21 testů)
- Testování determinismu, rozsahu hodnot, smoothness
- Celkem 184 testů, všechny procházejí

### 2026-01-19 - v1.1
- Opraven BUG-001 (room overlap v DungeonGenerator)
- Přidány 2 nové testy pro ověření opravy
- Celkem 163 testů, všechny procházejí

### 2026-01-19 - v1.0
- Inicializace test suite
- 161 testů pro Combat, Hero, Item, Dungeon systémy
- Nalezen BUG-001 (room overlap)
