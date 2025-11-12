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
import type { WorldMap, Tile, StaticObject, WeatherState, TimeState } from '../types/worldmap.types';
import { TERRAIN_ICONS } from '../types/worldmap.types';
import { OtherPlayerMarker } from './OtherPlayerMarker';
import { ChatBubble } from './ChatBubble';
import type { OtherPlayer } from '../hooks/useOtherPlayers';
import { t } from '../localization/i18n';
import { PerlinNoise } from '../engine/worldmap/PerlinNoise';
import { TimeOfDaySystem } from '../engine/worldmap/TimeOfDaySystem';

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

// Import building images for dungeons and cities
import dungeon1Img from '../assets/images/building/dungeon1.png';
import dungeon2Img from '../assets/images/building/dungeon2.png';
import dungeon3Img from '../assets/images/building/dungeon3.png';
import city1Img from '../assets/images/building/city1.png';
import city2Img from '../assets/images/building/city2.png';
import city3Img from '../assets/images/building/city3.png';
import city4Img from '../assets/images/building/city4.png';
import city5Img from '../assets/images/building/city5.png';

// Import monster images
import ancientGolemImg from '../assets/images/monster/ancient-golem.png';
import direWolfImg from '../assets/images/monster/dire-wolf.png';
import trollImg from '../assets/images/monster/troll.png';
import ogreImg from '../assets/images/monster/ogre.png';
import harpyImg from '../assets/images/monster/Harpy.png';
import frostGiantImg from '../assets/images/monster/frost-giant.png';
import manticoreImg from '../assets/images/monster/manticore.png';
import wyvernImg from '../assets/images/monster/wyvern.png';
import banditLeaderImg from '../assets/images/monster/bandit-leader.png';
import darkKnightImg from '../assets/images/monster/dark-knight.png';

