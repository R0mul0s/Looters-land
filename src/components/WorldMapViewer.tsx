/**
 * WorldMap Viewer Component
 *
 * Displays the worldmap with tiles, objects, and players.
 * Handles rendering, zooming, and basic interactions.
 * Supports real-time multiplayer with other player markers and chat bubbles.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-09
 */

import React, { useState, useRef, useEffect } from 'react';
import type { WorldMap, Tile, StaticObject } from '../types/worldmap.types';
import { TERRAIN_ICONS } from '../types/worldmap.types';
import { OtherPlayerMarker } from './OtherPlayerMarker';
import { ChatBubble } from './ChatBubble';
import type { OtherPlayer } from '../hooks/useOtherPlayers';

interface WorldMapViewerProps {
  worldMap: WorldMap;
  playerPosition: { x: number; y: number };
  otherPlayers?: OtherPlayer[]; // Optional list of other players to render
  playerChatMessage?: string; // Current player's chat message
  playerChatTimestamp?: Date; // Timestamp of current player's chat message
  onTileClick?: (x: number, y: number) => void;
  onObjectClick?: (object: StaticObject) => void;
}

/**
 * WorldMap Viewer Component
 *
 * @param props - Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * <WorldMapViewer
 *   worldMap={generatedMap}
 *   playerPosition={{ x: 25, y: 25 }}
 *   onTileClick={(x, y) => console.log('Clicked', x, y)}
 * />
 * ```
 */
