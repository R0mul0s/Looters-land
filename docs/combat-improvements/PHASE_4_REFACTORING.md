# 🔧 PHASE 4: Component Refactoring & Code Quality

> **Clean architecture, testability, performance**
>
> ⏱️ Odhadovaný čas: 8-12 hodin
> 🟢 Priorita: LOW (ale důležité pro maintenance)
> 📦 Závislosti: PHASE 1-3 (refactor po implementaci features)

---

## 📋 Obsah PHASE 4

1. [Dedicated CombatScreen Component](#step-1-dedicated-combatscreen-component) - 2-3h
2. [Zustand State Management](#step-2-zustand-state-management) - 2-3h
3. [Split Dungeon vs Quick Combat](#step-3-split-dungeon-vs-quick-combat) - 1-2h
4. [Unit Tests Setup](#step-4-unit-tests-setup) - 2-3h
5. [Performance Optimizations](#step-5-performance-optimizations) - 1-2h

---

## 🎯 STEP 1: Dedicated CombatScreen Component

### Cíl
Přesunout VŠECHNU combat UI logiku z Router.tsx do samostatné komponenty.

### Implementace

#### 1.1 Vytvořit CombatScreen component

**Soubor:** `src/components/combat/CombatScreen.tsx` (NOVÝ)

```typescript
/**
 * Combat Screen Component
 * Main combat UI - extracted from Router.tsx for better separation
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import React, { useState, useEffect } from 'react';
import type { CombatEngine } from '../../engine/combat/CombatEngine';
import type { Hero } from '../../engine/hero/Hero';
import type { Enemy } from '../../engine/combat/Enemy';
import type { Combatant, CombatLogEntry, CombatActionResult } from '../../types/combat.types';
import type { CombatSpeed } from '../../config/BALANCE_CONFIG';
import { COMBAT_CONFIG } from '../../config/BALANCE_CONFIG';
import { InitiativeBar } from './InitiativeBar';
import { ComboCounter } from './ComboCounter';
import { CombatLog } from './CombatLog';
import { DamageNumber } from './DamageNumber';
import { StatusEffectIcon } from './StatusEffectIcon';
import { Tooltip } from '../ui/Tooltip';
import { StatusEffectTooltipContent } from './StatusEffectTooltip';
import { EnemyTooltipContent } from './EnemyTooltip';
import { SkillTooltipContent } from './SkillTooltip';
import { useIsMobile } from '../../hooks/useIsMobile';
import { t } from '../../localization/i18n';

interface CombatScreenProps {
  combatEngine: CombatEngine;
  heroes: Hero[];
  enemies: Enemy[];
  onVictory: () => void;
  onDefeat: () => void;
  isDungeon?: boolean;
  showLootScreen?: boolean;
}

interface DamageNumberData {
  id: string;
  damage: number;
  isCrit: boolean;
  didMiss: boolean;
  wasWeakness: boolean;
  element?: string;
  isHeal?: boolean;
  targetId: string;
  timestamp: number;
}

export const CombatScreen: React.FC<CombatScreenProps> = ({
  combatEngine,
  heroes,
  enemies,
  onVictory,
  onDefeat,
  isDungeon = false,
  showLootScreen = false
}) => {
  const isMobile = useIsMobile();

  // State
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [combatSpeed, setCombatSpeed] = useState<CombatSpeed>('NORMAL');
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [activeCharacter, setActiveCharacter] = useState<Combatant | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<Combatant | null>(null);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumberData[]>([]);
  const [, forceUpdate] = useState({});

  // Setup combat engine callbacks
  useEffect(() => {
    if (!combatEngine) return;

    // Update callback
    combatEngine.onUpdate = () => {
      setCombatLog([...combatEngine.combatLog]);
      forceUpdate({});
    };

    // Action callback - for damage numbers
    combatEngine.onAction = (action: CombatActionResult) => {
      // Create damage number
      if (action.target && (action.damage !== undefined || action.didMiss)) {
        const newDamageNumber: DamageNumberData = {
          id: `${Date.now()}-${Math.random()}`,
          damage: action.damage || 0,
          isCrit: action.isCrit || false,
          didMiss: action.didMiss || false,
          wasWeakness: action.wasWeakness || false,
          element: action.element,
          isHeal: action.type === 'skill_heal' || action.type === 'skill_group_heal',
          targetId: action.target.id,
          timestamp: Date.now()
        };

        setDamageNumbers(prev => [...prev, newDamageNumber]);

        // Auto-cleanup after 2 seconds
        setTimeout(() => {
          setDamageNumbers(prev => prev.filter(d => d.id !== newDamageNumber.id));
        }, 2000);
      }

      // Handle AOE damage numbers
      if (action.results) {
        action.results.forEach(result => {
          const newDamageNumber: DamageNumberData = {
            id: `${Date.now()}-${Math.random()}`,
            damage: result.damage || 0,
            isCrit: result.isCrit || false,
            didMiss: result.didMiss || false,
            wasWeakness: false,
            targetId: result.target.id,
            timestamp: Date.now()
          };

          setDamageNumbers(prev => [...prev, newDamageNumber]);

          setTimeout(() => {
            setDamageNumbers(prev => prev.filter(d => d.id !== newDamageNumber.id));
          }, 2000);
        });
      }
    };

    // Combat end callback
    combatEngine.onCombatEnd = (result) => {
      if (result === 'victory') {
        onVictory();
      } else {
        onDefeat();
      }
    };

    // Wait for input callback
    combatEngine.onWaitForInput = (character) => {
      setWaitingForInput(true);
      setActiveCharacter(character);
    };

    return () => {
      combatEngine.onUpdate = null;
      combatEngine.onAction = null;
      combatEngine.onCombatEnd = null;
      combatEngine.onWaitForInput = null;
    };
  }, [combatEngine, onVictory, onDefeat]);

  // Execute manual action
  const executeManualAction = (action: CombatActionResult) => {
    combatEngine.executeManualAction(action);
    setWaitingForInput(false);
    setActiveCharacter(null);
    setSelectedTarget(null);
  };

  // Switch to auto mode
  const switchToAutoMode = () => {
    combatEngine.setManualMode(false);
    setWaitingForInput(false);
    setSelectedTarget(null);
    setActiveCharacter(null);

    // Continue combat in auto mode
    setTimeout(() => {
      runAutoCombat();
    }, 300);
  };

  // Auto combat loop
  const runAutoCombat = async () => {
    while (combatEngine.isActive && !combatEngine.waitingForPlayerInput) {
      combatEngine.executeTurn();
      setCombatLog([...combatEngine.combatLog]);
      forceUpdate({});

      await new Promise(resolve =>
        setTimeout(resolve, COMBAT_CONFIG.SPEED_PRESETS[combatSpeed])
      );
    }
  };

  // Render hero card
  const renderHeroCard = (hero: Hero) => {
    const isActiveChar = activeCharacter?.id === hero.id;

    return (
      <div
        key={hero.id}
        style={{
          padding: '15px',
          marginBottom: '10px',
          background: hero.isAlive ? '#2a2a4a' : '#1a1a2a',
          borderRadius: '8px',
          border: '2px solid ' + (
            isActiveChar
              ? '#fbbf24'
              : hero.isAlive ? '#4a9eff' : '#666'
          ),
          opacity: hero.isAlive ? 1 : 0.5,
          boxShadow: isActiveChar
            ? '0 0 20px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.3)'
            : 'none',
          transform: isActiveChar ? 'scale(1.02)' : 'scale(1)',
          transition: 'all 0.3s ease',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontWeight: 'bold' }}>
            {isActiveChar && '▶️ '}
            {hero.name}
          </span>
          <span>Lv.{hero.level}</span>
        </div>

        {/* HP Bar */}
        <div style={{
          width: '100%',
          height: '20px',
          background: '#1a1a2a',
          borderRadius: '10px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            width: `${(hero.currentHP / hero.maxHP) * 100}%`,
            height: '100%',
            background: hero.currentHP / hero.maxHP < 0.3 ? '#dc3545' : hero.currentHP / hero.maxHP < 0.6 ? '#ffc107' : '#28a745',
            transition: 'width 0.3s'
          }} />
          <span style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '0.8em',
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
          }}>
            {hero.currentHP}/{hero.maxHP}
          </span>
        </div>

        {/* Stats */}
        <div style={{ marginTop: '8px', display: 'flex', gap: '10px', fontSize: '0.9em' }}>
          <span>⚔️ {hero.ATK}</span>
          <span>🛡️ {hero.DEF}</span>
          <span>⚡ {hero.SPD}</span>
        </div>

        {/* Status Effects */}
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

        {/* Damage Numbers */}
        {damageNumbers
          .filter(dn => dn.targetId === hero.id)
          .map(dn => (
            <DamageNumber key={dn.id} {...dn} />
          ))}
      </div>
    );
  };

  // Render enemy card
  const renderEnemyCard = (enemy: Enemy) => {
    const isActiveChar = activeCharacter?.id === enemy.id;

    return (
      <div
        key={enemy.id}
        data-tooltip-id={`enemy-${enemy.id}`}
        style={{
          padding: '15px',
          marginBottom: '10px',
          background: enemy.isAlive ? '#4a2a2a' : '#1a1a2a',
          borderRadius: '8px',
          border: '2px solid ' + (
            isActiveChar
              ? '#fbbf24'
              : enemy.type === 'boss' ? '#ff4444'
              : enemy.type === 'elite' ? '#ffaa00'
              : enemy.isAlive ? '#ff6b6b' : '#666'
          ),
          opacity: enemy.isAlive ? 1 : 0.5,
          boxShadow: isActiveChar
            ? '0 0 20px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.3)'
            : 'none',
          transform: isActiveChar ? 'scale(1.02)' : 'scale(1)',
          transition: 'all 0.3s ease',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontWeight: 'bold' }}>
            {isActiveChar && '▶️ '}
            {enemy.type === 'boss' && '💀 '}
            {enemy.type === 'elite' && '⭐ '}
            {enemy.name}
          </span>
          <span>Lv.{enemy.level}</span>
        </div>

        {/* HP Bar */}
        <div style={{
          width: '100%',
          height: '20px',
          background: '#1a1a2a',
          borderRadius: '10px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            width: `${(enemy.currentHP / enemy.maxHP) * 100}%`,
            height: '100%',
            background: enemy.currentHP / enemy.maxHP < 0.3 ? '#dc3545' : enemy.currentHP / enemy.maxHP < 0.6 ? '#ffc107' : '#28a745',
            transition: 'width 0.3s'
          }} />
          <span style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '0.8em',
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
          }}>
            {enemy.currentHP}/{enemy.maxHP}
          </span>
        </div>

        {/* Stats */}
        <div style={{ marginTop: '8px', display: 'flex', gap: '10px', fontSize: '0.9em' }}>
          <span>⚔️ {enemy.ATK}</span>
          <span>🛡️ {enemy.DEF}</span>
          <span>⚡ {enemy.SPD}</span>
        </div>

        {/* Status Effects */}
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

        {/* Damage Numbers */}
        {damageNumbers
          .filter(dn => dn.targetId === enemy.id)
          .map(dn => (
            <DamageNumber key={dn.id} {...dn} />
          ))}

        <Tooltip id={`enemy-${enemy.id}`}>
          <EnemyTooltipContent enemy={enemy} />
        </Tooltip>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: '#1a1a2e',
      color: '#fff',
      padding: '20px',
      overflow: 'auto',
      zIndex: 9999
    }}>
      {/* Combat Header */}
      <div style={{
        textAlign: 'center',
        fontSize: '2em',
        fontWeight: 'bold',
        marginBottom: '20px',
        padding: '15px',
        background: combatEngine.combatResult === 'victory' ? '#28a745' : combatEngine.combatResult === 'defeat' ? '#dc3545' : '#495057',
        borderRadius: '10px'
      }}>
        {combatEngine.combatResult === 'victory' && t('router.combatVictory')}
        {combatEngine.combatResult === 'defeat' && t('router.combatDefeat')}
        {!combatEngine.combatResult && t('router.combatTurn', { turn: combatEngine.turnCounter })}
      </div>

      {/* Speed Controls */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: isMobile ? '8px' : '10px',
        marginBottom: '20px',
        padding: isMobile ? '8px' : '10px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <span style={{
          fontSize: isMobile ? '0.85em' : '0.9em',
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: '600'
        }}>
          ⚡ {isMobile ? 'Speed' : 'Combat Speed'}:
        </span>

        <div style={{
          display: 'flex',
          gap: '8px',
          width: isMobile ? '100%' : 'auto'
        }}>
          {(['NORMAL', 'FAST', 'VERY_FAST'] as CombatSpeed[]).map((speed) => (
            <button
              key={speed}
              onClick={() => setCombatSpeed(speed)}
              disabled={!combatEngine.isActive || combatEngine.combatResult !== null}
              style={{
                flex: isMobile ? 1 : 'none',
                padding: isMobile ? '10px 12px' : '8px 16px',
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
        </div>

        {!isMobile && (
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
        )}
      </div>

      {/* Initiative Bar */}
      <InitiativeBar
        turnOrder={combatEngine.turnOrder}
        currentCharacter={activeCharacter}
        isMobile={isMobile}
      />

      {/* Combo Counter */}
      <ComboCounter
        comboCount={combatEngine.comboCounter}
        maxCombo={combatEngine.maxComboReached}
      />

      {/* Combat Teams */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* Heroes */}
        <div>
          <h3 style={{ marginBottom: '15px' }}>{t('router.heroes')}</h3>
          {heroes.map(renderHeroCard)}
        </div>

        {/* Enemies */}
        <div>
          <h3 style={{ marginBottom: '15px' }}>{t('router.enemies')}</h3>
          {enemies.map(renderEnemyCard)}
        </div>
      </div>

      {/* Manual Combat Controls */}
      {waitingForInput && activeCharacter && (
        <div style={{
          background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
          padding: isMobile ? '12px' : '16px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '2px solid rgba(167, 139, 250, 0.5)',
          boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
        }}>
          {/* Manual controls content... (zkráceno pro úsporu místa) */}
          <div style={{ textAlign: 'center', color: '#fff' }}>
            Manual mode controls (see Router.tsx for full implementation)
          </div>
        </div>
      )}

      {/* Combat Log */}
      <CombatLog
        entries={combatLog}
        maxHeight={300}
        showFilters={true}
        highlightNames={heroes.map(h => h.name)}
      />
    </div>
  );
};
```

#### 1.2 Update Router.tsx k použití CombatScreen

**Soubor:** `src/Router.tsx`

```typescript
// Import
import { CombatScreen } from './components/combat/CombatScreen';

// REMOVE všechen combat UI JSX (řádky 874-1669)
// REPLACE with:

{combatActive && (
  <CombatScreen
    combatEngine={combatEngine}
    heroes={gameState.activeParty}
    enemies={currentEnemies}
    onVictory={handleCombatVictory}
    onDefeat={handleCombatDefeat}
    isDungeon={inDungeon}
    showLootScreen={showDungeonVictory}
  />
)}
```

### ✅ Testing Checklist

- [ ] Combat screen se zobrazí stejně jako před refactorem
- [ ] Všechny funkce fungují (speed, initiative, manual mode)
- [ ] No TypeScript errors
- [ ] Router.tsx je kratší o ~800 řádků
- [ ] Combat logic je oddělená od routing logic

---

## 🎯 STEP 2: Zustand State Management

### Cíl
Centralizovat combat state do Zustand store pro lepší state management.

### Implementace

#### 2.1 Install Zustand

```bash
npm install zustand
```

#### 2.2 Vytvořit Combat Store

**Soubor:** `src/stores/combatStore.ts` (NOVÝ)

```typescript
/**
 * Combat State Store
 * Centralized combat state management using Zustand
 */

import { create } from 'zustand';
import { CombatEngine } from '../engine/combat/CombatEngine';
import type { Hero } from '../engine/hero/Hero';
import type { Enemy } from '../engine/combat/Enemy';
import type { Combatant, CombatLogEntry } from '../types/combat.types';
import type { CombatSpeed } from '../config/BALANCE_CONFIG';
import type { Item } from '../engine/item/Item';

interface CombatVictoryRewards {
  gold: number;
  xp: number;
  items: Item[];
  levelUps: Array<{ heroName: string; newLevel: number }>;
}

interface CombatState {
  // Core state
  isActive: boolean;
  combatEngine: CombatEngine | null;
  combatType: 'dungeon' | 'quick' | null;

  // Combat participants
  heroes: Hero[];
  enemies: Enemy[];

  // UI state
  combatSpeed: CombatSpeed;
  combatLog: CombatLogEntry[];
  waitingForInput: boolean;
  activeCharacter: Combatant | null;
  selectedTarget: Combatant | null;

  // Results
  combatResult: 'victory' | 'defeat' | null;
  victoryRewards: CombatVictoryRewards | null;

  // Actions
  actions: {
    startCombat: (heroes: Hero[], enemies: Enemy[], type: 'dungeon' | 'quick') => void;
    endCombat: () => void;
    setSpeed: (speed: CombatSpeed) => void;
    setWaitingForInput: (waiting: boolean, character?: Combatant | null) => void;
    setSelectedTarget: (target: Combatant | null) => void;
    updateLog: (log: CombatLogEntry[]) => void;
    setCombatResult: (result: 'victory' | 'defeat', rewards?: CombatVictoryRewards) => void;
    reset: () => void;
  };
}

const initialState = {
  isActive: false,
  combatEngine: null,
  combatType: null,
  heroes: [],
  enemies: [],
  combatSpeed: 'NORMAL' as CombatSpeed,
  combatLog: [],
  waitingForInput: false,
  activeCharacter: null,
  selectedTarget: null,
  combatResult: null,
  victoryRewards: null
};

export const useCombatStore = create<CombatState>((set, get) => ({
  ...initialState,

  actions: {
    startCombat: (heroes, enemies, type) => {
      const engine = new CombatEngine();
      engine.initialize(heroes, enemies);

      set({
        isActive: true,
        combatEngine: engine,
        combatType: type,
        heroes,
        enemies,
        combatLog: [...engine.combatLog],
        combatResult: null,
        victoryRewards: null
      });

      // Setup engine callbacks
      engine.onUpdate = () => {
        set({ combatLog: [...engine.combatLog] });
      };

      engine.onCombatEnd = (result) => {
        set({ combatResult: result });
      };

      engine.onWaitForInput = (character) => {
        set({ waitingForInput: true, activeCharacter: character });
      };
    },

    endCombat: () => {
      const { combatEngine } = get();
      if (combatEngine) {
        combatEngine.onUpdate = null;
        combatEngine.onCombatEnd = null;
        combatEngine.onWaitForInput = null;
      }

      set({
        ...initialState
      });
    },

    setSpeed: (speed) => {
      set({ combatSpeed: speed });
    },

    setWaitingForInput: (waiting, character = null) => {
      set({ waitingForInput: waiting, activeCharacter: character });
    },

    setSelectedTarget: (target) => {
      set({ selectedTarget: target });
    },

    updateLog: (log) => {
      set({ combatLog: log });
    },

    setCombatResult: (result, rewards) => {
      set({ combatResult: result, victoryRewards: rewards || null });
    },

    reset: () => {
      set(initialState);
    }
  }
}));

// Selectors for easier access
export const useCombatActive = () => useCombatStore(state => state.isActive);
export const useCombatEngine = () => useCombatStore(state => state.combatEngine);
export const useCombatLog = () => useCombatStore(state => state.combatLog);
export const useCombatSpeed = () => useCombatStore(state => state.combatSpeed);
export const useCombatResult = () => useCombatStore(state => state.combatResult);
export const useCombatActions = () => useCombatStore(state => state.actions);
```

#### 2.3 Update CombatScreen k použití Zustand

**Soubor:** `src/components/combat/CombatScreen.tsx`

```typescript
import { useCombatStore, useCombatActions } from '../../stores/combatStore';

export const CombatScreen: React.FC<CombatScreenProps> = ({
  onVictory,
  onDefeat,
  isDungeon = false
}) => {
  // Use Zustand store instead of local state
  const combatEngine = useCombatStore(state => state.combatEngine);
  const heroes = useCombatStore(state => state.heroes);
  const enemies = useCombatStore(state => state.enemies);
  const combatLog = useCombatStore(state => state.combatLog);
  const combatSpeed = useCombatStore(state => state.combatSpeed);
  const waitingForInput = useCombatStore(state => state.waitingForInput);
  const activeCharacter = useCombatStore(state => state.activeCharacter);
  const combatResult = useCombatStore(state => state.combatResult);

  const actions = useCombatActions();

  // ... rest of component using store actions
  const setCombatSpeed = actions.setSpeed;
  const setWaitingForInput = actions.setWaitingForInput;
  // etc.
};
```

#### 2.4 Update Router.tsx

**Soubor:** `src/Router.tsx`

```typescript
import { useCombatStore, useCombatActions } from './stores/combatStore';

export function Router() {
  // Use combat store
  const combatActive = useCombatStore(state => state.isActive);
  const combatActions = useCombatActions();

  // Start combat
  const handleDungeonCombatStart = (enemies: Enemy[]) => {
    combatActions.startCombat(gameState.activeParty, enemies, 'dungeon');
  };

  const handleQuickCombat = (enemies: Enemy[]) => {
    combatActions.startCombat(gameState.activeParty, enemies, 'quick');
  };

  // End combat
  const handleCombatEnd = () => {
    combatActions.endCombat();
  };

  // ... rest of Router
}
```

### ✅ Testing Checklist

- [ ] Combat funguje stejně jako před Zustand
- [ ] State se správně sdílí mezi komponenty
- [ ] No prop drilling (props jsou minimální)
- [ ] Re-renders jsou optimalizované
- [ ] TypeScript types jsou správné

---

## 🎯 STEP 3: Split Dungeon vs Quick Combat

**(Pokračování v dalším komentáři kvůli délce...)**

Chceš, abych pokračoval s steps 3-5 pro PHASE 4?