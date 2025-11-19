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
import type { Enemy } from './engine/combat/Enemy';
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
import { getSpeedDelay } from './utils/combatUtils';

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
  const [currentEnemies, setCurrentEnemies] = useState<Enemy[]>([]);
  const [isManualMode] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [activeCharacter, setActiveCharacter] = useState<Combatant | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<Combatant | null>(null);
  const [showDungeonVictory, setShowDungeonVictory] = useState(false);
  const [dungeonUpdateKey, setDungeonUpdateKey] = useState(0);
  const [, forceUpdate] = useState({});
  const [quickCombatMetadata, setQuickCombatMetadata] = useState<QuickCombatMetadata | null>(null);
  const [quickCombatVictory, setQuickCombatVictory] = useState<QuickCombatVictory | null>(null);
  const [quickCombatDefeat, setQuickCombatDefeat] = useState(false);
  const [combatSpeed, setCombatSpeed] = useState<CombatSpeed>('NORMAL');

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
    setSelectedTarget(null);
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
    while (combatEngine.isActive && !combatEngine.waitingForPlayerInput) {
      combatEngine.executeTurn();
      setCombatLog([...combatEngine.combatLog]);
      forceUpdate({});

      // Wait between turns for visibility - use current speed setting
      const delay = getSpeedDelay(combatSpeed);
      await new Promise(resolve => setTimeout(resolve, delay));
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
      setSelectedTarget(null);
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
      setSelectedTarget(null);
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
      setSelectedTarget(null);
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

            {/* Combat Speed Control */}
            {!combatEngine.combatResult && !isManualMode && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <CombatSpeedControl
                  currentSpeed={combatSpeed}
                  onSpeedChange={setCombatSpeed}
                  disabled={false}
                />
              </div>
            )}

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
                  onClick={inDungeon ? handleDungeonExit : handleQuickCombatExit}
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
                      {actualLoot.items.map((item, index) => (
                        <div
                          key={`loot-${item.id || `loot-item-${index}`}`}
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
                          const totalValue = actualLoot.items.reduce((sum, item) => sum + item.goldValue, 0);
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
                {(gameState.activeParty || []).map((hero) => (
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

            {/* Manual Combat Controls */}
            {waitingForInput && activeCharacter && (
              <div style={{
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '20px',
                border: '2px solid rgba(167, 139, 250, 0.5)',
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
              }}>
                {/* Header with character name and auto switch */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.1em',
                    fontWeight: 'bold',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flex: 1,
                    justifyContent: 'center'
                  }}>
                    ⚔️ {activeCharacter.name}'s Turn
                  </h3>
                  <button
                    onClick={() => {
                      // If currently waiting for input, execute auto action for current character first
                      if (activeCharacter && combatEngine.waitingForPlayerInput) {
                        // Find a valid target (first alive enemy)
                        const target = currentEnemies.find(e => e.isAlive);
                        if (target && activeCharacter) {
                          // Execute basic attack as auto action
                          const action = activeCharacter.attack(target);
                          if (action) {
                            setCombatLog([...combatEngine.combatLog]);
                          }
                        }
                      }

                      // Switch to auto mode
                      combatEngine.setManualMode(false);
                      setWaitingForInput(false);
                      setSelectedTarget(null);
                      setActiveCharacter(null);

                      // Continue combat in auto mode
                      setTimeout(() => {
                        if (combatEngine.isActive) {
                          combatEngine.executeTurn();
                          setCombatLog([...combatEngine.combatLog]);

                          // Keep executing turns until combat ends
                          const autoLoop = setInterval(() => {
                            if (combatEngine.isActive && !combatEngine.waitingForPlayerInput) {
                              combatEngine.executeTurn();
                              setCombatLog([...combatEngine.combatLog]);
                            } else {
                              clearInterval(autoLoop);
                            }
                          }, 500);
                        }
                      }, 300);
                    }}
                    style={{
                      padding: '6px 12px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85em',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 10px rgba(16, 185, 129, 0.5)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(16, 185, 129, 0.3)';
                    }}
                  >
                    🤖 Auto
                  </button>
                </div>

                {/* Target Selection */}
                {!selectedTarget ? (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <p style={{
                      fontSize: '0.95em',
                      marginBottom: '10px',
                      textAlign: 'center',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '500'
                    }}>
                      🎯 Select Target
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {currentEnemies.filter(e => e.isAlive).map((enemy) => (
                        <button
                          key={enemy.id}
                          onClick={() => setSelectedTarget(enemy)}
                          style={{
                            padding: '10px 14px',
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)',
                            color: '#1a202c',
                            border: '2px solid rgba(251, 191, 36, 0.6)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.95em',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            textAlign: 'left',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateX(4px)';
                            e.currentTarget.style.borderColor = 'rgb(251, 191, 36)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(251, 191, 36, 0.4)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateX(0)';
                            e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.6)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <span>{enemy.name}</span>
                          <span style={{ fontSize: '0.85em', color: '#666' }}>
                            HP: {enemy.currentHP}/{enemy.maxHP}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Target Display */}
                    <div style={{
                      background: 'rgba(251, 191, 36, 0.15)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      marginBottom: '12px',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '0.9em', color: 'rgba(255, 255, 255, 0.9)' }}>
                        🎯 Target: <strong>{selectedTarget.name}</strong>
                      </span>
                      <button
                        onClick={() => setSelectedTarget(null)}
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(255, 255, 255, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8em',
                          color: '#fff',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                        }}
                      >
                        Change
                      </button>
                    </div>

                    {/* Attack Button */}
                    <button
                      onClick={() => {
                        if (activeCharacter && selectedTarget) {
                          const result = activeCharacter.attack(selectedTarget);
                          if (result) {
                            setCombatLog([...combatEngine.combatLog]);
                          }
                          setSelectedTarget(null);
                          setWaitingForInput(false);

                          setTimeout(() => {
                            if (combatEngine.isActive) {
                              combatEngine.executeTurn();
                              setCombatLog([...combatEngine.combatLog]);

                              if (combatEngine.waitingForPlayerInput) {
                                setWaitingForInput(true);
                                setActiveCharacter(combatEngine.currentCharacter);
                              }
                            }
                          }, 500);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '14px',
                        marginBottom: '12px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1.05em',
                        fontWeight: 'bold',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.5)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.3)';
                      }}
                    >
                      ⚔️ Attack
                    </button>

                    {/* Skills Section */}
                    {'getSkills' in activeCharacter && activeCharacter.getSkills().length > 0 && (
                      <div>
                        <p style={{
                          fontSize: '0.85em',
                          marginBottom: '8px',
                          color: 'rgba(255, 255, 255, 0.7)',
                          textAlign: 'center',
                          fontWeight: '500'
                        }}>
                          Skills:
                        </p>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: activeCharacter.getSkills().length === 1 ? '1fr' : 'repeat(auto-fit, minmax(140px, 1fr))',
                          gap: '8px'
                        }}>
                          {activeCharacter.getSkills().map((skill, index) => {
                            const currentCooldown = (activeCharacter as Hero).cooldowns.get(skill.name) || 0;
                            const isOnCooldown = currentCooldown > 0;
                            const canUse = !isOnCooldown;

                            return (
                              <button
                                key={index}
                                onClick={() => {
                                  if (canUse && activeCharacter && 'useSkill' in activeCharacter) {
                                    // Determine targets based on skill type
                                    let targets: Combatant[];
                                    if (skill.type === 'buff') {
                                      // Buffs target all allies
                                      targets = gameState.activeParty.filter(h => h.isAlive);
                                    } else if (skill.type === 'heal') {
                                      // Heals target all allies
                                      targets = gameState.activeParty.filter(h => h.isAlive);
                                    } else if (skill.type === 'debuff') {
                                      // Debuffs target all enemies
                                      targets = currentEnemies.filter(e => e.isAlive);
                                    } else {
                                      // Damage skills target selected enemy
                                      targets = selectedTarget ? [selectedTarget] : [currentEnemies.find(e => e.isAlive)!];
                                    }

                                    activeCharacter.useSkill(index, targets);
                                    setCombatLog([...combatEngine.combatLog]);
                                    setSelectedTarget(null);
                                    setWaitingForInput(false);

                                    setTimeout(() => {
                                      if (combatEngine.isActive) {
                                        combatEngine.executeTurn();
                                        setCombatLog([...combatEngine.combatLog]);

                                        if (combatEngine.waitingForPlayerInput) {
                                          setWaitingForInput(true);
                                          setActiveCharacter(combatEngine.currentCharacter);
                                        }
                                      }
                                    }, 500);
                                  }
                                }}
                                disabled={!canUse}
                                style={{
                                  padding: '12px 10px',
                                  background: isOnCooldown
                                    ? 'linear-gradient(135deg, #4b5563 0%, #374151 100%)'
                                    : 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                                  color: '#fff',
                                  border: isOnCooldown ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(167, 139, 250, 0.3)',
                                  borderRadius: '6px',
                                  cursor: canUse ? 'pointer' : 'not-allowed',
                                  fontSize: '0.9em',
                                  fontWeight: '600',
                                  transition: 'all 0.2s',
                                  opacity: isOnCooldown ? 0.6 : 1,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  minHeight: '60px',
                                  boxShadow: isOnCooldown ? 'none' : '0 2px 6px rgba(139, 92, 246, 0.3)'
                                }}
                                onMouseOver={(e) => {
                                  if (canUse) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.5)';
                                  }
                                }}
                                onMouseOut={(e) => {
                                  if (canUse) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(139, 92, 246, 0.3)';
                                  }
                                }}
                              >
                                <span style={{ fontSize: '1.1em' }}>
                                  🔮 {skill.name}
                                </span>
                                {isOnCooldown ? (
                                  <span style={{
                                    fontSize: '0.75em',
                                    color: '#fbbf24',
                                    fontWeight: '600',
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    padding: '2px 8px',
                                    borderRadius: '10px'
                                  }}>
                                    CD: {currentCooldown}
                                  </span>
                                ) : skill.cooldown > 0 && (
                                  <span style={{
                                    fontSize: '0.7em',
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    fontWeight: '500'
                                  }}>
                                    CD: {skill.cooldown}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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
