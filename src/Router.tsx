/**
 * Simple Router Component
 *
 * Routes between main game (WorldMapDemo2) and legacy test UI (App)
 *
 * Routes:
 * - / -> WorldMapDemo2 (main game)
 * - /test -> App (legacy test UI)
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-08
 */

import { useState, useEffect } from 'react';
import { WorldMapDemo2 } from './components/WorldMapDemo2';
import type { DungeonEntrance } from './types/worldmap.types';
import { Dungeon } from './engine/dungeon/Dungeon';
import { DungeonExplorer } from './components/DungeonExplorer';
import { useGameState } from './hooks/useGameState';
import App from './App';
import * as AuthService from './services/AuthService';
import { CombatEngine } from './engine/combat/CombatEngine';
import type { Enemy } from './engine/combat/Enemy';
import type { Combatant, CombatLogEntry } from './types/combat.types';
import { t } from './localization/i18n';
import { DUNGEON_CONFIG, COMBAT_CONFIG } from './config/BALANCE_CONFIG';
import { LoginScreen } from './components/LoginScreen';

export function Router() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [userEmail, setUserEmail] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(true);
  const [currentDungeon, setCurrentDungeon] = useState<Dungeon | null>(null);
  const [inDungeon, setInDungeon] = useState(false);

  // Get game state for heroes
  const [gameState, gameActions] = useGameState(userEmail);

  // Combat System State
  const [combatEngine] = useState(() => new CombatEngine());
  const [combatActive, setCombatActive] = useState(false);
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [currentEnemies, setCurrentEnemies] = useState<Enemy[]>([]);
  const [isManualMode, setIsManualMode] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [activeCharacter, setActiveCharacter] = useState<Combatant | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<Combatant | null>(null);
  const [showDungeonVictory, setShowDungeonVictory] = useState(false);
  const [dungeonUpdateKey, setDungeonUpdateKey] = useState(0);
  const [, forceUpdate] = useState({});

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const session = await AuthService.getCurrentSession();
      if (session) {
        setUserEmail(session.user.email || '');
      }
      setAuthLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const unsubscribe = AuthService.onAuthStateChange((event, session) => {
      if (session) {
        setUserEmail(session.user.email || '');
      } else {
        setUserEmail('');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: '#f1f5f9',
        fontSize: '1.5em'
      }}>
        Loading...
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!userEmail) {
    return <LoginScreen />;
  }

  // Render based on path
  if (currentPath === '/test') {
    return (
      <div>
        <div style={{
          position: 'fixed',
          top: 10,
          right: 10,
          zIndex: 10000,
          background: '#4CAF50',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold',
          border: '2px solid #2a5a2a'
        }}
        onClick={() => navigate('/')}>
          {t('router.backToMainGame')}
        </div>
        <App />
      </div>
    );
  }

  /**
   * Handle dungeon entrance from worldmap
   *
   * Creates and initializes a new dungeon instance with scaled enemies based on
   * party level and dungeon difficulty. Calculates dynamic difficulty probabilities
   * and configures room count per floor.
   *
   * @param dungeonEntrance - Dungeon entrance data from worldmap
   *
   * @example
   * ```typescript
   * handleEnterDungeon({
   *   id: 'dungeon-001',
   *   name: 'Dark Cave',
   *   difficulty: 'Medium',
   *   recommendedLevel: 5
   * });
   * ```
   */
  const handleEnterDungeon = (dungeonEntrance: DungeonEntrance) => {
    console.log('🏰 Entering dungeon from worldmap:', dungeonEntrance);

    // Calculate average hero level
    const aliveHeroes = gameState.activeParty.filter(h => h.isAlive);
    const averageHeroLevel = aliveHeroes.length > 0
      ? Math.floor(aliveHeroes.reduce((sum, h) => sum + h.level, 0) / aliveHeroes.length)
      : 1;

    // Use recommended level from dungeon entrance as base level for enemies and loot
    const dungeonBaseLevel = dungeonEntrance.recommendedLevel;

    // Calculate level difference to determine actual difficulty
    const levelDifference = dungeonBaseLevel - averageHeroLevel;

    console.log('📊 Level Analysis:', {
      averageHeroLevel,
      dungeonBaseLevel,
      levelDifference,
      dungeonDifficulty: dungeonEntrance.difficulty
    });

    // Rooms per floor based on dungeon difficulty
    const roomsConfig = DUNGEON_CONFIG.ROOMS_PER_FLOOR;

    // Enemy difficulty probabilities based on LEVEL DIFFERENCE and dungeon difficulty
    // The dungeon difficulty is a multiplier on the base probabilities
    let difficultyProbabilities;

    if (levelDifference <= DUNGEON_CONFIG.LEVEL_DIFFERENCE_THRESHOLDS.veryEasy) {
      // Heroes are 3+ levels ABOVE dungeon (very easy for them)
      difficultyProbabilities = DUNGEON_CONFIG.ENEMY_PROBABILITIES.veryEasy;
    } else if (levelDifference <= DUNGEON_CONFIG.LEVEL_DIFFERENCE_THRESHOLDS.easy) {
      // Heroes are 1-2 levels above (easy for them)
      difficultyProbabilities = DUNGEON_CONFIG.ENEMY_PROBABILITIES.easy;
    } else if (levelDifference <= DUNGEON_CONFIG.LEVEL_DIFFERENCE_THRESHOLDS.balanced) {
      // Around same level (balanced)
      difficultyProbabilities = DUNGEON_CONFIG.ENEMY_PROBABILITIES.balanced;
    } else if (levelDifference <= DUNGEON_CONFIG.LEVEL_DIFFERENCE_THRESHOLDS.challenging) {
      // Dungeon is 2-3 levels above heroes (challenging)
      difficultyProbabilities = DUNGEON_CONFIG.ENEMY_PROBABILITIES.challenging;
    } else {
      // Dungeon is 4+ levels above heroes (very hard)
      difficultyProbabilities = DUNGEON_CONFIG.ENEMY_PROBABILITIES.veryHard;
    }

    // Apply dungeon difficulty multiplier to elite/hard chances
    const multiplier = DUNGEON_CONFIG.DIFFICULTY_MULTIPLIERS[dungeonEntrance.difficulty];

    // Adjust probabilities based on dungeon difficulty
    const adjustedElite = Math.min(
      DUNGEON_CONFIG.MAX_ELITE_PROBABILITY,
      difficultyProbabilities.elite * multiplier
    );
    const adjustedHard = Math.min(
      DUNGEON_CONFIG.MAX_HARD_PROBABILITY,
      difficultyProbabilities.hard * multiplier
    );
    const reduction = (adjustedElite - difficultyProbabilities.elite) + (adjustedHard - difficultyProbabilities.hard);

    const finalProbabilities = {
      easy: Math.max(0.05, difficultyProbabilities.easy - reduction * 0.6),
      normal: Math.max(0.1, difficultyProbabilities.normal - reduction * 0.4),
      hard: adjustedHard,
      elite: adjustedElite
    };

    console.log('🎲 Enemy Probabilities:', finalProbabilities);

    // Create unique dungeon based on the entrance data
    const newDungeon = new Dungeon({
      name: dungeonEntrance.name,
      startingFloor: 1,
      roomsPerFloor: roomsConfig[dungeonEntrance.difficulty],
      heroLevel: dungeonBaseLevel,  // Use dungeon base level for enemy scaling
      difficultyProbabilities: finalProbabilities,  // Use calculated relative probabilities
      difficultyScaling: DUNGEON_CONFIG.DIFFICULTY_SCALING_PER_FLOOR
    });

    // Override ID with dungeon entrance ID for consistent generation
    newDungeon.id = dungeonEntrance.id;
    newDungeon.start();

    // Set dungeon and switch to dungeon mode
    setCurrentDungeon(newDungeon);
    setInDungeon(true);
  };

  /**
   * Handle exit from dungeon back to worldmap
   *
   * Clears current dungeon state and switches UI back to worldmap view.
   */
  const handleDungeonExit = () => {
    setCurrentDungeon(null);
    setInDungeon(false);
  };

  /**
   * Handle combat start from dungeon
   *
   * Initializes combat engine with current party and enemies, sets up combat UI,
   * and starts either manual or auto combat based on mode setting.
   *
   * @param enemies - Array of Enemy instances for this combat encounter
   */
  const handleDungeonCombatStart = (enemies: Enemy[]) => {
    console.log('🗡️ Combat starting with', enemies.length, 'enemies');

    const activeHeroes = gameState.activeParty || [];
    setCurrentEnemies(enemies);
    setCombatActive(true);

    // Initialize combat
    combatEngine.initialize(activeHeroes, enemies);
    combatEngine.isManualMode = isManualMode;
    setCombatLog([...combatEngine.combatLog]);

    // Set callback for combat end
    combatEngine.onCombatEnd = handleDungeonCombatEnd;

    if (isManualMode) {
      // Execute enemy turns until we reach first hero
      while (combatEngine.isActive && !combatEngine.waitingForPlayerInput) {
        combatEngine.executeTurn();
        setCombatLog([...combatEngine.combatLog]);
      }

      // Now set up for player input
      setWaitingForInput(true);
      setActiveCharacter(combatEngine.currentCharacter);
      forceUpdate({});
    } else {
      // Run auto combat with visual updates
      runDungeonAutoCombat();
    }
  };

  /**
   * Run auto combat with UI updates
   *
   * Executes combat turns automatically with 1-second delays between turns
   * for visual feedback. Updates combat log and UI state after each turn.
   */
  const runDungeonAutoCombat = async () => {
    // Run auto combat loop with UI updates
    while (combatEngine.isActive && !combatEngine.waitingForPlayerInput) {
      combatEngine.executeTurn();
      setCombatLog([...combatEngine.combatLog]);
      forceUpdate({});

      // Wait between turns for visibility
      if (combatEngine.isActive && !combatEngine.waitingForPlayerInput) {
        await new Promise(resolve => setTimeout(resolve, COMBAT_CONFIG.AUTO_COMBAT_DELAY));
      }
    }
  };

  /**
   * Handle combat end - victory or defeat
   *
   * Processes combat completion, awards loot and XP on victory, handles defeat screen,
   * and saves hero changes to database. Shows appropriate victory/defeat UI.
   */
  const handleDungeonCombatEnd = async () => {
    if (!currentDungeon) return;

    const result = currentDungeon.completeCombat(gameState.activeParty || []);
    console.log('✅ Combat completed:', result.message);
    console.log('✅ Current room after combat:', currentDungeon.getCurrentRoom());

    // Check if it's a defeat (all heroes dead)
    const allHeroesDead = gameState.activeParty.every(hero => !hero.isAlive);

    if (allHeroesDead) {
      // Handle defeat - keep combat screen but don't show victory
      setCombatActive(true);
      setShowDungeonVictory(false);
      setWaitingForInput(false);
      setActiveCharacter(null);
      setSelectedTarget(null);
      forceUpdate({});

      // Show defeat alert and exit dungeon
      setTimeout(() => {
        alert(t('router.defeatAlert'));
        handleDungeonExit();
      }, COMBAT_CONFIG.DEFEAT_ALERT_DELAY);
    } else {
      // Add combat loot to dungeon statistics and auto-collect gold
      if (combatEngine.lootReward) {
        currentDungeon.addLootToStats(
          combatEngine.lootReward.gold,
          combatEngine.lootReward.items.length
        );

        // Auto-collect gold immediately upon victory (items are collected manually)
        await gameActions.addGold(combatEngine.lootReward.gold);
      }

      // Save hero changes (XP, level ups, HP) after victory
      await gameActions.updateActiveParty(gameState.activeParty);
      await gameActions.saveGame();

      // Show victory screen instead of immediately closing combat
      setCombatActive(true); // Explicitly keep combat screen visible
      setShowDungeonVictory(true);
      setWaitingForInput(false);
      setActiveCharacter(null);
      setSelectedTarget(null);
      forceUpdate({});
    }
  };

  /**
   * Handle continue after dungeon victory
   *
   * Checks for uncollected items and prompts confirmation if any remain,
   * collects remaining loot, saves game state, and returns to dungeon exploration.
   */
  const handleDungeonVictoryContinue = async () => {
    // Check if there are uncollected items
    const currentRoom = currentDungeon?.getCurrentRoom();
    const isEliteRoom = currentRoom && (currentRoom.type === 'elite' || currentRoom.type === 'miniboss');
    const actualLoot = isEliteRoom && currentRoom.eliteRewards
      ? currentRoom.eliteRewards
      : combatEngine.lootReward;

    const hasUncollectedItems = actualLoot && actualLoot.items && actualLoot.items.length > 0;

    // If there are uncollected items, ask for confirmation
    if (hasUncollectedItems) {
      const confirmMessage = t('router.uncollectedItemsWarning', { count: actualLoot.items.length });
      const confirm = window.confirm(confirmMessage);

      if (!confirm) {
        return; // Don't continue if user cancels
      }
    }

    // Award remaining loot to player (gold was already auto-collected on victory)
    if (combatEngine.lootReward) {
      // Add all remaining items to inventory
      for (const item of combatEngine.lootReward.items) {
        await gameActions.addItem(item);
      }
    }

    // Save game to persist changes
    await gameActions.saveGame();

    // Close combat and victory screen
    setShowDungeonVictory(false);
    setCombatActive(false);

    // Increment update key to force DungeonExplorer to re-render
    setDungeonUpdateKey(prev => prev + 1);
    forceUpdate({});
  };

  // Show dungeon if active
  if (inDungeon && currentDungeon) {
    // Get active party from game state
    const activeHeroes = gameState.activeParty || [];

    return (
      <>
        {!combatActive && (
          <DungeonExplorer
            dungeon={currentDungeon}
            dungeonUpdateKey={dungeonUpdateKey}
            heroes={activeHeroes}
            onCombatStart={handleDungeonCombatStart}
            onTreasureLooted={async (gold, items) => {
              console.log('💰 Treasure looted:', gold, 'gold and', items.length, 'items');
              // Add loot to inventory using gameActions
              await gameActions.addGold(gold);
              for (const item of items) {
                await gameActions.addItem(item);
              }
              forceUpdate({});
            }}
            onDungeonExit={handleDungeonExit}
            onFloorComplete={() => {
              console.log('🎉 Floor completed!');
              forceUpdate({});
            }}
          />
        )}

        {/* Combat Display */}
        {combatActive && (
          <div style={{
            width: '100vw',
            height: '100vh',
            background: '#1a1a2e',
            color: '#fff',
            padding: '20px',
            overflow: 'auto'
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

            {/* Defeat Screen - Exit Button */}
            {combatEngine.combatResult === 'defeat' && (
              <div style={{
                marginBottom: '20px',
                padding: '20px',
                background: 'linear-gradient(135deg, #dc3545 0%, #a71d2a 100%)',
                borderRadius: '12px',
                border: '3px solid #8b0000',
                textAlign: 'center'
              }}>
                <h3 style={{
                  color: '#fff',
                  marginBottom: '15px',
                  fontSize: '1.5em',
                  fontWeight: 'bold',
                  margin: '0 0 15px 0'
                }}>
                  {t('router.allHeroesFallen')}
                </h3>
                <p style={{
                  color: '#ffcccc',
                  marginBottom: '20px',
                  fontSize: '1.1em'
                }}>
                  {t('router.defeatMessage')}
                </p>
                <button
                  onClick={handleDungeonExit}
                  style={{
                    width: '100%',
                    fontSize: '1.3em',
                    padding: '15px',
                    background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
                  }}
                >
                  {t('router.returnToWorldMap')}
                </button>
              </div>
            )}

            {/* Loot Rewards Display */}
            {combatEngine.combatResult === 'victory' && combatEngine.lootReward && showDungeonVictory && (() => {
              // Determine actual loot to display (elite rewards or standard combat loot)
              const currentRoom = currentDungeon?.getCurrentRoom();
              const isEliteRoom = currentRoom && (currentRoom.type === 'elite' || currentRoom.type === 'miniboss');
              const actualLoot = isEliteRoom && currentRoom.eliteRewards
                ? currentRoom.eliteRewards
                : combatEngine.lootReward;

              return (
                <div style={{
                  marginBottom: '20px',
                  padding: '20px',
                  background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                  borderRadius: '12px',
                  border: '3px solid #f0c000',
                  boxShadow: '0 4px 8px rgba(255, 215, 0, 0.3)'
                }}>
                  <h3 style={{
                    color: '#8b6914',
                    marginBottom: '15px',
                    textAlign: 'center',
                    fontSize: '1.5em',
                    fontWeight: 'bold',
                    margin: '0 0 15px 0'
                  }}>
                    {t('router.lootRewards')}
                  </h3>

                  {/* Instruction */}
                  <div style={{
                    padding: '10px',
                    background: 'rgba(139, 105, 20, 0.1)',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    textAlign: 'center',
                    color: '#8b6914',
                    fontSize: '0.9em'
                  }}>
                    {t('router.lootInstruction')}
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '20px',
                    marginBottom: '15px'
                  }}>
                    {/* Gold Reward */}
                    <div style={{
                      flex: 1,
                      padding: '15px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '8px',
                      textAlign: 'center',
                      border: '2px solid #f0c000'
                    }}>
                      <div style={{ fontSize: '2em', marginBottom: '5px' }}>💰</div>
                      <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#8b6914' }}>
                        {t('router.goldAmount', { amount: actualLoot.gold })}
                      </div>
                    </div>

                    {/* Items Count */}
                    <div style={{
                      flex: 1,
                      padding: '15px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '8px',
                      textAlign: 'center',
                      border: '2px solid #f0c000'
                    }}>
                      <div style={{ fontSize: '2em', marginBottom: '5px' }}>🎁</div>
                      <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#8b6914' }}>
                        {t('router.itemsCount', { count: actualLoot.items.length })}
                      </div>
                    </div>
                  </div>

                  {/* Loot Items */}
                  {actualLoot.items.length > 0 && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '10px',
                      padding: '15px',
                      background: 'rgba(255, 255, 255, 0.7)',
                      borderRadius: '8px',
                      marginBottom: '15px'
                    }}>
                      {actualLoot.items.map((item: any, index: number) => (
                        <div
                          key={index}
                          style={{
                            padding: '10px',
                            background: '#fff',
                            borderRadius: '6px',
                            border: `2px solid ${item.getRarityColor()}`,
                            textAlign: 'center'
                          }}
                        >
                          <div style={{ fontSize: '2em', marginBottom: '5px' }}>{item.icon}</div>
                          <div style={{
                            fontSize: '0.9em',
                            fontWeight: 'bold',
                            color: item.getRarityColor(),
                            marginBottom: '3px'
                          }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '0.75em', color: '#666' }}>
                            {item.getRarityDisplayName()} | Lv.{item.level}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {actualLoot.items.length > 0 && (
                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      marginBottom: '15px'
                    }}>
                      <button
                        onClick={async () => {
                          // Collect all items to inventory
                          for (const item of actualLoot.items) {
                            await gameActions.addItem(item);
                          }
                          // Clear items from loot
                          actualLoot.items = [];
                          forceUpdate({});
                        }}
                        style={{
                          flex: 1,
                          fontSize: '1.1em',
                          padding: '12px',
                          background: '#28a745',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        {t('router.collectAll')}
                      </button>
                      <button
                        onClick={async () => {
                          // Sell all items
                          const totalValue = actualLoot.items.reduce((sum: number, item: any) => sum + item.value, 0);
                          await gameActions.addGold(totalValue);
                          actualLoot.items = [];
                          actualLoot.gold = 0;
                          forceUpdate({});
                        }}
                        style={{
                          flex: 1,
                          fontSize: '1.1em',
                          padding: '12px',
                          background: '#ffc107',
                          color: '#000',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        {t('router.sellAll')}
                      </button>
                    </div>
                  )}

                  {actualLoot.items.length === 0 && actualLoot.gold === 0 && (
                    <div style={{
                      padding: '15px',
                      background: 'rgba(255, 255, 255, 0.7)',
                      borderRadius: '8px',
                      textAlign: 'center',
                      color: '#666',
                      fontStyle: 'italic'
                    }}>
                      {t('router.allLootCollected')}
                    </div>
                  )}

                  {/* Continue Exploring Button */}
                  <button
                    onClick={handleDungeonVictoryContinue}
                    style={{
                      width: '100%',
                      fontSize: '1.3em',
                      padding: '15px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                    }}
                  >
                    {t('router.continueExploring')}
                  </button>
                </div>
              );
            })()}

            {/* Combat Teams */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '20px'
            }}>
              {/* Heroes */}
              <div>
                <h3 style={{ marginBottom: '15px' }}>{t('router.heroes')}</h3>
                {activeHeroes.map((hero) => (
                  <div key={hero.id} style={{
                    padding: '15px',
                    marginBottom: '10px',
                    background: hero.isAlive ? '#2a2a4a' : '#1a1a2a',
                    borderRadius: '8px',
                    border: '2px solid ' + (hero.isAlive ? '#4a9eff' : '#666'),
                    opacity: hero.isAlive ? 1 : 0.5
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>{hero.name}</span>
                      <span>Lv.{hero.level}</span>
                    </div>
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
                    <div style={{ marginTop: '8px', display: 'flex', gap: '10px', fontSize: '0.9em' }}>
                      <span>⚔️ {hero.ATK}</span>
                      <span>🛡️ {hero.DEF}</span>
                      <span>⚡ {hero.SPD}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Enemies */}
              <div>
                <h3 style={{ marginBottom: '15px' }}>{t('router.enemies')}</h3>
                {currentEnemies.map((enemy) => (
                  <div key={enemy.id} style={{
                    padding: '15px',
                    marginBottom: '10px',
                    background: enemy.isAlive ? '#4a2a2a' : '#1a1a2a',
                    borderRadius: '8px',
                    border: '2px solid ' + (enemy.type === 'boss' ? '#ff4444' : enemy.type === 'elite' ? '#ffaa00' : enemy.isAlive ? '#ff6b6b' : '#666'),
                    opacity: enemy.isAlive ? 1 : 0.5
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>
                        {enemy.type === 'boss' && '💀 '}
                        {enemy.type === 'elite' && '⭐ '}
                        {enemy.name}
                      </span>
                      <span>Lv.{enemy.level}</span>
                    </div>
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
                    <div style={{ marginTop: '8px', display: 'flex', gap: '10px', fontSize: '0.9em' }}>
                      <span>⚔️ {enemy.ATK}</span>
                      <span>🛡️ {enemy.DEF}</span>
                      <span>⚡ {enemy.SPD}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Combat Log */}
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
          </div>
        )}
      </>
    );
  }

  // Default: Main game
  return (
    <div>
      <div style={{
        position: 'fixed',
        bottom: 10,
        right: 10,
        zIndex: 10000,
        background: '#666',
        color: '#fff',
        padding: '8px 16px',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '12px',
        border: '1px solid #444'
      }}
      onClick={() => navigate('/test')}>
        {t('router.testUI')}
      </div>
      <WorldMapDemo2
        userEmail={userEmail}
        onEnterDungeon={handleEnterDungeon}
      />
    </div>
  );
}
