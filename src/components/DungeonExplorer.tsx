/**
 * Dungeon Explorer Component - Main dungeon UI
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React, { useState, useEffect, useRef } from 'react';
import type { Dungeon } from '../engine/dungeon/Dungeon';
import type { Room, Direction } from '../types/dungeon.types';
import type { Hero } from '../engine/hero/Hero';
import type { Item } from '../engine/item/Item';
import { DungeonMinimap } from './DungeonMinimap';
import { t } from '../localization/i18n';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../styles/tokens';
import { flexBetween, flexColumn, flexCenter } from '../styles/common';

interface DungeonExplorerProps {
  dungeon: Dungeon;
  dungeonUpdateKey: number;
  heroes: Hero[];
  onCombatStart: (enemies: any[]) => void;
  onTreasureLooted: (gold: number, items: Item[]) => void;
  onDungeonExit: () => void;
  onFloorComplete: () => void;
}

/**
 * Dungeon Explorer Component
 */
export const DungeonExplorer: React.FC<DungeonExplorerProps> = ({
  dungeon,
  dungeonUpdateKey,
  heroes,
  onCombatStart,
  onTreasureLooted,
  onDungeonExit,
  onFloorComplete
}) => {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [message, setMessage] = useState<string>('');
  const [, forceUpdate] = useState({});
  const lastCombatRoomId = useRef<string | null>(null);
  const lastExitRoomId = useRef<string | null>(null);

  useEffect(() => {
    const room = dungeon.getCurrentRoom();
    setCurrentRoom(room);

    // Auto-start combat when entering combat/boss/elite/miniboss room (only once per room)
    if (room && (room.type === 'combat' || room.type === 'boss' || room.type === 'elite' || room.type === 'miniboss')) {
      if (!room.combatCompleted && room.enemies && room.enemies.length > 0) {
        // Only start combat if we haven't already started it for this room
        if (lastCombatRoomId.current !== room.id) {
          lastCombatRoomId.current = room.id;
          onCombatStart(room.enemies);
        }
      } else if (room.combatCompleted) {
        // Reset lastCombatRoomId when combat is completed so we don't block future combats
        lastCombatRoomId.current = null;
      }
    }

    // Auto-trigger dialog when entering exit room (only once per room)
    if (room && room.type === 'exit') {
      if (lastExitRoomId.current !== room.id) {
        lastExitRoomId.current = room.id;

        // Use setTimeout to ensure state is updated first
        setTimeout(() => {
          const confirmMessage = `🚪 ${t('dungeon.exitRoomTitle')}\n\n${t('dungeon.exitRoomMessage')}`;
          const choice = window.confirm(confirmMessage);

          if (choice) {
            // Proceed to next floor
            const result = dungeon.proceedToNextFloor();
            setMessage(result.message);
            if (result.success) {
              onFloorComplete();
              setCurrentRoom(dungeon.getCurrentRoom());
              forceUpdate({});
            }
          } else {
            // Leave dungeon
            onDungeonExit();
          }
        }, 100);
      }
    }
  }, [dungeon, dungeonUpdateKey]);

  /**
   * Handle movement
   */
  const handleMove = (direction: Direction) => {
    // Block movement if current room has uncompleted combat
    if (currentRoom && (currentRoom.type === 'combat' || currentRoom.type === 'boss' || currentRoom.type === 'elite' || currentRoom.type === 'miniboss')) {
      if (!currentRoom.combatCompleted && (currentRoom.type === 'miniboss' ? !currentRoom.miniBossDefeated : true)) {
        setMessage('⚠️ You must defeat all enemies before leaving this room!');
        return;
      }
    }

    const result = dungeon.moveToRoom(direction);
    setMessage(result.message);

    if (result.success) {
      setCurrentRoom(dungeon.getCurrentRoom());
      forceUpdate({});
    }
  };

  /**
   * Handle room click on minimap
   */
  const handleRoomClick = (roomId: string) => {
    // Find target room
    const targetRoom = dungeon.getCurrentFloor()?.rooms.find(r => r.id === roomId);
    if (!targetRoom || !currentRoom) return;

    // Calculate direction to move
    const dx = targetRoom.position.x - currentRoom.position.x;
    const dy = targetRoom.position.y - currentRoom.position.y;

    let direction: Direction | null = null;
    if (dx === 1 && dy === 0) direction = 'east';
    else if (dx === -1 && dy === 0) direction = 'west';
    else if (dy === 1 && dx === 0) direction = 'south';
    else if (dy === -1 && dx === 0) direction = 'north';

    if (direction) {
      handleMove(direction);
    }
  };

  /**
   * Handle room actions
   */
  const handleRoomAction = () => {
    if (!currentRoom) return;

    switch (currentRoom.type) {
      case 'combat':
      case 'boss':
        if (!currentRoom.combatCompleted && currentRoom.enemies) {
          onCombatStart(currentRoom.enemies);
        }
        break;

      case 'treasure':
        if (!currentRoom.treasureLooted) {
          const result = dungeon.lootTreasure();
          setMessage(result.message);
          if (result.success && result.rewards) {
            onTreasureLooted(
              result.rewards.gold || 0,
              result.rewards.items || []
            );
          }
          forceUpdate({});
        }
        break;

      case 'trap':
        if (!currentRoom.trapDisarmed) {
          const result = dungeon.disarmTrap(heroes);

          // Build detailed damage message
          let message = result.message;
          if (!result.success && result.damage?.heroes) {
            message += `\n\n💥 ${t('dungeon.damageReport')}:`;
            result.damage.heroes.forEach(({ hero, damage }) => {
              const status = hero.isAlive ? `(${hero.currentHP}/${hero.maxHP} HP)` : '💀 DEAD';
              message += `\n  • ${hero.name}: -${damage} HP ${status}`;
            });
          }

          setMessage(message);
          setCurrentRoom(dungeon.getCurrentRoom()); // Update current room state
          forceUpdate({});
        }
        break;

      case 'rest':
        if (!currentRoom.restUsed) {
          const result = dungeon.useRest(heroes);
          setMessage(result.message);
          forceUpdate({});
        }
        break;

      case 'shrine':
        if (!currentRoom.shrineUsed) {
          const result = dungeon.useShrine();
          setMessage(result.message);
          forceUpdate({});
        }
        break;

      case 'mystery':
        if (!currentRoom.mysteryResolved) {
          const result = dungeon.resolveMystery(heroes);

          // Build detailed message with damage report if negative event
          let message = result.message;
          if (result.damage?.heroes) {
            message += `\n\n💥 ${t('dungeon.damageReport')}:`;
            result.damage.heroes.forEach(({ hero, damage }) => {
              const status = hero.isAlive ? `(${hero.currentHP}/${hero.maxHP} HP)` : '💀 DEAD';
              message += `\n  • ${hero.name}: -${damage} HP ${status}`;
            });
          }

          setMessage(message);
          if (result.rewards?.gold) {
            onTreasureLooted(result.rewards.gold, result.rewards.items || []);
          }
          forceUpdate({});
        }
        break;

      case 'elite':
      case 'miniboss':
        if (!currentRoom.combatCompleted && currentRoom.enemies) {
          onCombatStart(currentRoom.enemies);
        }
        break;

      case 'exit':
        const result = dungeon.proceedToNextFloor();
        setMessage(result.message);
        if (result.success) {
          onFloorComplete();
          setCurrentRoom(dungeon.getCurrentRoom());
          forceUpdate({});
        }
        break;
    }
  };

  /**
   * Get room icon
   */
  const getRoomIcon = (room: Room): string => {
    const icons = {
      start: '🚪',
      combat: '⚔️',
      treasure: '💎',
      trap: '⚠️',
      rest: '🔥',
      boss: '💀',
      exit: '🚪',
      shrine: '⛪',
      mystery: '❓',
      elite: '💪',
      miniboss: '👹'
    };
    return icons[room.type] || '❓';
  };

  /**
   * Get room color
   */
  const getRoomColor = (room: Room): string => {
    const colors = {
      start: '#4a9eff',
      combat: '#ff4a4a',
      treasure: '#ffd700',
      trap: '#ff8c00',
      rest: '#4aff4a',
      boss: '#9400d3',
      exit: '#4a9eff',
      shrine: '#87ceeb',
      mystery: '#ff69b4',
      elite: '#ff6347',
      miniboss: '#8b0000'
    };
    return colors[room.type] || '#888';
  };

  /**
   * Get action button text
   */
  const getActionButtonText = (): string => {
    if (!currentRoom) return '';

    switch (currentRoom.type) {
      case 'combat':
        return currentRoom.combatCompleted ? 'Combat Completed' : 'Start Combat';
      case 'boss':
        return currentRoom.bossDefeated ? 'Boss Defeated' : 'Fight Boss';
      case 'treasure':
        return currentRoom.treasureLooted ? 'Looted' : 'Loot Treasure';
      case 'trap':
        return currentRoom.trapDisarmed ? 'Trap Disarmed' : 'Disarm Trap';
      case 'rest':
        return currentRoom.restUsed ? 'Already Rested' : 'Rest';
      case 'exit':
        return 'Proceed to Next Floor';
      case 'shrine':
        return currentRoom.shrineUsed ? 'Shrine Used' : 'Use Shrine';
      case 'mystery':
        return currentRoom.mysteryResolved ? 'Mystery Resolved' : 'Investigate';
      case 'elite':
        return currentRoom.combatCompleted ? 'Elite Defeated' : 'Fight Elite';
      case 'miniboss':
        return currentRoom.miniBossDefeated ? 'Mini-Boss Defeated' : 'Fight Mini-Boss';
      default:
        return '';
    }
  };

  /**
   * Check if action is available
   */
  const isActionAvailable = (): boolean => {
    if (!currentRoom) return false;

    switch (currentRoom.type) {
      case 'combat':
        return !currentRoom.combatCompleted;
      case 'boss':
        return !currentRoom.bossDefeated;
      case 'treasure':
        return !currentRoom.treasureLooted;
      case 'trap':
        return !currentRoom.trapDisarmed;
      case 'rest':
        return !currentRoom.restUsed;
      case 'exit':
        return true;
      case 'shrine':
        return !currentRoom.shrineUsed;
      case 'mystery':
        return !currentRoom.mysteryResolved;
      case 'elite':
        return !currentRoom.combatCompleted;
      case 'miniboss':
        return !currentRoom.miniBossDefeated;
      default:
        return false;
    }
  };

  if (!currentRoom) {
    return <div>Loading dungeon...</div>;
  }

  const stats = dungeon.getStatistics();
  const floor = dungeon.getCurrentFloor();

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>{dungeon.name}</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Always show Exit button at exit room */}
          {currentRoom.type === 'exit' && (
            <button
              onClick={() => onDungeonExit()}
              style={{
                ...styles.exitButton,
                backgroundColor: '#4aff4a'
              }}
            >
              ✅ Exit Dungeon (Keep Loot)
            </button>
          )}

          {/* Always show Abandon button */}
          <button
            onClick={() => {
              const confirm = window.confirm(
                '⚠️ Warning: Leaving the dungeon now will cause you to lose all collected loot and progress!\n\nAre you sure you want to abandon the dungeon?'
              );
              if (confirm) {
                onDungeonExit();
              }
            }}
            style={{
              ...styles.exitButton,
              backgroundColor: '#ff4444'
            }}
          >
            ❌ Abandon Dungeon
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div style={styles.stats}>
        <div style={styles.statItem}>
          <span>Floor:</span>
          <strong>{floor?.floorNumber || 0}</strong>
        </div>
        <div style={styles.statItem}>
          <span>Enemies Defeated:</span>
          <strong>{stats.enemiesDefeated}</strong>
        </div>
        <div style={styles.statItem}>
          <span>Gold Earned:</span>
          <strong>{stats.goldEarned}</strong>
        </div>
        <div style={styles.statItem}>
          <span>Items Found:</span>
          <strong>{stats.itemsFound}</strong>
        </div>
      </div>

      {/* Active Buffs */}
      {floor?.activeBuffs && floor.activeBuffs.length > 0 && (
        <div style={{
          padding: '10px 15px',
          marginBottom: '15px',
          backgroundColor: 'rgba(135, 206, 235, 0.1)',
          borderRadius: '8px',
          border: '2px solid #87ceeb'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
            ✨ Active Shrine Buffs:
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {floor.activeBuffs.includes('damage') && (
              <span style={{ padding: '4px 8px', backgroundColor: 'rgba(255, 77, 77, 0.2)', borderRadius: '4px', fontSize: '13px' }}>
                ⚔️ +10% Damage
              </span>
            )}
            {floor.activeBuffs.includes('xp') && (
              <span style={{ padding: '4px 8px', backgroundColor: 'rgba(100, 149, 237, 0.2)', borderRadius: '4px', fontSize: '13px' }}>
                📖 +15% XP
              </span>
            )}
            {floor.activeBuffs.includes('gold') && (
              <span style={{ padding: '4px 8px', backgroundColor: 'rgba(255, 215, 0, 0.2)', borderRadius: '4px', fontSize: '13px' }}>
                💰 +20% Gold
              </span>
            )}
            {floor.activeBuffs.includes('stats') && (
              <span style={{ padding: '4px 8px', backgroundColor: 'rgba(138, 43, 226, 0.2)', borderRadius: '4px', fontSize: '13px' }}>
                ✨ +10% All Stats
              </span>
            )}
          </div>
        </div>
      )}

      {/* Minimap */}
      {floor && (
        <DungeonMinimap
          floor={floor}
          currentRoomId={currentRoom.id}
          onRoomClick={handleRoomClick}
          isMovementBlocked={
            (currentRoom.type === 'combat' || currentRoom.type === 'boss' || currentRoom.type === 'elite' || currentRoom.type === 'miniboss')
              ? !currentRoom.combatCompleted
              : false
          }
        />
      )}

      {/* Current Room Display */}
      <div style={styles.roomDisplay}>
        <div
          style={{
            ...styles.roomCard,
            borderColor: getRoomColor(currentRoom)
          }}
        >
          <div style={styles.roomHeader}>
            <span style={styles.roomIcon}>{getRoomIcon(currentRoom)}</span>
            <h3 style={styles.roomTitle}>
              {currentRoom.type.charAt(0).toUpperCase() + currentRoom.type.slice(1)} Room
            </h3>
          </div>

          <div style={styles.roomInfo}>
            <p>Difficulty: <strong>{currentRoom.difficulty}</strong></p>

            {currentRoom.type === 'combat' && currentRoom.enemies && (
              <div>
                <p>⚔️ {t('dungeon.enemies')}: {currentRoom.enemies.length}</p>
                {currentRoom.enemies.length > 0 && (
                  <div style={{ marginLeft: '10px', fontSize: '13px', color: '#aaa' }}>
                    {currentRoom.enemies.map((enemy, idx) => (
                      <div key={idx}>
                        • {enemy.name} (Lvl {enemy.level})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentRoom.type === 'treasure' && !currentRoom.treasureLooted && (
              <div>
                <p>💰 {t('dungeon.gold')}: {currentRoom.treasureGold}</p>
                <p>📦 {t('dungeon.items')}: {currentRoom.treasureItems?.length || 0}</p>
                {currentRoom.treasureItems && currentRoom.treasureItems.length > 0 && (
                  <div style={{ marginTop: '10px', fontSize: '14px' }}>
                    {currentRoom.treasureItems.map((item, idx) => (
                      <div key={`dungeon-treasure-${item.id || `treasure-${idx}`}`} style={{
                        marginBottom: '5px',
                        padding: '5px',
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        borderRadius: '4px'
                      }}>
                        <span style={{
                          color: item.rarity === 'legendary' ? '#ff8c00' :
                                 item.rarity === 'epic' ? '#9400d3' :
                                 item.rarity === 'rare' ? '#4169e1' :
                                 item.rarity === 'uncommon' ? '#228b22' :
                                 '#808080'
                        }}>
                          ⚔️ {item.name}
                        </span>
                        <span style={{ marginLeft: '8px', color: '#aaa' }}>
                          (Lvl {item.level}, {item.rarity})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentRoom.type === 'trap' && !currentRoom.trapDisarmed && (
              <p>{currentRoom.trapDescription}</p>
            )}

            {currentRoom.type === 'rest' && !currentRoom.restUsed && (
              <p>Heal Amount: {currentRoom.healAmount} HP</p>
            )}

            {currentRoom.type === 'boss' && (
              <div>
                <p style={{ color: '#ff4444', fontWeight: 'bold' }}>
                  {t('dungeon.bossEncounter')}
                </p>
                {currentRoom.enemies && currentRoom.enemies.length > 0 && (
                  <div style={{ marginLeft: '10px', fontSize: '14px', color: '#ff6666' }}>
                    {currentRoom.enemies.map((enemy, idx) => (
                      <div key={idx}>
                        💀 {enemy.name} (Lvl {enemy.level})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentRoom.type === 'shrine' && !currentRoom.shrineUsed && (
              <div>
                <p>A mystical shrine radiates power...</p>
                <p>Buff Type: <strong>{currentRoom.shrineBuffType}</strong></p>
              </div>
            )}

            {currentRoom.type === 'mystery' && !currentRoom.mysteryResolved && (
              <p>{currentRoom.mysteryDescription}</p>
            )}

            {currentRoom.type === 'elite' && currentRoom.enemies && (
              <div>
                <p style={{ color: '#ff6347', fontWeight: 'bold' }}>
                  {t('dungeon.eliteCombat')}
                </p>
                <p>{t('dungeon.eliteEnemies')}: {currentRoom.enemies.length}</p>
                {currentRoom.enemies.length > 0 && (
                  <div style={{ marginLeft: '10px', fontSize: '13px', color: '#ff8c69' }}>
                    {currentRoom.enemies.map((enemy, idx) => (
                      <div key={idx}>
                        💪 {enemy.name} (Lvl {enemy.level})
                      </div>
                    ))}
                  </div>
                )}
                {currentRoom.eliteRewards && (
                  <div style={{ marginTop: '10px' }}>
                    <p>💰 {t('dungeon.guaranteedRewards')}:</p>
                    <div style={{ marginLeft: '10px', fontSize: '14px' }}>
                      <p style={{ color: '#ffd700' }}>{t('dungeon.gold')}: {currentRoom.eliteRewards.gold}</p>
                      {currentRoom.eliteRewards.items && currentRoom.eliteRewards.items.map((item, idx) => (
                        <div key={`dungeon-elite-${item.id || `elite-${idx}`}`} style={{
                          marginBottom: '5px',
                          padding: '5px',
                          backgroundColor: 'rgba(255, 99, 71, 0.1)',
                          borderRadius: '4px'
                        }}>
                          <span style={{
                            color: item.rarity === 'legendary' ? '#ff8c00' :
                                   item.rarity === 'epic' ? '#9400d3' :
                                   item.rarity === 'rare' ? '#4169e1' :
                                   '#228b22'
                          }}>
                            ⚔️ {item.name}
                          </span>
                          <span style={{ marginLeft: '8px', color: '#aaa' }}>
                            (Lvl {item.level}, {item.rarity})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentRoom.type === 'miniboss' && (
              <div>
                <p style={{ color: '#8b0000', fontWeight: 'bold' }}>
                  {t('dungeon.miniBossEncounter')}
                </p>
                {currentRoom.enemies && currentRoom.enemies.length > 0 && (
                  <div style={{ marginLeft: '10px', fontSize: '14px', color: '#cd5c5c' }}>
                    {currentRoom.enemies.map((enemy, idx) => (
                      <div key={idx}>
                        👹 {enemy.name} (Lvl {enemy.level})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Button */}
          {currentRoom.type === 'exit' ? (
            // Exit room: Show both "Proceed to Next Floor" and "Leave Dungeon" buttons
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <button
                onClick={handleRoomAction}
                style={{
                  ...styles.actionButton,
                  backgroundColor: getRoomColor(currentRoom),
                  flex: 1
                }}
              >
                🔼 Proceed to Next Floor
              </button>
              <button
                onClick={() => onDungeonExit()}
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#4aff4a',
                  flex: 1
                }}
              >
                ✅ Leave Dungeon (Keep Loot)
              </button>
            </div>
          ) : getActionButtonText() && (
            <button
              onClick={handleRoomAction}
              disabled={!isActionAvailable()}
              style={{
                ...styles.actionButton,
                backgroundColor: isActionAvailable() ? getRoomColor(currentRoom) : '#555',
                cursor: isActionAvailable() ? 'pointer' : 'not-allowed'
              }}
            >
              {getActionButtonText()}
            </button>
          )}
        </div>

        {/* Message Display */}
        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}
      </div>

      {/* Movement Info */}
      {((currentRoom.type === 'combat' || currentRoom.type === 'boss' || currentRoom.type === 'elite' || currentRoom.type === 'miniboss') && !currentRoom.combatCompleted) && (
        <div style={styles.controls}>
          <p style={{ textAlign: 'center', color: '#ff4444', fontSize: '16px', margin: 0 }}>
            ⚠️ Defeat all enemies to proceed!
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Styles
 */
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: SPACING[5],
    maxWidth: '900px',
    margin: '0 auto',
    color: COLORS.white
  },
  header: {
    ...flexBetween,
    marginBottom: SPACING[5],
    position: 'sticky',
    top: 0,
    backgroundColor: COLORS.bgCardDark,
    zIndex: 1000,
    padding: `${SPACING[2]} 0`,
    borderBottom: `2px solid ${COLORS.primary}`
  },
  title: {
    fontSize: FONT_SIZE['2xl'],
    margin: 0
  },
  exitButton: {
    padding: `${SPACING[2]} ${SPACING[5]}`,
    backgroundColor: COLORS.danger,
    color: COLORS.white,
    border: 'none',
    borderRadius: BORDER_RADIUS.md,
    cursor: 'pointer',
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold
  },
  stats: {
    display: 'flex',
    gap: SPACING[5],
    marginBottom: SPACING[5],
    padding: SPACING[4],
    backgroundColor: COLORS.bgCardDark,
    borderRadius: BORDER_RADIUS.md,
    flexWrap: 'wrap' as const
  },
  statItem: {
    ...flexColumn,
    gap: SPACING[1]
  },
  roomDisplay: {
    marginBottom: SPACING[5]
  },
  roomCard: {
    backgroundColor: COLORS.bgCardDark,
    padding: SPACING[5],
    borderRadius: BORDER_RADIUS.lg,
    border: `3px solid`,
    marginBottom: SPACING[4]
  },
  roomHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[4]
  },
  roomIcon: {
    fontSize: FONT_SIZE['4xl']
  },
  roomTitle: {
    margin: 0,
    fontSize: FONT_SIZE.xl
  },
  roomInfo: {
    marginBottom: SPACING[4],
    lineHeight: '1.6'
  },
  actionButton: {
    width: '100%',
    padding: SPACING[3],
    color: COLORS.white,
    border: 'none',
    borderRadius: BORDER_RADIUS.md,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold
  },
  message: {
    padding: SPACING[4],
    backgroundColor: COLORS.bgCardDark,
    borderRadius: BORDER_RADIUS.md,
    borderLeft: `4px solid ${COLORS.borderPrimary}`
  },
  controls: {
    backgroundColor: COLORS.bgCardDark,
    padding: SPACING[5],
    borderRadius: BORDER_RADIUS.lg
  },
  controlsTitle: {
    margin: `0 0 ${SPACING[4]} 0`,
    textAlign: 'center' as const
  },
  movementGrid: {
    ...flexColumn,
    gap: SPACING[2]
  },
  movementRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: SPACING[2]
  },
  moveButton: {
    padding: `${SPACING[4]} ${SPACING[6]}`,
    backgroundColor: COLORS.borderPrimary,
    color: COLORS.white,
    border: 'none',
    borderRadius: BORDER_RADIUS.md,
    cursor: 'pointer',
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    width: '120px'
  },
  spacer: {
    width: '120px',
    height: '50px'
  },
  currentMarker: {
    ...flexCenter,
    fontSize: FONT_SIZE['2xl']
  }
};
