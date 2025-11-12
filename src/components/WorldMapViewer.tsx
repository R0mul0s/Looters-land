/**
 * WorldMap Viewer Component
 *
 * Displays the worldmap with tiles, objects, and players.
 * Handles rendering, zooming, and basic interactions.
 * Supports real-time multiplayer with other player markers and chat bubbles.
 * Uses Perlin noise for smooth terrain variant distribution (prevents checkerboard patterns).
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-12
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { WorldMap, Tile, StaticObject } from '../types/worldmap.types';
import { TERRAIN_ICONS } from '../types/worldmap.types';
import { OtherPlayerMarker } from './OtherPlayerMarker';
import { ChatBubble } from './ChatBubble';
import type { OtherPlayer } from '../hooks/useOtherPlayers';
import { t } from '../localization/i18n';
import { PerlinNoise } from '../engine/worldmap/PerlinNoise';

// Import terrain images
import forest1Img from '../assets/images/terrian/forest1.png';
import forest2Img from '../assets/images/terrian/forest2.png';
import desert1Img from '../assets/images/terrian/desert1.png';
import desert2Img from '../assets/images/terrian/desert2.png';
import plain1Img from '../assets/images/terrian/plain1.png';
import plain2Img from '../assets/images/terrian/plain2.png';
import swamp1Img from '../assets/images/terrian/swamp1.png';
import swamp2Img from '../assets/images/terrian/swamp2.png';
import water1Img from '../assets/images/terrian/water1.png';
import water2Img from '../assets/images/terrian/water2.png';
import road1Img from '../assets/images/terrian/road1.png';
import road2Img from '../assets/images/terrian/road2.png';

// Import hero images for player avatar
import hero1Img from '../assets/images/hero/hero1.png';
import hero2Img from '../assets/images/hero/hero2.png';
import hero3Img from '../assets/images/hero/hero3.png';
import hero4Img from '../assets/images/hero/hero4.png';
import hero5Img from '../assets/images/hero/hero5.png';

interface WorldMapViewerProps {
  worldMap: WorldMap;
  playerPosition: { x: number; y: number };
  playerAvatar?: string; // Avatar filename (e.g., 'hero1.png', 'hero2.png')
  otherPlayers?: OtherPlayer[]; // Optional list of other players to render
  playerChatMessage?: string; // Current player's chat message
  playerChatTimestamp?: Date; // Timestamp of current player's chat message
  onTileClick?: (x: number, y: number) => void;
  onObjectClick?: (object: StaticObject) => void;
}

/**
 * WorldMap Viewer Component (memoized)
 *
 * @description Displays the worldmap with tiles, objects, and players.
 * Wrapped with React.memo() to prevent unnecessary re-renders when props haven't changed.
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
function WorldMapViewerComponent({
  worldMap,
  playerPosition,
  playerAvatar = 'hero1.png',
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
  const [, setAnimationTrigger] = useState(0); // Dummy state to trigger re-renders for animation
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Terrain images state
  const [terrainImages, setTerrainImages] = useState<{
    forest: { img1: HTMLImageElement | null; img2: HTMLImageElement | null };
    desert: { img1: HTMLImageElement | null; img2: HTMLImageElement | null };
    plains: { img1: HTMLImageElement | null; img2: HTMLImageElement | null };
    swamp: { img1: HTMLImageElement | null; img2: HTMLImageElement | null };
    water: { img1: HTMLImageElement | null; img2: HTMLImageElement | null };
    road: { img1: HTMLImageElement | null; img2: HTMLImageElement | null };
  }>({
    forest: { img1: null, img2: null },
    desert: { img1: null, img2: null },
    plains: { img1: null, img2: null },
    swamp: { img1: null, img2: null },
    water: { img1: null, img2: null },
    road: { img1: null, img2: null }
  });

  // Hero/player avatar image
  const [heroImage, setHeroImage] = useState<HTMLImageElement | null>(null);

  // Perlin noise for smooth variant distribution (prevents checkerboard pattern)
  const variantNoise = useRef<PerlinNoise | null>(null);

  // Animation state for pulsating glow effect
  const animationFrameRef = useRef<number | null>(null);
  const glowStartTimeRef = useRef<number>(Date.now());

  const BASE_TILE_SIZE = 32; // Base tile size without zoom
  const TILE_SIZE = BASE_TILE_SIZE * zoom; // Scaled tile size with zoom
  const VIEWPORT_WIDTH = dimensions.width;
  const VIEWPORT_HEIGHT = dimensions.height;

  // Initialize Perlin noise for variant distribution
  useEffect(() => {
    // Use worldMap seed for consistent variant distribution
    variantNoise.current = new PerlinNoise(worldMap.seed + '-variants');
  }, [worldMap.seed]);

  // Load hero avatar image (dynamically based on playerAvatar prop)
  useEffect(() => {
    const img = new Image();
    // Select correct image based on avatar prop
    switch (playerAvatar) {
      case 'hero2.png':
        img.src = hero2Img;
        break;
      case 'hero3.png':
        img.src = hero3Img;
        break;
      case 'hero4.png':
        img.src = hero4Img;
        break;
      case 'hero5.png':
        img.src = hero5Img;
        break;
      default:
        img.src = hero1Img;
    }

    img.onload = () => {
      setHeroImage(img);
      console.log(`✅ Hero avatar ${playerAvatar} loaded successfully`);
    };
    img.onerror = () => console.error(`Failed to load ${playerAvatar}`);
  }, [playerAvatar]); // Re-load when avatar changes

  // Load all terrain images
  useEffect(() => {
    const images = {
      forest: { img1: new Image(), img2: new Image() },
      desert: { img1: new Image(), img2: new Image() },
      plains: { img1: new Image(), img2: new Image() },
      swamp: { img1: new Image(), img2: new Image() },
      water: { img1: new Image(), img2: new Image() },
      road: { img1: new Image(), img2: new Image() }
    };

    // Set image sources
    images.forest.img1.src = forest1Img;
    images.forest.img2.src = forest2Img;
    images.desert.img1.src = desert1Img;
    images.desert.img2.src = desert2Img;
    images.plains.img1.src = plain1Img;
    images.plains.img2.src = plain2Img;
    images.swamp.img1.src = swamp1Img;
    images.swamp.img2.src = swamp2Img;
    images.water.img1.src = water1Img;
    images.water.img2.src = water2Img;
    images.road.img1.src = road1Img;
    images.road.img2.src = road2Img;

    let loadedCount = 0;
    const totalImages = 12; // 6 terrains × 2 images each

    const onLoad = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        setTerrainImages({
          forest: { img1: images.forest.img1, img2: images.forest.img2 },
          desert: { img1: images.desert.img1, img2: images.desert.img2 },
          plains: { img1: images.plains.img1, img2: images.plains.img2 },
          swamp: { img1: images.swamp.img1, img2: images.swamp.img2 },
          water: { img1: images.water.img1, img2: images.water.img2 },
          road: { img1: images.road.img1, img2: images.road.img2 }
        });
        console.log('✅ All terrain images loaded successfully');
      }
    };

    // Attach load handlers
    Object.values(images).forEach(({ img1, img2 }) => {
      img1.onload = onLoad;
      img2.onload = onLoad;
    });

    // Error handling
    images.forest.img1.onerror = () => console.error('Failed to load forest1.png');
    images.forest.img2.onerror = () => console.error('Failed to load forest2.png');
    images.desert.img1.onerror = () => console.error('Failed to load desert1.png');
    images.desert.img2.onerror = () => console.error('Failed to load desert2.png');
    images.plains.img1.onerror = () => console.error('Failed to load plain1.png');
    images.plains.img2.onerror = () => console.error('Failed to load plain2.png');
    images.swamp.img1.onerror = () => console.error('Failed to load swamp1.png');
    images.swamp.img2.onerror = () => console.error('Failed to load swamp2.png');
    images.water.img1.onerror = () => console.error('Failed to load water1.png');
    images.water.img2.onerror = () => console.error('Failed to load water2.png');
    images.road.img1.onerror = () => console.error('Failed to load road1.png');
    images.road.img2.onerror = () => console.error('Failed to load road2.png');
  }, []);

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
   * Center viewport on player (accounts for current zoom level)
   * Recalculates when player moves, viewport size changes, or zoom changes
   */
  useEffect(() => {
    // Calculate exact offset to center player tile in viewport
    // This ensures player tile aligns with player sprite
    const tilesX = VIEWPORT_WIDTH / TILE_SIZE / 2;
    const tilesY = VIEWPORT_HEIGHT / TILE_SIZE / 2;

    setViewport({
      x: playerPosition.x - tilesX,
      y: playerPosition.y - tilesY
    });
  }, [playerPosition.x, playerPosition.y, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, TILE_SIZE, zoom]);

  /**
   * Render worldmap on canvas
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-DPI canvas support for crisp rendering on mobile
    const dpr = window.devicePixelRatio || 1;
    canvas.width = VIEWPORT_WIDTH * dpr;
    canvas.height = VIEWPORT_HEIGHT * dpr;
    canvas.style.width = `${VIEWPORT_WIDTH}px`;
    canvas.style.height = `${VIEWPORT_HEIGHT}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

    // Calculate visible tiles (accounts for current zoom level)
    // Use floor/ceil to ensure we render all partially visible tiles
    const startX = Math.max(0, Math.floor(viewport.x));
    const startY = Math.max(0, Math.floor(viewport.y));
    const endX = Math.min(worldMap.width, Math.ceil(viewport.x + VIEWPORT_WIDTH / TILE_SIZE) + 1);
    const endY = Math.min(worldMap.height, Math.ceil(viewport.y + VIEWPORT_HEIGHT / TILE_SIZE) + 1);

    // Collect static objects to render later (after player)
    const staticObjectsToRender: Array<{ icon: string; screenX: number; screenY: number }> = [];

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

        // Draw terrain icon/image (if tile is large enough)
        if (TILE_SIZE >= 24) {
          const variant = getTerrainVariant(x, y);
          let terrainImg: HTMLImageElement | null = null;

          // Select appropriate terrain image based on terrain type
          switch (tile.terrain) {
            case 'forest':
              if (terrainImages.forest.img1 && terrainImages.forest.img2) {
                terrainImg = variant === 1 ? terrainImages.forest.img1 : terrainImages.forest.img2;
              }
              break;
            case 'desert':
              if (terrainImages.desert.img1 && terrainImages.desert.img2) {
                terrainImg = variant === 1 ? terrainImages.desert.img1 : terrainImages.desert.img2;
              }
              break;
            case 'plains':
              if (terrainImages.plains.img1 && terrainImages.plains.img2) {
                terrainImg = variant === 1 ? terrainImages.plains.img1 : terrainImages.plains.img2;
              }
              break;
            case 'swamp':
              if (terrainImages.swamp.img1 && terrainImages.swamp.img2) {
                terrainImg = variant === 1 ? terrainImages.swamp.img1 : terrainImages.swamp.img2;
              }
              break;
            case 'water':
              if (terrainImages.water.img1 && terrainImages.water.img2) {
                terrainImg = variant === 1 ? terrainImages.water.img1 : terrainImages.water.img2;
              }
              break;
            case 'road':
              if (terrainImages.road.img1 && terrainImages.road.img2) {
                terrainImg = variant === 1 ? terrainImages.road.img1 : terrainImages.road.img2;
              }
              break;
            // Mountains still use emoji (no images yet)
            default:
              break;
          }

          // Draw image if available, otherwise use emoji icon
          if (terrainImg) {
            ctx.drawImage(terrainImg, screenX, screenY, TILE_SIZE, TILE_SIZE);
          } else {
            // Fallback to emoji icons for terrains without images
            ctx.font = `${Math.floor(TILE_SIZE * 0.6)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
              TERRAIN_ICONS[tile.terrain],
              screenX + TILE_SIZE / 2,
              screenY + TILE_SIZE / 2
            );
          }
        }

        // Collect static objects to render later (after player for proper z-index)
        if (tile.staticObject && tile.isExplored) {
          let icon = '';
          switch (tile.staticObject.type) {
            case 'town':
              icon = '🏰';
              break;
            case 'dungeon':
              icon = '🕳️';
              break;
            case 'portal':
              icon = '🌀';
              break;
            case 'hiddenPath':
              icon = '🗝️';
              break;
            case 'treasureChest':
              icon = '📦';
              break;
            case 'rareSpawn':
              icon = '👹';
              break;
          }
          if (icon) {
            staticObjectsToRender.push({ icon, screenX, screenY });
          }
        }

        // Draw fog of war (if not explored)
        if (!tile.isExplored && !(x === playerPosition.x && y === playerPosition.y)) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // Draw dynamic objects (wandering monsters, traveling merchants)
    worldMap.dynamicObjects.forEach(obj => {
      if (!obj.isActive) return;

      const screenX = (obj.position.x - viewport.x) * TILE_SIZE;
      const screenY = (obj.position.y - viewport.y) * TILE_SIZE;

      // Only render if in viewport
      if (
        screenX >= -TILE_SIZE &&
        screenX <= VIEWPORT_WIDTH &&
        screenY >= -TILE_SIZE &&
        screenY <= VIEWPORT_HEIGHT
      ) {
        let icon = '';
        switch (obj.type) {
          case 'wanderingMonster':
            icon = '🐺';
            break;
          case 'travelingMerchant':
            icon = '🛒';
            break;
          case 'event':
            icon = '⭐';
            break;
        }

        if (icon) {
          ctx.font = `${Math.floor(TILE_SIZE * 0.7)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
        }
      }
    });

    // Draw player - calculate exact position based on tile grid
    // Player tile position relative to viewport
    const playerTileOffsetX = playerPosition.x - viewport.x;
    const playerTileOffsetY = playerPosition.y - viewport.y;

    // Screen position (center of player's tile)
    const playerScreenX = playerTileOffsetX * TILE_SIZE;
    const playerScreenY = playerTileOffsetY * TILE_SIZE;

    // Calculate pulsating glow effect
    const elapsedTime = Date.now() - glowStartTimeRef.current;
    const pulseSpeed = 0.003; // Speed of pulsation (lower = slower)
    const minBlur = 20; // Minimum glow intensity
    const maxBlur = 35; // Maximum glow intensity
    const glowBlur = minBlur + (maxBlur - minBlur) * (0.5 + 0.5 * Math.sin(elapsedTime * pulseSpeed));

    // Player glow effect with pulsation
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = glowBlur;

    // Draw player avatar - use image if loaded, otherwise fallback to emoji
    if (heroImage) {
      // Make hero slightly larger (1.2x tile size) and center it on the tile
      const heroSize = TILE_SIZE * 1.2;
      const heroOffsetX = playerScreenX - (heroSize - TILE_SIZE) / 2;
      const heroOffsetY = playerScreenY - (heroSize - TILE_SIZE) / 2;

      // Draw hero image centered on tile with increased size
      ctx.drawImage(heroImage, heroOffsetX, heroOffsetY, heroSize, heroSize);
    } else {
      // Fallback to emoji if image not loaded yet
      ctx.font = `${Math.floor(TILE_SIZE * 0.9)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🧙', playerScreenX + TILE_SIZE / 2, playerScreenY + TILE_SIZE / 2);
    }

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw static objects (towns, dungeons, rare spawns, etc.) - on top of player
    ctx.font = `${Math.floor(TILE_SIZE * 0.8)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    staticObjectsToRender.forEach(({ icon, screenX, screenY }) => {
      ctx.fillText(icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
    });

  }, [worldMap, playerPosition, viewport, zoom, TILE_SIZE, terrainImages, heroImage]);

  /**
   * Animation loop for pulsating glow effect
   * Uses requestAnimationFrame to continuously update the canvas
   */
  useEffect(() => {
    const animate = () => {
      // Trigger re-render by updating animation trigger state
      setAnimationTrigger(prev => prev + 1);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  /**
   * Get terrain variant for a specific tile using Perlin noise
   * This creates smooth, organic-looking areas instead of checkerboard patterns
   *
   * @param x - Tile X coordinate
   * @param y - Tile Y coordinate
   * @returns 1 or 2 (for variant selection)
   */
  const getTerrainVariant = (x: number, y: number): number => {
    if (!variantNoise.current) return 1;

    // Use Perlin noise with low frequency for large, smooth areas
    // Scale of 0.15 creates nice organic patches (lower = larger patches)
    const noiseValue = variantNoise.current.get(x * 0.15, y * 0.15);

    // Convert noise value (-1 to 1) to variant (1 or 2)
    return noiseValue > 0 ? 1 : 2;
  };

  /**
   * Get terrain color for rendering
   *
   * @description Returns a hex color code based on tile terrain type for fallback rendering
   * @param tile - Tile object containing terrain information
   * @returns Hex color code string
   *
   * @example
   * ```typescript
   * getTerrainColor({ terrain: 'forest', ... }); // Returns '#228B22'
   * ```
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
   *
   * @description Processes mouse click events on canvas, calculates clicked tile position,
   * and triggers appropriate callbacks for tile or object clicks
   * @param e - React mouse event from canvas
   *
   * @example
   * ```tsx
   * <canvas onClick={handleCanvasClick} />
   * ```
   */
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Calculate tile position (TILE_SIZE already includes zoom)
    const tileX = Math.floor(clickX / TILE_SIZE + viewport.x);
    const tileY = Math.floor(clickY / TILE_SIZE + viewport.y);

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
   *
   * @description Tracks mouse position over canvas and updates hovered tile state
   * for displaying tile information tooltip
   * @param e - React mouse event from canvas
   *
   * @example
   * ```tsx
   * <canvas onMouseMove={handleCanvasMouseMove} />
   * ```
   */
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const tileX = Math.floor(mouseX / TILE_SIZE + viewport.x);
    const tileY = Math.floor(mouseY / TILE_SIZE + viewport.y);

    if (tileX >= 0 && tileX < worldMap.width && tileY >= 0 && tileY < worldMap.height) {
      setHoveredTile({ x: tileX, y: tileY });
    } else {
      setHoveredTile(null);
    }
  };

  /**
   * Handle zoom
   *
   * @description Adjusts zoom level within bounds (0.5x to 2x)
   * @param delta - Zoom delta value (positive = zoom in, negative = zoom out)
   *
   * @example
   * ```typescript
   * handleZoom(0.1); // Zoom in by 10%
   * handleZoom(-0.1); // Zoom out by 10%
   * ```
   */
  const handleZoom = (delta: number): void => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  /**
   * Handle mouse wheel zoom
   *
   * @description Processes mouse wheel events to zoom in/out on the map
   * @param e - React wheel event from canvas
   *
   * @example
   * ```tsx
   * <canvas onWheel={handleWheel} />
   * ```
   */
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>): void => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta);
  };

  /**
   * Calculate distance and cost for hovered tile (memoized)
   *
   * @description Computes travel distance and energy cost from player position to hovered tile.
   * Memoized to prevent unnecessary recalculations on unrelated state changes.
   * @returns Object with tile info, distance, cost, and explored status, or null if no hover
   *
   * @example
   * ```typescript
   * if (hoverInfo) {
   *   console.log(`Distance: ${hoverInfo.distance}, Cost: ${hoverInfo.totalCost}`);
   * }
   * ```
   */
  const hoverInfo = useMemo((): { tile: Tile; distance: number; totalCost: number; isExplored: boolean } | null => {
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
  }, [hoveredTile, worldMap.tiles, playerPosition.x, playerPosition.y]);

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
          {hoverInfo.tile.staticObject && (
            <div style={styles.tooltipRow}>
              <span>
                {hoverInfo.tile.staticObject.type === 'town' && '🏰'}
                {hoverInfo.tile.staticObject.type === 'dungeon' && '🕳️'}
                {hoverInfo.tile.staticObject.type === 'portal' && '🌀'}
                {hoverInfo.tile.staticObject.type === 'hiddenPath' && '🗝️'}
                {hoverInfo.tile.staticObject.type === 'treasureChest' && '📦'}
                {hoverInfo.tile.staticObject.type === 'rareSpawn' && '👹'}
              </span>
              <span style={{ ...styles.tooltipValue, color: '#22d3ee', fontWeight: 'bold' }}>
                {hoverInfo.tile.staticObject.name}
              </span>
            </div>
          )}
          <div style={styles.tooltipRow}>
            <span>{t('worldmap.terrain')}:</span>
            <span style={styles.tooltipValue}>{hoverInfo.tile.terrain}</span>
          </div>
          <div style={styles.tooltipRow}>
            <span>{t('worldmap.distance')}:</span>
            <span style={styles.tooltipValue}>{hoverInfo.distance} {t('worldmap.tiles')}</span>
          </div>
          <div style={styles.tooltipRow}>
            <span>{t('worldmap.cost')}:</span>
            <span style={{ ...styles.tooltipValue, color: '#fbbf24' }}>{hoverInfo.totalCost} {t('worldmap.energy')}</span>
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
        onWheel={handleWheel}
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
        // Calculate screen position from map coordinates (center of tile)
        const screenX = (player.x - viewport.x) * TILE_SIZE + TILE_SIZE / 2;
        const screenY = (player.y - viewport.y) * TILE_SIZE + TILE_SIZE / 2;

        // Only render if player is in viewport
        const isVisible =
          screenX >= -TILE_SIZE && screenX <= VIEWPORT_WIDTH + TILE_SIZE &&
          screenY >= -TILE_SIZE && screenY <= VIEWPORT_HEIGHT + TILE_SIZE;

        if (!isVisible) return null;

        return (
          <div
            key={player.id}
            style={{
              position: 'absolute',
              left: `${screenX}px`,
              top: `${screenY}px`,
              zIndex: 50 + player.y // Players lower on map (higher Y) have higher z-index
            }}
          >
            {/* Chat Bubble (if message exists and recent) */}
            {player.chatMessage && player.chatTimestamp && (
              <ChatBubble
                message={player.chatMessage}
                timestamp={player.chatTimestamp}
                offsetY={-80 * zoom}
              />
            )}

            {/* Player Marker */}
            <OtherPlayerMarker
              nickname={player.nickname}
              level={player.level}
              avatar={player.avatar || 'hero1.png'}
              color="#3b82f6"
              scale={zoom}
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Memoized WorldMapViewer component
 * Prevents re-renders when props haven't changed, improving performance
 */
export const WorldMapViewer = React.memo(WorldMapViewerComponent);

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
