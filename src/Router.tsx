/**
 * Router Component - Main application router and combat controller
 *
 * Main game router with WorldMap integration and combat system.
 * Manages combat state for both dungeon and worldmap quick combat encounters.
 *
 * Contains:
 * - Route handling (single route for main game)
 * - Combat system integration (dungeon and quick combat)
 * - Combat UI rendering (heroes, enemies, manual controls)
 * - Victory/defeat modals with rewards display
 * - Authentication state management
 * - Single useGameState instance passed to WorldMap (shared state pattern)
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-16
 */

import { useState, useEffect } from 'react';
import { WorldMap } from './components/WorldMap';
import type { DungeonEntrance, StaticObject, DynamicObject } from './types/worldmap.types';
import { Dungeon } from './engine/dungeon/Dungeon';
import { DungeonExplorer } from './components/DungeonExplorer';
import { useGameState } from './hooks/useGameState';
import { Hero } from './engine/hero/Hero';
import * as AuthService from './services/AuthService';
import { sessionManager } from './services/SessionManager';
import { CombatEngine } from './engine/combat/CombatEngine';
import { Enemy } from './engine/combat/Enemy';
import type { Combatant, CombatLogEntry } from './types/combat.types';
import { t } from './localization/i18n';
import { DUNGEON_CONFIG, COMBAT_CONFIG } from './config/BALANCE_CONFIG';
import { LoginScreen } from './components/LoginScreen';
import { GameModal } from './components/ui/GameModal';
import { ModalText, ModalDivider, ModalInfoRow, ModalInfoBox, ModalButton } from './components/ui/ModalContent';
import { LeaderboardService } from './services/LeaderboardService';
import { calculatePlayerScore } from './utils/scoreCalculator';
import type { Item } from './engine/item/Item';
import { CombatSpeedControl, type CombatSpeed } from './components/combat/CombatSpeedControl';
import { CombatModeToggle, type CombatMode } from './components/combat/CombatModeToggle';
import { Tooltip, EnemyTooltip } from './components/combat/Tooltip';
import { DamageNumberContainer } from './components/combat/DamageNumber';
import { CombatActionTooltip } from './components/combat/CombatActionTooltip';
import { getSpeedDelay } from './utils/combatUtils';
import { createTestEnemies, type TestScenario } from './debug/testCombat';
import './components/combat/CombatLayout.css';
import heroPortrait from './assets/images/portrait/king_arthur1.png';

/**
 * Combat metadata for quick combat encounters
 */
interface QuickCombatMetadata {
  position?: { x: number; y: number };
  type?: string;
  [key: string]: unknown;
}

/**
 * Quick combat victory rewards
 */
interface QuickCombatVictory {
  gold: number;
  xp: number;
  levelUps: Array<{ heroName: string; newLevel: number }>;
  items: Item[];
}