export function WorldMapViewer({
  worldMap,
  playerPosition,
  otherPlayers = [],
  playerChatMessage,
  playerChatTimestamp,
  onTileClick,
  onObjectClick
}: WorldMapViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [viewport, setViewport] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const TILE_SIZE = 32 * zoom;
  const VIEWPORT_WIDTH = dimensions.width;
  const VIEWPORT_HEIGHT = dimensions.height;

  // Update canvas dimensions based on container size
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  /**
   * Center viewport on player
   */
  useEffect(() => {
    setViewport({
      x: playerPosition.x - Math.floor(VIEWPORT_WIDTH / TILE_SIZE / 2),
      y: playerPosition.y - Math.floor(VIEWPORT_HEIGHT / TILE_SIZE / 2)
    });
  }, [playerPosition, TILE_SIZE, VIEWPORT_WIDTH, VIEWPORT_HEIGHT]);

  /**
   * Render worldmap on canvas
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

    // Calculate visible tiles
    const startX = Math.max(0, viewport.x);
    const startY = Math.max(0, viewport.y);
    const endX = Math.min(worldMap.width, viewport.x + Math.ceil(VIEWPORT_WIDTH / TILE_SIZE) + 1);
    const endY = Math.min(worldMap.height, viewport.y + Math.ceil(VIEWPORT_HEIGHT / TILE_SIZE) + 1);

    // Render tiles
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = worldMap.tiles[y]?.[x];
        if (!tile) continue;

        const screenX = (x - viewport.x) * TILE_SIZE;
        const screenY = (y - viewport.y) * TILE_SIZE;

        // Draw terrain
        ctx.fillStyle = getTerrainColor(tile);
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Draw grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Draw terrain icon (if tile is large enough)
        if (TILE_SIZE >= 24) {
          ctx.font = `${Math.floor(TILE_SIZE * 0.6)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            TERRAIN_ICONS[tile.terrain],
            screenX + TILE_SIZE / 2,
            screenY + TILE_SIZE / 2
          );
        }

        // Draw static object (town, dungeon) - only if explored
        if (tile.staticObject && tile.isExplored) {
          const icon = tile.staticObject.type === 'town' ? '🏰' : '🕳️';
          ctx.font = `${Math.floor(TILE_SIZE * 0.8)}px sans-serif`;
          ctx.fillText(icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
        }

        // Draw fog of war (if not explored)
        if (!tile.isExplored && !(x === playerPosition.x && y === playerPosition.y)) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // Draw player
    const playerScreenX = (playerPosition.x - viewport.x) * TILE_SIZE;
    const playerScreenY = (playerPosition.y - viewport.y) * TILE_SIZE;

    // Player glow
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 15;
    ctx.font = `${Math.floor(TILE_SIZE * 0.9)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧙', playerScreenX + TILE_SIZE / 2, playerScreenY + TILE_SIZE / 2);
    ctx.shadowBlur = 0;

  }, [worldMap, playerPosition, viewport, zoom, TILE_SIZE]);

  /**
   * Get terrain color for rendering
   */
  const getTerrainColor = (tile: Tile): string => {
    switch (tile.terrain) {
      case 'plains': return '#90EE90';
      case 'forest': return '#228B22';
      case 'mountains': return '#8B7355';
      case 'water': return '#1E90FF';
      case 'road': return '#D2B48C';
      case 'desert': return '#EDC9AF';
      case 'swamp': return '#556B2F';
      default: return '#808080';
    }
  };

  /**
   * Handle canvas click
   */
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const tileX = Math.floor(clickX / TILE_SIZE) + viewport.x;
    const tileY = Math.floor(clickY / TILE_SIZE) + viewport.y;

    if (tileX >= 0 && tileX < worldMap.width && tileY >= 0 && tileY < worldMap.height) {
      const tile = worldMap.tiles[tileY][tileX];

      if (tile.staticObject && onObjectClick) {
        onObjectClick(tile.staticObject);
      } else if (onTileClick) {
        onTileClick(tileX, tileY);
      }
    }
  };

  /**
   * Handle mouse move for hover effects
   */
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const tileX = Math.floor(mouseX / TILE_SIZE) + viewport.x;
    const tileY = Math.floor(mouseY / TILE_SIZE) + viewport.y;

    if (tileX >= 0 && tileX < worldMap.width && tileY >= 0 && tileY < worldMap.height) {
      setHoveredTile({ x: tileX, y: tileY });
    } else {
      setHoveredTile(null);
    }
  };

  /**
   * Handle zoom
   */
  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  // Calculate distance and cost for hovered tile
  const getHoverInfo = () => {
    if (!hoveredTile) return null;
    const tile = worldMap.tiles[hoveredTile.y]?.[hoveredTile.x];
    if (!tile) return null;

    const distance = Math.abs(hoveredTile.x - playerPosition.x) + Math.abs(hoveredTile.y - playerPosition.y);
    const costPerTile = Math.ceil(tile.movementCost / 100);
    const totalCost = distance * costPerTile;

    return {
      tile,
      distance,
      totalCost,
      isExplored: tile.isExplored
    };
  };

  const hoverInfo = getHoverInfo();

  return (
    <div ref={containerRef} style={styles.container}>
      {/* Zoom Controls Overlay */}
      <div style={styles.controls}>
        <button onClick={() => handleZoom(0.1)} style={styles.button}>+</button>
        <button onClick={() => handleZoom(-0.1)} style={styles.button}>-</button>
        <span style={styles.info}>{Math.round(zoom * 100)}%</span>
      </div>

      {/* Hover Info Tooltip */}
      {hoverInfo && hoverInfo.isExplored && (
        <div style={styles.tooltip}>
          <div style={styles.tooltipRow}>
            <span>Terrain:</span>
            <span style={styles.tooltipValue}>{hoverInfo.tile.terrain}</span>
          </div>
          <div style={styles.tooltipRow}>
            <span>Distance:</span>
            <span style={styles.tooltipValue}>{hoverInfo.distance} tiles</span>
          </div>
          <div style={styles.tooltipRow}>
            <span>Cost:</span>
            <span style={{ ...styles.tooltipValue, color: '#fbbf24' }}>{hoverInfo.totalCost} energy</span>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={VIEWPORT_WIDTH}
        height={VIEWPORT_HEIGHT}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={() => setHoveredTile(null)}
        style={styles.canvas}
      />

      {/* Render Current Player Chat Bubble */}
      {playerChatMessage && playerChatTimestamp && (
        <div
          style={{
            position: 'absolute',
            left: `${VIEWPORT_WIDTH / 2}px`,
            top: `${VIEWPORT_HEIGHT / 2}px`,
            zIndex: 100
          }}
        >
          <ChatBubble
            message={playerChatMessage}
            timestamp={playerChatTimestamp}
            offsetY={-80}
          />
        </div>
      )}

      {/* Render Other Players */}
      {otherPlayers.map((player) => {
        // Calculate screen position from map coordinates
        const screenX = (player.x - viewport.x) * TILE_SIZE + TILE_SIZE / 2;
        const screenY = (player.y - viewport.y) * TILE_SIZE + TILE_SIZE;

        // Only render if player is in viewport
        const isVisible =
          screenX >= 0 && screenX <= VIEWPORT_WIDTH &&
          screenY >= 0 && screenY <= VIEWPORT_HEIGHT;

        if (!isVisible) return null;

        return (
          <div
            key={player.id}
            style={{
              position: 'absolute',
              left: `${screenX}px`,
              top: `${screenY}px`,
              zIndex: 50
            }}
          >
            {/* Chat Bubble (if message exists and recent) */}
            {player.chatMessage && player.chatTimestamp && (
              <ChatBubble
                message={player.chatMessage}
                timestamp={player.chatTimestamp}
                offsetY={-80}
              />
            )}

            {/* Player Marker */}
            <OtherPlayerMarker
              nickname={player.nickname}
              level={player.level}
              color="#3b82f6"
            />
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: '#0a0a0a',
    color: '#fff'
  },
  controls: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #333',
    zIndex: 10,
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
  },
  button: {
    padding: '6px 12px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    minWidth: '32px'
  },
  info: {
    fontSize: '13px',
    color: '#FFD700',
    fontWeight: 'bold'
  },
  tooltip: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '2px solid #2dd4bf',
    zIndex: 10,
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
    minWidth: '180px'
  },
  tooltipRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    fontSize: '13px',
    color: '#94a3b8',
    gap: '12px'
  },
  tooltipValue: {
    fontWeight: '700',
    color: '#f1f5f9',
    textTransform: 'capitalize'
  },
  canvas: {
    cursor: 'crosshair',
    display: 'block',
    width: '100%',
    height: '100%'
  }
};
