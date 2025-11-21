# 🎨 PHASE 1: UI/UX Improvements ✅ COMPLETED

> **Quick wins s okamžitým vizuálním impaktem**
>
> ⏱️ Odhadovaný čas: 8-12 hodin
> 🔴 Priorita: HIGH
> 📦 Závislosti: Žádné
n> ✅ **STAV: HOTOVO** (2025-11-21)

---

## 📋 Obsah PHASE 1

1. [Combat Speed Controls](#step-1-combat-speed-controls) - 1-2h
2. [Initiative Order Bar](#step-2-initiative-order-bar) - 2-3h
3. [Active Character Highlighting](#step-3-active-character-highlighting) - 1h
4. [Responsive Layout Fixes](#step-4-responsive-layout-fixes) - 2-3h
5. [Tooltips System](#step-5-tooltips-system) - 2-3h

---

## 🎯 STEP 1: Combat Speed Controls

### Cíl
Přidat přepínač rychlosti combatu (1x, 2x, 4x) pro lepší player control.

### Implementace

#### 1.1 Přidat config konstanty

**Soubor:** `src/config/BALANCE_CONFIG.ts`

```typescript
// Přidat do COMBAT_CONFIG
export const COMBAT_CONFIG = {
  // ... existing config

  // Combat speed presets
  SPEED_PRESETS: {
    NORMAL: 1000,   // 1x - 1 second per turn
    FAST: 500,      // 2x - 0.5 seconds per turn
    VERY_FAST: 250  // 4x - 0.25 seconds per turn
  } as const,

  DEFAULT_SPEED: 'NORMAL' as 'NORMAL' | 'FAST' | 'VERY_FAST'
};

export type CombatSpeed = keyof typeof COMBAT_CONFIG.SPEED_PRESETS;
```

#### 1.2 Přidat state do Router.tsx

**Soubor:** `src/Router.tsx`

```typescript
// Přidat k ostatním combat state variables (cca řádek 72)
const [combatSpeed, setCombatSpeed] = useState<CombatSpeed>('NORMAL');

// Update runDungeonAutoCombat function (řádek 671)
const runDungeonAutoCombat = async () => {
  while (combatEngine.isActive && !combatEngine.waitingForPlayerInput) {
    combatEngine.executeTurn();
    setCombatLog([...combatEngine.combatLog]);
    forceUpdate({});

    // Wait between turns - USE DYNAMIC SPEED
    if (combatEngine.isActive && !combatEngine.waitingForPlayerInput) {
      await new Promise(resolve =>
        setTimeout(resolve, COMBAT_CONFIG.SPEED_PRESETS[combatSpeed])
      );
    }
  }
};

// Update runQuickAutoCombat function (řádek 367) - STEJNÁ ZMĚNA
const runQuickAutoCombat = async () => {
  while (combatEngine.isActive && !combatEngine.waitingForPlayerInput) {
    combatEngine.executeTurn();
    setCombatLog([...combatEngine.combatLog]);
    forceUpdate({});

    await new Promise(resolve =>
      setTimeout(resolve, COMBAT_CONFIG.SPEED_PRESETS[combatSpeed])
    );
  }
};
```

#### 1.3 Přidat Speed Selector UI

**Soubor:** `src/Router.tsx` (v combat display JSX, řádek 888)

```typescript
{/* Combat Display - shown when combat is active */}
{combatActive && (inDungeon && currentDungeon || !inDungeon) && (
  <div style={{...}}>
    {/* Combat Header */}
    <div style={{...}}>
      {/* Existing header content */}
    </div>

    {/* ===== NOVÝ KÓD: Speed Controls ===== */}
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '20px',
      padding: '10px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <span style={{
        fontSize: '0.9em',
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '600'
      }}>
        ⚡ Combat Speed:
      </span>

      {(['NORMAL', 'FAST', 'VERY_FAST'] as CombatSpeed[]).map((speed) => (
        <button
          key={speed}
          onClick={() => setCombatSpeed(speed)}
          disabled={!combatEngine.isActive || combatEngine.combatResult !== null}
          style={{
            padding: '8px 16px',
            background: combatSpeed === speed
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            border: combatSpeed === speed
              ? '2px solid #a78bfa'
              : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            cursor: combatEngine.isActive && !combatEngine.combatResult ? 'pointer' : 'not-allowed',
            fontSize: '0.85em',
            fontWeight: '600',
            transition: 'all 0.2s',
            opacity: combatEngine.isActive && !combatEngine.combatResult ? 1 : 0.5,
            boxShadow: combatSpeed === speed
              ? '0 2px 8px rgba(102, 126, 234, 0.4)'
              : 'none'
          }}
        >
          {speed === 'NORMAL' ? '1x' : speed === 'FAST' ? '2x' : '4x'}
        </button>
      ))}

      <div style={{
        marginLeft: '10px',
        padding: '6px 12px',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '6px',
        fontSize: '0.75em',
        color: '#10b981',
        fontWeight: '600'
      }}>
        {combatSpeed === 'NORMAL' ? '1.0s' :
         combatSpeed === 'FAST' ? '0.5s' : '0.25s'} per turn
      </div>
    </div>
    {/* ===== KONEC NOVÉHO KÓDU ===== */}

    {/* Defeat Screen - Exit Button */}
    {/* ... rest of combat UI ... */}
```

### ✅ Testing Checklist

- [ ] Speed selector se zobrazí v combat screenu
- [ ] Default rychlost je 1x (NORMAL)
- [ ] Kliknutí na 2x/4x změní rychlost v real-time
- [ ] Delay mezi tahy odpovídá zvolené rychlosti
- [ ] Buttony jsou disabled po skončení combatu
- [ ] Funguje v dungeon i quick combatu
- [ ] UI je responsive (vejde se na mobile)

---

## 🎯 STEP 2: Initiative Order Bar

### Cíl
Zobrazit pořadí tahů všech postav nahoře v combat screenu.

### Implementace

#### 2.1 Vytvořit InitiativeBar komponentu

**Soubor:** `src/components/combat/InitiativeBar.tsx` (NOVÝ)

```typescript
/**
 * Initiative Order Bar - Shows turn order in combat
 */
import React from 'react';
import type { Combatant } from '../../types/combat.types';

interface InitiativeBarProps {
  turnOrder: Combatant[];
  currentCharacter: Combatant | null;
}

export const InitiativeBar: React.FC<InitiativeBarProps> = ({
  turnOrder,
  currentCharacter
}) => {
  if (turnOrder.length === 0) return null;

  return (
    <div style={styles.container}>
      <div style={styles.label}>
        🎯 Turn Order:
      </div>

      <div style={styles.orderList}>
        {turnOrder.map((character, index) => {
          const isActive = currentCharacter?.id === character.id;
          const isEnemy = 'isEnemy' in character && character.isEnemy;
          const isDead = !character.isAlive;

          return (
            <div
              key={`${character.id}-${index}`}
              style={{
                ...styles.characterCard,
                borderColor: isActive
                  ? '#fbbf24'
                  : isEnemy ? '#ef4444' : '#3b82f6',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.3) 100%)'
                  : isDead
                  ? 'rgba(0, 0, 0, 0.4)'
                  : isEnemy
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(59, 130, 246, 0.1)',
                opacity: isDead ? 0.4 : 1,
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                boxShadow: isActive
                  ? '0 4px 12px rgba(251, 191, 36, 0.5)'
                  : 'none'
              }}
            >
              {/* Character avatar/icon */}
              <div style={styles.avatar}>
                {isEnemy ? '👹' : '⚔️'}
              </div>

              {/* Character info */}
              <div style={styles.info}>
                <div style={styles.name}>
                  {character.name}
                </div>
                <div style={styles.initiative}>
                  Init: {character.initiative}
                </div>
              </div>

              {/* HP indicator */}
              <div style={styles.hpDot}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: character.currentHP / character.maxHP > 0.5
                    ? '#10b981'
                    : character.currentHP / character.maxHP > 0.25
                    ? '#f59e0b'
                    : '#ef4444'
                }} />
              </div>

              {/* Active indicator */}
              {isActive && (
                <div style={styles.activeIndicator}>
                  ▶️
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginBottom: '20px',
    padding: '15px',
    background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(31, 41, 55, 0.8) 100%)',
    borderRadius: '12px',
    border: '2px solid rgba(139, 92, 246, 0.3)',
    backdropFilter: 'blur(10px)'
  },
  label: {
    fontSize: '0.9em',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '12px',
    textAlign: 'center'
  },
  orderList: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    padding: '8px 4px',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(139, 92, 246, 0.5) rgba(0, 0, 0, 0.2)'
  },
  characterCard: {
    minWidth: '100px',
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    position: 'relative',
    transition: 'all 0.3s ease',
    cursor: 'default'
  },
  avatar: {
    fontSize: '1.8em',
    lineHeight: '1'
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px'
  },
  name: {
    fontSize: '0.75em',
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    maxWidth: '80px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  initiative: {
    fontSize: '0.65em',
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500'
  },
  hpDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    padding: '2px'
  },
  activeIndicator: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    fontSize: '1.2em',
    animation: 'pulse 1.5s ease-in-out infinite'
  }
};
```

#### 2.2 Přidat CSS animaci pro pulse

**Soubor:** `src/index.css`

```css
/* Přidat na konec souboru */

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}
```

#### 2.3 Integrovat do Router.tsx

**Soubor:** `src/Router.tsx`

```typescript
// Import na začátku souboru (řádek 40)
import { InitiativeBar } from './components/combat/InitiativeBar';

// V combat display JSX (PO speed controls, před Defeat Screen)
{combatActive && (inDungeon && currentDungeon || !inDungeon) && (
  <div style={{...}}>
    {/* Combat Header */}
    {/* Speed Controls */}

    {/* ===== NOVÝ KÓD: Initiative Bar ===== */}
    <InitiativeBar
      turnOrder={combatEngine.turnOrder}
      currentCharacter={activeCharacter}
    />
    {/* ===== KONEC NOVÉHO KÓDU ===== */}

    {/* Defeat Screen */}
    {/* ... */}
```

### ✅ Testing Checklist

- [ ] Initiative bar se zobrazí na začátku combatu
- [ ] Pořadí odpovídá initiative values
- [ ] Aktuální postava je highlighted žlutě
- [ ] Heroes mají modrou barvu, enemies červenou
- [ ] Dead postavy jsou zatmavené (opacity 0.4)
- [ ] HP dot správně zobrazuje zdraví (zelená/žlutá/červená)
- [ ] Animace pulse na aktivní postavě funguje
- [ ] Scrolluje se horizontálně na mobile

---

## 🎯 STEP 3: Active Character Highlighting

### Cíl
Zvýraznit aktuální aktivní postavu v hero/enemy cards.

### Implementace

#### 3.1 Update hero/enemy cards v Router.tsx

**Soubor:** `src/Router.tsx` (řádek 1169 - Heroes section)

```typescript
{/* Heroes */}
<div>
  <h3 style={{ marginBottom: '15px' }}>{t('router.heroes')}</h3>
  {(gameState.activeParty || []).map((hero) => {
    // ===== NOVÝ KÓD: Check if this is active character =====
    const isActiveCharacter = activeCharacter?.id === hero.id;
    // ===== KONEC NOVÉHO KÓDU =====

    return (
      <div key={hero.id} style={{
        padding: '15px',
        marginBottom: '10px',
        background: hero.isAlive ? '#2a2a4a' : '#1a1a2a',
        borderRadius: '8px',
        border: '2px solid ' + (
          isActiveCharacter
            ? '#fbbf24'  // Gold border for active
            : hero.isAlive ? '#4a9eff' : '#666'
        ),
        opacity: hero.isAlive ? 1 : 0.5,
        // ===== NOVÝ KÓD: Glow effect for active =====
        boxShadow: isActiveCharacter
          ? '0 0 20px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.3)'
          : 'none',
        transform: isActiveCharacter ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.3s ease'
        // ===== KONEC NOVÉHO KÓDU =====
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontWeight: 'bold' }}>
            {/* ===== NOVÝ KÓD: Active indicator ===== */}
            {isActiveCharacter && '▶️ '}
            {/* ===== KONEC NOVÉHO KÓDU ===== */}
            {hero.name}
          </span>
          <span>Lv.{hero.level}</span>
        </div>
        {/* ... rest of hero card ... */}
```

#### 3.2 Stejné pro Enemies section

**Soubor:** `src/Router.tsx` (řádek 1217 - Enemies section)

```typescript
{/* Enemies */}
<div>
  <h3 style={{ marginBottom: '15px' }}>{t('router.enemies')}</h3>
  {currentEnemies.map((enemy) => {
    // ===== NOVÝ KÓD =====
    const isActiveCharacter = activeCharacter?.id === enemy.id;
    // ===== KONEC NOVÉHO KÓDU =====

    return (
      <div key={enemy.id} style={{
        padding: '15px',
        marginBottom: '10px',
        background: enemy.isAlive ? '#4a2a2a' : '#1a1a2a',
        borderRadius: '8px',
        border: '2px solid ' + (
          isActiveCharacter
            ? '#fbbf24'
            : enemy.type === 'boss' ? '#ff4444'
            : enemy.type === 'elite' ? '#ffaa00'
            : enemy.isAlive ? '#ff6b6b' : '#666'
        ),
        opacity: enemy.isAlive ? 1 : 0.5,
        // ===== NOVÝ KÓD =====
        boxShadow: isActiveCharacter
          ? '0 0 20px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.3)'
          : 'none',
        transform: isActiveCharacter ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.3s ease'
        // ===== KONEC NOVÉHO KÓDU =====
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontWeight: 'bold' }}>
            {/* ===== NOVÝ KÓD =====*/}
            {isActiveCharacter && '▶️ '}
            {/* ===== KONEC NOVÉHO KÓDU ===== */}
            {enemy.type === 'boss' && '💀 '}
            {enemy.type === 'elite' && '⭐ '}
            {enemy.name}
          </span>
          <span>Lv.{enemy.level}</span>
        </div>
        {/* ... rest of enemy card ... */}
```

### ✅ Testing Checklist

- [ ] Aktuální hero má zlatý border a glow
- [ ] Aktuální enemy má zlatý border a glow
- [ ] ▶️ ikona se zobrazí před jménem aktivní postavy
- [ ] Smooth transition při změně aktivní postavy
- [ ] Glow není příliš agresivní (performance OK)
- [ ] Highlight zmizí po skončení tahu

---

## 🎯 STEP 4: Responsive Layout Fixes

### Cíl
Opravit combat UI pro mobile zařízení.

### Implementace

#### 4.1 Přidat useIsMobile hook

Tento hook už existuje v projektu, jen ho importuj.

**Soubor:** `src/Router.tsx`

```typescript
// Import na začátku (řádek 40)
import { useIsMobile } from './hooks/useIsMobile';

// Použij v komponentě (cca řádek 60)
export function Router() {
  const isMobile = useIsMobile();
  // ... rest of component
```

#### 4.2 Update Combat Teams Grid

**Soubor:** `src/Router.tsx` (řádek 1158 - Combat Teams)

```typescript
{/* Combat Teams */}
<div style={{
  display: 'grid',
  // ===== ZMĚNA: Responsive columns =====
  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
  // ===== KONEC ZMĚNY =====
  gap: '20px',
  marginBottom: '20px'
}}>
  {/* Heroes */}
  {/* Enemies */}
</div>
```

#### 4.3 Update Initiative Bar pro mobile

**Soubor:** `src/components/combat/InitiativeBar.tsx`

```typescript
// Přidat prop
interface InitiativeBarProps {
  turnOrder: Combatant[];
  currentCharacter: Combatant | null;
  isMobile?: boolean;  // NEW
}

export const InitiativeBar: React.FC<InitiativeBarProps> = ({
  turnOrder,
  currentCharacter,
  isMobile = false  // NEW
}) => {
  // ...

  return (
    <div style={{
      ...styles.container,
      padding: isMobile ? '10px' : '15px'  // NEW
    }}>
      <div style={styles.label}>
        {isMobile ? '🎯 Turn' : '🎯 Turn Order:'}  // NEW: Shorter text
      </div>

      <div style={{
        ...styles.orderList,
        gap: isMobile ? '8px' : '12px'  // NEW: Smaller gap
      }}>
        {turnOrder.map((character, index) => {
          // ...
          return (
            <div style={{
              ...styles.characterCard,
              minWidth: isMobile ? '80px' : '100px',  // NEW: Narrower cards
              padding: isMobile ? '8px' : '12px'  // NEW: Less padding
            }}>
              {/* ... */}
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

#### 4.4 Update Speed Controls pro mobile

**Soubor:** `src/Router.tsx` (speed controls section)

```typescript
<div style={{
  display: 'flex',
  flexDirection: isMobile ? 'column' : 'row',  // NEW: Stack on mobile
  justifyContent: 'center',
  alignItems: 'center',
  gap: isMobile ? '8px' : '10px',  // NEW
  marginBottom: '20px',
  padding: isMobile ? '8px' : '10px',  // NEW
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
  <span style={{
    fontSize: isMobile ? '0.85em' : '0.9em',  // NEW
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600'
  }}>
    ⚡ {isMobile ? 'Speed' : 'Combat Speed'}:  // NEW: Shorter text
  </span>

  <div style={{
    display: 'flex',
    gap: '8px',
    width: isMobile ? '100%' : 'auto'  // NEW: Full width buttons on mobile
  }}>
    {(['NORMAL', 'FAST', 'VERY_FAST'] as CombatSpeed[]).map((speed) => (
      <button
        key={speed}
        onClick={() => setCombatSpeed(speed)}
        style={{
          flex: isMobile ? 1 : 'none',  // NEW: Equal width on mobile
          padding: isMobile ? '10px 12px' : '8px 16px',  // NEW: Bigger touch target
          // ... rest of styles
        }}
      >
        {speed === 'NORMAL' ? '1x' : speed === 'FAST' ? '2x' : '4x'}
      </button>
    ))}
  </div>

  {!isMobile && (  // NEW: Hide on mobile to save space
    <div style={{...}}>
      {/* Delay info */}
    </div>
  )}
</div>
```

#### 4.5 Update Manual Controls pro mobile

**Soubor:** `src/Router.tsx` (manual controls section, řádek 1272)

```typescript
{waitingForInput && activeCharacter && (
  <div style={{
    // ... existing styles
    padding: isMobile ? '12px' : '16px',  // NEW
  }}>
    {/* Header */}
    <div style={{
      // ... existing styles
      padding: isMobile ? '8px 12px' : '10px 16px',  // NEW
      flexDirection: isMobile ? 'column' : 'row',  // NEW: Stack on mobile
      gap: isMobile ? '8px' : '12px'  // NEW
    }}>
      <h3 style={{
        // ... existing styles
        fontSize: isMobile ? '1em' : '1.1em'  // NEW
      }}>
        ⚔️ {activeCharacter.name}'s Turn
      </h3>

      <button style={{
        // ... existing styles
        width: isMobile ? '100%' : 'auto'  // NEW: Full width on mobile
      }}>
        🤖 Auto
      </button>
    </div>

    {/* Skills grid */}
    {'getSkills' in activeCharacter && activeCharacter.getSkills().length > 0 && (
      <div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile
            ? '1fr'  // NEW: Single column on mobile
            : activeCharacter.getSkills().length === 1
              ? '1fr'
              : 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '8px'
        }}>
          {/* Skills */}
        </div>
      </div>
    )}
  </div>
)}
```

### ✅ Testing Checklist

- [ ] Combat UI funguje na mobile (< 768px)
- [ ] Hero/Enemy cards jsou pod sebou na mobile
- [ ] Initiative bar scrolluje horizontálně
- [ ] Speed controls jsou vertikálně na mobile
- [ ] Speed buttons mají full width na mobile
- [ ] Manual controls mají větší touch targets
- [ ] Skills jsou v single column na mobile
- [ ] Všechny texty jsou čitelné
- [ ] Žádné horizontal overflow

---

## 🎯 STEP 5: Tooltips System

### Cíl
Přidat informační tooltips pro skills a enemies.

### Implementace

#### 5.1 Install react-tooltip

```bash
npm install react-tooltip
```

#### 5.2 Vytvořit Tooltip wrapper

**Soubor:** `src/components/ui/Tooltip.tsx` (NOVÝ)

```typescript
/**
 * Tooltip Wrapper Component
 * Wraps react-tooltip with custom styling
 */
import React from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

interface TooltipProps {
  id: string;
  children: React.ReactNode;
  place?: 'top' | 'bottom' | 'left' | 'right';
  delayShow?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  id,
  children,
  place = 'top',
  delayShow = 200
}) => {
  return (
    <ReactTooltip
      id={id}
      place={place}
      delayShow={delayShow}
      style={{
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        color: '#fff',
        borderRadius: '8px',
        padding: '12px',
        maxWidth: '300px',
        fontSize: '0.85em',
        lineHeight: '1.4',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
        zIndex: 10000
      }}
    >
      {children}
    </ReactTooltip>
  );
};
```

#### 5.3 Přidat Skill Tooltip Content

**Soubor:** `src/components/combat/SkillTooltip.tsx` (NOVÝ)

```typescript
/**
 * Skill Tooltip Content Component
 */
import React from 'react';
import type { Skill } from '../../types/hero.types';
import type { Combatant } from '../../types/combat.types';

interface SkillTooltipProps {
  skill: Skill;
  caster: Combatant;
}

export const SkillTooltipContent: React.FC<SkillTooltipProps> = ({
  skill,
  caster
}) => {
  // Calculate damage preview if damage skill
  const damagePreview = skill.type === 'damage' && skill.execute
    ? Math.floor(caster.ATK * 1.5) // Simplified calculation
    : null;

  return (
    <div>
      <div style={{
        fontSize: '1.1em',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#a78bfa'
      }}>
        🔮 {skill.name}
      </div>

      <div style={{
        marginBottom: '8px',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '0.9em'
      }}>
        {skill.description}
      </div>

      <div style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        paddingTop: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Type:</span>
          <span style={{
            color: skill.type === 'damage' ? '#ef4444' :
                   skill.type === 'heal' ? '#10b981' : '#a78bfa',
            fontWeight: '600'
          }}>
            {skill.type.toUpperCase()}
          </span>
        </div>

        {skill.cooldown > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Cooldown:</span>
            <span style={{ color: '#fbbf24', fontWeight: '600' }}>
              {skill.cooldown} turns
            </span>
          </div>
        )}

        {damagePreview && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Damage:</span>
            <span style={{ color: '#ef4444', fontWeight: '600' }}>
              ~{damagePreview}
            </span>
          </div>
        )}

        {skill.type === 'heal' && (
          <div style={{
            marginTop: '4px',
            padding: '6px',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '4px',
            fontSize: '0.85em',
            color: '#10b981'
          }}>
            💚 Restores HP to allies
          </div>
        )}

        {skill.type === 'buff' && (
          <div style={{
            marginTop: '4px',
            padding: '6px',
            background: 'rgba(167, 139, 250, 0.1)',
            borderRadius: '4px',
            fontSize: '0.85em',
            color: '#a78bfa'
          }}>
            ✨ Enhances party stats
          </div>
        )}
      </div>
    </div>
  );
};
```

#### 5.4 Přidat Enemy Tooltip Content

**Soubor:** `src/components/combat/EnemyTooltip.tsx` (NOVÝ)

```typescript
/**
 * Enemy Tooltip Content Component
 */
import React from 'react';
import type { Enemy } from '../../engine/combat/Enemy';

interface EnemyTooltipProps {
  enemy: Enemy;
}

export const EnemyTooltipContent: React.FC<EnemyTooltipProps> = ({ enemy }) => {
  const typeInfo = {
    normal: { color: '#6b7280', label: 'Normal Enemy' },
    elite: { color: '#fbbf24', label: 'Elite Enemy - Enhanced Stats' },
    boss: { color: '#ef4444', label: 'Boss Enemy - Powerful Foe' }
  };

  const info = typeInfo[enemy.type];

  return (
    <div>
      <div style={{
        fontSize: '1.1em',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: info.color
      }}>
        {enemy.type === 'boss' && '💀 '}
        {enemy.type === 'elite' && '⭐ '}
        {enemy.name}
      </div>

      <div style={{
        marginBottom: '8px',
        fontSize: '0.85em',
        color: info.color,
        fontWeight: '600'
      }}>
        {info.label}
      </div>

      <div style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        paddingTop: '8px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px'
      }}>
        <div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75em' }}>
            Level
          </div>
          <div style={{ color: '#fff', fontWeight: '600', fontSize: '1.1em' }}>
            {enemy.level}
          </div>
        </div>

        <div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75em' }}>
            HP
          </div>
          <div style={{ color: '#10b981', fontWeight: '600', fontSize: '1.1em' }}>
            {enemy.currentHP}/{enemy.maxHP}
          </div>
        </div>

        <div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75em' }}>
            ⚔️ ATK
          </div>
          <div style={{ color: '#ef4444', fontWeight: '600', fontSize: '1.1em' }}>
            {enemy.ATK}
          </div>
        </div>

        <div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75em' }}>
            🛡️ DEF
          </div>
          <div style={{ color: '#3b82f6', fontWeight: '600', fontSize: '1.1em' }}>
            {enemy.DEF}
          </div>
        </div>

        <div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75em' }}>
            ⚡ SPD
          </div>
          <div style={{ color: '#fbbf24', fontWeight: '600', fontSize: '1.1em' }}>
            {enemy.SPD}
          </div>
        </div>

        <div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75em' }}>
            💥 CRIT
          </div>
          <div style={{ color: '#f59e0b', fontWeight: '600', fontSize: '1.1em' }}>
            {enemy.CRIT.toFixed(1)}%
          </div>
        </div>
      </div>

      {enemy.type === 'boss' && (
        <div style={{
          marginTop: '8px',
          padding: '6px',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '4px',
          fontSize: '0.75em',
          color: '#ef4444',
          textAlign: 'center'
        }}>
          ⚠️ Dangerous opponent with high stats!
        </div>
      )}
    </div>
  );
};
```

#### 5.5 Integrovat tooltips do Router.tsx

**Soubor:** `src/Router.tsx`

```typescript
// Imports (začátek souboru)
import { Tooltip } from './components/ui/Tooltip';
import { SkillTooltipContent } from './components/combat/SkillTooltip';
import { EnemyTooltipContent } from './components/combat/EnemyTooltip';