export function Router() {
  const [userEmail, setUserEmail] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(true);
  const [currentDungeon, setCurrentDungeon] = useState<Dungeon | null>(null);
  const [inDungeon, setInDungeon] = useState(false);
  const [sessionInvalidatedMessage, setSessionInvalidatedMessage] = useState<string | null>(null);

  // Get game state for heroes
  const [gameState, gameActions] = useGameState(userEmail);

  // Combat System State
  const [combatEngine] = useState(() => new CombatEngine());
  const [combatActive, setCombatActive] = useState(false);
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [combatLogCollapsed, setCombatLogCollapsed] = useState(false);
  const [currentEnemies, setCurrentEnemies] = useState<Enemy[]>([]);
  const [isManualMode, setIsManualMode] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [activeCharacter, setActiveCharacter] = useState<Combatant | null>(null);
  const [tooltipTarget, setTooltipTarget] = useState<Combatant | null>(null);
  const [showDungeonVictory, setShowDungeonVictory] = useState(false);
  const [dungeonUpdateKey, setDungeonUpdateKey] = useState(0);
  const [, forceUpdate] = useState({});
  const [quickCombatMetadata, setQuickCombatMetadata] = useState<QuickCombatMetadata | null>(null);
  const [quickCombatVictory, setQuickCombatVictory] = useState<QuickCombatVictory | null>(null);
  const [quickCombatDefeat, setQuickCombatDefeat] = useState(false);
  const [combatSpeed, setCombatSpeed] = useState<CombatSpeed>('NORMAL');

  // Animation state
  const [damageNumbers, setDamageNumbers] = useState<Array<{ id: string; characterId: string; value: number; type: 'damage' | 'heal' | 'critical' | 'miss' }>>([]);
  const [characterAnimations, setCharacterAnimations] = useState<Record<string, string>>({});
  const [activeSkills, setActiveSkills] = useState<Record<string, string>>({});

  // Debug manual combat state
  useEffect(() => {
    if (combatActive) {
      console.log('🔍 Manual Combat State:', {
        waitingForInput,
        activeCharacter: activeCharacter?.name,
        isManualMode,
        combatEngineWaiting: combatEngine.waitingForPlayerInput,
        combatEngineCurrent: combatEngine.currentCharacter?.name
      });
    }
  }, [waitingForInput, activeCharacter, isManualMode, combatActive]);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const session = await AuthService.getCurrentSession();
      if (session) {
        setUserEmail(session.user.email || '');

        // Initialize session manager for existing session
        // This handles the case where user refreshes the page
        const userId = session.user.id;
        const sessionInitialized = await sessionManager.initialize(userId, (reason) => {
          console.warn('⚠️ Session invalidated:', reason);

          // Show notification to user
          setSessionInvalidatedMessage(reason);

          // Auto-logout after showing message
          setTimeout(async () => {
            await AuthService.logout();
            setUserEmail('');
            setSessionInvalidatedMessage(null);
          }, 100); // Small delay to show modal first
        });

        if (!sessionInitialized) {
          console.warn('⚠️ Failed to initialize session manager for existing session');
        }
      }
      setAuthLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const unsubscribe = AuthService.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email);

      if (session) {
        setUserEmail(session.user.email || '');

        // Only initialize session manager for SIGNED_IN events (not INITIAL_SESSION)
        // INITIAL_SESSION is already handled by checkAuth() above
        if (event === 'SIGNED_IN') {
          console.log('🔐 New sign in detected, initializing session manager');
          const userId = session.user.id;
          const sessionInitialized = await sessionManager.initialize(userId, (reason) => {
            console.warn('⚠️ Session invalidated:', reason);

            // Show notification to user
            setSessionInvalidatedMessage(reason);

            // Auto-logout after showing message
            setTimeout(async () => {
              await AuthService.logout();
              setUserEmail('');
              setSessionInvalidatedMessage(null);
            }, 100); // Small delay to show modal first
          });

          if (!sessionInitialized) {
            console.warn('⚠️ Failed to initialize session manager');
          }
        }
      } else {
        setUserEmail('');
        // Clean up session manager on logout
        sessionManager.destroy();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Setup debug test combat function
  useEffect(() => {
    window.__startTestCombat = (scenario: string = 'mixed') => {
      const validScenarios: TestScenario[] = ['mixed', 'boss', 'elite', 'swarm', 'tough'];
      const testScenario = validScenarios.includes(scenario as TestScenario)
        ? (scenario as TestScenario)
        : 'mixed';

      console.log(`⚔️ Starting test combat: ${testScenario}`);

      const avgLevel = gameState.activeParty && gameState.activeParty.length > 0
        ? Math.floor(gameState.activeParty.reduce((sum, h) => sum + h.level, 0) / gameState.activeParty.length)
        : 5;

      const enemies = createTestEnemies(testScenario, avgLevel);

      console.log(`📋 Spawned ${enemies.length} enemies:`);
      enemies.forEach((e, i) => {
        const icon = e.type === 'boss' ? '💀' : e.type === 'elite' ? '⭐' : '👹';
        console.log(`  ${i + 1}. ${icon} ${e.name} (Lv.${e.level}, ${e.type})`);
      });

      handleQuickCombat(enemies, 'wandering_monster', {
        position: { x: 0, y: 0 },
        type: 'debug_test',
        mode: 'auto'
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.activeParty]);

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
    return <LoginScreen onLoginSuccess={() => {}} />;
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
    let difficultyProbabilities: { easy: number; normal: number; hard: number; elite: number };

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
   * Update deepest floor reached in leaderboards
   *
   * Called when player reaches a new floor in dungeon.
   * Updates the leaderboard with the deepest floor reached.
   *
   * @param floorNumber - The deepest floor number reached
   * @param dungeonName - Name of the dungeon
   */
  const updateDeepestFloor = async (floorNumber: number, dungeonName: string) => {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        console.warn('No user logged in, skipping leaderboard update');
        return;
      }

      // Calculate combat power for leaderboard
      const combatPower = calculatePlayerScore(gameState.activeParty || []);

      // Update deepest_floor leaderboard (fire and forget)
      LeaderboardService.updateLeaderboardEntry(
        user.id,
        'deepest_floor',
        floorNumber,
        gameState.playerName || 'Anonymous', // playerName
        undefined, // playerLevel - will be filled from profile
        dungeonName, // dungeon name
        combatPower // combat power
      ).catch(err => {
        console.warn('Failed to update deepest_floor leaderboard:', err);
      });
    } catch (error) {
      console.warn('Failed to update deepest floor:', error);
    }
  };

  /**
   * Handle exit from dungeon back to worldmap
   *
   * Clears current dungeon state and switches UI back to worldmap view.
   * IMPORTANT: Saves heroes before exiting to persist any progress (XP, levels, HP changes).
   */
  const handleDungeonExit = async () => {
    // Save heroes before exiting to ensure all progress is persisted
    // This includes XP gains, level ups, and HP changes during dungeon exploration
    const updatedHeroes = combatEngine?.heroes as Hero[] || gameState.activeParty;
    await gameActions.updateActiveParty(updatedHeroes, false); // Allow auto-save

    setCurrentDungeon(null);
    setInDungeon(false);
  };

  /**
   * Handle exit from quick combat
   */
  const handleQuickCombatExit = () => {
    setCombatActive(false);
    setCombatLog([]);
    setWaitingForInput(false);
    setActiveCharacter(null);
    setTooltipTarget(null);
    setQuickCombatMetadata(null);
  };

  /**
   * Handle combat start from dungeon
   *
   * Initializes combat engine with current party and enemies, sets up combat UI,
   * and starts either manual or auto combat based on mode setting.
   *
   * @param enemies - Array of Enemy instances for this combat encounter
   */
  /**
   * Run auto combat for quick encounters
   */
  const runQuickAutoCombat = async () => {
    while (combatEngine.isActive && !combatEngine.waitingForPlayerInput && !isManualMode) {
      combatEngine.executeTurn();
      setCombatLog([...combatEngine.combatLog]);
      forceUpdate({});

      // Wait between turns for visibility - use current speed setting
      const delay = getSpeedDelay(combatSpeed);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // If we stopped because of manual mode switch, set up for player input
    if (combatEngine.isActive && isManualMode) {
      setWaitingForInput(true);
      setActiveCharacter(combatEngine.currentCharacter);
    }
  };

  /**
   * Handle quick combat from worldmap (rare spawns, wandering monsters)
   *
   * Starts combat directly without entering a dungeon.
   * Supports both manual and auto combat modes.
   * Uses closure pattern to capture metadata and pass to combat end callback.
   *
   * @param enemies - Array of enemies to fight
   * @param combatType - Type of combat encounter ('rare_spawn' or 'wandering_monster')
   * @param metadata - Combat metadata including position, mode, and object references
   *
   * @example
   * ```typescript
   * handleQuickCombat(
   *   [goblin1, goblin2],
   *   'wandering_monster',
   *   { position: {x: 5, y: 10}, mode: 'auto', monsterObject: {...} }
   * );
   * ```
   */
  const handleQuickCombat = (enemies: Enemy[], combatType: 'rare_spawn' | 'wandering_monster', metadata?: QuickCombatMetadata) => {
    console.log(`⚔️ Quick combat starting: ${combatType}`, enemies.length, 'enemies');
    console.log('📋 Combat metadata:', metadata);

    const activeHeroes = gameState.activeParty || [];

    // Get combat mode from metadata (default to auto if not specified)
    const mode = metadata?.mode || 'auto';
    const isManual = mode === 'manual';

    setCurrentEnemies(enemies);
    setQuickCombatMetadata(metadata);
    setCombatActive(true);

    // IMPORTANT: Capture metadata in closure to avoid null reference later
    const capturedMetadata = metadata;

    // Use setTimeout to ensure state updates have processed before initializing combat
    setTimeout(() => {
      // Initialize combat
      combatEngine.initialize(activeHeroes, enemies);
      combatEngine.isManualMode = isManual;
      setCombatLog([...combatEngine.combatLog]);

      // Set callback for combat end - use quick combat handler with captured metadata
      combatEngine.onCombatEnd = () => handleQuickCombatEnd(capturedMetadata);

      // Set animation callbacks
      combatEngine.onDamageDealt = (targetId: string, damage: number, isCritical: boolean) => {
        const newDamage = {
          id: `${targetId}-${Date.now()}-${Math.random()}`,
          characterId: targetId,
          value: damage,
          type: (isCritical ? 'critical' : 'damage') as 'damage' | 'critical'
        };
        setDamageNumbers(prev => [...prev, newDamage]);
        setCharacterAnimations(prev => ({ ...prev, [targetId]: 'taking-damage' }));
        setTimeout(() => setCharacterAnimations(prev => {
          const rest = { ...prev };
          delete rest[targetId];
          return rest;
        }), 600);
      };

      combatEngine.onHealApplied = (targetId: string, amount: number) => {
        const newHeal = {
          id: `${targetId}-${Date.now()}-${Math.random()}`,
          characterId: targetId,
          value: amount,
          type: 'heal' as const
        };
        setDamageNumbers(prev => [...prev, newHeal]);
        setCharacterAnimations(prev => ({ ...prev, [targetId]: 'healing' }));
        setTimeout(() => setCharacterAnimations(prev => {
          const rest = { ...prev };
          delete rest[targetId];
          return rest;
        }), 800);
      };

      combatEngine.onSkillUsed = (casterId: string, skillName: string) => {
        setActiveSkills(prev => ({ ...prev, [casterId]: skillName }));
        setCharacterAnimations(prev => ({ ...prev, [casterId]: 'using-skill' }));
        setTimeout(() => {
          setActiveSkills(prev => {
            const rest = { ...prev }; delete rest[casterId];
            return rest;
          });
          setCharacterAnimations(prev => {
            const rest = { ...prev }; delete rest[casterId];
            return rest;
          });
        }, 1500);
      };

      combatEngine.onAttackAnimation = (attackerId: string) => {
        setCharacterAnimations(prev => ({ ...prev, [attackerId]: 'attacking' }));
        setTimeout(() => setCharacterAnimations(prev => {
          const rest = { ...prev }; delete rest[attackerId];
          return rest;
        }), 600);
      };

      if (isManual) {
        // Execute enemy turns until we reach first hero
        while (combatEngine.isActive && !combatEngine.waitingForPlayerInput) {
          combatEngine.executeTurn();
          setCombatLog([...combatEngine.combatLog]);
        }

        if (combatEngine.waitingForPlayerInput) {
          setWaitingForInput(true);
          setActiveCharacter(combatEngine.currentCharacter);
        }
      } else {
        // Auto mode - start combat loop
        runQuickAutoCombat();
      }
    }, 0);
  };

  /**
   * Handle quick combat end (without dungeon context)
   *
   * Processes combat results for worldmap encounters.
   * On victory: awards loot, XP, marks monster as defeated
   * On defeat: restores heroes to 10% HP
   * Uses closure pattern - metadata passed as parameter to avoid React state issues.
   *
   * @param metadata - Combat metadata from combat start (position, type, object references)
   *                   Passed directly as parameter to avoid null state closure issues
   *
   * @example
   * ```typescript
   * // Called from combat engine callback
   * combatEngine.onCombatEnd = () => handleQuickCombatEnd(capturedMetadata);
   * ```
   */
  const handleQuickCombatEnd = async (metadata?: QuickCombatMetadata) => {
    console.log('✅ Quick combat completed');
    console.log('🔍 DEBUG: handleQuickCombatEnd called');
    console.log('🔍 DEBUG: metadata parameter:', metadata);
    console.log('🔍 DEBUG: quickCombatMetadata state:', quickCombatMetadata);

    // Use metadata parameter if provided, otherwise fall back to state
    const combatMetadata = metadata || quickCombatMetadata;

    // Check if it's a defeat (all heroes dead)
    const allHeroesDead = gameState.activeParty.every(hero => !hero.isAlive);

    if (allHeroesDead) {
      // Handle defeat
      setCombatActive(true);
      setWaitingForInput(false);
      setActiveCharacter(null);
      setTooltipTarget(null);
      forceUpdate({});

      // Show defeat modal
      setTimeout(async () => {
        setQuickCombatDefeat(true);
        // Get heroes from combat engine (they have the actual state)
        const heroesAfterCombat = combatEngine.heroes as Hero[];

        // Set heroes to 10% HP (they need to go heal in town)
        heroesAfterCombat.forEach(hero => {
          hero.currentHP = Math.max(1, Math.floor(hero.maxHP * 0.1));
          hero.isAlive = true;
          hero.resetCombatState();
        });

        // Save the updated hero HP to database
        await gameActions.updateActiveParty(heroesAfterCombat, false);

        setCombatActive(false);
        setCombatLog([]);
      }, 2000);

      return;
    }

    // Victory! Mark monster/rare spawn as defeated in worldMap
    if (combatMetadata && gameState.worldMap) {
      console.log('🔍 DEBUG: Starting to mark monster as defeated');
      console.log('🔍 DEBUG: combatMetadata:', combatMetadata);
      console.log('🔍 DEBUG: Current worldMap dynamicObjects count:', gameState.worldMap.dynamicObjects.length);

      const updatedWorldMap = { ...gameState.worldMap };

      // Find and mark the specific object as defeated
      if (combatMetadata.position) {
        const pos = combatMetadata.position;
        console.log('🔍 DEBUG: Looking for object at position:', pos);

        // Handle rare spawns (static objects)
        if (combatMetadata.rareSpawnObject) {
          console.log('🔍 DEBUG: Marking rare spawn as defeated (static object)');
          const tile = updatedWorldMap.tiles[pos.y]?.[pos.x];
          if (tile && tile.staticObject && tile.staticObject.type === 'rareSpawn') {
            // Create new tiles array with updated static object
            updatedWorldMap.tiles = updatedWorldMap.tiles.map((row, y) =>
              y === pos.y ? row.map((cell, x) =>
                x === pos.x && cell.staticObject?.type === 'rareSpawn'
                  ? { ...cell, staticObject: { ...cell.staticObject, defeated: true } as StaticObject }
                  : cell
              ) : row
            );
            console.log('🎯 Rare spawn marked as defeated at position', pos);
          } else {
            console.error('❌ DEBUG: Could not find rare spawn at position:', pos);
          }
        }
        // Handle wandering monsters and encounters (dynamic objects)
        else {
          const objectIndex = updatedWorldMap.dynamicObjects.findIndex(
            obj => obj.position.x === pos.x && obj.position.y === pos.y
          );

          console.log('🔍 DEBUG: Found dynamic object at index:', objectIndex);

          if (objectIndex !== -1) {
            const obj = updatedWorldMap.dynamicObjects[objectIndex];
            const beforeDefeated = (obj.type === 'encounter' || obj.type === 'wanderingMonster') ? (obj as DynamicObject & { defeated?: boolean }).defeated : undefined;
            console.log('🔍 DEBUG: Object defeated status BEFORE update:', beforeDefeated);

            // Create new array with updated object
            updatedWorldMap.dynamicObjects = [...updatedWorldMap.dynamicObjects];
            updatedWorldMap.dynamicObjects[objectIndex] = {
              ...updatedWorldMap.dynamicObjects[objectIndex],
              defeated: true,
              isActive: false
            } as DynamicObject;

            const updatedObj = updatedWorldMap.dynamicObjects[objectIndex];
            console.log('🔍 DEBUG: Object defeated status AFTER update:', (updatedObj.type === 'encounter' || updatedObj.type === 'wanderingMonster') ? (updatedObj as DynamicObject & { defeated?: boolean }).defeated : undefined);

            if (combatMetadata.monsterObject) {
              console.log('🎯 Wandering monster marked as defeated at position', pos);
            }
          } else {
            console.error('❌ DEBUG: Could not find dynamic object at position:', pos);
          }
        }
      }

      // Update worldmap with defeated status
      console.log('🔍 DEBUG: Calling updateWorldMap with defeated monsters count:',
        updatedWorldMap.dynamicObjects.filter(obj => (obj.type === 'encounter' || obj.type === 'wanderingMonster') && (obj as DynamicObject & { defeated?: boolean }).defeated).length);
      await gameActions.updateWorldMap(updatedWorldMap);
      console.log('🔍 DEBUG: updateWorldMap completed');
    }

    // Victory! Get rewards from combat engine
    const loot = combatEngine.lootReward;
    const goldReward = loot?.gold || 0;

    // Calculate total XP awarded (from combat log or recalculate)
    const totalEnemyLevel = currentEnemies.reduce((sum, enemy) => sum + enemy.level, 0);
    const avgEnemyLevel = totalEnemyLevel / (currentEnemies.length || 1);
    const numEnemies = currentEnemies.length;
    const baseXP = 50;
    const xpReward = Math.floor(baseXP * avgEnemyLevel * numEnemies);

    console.log(`💰 Victory rewards: ${goldReward} gold, ${xpReward} XP, ${loot?.items.length || 0} items`);

    // Award gold
    await gameActions.addGold(goldReward);

    // Add items to inventory
    if (loot?.items && loot.items.length > 0) {
      console.log(`📦 Adding ${loot.items.length} items to inventory...`);
      for (const item of loot.items) {
        await gameActions.addItem(item);
        console.log(`  ✓ Added: ${item.name} (${item.rarity})`);
      }
    }

    // Get heroes from combat engine (they have the actual updated state with XP)
    const heroesAfterCombat = combatEngine.heroes as Hero[];

    // Track level ups before saving
    const levelUps: Array<{ heroName: string; newLevel: number }> = [];
    const heroesBeforeSave = heroesAfterCombat.map(h => ({ name: h.name, level: h.level }));

    // Save updated heroes (XP already awarded by CombatEngine)
    // Pass heroesAfterCombat to ensure we save the correct state
    await gameActions.updateActiveParty(heroesAfterCombat, false);

    // Check for level ups
    heroesAfterCombat.forEach((hero, i) => {
      if (hero.level > heroesBeforeSave[i].level) {
        levelUps.push({ heroName: hero.name, newLevel: hero.level });
      }
    });

    // Show victory modal instead of alert
    setTimeout(() => {
      setQuickCombatVictory({
        gold: goldReward,
        xp: xpReward,
        levelUps,
        items: loot?.items || []
      });
      setCombatActive(false);
      setCombatLog([]);
      setWaitingForInput(false);
      setActiveCharacter(null);
      setTooltipTarget(null);
    }, 1000);
  };

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

    // Set animation callbacks
    combatEngine.onDamageDealt = (targetId: string, damage: number, isCritical: boolean) => {
      const newDamage = {
        id: `${targetId}-${Date.now()}-${Math.random()}`,
        characterId: targetId,
        value: damage,
        type: (isCritical ? 'critical' : 'damage') as 'damage' | 'critical'
      };
      setDamageNumbers(prev => [...prev, newDamage]);
      setCharacterAnimations(prev => ({ ...prev, [targetId]: 'taking-damage' }));
      setTimeout(() => setCharacterAnimations(prev => {
        const rest = { ...prev }; delete rest[targetId];
        return rest;
      }), 600);
    };

    combatEngine.onHealApplied = (targetId: string, amount: number) => {
      const newHeal = {
        id: `${targetId}-${Date.now()}-${Math.random()}`,
        characterId: targetId,
        value: amount,
        type: 'heal' as const
      };
      setDamageNumbers(prev => [...prev, newHeal]);
      setCharacterAnimations(prev => ({ ...prev, [targetId]: 'healing' }));
      setTimeout(() => setCharacterAnimations(prev => {
        const rest = { ...prev }; delete rest[targetId];
        return rest;
      }), 800);
    };

    combatEngine.onSkillUsed = (casterId: string, skillName: string) => {
      setActiveSkills(prev => ({ ...prev, [casterId]: skillName }));
      setCharacterAnimations(prev => ({ ...prev, [casterId]: 'using-skill' }));
      setTimeout(() => {
        setActiveSkills(prev => {
          const rest = { ...prev }; delete rest[casterId];
          return rest;
        });
        setCharacterAnimations(prev => {
          const rest = { ...prev }; delete rest[casterId];
          return rest;
        });
      }, 1500);
    };

    combatEngine.onAttackAnimation = (attackerId: string) => {
      setCharacterAnimations(prev => ({ ...prev, [attackerId]: 'attacking' }));
      setTimeout(() => setCharacterAnimations(prev => {
        const rest = { ...prev }; delete rest[attackerId];
        return rest;
      }), 600);
    };

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
    while (combatEngine.isActive && !combatEngine.waitingForPlayerInput && !isManualMode) {
      combatEngine.executeTurn();
      setCombatLog([...combatEngine.combatLog]);
      forceUpdate({});

      // Wait between turns for visibility
      if (combatEngine.isActive && !combatEngine.waitingForPlayerInput && !isManualMode) {
        await new Promise(resolve => setTimeout(resolve, COMBAT_CONFIG.AUTO_COMBAT_DELAY));
      }
    }

    // If we stopped because of manual mode switch, set up for player input
    if (combatEngine.isActive && isManualMode) {
      setWaitingForInput(true);
      setActiveCharacter(combatEngine.currentCharacter);
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

    // CRITICAL: Use combatEngine.heroes instead of gameState.activeParty
    // because gameState might be stale due to re-renders during combat
    const heroesAfterCombat = combatEngine.heroes as Hero[];

    const result = currentDungeon.completeCombat();
    console.log('✅ Combat completed:', result.message);
    console.log('✅ Current room after combat:', currentDungeon.getCurrentRoom());

    // Check if it's a defeat (all heroes dead)
    const allHeroesDead = heroesAfterCombat.every(hero => !hero.isAlive);

    if (allHeroesDead) {
      // Handle defeat - keep combat screen but don't show victory
      setCombatActive(true);
      setShowDungeonVictory(false);
      setWaitingForInput(false);
      setActiveCharacter(null);
      setTooltipTarget(null);
      forceUpdate({});

      // Show defeat alert and exit dungeon
      setTimeout(async () => {
        // Set heroes to 10% HP (they need to go heal in town)
        heroesAfterCombat.forEach(hero => {
          hero.currentHP = Math.max(1, Math.floor(hero.maxHP * 0.1));
          hero.isAlive = true;
          hero.resetCombatState();
        });

        // Update game state with healed heroes AND SAVE (don't skip auto-save!)
        // This ensures level ups and XP gained before death are persisted
        await gameActions.updateActiveParty(heroesAfterCombat, false);

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
      console.log('🔍 Router: Combat engine heroes after battle:', combatEngine.heroes.map((h) => ({
        name: h.name,
        hp: h.currentHP,
        maxHP: h.maxHP,
        level: h.level,
        xp: (h as Hero).experience,
        id: h.id
      })));

      console.log('🔍 Router: gameState.activeParty after battle:', gameState.activeParty.map(h => ({
        name: h.name,
        hp: h.currentHP,
        maxHP: h.maxHP,
        level: h.level,
        xp: (h as Hero).experience,
        id: h.id
      })));

      console.log('🔍 Router: Are they the same references?', combatEngine.heroes === gameState.activeParty);
      console.log('🔍 Router: First hero same reference?', combatEngine.heroes[0] === gameState.activeParty[0]);

      // CRITICAL FIX: Use heroes from combat engine (they have the updated stats)
      // instead of gameState.activeParty which might be stale
      const updatedHeroes = combatEngine.heroes as Hero[];

      // Update active party and sync to allHeroes
      // updateActiveParty() creates new array references and triggers setUpdateTrigger()
      // which is sufficient for React to detect changes - no need for database reload!
      await gameActions.updateActiveParty(updatedHeroes, false); // Allow auto-save

      // Show victory screen instead of immediately closing combat
      setCombatActive(true); // Explicitly keep combat screen visible
      setShowDungeonVictory(true);
      setWaitingForInput(false);
      setActiveCharacter(null);
      setTooltipTarget(null);
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
    if (combatEngine.lootReward && combatEngine.lootReward.items.length > 0) {
      // OPTIMIZATION: Use batch addItems() instead of for-loop with individual addItem()
      // This reduces multiple setState() calls to a single one = much faster!
      console.log('📦 Adding', combatEngine.lootReward.items.length, 'items in batch...');
      await gameActions.addItems(combatEngine.lootReward.items);
    }

    // CRITICAL: Save heroes BEFORE continuing exploration
    // This ensures level ups, XP, and HP changes from combat are persisted
    // even if player continues exploring and doesn't manually exit dungeon
    const updatedHeroes = combatEngine.heroes as Hero[];
    await gameActions.updateActiveParty(updatedHeroes, false); // Allow auto-save

    // Close combat and victory screen
    setShowDungeonVictory(false);
    setCombatActive(false);

    // Increment update key to force DungeonExplorer to re-render
    setDungeonUpdateKey(prev => prev + 1);
    forceUpdate({});
  };

  // Render both WorldMap and Dungeon - hide/show based on state to prevent unmounting
  return (
    <>
      {/* WorldMap - always mounted, just hidden when in dungeon */}
      <div style={{ display: inDungeon ? 'none' : 'block' }}>
        <WorldMap
          userEmail={userEmail}
          onEnterDungeon={handleEnterDungeon}
          onQuickCombat={handleQuickCombat}
          gameState={gameState}
          gameActions={gameActions}
        />
      </div>

      {/* Dungeon Explorer - only rendered when active */}
      {inDungeon && currentDungeon && !combatActive && (
        <DungeonExplorer
          dungeon={currentDungeon}
          dungeonUpdateKey={dungeonUpdateKey}
          heroes={gameState.activeParty || []}
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
            // Update leaderboard with deepest floor reached
            if (currentDungeon) {
              updateDeepestFloor(currentDungeon.maxFloorReached, currentDungeon.name);
            }
            forceUpdate({});
          }}
        />
      )}

      {/* Combat Display - shown when combat is active (dungeon or quick combat) */}
      {combatActive && (inDungeon && currentDungeon || !inDungeon) && (
          <div className="combat-screen">

            {/* Defeat Screen - Exit Button */}
            {combatEngine.combatResult === 'defeat' && (
              <div className="defeat-screen">
                <h3 className="defeat-title">
                  {t('router.allHeroesFallen')}
                </h3>
                <p className="defeat-message">
                  {t('router.defeatMessage')}
                </p>
                <button
                  onClick={inDungeon ? handleDungeonExit : handleQuickCombatExit}
                  className="defeat-button"
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
                <div className="victory-screen">
                  <h3 className="victory-title">
                    {t('router.lootRewards')}
                  </h3>

                  {/* Instruction */}
                  <div className="victory-instruction">
                    {t('router.lootInstruction')}
                  </div>

                  <div className="victory-rewards-grid">
                    {/* Gold Reward */}
                    <div className="victory-reward-box">
                      <div className="reward-icon">💰</div>
                      <div className="reward-value">
                        {t('router.goldAmount', { amount: actualLoot.gold })}
                      </div>
                    </div>

                    {/* Items Count */}
                    <div className="victory-reward-box">
                      <div className="reward-icon">🎁</div>
                      <div className="reward-value">
                        {t('router.itemsCount', { count: actualLoot.items.length })}
                      </div>
                    </div>
                  </div>

                  {/* Loot Items */}
                  {actualLoot.items.length > 0 && (
                    <div className="loot-items-grid">
                      {actualLoot.items.map((item, index) => (
                        <div
                          key={`loot-${item.id || `loot-item-${index}`}`}
                          className="loot-item"
                          style={{ border: `2px solid ${item.getRarityColor()}` }}
                        >
                          <div className="loot-item-icon">{item.icon}</div>
                          <div className="loot-item-name" style={{ color: item.getRarityColor() }}>
                            {item.name}
                          </div>
                          <div className="loot-item-details">
                            {item.getRarityDisplayName()} | Lv.{item.level}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {actualLoot.items.length > 0 && (
                    <div className="loot-actions">
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
                        className="loot-button collect"
                      >
                        {t('router.collectAll')}
                      </button>
                      <button
                        onClick={async () => {
                          // Sell all items
                          const totalValue = actualLoot.items.reduce((sum, item) => sum + item.goldValue, 0);
                          await gameActions.addGold(totalValue);
                          actualLoot.items = [];
                          actualLoot.gold = 0;
                          forceUpdate({});
                        }}
                        className="loot-button sell"
                      >
                        {t('router.sellAll')}
                      </button>
                    </div>
                  )}

                  {actualLoot.items.length === 0 && actualLoot.gold === 0 && (
                    <div className="loot-empty">
                      {t('router.allLootCollected')}
                    </div>
                  )}

                  {/* Continue Exploring Button */}
                  <button
                    onClick={handleDungeonVictoryContinue}
                    className="continue-button"
                  >
                    {t('router.continueExploring')}
                  </button>
                </div>
              );
            })()}

            {/* Combat Teams */}
            <div className="combat-teams-grid">
              {/* Heroes */}
              <div className="combat-team-section">
                <h3 className="combat-team-title">{t('router.heroes')}</h3>
                {(gameState.activeParty || []).map((hero) => {
                  const isActive = combatEngine.currentCharacter?.id === hero.id;
                  const hpPercentage = hero.currentHP / hero.maxHP;
                  const hpClass = hpPercentage < 0.3 ? 'low' : hpPercentage < 0.6 ? 'medium' : 'high';
                  const animation = characterAnimations[hero.id] || '';
                  const activeSkill = activeSkills[hero.id];
                  const heroDamages = damageNumbers.filter(d => d.characterId === hero.id);

                  // Check if this hero is clickable in manual mode
                  const isClickable = waitingForInput && isManualMode && hero.isAlive && activeCharacter;

                  return (
                  <div
                    key={hero.id}
                    className={`character-card hero ${!hero.isAlive ? 'dead' : ''} ${isActive ? 'active' : ''} ${animation} ${isClickable ? 'clickable' : ''}`}
                    style={{ position: 'relative' }}
                    onClick={() => isClickable && setTooltipTarget(hero)}
                  >
                    {/* Skill Indicator */}
                    {activeSkill && (
                      <div className="skill-indicator">
                        🔮 {activeSkill}
                      </div>
                    )}

                    {/* Damage Numbers */}
                    {heroDamages.map(dmg => (
                      <DamageNumberContainer
                        key={dmg.id}
                        damages={[dmg]}
                        onRemove={(id) => setDamageNumbers(prev => prev.filter(d => d.id !== id))}
                      />
                    ))}

                    {/* Avatar */}
                    <img src={heroPortrait} alt={hero.name} className="character-avatar" />

                    {/* Character Info */}
                    <div className="character-info">
                      <div className="character-card-header">
                        <span className="character-name">{hero.name}</span>
                        <span className="character-level">Lv.{hero.level}</span>
                      </div>
                      <div className="character-hp-bar">
                        <div className={`character-hp-fill ${hpClass}`} style={{ width: `${hpPercentage * 100}%` }} />
                        <span className="character-hp-text">
                          {hero.currentHP}/{hero.maxHP}
                        </span>
                      </div>
                      <div className="character-stats">
                        <span>⚔️ {hero.ATK}</span>
                        <span>🛡️ {hero.DEF}</span>
                        <span>⚡ {hero.SPD}</span>
                      </div>
                    </div>

                    {/* Tooltip */}
                    {tooltipTarget?.id === hero.id && activeCharacter && (
                      <CombatActionTooltip
                        activeCharacter={activeCharacter}
                        target={hero}
                        onAttack={() => {
                          // This shouldn't happen for heroes, but include for completeness
                          setTooltipTarget(null);
                        }}
                        onSkillUse={(skillIndex) => {
                          if ('useSkill' in activeCharacter) {
                            (activeCharacter as Hero).useSkill(skillIndex, [hero]);
                            setCombatLog([...combatEngine.combatLog]);
                            setTooltipTarget(null);
                            setWaitingForInput(false);

                            setTimeout(() => {
                              if (combatEngine.isActive) {
                                combatEngine.executeTurn();
                                setCombatLog([...combatEngine.combatLog]);

                                if (combatEngine.waitingForPlayerInput) {
                                  setWaitingForInput(true);
                                  setActiveCharacter(combatEngine.currentCharacter);
                                } else if (!isManualMode) {
                                  // Continue auto combat if switched to auto
                                  if (inDungeon) {
                                    runDungeonAutoCombat();
                                  } else {
                                    runQuickAutoCombat();
                                  }
                                }
                              }
                            }, 500);
                          }
                        }}
                        onClose={() => setTooltipTarget(null)}
                        position="right"
                      />
                    )}
                  </div>
                  );
                })}
              </div>

              {/* Enemies */}
              <div className="combat-team-section">
                <h3 className="combat-team-title">{t('router.enemies')}</h3>
                {currentEnemies.map((enemy) => {
                  const isActive = combatEngine.currentCharacter?.id === enemy.id;
                  const hpPercentage = enemy.currentHP / enemy.maxHP;
                  const hpClass = hpPercentage < 0.3 ? 'low' : hpPercentage < 0.6 ? 'medium' : 'high';
                  const animation = characterAnimations[enemy.id] || '';
                  const activeSkill = activeSkills[enemy.id];
                  const enemyDamages = damageNumbers.filter(d => d.characterId === enemy.id);

                  // Check if this enemy is clickable in manual mode
                  const isClickable = waitingForInput && isManualMode && enemy.isAlive && activeCharacter;

                  return (
                  <Tooltip
                    key={enemy.id}
                    content={
                      <EnemyTooltip
                        enemy={{
                          name: enemy.name,
                          level: enemy.level,
                          type: enemy.type,
                          ATK: enemy.ATK,
                          DEF: enemy.DEF,
                          SPD: enemy.SPD,
                          currentHP: enemy.currentHP,
                          maxHP: enemy.maxHP
                        }}
                      />
                    }
                    position="left"
                  >
                  <div
                    className={`character-card enemy ${!enemy.isAlive ? 'dead' : ''} ${isActive ? 'active' : ''} ${enemy.type === 'elite' ? 'elite' : ''} ${enemy.type === 'boss' ? 'boss' : ''} ${animation} ${isClickable ? 'clickable' : ''}`}
                    style={{ position: 'relative' }}
                    onClick={() => isClickable && setTooltipTarget(enemy)}
                  >
                    {/* Skill Indicator */}
                    {activeSkill && (
                      <div className="skill-indicator">
                        🔮 {activeSkill}
                      </div>
                    )}

                    {/* Damage Numbers */}
                    {enemyDamages.map(dmg => (
                      <DamageNumberContainer
                        key={dmg.id}
                        damages={[dmg]}
                        onRemove={(id) => setDamageNumbers(prev => prev.filter(d => d.id !== id))}
                      />
                    ))}

                    {/* Avatar - using enemy icon for now */}
                    <div className="character-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                      {enemy.type === 'boss' && '💀'}
                      {enemy.type === 'elite' && '⭐'}
                      {enemy.type === 'normal' && '👹'}
                    </div>

                    {/* Character Info */}
                    <div className="character-info">
                      <div className="character-card-header">
                        <span className="character-name">{enemy.name}</span>
                        <span className="character-level">Lv.{enemy.level}</span>
                      </div>
                      <div className="character-hp-bar">
                        <div className={`character-hp-fill ${hpClass}`} style={{ width: `${hpPercentage * 100}%` }} />
                        <span className="character-hp-text">
                          {enemy.currentHP}/{enemy.maxHP}
                        </span>
                      </div>
                      <div className="character-stats">
                        <span>⚔️ {enemy.ATK}</span>
                        <span>🛡️ {enemy.DEF}</span>
                        <span>⚡ {enemy.SPD}</span>
                      </div>
                    </div>

                    {/* Tooltip */}
                    {tooltipTarget?.id === enemy.id && activeCharacter && (
                      <CombatActionTooltip
                        activeCharacter={activeCharacter}
                        target={enemy}
                        onAttack={() => {
                          if (activeCharacter) {
                            activeCharacter.attack(enemy);
                            setCombatLog([...combatEngine.combatLog]);
                            setTooltipTarget(null);
                            setWaitingForInput(false);

                            setTimeout(() => {
                              if (combatEngine.isActive) {
                                combatEngine.executeTurn();
                                setCombatLog([...combatEngine.combatLog]);

                                if (combatEngine.waitingForPlayerInput) {
                                  setWaitingForInput(true);
                                  setActiveCharacter(combatEngine.currentCharacter);
                                } else if (!isManualMode) {
                                  // Continue auto combat if switched to auto
                                  if (inDungeon) {
                                    runDungeonAutoCombat();
                                  } else {
                                    runQuickAutoCombat();
                                  }
                                }
                              }
                            }, 500);
                          }
                        }}
                        onSkillUse={(skillIndex) => {
                          if ('useSkill' in activeCharacter) {
                            (activeCharacter as Hero).useSkill(skillIndex, [enemy]);
                            setCombatLog([...combatEngine.combatLog]);
                            setTooltipTarget(null);
                            setWaitingForInput(false);

                            setTimeout(() => {
                              if (combatEngine.isActive) {
                                combatEngine.executeTurn();
                                setCombatLog([...combatEngine.combatLog]);

                                if (combatEngine.waitingForPlayerInput) {
                                  setWaitingForInput(true);
                                  setActiveCharacter(combatEngine.currentCharacter);
                                } else if (!isManualMode) {
                                  // Continue auto combat if switched to auto
                                  if (inDungeon) {
                                    runDungeonAutoCombat();
                                  } else {
                                    runQuickAutoCombat();
                                  }
                                }
                              }
                            }, 500);
                          }
                        }}
                        onClose={() => setTooltipTarget(null)}
                        position="left"
                      />
                    )}
                  </div>
                  </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* Bottom Combat Controls */}
            <div className="combat-bottom-panel">
              {/* Combat Status Text */}
              {waitingForInput && activeCharacter && (
                <div className="combat-status-text">
                  🎯 {activeCharacter.name} - Select Target
                </div>
              )}

              {/* Mini Initiative Order */}
              <div className="combat-mini-initiative">
                <div className="mini-initiative-label">Turn Order:</div>
                <div className="mini-initiative-order">
                  {combatEngine.turnOrder.slice(0, 6).map((combatant, index) => {
                    const isActive = combatant.id === activeCharacter?.id;
                    return (
                      <div
                        key={combatant.id}
                        className={`mini-initiative-card ${isActive ? 'active' : ''} ${!combatant.isAlive ? 'dead' : ''}`}
                      >
                        <div className="mini-initiative-icon">
                          {combatant instanceof Enemy ? (
                            combatant.type === 'boss' ? '💀' : combatant.type === 'elite' ? '⭐' : '👹'
                          ) : (
                            '🛡️'
                          )}
                        </div>
                        {index === 0 && <div className="mini-initiative-arrow">▶</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Combat Controls */}
              <div className="combat-bottom-controls">
                <div className="combat-round-display">Round {Math.floor(combatEngine.turnCounter / (gameState.activeParty.filter(h => h.isAlive).length + currentEnemies.filter(e => e.isAlive).length)) + 1}</div>
                <CombatSpeedControl
                  currentSpeed={combatSpeed}
                  onSpeedChange={(speed: CombatSpeed) => {
                    setCombatSpeed(speed);
                  }}
                />
                <CombatModeToggle
                  currentMode={isManualMode ? 'manual' : 'auto'}
                  onModeChange={(mode: CombatMode) => {
                    const manual = mode === 'manual';
                    setIsManualMode(manual);
                    combatEngine.setManualMode(manual);

                    if (manual) {
                      // Switching to manual mode
                      let currentChar = combatEngine.currentCharacter;
                      if (!currentChar && combatEngine.turnOrder.length > 0) {
                        currentChar = combatEngine.turnOrder[0];
                      }
                      if (!currentChar) {
                        currentChar = gameState.activeParty.find(h => h.isAlive);
                      }
                      setActiveCharacter(currentChar || null);
                      setWaitingForInput(true);
                      console.log('🎮 Switched to manual mode, active:', currentChar?.name);
                    } else {
                      // Switching to auto mode
                      setWaitingForInput(false);
                      setActiveCharacter(null);
                      setTooltipTarget(null);
                      console.log('🤖 Switching to auto mode');

                      // Continue auto combat
                      setTimeout(() => {
                        if (inDungeon) {
                          runDungeonAutoCombat();
                        } else {
                          runQuickAutoCombat();
                        }
                      }, 100);
                    }
                  }}
                />
              </div>
            </div>

            {/* Combat Log */}
            <div className={`combat-log-container ${combatLogCollapsed ? 'collapsed' : ''}`}>
              <div className="combat-log-header" onClick={() => setCombatLogCollapsed(!combatLogCollapsed)}>
                <h4 className="combat-log-title">{t('router.combatLog')}</h4>
                <button className="combat-log-toggle">
                  {combatLogCollapsed ? '▼' : '▲'}
                </button>
              </div>
              {!combatLogCollapsed && (
                <div className="combat-log-entries">
                  {combatLog.slice(-20).map((entry, index) => (
                    <div key={index} className={`combat-log-entry ${entry.type}`}>
                      {entry.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      {/* Quick Combat Victory Modal */}
      <GameModal
        isOpen={!!quickCombatVictory}
        title="Victory!"
        icon="🎉"
        onClose={() => {
          setQuickCombatVictory(null);
          setQuickCombatMetadata(null);
        }}
      >
        {quickCombatVictory && (
          <>
            <ModalText>
              You have successfully defeated the enemies!
            </ModalText>
            <ModalDivider />
            <ModalInfoRow label="💰 Gold Earned:" value={quickCombatVictory.gold} valueColor="gold" />
            <ModalInfoRow label="⭐ Experience:" value={quickCombatVictory.xp} valueColor="info" />

            {quickCombatVictory.items && quickCombatVictory.items.length > 0 && (
              <>
                <ModalDivider />
                <ModalInfoBox variant="info">
                  <strong>🎁 Items Dropped:</strong>
                  {quickCombatVictory.items.map((item, i) => (
                    <div key={i} style={{ marginTop: '4px', fontSize: '13px' }}>
                      {item.icon} {item.name} ({item.rarity}, Lv.{item.level})
                    </div>
                  ))}
                </ModalInfoBox>
              </>
            )}

            {quickCombatVictory.levelUps.length > 0 && (
              <>
                <ModalDivider />
                <ModalInfoBox variant="success">
                  <strong>🎊 Level Up!</strong>
                  {quickCombatVictory.levelUps.map((levelUp, i) => (
                    <div key={i} style={{ marginTop: '4px', fontSize: '13px' }}>
                      {levelUp.heroName} reached level {levelUp.newLevel}!
                    </div>
                  ))}
                </ModalInfoBox>
              </>
            )}

            <ModalDivider />
            <ModalButton
              onClick={() => {
                setQuickCombatVictory(null);
                setQuickCombatMetadata(null);
              }}
              variant="primary"
              fullWidth
            >
              Continue
            </ModalButton>
          </>
        )}
      </GameModal>

      {/* Quick Combat Defeat Modal */}
      <GameModal
        isOpen={quickCombatDefeat}
        title="Defeat"
        icon="💀"
        onClose={() => {
          setQuickCombatDefeat(false);
          setQuickCombatMetadata(null);
        }}
      >
        <ModalText>
          {t('combat.allHeroesDead')}
        </ModalText>
        <ModalDivider />
        <ModalInfoBox variant="warning">
          Your heroes have been revived and are ready to fight again!
        </ModalInfoBox>
        <ModalDivider />
        <ModalButton
          onClick={() => {
            setQuickCombatDefeat(false);
            setQuickCombatMetadata(null);
          }}
          variant="primary"
          fullWidth
        >
          Continue
        </ModalButton>
      </GameModal>

      {/* Session Invalidated Modal */}
      <GameModal
        isOpen={!!sessionInvalidatedMessage}
        title="Session Expired"
        icon="🔐"
        onClose={() => {
          // Force logout and close modal
          AuthService.logout().then(() => {
            setUserEmail('');
            setSessionInvalidatedMessage(null);
          });
        }}
      >
        <ModalText>
          {sessionInvalidatedMessage || 'Your session has been invalidated.'}
        </ModalText>
        <ModalDivider />
        <ModalInfoBox variant="warning">
          You will be redirected to the login screen.
        </ModalInfoBox>
        <ModalDivider />
        <ModalButton
          onClick={() => {
            AuthService.logout().then(() => {
              setUserEmail('');
              setSessionInvalidatedMessage(null);
            });
          }}
          variant="primary"
          fullWidth
        >
          OK
        </ModalButton>
      </GameModal>
    </>
  );
}
