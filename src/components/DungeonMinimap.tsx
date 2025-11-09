/**
 * Dungeon Minimap Component - Visual dungeon map
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-07
 */

import React from 'react';
import type { Floor, Room } from '../types/dungeon.types';

interface DungeonMinimapProps {
  floor: Floor;
  currentRoomId: string;
  onRoomClick?: (roomId: string) => void;
  isMovementBlocked?: boolean;
}

/**
 * Dungeon Minimap Component
 */
export const DungeonMinimap: React.FC<DungeonMinimapProps> = ({
  floor,
  currentRoomId,
  onRoomClick,
  isMovementBlocked = false
}) => {
  // Calculate grid bounds
  const minX = Math.min(...floor.rooms.map(r => r.position.x));
  const maxX = Math.max(...floor.rooms.map(r => r.position.x));
  const minY = Math.min(...floor.rooms.map(r => r.position.y));
  const maxY = Math.max(...floor.rooms.map(r => r.position.y));

  const gridWidth = maxX - minX + 1;
  const gridHeight = maxY - minY + 1;

  // Create 2D grid
  const grid: (Room | null)[][] = Array(gridHeight)
    .fill(null)
    .map(() => Array(gridWidth).fill(null));

  // Place rooms in grid
  floor.rooms.forEach(room => {
    const x = room.position.x - minX;
    const y = room.position.y - minY;
    grid[y][x] = room;
  });

  /**
   * Get room color based on type and status
   */
  const getRoomColor = (room: Room): string => {
    if (room.id === currentRoomId) {
      return '#4a9eff'; // Current room - blue
    }

    if (room.status === 'completed') {
      return '#555'; // Completed - dark gray
    }

    switch (room.type) {
      case 'start':
        return '#4aff4a'; // Green
      case 'exit':
        return '#4aff4a'; // Green
      case 'combat':
        return '#ff4a4a'; // Red
      case 'boss':
        return '#9400d3'; // Purple
      case 'treasure':
        return '#ffd700'; // Gold
      case 'trap':
        return '#ff8c00'; // Orange
      case 'rest':
        return '#4aff4a'; // Green
      case 'shrine':
        return '#87ceeb'; // Sky blue
      case 'mystery':
        return '#ff69b4'; // Hot pink
      case 'elite':
        return '#ff6347'; // Tomato red
      case 'miniboss':
        return '#8b0000'; // Dark red
      default:
        return '#888';
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
   * Get current room
   */
  const getCurrentRoom = () => {
    return floor.rooms.find(r => r.id === currentRoomId);
  };

  /**
   * Check if room is adjacent to current room
   */
  /* const isAdjacent = (room: Room): boolean => {
    const current = getCurrentRoom();
    if (!current) return false;

    const dx = Math.abs(room.position.x - current.position.x);
    const dy = Math.abs(room.position.y - current.position.y);

    // Adjacent if exactly 1 tile away in one direction
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }; */

  /**
   * Check if room is accessible (connected) from current room
   */
  const isAccessible = (room: Room): boolean => {
    const current = getCurrentRoom();
    if (!current) return false;

    // Check if there's a connection between rooms
    const dx = room.position.x - current.position.x;
    const dy = room.position.y - current.position.y;

    if (dx === 1 && dy === 0) return current.connections.includes('east');
    if (dx === -1 && dy === 0) return current.connections.includes('west');
    if (dy === 1 && dx === 0) return current.connections.includes('south');
    if (dy === -1 && dx === 0) return current.connections.includes('north');

    return false;
  };

  /**
   * Handle room click
   */
  const handleRoomClick = (room: Room) => {
    if (!onRoomClick) return;
    if (room.id === currentRoomId) return; // Already in this room

    // Only allow clicking on accessible adjacent rooms
    if (isAccessible(room)) {
      onRoomClick(room.id);
    }
  };

  /**
   * Render wall connections
   */
  const renderWalls = (room: Room, _x: number, _y: number) => {
    const walls: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none'
    };

    return (
      <div style={walls}>
        {/* Top wall */}
        {!room.connections.includes('north') && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            backgroundColor: '#333'
          }} />
        )}

        {/* Right wall */}
        {!room.connections.includes('east') && (
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '3px',
            backgroundColor: '#333'
          }} />
        )}

        {/* Bottom wall */}
        {!room.connections.includes('south') && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            backgroundColor: '#333'
          }} />
        )}

        {/* Left wall */}
        {!room.connections.includes('west') && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '3px',
            backgroundColor: '#333'
          }} />
        )}

        {/* Doorway indicators */}
        {room.connections.includes('north') && (
          <div style={{
            position: 'absolute',
            top: '-2px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '12px',
            height: '4px',
            backgroundColor: '#4a9eff',
            borderRadius: '2px'
          }} />
        )}

        {room.connections.includes('east') && (
          <div style={{
            position: 'absolute',
            right: '-2px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '4px',
            height: '12px',
            backgroundColor: '#4a9eff',
            borderRadius: '2px'
          }} />
        )}

        {room.connections.includes('south') && (
          <div style={{
            position: 'absolute',
            bottom: '-2px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '12px',
            height: '4px',
            backgroundColor: '#4a9eff',
            borderRadius: '2px'
          }} />
        )}

        {room.connections.includes('west') && (
          <div style={{
            position: 'absolute',
            left: '-2px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '4px',
            height: '12px',
            backgroundColor: '#4a9eff',
            borderRadius: '2px'
          }} />
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>Floor {floor.floorNumber} Map</h4>

      <div style={styles.mapContainer}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridWidth}, 48px)`,
            gridTemplateRows: `repeat(${gridHeight}, 48px)`,
            gap: '4px',
            padding: '10px',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            border: '2px solid #333'
          }}
        >
          {grid.map((row, y) =>
            row.map((room, x) => {
              const canClick = room && isAccessible(room) && room.id !== currentRoomId && !isMovementBlocked;
              return (
                <div
                  key={`${x}-${y}`}
                  onClick={() => room && handleRoomClick(room)}
                  style={{
                    position: 'relative',
                    width: '48px',
                    height: '48px',
                    backgroundColor: room ? getRoomColor(room) : '#0a0a0a',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    border: room?.id === currentRoomId ? '3px solid #fff' : '1px solid #333',
                    boxShadow: room?.id === currentRoomId ? '0 0 15px rgba(74, 158, 255, 0.8)' : 'none',
                    transition: 'all 0.3s ease',
                    cursor: canClick ? 'pointer' : 'default',
                    opacity: canClick ? 1 : (room ? 0.7 : 0.3),
                    transform: canClick ? 'scale(1)' : 'scale(1)',
                  }}
                  onMouseEnter={(e) => {
                    if (canClick) {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(74, 158, 255, 0.6)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canClick) {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                {room && (
                  <>
                    {renderWalls(room, x, y)}
                    <span style={{ position: 'relative', zIndex: 1 }}>
                      {getRoomIcon(room)}
                    </span>
                  </>
                )}
              </div>
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendBox, backgroundColor: '#4a9eff' }}></div>
          <span>Current</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendBox, backgroundColor: '#ff4a4a' }}></div>
          <span>Combat</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendBox, backgroundColor: '#ffd700' }}></div>
          <span>Treasure</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendBox, backgroundColor: '#9400d3' }}></div>
          <span>Boss</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendBox, backgroundColor: '#555' }}></div>
          <span>Cleared</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Styles
 */
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#2a2a2a',
    borderRadius: '12px',
    border: '2px solid #444'
  },
  title: {
    margin: '0 0 15px 0',
    textAlign: 'center' as const,
    color: '#fff',
    fontSize: '16px'
  },
  mapContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '15px',
    overflowX: 'auto' as const,
    overflowY: 'auto' as const,
    maxHeight: '400px'
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    flexWrap: 'wrap' as const,
    fontSize: '12px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  legendBox: {
    width: '16px',
    height: '16px',
    borderRadius: '3px',
    border: '1px solid #333'
  }
};
