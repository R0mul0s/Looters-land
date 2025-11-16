/**
 * WorldMap Demo v2.0 Component
 *
 * Demo implementation of new game loop with GameLayout.
 * Shows header with resources, worldmap, and bottom navigation.
 * Now integrated with database via useGameState hook.
 *
 * IMPORTANT: Uses shared gameState from Router when provided as props
 * to ensure single source of truth for game state management.
 *
 * Contains:
 * - World map rendering with player and other players
 * - Weather and time of day system integration with localization
 * - Interactive map objects (towns, dungeons, treasures, etc.)
 * - Modal dialogs for confirmations and information
 * - Real-time multiplayer with chat system
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React, { useEffect, useState } from 'react';
import { GameLayout, type GameScreen } from './GameLayout';
import { WorldMapGenerator } from '../engine/worldmap/WorldMapGenerator';
import { WorldMapViewer } from './WorldMapViewer';
import { HeroesScreen, getPartyAverageHealth } from './HeroesScreen';
import { InventoryScreen } from './InventoryScreen';
import { TownScreen } from './TownScreen';
import { LeaderboardScreen } from './LeaderboardScreen';
import { TeleportMenu } from './TeleportMenu';
import { ChatBox } from './ChatBox';
import { WeatherTimeWidget } from './WeatherTimeWidget';
import { GameModal } from './ui/GameModal';
import { ModalText, ModalDivider, ModalInfoBox, ModalInfoRow, ModalButton, ModalButtonGroup } from './ui/ModalContent';
import { ItemDisplay } from './ui/ItemDisplay';
import { InventoryHelper } from '../engine/item/InventoryHelper';
import { LootGenerator } from '../engine/loot/LootGenerator';
import { useGameState, type GameState, type GameStateActions } from '../hooks/useGameState';
import { useEnergyRegeneration } from '../hooks/useEnergyRegeneration';
import { useOtherPlayers } from '../hooks/useOtherPlayers';
import { useGlobalWorldState } from '../hooks/useGlobalWorldState';
import { useTranslation } from '../hooks/useTranslation';
import { WeatherSystem } from '../engine/worldmap/WeatherSystem';
import { TimeOfDaySystem } from '../engine/worldmap/TimeOfDaySystem';
import { supabase } from '../lib/supabase';
import { t } from '../localization/i18n';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS, SHADOWS, BLUR } from '../styles/tokens';
import { flexColumn, flexCenter } from '../styles/common';
import type { StaticObject, Town, DungeonEntrance, TreasureChest, HiddenPath, Portal, RareSpawn, ObservationTower, DynamicObject, WanderingMonster, TravelingMerchant } from '../types/worldmap.types';
import { DEBUG_CONFIG } from '../config/DEBUG_CONFIG';
import { ENERGY_CONFIG } from '../config/BALANCE_CONFIG';
import logo from '../assets/images/logo.png';

interface WorldMapDemo2Props {
  onEnterDungeon?: (dungeon: DungeonEntrance) => void;
  onQuickCombat?: (enemies: any[], combatType: 'rare_spawn' | 'wandering_monster', metadata?: any) => void;
  userEmail?: string;
  gameState?: GameState;
  gameActions?: GameStateActions;
}

/**
 * WorldMap Demo Component - Interactive worldmap with dungeon entry
 *
 * Main worldmap interface showing procedurally generated terrain,
 * towns, dungeons, and fog of war. Handles hero movement, dungeon
 * entry, and inventory management with enchant/sell modals.
 *
 * @param props - Component props
 * @param props.userEmail - User's email for game state
 * @param props.onEnterDungeon - Callback when entering a dungeon
 * @returns WorldMap component with interactive features
 *
 * @example
 * ```tsx
 * <WorldMapDemo2
 *   userEmail="player@example.com"
 *   onEnterDungeon={(entrance) => console.log('Entering:', entrance.name)}
 * />
 * ```
 */
