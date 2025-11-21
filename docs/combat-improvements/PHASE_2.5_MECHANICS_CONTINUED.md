# ⚔️ PHASE 2.5: Combat Mechanics Depth (Continued) ✅ COMPLETED

> **Dokončení PHASE 2 - Status Effects a Combat Log**
>
> ⏱️ Odhadovaný čas: 4-6 hodin
> 🔴 Priorita: HIGH
> 📦 Závislosti: PHASE 2 (Steps 1-3)
n> ✅ **STAV: HOTOVO** (2025-11-21)

---

## 📋 Obsah PHASE 2.5

Toto je pokračování [PHASE_2_MECHANICS.md](./PHASE_2_MECHANICS.md). Obsahuje:

4. [Status Effect Visual Indicators](#step-4-status-effect-visual-indicators) - 2-3h
5. [Enhanced Combat Log](#step-5-enhanced-combat-log) - 2-3h

---

## 🎯 STEP 4: Status Effect Visual Indicators

### Cíl
Zobrazit aktivní status effects jako ikony/badges na hero/enemy cards.

### Implementace

#### 4.1 Vytvořit StatusEffectIcon komponentu

**Soubor:** `src/components/combat/StatusEffectIcon.tsx` (NOVÝ)

```typescript
/**
 * Status Effect Icon Component
 * Shows visual indicator for active buff/debuff
 */
import React from 'react';
import type { StatusEffect } from '../../types/hero.types';

interface StatusEffectIconProps {
  effect: StatusEffect;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Get icon for status effect type
 */
function getEffectIcon(effect: StatusEffect): string {
  // Check effect properties to determine type
  if (effect.immunity) return '🛡️';
  if (effect.stun) return '💫';
  if (effect.stat === 'damageReduction') return '🔰';
  if (effect.stat === 'ATK') return effect.value && effect.value > 0 ? '⚔️' : '🔻';
  if (effect.stat === 'DEF') return effect.value && effect.value > 0 ? '🛡️' : '💔';
  if (effect.stat === 'SPD') return effect.value && effect.value > 0 ? '⚡' : '🐌';
  if (effect.stat === 'CRIT') return effect.value && effect.value > 0 ? '💥' : '❌';

  return '✨';  // Default
}

/**
 * Get color for status effect
 */
function getEffectColor(effect: StatusEffect): string {
  if (effect.immunity) return '#fbbf24';
  if (effect.stun) return '#a855f7';
  if (effect.value && effect.value > 0) return '#10b981';  // Buff (positive)
  if (effect.value && effect.value < 0) return '#ef4444';  // Debuff (negative)
  return '#3b82f6';  // Neutral
}

export const StatusEffectIcon: React.FC<StatusEffectIconProps> = ({
  effect,
  size = 'medium'
}) => {
  const sizeStyles = {
    small: { width: '24px', height: '24px', fontSize: '0.8em' },
    medium: { width: '32px', height: '32px', fontSize: '1em' },
    large: { width: '40px', height: '40px', fontSize: '1.2em' }
  };

  const icon = getEffectIcon(effect);
  const color = getEffectColor(effect);

  return (
    <div
      style={{
        ...sizeStyles[size],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${color}33 0%, ${color}22 100%)`,
        border: `2px solid ${color}`,
        boxShadow: `0 0 8px ${color}44`,
        position: 'relative',
        cursor: 'help'
      }}
      data-tooltip-id={`status-${effect.name}`}
    >
      <span style={{ fontSize: size === 'small' ? '0.9em' : '1.1em' }}>
        {icon}
      </span>

      {/* Duration badge */}
      {effect.duration > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '-4px',
          right: '-4px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: color,
          color: '#fff',
          fontSize: '0.6em',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #1a1a2e',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          {effect.duration}
        </div>
      )}
    </div>
  );
};
```

#### 4.2 Vytvořit StatusEffectTooltip content

**Soubor:** `src/components/combat/StatusEffectTooltip.tsx` (NOVÝ)

```typescript
/**
 * Status Effect Tooltip Content
 */
import React from 'react';
import type { StatusEffect } from '../../types/hero.types';