// V combat display JSX - Skills section (řádek 1519)
{activeCharacter.getSkills().map((skill, index) => {
  const currentCooldown = (activeCharacter as Hero).cooldowns.get(skill.name) || 0;
  const isOnCooldown = currentCooldown > 0;
  const canUse = !isOnCooldown;

  return (
    <React.Fragment key={index}>
      <button
        // ===== NOVÝ KÓD: Tooltip anchor =====
        data-tooltip-id={`skill-${index}`}
        // ===== KONEC NOVÉHO KÓDU =====
        onClick={() => { /* ... */ }}
        disabled={!canUse}
        style={{...}}
      >
        {/* Button content */}
      </button>

      {/* ===== NOVÝ KÓD: Tooltip =====*/}
      <Tooltip id={`skill-${index}`}>
        <SkillTooltipContent
          skill={skill}
          caster={activeCharacter}
        />
      </Tooltip>
      {/* ===== KONEC NOVÉHO KÓDU ===== */}
    </React.Fragment>
  );
})}

// V Enemies section (řádek 1219)
{currentEnemies.map((enemy) => {
  const isActiveCharacter = activeCharacter?.id === enemy.id;

  return (
    <div
      key={enemy.id}
      // ===== NOVÝ KÓD: Tooltip anchor =====
      data-tooltip-id={`enemy-${enemy.id}`}
      // ===== KONEC NOVÉHO KÓDU =====
      style={{...}}
    >
      {/* Enemy card content */}

      {/* ===== NOVÝ KÓD: Tooltip =====*/}
      <Tooltip id={`enemy-${enemy.id}`}>
        <EnemyTooltipContent enemy={enemy} />
      </Tooltip>
      {/* ===== KONEC NOVÉHO KÓDU ===== */}
    </div>
  );
})}
```

### ✅ Testing Checklist

- [ ] Skill tooltip se zobrazí při hover (desktop)
- [ ] Skill tooltip se zobrazí při touch (mobile, drž prst)
- [ ] Enemy tooltip zobrazuje všechny stats
- [ ] Tooltips mají správné barvy podle typu
- [ ] Damage preview v skill tooltip je realistický
- [ ] Boss enemies mají warning message
- [ ] Tooltips se zavírají po pohybu myši pryč
- [ ] Tooltips nepřekrývají důležité UI prvky
- [ ] Z-index je správný (tooltips nad vším)

---

## 🎉 PHASE 1 DOKONČENA!

### Checklist celé fáze

- [ ] **Speed Controls** - fungují 1x/2x/4x
- [ ] **Initiative Bar** - zobrazuje turn order
- [ ] **Active Highlighting** - zlatý border a glow
- [ ] **Responsive Layout** - mobile friendly
- [ ] **Tooltips** - skills a enemies mají info

### Git Commit

```bash
git add .
git commit -m "feat(combat): PHASE 1 - UI/UX improvements

- Add combat speed controls (1x/2x/4x)
- Implement initiative order bar with active character highlight
- Add active character glow effects
- Fix responsive layout for mobile devices
- Implement tooltips for skills and enemies

Closes #XXX"

git push origin feature/combat-improvements
```

### Co dál?

Pokračuj na **[PHASE_2_MECHANICS.md](./PHASE_2_MECHANICS.md)** pro implementaci combat depth features! 🚀