interface WorldMapViewerProps {
  worldMap: WorldMap;
  playerPosition: { x: number; y: number };
  playerAvatar?: string; // Avatar filename (e.g., 'hero1.png', 'hero2.png')
  otherPlayers?: OtherPlayer[]; // Optional list of other players to render
  playerChatMessage?: string; // Current player's chat message
  playerChatTimestamp?: Date; // Timestamp of current player's chat message
  weather?: WeatherState; // Current weather state
  timeOfDay?: TimeState; // Current time of day state
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
  weather,
  timeOfDay,
  onTileClick,
  onObjectClick
}: WorldMapViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [viewport, setViewport] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [animationTrigger, setAnimationTrigger] = useState(0); // Dummy state to trigger re-renders for animation
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

  // Dungeon building images
  const [dungeonImages, setDungeonImages] = useState<{
    dungeon1: HTMLImageElement | null;
    dungeon2: HTMLImageElement | null;
    dungeon3: HTMLImageElement | null;
  }>({
    dungeon1: null,
    dungeon2: null,
    dungeon3: null
  });

  // City building images
  const [cityImages, setCityImages] = useState<{
    city1: HTMLImageElement | null;
    city2: HTMLImageElement | null;
    city3: HTMLImageElement | null;
    city4: HTMLImageElement | null;
    city5: HTMLImageElement | null;
  }>({
    city1: null,
    city2: null,
    city3: null,
    city4: null,
    city5: null
  });

  // Monster images
  const [monsterImages, setMonsterImages] = useState<{
    ancientGolem: HTMLImageElement | null;
    direWolf: HTMLImageElement | null;
    troll: HTMLImageElement | null;
    ogre: HTMLImageElement | null;
    harpy: HTMLImageElement | null;
    frostGiant: HTMLImageElement | null;
    manticore: HTMLImageElement | null;
    wyvern: HTMLImageElement | null;
    banditLeader: HTMLImageElement | null;
    darkKnight: HTMLImageElement | null;
  }>({
    ancientGolem: null,
    direWolf: null,
    troll: null,
    ogre: null,
    harpy: null,
    frostGiant: null,
    manticore: null,
    wyvern: null,
    banditLeader: null,
    darkKnight: null
  });

  // Perlin noise for smooth variant distribution (prevents checkerboard pattern)
  const variantNoise = useRef<PerlinNoise | null>(null);

  // Animation state for pulsating glow effect
  const animationFrameRef = useRef<number | null>(null);
  const glowStartTimeRef = useRef<number>(Date.now());

  // Weather particles state (rain drops, snowflakes)
  const weatherParticlesRef = useRef<Array<{ x: number; y: number; speed: number; opacity: number }>>([]);

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

  // Load dungeon building images
  useEffect(() => {
    const images = {
      dungeon1: new Image(),
      dungeon2: new Image(),
      dungeon3: new Image()
    };

    images.dungeon1.src = dungeon1Img;
    images.dungeon2.src = dungeon2Img;
    images.dungeon3.src = dungeon3Img;

    let loadedCount = 0;
    const totalImages = 3;

    const onLoad = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        setDungeonImages({
          dungeon1: images.dungeon1,
          dungeon2: images.dungeon2,
          dungeon3: images.dungeon3
        });
        console.log('✅ All dungeon images loaded successfully');
      }
    };

    images.dungeon1.onload = onLoad;
    images.dungeon2.onload = onLoad;
    images.dungeon3.onload = onLoad;

    images.dungeon1.onerror = () => console.error('Failed to load dungeon1.png');
    images.dungeon2.onerror = () => console.error('Failed to load dungeon2.png');
    images.dungeon3.onerror = () => console.error('Failed to load dungeon3.png');
  }, []);

  // Load city building images
  useEffect(() => {
    const images = {
      city1: new Image(),
      city2: new Image(),
      city3: new Image(),
      city4: new Image(),
      city5: new Image()
    };

    images.city1.src = city1Img;
    images.city2.src = city2Img;
    images.city3.src = city3Img;
    images.city4.src = city4Img;
    images.city5.src = city5Img;

    let loadedCount = 0;
    const totalImages = 5;

    const onLoad = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        setCityImages({
          city1: images.city1,
          city2: images.city2,
          city3: images.city3,
          city4: images.city4,
          city5: images.city5
        });
        console.log('✅ All city images loaded successfully');
      }
    };

    images.city1.onload = onLoad;
    images.city2.onload = onLoad;
    images.city3.onload = onLoad;
    images.city4.onload = onLoad;
    images.city5.onload = onLoad;

    images.city1.onerror = () => console.error('Failed to load city1.png');
    images.city2.onerror = () => console.error('Failed to load city2.png');
    images.city3.onerror = () => console.error('Failed to load city3.png');
    images.city4.onerror = () => console.error('Failed to load city4.png');
    images.city5.onerror = () => console.error('Failed to load city5.png');
  }, []);

  // Load monster images
  useEffect(() => {
    const images = {
      ancientGolem: new Image(),
      direWolf: new Image(),
      troll: new Image(),
      ogre: new Image(),
      harpy: new Image(),
      frostGiant: new Image(),
      manticore: new Image(),
      wyvern: new Image(),
      banditLeader: new Image(),
      darkKnight: new Image()
    };

    images.ancientGolem.src = ancientGolemImg;
    images.direWolf.src = direWolfImg;
    images.troll.src = trollImg;
    images.ogre.src = ogreImg;
    images.harpy.src = harpyImg;
    images.frostGiant.src = frostGiantImg;
    images.manticore.src = manticoreImg;
    images.wyvern.src = wyvernImg;
    images.banditLeader.src = banditLeaderImg;
    images.darkKnight.src = darkKnightImg;

    let loadedCount = 0;
    const totalImages = 10;

    const onLoad = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        setMonsterImages({
          ancientGolem: images.ancientGolem,
          direWolf: images.direWolf,
          troll: images.troll,
          ogre: images.ogre,
          harpy: images.harpy,
          frostGiant: images.frostGiant,
          manticore: images.manticore,
          wyvern: images.wyvern,
          banditLeader: images.banditLeader,
          darkKnight: images.darkKnight
        });
        console.log('✅ All monster images loaded successfully');
      }
    };

    images.ancientGolem.onload = onLoad;
    images.direWolf.onload = onLoad;
    images.troll.onload = onLoad;
    images.ogre.onload = onLoad;
    images.harpy.onload = onLoad;
    images.frostGiant.onload = onLoad;
    images.manticore.onload = onLoad;
    images.wyvern.onload = onLoad;
    images.banditLeader.onload = onLoad;
    images.darkKnight.onload = onLoad;

    images.ancientGolem.onerror = () => console.error('Failed to load ancient-golem.png');
    images.direWolf.onerror = () => console.error('Failed to load dire-wolf.png');
    images.troll.onerror = () => console.error('Failed to load troll.png');
    images.ogre.onerror = () => console.error('Failed to load ogre.png');
    images.harpy.onerror = () => console.error('Failed to load Harpy.png');
    images.frostGiant.onerror = () => console.error('Failed to load frost-giant.png');
    images.manticore.onerror = () => console.error('Failed to load manticore.png');
    images.wyvern.onerror = () => console.error('Failed to load wyvern.png');
    images.banditLeader.onerror = () => console.error('Failed to load bandit-leader.png');
    images.darkKnight.onerror = () => console.error('Failed to load dark-knight.png');
  }, []);

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
   * Initialize weather particles when weather changes
   */
  useEffect(() => {
    if (!weather) return;

    const particleCount = weather.current === 'rain' ? 150 : weather.current === 'snow' ? 100 : weather.current === 'storm' ? 250 : 0;

    // Reset particles
    weatherParticlesRef.current = [];

    // Generate particles
    for (let i = 0; i < particleCount; i++) {
      weatherParticlesRef.current.push({
        x: Math.random() * VIEWPORT_WIDTH,
        y: Math.random() * VIEWPORT_HEIGHT,
        speed: weather.current === 'rain' ? 4 + Math.random() * 3 : weather.current === 'storm' ? 6 + Math.random() * 4 : 1 + Math.random() * 2,
        opacity: weather.current === 'rain' ? 0.3 + Math.random() * 0.4 : weather.current === 'storm' ? 0.4 + Math.random() * 0.5 : 0.5 + Math.random() * 0.5
      });
    }
  }, [weather?.current, VIEWPORT_WIDTH, VIEWPORT_HEIGHT]);

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
    const staticObjectsToRender: Array<{
      icon: string;
      screenX: number;
      screenY: number;
      objectType: string;
      objectId?: string;
      objectName?: string;
    }> = [];

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
          const objectType = tile.staticObject.type;
          const objectId = tile.staticObject.id;
          const objectName = tile.staticObject.name;

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
            staticObjectsToRender.push({ icon, screenX, screenY, objectType, objectId, objectName });
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
        let useImage = false;
        let imgToUse: HTMLImageElement | null = null;

        switch (obj.type) {
          case 'wanderingMonster':
            icon = '🐺';
            // Check if this is a monster with an image and use it if available
            if ('enemyName' in obj) {
              if (obj.enemyName === 'Dire Wolf' && monsterImages.direWolf) {
                useImage = true;
                imgToUse = monsterImages.direWolf;
              } else if (obj.enemyName === 'Troll' && monsterImages.troll) {
                useImage = true;
                imgToUse = monsterImages.troll;
              } else if (obj.enemyName === 'Ogre' && monsterImages.ogre) {
                useImage = true;
                imgToUse = monsterImages.ogre;
              } else if (obj.enemyName === 'Harpy' && monsterImages.harpy) {
                useImage = true;
                imgToUse = monsterImages.harpy;
              } else if (obj.enemyName === 'Frost Giant' && monsterImages.frostGiant) {
                useImage = true;
                imgToUse = monsterImages.frostGiant;
              } else if (obj.enemyName === 'Manticore' && monsterImages.manticore) {
                useImage = true;
                imgToUse = monsterImages.manticore;
              } else if (obj.enemyName === 'Wyvern' && monsterImages.wyvern) {
                useImage = true;
                imgToUse = monsterImages.wyvern;
              } else if (obj.enemyName === 'Bandit Leader' && monsterImages.banditLeader) {
                useImage = true;
                imgToUse = monsterImages.banditLeader;
              } else if (obj.enemyName === 'Dark Knight' && monsterImages.darkKnight) {
                useImage = true;
                imgToUse = monsterImages.darkKnight;
              }
            }
            break;
          case 'travelingMerchant':
            icon = '🛒';
            break;
          case 'event':
            icon = '⭐';
            break;
        }

        if (useImage && imgToUse) {
          // Add yellow glow effect for monsters
          ctx.shadowColor = '#ffff00';
          ctx.shadowBlur = 15;

          // Make monster larger (1.3x tile size) and center it
          const monsterSize = TILE_SIZE * 1.3;
          const monsterOffsetX = screenX - (monsterSize - TILE_SIZE) / 2;
          const monsterOffsetY = screenY - (monsterSize - TILE_SIZE) / 2;

          ctx.drawImage(imgToUse, monsterOffsetX, monsterOffsetY, monsterSize, monsterSize);

          // Reset shadow
          ctx.shadowBlur = 0;
        } else if (icon) {
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
    staticObjectsToRender.forEach(({ icon, screenX, screenY, objectType, objectId, objectName }) => {
      // Use dungeon images for dungeons if available
      if (objectType === 'dungeon' && objectId) {
        // Select dungeon image based on dungeon ID (0 = dungeon1, 1 = dungeon2, etc.)
        const dungeonIndex = parseInt(objectId.split('-')[1] || '0');
        let dungeonImg: HTMLImageElement | null = null;

        switch (dungeonIndex % 3) {
          case 0:
            dungeonImg = dungeonImages.dungeon1;
            break;
          case 1:
            dungeonImg = dungeonImages.dungeon2;
            break;
          case 2:
            dungeonImg = dungeonImages.dungeon3;
            break;
        }

        // Draw dungeon image if loaded, otherwise fall back to emoji
        if (dungeonImg) {
          // Add yellow glow effect
          ctx.shadowColor = '#ffff00';
          ctx.shadowBlur = 15;

          // Make dungeon larger (1.3x tile size) and center it
          const dungeonSize = TILE_SIZE * 1.3;
          const dungeonOffsetX = screenX - (dungeonSize - TILE_SIZE) / 2;
          const dungeonOffsetY = screenY - (dungeonSize - TILE_SIZE) / 2;

          ctx.drawImage(dungeonImg, dungeonOffsetX, dungeonOffsetY, dungeonSize, dungeonSize);

          // Reset shadow
          ctx.shadowBlur = 0;
        } else {
          ctx.fillText(icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
        }
      } else if (objectType === 'town' && objectId) {
        // Use city images for towns if available
        // Select city image based on town ID (0 = city1, 1 = city2, etc.)
        const townIndex = parseInt(objectId.split('-')[1] || '0');
        let cityImg: HTMLImageElement | null = null;

        switch (townIndex % 5) {
          case 0:
            cityImg = cityImages.city1;
            break;
          case 1:
            cityImg = cityImages.city2;
            break;
          case 2:
            cityImg = cityImages.city3;
            break;
          case 3:
            cityImg = cityImages.city4;
            break;
          case 4:
            cityImg = cityImages.city5;
            break;
        }

        // Draw city image if loaded, otherwise fall back to emoji
        if (cityImg) {
          // Add yellow glow effect
          ctx.shadowColor = '#ffff00';
          ctx.shadowBlur = 15;

          // Make city larger (1.3x tile size) and center it
          const citySize = TILE_SIZE * 1.3;
          const cityOffsetX = screenX - (citySize - TILE_SIZE) / 2;
          const cityOffsetY = screenY - (citySize - TILE_SIZE) / 2;

          ctx.drawImage(cityImg, cityOffsetX, cityOffsetY, citySize, citySize);

          // Reset shadow
          ctx.shadowBlur = 0;
        } else {
          ctx.fillText(icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
        }
      } else if (objectType === 'rareSpawn' && objectName === 'Ancient Golem') {
        // Use Ancient Golem image for Ancient Golem rare spawn
        if (monsterImages.ancientGolem) {
          // Add yellow glow effect
          ctx.shadowColor = '#ffff00';
          ctx.shadowBlur = 15;

          // Make Ancient Golem larger (1.3x tile size) and center it
          const golemSize = TILE_SIZE * 1.3;
          const golemOffsetX = screenX - (golemSize - TILE_SIZE) / 2;
          const golemOffsetY = screenY - (golemSize - TILE_SIZE) / 2;

          ctx.drawImage(monsterImages.ancientGolem, golemOffsetX, golemOffsetY, golemSize, golemSize);

          // Reset shadow
          ctx.shadowBlur = 0;
        } else {
          ctx.fillText(icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
        }
      } else if (objectType === 'rareSpawn' && objectName === 'Frost Giant') {
        // Use Frost Giant image for Frost Giant rare spawn
        if (monsterImages.frostGiant) {
          // Add yellow glow effect
          ctx.shadowColor = '#ffff00';
          ctx.shadowBlur = 15;

          // Make Frost Giant larger (1.3x tile size) and center it
          const giantSize = TILE_SIZE * 1.3;
          const giantOffsetX = screenX - (giantSize - TILE_SIZE) / 2;
          const giantOffsetY = screenY - (giantSize - TILE_SIZE) / 2;

          ctx.drawImage(monsterImages.frostGiant, giantOffsetX, giantOffsetY, giantSize, giantSize);

          // Reset shadow
          ctx.shadowBlur = 0;
        } else {
          ctx.fillText(icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
        }
      } else {
        // Draw emoji for other object types
        ctx.fillText(icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
      }
    });

    // === WEATHER & TIME OF DAY EFFECTS ===

    // 1. Time of Day Lighting Overlay
    if (timeOfDay) {
      const lighting = TimeOfDaySystem.getLightingOverlay(timeOfDay.current);
      ctx.fillStyle = `${lighting.color}${Math.round(lighting.alpha * 255).toString(16).padStart(2, '0')}`;
      ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    }

    // 2. Fog Weather Effect (semi-transparent overlay)
    if (weather?.current === 'fog') {
      ctx.fillStyle = 'rgba(180, 180, 180, 0.4)';
      ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    }

    // 3. Rain/Storm/Snow Particles
    if (weather && (weather.current === 'rain' || weather.current === 'storm' || weather.current === 'snow')) {
      weatherParticlesRef.current.forEach(particle => {
        // Update particle position
        particle.y += particle.speed;

        // Wrap around when particle goes off screen
        if (particle.y > VIEWPORT_HEIGHT) {
          particle.y = -10;
          particle.x = Math.random() * VIEWPORT_WIDTH;
        }

        // Draw particle based on weather type
        if (weather.current === 'snow') {
          // Snowflakes - small white circles
          ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Rain/storm drops - thin lines
          const dropLength = weather.current === 'storm' ? 15 : 10;
          ctx.strokeStyle = `rgba(174, 194, 224, ${particle.opacity})`;
          ctx.lineWidth = weather.current === 'storm' ? 2 : 1;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x - 3, particle.y + dropLength);
          ctx.stroke();
        }
      });
    }

  }, [worldMap, playerPosition, viewport, zoom, TILE_SIZE, terrainImages, heroImage, dungeonImages, weather, timeOfDay, animationTrigger]);

  /**
   * Animation loop for pulsating glow effect and weather particles
   * Uses requestAnimationFrame to continuously update the canvas
   */
  useEffect(() => {
    const animate = () => {
      // Trigger re-render by updating animation trigger state
      // This causes the main render useEffect to run, which updates particles and glow
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
              combatPower={player.combatPower}
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