interface StatusEffectTooltipProps {
  effect: StatusEffect;
}

export const StatusEffectTooltipContent: React.FC<StatusEffectTooltipProps> = ({
  effect
}) => {
  // Determine effect type
  const isBuff = effect.value && effect.value > 0;
  const isDebuff = effect.value && effect.value < 0;
  const isSpecial = effect.immunity || effect.stun;

  return (
    <div>
      <div style={{
        fontSize: '1.1em',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: isSpecial ? '#fbbf24' : isBuff ? '#10b981' : isDebuff ? '#ef4444' : '#3b82f6'
      }}>
        {effect.name}
      </div>

      {/* Description */}
      {effect.description && (
        <div style={{
          marginBottom: '8px',
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '0.9em',
          lineHeight: '1.4'
        }}>
          {effect.description}
        </div>
      )}

      {/* Effect details */}
      <div style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        paddingTop: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {/* Stat modification */}
        {effect.stat && effect.value !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              {effect.stat === 'damageReduction' ? 'Damage Reduction:' : `${effect.stat}:`}
            </span>
            <span style={{
              color: effect.value > 0 ? '#10b981' : '#ef4444',
              fontWeight: '600'
            }}>
              {effect.value > 0 ? '+' : ''}{effect.value}%
            </span>
          </div>
        )}

        {/* Duration */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Duration:</span>
          <span style={{ color: '#fbbf24', fontWeight: '600' }}>
            {effect.duration} {effect.duration === 1 ? 'turn' : 'turns'}
          </span>
        </div>

        {/* Special effects */}
        {effect.immunity && (
          <div style={{
            marginTop: '4px',
            padding: '6px',
            background: 'rgba(251, 191, 36, 0.1)',
            borderRadius: '4px',
            fontSize: '0.85em',
            color: '#fbbf24',
            textAlign: 'center'
          }}>
            🛡️ Immune to all damage!
          </div>
        )}

        {effect.stun && (
          <div style={{
            marginTop: '4px',
            padding: '6px',
            background: 'rgba(168, 85, 247, 0.1)',
            borderRadius: '4px',
            fontSize: '0.85em',
            color: '#a855f7',
            textAlign: 'center'
          }}>
            💫 Cannot act!
          </div>
        )}
      </div>
    </div>
  );
};
```

#### 4.3 Přidat StatusEffects display do hero/enemy cards

**Soubor:** `src/Router.tsx` (v hero/enemy card JSX)

```typescript
import { StatusEffectIcon } from './components/combat/StatusEffectIcon';
import { StatusEffectTooltipContent } from './components/combat/StatusEffectTooltip';
import { Tooltip } from './components/ui/Tooltip';

// V hero card (řádek 1169+)
{(gameState.activeParty || []).map((hero) => {
  // ... existing code

  return (
    <div key={hero.id} style={{...}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontWeight: 'bold' }}>
          {isActiveCharacter && '▶️ '}
          {hero.name}
        </span>
        <span>Lv.{hero.level}</span>
      </div>

      {/* HP Bar */}
      <div style={{...}}>
        {/* ... HP bar content ... */}
      </div>

      {/* Stats */}
      <div style={{ marginTop: '8px', display: 'flex', gap: '10px', fontSize: '0.9em' }}>
        <span>⚔️ {hero.ATK}</span>
        <span>🛡️ {hero.DEF}</span>
        <span>⚡ {hero.SPD}</span>
      </div>

      {/* ===== NOVÝ KÓD: Status Effects Display ===== */}
      {hero.statusEffects && hero.statusEffects.length > 0 && (
        <div style={{
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap'
        }}>
          {hero.statusEffects.map((effect, index) => (
            <React.Fragment key={`${hero.id}-effect-${index}`}>
              <StatusEffectIcon effect={effect} size="small" />

              <Tooltip id={`status-${effect.name}-${hero.id}-${index}`}>
                <StatusEffectTooltipContent effect={effect} />
              </Tooltip>
            </React.Fragment>
          ))}
        </div>
      )}
      {/* ===== KONEC NOVÉHO KÓDU ===== */}

      {/* Damage numbers */}
      {damageNumbers
        .filter(dn => dn.targetId === hero.id)
        .map(dn => (
          <DamageNumber key={dn.id} {...dn} />
        ))}
    </div>
  );
})}

