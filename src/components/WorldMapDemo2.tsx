/**
 * WorldMap Demo v2.0 Component
 *
 * Demo implementation of new game loop with GameLayout.
 * Shows header with resources, worldmap, and bottom navigation.
 * Now integrated with database via useGameState hook.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-09
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
import { GameModal } from './ui/GameModal';
import { ModalText, ModalDivider, ModalInfoBox, ModalInfoRow, ModalButton, ModalButtonGroup } from './ui/ModalContent';
import { InventoryHelper } from '../engine/item/InventoryHelper';
import { useGameState } from '../hooks/useGameState';
import { useEnergyRegeneration } from '../hooks/useEnergyRegeneration';
import { useOtherPlayers } from '../hooks/useOtherPlayers';
import { supabase } from '../lib/supabase';
import { t } from '../localization/i18n';
import type { StaticObject, Town, DungeonEntrance } from '../types/worldmap.types';

interface WorldMapDemo2Props {
  onEnterDungeon?: (dungeon: DungeonEntrance) => void;
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
export function WorldMapDemo2({ onEnterDungeon, userEmail: userEmailProp }: WorldMapDemo2Props) {
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
  const handleTileClick = (x: number, y: number) => {
    if (!gameState.worldMap) return;

    const tile = gameState.worldMap.tiles[y]?.[x];
    if (!tile) return;

    // Prevent movement to unexplored tiles
    if (!tile.isExplored) {
      setShowUnexploredModal(true);
      return;
    }

    // Check if clicking on a static object (town or dungeon)
    if (tile.staticObject) {
      handleObjectClick(tile.staticObject, x, y);
      return;
    }

    console.log(`Clicked tile (${x}, ${y}) - ${tile.terrain}`);

    // Calculate Manhattan distance (simple grid distance)
    const distance = Math.abs(x - gameState.playerPos.x) + Math.abs(y - gameState.playerPos.y);

    // Base movement cost per tile (simplified - could be improved with pathfinding)
    const baseCostPerTile = Math.ceil(tile.movementCost / 100);
    const movementCost = distance * baseCostPerTile;

    if (gameState.energy >= movementCost) {
      gameActions.updatePlayerPos(x, y);
      gameActions.setEnergy(gameState.energy - movementCost);

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
        message: t('worldmap.notEnoughEnergy', `Not enough energy! You need ${movementCost} energy but only have ${gameState.energy}.`),
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
      if (gameState.energy < energyCost) {
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

    // Then show the appropriate modal
    if (object.type === 'town') {
      const town = object as Town;
      setShowTownModal(town);
    } else if (object.type === 'dungeon') {
      const dungeon = object as DungeonEntrance;
      setShowDungeonModal(dungeon);
    }
  };

  /**
   * Handle teleport to a location
   *
   * Deducts energy cost, moves player to location, and closes teleport menu.
   */
  const handleTeleport = (location: { name: string; x: number; y: number; type: 'town' | 'dungeon' }) => {
    const TELEPORT_COST = 40;

    if (gameState.energy < TELEPORT_COST) {
      setShowEnergyModal({
        message: t('worldmap.notEnoughEnergy', 'Not enough energy to teleport!'),
        required: TELEPORT_COST
      });
      return;
    }

    // Deduct energy and move player
    gameActions.setEnergy(gameState.energy - TELEPORT_COST);
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

  const worldmapContent = (
    <div style={styles.container}>
      {gameState.worldMap ? (
        <div style={styles.mapWrapper}>
          <WorldMapViewer
            worldMap={gameState.worldMap}
            playerPosition={gameState.playerPos}
            otherPlayers={otherPlayers}
            playerChatMessage={myChatMessage}
            playerChatTimestamp={myChatTimestamp}
            onTileClick={handleTileClick}
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
              <span style={styles.infoText}>{t('worldmap.dailyRank')} #250</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoIcon}>🕳️</span>
              <span style={styles.infoText}>{t('worldmap.todo')} 15</span>
            </div>
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
    />
  );

  const inventoryContent = (
    <InventoryScreen
      heroes={gameState.allHeroes}
      inventory={gameState.inventory}
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
        playerLevel={gameState.playerLevel}
        gold={gameState.gold}
        gems={gameState.gems}
        energy={gameState.energy}
        maxEnergy={gameState.maxEnergy}
        energyRegenRate={energyRegen.regenRate}
        heroCount={gameState.allHeroes.length}
        itemCount={gameState.inventory.items.length}
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
                        alert(`✨ ${result.message}\nSuccess rate was ${result.chance}%`);
                        gameActions.saveGame();
                        setEnchantItem({ ...enchantItem }); // Force re-render
                      } else {
                        alert(`❌ ${result.message}\nSuccess rate was ${result.chance}%`);
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
                      // Close modal
                      setEnchantItem(null);
                      alert(`✅ Sold ${enchantItem.getDisplayName()} for ${sellPrice} gold!`);
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
