/**
 * WorldMap Demo v2.0 Component
 *
 * Demo implementation of new game loop with GameLayout.
 * Shows header with resources, worldmap, and bottom navigation.
 * Now integrated with database via useGameState hook.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-10
 */

import React, { useEffect, useState } from 'react';
import { GameLayout } from './GameLayout';
import { WorldMapGenerator } from '../engine/worldmap/WorldMapGenerator';
import { WorldMapViewer } from './WorldMapViewer';
import { HeroesScreen } from './HeroesScreen';
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
import { WeatherSystem } from '../engine/worldmap/WeatherSystem';
import { TimeOfDaySystem } from '../engine/worldmap/TimeOfDaySystem';
import { useGameState } from '../hooks/useGameState';
import { useEnergyRegeneration } from '../hooks/useEnergyRegeneration';
import { useOtherPlayers } from '../hooks/useOtherPlayers';
import { supabase } from '../lib/supabase';
import { t } from '../localization/i18n';
import type { StaticObject, Town, DungeonEntrance, TreasureChest, HiddenPath, Portal, RareSpawn, DynamicObject, WanderingMonster, TravelingMerchant } from '../types/worldmap.types';
import { DEBUG_CONFIG } from '../config/DEBUG_CONFIG';

interface WorldMapDemo2Props {
  onEnterDungeon?: (dungeon: DungeonEntrance) => void;
  onQuickCombat?: (enemies: any[], combatType: 'rare_spawn' | 'wandering_monster', metadata?: any) => void;
  userEmail?: string;
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
export function WorldMapDemo2({ onEnterDungeon, onQuickCombat, userEmail: userEmailProp }: WorldMapDemo2Props) {
  // Use centralized game state with database sync
  const [gameState, gameActions] = useGameState(userEmailProp);

  // Use email from props or fallback to placeholder
  const playerEmail = userEmailProp || 'adventurer@lootersland.com';

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

  // Weather & Time of Day Update Loop (check every minute)
  useEffect(() => {
    if (!gameState.worldMap) return;

    const updateWeatherAndTime = () => {
      const updatedWeather = WeatherSystem.update(gameState.worldMap!.weather);
      const updatedTime = TimeOfDaySystem.update(gameState.worldMap!.timeOfDay);

      // Only update if something changed
      if (
        updatedWeather.current !== gameState.worldMap!.weather.current ||
        updatedTime.current !== gameState.worldMap!.timeOfDay.current
      ) {
        gameActions.updateWorldMap({
          ...gameState.worldMap!,
          weather: updatedWeather,
          timeOfDay: updatedTime
        });
      }
    };

    // Initial check
    updateWeatherAndTime();

    // Check every 60 seconds
    const interval = setInterval(updateWeatherAndTime, 60000);

    return () => clearInterval(interval);
  }, [gameState.worldMap, gameActions]);

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
      const newWorld = WorldMapGenerator.generate({
        width: 50,
        height: 50,
        seed: `daily-${new Date().toISOString().split('T')[0]}`, // Daily seed
        townCount: 4,
        dungeonCount: 5,
        encounterCount: 15,
        resourceCount: 50
      });

      // Reveal area around capital
      const capital = newWorld.staticObjects.find(
        obj => obj.type === 'town' && obj.name === 'Capital'
      );
      if (capital) {
        for (let y = capital.position.y - 5; y <= capital.position.y + 5; y++) {
          for (let x = capital.position.x - 5; x <= capital.position.x + 5; x++) {
            if (newWorld.tiles[y]?.[x]) {
              newWorld.tiles[y][x].isExplored = true;
            }
          }
        }
        gameActions.updatePlayerPos(capital.position.x, capital.position.y);
      }

      gameActions.updateWorldMap(newWorld);
    }
  }, [gameState.loading, gameState.worldMap]);

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
      // Check if clicking on a static object (town or dungeon)
      if (tile.staticObject) {
        handleObjectClick(tile.staticObject, x, y);
        return;
      }

      // Check if clicking on a dynamic object (wandering monster, traveling merchant)
      if (gameState.worldMap) {
        const dynamicObject = gameState.worldMap.dynamicObjects.find(
          obj => obj.position.x === x && obj.position.y === y && obj.isActive
        );
        if (dynamicObject) {
          handleDynamicObjectClick(dynamicObject, x, y);
          return;
        }
      }
    }

    console.log(`Clicked tile (${x}, ${y}) - ${tile.terrain}`);

    // Calculate Manhattan distance (simple grid distance)
    const distance = Math.abs(x - gameState.playerPos.x) + Math.abs(y - gameState.playerPos.y);

    // Base movement cost per tile (simplified - could be improved with pathfinding)
    const baseCostPerTile = Math.ceil(tile.movementCost / 100);
    const movementCost = distance * baseCostPerTile;

    if (gameState.energy >= movementCost || DEBUG_CONFIG.UNLIMITED_ENERGY) {
      gameActions.updatePlayerPos(x, y);
      if (!DEBUG_CONFIG.UNLIMITED_ENERGY) {
        gameActions.setEnergy(gameState.energy - movementCost);
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
        message: t('worldmap.notEnoughEnergy', { required: movementCost, current: gameState.energy }),
        required: movementCost
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
      setShowDungeonModal(dungeon);
    } else if (object.type === 'portal') {
      handlePortalTeleport(object as Portal);
    } else if (object.type === 'hiddenPath') {
      handleHiddenPathDiscovery(object as HiddenPath);
    } else if (object.type === 'treasureChest') {
      handleTreasureChestOpen(object as TreasureChest);
    } else if (object.type === 'rareSpawn') {
      const rareSpawn = object as RareSpawn;
      handleRareSpawnCombat(rareSpawn);
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

    // Add items to inventory
    for (const item of loot.items) {
      const result = gameState.inventory.addItem(item);
      if (!result.success) {
        console.warn(`⚠️ Failed to add item ${item.name}: ${result.message}`);
      }
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

    // Check level requirement
    const playerLevel = gameState.activeParty?.[0]?.level || 1;
    if (playerLevel < path.requiredLevel) {
      setShowMessageModal(t('worldmap.hiddenPathLevelRequired', { requiredLevel: path.requiredLevel, playerLevel }));
      return;
    }

    console.log('🗝️ Discovering hidden path:', path);

    // Generate loot
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

    // Add items to inventory
    for (const item of loot.items) {
      const result = gameState.inventory.addItem(item);
      if (!result.success) {
        console.warn(`⚠️ Failed to add item ${item.name}: ${result.message}`);
      }
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
   * Combat happens directly on the map with 2-3 powerful enemies.
   * Marks the rare spawn as defeated after combat completes.
   */
  const handleRareSpawnCombat = async (rareSpawn: RareSpawn) => {
    // Check if already defeated
    if (rareSpawn.defeated) {
      setShowMessageModal(t('worldmap.rareSpawnDefeated'));
      return;
    }

    console.log('⚔️ Preparing rare spawn combat:', rareSpawn);

    // Generate 2-3 powerful enemies for quick combat
    const { generateEnemyGroup } = await import('../engine/combat/Enemy');
    const enemyCount = 2 + Math.floor(Math.random() * 2); // 2-3 enemies
    const enemies = generateEnemyGroup(enemyCount, rareSpawn.enemyLevel, ['elite', 'boss']);

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

  /**
   * Handle wandering monster fast combat
   *
   * Quick combat encounter with wandering monsters on the worldmap.
   * Combat happens directly on the map with 1-2 enemies.
   * Monster respawns after a certain time period.
   */
  const handleWanderingMonsterCombat = async (monster: WanderingMonster) => {
    // Check if already defeated (and waiting to respawn)
    if (monster.defeated) {
      setShowMessageModal(t('worldmap.monsterDefeated'));
      return;
    }

    console.log('⚔️ Preparing wandering monster combat:', monster);

    // Generate 1-2 enemies for quick combat
    const { generateEnemyGroup } = await import('../engine/combat/Enemy');
    const enemyCount = monster.difficulty === 'Elite' ? 2 : 1;
    const enemyTypes: import('../types/combat.types').EnemyType[] = monster.difficulty === 'Elite' ? ['elite'] : ['normal'];
    const enemies = generateEnemyGroup(enemyCount, monster.enemyLevel, enemyTypes);

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

    // Add to inventory
    const result = gameState.inventory.addItem(generatedItem);
    if (!result.success) {
      console.warn(`⚠️ Failed to add item ${generatedItem.name}: ${result.message}`);
    }

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
   * Deducts energy cost, moves player to location, and closes teleport menu.
   */
  const handleTeleport = (location: { name: string; x: number; y: number; type: 'town' | 'dungeon' }) => {
    const TELEPORT_COST = 40;

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

    // Close teleport menu
    setShowTeleportMenu(false);

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
          <div style={styles.loadingSpinner}>⚔️</div>
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

  // Helper functions for weather and time display
  const getWeatherIcon = (weather: string): string => {
    const icons: Record<string, string> = {
      'clear': '☀️',
      'rain': '🌧️',
      'storm': '⛈️',
      'fog': '🌫️',
      'snow': '❄️'
    };
    return icons[weather] || '🌤️';
  };

  const getWeatherLabel = (weather: string): string => {
    const labels: Record<string, string> = {
      'clear': 'Clear',
      'rain': 'Rainy',
      'storm': 'Storm',
      'fog': 'Foggy',
      'snow': 'Snowy'
    };
    return labels[weather] || weather;
  };

  const getTimeIcon = (time: string): string => {
    const icons: Record<string, string> = {
      'day': '☀️',
      'night': '🌙',
      'dawn': '🌅',
      'dusk': '🌆'
    };
    return icons[time] || '🌤️';
  };

  const getTimeLabel = (time: string): string => {
    const labels: Record<string, string> = {
      'day': 'Day',
      'night': 'Night',
      'dawn': 'Dawn',
      'dusk': 'Dusk'
    };
    return labels[time] || time;
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
            weather={gameState.worldMap.weather}
            timeOfDay={gameState.worldMap.timeOfDay}
            onTileClick={handleTileClick}
          />

          {/* Weather & Time Widget */}
          <WeatherTimeWidget
            weather={gameState.worldMap.weather}
            timeOfDay={gameState.worldMap.timeOfDay}
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
            {gameState.worldMap && (
              <>
                <div style={styles.infoItem}>
                  <span style={styles.infoIcon}>{getWeatherIcon(gameState.worldMap.weather.current)}</span>
                  <span style={styles.infoText}>{getWeatherLabel(gameState.worldMap.weather.current)}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoIcon}>{getTimeIcon(gameState.worldMap.timeOfDay.current)}</span>
                  <span style={styles.infoText}>{getTimeLabel(gameState.worldMap.timeOfDay.current)}</span>
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
      onEquipItem={(hero, item) => {
        if (!hero.equipment) return;
        const result = hero.equipment.equip(item);
        if (result.success) {
          gameState.inventory.removeItem(item.id);
          if (result.unequippedItem) {
            gameState.inventory.addItem(result.unequippedItem);
          }
          gameActions.forceUpdate();
          gameActions.saveGame(); // Trigger save after equipment change
        } else {
          // Show error message if equip failed
          setEquipmentMessage(result.message);
        }
      }}
      onUnequipItem={(hero, slotName) => {
        if (!hero.equipment) return;
        const result = hero.equipment.unequip(slotName as any);
        if (result.success && result.item) {
          gameState.inventory.addItem(result.item);
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

              // Auto-save will trigger automatically via scheduleAutoSave in addHero
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
                <ItemDisplay key={i} item={item} compact />
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
                        setShowMessageModal(`✨ ${result.message}\nSuccess rate was ${result.chance}%`);
                        gameActions.saveGame();
                        setEnchantItem({ ...enchantItem }); // Force re-render
                      } else {
                        setShowMessageModal(`❌ ${result.message}\nSuccess rate was ${result.chance}%`);
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
                      // Remove item from inventory
                      gameState.inventory.removeItem(enchantItem.id);
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
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0a0a0a',
    overflow: 'hidden',
    boxSizing: 'border-box'
  },
  mapWrapper: {
    flex: 1,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 0,
    overflow: 'hidden',
    position: 'relative'
  },
  loading: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    color: '#888'
  },
  loadingScreen: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    color: '#f1f5f9'
  },
  loadingContent: {
    textAlign: 'center'
  },
  loadingSpinner: {
    fontSize: '64px',
    marginBottom: '20px',
    animation: 'pulse 2s ease-in-out infinite'
  },
  loadingText: {
    fontSize: '20px',
    color: '#94a3b8'
  },
  errorScreen: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    color: '#f1f5f9'
  },
  errorContent: {
    textAlign: 'center',
    maxWidth: '500px',
    padding: '40px'
  },
  errorIcon: {
    fontSize: '64px',
    marginBottom: '20px'
  },
  errorText: {
    fontSize: '18px',
    color: '#ef4444',
    marginBottom: '30px'
  },
  retryButton: {
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
    color: '#0f172a',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(45, 212, 191, 0.3)'
  },
  infoPanel: {
    position: 'absolute',
    bottom: '10px',
    left: '10px',
    right: '10px',
    display: 'flex',
    gap: '15px',
    padding: '10px',
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderRadius: '8px',
    border: '1px solid #333',
    flexWrap: 'wrap',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  infoIcon: {
    fontSize: '16px'
  },
  infoText: {
    fontSize: '13px',
    color: '#ccc'
  },
  // Modal styles
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    borderRadius: '12px',
    border: '2px solid #2dd4bf',
    boxShadow: '0 8px 32px rgba(45, 212, 191, 0.3)',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #334155',
    background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, transparent 100%)'
  },
  modalTitle: {
    margin: 0,
    fontSize: '24px',
    color: '#f1f5f9',
    fontWeight: '700'
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '4px 8px',
    transition: 'all 0.2s',
    borderRadius: '4px'
  },
  modalBody: {
    padding: '20px',
    overflow: 'auto',
    flex: 1
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #1e293b'
  },
  label: {
    color: '#94a3b8',
    fontSize: '14px',
    fontWeight: '500'
  },
  value: {
    color: '#f1f5f9',
    fontSize: '14px',
    fontWeight: '600'
  },
  energyCost: {
    color: '#fbbf24',
    fontSize: '14px',
    fontWeight: '700'
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent 0%, #334155 50%, transparent 100%)',
    margin: '15px 0'
  },
  buildingsSection: {
    marginTop: '15px'
  },
  sectionTitle: {
    color: '#f1f5f9',
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '10px'
  },
  buildingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  buildingItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: 'rgba(45, 212, 191, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(45, 212, 191, 0.2)'
  },
  buildingIcon: {
    fontSize: '16px'
  },
  buildingName: {
    color: '#f1f5f9',
    fontSize: '14px',
    textTransform: 'capitalize'
  },
  infoBox: {
    marginTop: '15px',
    padding: '12px',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '6px'
  },
  warningText: {
    color: '#fbbf24',
    fontSize: '16px',
    lineHeight: '1.5',
    margin: '0 0 15px 0'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px'
  },
  cancelButton: {
    flex: 1,
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    background: 'transparent',
    color: '#94a3b8',
    border: '2px solid #334155',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  enterButton: {
    flex: 1,
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
    color: '#0f172a',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(45, 212, 191, 0.3)'
  },
  okButton: {
    width: '100%',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
    color: '#0f172a',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(45, 212, 191, 0.3)',
    marginTop: '15px'
  }
};