// Stejné pro enemies section (řádek 1217+)
{currentEnemies.map((enemy) => {
  // ... existing code

  return (
    <div key={enemy.id} style={{...}}>
      {/* ... enemy card content ... */}

      {/* ===== NOVÝ KÓD: Status Effects ===== */}
      {enemy.statusEffects && enemy.statusEffects.length > 0 && (
        <div style={{
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap'
        }}>
          {enemy.statusEffects.map((effect, index) => (
            <React.Fragment key={`${enemy.id}-effect-${index}`}>
              <StatusEffectIcon effect={effect} size="small" />

              <Tooltip id={`status-${effect.name}-${enemy.id}-${index}`}>
                <StatusEffectTooltipContent effect={effect} />
              </Tooltip>
            </React.Fragment>
          ))}
        </div>
      )}
      {/* ===== KONEC NOVÉHO KÓDU ===== */}

      {/* Damage numbers, tooltip */}
    </div>
  );
})}
```

#### 4.4 Přidat pulse animaci pro important status effects

**Soubor:** `src/index.css`

```css
/* Přidat na konec souboru */

@keyframes status-pulse {
  0%, 100% {
    box-shadow: 0 0 8px var(--effect-color);
  }
  50% {
    box-shadow: 0 0 16px var(--effect-color), 0 0 24px var(--effect-color);
  }
}