export function WorldMapDemo2({ onEnterDungeon, onQuickCombat, userEmail: userEmailProp, gameState: gameStateProp, gameActions: gameActionsProp }: WorldMapDemo2Props) {
  const { t: tLocal } = useTranslation();

  // Use centralized game state with database sync
  // If gameState/gameActions are provided as props, use them (single instance from Router)
  // Otherwise, create a new instance (fallback for standalone usage)
  const [localGameState, localGameActions] = useGameState(userEmailProp);
  const gameState = gameStateProp || localGameState;
  const gameActions = gameActionsProp || localGameActions;

  // Expose gameActions and gameState to window for debug commands
  useEffect(() => {
    (window as any).__gameActions = gameActions;
    (window as any).__gameState = gameState;
    return () => {
      delete (window as any).__gameActions;
      delete (window as any).__gameState;
    };
  }, [gameActions, gameState]);

  // Use global world state (weather and time of day shared across all players)
  const globalWorldState = useGlobalWorldState();

  // Use email from props or fallback to placeholder
  const playerEmail = userEmailProp || 'adventurer@lootersland.com';

  // Screen state
  const [activeScreen, setActiveScreen] = useState<GameScreen>('worldmap');

  // Modal states
  const [showTownModal, setShowTownModal] = useState<Town | null>(null);
  const [showDungeonModal, setShowDungeonModal] = useState<DungeonEntrance | null>(null);
  const [showEnergyModal, setShowEnergyModal] = useState<{ message: string; required?: number } | null>(null);
  const [showUnexploredModal, setShowUnexploredModal] = useState(false);
  const [showTeleportMenu, setShowTeleportMenu] = useState(false);
  const [enchantItem, setEnchantItem] = useState<any | null>(null);
  const [equipmentMessage, setEquipmentMessage] = useState<string | null>(null);
  const [showTreasureChestModal, setShowTreasureChestModal] = useState<{ chest: TreasureChest; loot: any } | null>(null);
  const [showHiddenPathModal, setShowHiddenPathModal] = useState<{ path: HiddenPath; loot: any } | null>(null);
  const [showMerchantModal, setShowMerchantModal] = useState<TravelingMerchant | null>(null);
  const [showMessageModal, setShowMessageModal] = useState<string | null>(null);
  const [showLowHealthWarning, setShowLowHealthWarning] = useState<{ type: 'dungeon' | 'combat'; action: () => void; averageHealth: number } | null>(null);
  const [showQuickCombatModal, setShowQuickCombatModal] = useState<{
    enemies: any[];
    enemyName: string;
    enemyLevel: number;
    difficulty: string;
    combatType: 'rare_spawn' | 'wandering_monster';
    metadata: any;
  } | null>(null);

  // Debug: Log when message modal state changes
  React.useEffect(() => {
    if (showMessageModal) {
      console.log('📢 Message modal state changed:', showMessageModal);
    }
  }, [showMessageModal]);

  // Location tracking: Player is "in town" when town modal is open
  const isInTown = showTownModal !== null;

  // Energy regeneration system (10 energy per hour)
  const energyRegen = useEnergyRegeneration({
    currentEnergy: gameState.energy,
    maxEnergy: gameState.maxEnergy,
    onEnergyChange: (newEnergy) => gameActions.setEnergy(newEnergy),
    regenRate: 10, // 10 energy per hour
    enabled: !gameState.loading && !gameState.profileLoading
  });

  // Multiplayer: Subscribe to other online players
  const otherPlayers = useOtherPlayers(gameState.profile?.user_id);

  // Multiplayer: Track own chat message
  const [myChatMessage, setMyChatMessage] = useState<string | undefined>(undefined);
  const [myChatTimestamp, setMyChatTimestamp] = useState<Date | undefined>(undefined);

  // Auto-clear own chat message after 10 seconds
  useEffect(() => {
    if (!myChatTimestamp) return;

    const age = Date.now() - myChatTimestamp.getTime();
    if (age >= 10000) {
      setMyChatMessage(undefined);
      setMyChatTimestamp(undefined);
      return;
    }

    const timer = setTimeout(() => {
      setMyChatMessage(undefined);
      setMyChatTimestamp(undefined);
    }, 10000 - age);

    return () => clearTimeout(timer);
  }, [myChatTimestamp]);

  // Weather & Time of Day - Use global state (shared across all players)
  // NOTE: We don't update gameState.worldMap when global weather/time changes!
  // Instead, we pass globalWorldState directly to WorldMapViewer and WeatherTimeWidget.
  // This prevents unnecessary map updates and player position resets.

  // Multiplayer: Heartbeat system - Update position and online status every 15 seconds
  useEffect(() => {
    if (!gameState.profile?.user_id || gameState.loading) return;

    const updatePresence = async () => {
      try {
        await supabase
          .from('player_profiles')
          .update({
            is_online: true,
            last_seen: new Date().toISOString(),
            current_map_x: gameState.playerPos.x,
            current_map_y: gameState.playerPos.y
          })
          .eq('user_id', gameState.profile!.user_id);
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    };

    // Update immediately
    updatePresence();

    // Update every 15 seconds
    const heartbeatInterval = setInterval(updatePresence, 15000);

    // Mark as offline on unmount
    return () => {
      clearInterval(heartbeatInterval);
      supabase
        .from('player_profiles')
        .update({
          is_online: false,
          last_seen: new Date().toISOString()
        })
        .eq('user_id', gameState.profile!.user_id)
        .then(() => console.log('Marked as offline'));
    };
  }, [gameState.profile?.user_id, gameState.playerPos.x, gameState.playerPos.y, gameState.loading]);

  // Multiplayer: Handle chat message
  const handleSendChatMessage = async (message: string) => {
    if (!gameState.profile?.user_id || !message.trim()) return;

    try {
      const timestamp = new Date();

      // Update local state immediately for instant feedback
      setMyChatMessage(message);
      setMyChatTimestamp(timestamp);

      // Update database
      await supabase
        .from('player_profiles')
        .update({
          current_chat_message: message,
          chat_message_timestamp: timestamp.toISOString()
        })
        .eq('user_id', gameState.profile.user_id);
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  };

  // Generate initial worldmap if not exists
  useEffect(() => {
    if (!gameState.worldMap && !gameState.loading) {
      // Generate world with player's combat power for CP-based starting position
      const newWorld = WorldMapGenerator.generate({
        width: 50,
        height: 50,
        seed: `daily-${new Date().toISOString().split('T')[0]}`, // Daily seed - changes every day
        townCount: 4,
        dungeonCount: 5,
        encounterCount: 15
      }, gameState.combatPower);

      // Get all towns from the world
      const towns = newWorld.staticObjects.filter(obj => obj.type === 'town') as Town[];

      // Find starting town based on player's combat power
      const startingTown = WorldMapGenerator.getStartingTownByCP(towns, gameState.combatPower);

      // Reveal area around starting town (11x11 grid)
      for (let y = startingTown.position.y - 5; y <= startingTown.position.y + 5; y++) {
        for (let x = startingTown.position.x - 5; x <= startingTown.position.x + 5; x++) {
          if (newWorld.tiles[y]?.[x]) {
            newWorld.tiles[y][x].isExplored = true;
          }
        }
      }

      // Set player position to starting town
      gameActions.updatePlayerPos(startingTown.position.x, startingTown.position.y);

      // Save the world
      gameActions.updateWorldMap(newWorld);
    }
  }, [gameState.loading, gameState.worldMap, gameState.combatPower]);

  /**
   * Handle tile click for hero movement
   *
   * Validates energy cost, updates hero position, reveals fog of war,
   * and saves game state after movement.
   *
   * @param x - Tile X coordinate
   * @param y - Tile Y coordinate
   */
  const handleTileClick = (x: number, y: number, isPathMovement: boolean = false) => {
    if (!gameState.worldMap) return;

    const tile = gameState.worldMap.tiles[y]?.[x];
    if (!tile) return;

    // Prevent movement to unexplored tiles
    if (!tile.isExplored) {
      setShowUnexploredModal(true);
      return;
    }

    // Only interact with objects if this is NOT an automatic path movement
    // (i.e., only on direct clicks, not when passing through during pathfinding)
    if (!isPathMovement) {
      console.log(`🔍 DEBUG handleTileClick: Tile (${x}, ${y}) - isPathMovement: ${isPathMovement}`);

      // Check if clicking on a static object (town or dungeon)
      if (tile.staticObject) {
        console.log('🔍 DEBUG: Found static object:', tile.staticObject.type);
        handleObjectClick(tile.staticObject, x, y);
        return;
      }

      // Check if clicking on a dynamic object (wandering monster, traveling merchant)
      if (gameState.worldMap) {
        // Find ALL objects at this position (there might be multiple!)
        const objectsAtPosition = gameState.worldMap.dynamicObjects.filter(
          obj => obj.position.x === x && obj.position.y === y && obj.isActive
        );

        console.log('🔍 DEBUG: Looking for dynamic objects at', x, y);
        console.log('🔍 DEBUG: Found', objectsAtPosition.length, 'objects at this position:', objectsAtPosition.map(o => o.type));

        // Prioritize wandering monsters over other objects
        const dynamicObject = objectsAtPosition.find(obj => obj.type === 'wanderingMonster') || objectsAtPosition[0];

        if (dynamicObject) {
          console.log('🔍 DEBUG: Selected dynamic object:', dynamicObject.type);
          handleDynamicObjectClick(dynamicObject, x, y);
          return;
        } else {
          console.log('🔍 DEBUG: No dynamic object found at this position');
        }
      }

      // If this is a direct click (not path movement) and there's no object, don't do anything
      // The pathfinding will be handled by WorldMapViewer
      return;
    }

    // This is path movement - update player position
    console.log(`Moving to tile (${x}, ${y}) - ${tile.terrain}`);

    // Calculate movement cost for this single step
    const baseCostPerTile = Math.ceil(tile.movementCost / 100);

    if (gameState.energy >= baseCostPerTile || DEBUG_CONFIG.UNLIMITED_ENERGY) {
      gameActions.updatePlayerPos(x, y);
      if (!DEBUG_CONFIG.UNLIMITED_ENERGY) {
        gameActions.setEnergy(gameState.energy - baseCostPerTile);
      }

      // Reveal area around player
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const newX = x + dx;
          const newY = y + dy;
          const nearbyTile = gameState.worldMap.tiles[newY]?.[newX];
          if (nearbyTile) {
            nearbyTile.isExplored = true;

            // Add discovered location if it has a static object
            if (nearbyTile.staticObject) {
              gameActions.addDiscoveredLocation({
                name: nearbyTile.staticObject.name,
                x: newX,
                y: newY,
                type: nearbyTile.staticObject.type
              });
            }
          }
        }
      }

      gameActions.updateWorldMap({ ...gameState.worldMap }); // Force re-render
    } else {
      setShowEnergyModal({
        message: t('worldmap.notEnoughEnergy', { required: baseCostPerTile, current: gameState.energy }),
        required: baseCostPerTile
      });
    }
  };

  /**
   * Handle static object click (towns, dungeons)
   *
   * Validates energy cost for dungeon entry, moves player to object location,
   * reveals fog of war, and triggers appropriate modal or callback.
   *
   * @param object - Static object that was clicked
   * @param x - Object X coordinate
   * @param y - Object Y coordinate
   */
  const handleObjectClick = (object: StaticObject, x: number, y: number) => {
    console.log('Clicked object:', object);

    // Check dungeon energy requirements BEFORE moving
    if (object.type === 'dungeon') {
      const energyCost = 10;
      if (gameState.energy < energyCost && !DEBUG_CONFIG.UNLIMITED_ENERGY) {
        setShowEnergyModal({
          message: t('worldmap.notEnoughEnergyDungeon'),
          required: energyCost
        });
        return;
      }
    }

    // Move player to the object location
    gameActions.updatePlayerPos(x, y);

    // Reveal area around player and add current object to discovered locations
    if (gameState.worldMap) {
      // Add the clicked location to discovered
      gameActions.addDiscoveredLocation({
        name: object.name,
        x,
        y,
        type: object.type
      });

      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const newX = x + dx;
          const newY = y + dy;
          const nearbyTile = gameState.worldMap.tiles[newY]?.[newX];
          if (nearbyTile) {
            nearbyTile.isExplored = true;

            // Add discovered location if it has a static object
            if (nearbyTile.staticObject) {
              gameActions.addDiscoveredLocation({
                name: nearbyTile.staticObject.name,
                x: newX,
                y: newY,
                type: nearbyTile.staticObject.type
              });
            }
          }
        }
      }
      gameActions.updateWorldMap({ ...gameState.worldMap }); // Force re-render
    }

    // Then show the appropriate modal or perform action
    if (object.type === 'town') {
      const town = object as Town;
      setShowTownModal(town);
    } else if (object.type === 'dungeon') {
      const dungeon = object as DungeonEntrance;

      // Check party health before entering dungeon
      const averageHealth = getPartyAverageHealth(gameState.activeParty || []);
      if (averageHealth <= 40) {
        setShowLowHealthWarning({
          type: 'dungeon',
          action: () => {
            setShowLowHealthWarning(null);
            setShowDungeonModal(dungeon);
          },
          averageHealth
        });
      } else {
        setShowDungeonModal(dungeon);
      }
    } else if (object.type === 'portal') {
      handlePortalTeleport(object as Portal);
    } else if (object.type === 'hiddenPath') {
      handleHiddenPathDiscovery(object as HiddenPath);
    } else if (object.type === 'treasureChest') {
      handleTreasureChestOpen(object as TreasureChest);
    } else if (object.type === 'rareSpawn') {
      const rareSpawn = object as RareSpawn;
      handleRareSpawnCombat(rareSpawn);
    } else if (object.type === 'observationTower') {
      handleObservationTowerUse(object as ObservationTower);
    }
  };

  /**
   * Handle dynamic object click (wandering monsters, traveling merchants, events)
   *
   * @param object - Dynamic object that was clicked
   * @param x - Object X coordinate
   * @param y - Object Y coordinate
   */
  const handleDynamicObjectClick = (object: any, x: number, y: number) => {
    console.log('Clicked dynamic object:', object);

    // Move player to the object location
    gameActions.updatePlayerPos(x, y);

    // Handle different dynamic object types
    if (object.type === 'wanderingMonster') {
      handleWanderingMonsterCombat(object as WanderingMonster);
    } else if (object.type === 'travelingMerchant') {
      handleTravelingMerchantShop(object as TravelingMerchant);
    } else if (object.type === 'event') {
      // TODO: Implement random events
      setShowMessageModal(t('worldmap.randomEventComingSoon', { eventType: object.eventType }));
    } else if (object.type === 'encounter') {
      // TODO: Implement encounters
      setShowMessageModal(t('worldmap.encounterComingSoon'));
    }
  };

  /**
   * Handle observation tower use - reveal large area of map
   */
  const handleObservationTowerUse = (tower: ObservationTower) => {
    // Check if already used
    if (tower.used) {
      setShowMessageModal(t('worldmap.observationTowerAlreadyUsed'));
      return;
    }

    console.log('🗼 Using observation tower:', tower);

    // Mark tower as used
    tower.used = true;

    // Reveal large area around tower (2x normal vision = radius 10)
    if (gameState.worldMap) {
      const radius = tower.revealRadius || 10;
      let tilesRevealed = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const newX = tower.position.x + dx;
          const newY = tower.position.y + dy;
          const nearbyTile = gameState.worldMap.tiles[newY]?.[newX];

          if (nearbyTile && !nearbyTile.isExplored) {
            nearbyTile.isExplored = true;
            tilesRevealed++;

            // Add discovered location if it has a static object
            if (nearbyTile.staticObject) {
              gameActions.addDiscoveredLocation({
                name: nearbyTile.staticObject.name,
                x: newX,
                y: newY,
                type: nearbyTile.staticObject.type
              });
            }
          }
        }
      }

      gameActions.updateWorldMap({ ...gameState.worldMap }); // Force re-render

      console.log(`🗼 Revealed ${tilesRevealed} tiles from observation tower`);
      setShowMessageModal(t('worldmap.observationTowerRevealed', { tilesRevealed: tilesRevealed.toString() }));
    }
  };

  /**
   * Handle treasure chest opening
   */
  const handleTreasureChestOpen = (chest: TreasureChest) => {
    // Check if already opened
    if (chest.opened) {
      console.log('🚫 Treasure chest already opened, showing message modal');
      setShowMessageModal(t('worldmap.treasureChestAlreadyOpened'));
      return;
    }

    console.log('📦 Opening treasure chest:', chest);

    // Get player level for loot generation
    const playerLevel = gameState.activeParty?.[0]?.level || 1;

    // Generate loot
    const loot = LootGenerator.generateTreasureChestLoot(chest.lootQuality, playerLevel);

    // Show loot modal (marking as opened happens when loot is collected)
    setShowTreasureChestModal({ chest, loot });
  };

  /**
   * Handle treasure chest loot collection
   */
  const handleCollectTreasureLoot = async () => {
    if (!showTreasureChestModal) return;

    const { chest, loot } = showTreasureChestModal;

    // Add gold
    await gameActions.addGold(loot.gold);

    // Add items to inventory using gameActions to avoid state mutation
    if (loot.items.length > 0) {
      await gameActions.addItems(loot.items);
    }

    console.log(`💰 Collected ${loot.gold} gold and ${loot.items.length} items`);

    // Save inventory changes to database
    await gameActions.saveGame();

    // Mark chest as opened in worldmap NOW (after collection)
    chest.opened = true;
    if (gameState.worldMap) {
      gameActions.updateWorldMap({ ...gameState.worldMap });
    }

    // Close modal
    setShowTreasureChestModal(null);
  };

  /**
   * Handle hidden path discovery
   */
  const handleHiddenPathDiscovery = (path: HiddenPath) => {
    // Check if already discovered
    if (path.discovered) {
      setShowMessageModal(t('worldmap.hiddenPathAlreadyDiscovered'));
      return;
    }

    // Check combat power requirement
    const playerCombatPower = gameState.combatPower || 0;
    if (playerCombatPower < path.requiredCombatPower) {
      setShowMessageModal(t('worldmap.hiddenPathCombatPowerRequired', { requiredPower: path.requiredCombatPower, playerPower: playerCombatPower }));
      return;
    }

    console.log('🗝️ Discovering hidden path:', path);

    // Generate loot
    const playerLevel = gameState.activeParty?.[0]?.level || 1;
    const loot = LootGenerator.generateHiddenPathLoot(path.lootQuality, playerLevel);

    // Show loot modal (marking as discovered happens when loot is collected)
    setShowHiddenPathModal({ path, loot });
  };

  /**
   * Handle hidden path loot collection
   */
  const handleCollectHiddenPathLoot = async () => {
    if (!showHiddenPathModal) return;

    const { path, loot } = showHiddenPathModal;

    // Add gold
    await gameActions.addGold(loot.gold);

    // Add items to inventory using gameActions to avoid state mutation
    if (loot.items.length > 0) {
      await gameActions.addItems(loot.items);
    }

    console.log(`💰 Collected ${loot.gold} gold and ${loot.items.length} items`);

    // Save inventory changes to database
    await gameActions.saveGame();

    // Mark path as discovered in worldmap NOW (after collection)
    path.discovered = true;
    if (gameState.worldMap) {
      gameActions.updateWorldMap({ ...gameState.worldMap });
    }

    // Close modal
    setShowHiddenPathModal(null);
  };

  /**
   * Handle portal teleportation
   */
  const handlePortalTeleport = (portal: Portal) => {
    if (!portal.linkedPortalId || !gameState.worldMap) {
      setShowMessageModal(t('worldmap.portalNotConnected'));
      return;
    }

    // Find linked portal
    const linkedPortal = gameState.worldMap.staticObjects.find(
      obj => obj.id === portal.linkedPortalId
    ) as Portal | undefined;

    if (!linkedPortal) {
      setShowMessageModal(t('worldmap.portalNotFound'));
      return;
    }

    // Check energy cost
    const energyCost = portal.energyCost;
    if (gameState.energy < energyCost && !DEBUG_CONFIG.UNLIMITED_ENERGY) {
      setShowEnergyModal({
        message: `Not enough energy to use portal!\nRequired: ${energyCost}\nCurrent: ${gameState.energy}`,
        required: energyCost
      });
      return;
    }

    console.log(`🌀 Teleporting from ${portal.name} to ${linkedPortal.name}`);

    // Deduct energy
    if (!DEBUG_CONFIG.UNLIMITED_ENERGY) {
      gameActions.setEnergy(gameState.energy - energyCost);
    }

    // Teleport player
    gameActions.updatePlayerPos(linkedPortal.position.x, linkedPortal.position.y);

    // Reveal area around destination
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const newX = linkedPortal.position.x + dx;
        const newY = linkedPortal.position.y + dy;
        const tile = gameState.worldMap.tiles[newY]?.[newX];
        if (tile) {
          tile.isExplored = true;
        }
      }
    }

    gameActions.updateWorldMap({ ...gameState.worldMap });
  };

  /**
   * Handle rare spawn combat encounter
   *
   * Starts quick combat with a special rare enemy that has guaranteed high-quality loot drops.
   * Combat happens directly on the map with a named boss + 3-4 elite minions.
   * Marks the rare spawn as defeated after combat completes.
   */
  const handleRareSpawnCombat = async (rareSpawn: RareSpawn) => {
    // IMPORTANT: Always check defeated status from current worldMap state, not from the passed object
    // The passed object might be stale if worldMap was updated after combat
    const currentRareSpawn = gameState.worldMap?.staticObjects.find(
      obj => obj.type === 'rareSpawn' &&
             obj.position.x === rareSpawn.position.x &&
             obj.position.y === rareSpawn.position.y
    ) as RareSpawn | undefined;

    // Check if already defeated
    if (currentRareSpawn?.defeated) {
      setShowMessageModal(t('worldmap.rareSpawnDefeated'));
      return;
    }

    console.log('⚔️ Preparing rare spawn combat:', rareSpawn);

    // Check party health before combat
    const averageHealth = getPartyAverageHealth(gameState.activeParty || []);

    const startCombat = async () => {
      // Generate named boss enemy with elite minions
      const { generateRareSpawnEncounter } = await import('../engine/combat/NamedEnemies');
      const enemies = generateRareSpawnEncounter(rareSpawn.enemyName, rareSpawn.enemyLevel);

      // Show pre-combat modal with enemy info and combat mode selection
      setShowQuickCombatModal({
        enemies,
        enemyName: `${rareSpawn.name} - ${rareSpawn.enemyName}`,
        enemyLevel: rareSpawn.enemyLevel,
        difficulty: rareSpawn.guaranteedDrop || 'Elite',
        combatType: 'rare_spawn',
        metadata: {
          name: rareSpawn.name,
          guaranteedDrop: rareSpawn.guaranteedDrop,
          position: rareSpawn.position,
          rareSpawnObject: rareSpawn
        }
      });
    };

    if (averageHealth <= 40) {
      setShowLowHealthWarning({
        type: 'combat',
        action: () => {
          setShowLowHealthWarning(null);
          startCombat();
        },
        averageHealth
      });
    } else {
      startCombat();
    }
  };

  /**
   * Handle wandering monster fast combat
   *
   * Quick combat encounter with wandering monsters on the worldmap.
   * Combat happens directly on the map with a named elite enemy + 2-3 normal minions.
   * Monster respawns after a certain time period.
   */
  const handleWanderingMonsterCombat = async (monster: WanderingMonster) => {
    console.log('🔍 DEBUG: handleWanderingMonsterCombat called for monster at:', monster.position);

    // IMPORTANT: Always check defeated status from current worldMap state, not from the passed object
    // The passed object might be stale if worldMap was updated after combat
    const currentMonster = gameState.worldMap?.dynamicObjects.find(
      obj => obj.type === 'wanderingMonster' &&
             obj.position.x === monster.position.x &&
             obj.position.y === monster.position.y
    ) as WanderingMonster | undefined;

    console.log('🔍 DEBUG: Found current monster in worldMap:', currentMonster);
    console.log('🔍 DEBUG: Current monster defeated status:', currentMonster?.defeated);

    // Check if already defeated (and waiting to respawn)
    if (currentMonster?.defeated) {
      console.log('❌ DEBUG: Monster is defeated, blocking combat');
      setShowMessageModal(t('worldmap.monsterDefeated'));
      return;
    }

    console.log('✅ DEBUG: Monster is NOT defeated, starting combat');
    console.log('⚔️ Preparing wandering monster combat:', monster);

    // Check party health before combat
    const averageHealth = getPartyAverageHealth(gameState.activeParty || []);

    const startCombat = async () => {
      // Generate named elite enemy with normal minions
      const { generateWanderingMonsterEncounter } = await import('../engine/combat/NamedEnemies');
      const enemies = generateWanderingMonsterEncounter(monster.enemyName, monster.enemyLevel, monster.difficulty);

      // Show pre-combat modal with enemy info and combat mode selection
      setShowQuickCombatModal({
        enemies,
        enemyName: monster.enemyName,
        enemyLevel: monster.enemyLevel,
        difficulty: monster.difficulty,
        combatType: 'wandering_monster',
        metadata: {
          name: monster.enemyName,
          difficulty: monster.difficulty,
          respawnMinutes: monster.respawnMinutes,
          position: monster.position,
          monsterObject: monster
        }
      });
    };

    if (averageHealth <= 40) {
      setShowLowHealthWarning({
        type: 'combat',
        action: () => {
          setShowLowHealthWarning(null);
          startCombat();
        },
        averageHealth
      });
    } else {
      startCombat();
    }
  };

  /**
   * Handle traveling merchant shop
   *
   * Opens shop modal where player can purchase items from the merchant.
   */
  const handleTravelingMerchantShop = (merchant: TravelingMerchant) => {
    console.log('🛒 Opening traveling merchant shop:', merchant);
    setShowMerchantModal(merchant);
  };

  /**
   * Purchase item from traveling merchant
   */
  const handleMerchantPurchase = async (itemIndex: number) => {
    if (!showMerchantModal) return;

    const item = showMerchantModal.inventory[itemIndex];

    // Check gold
    if (gameState.gold < item.price) {
      setShowMessageModal(t('worldmap.notEnoughGold', { required: item.price, current: gameState.gold }));
      return;
    }

    console.log(`💰 Purchasing ${item.itemType} for ${item.price} gold`);

    // Deduct gold
    await gameActions.removeGold(item.price);

    // Generate item using ItemGenerator
    const { ItemGenerator } = await import('../engine/item/ItemGenerator');
    const playerLevel = gameState.activeParty?.[0]?.level || 1;
    const generatedItem = ItemGenerator.generate(playerLevel, item.rarity);

    // Add to inventory using gameActions to avoid state mutation
    await gameActions.addItem(generatedItem);

    // Save changes to database
    await gameActions.saveGame();

    // Remove item from merchant inventory
    showMerchantModal.inventory.splice(itemIndex, 1);

    // Update modal
    if (showMerchantModal.inventory.length === 0) {
      setShowMessageModal(t('worldmap.merchantSoldOut'));
      setShowMerchantModal(null);
    } else {
      setShowMerchantModal({ ...showMerchantModal });
    }
  };

  /**
   * Handle teleport to a location
   *
   * Deducts energy cost, moves player to location, closes teleport menu, and switches to worldmap.
   */
  const handleTeleport = (location: { name: string; x: number; y: number; type: 'town' | 'dungeon' }) => {
    const TELEPORT_COST = ENERGY_CONFIG.TELEPORT_COST;

    if (gameState.energy < TELEPORT_COST && !DEBUG_CONFIG.UNLIMITED_ENERGY) {
      setShowEnergyModal({
        message: t('worldmap.notEnoughEnergyTeleport', { required: TELEPORT_COST }),
        required: TELEPORT_COST
      });
      return;
    }

    // Deduct energy and move player
    if (!DEBUG_CONFIG.UNLIMITED_ENERGY) {
      gameActions.setEnergy(gameState.energy - TELEPORT_COST);
    }
    gameActions.updatePlayerPos(location.x, location.y);

    // Close teleport menu and switch to worldmap
    setShowTeleportMenu(false);
    setActiveScreen('worldmap');

    console.log(`Teleported to ${location.name} (${location.x}, ${location.y})`);
  };

  /**
   * Handle dungeon entry confirmation
   *
   * Validates energy cost, deducts energy from player, closes modal,
   * and calls parent callback to transition to dungeon exploration.
   */
  const handleEnterDungeon = () => {
    if (!showDungeonModal) return;

    // Save dungeon reference before closing modal
    const dungeonToEnter = showDungeonModal;

    console.log('🎯 Entering dungeon:', dungeonToEnter);
    console.log('🎯 onEnterDungeon callback exists?', !!onEnterDungeon);

    const energyCost = 10;
    gameActions.setEnergy(gameState.energy - energyCost);

    // Close the modal first
    setShowDungeonModal(null);

    // Call parent callback to enter dungeon
    if (onEnterDungeon) {
      console.log('✅ Calling onEnterDungeon callback');
      onEnterDungeon(dungeonToEnter);
    } else {
      console.log('❌ No onEnterDungeon callback provided');
      // Fallback if no callback provided
      setShowEnergyModal({
        message: t('worldmap.dungeonIntegration')
      });
    }
  };

  // Show loading screen while loading
  if (gameState.loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingContent}>
          <img src={logo} alt="Looters Land" style={styles.loadingLogo} />
          <div style={styles.loadingText}>{t('worldmap.loading')}</div>
        </div>
      </div>
    );
  }

  // Show error if any
  if (gameState.error) {
    return (
      <div style={styles.errorScreen}>
        <div style={styles.errorContent}>
          <div style={styles.errorIcon}>⚠️</div>
          <div style={styles.errorText}>{t('worldmap.error')}: {gameState.error}</div>
          <button
            style={styles.retryButton}
            onClick={() => gameActions.loadGame()}
          >
            {t('ui.back')}
          </button>
        </div>
      </div>
    );
  }

  // Helper functions for weather and time display using systems
  const getWeatherIcon = (weather: string): string => {
    return WeatherSystem.getWeatherDisplay(weather as any, tLocal).icon;
  };

  const getWeatherLabel = (weather: string): string => {
    return WeatherSystem.getWeatherDisplay(weather as any, tLocal).label;
  };

  const getTimeIcon = (time: string): string => {
    return TimeOfDaySystem.getTimeDisplay(time as any, tLocal).icon;
  };

  const getTimeLabel = (time: string): string => {
    return TimeOfDaySystem.getTimeDisplay(time as any, tLocal).label;
  };

  const worldmapContent = (
    <div style={styles.container}>
      {gameState.worldMap ? (
        <div style={styles.mapWrapper}>
          <WorldMapViewer
            worldMap={gameState.worldMap}
            playerPosition={gameState.playerPos}
            playerAvatar={gameState.profile?.avatar || 'hero1.png'}
            otherPlayers={otherPlayers}
            playerChatMessage={myChatMessage}
            playerChatTimestamp={myChatTimestamp}
            weather={globalWorldState.weather || gameState.worldMap.weather}
            timeOfDay={globalWorldState.timeOfDay || gameState.worldMap.timeOfDay}
            onTileClick={handleTileClick}
            onCancelMovement={() => {
              console.log('Movement cancelled by user');
              // No additional action needed - WorldMapViewer handles the state cleanup
            }}
          />

          {/* Weather & Time Widget */}
          <WeatherTimeWidget
            weather={globalWorldState.weather || gameState.worldMap.weather}
            timeOfDay={globalWorldState.timeOfDay || gameState.worldMap.timeOfDay}
          />

          {/* Chat Box */}
          <ChatBox
            onSendMessage={handleSendChatMessage}
            disabled={!gameState.profile?.user_id}
            lastMessage={myChatMessage}
            lastMessageTimestamp={myChatTimestamp}
          />

          {/* Info Panel Overlay */}
          <div style={styles.infoPanel}>
            <div style={styles.infoItem}>
              <span style={styles.infoIcon}>📍</span>
              <span style={styles.infoText}>{t('worldmap.position')} ({gameState.playerPos.x}, {gameState.playerPos.y})</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoIcon}>⚡</span>
              <span style={styles.infoText}>{t('worldmap.energy')} {gameState.energy}/{gameState.maxEnergy}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoIcon}>🏆</span>
              <span style={styles.infoText}>Combat Power: {gameState.combatPower.toLocaleString()}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoIcon}>💰</span>
              <span style={styles.infoText}>{gameState.gold.toLocaleString()} Gold</span>
            </div>
            {globalWorldState.weather && globalWorldState.timeOfDay && (
              <>
                <div style={styles.infoItem}>
                  <span style={styles.infoIcon}>{getWeatherIcon(globalWorldState.weather.current)}</span>
                  <span style={styles.infoText}>{getWeatherLabel(globalWorldState.weather.current)}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoIcon}>{getTimeIcon(globalWorldState.timeOfDay.current)}</span>
                  <span style={styles.infoText}>{getTimeLabel(globalWorldState.timeOfDay.current)}</span>
                </div>
              </>
            )}
            {gameState.saving && (
              <div style={styles.infoItem}>
                <span style={styles.infoIcon}>💾</span>
                <span style={styles.infoText}>{t('auth.loading')}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={styles.loading}>{t('worldmap.loading')}</div>
      )}
    </div>
  );

  const heroesContent = (
    <HeroesScreen
      heroes={gameState.allHeroes}
      activeParty={gameState.activeParty}
      onPartyChange={(heroes) => gameActions.updateActiveParty(heroes)}
      isInTown={isInTown}
    />
  );

  const inventoryContent = (
    <InventoryScreen
      heroes={isInTown ? gameState.allHeroes : gameState.activeParty}
      inventory={gameState.inventory}
      isInTown={isInTown}
      onEquipItem={async (hero, item) => {
        if (!hero.equipment) return;
        const result = hero.equipment.equip(item);
        if (result.success) {
          await gameActions.removeItem(item.id);
          if (result.unequippedItem) {
            await gameActions.addItem(result.unequippedItem);
          }
          gameActions.forceUpdate();
          gameActions.saveGame(); // Trigger save after equipment change
        } else {
          // Show error message if equip failed
          setEquipmentMessage(result.message);
        }
      }}
      onUnequipItem={async (hero, slotName) => {
        if (!hero.equipment) return;
        const result = hero.equipment.unequip(slotName as any);
        if (result.success && result.item) {
          await gameActions.addItem(result.item);
          gameActions.forceUpdate();
          gameActions.saveGame(); // Trigger save after unequip
        }
      }}
      onAutoEquipBest={(hero) => {
        if (!hero.equipment) return;
        const result = InventoryHelper.autoEquipBest(gameState.inventory, hero.equipment, hero.level);

        // Build message based on results
        let message = result.message;

        if (result.skippedItems && result.skippedItems.length > 0) {
          const skippedByLevel = result.skippedItems.filter(s => s.reason === 'level_too_low');
          if (skippedByLevel.length > 0) {
            message += '\n\n⚠️ ' + t('inventory.autoEquip.skippedItems') + '\n';
            skippedByLevel.forEach(skipped => {
              const slotName = t(`inventory.slots.${skipped.slot}`);
              message += `\n• ${skipped.item.name} (${t(`inventory.rarity.${skipped.item.rarity}`)}, Lv.${skipped.item.level}) - ${slotName}`;
              message += `\n  ${t('inventory.autoEquip.requiresLevel')} ${skipped.item.level}`;
            });
          }
        }

        setEquipmentMessage(message);

        if (result.success) {
          console.log(result.message);
          gameActions.forceUpdate();
          gameActions.saveGame(); // Trigger save after auto-equip
        }
      }}
      onExpandInventory={() => {
        const result = gameState.inventory.expandInventory(10, 500);
        if (result.success) {
          gameActions.removeGold(500);
          console.log(result.message);
        } else {
          console.log(result.message);
        }
        gameActions.forceUpdate();
      }}
      onAutoSellCommon={() => {
        const result = InventoryHelper.autoSellByRarity(gameState.inventory, 'common');
        console.log(result.message);
        gameActions.forceUpdate();
      }}
      onOpenEnchantPanel={(item) => {
        setEnchantItem(item);
      }}
    />
  );

  // Leaderboard content
  const leaderboardsContent = gameState.profile?.user_id ? (
    <LeaderboardScreen
      userId={gameState.profile.user_id}
      playerName={gameState.playerName}
      playerLevel={gameState.playerLevel}
    />
  ) : null;

  // Teleport content
  const teleportContent = (
    <TeleportMenu
      discoveredLocations={gameState.discoveredLocations}
      currentEnergy={gameState.energy}
      onTeleport={handleTeleport}
      onClose={() => {}} // No close needed in GameLayout context
    />
  );

  return (
    <>
      <GameLayout
        playerName={gameState.playerName}
        playerEmail={playerEmail}
        userId={gameState.profile?.user_id}
        playerAvatar={gameState.profile?.avatar || 'hero1.png'}
        playerLevel={gameState.playerLevel}
        combatPower={gameState.combatPower}
        gold={gameState.gold}
        gems={gameState.gems}
        energy={gameState.energy}
        maxEnergy={gameState.maxEnergy}
        energyRegenRate={energyRegen.regenRate}
        heroCount={gameState.allHeroes.length}
        itemCount={gameState.inventory.items.length}
        syncStatus={gameState.syncStatus}
        lastSaveTime={gameState.lastSaveTime}
        activeScreen={activeScreen}
        onScreenChange={setActiveScreen}
        worldmapScreen={worldmapContent}
        heroesScreen={heroesContent}
        inventoryScreen={inventoryContent}
        teleportScreen={teleportContent}
        leaderboardsScreen={leaderboardsContent}
      />

      {/* Town Screen */}
      {showTownModal && (
        <div style={styles.modal}>
          <TownScreen
            town={showTownModal}
            heroes={gameState.allHeroes}
            activeParty={gameState.activeParty}
            activePartyIndices={gameState.activePartyIndices}
            inventory={gameState.inventory}
            playerGold={gameState.gold}
            playerGems={gameState.gems}
            playerLevel={gameState.playerLevel}
            storedGold={0} // TODO: Add storedGold to gameState
            gachaState={gameState.gachaState}
            onGoldChange={(newGold) => {
              const diff = newGold - gameState.gold;
              if (diff > 0) {
                gameActions.addGold(diff);
              } else {
                gameActions.removeGold(Math.abs(diff));
              }
            }}
            onGemsChange={(newGems) => {
              const diff = newGems - gameState.gems;
              if (diff > 0) {
                gameActions.addGems(diff);
              } else {
                gameActions.removeGems(Math.abs(diff));
              }
            }}
            onStoredGoldChange={() => {}} // TODO: Implement storedGold management
            onHeroesChange={async (updatedHeroes) => {
              // Find new heroes (that aren't in current allHeroes)
              const currentHeroIds = gameState.allHeroes.map(h => h.id);
              const newHeroes = updatedHeroes.filter(h => !currentHeroIds.includes(h.id));

              // Add new heroes to the collection
              for (const hero of newHeroes) {
                await gameActions.addHero(hero);
              }

              // IMPORTANT: Save game to persist HP changes (e.g., from healer)
              // This ensures HP changes are saved even if no new heroes were added
              gameActions.saveGame();
            }}
            onInventoryChange={(updatedInventory) => {
              gameActions.updateInventory(updatedInventory);
              gameActions.saveGame();
            }}
            onGachaStateChange={(newGachaState) => {
              gameActions.updateGachaState(newGachaState);
            }}
            onActivePartyChange={(newPartyIndices) => {
              gameActions.updateActivePartyIndices(newPartyIndices);
            }}
            onClose={() => setShowTownModal(null)}
          />
        </div>
      )}

      {/* Dungeon Modal */}
      <GameModal
        isOpen={!!showDungeonModal}
        title={showDungeonModal?.name || ''}
        icon="🕳️"
        onClose={() => setShowDungeonModal(null)}
      >
        {showDungeonModal && (
          <>
            <ModalInfoRow label="Difficulty:" value={showDungeonModal.difficulty} />
            <ModalInfoRow label="Recommended Level:" value={showDungeonModal.recommendedLevel} />
            <ModalInfoRow label="Max Floors:" value={showDungeonModal.maxFloors} />
            <ModalInfoRow label="Theme:" value={showDungeonModal.theme} />
            <ModalDivider />
            <ModalInfoRow label="Energy Cost:" value="⚡ 10" valueColor="energy" />
            <ModalInfoRow label="Your Energy:" value={`⚡ ${gameState.energy}`} />
            <ModalButtonGroup>
              <ModalButton onClick={() => setShowDungeonModal(null)} variant="secondary" fullWidth={false}>
                Cancel
              </ModalButton>
              <ModalButton onClick={handleEnterDungeon} variant="primary" fullWidth={false}>
                Enter Dungeon
              </ModalButton>
            </ModalButtonGroup>
          </>
        )}
      </GameModal>

      {/* Energy Warning Modal */}
      <GameModal
        isOpen={!!showEnergyModal}
        title="Not Enough Energy"
        icon="⚡"
        onClose={() => setShowEnergyModal(null)}
      >
        {showEnergyModal && (
          <>
            <ModalText>{showEnergyModal.message}</ModalText>
            {showEnergyModal.required && (
              <>
                <ModalDivider />
                <ModalInfoRow label="Required:" value={`⚡ ${showEnergyModal.required}`} valueColor="energy" />
                <ModalInfoRow label="You have:" value={`⚡ ${gameState.energy}`} />
              </>
            )}
            <ModalInfoBox variant="info">
              Wait for energy regeneration or use an energy potion!
            </ModalInfoBox>
            <ModalButton onClick={() => setShowEnergyModal(null)}>
              OK
            </ModalButton>
          </>
        )}
      </GameModal>

      {/* Unexplored Area Warning Modal */}
      <GameModal
        isOpen={showUnexploredModal}
        title={t('worldmap.unexploredTitle')}
        icon="🌑"
        onClose={() => setShowUnexploredModal(false)}
      >
        <ModalText>{t('worldmap.unexploredMessage')}</ModalText>
        <ModalDivider />
        <ModalInfoBox variant="info">
          💡 <strong>Tip:</strong> {t('worldmap.unexploredTip')}
        </ModalInfoBox>
        <ModalButton onClick={() => setShowUnexploredModal(false)}>
          OK
        </ModalButton>
      </GameModal>

      {/* Treasure Chest Loot Modal */}
      <GameModal
        isOpen={!!showTreasureChestModal}
        title="Treasure Chest Opened!"
        icon="📦"
        onClose={() => setShowTreasureChestModal(null)}
      >
        {showTreasureChestModal && (
          <>
            <ModalText>You found a {showTreasureChestModal.chest.lootQuality} treasure chest!</ModalText>
            <ModalDivider />
            <ModalInfoRow label="💰 Gold:" value={showTreasureChestModal.loot.gold} valueColor="gold" />
            <ModalInfoRow label="🎒 Items:" value={showTreasureChestModal.loot.items.length} />
            <ModalDivider />
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {showTreasureChestModal.loot.items.map((item: any, i: number) => (
                <ItemDisplay key={`worldmap-treasure-${item.id || `item-${i}`}`} item={item} compact />
              ))}
            </div>
            <ModalButton onClick={handleCollectTreasureLoot} variant="primary" fullWidth>
              Collect Loot
            </ModalButton>
          </>
        )}
      </GameModal>

      {/* Hidden Path Loot Modal */}
      <GameModal
        isOpen={!!showHiddenPathModal}
        title="Hidden Path Discovered!"
        icon="🗝️"
        onClose={() => setShowHiddenPathModal(null)}
      >
        {showHiddenPathModal && (
          <>
            <ModalText>You discovered a {showHiddenPathModal.path.lootQuality} hidden path!</ModalText>
            <ModalDivider />
            <ModalInfoRow label="💰 Gold:" value={showHiddenPathModal.loot.gold} valueColor="gold" />
            <ModalInfoRow label="🎒 Items:" value={showHiddenPathModal.loot.items.length} />
            <ModalDivider />
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {showHiddenPathModal.loot.items.map((item: any, i: number) => (
                <ItemDisplay key={i} item={item} compact />
              ))}
            </div>
            <ModalButton onClick={handleCollectHiddenPathLoot} variant="primary" fullWidth>
              Collect Loot
            </ModalButton>
          </>
        )}
      </GameModal>

      {/* Traveling Merchant Shop Modal */}
      <GameModal
        isOpen={!!showMerchantModal}
        title="Traveling Merchant"
        icon="🛒"
        onClose={() => setShowMerchantModal(null)}
      >
        {showMerchantModal && (
          <>
            <ModalText>Welcome, traveler! {showMerchantModal.merchantName} has rare items for sale!</ModalText>
            <ModalDivider />
            <ModalInfoRow label="💰 Your Gold:" value={gameState.gold} valueColor="gold" />
            <ModalInfoRow label="🛍️ Items Available:" value={showMerchantModal.inventory.length} />
            <ModalDivider />
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {showMerchantModal.inventory.map((merchantItem, i) => {
                const rarityColors: Record<string, string> = {
                  uncommon: '#22c55e',
                  rare: '#3b82f6',
                  epic: '#a855f7'
                };
                return (
                  <div key={i} style={{
                    padding: '12px',
                    margin: '8px 0',
                    background: `${rarityColors[merchantItem.rarity]}10`,
                    borderRadius: '8px',
                    border: `1px solid ${rarityColors[merchantItem.rarity]}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <strong style={{ color: rarityColors[merchantItem.rarity], fontSize: '14px' }}>
                          {merchantItem.itemType}
                        </strong>
                        <span style={{
                          padding: '2px 6px',
                          background: `${rarityColors[merchantItem.rarity]}20`,
                          borderRadius: '4px',
                          fontSize: '10px',
                          color: rarityColors[merchantItem.rarity],
                          fontWeight: '600'
                        }}>
                          {merchantItem.rarity}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '600' }}>
                        💰 {merchantItem.price} gold
                      </div>
                    </div>
                    <ModalButton
                      onClick={() => handleMerchantPurchase(i)}
                      variant={gameState.gold >= merchantItem.price ? 'primary' : 'secondary'}
                    >
                      {gameState.gold >= merchantItem.price ? '🛒 Buy' : '🔒 Locked'}
                    </ModalButton>
                  </div>
                );
              })}
            </div>
            <ModalDivider />
            <ModalButton onClick={() => setShowMerchantModal(null)} variant="secondary" fullWidth>
              Leave Shop
            </ModalButton>
          </>
        )}
      </GameModal>

      {/* Equipment Message Modal */}
      <GameModal
        isOpen={!!equipmentMessage}
        title={t('inventory.title')}
        icon="⚔️"
        onClose={() => setEquipmentMessage(null)}
      >
        <div style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
          {equipmentMessage}
        </div>
        <ModalDivider />
        <ModalButton onClick={() => setEquipmentMessage(null)} variant="primary" fullWidth>
          OK
        </ModalButton>
      </GameModal>

      {/* Enchant Modal */}
      {enchantItem && (
        <div style={styles.modal} onClick={() => setEnchantItem(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>✨ Enchant Item</h2>
              <button style={styles.closeButton} onClick={() => setEnchantItem(null)}>✕</button>
            </div>
            <div style={styles.modalBody}>
              {/* Item Info */}
              <div style={{
                padding: '15px',
                background: 'rgba(45, 212, 191, 0.1)',
                borderRadius: '8px',
                marginBottom: '15px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3em', marginBottom: '10px' }}>{enchantItem.icon}</div>
                <h3 style={{
                  color: enchantItem.getRarityColor(),
                  margin: '0 0 5px 0',
                  fontSize: '1.2em'
                }}>
                  {enchantItem.getDisplayName()}
                </h3>
                <p style={{ color: '#94a3b8', margin: '0', fontSize: '0.9em' }}>
                  {enchantItem.getRarityDisplayName()} | Level {enchantItem.level}
                </p>
              </div>

              {/* Enchant Info */}
              <div style={styles.infoRow}>
                <span style={styles.label}>Current Enchant:</span>
                <span style={styles.value}>+{enchantItem.enchantLevel}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>Max Enchant:</span>
                <span style={styles.value}>+{enchantItem.maxEnchantLevel}</span>
              </div>

              <div style={styles.divider} />

              {/* Current Stats */}
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ color: '#f1f5f9', marginBottom: '10px' }}>Current Stats</h4>
                {Object.entries(enchantItem.getEffectiveStats()).map(([stat, value]: [string, any]) => (
                  <div key={stat} style={styles.infoRow}>
                    <span style={styles.label}>{stat}:</span>
                    <span style={styles.value}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Enchant Button */}
                {enchantItem.enchantLevel < enchantItem.maxEnchantLevel ? (
                  <button
                    style={{
                      ...styles.enterButton,
                      width: '100%'
                    }}
                    onClick={() => {
                      const result = enchantItem.enchant();
                      if (result.success) {
                        setShowMessageModal(t('worldmap.enchantSuccess', { message: result.message, chance: result.chance.toString() }));
                        gameActions.saveGame();
                        setEnchantItem({ ...enchantItem }); // Force re-render
                      } else {
                        setShowMessageModal(t('worldmap.enchantFailed', { message: result.message, chance: result.chance.toString() }));
                      }
                    }}
                  >
                    ✨ Enchant Item
                  </button>
                ) : (
                  <div style={{
                    padding: '15px',
                    background: 'rgba(255, 193, 7, 0.2)',
                    border: '1px solid rgba(255, 193, 7, 0.5)',
                    borderRadius: '8px',
                    textAlign: 'center',
                    color: '#ffc107'
                  }}>
                    ⭐ This item is at maximum enchant level!
                  </div>
                )}

                {/* Sell Button */}
                <button
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
                  }}
                  onClick={async () => {
                    const sellPrice = enchantItem.goldValue || enchantItem.calculateValue();
                    const confirmSell = window.confirm(
                      `💰 Sell Item?\n\n${enchantItem.getDisplayName()}\n\nYou will receive: ${sellPrice} gold\n\nAre you sure?`
                    );

                    if (confirmSell) {
                      // Remove item from inventory using gameActions to avoid state mutation
                      await gameActions.removeItem(enchantItem.id);
                      // Add gold
                      await gameActions.addGold(sellPrice);
                      // Save game
                      await gameActions.saveGame();
                      // Show message
                      setShowMessageModal(t('worldmap.itemSold', { itemName: enchantItem.getDisplayName(), gold: sellPrice }));
                      // Close modal
                      setEnchantItem(null);
                    }
                  }}
                >
                  💰 Sell for {enchantItem.goldValue || enchantItem.calculateValue()} Gold
                </button>
              </div>

              <div style={styles.divider} />

              {/* Close Button */}
              <button
                style={{
                  ...styles.cancelButton,
                  width: '100%'
                }}
                onClick={() => setEnchantItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Combat Pre-Combat Modal */}
      <GameModal
        isOpen={!!showQuickCombatModal}
        title={showQuickCombatModal?.enemyName || 'Enemy Encounter'}
        icon="⚔️"
        onClose={() => setShowQuickCombatModal(null)}
      >
        {showQuickCombatModal && (
          <>
            <ModalText>
              You have encountered a powerful {showQuickCombatModal.difficulty.toLowerCase()} enemy on the world map!
            </ModalText>
            <ModalDivider />
            <ModalInfoRow label="Enemy:" value={showQuickCombatModal.enemyName} />
            <ModalInfoRow label="Level:" value={showQuickCombatModal.enemyLevel} />
            <ModalInfoRow label="Difficulty:" value={showQuickCombatModal.difficulty} valueColor={
              showQuickCombatModal.difficulty === 'Elite' || showQuickCombatModal.difficulty === 'Boss' ? 'warning' : 'info'
            } />
            <ModalInfoRow label="Enemy Count:" value={showQuickCombatModal.enemies.length} />
            <ModalDivider />

            {/* Party comparison */}
            <div style={{
              padding: '12px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#cbd5e1'
            }}>
              <div><strong>Your Party:</strong></div>
              {gameState.activeParty.map((hero) => (
                <div key={hero.id} style={{ marginTop: '4px', fontSize: '12px' }}>
                  {hero.name} (Lv {hero.level}) - ❤️{hero.currentHP}/{hero.maxHP}
                </div>
              ))}
            </div>

            <ModalDivider />
            <ModalText>
              Choose your combat mode:
            </ModalText>

            <ModalButtonGroup>
              <ModalButton
                onClick={() => {
                  const { enemies, combatType, metadata } = showQuickCombatModal;
                  setShowQuickCombatModal(null);

                  // Start combat - enemy will be marked as defeated only after victory
                  // Call external handler if provided
                  if (onQuickCombat) {
                    onQuickCombat(enemies, combatType, { ...metadata, mode: 'auto' });
                  }
                }}
                variant="primary"
                fullWidth={false}
              >
                ⚡ Auto Combat
              </ModalButton>
              <ModalButton
                onClick={() => {
                  const { enemies, combatType, metadata } = showQuickCombatModal;
                  setShowQuickCombatModal(null);

                  // Start combat - enemy will be marked as defeated only after victory
                  // Call external handler if provided
                  if (onQuickCombat) {
                    onQuickCombat(enemies, combatType, { ...metadata, mode: 'manual' });
                  }
                }}
                variant="secondary"
                fullWidth={false}
              >
                🎮 Manual Combat
              </ModalButton>
            </ModalButtonGroup>

            <ModalButton onClick={() => setShowQuickCombatModal(null)} variant="secondary" fullWidth>
              Cancel
            </ModalButton>
          </>
        )}
      </GameModal>

      {/* Low Health Warning Modal */}
      <GameModal
        isOpen={!!showLowHealthWarning}
        title="⚠️ Low Party Health Warning"
        icon="❤️"
        onClose={() => setShowLowHealthWarning(null)}
      >
        {showLowHealthWarning && (
          <>
            <ModalInfoBox variant="warning">
              Your party's average health is critically low!
            </ModalInfoBox>

            <ModalDivider />

            <ModalInfoRow
              label="Average Party Health:"
              value={`${Math.round(showLowHealthWarning.averageHealth)}%`}
              valueColor="warning"
            />

            <ModalDivider />

            <ModalText>
              {showLowHealthWarning.type === 'dungeon'
                ? 'Entering a dungeon with low health is extremely dangerous! You should rest in town or use healing potions before proceeding.'
                : 'Engaging in combat with low health is extremely dangerous! You should rest in town or use healing potions before fighting.'}
            </ModalText>

            <ModalDivider />

            <div style={{
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#f87171'
            }}>
              <div><strong>Your Party Status:</strong></div>
              {gameState.activeParty.map((hero) => {
                const hpPercent = (hero.currentHP / hero.maxHP) * 100;
                return (
                  <div key={hero.id} style={{ marginTop: '4px', fontSize: '12px' }}>
                    {hero.name} (Lv {hero.level}) - ❤️{hero.currentHP}/{hero.maxHP} ({Math.round(hpPercent)}%)
                  </div>
                );
              })}
            </div>

            <ModalDivider />

            <ModalButtonGroup>
              <ModalButton
                onClick={() => {
                  if (showLowHealthWarning.action) {
                    showLowHealthWarning.action();
                  }
                }}
                variant="danger"
                fullWidth={false}
              >
                ⚔️ Proceed Anyway
              </ModalButton>
              <ModalButton
                onClick={() => setShowLowHealthWarning(null)}
                variant="primary"
                fullWidth={false}
              >
                🏃 Retreat
              </ModalButton>
            </ModalButtonGroup>
          </>
        )}
      </GameModal>

      {/* Message Modal - Generic information/alert modal */}
      {showMessageModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>ℹ️ {t('common.information')}</h2>
            </div>
            <div style={styles.modalBody}>
              <p style={{ whiteSpace: 'pre-line', textAlign: 'center', fontSize: '14px', lineHeight: '1.6' }}>
                {showMessageModal}
              </p>
            </div>
            <div style={styles.modalFooter}>
              <button
                style={styles.okButton}
                onClick={() => setShowMessageModal(null)}
              >
                {t('common.ok')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    width: '100%',
    ...flexColumn,
    backgroundColor: COLORS.bgDarkSolid,
    overflow: 'hidden',
    boxSizing: 'border-box'
  },
  mapWrapper: {
    flex: 1,
    width: '100%',
    ...flexCenter,
    minHeight: 0,
    overflow: 'hidden',
    position: 'relative'
  },
  loading: {
    flex: 1,
    ...flexCenter,
    fontSize: FONT_SIZE.lg,
    color: COLORS.textMuted
  },
  loadingScreen: {
    width: '100vw',
    height: '100vh',
    ...flexCenter,
    background: `linear-gradient(135deg, ${COLORS.bgDarkAlt} 0%, ${COLORS.bgSurface} 50%, ${COLORS.bgDarkAlt} 100%)`,
    color: COLORS.textLight
  },
  loadingContent: {
    textAlign: 'center'
  },
  loadingLogo: {
    width: '300px',
    height: 'auto',
    marginBottom: SPACING[6],
    filter: 'drop-shadow(0 0 20px rgba(45, 212, 191, 0.4))',
    animation: 'pulse 2s ease-in-out infinite'
  },
  loadingText: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textGray,
    marginTop: SPACING[5]
  },
  errorScreen: {
    width: '100vw',
    height: '100vh',
    ...flexCenter,
    background: `linear-gradient(135deg, ${COLORS.bgDarkAlt} 0%, ${COLORS.bgSurface} 50%, ${COLORS.bgDarkAlt} 100%)`,
    color: COLORS.textLight
  },
  errorContent: {
    textAlign: 'center',
    maxWidth: '500px',
    padding: SPACING[10]
  },
  errorIcon: {
    fontSize: FONT_SIZE['7xl'],
    marginBottom: SPACING[5]
  },
  errorText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.danger,
    marginBottom: SPACING[6]
  },
  retryButton: {
    padding: `${SPACING[3]} ${SPACING[8]}`,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    color: COLORS.bgDarkAlt,
    border: 'none',
    borderRadius: BORDER_RADIUS.md,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase,
    boxShadow: SHADOWS.glowTeal
  },
  infoPanel: {
    position: 'absolute',
    bottom: SPACING[2],
    left: SPACING[2],
    right: SPACING[2],
    display: 'flex',
    gap: SPACING.md,
    padding: SPACING[2],
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderRadius: BORDER_RADIUS.md,
    border: `1px solid ${COLORS.borderDark}`,
    flexWrap: 'wrap',
    backdropFilter: BLUR.md,
    boxShadow: SHADOWS.card,
    zIndex: 200
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[1]
  },
  infoIcon: {
    fontSize: FONT_SIZE.base
  },
  infoText: {
    fontSize: FONT_SIZE[13],
    color: COLORS.textSlate
  },
  // Modal styles
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.bgOverlayDark,
    backdropFilter: BLUR.md,
    ...flexCenter,
    zIndex: 1000,
    padding: SPACING[5]
  },
  modalContent: {
    background: `linear-gradient(135deg, ${COLORS.bgSurface} 0%, ${COLORS.bgDarkAlt} 100%)`,
    borderRadius: BORDER_RADIUS.lg,
    border: `2px solid ${COLORS.primary}`,
    boxShadow: SHADOWS.glowTeal,
    maxWidth: '500px',
    width: '100%',
    maxHeight: '80vh',
    overflow: 'hidden',
    ...flexColumn
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING[5],
    borderBottom: `1px solid ${COLORS.bgSurfaceLight}`,
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, transparent 100%)'
  },
  modalTitle: {
    margin: 0,
    fontSize: FONT_SIZE['2xl'],
    color: COLORS.textLight,
    fontWeight: FONT_WEIGHT.bold
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: COLORS.textGray,
    fontSize: FONT_SIZE['2xl'],
    cursor: 'pointer',
    padding: `${SPACING[1]} ${SPACING[2]}`,
    transition: TRANSITIONS.allBase,
    borderRadius: BORDER_RADIUS.sm
  },
  modalBody: {
    padding: SPACING[5],
    overflow: 'auto',
    flex: 1
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${SPACING[2]} 0`,
    borderBottom: `1px solid ${COLORS.bgSurface}`
  },
  label: {
    color: COLORS.textGray,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium
  },
  value: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold
  },
  energyCost: {
    color: COLORS.goldLight,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold
  },
  divider: {
    height: '1px',
    background: `linear-gradient(90deg, transparent 0%, ${COLORS.bgSurfaceLight} 50%, transparent 100%)`,
    margin: `${SPACING.md} 0`
  },
  buildingsSection: {
    marginTop: SPACING.md
  },
  sectionTitle: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING[2]
  },
  buildingsList: {
    ...flexColumn,
    gap: SPACING[2]
  },
  buildingItem: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[2],
    padding: `${SPACING[2]} ${SPACING[3]}`,
    background: 'rgba(45, 212, 191, 0.1)',
    borderRadius: BORDER_RADIUS.md,
    border: '1px solid rgba(45, 212, 191, 0.2)'
  },
  buildingIcon: {
    fontSize: FONT_SIZE.base
  },
  buildingName: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.md,
    textTransform: 'capitalize'
  },
  infoBox: {
    marginTop: SPACING.md,
    padding: SPACING[3],
    background: 'rgba(59, 130, 246, 0.1)',
    border: `1px solid rgba(59, 130, 246, 0.3)`,
    borderRadius: BORDER_RADIUS.md
  },
  warningText: {
    color: COLORS.goldLight,
    fontSize: FONT_SIZE.base,
    lineHeight: '1.5',
    margin: `0 0 ${SPACING.md} 0`
  },
  buttonGroup: {
    display: 'flex',
    gap: SPACING[2],
    marginTop: SPACING[5]
  },
  cancelButton: {
    flex: 1,
    padding: `${SPACING[3]} ${SPACING[6]}`,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    background: 'transparent',
    color: COLORS.textGray,
    border: `2px solid ${COLORS.bgSurfaceLight}`,
    borderRadius: BORDER_RADIUS.md,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase
  },
  enterButton: {
    flex: 1,
    padding: `${SPACING[3]} ${SPACING[6]}`,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    color: COLORS.bgDarkAlt,
    border: 'none',
    borderRadius: BORDER_RADIUS.md,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase,
    boxShadow: SHADOWS.glowTeal
  },
  okButton: {
    width: '100%',
    padding: `${SPACING[3]} ${SPACING[6]}`,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    color: COLORS.bgDarkAlt,
    border: 'none',
    borderRadius: BORDER_RADIUS.md,
    cursor: 'pointer',
    transition: TRANSITIONS.allBase,
    boxShadow: SHADOWS.glowTeal,
    marginTop: SPACING.md
  },
  modalFooter: {
    padding: SPACING[5],
    borderTop: `1px solid ${COLORS.bgSurfaceLight}`
  }
};