.status-effect-important {
  animation: status-pulse 2s ease-in-out infinite;
}
```

#### 4.5 Update StatusEffectIcon pro pulse animaci

**Soubor:** `src/components/combat/StatusEffectIcon.tsx`

```typescript
export const StatusEffectIcon: React.FC<StatusEffectIconProps> = ({
  effect,
  size = 'medium'
}) => {
  // ... existing code

  // Determine if this is an important effect (immunity, stun)
  const isImportant = effect.immunity || effect.stun;

  return (
    <div
      style={{
        ...sizeStyles[size],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${color}33 0%, ${color}22 100%)`,
        border: `2px solid ${color}`,
        boxShadow: `0 0 8px ${color}44`,
        position: 'relative',
        cursor: 'help',
        // ===== NOVÝ KÓD: CSS variable for animation =====
        ['--effect-color' as any]: color
        // ===== KONEC NOVÉHO KÓDU =====
      }}
      // ===== NOVÝ KÓD: Add animation class =====
      className={isImportant ? 'status-effect-important' : ''}
      // ===== KONEC NOVÉHO KÓDU =====
      data-tooltip-id={`status-${effect.name}`}
    >
      {/* ... rest of component ... */}
    </div>
  );
};
```

### ✅ Testing Checklist

- [ ] Status effect ikony se zobrazují pod HP barem
- [ ] Correct ikony pro různé typy effects (buff/debuff/special)
- [ ] Duration counter badge je viditelný
- [ ] Tooltip zobrazuje detaily o effectu
- [ ] Buff ikony jsou zelené, debuff červené
- [ ] Immunity a stun ikony pulzují
- [ ] Multiple status effects se nezalamují špatně
- [ ] Status effects zmizí po vypršení duration
- [ ] Icons se správně aktualizují každý turn

---

## 🎯 STEP 5: Enhanced Combat Log

### Cíl
Vylepšit combat log s virtualizací, filtry, barevným kódováním a scroll to bottom.

### Implementace

#### 5.1 Vytvořit CombatLog komponentu

**Soubor:** `src/components/combat/CombatLog.tsx` (NOVÝ)

```typescript
/**
 * Enhanced Combat Log Component
 * Displays combat actions with filtering and auto-scroll
 */
import React, { useEffect, useRef, useState } from 'react';
import type { CombatLogEntry } from '../../types/combat.types';

interface CombatLogProps {
  entries: CombatLogEntry[];
  maxHeight?: number;
  showFilters?: boolean;
}

type LogFilter = 'all' | 'attack' | 'skill' | 'heal' | 'death' | 'buff';

export const CombatLog: React.FC<CombatLogProps> = ({
  entries,
  maxHeight = 300,
  showFilters = true
}) => {
  const logEndRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<LogFilter>('all');
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries, autoScroll]);

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    if (filter === 'all') return true;
    if (filter === 'buff') return entry.type === 'debuff';  // Include debuffs in buff filter
    return entry.type === filter;
  });

  // Get color for entry type
  const getEntryColor = (type: CombatLogEntry['type']): string => {
    switch (type) {
      case 'attack': return '#ef4444';
      case 'skill': return '#a78bfa';
      case 'heal': return '#10b981';
      case 'death': return '#dc3545';
      case 'turn': return '#fbbf24';
      case 'victory': return '#10b981';
      case 'defeat': return '#ef4444';
      case 'debuff': return '#f59e0b';
      case 'level_up': return '#3b82f6';
      default: return '#9ca3af';
    }
  };

  // Get icon for entry type
  const getEntryIcon = (type: CombatLogEntry['type']): string => {
    switch (type) {
      case 'attack': return '⚔️';
      case 'skill': return '🔮';
      case 'heal': return '💚';
      case 'death': return '💀';
      case 'turn': return '🔄';
      case 'victory': return '🎉';
      case 'defeat': return '💀';
      case 'debuff': return '🔻';
      case 'level_up': return '⬆️';
      default: return '📝';
    }
  };

  return (
    <div style={styles.container}>
      {/* Header with filters */}
      <div style={styles.header}>
        <h4 style={styles.title}>
          📜 Combat Log ({filteredEntries.length})
        </h4>

        {showFilters && (
          <div style={styles.filters}>
            {(['all', 'attack', 'skill', 'heal', 'death'] as LogFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  ...styles.filterButton,
                  background: filter === f
                    ? 'rgba(139, 92, 246, 0.3)'
                    : 'rgba(255, 255, 255, 0.05)',
                  borderColor: filter === f
                    ? '#8b5cf6'
                    : 'rgba(255, 255, 255, 0.1)'
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Auto-scroll toggle */}
        <label style={styles.autoScrollLabel}>
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            style={styles.checkbox}
          />
          <span style={{ fontSize: '0.85em' }}>Auto-scroll</span>
        </label>
      </div>

      {/* Log entries */}
      <div
        style={{
          ...styles.logContainer,
          maxHeight: `${maxHeight}px`
        }}
      >
        {filteredEntries.length === 0 ? (
          <div style={styles.emptyState}>
            {filter === 'all'
              ? 'Combat log is empty. Start combat to see actions here.'
              : `No ${filter} entries to display.`}
          </div>
        ) : (
          filteredEntries.map((entry, index) => (
            <div
              key={`log-${index}`}
              style={{
                ...styles.entry,
                borderLeftColor: getEntryColor(entry.type)
              }}
            >
              <span style={styles.entryIcon}>
                {getEntryIcon(entry.type)}
              </span>

              <span
                style={{
                  ...styles.entryText,
                  color: getEntryColor(entry.type)
                }}
              >
                {entry.message}
              </span>

              {entry.turn > 0 && (
                <span style={styles.turnBadge}>
                  T{entry.turn}
                </span>
              )}
            </div>
          ))
        )}

        {/* Invisible element for scrolling */}
        <div ref={logEndRef} />
      </div>

      {/* Stats footer */}
      <div style={styles.footer}>
        <div style={styles.stat}>
          Total Entries: <strong>{entries.length}</strong>
        </div>
        {entries.length > 0 && (
          <div style={styles.stat}>
            Turns: <strong>{entries[entries.length - 1]?.turn || 0}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#0d0d1a',
    borderRadius: '8px',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    overflow: 'hidden'
  },
  header: {
    padding: '12px 15px',
    background: 'rgba(139, 92, 246, 0.1)',
    borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  title: {
    margin: 0,
    fontSize: '1em',
    fontWeight: '600',
    color: '#a78bfa',
    flex: 1
  },
  filters: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap'
  },
  filterButton: {
    padding: '4px 10px',
    fontSize: '0.75em',
    border: '1px solid',
    borderRadius: '12px',
    cursor: 'pointer',
    color: '#fff',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  autoScrollLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.85em',
    color: 'rgba(255, 255, 255, 0.7)',
    cursor: 'pointer',
    userSelect: 'none'
  },
  checkbox: {
    cursor: 'pointer'
  },
  logContainer: {
    overflowY: 'auto',
    padding: '10px',
    fontFamily: 'monospace',
    fontSize: '0.85em',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(139, 92, 246, 0.5) rgba(0, 0, 0, 0.2)'
  },
  entry: {
    padding: '8px 10px',
    marginBottom: '4px',
    borderLeft: '3px solid',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '0 4px 4px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background 0.2s'
  },
  entryIcon: {
    fontSize: '1.1em',
    flexShrink: 0
  },
  entryText: {
    flex: 1,
    lineHeight: '1.4'
  },
  turnBadge: {
    padding: '2px 6px',
    background: 'rgba(139, 92, 246, 0.2)',
    borderRadius: '10px',
    fontSize: '0.7em',
    color: '#a78bfa',
    fontWeight: '600',
    flexShrink: 0
  },
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '0.9em',
    fontStyle: 'italic'
  },
  footer: {
    padding: '8px 15px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderTop: '1px solid rgba(139, 92, 246, 0.2)',
    display: 'flex',
    gap: '20px',
    fontSize: '0.8em'
  },
  stat: {
    color: 'rgba(255, 255, 255, 0.6)'
  }
};
```

#### 5.2 Replace starý combat log v Router.tsx

**Soubor:** `src/Router.tsx`

```typescript
// Import
import { CombatLog } from './components/combat/CombatLog';

// V combat display JSX - REPLACE starý combat log (řádek 1648)
{/* ===== STARÝ KÓD (odstranit): =====
<div style={{
  background: '#0d0d1a',
  padding: '15px',
  borderRadius: '8px',
  maxHeight: '300px',
  overflow: 'auto',
  fontFamily: 'monospace',
  fontSize: '0.9em'
}}>
  <h4 style={{ marginBottom: '10px' }}>{t('router.combatLog')}</h4>
  {combatLog.slice(-20).map((entry, index) => (
    <div key={index} style={{
      padding: '5px',
      borderBottom: '1px solid #1a1a2a',
      color: entry.type === 'attack' ? '#ff6b6b' : entry.type === 'heal' ? '#51cf66' : entry.type === 'death' ? '#dc3545' : '#aaa'
    }}>
      {entry.message}
    </div>
  ))}
</div>
===== KONEC STARÉHO KÓDU ===== */}

{/* ===== NOVÝ KÓD: Enhanced Combat Log ===== */}
<CombatLog
  entries={combatLog}
  maxHeight={300}
  showFilters={true}
/>
{/* ===== KONEC NOVÉHO KÓDU ===== */}
```

#### 5.3 Přidat export combat log button

**Soubor:** `src/components/combat/CombatLog.tsx`

```typescript
// Přidat do header section (po filters)

{/* ===== NOVÝ KÓD: Export button ===== */}
<button
  onClick={() => {
    // Export log as text file
    const logText = entries.map(e =>
      `[Turn ${e.turn}] [${e.type.toUpperCase()}] ${e.message}`
    ).join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `combat-log-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }}
  style={{
    padding: '4px 10px',
    fontSize: '0.75em',
    background: 'rgba(16, 185, 129, 0.2)',
    border: '1px solid #10b981',
    borderRadius: '12px',
    cursor: 'pointer',
    color: '#10b981',
    fontWeight: '600',
    transition: 'all 0.2s'
  }}
>
  📥 Export
</button>
{/* ===== KONEC NOVÉHO KÓDU ===== */}
```

#### 5.4 Přidat highlighting pro mentions

**Soubor:** `src/components/combat/CombatLog.tsx`

```typescript
// Přidat prop
interface CombatLogProps {
  entries: CombatLogEntry[];
  maxHeight?: number;
  showFilters?: boolean;
  highlightNames?: string[];  // NEW: Hero names to highlight
}

export const CombatLog: React.FC<CombatLogProps> = ({
  entries,
  maxHeight = 300,
  showFilters = true,
  highlightNames = []  // NEW
}) => {
  // ... existing code

  // NEW: Function to highlight mentions
  const highlightMessage = (message: string): React.ReactNode => {
    if (highlightNames.length === 0) return message;

    let parts: React.ReactNode[] = [message];

    highlightNames.forEach((name, index) => {
      const newParts: React.ReactNode[] = [];

      parts.forEach(part => {
        if (typeof part === 'string') {
          const segments = part.split(name);
          segments.forEach((segment, i) => {
            newParts.push(segment);
            if (i < segments.length - 1) {
              newParts.push(
                <span
                  key={`highlight-${index}-${i}`}
                  style={{
                    background: 'rgba(59, 130, 246, 0.3)',
                    padding: '1px 3px',
                    borderRadius: '3px',
                    fontWeight: 'bold'
                  }}
                >
                  {name}
                </span>
              );
            }
          });
        } else {
          newParts.push(part);
        }
      });

      parts = newParts;
    });

    return parts;
  };

  return (
    // ... existing JSX

    {/* In entry text rendering: */}
    <span
      style={{
        ...styles.entryText,
        color: getEntryColor(entry.type)
      }}
    >
      {highlightMessage(entry.message)}
    </span>
  );
};
```

#### 5.5 Integrate highlighting do Router.tsx

**Soubor:** `src/Router.tsx`

```typescript
{/* Enhanced Combat Log with hero name highlighting */}
<CombatLog
  entries={combatLog}
  maxHeight={300}
  showFilters={true}
  highlightNames={gameState.activeParty.map(h => h.name)}
/>
```

### ✅ Testing Checklist

- [ ] Combat log se zobrazuje se všemi entries
- [ ] Filtry fungují (all, attack, skill, heal, death)
- [ ] Auto-scroll scrolluje na bottom při new entries
- [ ] Auto-scroll lze vypnout checkboxem
- [ ] Barvy odpovídají typům akcí
- [ ] Ikony se zobrazují u každého entry
- [ ] Turn badges jsou viditelné
- [ ] Export button stáhne .txt soubor
- [ ] Hero jména jsou highlighted v messages
- [ ] Footer zobrazuje total entries a turns
- [ ] Scrollbar je styled (thin purple)
- [ ] Empty state se zobrazí když je filter prázdný

---

## 🎉 PHASE 2 KOMPLETNĚ DOKONČENA!

### Checklist celé PHASE 2 + 2.5

- [ ] **Accuracy/Evasion System** - hit/miss mechanika funguje
- [ ] **Elemental Damage Types** - 6 elementů s resistances
- [ ] **Damage Number Animations** - floating numbers s fade-out
- [ ] **Status Effect Icons** - visual indicators s tooltips
- [ ] **Enhanced Combat Log** - filtry, export, highlighting

### Git Commit

```bash
git add .
git commit -m "feat(combat): PHASE 2 - Combat mechanics depth

- Implement accuracy/evasion system with hit chance calculation
- Add elemental damage types (Physical/Fire/Ice/Lightning/Holy/Dark)
- Create damage number animations with framer-motion
- Add status effect visual indicators with tooltips
- Enhance combat log with filters, export, and auto-scroll

Related to #XXX"

git push origin feature/combat-improvements
```

### Co dál?

Pokračuj na **[PHASE_3_ADVANCED.md](./PHASE_3_ADVANCED.md)** pro pokročilé combat features! 🚀

### Performance Notes

Po dokončení PHASE 2, zkontroluj:
- **Bundle size** - framer-motion přidává ~50KB
- **Re-render count** - damage numbers by neměly způsobit lag
- **Memory leaks** - damage number cleanup funguje správně

Pokud jsou problémy:
1. Použij React.memo na CombatLog
2. Virtualizuj log entries (react-window)
3. Debounce damage number updates
