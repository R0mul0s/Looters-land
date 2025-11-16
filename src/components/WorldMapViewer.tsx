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
 * @lastModified 2025-11-15
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS, Z_INDEX, TRANSITIONS } from '../styles/tokens';
import { flexBetween, flexCenter } from '../styles/common';
import type { WorldMap, Tile, DynamicObject, WeatherState, TimeState, Town, StaticObject, ObservationTower } from '../types/worldmap.types';
import { TERRAIN_ICONS } from '../types/worldmap.types';
import { OtherPlayerMarker } from './OtherPlayerMarker';
import { ChatBubble } from './ChatBubble';
import type { OtherPlayer } from '../hooks/useOtherPlayers';
import { t } from '../localization/i18n';
import { PerlinNoise } from '../engine/worldmap/PerlinNoise';
import { TimeOfDaySystem } from '../engine/worldmap/TimeOfDaySystem';
import { findPath } from '../utils/pathfinding';

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
import mountains1Img from '../assets/images/terrian/mountains1.png';
import mountains2Img from '../assets/images/terrian/mountains2.png';

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

// Import object images
import treasureChest1Img from '../assets/images/object/treasure-chest1.png';
import treasureChest2Img from '../assets/images/object/treasure-chest2.png';
import treasureChest3Img from '../assets/images/object/treasure-chest3.png';
import portal1Img from '../assets/images/object/portal1.png';
import portal2Img from '../assets/images/object/portal2.png';
import portal3Img from '../assets/images/object/portal3.png';
import portal4Img from '../assets/images/object/portal4.png';
import travelingMerchant1Img from '../assets/images/object/traveling-merchant1.png';
import travelingMerchant2Img from '../assets/images/object/traveling-merchant2.png';
import travelingMerchant3Img from '../assets/images/object/traveling-merchant3.png';
import hiddenPath1Img from '../assets/images/object/hidden-path1.png';
import hiddenPath2Img from '../assets/images/object/hidden-path2.png';
import observationTower1Img from '../assets/images/building/observation-tower1.png';
import observationTower2Img from '../assets/images/building/observation-tower2.png';
import observationTower3Img from '../assets/images/building/observation-tower3.png';

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
import shadowDragonImg from '../assets/images/monster/shadow-dragon.png';
import phoenixImg from '../assets/images/monster/pheonix.png';

interface WorldMapViewerProps {
  worldMap: WorldMap;
  playerPosition: { x: number; y: number };
  playerAvatar?: string; // Avatar filename (e.g., 'hero1.png', 'hero2.png')
  otherPlayers?: OtherPlayer[]; // Optional list of other players to render
  playerChatMessage?: string; // Current player's chat message
  playerChatTimestamp?: Date; // Timestamp of current player's chat message
  weather?: WeatherState; // Current weather state
  timeOfDay?: TimeState; // Current time of day state
  onTileClick?: (x: number, y: number, isPathMovement?: boolean) => void;
  onCancelMovement?: () => void; // Callback when player cancels movement
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
  onCancelMovement
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
    mountains: { img1: HTMLImageElement | null; img2: HTMLImageElement | null };
  }>({
    forest: { img1: null, img2: null },
    desert: { img1: null, img2: null },
    plains: { img1: null, img2: null },
    swamp: { img1: null, img2: null },
    water: { img1: null, img2: null },
    road: { img1: null, img2: null },
    mountains: { img1: null, img2: null }
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

  // Treasure chest object images
  const [treasureChestImages, setTreasureChestImages] = useState<{
    chest1: HTMLImageElement | null;
    chest2: HTMLImageElement | null;
    chest3: HTMLImageElement | null;
  }>({
    chest1: null,
    chest2: null,
    chest3: null
  });

  // Portal images
  const [portalImages, setPortalImages] = useState<{
    portal1: HTMLImageElement | null;
    portal2: HTMLImageElement | null;
    portal3: HTMLImageElement | null;
    portal4: HTMLImageElement | null;
  }>({
    portal1: null,
    portal2: null,
    portal3: null,
    portal4: null
  });

  // Traveling merchant images
  const [travelingMerchantImages, setTravelingMerchantImages] = useState<{
    merchant1: HTMLImageElement | null;
    merchant2: HTMLImageElement | null;
    merchant3: HTMLImageElement | null;
  }>({
    merchant1: null,
    merchant2: null,
    merchant3: null
  });

  // Observation tower images
  const [observationTowerImages, setObservationTowerImages] = useState<{
    tower1: HTMLImageElement | null;
    tower2: HTMLImageElement | null;
    tower3: HTMLImageElement | null;
  }>({
    tower1: null,
    tower2: null,
    tower3: null
  });

  // Hidden path images
  const [hiddenPathImages, setHiddenPathImages] = useState<{
    path1: HTMLImageElement | null;
    path2: HTMLImageElement | null;
  }>({
    path1: null,
    path2: null
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
    shadowDragon: HTMLImageElement | null;
    phoenix: HTMLImageElement | null;
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
    darkKnight: null,
    shadowDragon: null,
    phoenix: null
  });

  // Pathfinding and movement state
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[] | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [movementProgress, setMovementProgress] = useState(0); // 0 to 1 for interpolation between tiles
  const [facingLeft, setFacingLeft] = useState(false); // Track if player is facing left

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

  // Load treasure chest images
  useEffect(() => {
    const images = {
      chest1: new Image(),
      chest2: new Image(),
      chest3: new Image()
    };

    images.chest1.src = treasureChest1Img;
    images.chest2.src = treasureChest2Img;
    images.chest3.src = treasureChest3Img;

    let loadedCount = 0;
    const totalImages = 3;

    const onLoad = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        setTreasureChestImages({
          chest1: images.chest1,
          chest2: images.chest2,
          chest3: images.chest3
        });
        console.log('✅ All treasure chest images loaded successfully');
      }
    };

    images.chest1.onload = onLoad;
    images.chest2.onload = onLoad;
    images.chest3.onload = onLoad;

    images.chest1.onerror = () => console.error('Failed to load treasure-chest1.png');
    images.chest2.onerror = () => console.error('Failed to load treasure-chest2.png');
    images.chest3.onerror = () => console.error('Failed to load treasure-chest3.png');
  }, []);

  // Load portal images
  useEffect(() => {
    const images = {
      portal1: new Image(),
      portal2: new Image(),
      portal3: new Image(),
      portal4: new Image()
    };

    images.portal1.src = portal1Img;
    images.portal2.src = portal2Img;
    images.portal3.src = portal3Img;
    images.portal4.src = portal4Img;

    let loadedCount = 0;
    const totalImages = 4;

    const onLoad = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        setPortalImages({
          portal1: images.portal1,
          portal2: images.portal2,
          portal3: images.portal3,
          portal4: images.portal4
        });
        console.log('✅ All portal images loaded successfully');
      }
    };

    images.portal1.onload = onLoad;
    images.portal2.onload = onLoad;
    images.portal3.onload = onLoad;
    images.portal4.onload = onLoad;

    images.portal1.onerror = () => console.error('Failed to load portal1.png');
    images.portal2.onerror = () => console.error('Failed to load portal2.png');
    images.portal3.onerror = () => console.error('Failed to load portal3.png');
    images.portal4.onerror = () => console.error('Failed to load portal4.png');
  }, []);

  // Load traveling merchant images
  useEffect(() => {
    const images = {
      merchant1: new Image(),
      merchant2: new Image(),
      merchant3: new Image()
    };

    images.merchant1.src = travelingMerchant1Img;
    images.merchant2.src = travelingMerchant2Img;
    images.merchant3.src = travelingMerchant3Img;

    let loadedCount = 0;
    const totalImages = 3;

    const onLoad = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        setTravelingMerchantImages({
          merchant1: images.merchant1,
          merchant2: images.merchant2,
          merchant3: images.merchant3
        });
        console.log('✅ All traveling merchant images loaded successfully');
      }
    };

    images.merchant1.onload = onLoad;
    images.merchant2.onload = onLoad;
    images.merchant3.onload = onLoad;

    images.merchant1.onerror = () => console.error('Failed to load traveling-merchant1.png');
    images.merchant2.onerror = () => console.error('Failed to load traveling-merchant2.png');
    images.merchant3.onerror = () => console.error('Failed to load traveling-merchant3.png');
  }, []);

  // Load hidden path images
  useEffect(() => {
    const images = {
      path1: new Image(),
      path2: new Image()
    };

    images.path1.src = hiddenPath1Img;
    images.path2.src = hiddenPath2Img;

    let loadedCount = 0;
    const totalImages = 2;

    const onLoad = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        setHiddenPathImages({
          path1: images.path1,
          path2: images.path2
        });
        console.log('✅ All hidden path images loaded successfully');
      }
    };

    images.path1.onload = onLoad;
    images.path2.onload = onLoad;

    images.path1.onerror = () => console.error('Failed to load hidden-path1.png');
    images.path2.onerror = () => console.error('Failed to load hidden-path2.png');
  }, []);

  // Load observation tower images
  useEffect(() => {
    const images = {
      tower1: new Image(),
      tower2: new Image(),
      tower3: new Image()
    };

    images.tower1.src = observationTower1Img;
    images.tower2.src = observationTower2Img;
    images.tower3.src = observationTower3Img;

    let loadedCount = 0;
    const totalImages = 3;

    const onLoad = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        setObservationTowerImages({
          tower1: images.tower1,
          tower2: images.tower2,
          tower3: images.tower3
        });
        console.log('✅ All observation tower images loaded successfully');
      }
    };

    images.tower1.onload = onLoad;
    images.tower2.onload = onLoad;
    images.tower3.onload = onLoad;

    images.tower1.onerror = () => console.error('Failed to load observation-tower1.png');
    images.tower2.onerror = () => console.error('Failed to load observation-tower2.png');
    images.tower3.onerror = () => console.error('Failed to load observation-tower3.png');
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
      darkKnight: new Image(),
      shadowDragon: new Image(),
      phoenix: new Image()
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
    images.shadowDragon.src = shadowDragonImg;
    images.phoenix.src = phoenixImg;

    let loadedCount = 0;
    const totalImages = 12;

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
          darkKnight: images.darkKnight,
          shadowDragon: images.shadowDragon,
          phoenix: images.phoenix
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
    images.shadowDragon.onload = onLoad;
    images.phoenix.onload = onLoad;

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
    images.shadowDragon.onerror = () => console.error('Failed to load shadow-dragon.png');
    images.phoenix.onerror = () => console.error('Failed to load pheonix.png');
  }, []);

  // Load all terrain images
  useEffect(() => {
    const images = {
      forest: { img1: new Image(), img2: new Image() },
      desert: { img1: new Image(), img2: new Image() },
      plains: { img1: new Image(), img2: new Image() },
      swamp: { img1: new Image(), img2: new Image() },
      water: { img1: new Image(), img2: new Image() },
      road: { img1: new Image(), img2: new Image() },
      mountains: { img1: new Image(), img2: new Image() }
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
    images.mountains.img1.src = mountains1Img;
    images.mountains.img2.src = mountains2Img;

    let loadedCount = 0;
    const totalImages = 14; // 7 terrains × 2 images each

    const onLoad = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        setTerrainImages({
          forest: { img1: images.forest.img1, img2: images.forest.img2 },
          desert: { img1: images.desert.img1, img2: images.desert.img2 },
          plains: { img1: images.plains.img1, img2: images.plains.img2 },
          swamp: { img1: images.swamp.img1, img2: images.swamp.img2 },
          water: { img1: images.water.img1, img2: images.water.img2 },
          road: { img1: images.road.img1, img2: images.road.img2 },
          mountains: { img1: images.mountains.img1, img2: images.mountains.img2 }
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
    images.mountains.img1.onerror = () => console.error('Failed to load mountains1.png');
    images.mountains.img2.onerror = () => console.error('Failed to load mountains2.png');
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
      isDefeatedOrOpened?: boolean;
      objectName?: string;
      staticObject?: StaticObject;
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
            case 'mountains':
              if (terrainImages.mountains.img1 && terrainImages.mountains.img2) {
                terrainImg = variant === 1 ? terrainImages.mountains.img1 : terrainImages.mountains.img2;
              }
              break;
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
            case 'observationTower':
              icon = '🗼';
              break;
          }
          if (icon) {
            // Check if object is defeated/opened/discovered/used for grayscale rendering
            let isDefeatedOrOpened = false;
            if (tile.staticObject.type === 'treasureChest' && 'opened' in tile.staticObject) {
              isDefeatedOrOpened = tile.staticObject.opened === true;
            } else if (tile.staticObject.type === 'rareSpawn' && 'defeated' in tile.staticObject) {
              isDefeatedOrOpened = tile.staticObject.defeated === true;
            } else if (tile.staticObject.type === 'hiddenPath' && 'discovered' in tile.staticObject) {
              isDefeatedOrOpened = tile.staticObject.discovered === true;
            } else if (tile.staticObject.type === 'observationTower' && 'used' in tile.staticObject) {
              isDefeatedOrOpened = tile.staticObject.used === true;
            }
            staticObjectsToRender.push({ icon, screenX, screenY, objectType, objectId, objectName, isDefeatedOrOpened, staticObject: tile.staticObject });
          }
        }

        // Draw fog of war (if not explored)
        if (!tile.isExplored && !(x === playerPosition.x && y === playerPosition.y)) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // === RENDERING ORDER: Terrain (LAYER 1) → Static Objects (LAYER 2) → Dynamic Objects (LAYER 3) → Other Players (LAYER 4 via React) → Main Player (LAYER 5) ===

    // Draw static objects (towns, dungeons, rare spawns, treasure chests, portals) - LAYER 2
    ctx.font = `${Math.floor(TILE_SIZE * 0.8)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    staticObjectsToRender.forEach(({ icon, screenX, screenY, objectType, objectId, objectName, isDefeatedOrOpened, staticObject }) => {
      // Apply grayscale filter for defeated/opened objects
      if (isDefeatedOrOpened) {
        ctx.filter = 'grayscale(100%) brightness(0.6)';
        ctx.globalAlpha = 0.6;
      }
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
        // Get asset from town object if available, otherwise fallback to ID-based selection
        const town = staticObject as Town | undefined;
        const assetName = town?.asset;

        let cityImg: HTMLImageElement | null = null;

        // Use asset name if available
        if (assetName) {
          switch (assetName) {
            case 'city1.png':
              cityImg = cityImages.city1;
              break;
            case 'city2.png':
              cityImg = cityImages.city2;
              break;
            case 'city3.png':
              cityImg = cityImages.city3;
              break;
            case 'city4.png':
              cityImg = cityImages.city4;
              break;
            case 'city5.png':
              cityImg = cityImages.city5;
              break;
          }
        } else {
          // Fallback: Select city image based on town ID (0 = city1, 1 = city2, etc.)
          const townIndex = parseInt(objectId.split('-')[1] || '0');
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
        }

        // Draw city image if loaded, otherwise fall back to emoji
        if (cityImg) {
          // Add BLUE glow effect for towns
          ctx.shadowColor = '#0099ff';
          ctx.shadowBlur = 18;

          // Make city larger (1.6x tile size) and center it
          const citySize = TILE_SIZE * 1.6;
          const cityOffsetX = screenX - (citySize - TILE_SIZE) / 2;
          const cityOffsetY = screenY - (citySize - TILE_SIZE) / 2;

          ctx.drawImage(cityImg, cityOffsetX, cityOffsetY, citySize, citySize);

          // Reset shadow
          ctx.shadowBlur = 0;

          // Draw town name below the city icon
          if (objectName) {
            ctx.save();
            ctx.font = `bold ${Math.floor(TILE_SIZE * 0.35)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            // Draw text shadow for better readability
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 4;
            ctx.fillStyle = '#ffffff';

            // Position text below the city (accounting for larger city size)
            const textY = screenY + citySize + 2;
            ctx.fillText(objectName, screenX + TILE_SIZE / 2, textY);

            ctx.restore();
          }
        } else {
          ctx.fillText(icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
        }
      } else if (objectType === 'portal' && objectId) {
        // Use portal images for portals if available
        // Select portal image based on portal ID (0 = portal1, 1 = portal2, etc.)
        const portalIndex = parseInt(objectId.split('-')[1] || '0');
        let portalImg: HTMLImageElement | null = null;

        switch (portalIndex % 4) {
          case 0:
            portalImg = portalImages.portal1;
            break;
          case 1:
            portalImg = portalImages.portal2;
            break;
          case 2:
            portalImg = portalImages.portal3;
            break;
          case 3:
            portalImg = portalImages.portal4;
            break;
        }

        // Draw portal image if loaded, otherwise fall back to emoji
        if (portalImg) {
          // Add BLUE glow effect for portals
          ctx.shadowColor = '#0099ff';
          ctx.shadowBlur = 18;

          // Make portal larger (1.4x tile size) and center it
          const portalSize = TILE_SIZE * 1.4;
          const portalOffsetX = screenX - (portalSize - TILE_SIZE) / 2;
          const portalOffsetY = screenY - (portalSize - TILE_SIZE) / 2;

          ctx.drawImage(portalImg, portalOffsetX, portalOffsetY, portalSize, portalSize);

          // Reset shadow
          ctx.shadowBlur = 0;
        } else {
          // Fallback to emoji if image not loaded
          ctx.shadowColor = '#0099ff';
          ctx.shadowBlur = 18;
          ctx.fillText(icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
          ctx.shadowBlur = 0;
        }
      } else if (objectType === 'hiddenPath' && objectId) {
        // Use hidden path images for hidden paths if available
        // Select image based on path ID (alternating between 2 images)
        const pathIndex = parseInt(objectId.split('-')[2] || '0');

        // Use pre-loaded images from state
        const hiddenPathImg = (pathIndex % 2 === 0) ? hiddenPathImages.path1 : hiddenPathImages.path2;

        // Draw hidden path image if loaded, otherwise fall back to emoji
        if (hiddenPathImg) {
          // Add GOLDEN glow effect for hidden paths (mysterious/valuable)
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 20;

          // Make hidden path larger (1.4x tile size) and center it
          const pathSize = TILE_SIZE * 1.4;
          const pathOffsetX = screenX - (pathSize - TILE_SIZE) / 2;
          const pathOffsetY = screenY - (pathSize - TILE_SIZE) / 2;

          ctx.drawImage(hiddenPathImg, pathOffsetX, pathOffsetY, pathSize, pathSize);

          // Reset shadow
          ctx.shadowBlur = 0;
        } else {
          // Fallback to emoji if image not loaded
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 20;
          ctx.fillText(icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
          ctx.shadowBlur = 0;
        }
      } else if (objectType === 'rareSpawn' && objectName === 'Ancient Golem') {
        // Use Ancient Golem image for Ancient Golem rare spawn
        if (monsterImages.ancientGolem) {
          // Add RED glow effect for powerful bosses
          ctx.shadowColor = '#ff0000';
          ctx.shadowBlur = 20;

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
          // Add RED glow effect for powerful bosses
          ctx.shadowColor = '#ff0000';
          ctx.shadowBlur = 20;

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
      } else if (objectType === 'rareSpawn' && objectName === 'Shadow Dragon') {
        // Use Shadow Dragon image for Shadow Dragon rare spawn
        if (monsterImages.shadowDragon) {
          // Add RED glow effect for powerful bosses
          ctx.shadowColor = '#ff0000';
          ctx.shadowBlur = 20;

          // Make Shadow Dragon larger (1.3x tile size) and center it
          const dragonSize = TILE_SIZE * 1.3;
          const dragonOffsetX = screenX - (dragonSize - TILE_SIZE) / 2;
          const dragonOffsetY = screenY - (dragonSize - TILE_SIZE) / 2;

          ctx.drawImage(monsterImages.shadowDragon, dragonOffsetX, dragonOffsetY, dragonSize, dragonSize);

          // Reset shadow
          ctx.shadowBlur = 0;
        } else {
          ctx.fillText(icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
        }
      } else if (objectType === 'rareSpawn' && objectName === 'Phoenix') {
        // Use Phoenix image for Phoenix rare spawn
        if (monsterImages.phoenix) {
          // Add RED glow effect for powerful bosses
          ctx.shadowColor = '#ff0000';
          ctx.shadowBlur = 20;

          // Make Phoenix larger (1.3x tile size) and center it
          const phoenixSize = TILE_SIZE * 1.3;
          const phoenixOffsetX = screenX - (phoenixSize - TILE_SIZE) / 2;
          const phoenixOffsetY = screenY - (phoenixSize - TILE_SIZE) / 2;

          ctx.drawImage(monsterImages.phoenix, phoenixOffsetX, phoenixOffsetY, phoenixSize, phoenixSize);

          // Reset shadow
          ctx.shadowBlur = 0;
        } else {
          ctx.fillText(icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
        }
      } else if (objectType === 'treasureChest' && objectId) {
        // Use treasure chest images for treasure chests if available
        // Select chest image based on chest ID (0 = chest1, 1 = chest2, etc.)
        const chestIndex = parseInt(objectId.split('-')[1] || '0');
        let chestImg: HTMLImageElement | null = null;

        switch (chestIndex % 3) {
          case 0:
            chestImg = treasureChestImages.chest1;
            break;
          case 1:
            chestImg = treasureChestImages.chest2;
            break;
          case 2:
            chestImg = treasureChestImages.chest3;
            break;
        }

        // Draw treasure chest image if loaded, otherwise fall back to emoji
        if (chestImg) {
          // Add yellow glow effect
          ctx.shadowColor = '#ffff00';
          ctx.shadowBlur = 15;

          // Make treasure chest larger (1.3x tile size) and center it
          const chestSize = TILE_SIZE * 1.3;
          const chestOffsetX = screenX - (chestSize - TILE_SIZE) / 2;
          const chestOffsetY = screenY - (chestSize - TILE_SIZE) / 2;

          ctx.drawImage(chestImg, chestOffsetX, chestOffsetY, chestSize, chestSize);

          // Reset shadow
          ctx.shadowBlur = 0;
        } else {
          ctx.fillText(icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
        }
      } else if (objectType === 'observationTower' && objectId) {
        // Use observation tower images if available
        const tower = staticObject as ObservationTower | undefined;
        const assetName = tower?.asset;

        let towerImg: HTMLImageElement | null = null;

        // Use asset name if available
        if (assetName) {
          switch (assetName) {
            case 'observation-tower1.png':
              towerImg = observationTowerImages.tower1;
              break;
            case 'observation-tower2.png':
              towerImg = observationTowerImages.tower2;
              break;
            case 'observation-tower3.png':
              towerImg = observationTowerImages.tower3;
              break;
          }
        }

        // Draw tower image if loaded, otherwise fall back to emoji
        if (towerImg) {
          // Add blue glow effect for unused towers
          if (!tower?.used) {
            ctx.shadowColor = '#4a90e2';
            ctx.shadowBlur = 15;
          }

          // Make tower larger (1.5x tile size) and center it
          const towerSize = TILE_SIZE * 1.5;
          const towerOffsetX = screenX - (towerSize - TILE_SIZE) / 2;
          const towerOffsetY = screenY - (towerSize - TILE_SIZE) / 2;

          ctx.drawImage(towerImg, towerOffsetX, towerOffsetY, towerSize, towerSize);

          // Reset shadow
          ctx.shadowBlur = 0;
        } else {
          ctx.fillText(icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
        }
      } else {
        // Draw emoji for other object types
        ctx.fillText(icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
      }

      // Reset filter and alpha for defeated/opened objects
      if (isDefeatedOrOpened) {
        ctx.filter = 'none';
        ctx.globalAlpha = 1.0;
      }
    });

    // Draw dynamic objects (wandering monsters, traveling merchants) - LAYER 3
    worldMap.dynamicObjects.forEach(obj => {
      if (!obj.isActive) return;

      // Check if tile is explored (fog of war)
      const tile = worldMap.tiles[obj.position.y]?.[obj.position.x];
      if (!tile || !tile.isExplored) return;

      const screenX = (obj.position.x - viewport.x) * TILE_SIZE;
      const screenY = (obj.position.y - viewport.y) * TILE_SIZE;

      // Only render if in viewport
      if (
        screenX >= -TILE_SIZE &&
        screenX <= VIEWPORT_WIDTH &&
        screenY >= -TILE_SIZE &&
        screenY <= VIEWPORT_HEIGHT
      ) {
        // Check if monster is defeated for grayscale rendering
        const isDefeated = obj.type === 'wanderingMonster' && 'defeated' in obj && obj.defeated === true;

        // Apply grayscale filter for defeated monsters
        if (isDefeated) {
          ctx.filter = 'grayscale(100%) brightness(0.6)';
          ctx.globalAlpha = 0.6;
        }

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
            // Use traveling merchant images with rotation (modulo 3)
            if (obj.id) {
              const merchantIndex = parseInt(obj.id.split('-')[1] || '0');
              switch (merchantIndex % 3) {
                case 0:
                  if (travelingMerchantImages.merchant1) {
                    useImage = true;
                    imgToUse = travelingMerchantImages.merchant1;
                  }
                  break;
                case 1:
                  if (travelingMerchantImages.merchant2) {
                    useImage = true;
                    imgToUse = travelingMerchantImages.merchant2;
                  }
                  break;
                case 2:
                  if (travelingMerchantImages.merchant3) {
                    useImage = true;
                    imgToUse = travelingMerchantImages.merchant3;
                  }
                  break;
              }
            }
            break;
          case 'event':
            icon = '⭐';
            break;
          case 'encounter':
            icon = '⚔️';
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

        // Reset filter and alpha for defeated monsters
        if (isDefeated) {
          ctx.filter = 'none';
          ctx.globalAlpha = 1.0;
        }
      }
    });

    // === PATH VISUALIZATION - LAYER 4.5 (Between objects and player) ===
    // Draw the movement path if it exists
    if (currentPath && currentPath.length > 0) {
      ctx.save();

      // Draw path as connected line segments
      ctx.strokeStyle = 'rgba(255, 255, 100, 0.8)'; // Yellow path
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();

      // Start from player's current position
      const startTileOffsetX = playerPosition.x - viewport.x;
      const startTileOffsetY = playerPosition.y - viewport.y;
      const startScreenX = startTileOffsetX * TILE_SIZE + TILE_SIZE / 2;
      const startScreenY = startTileOffsetY * TILE_SIZE + TILE_SIZE / 2;
      ctx.moveTo(startScreenX, startScreenY);

      // Draw line through each path point
      currentPath.forEach(point => {
        const tileOffsetX = point.x - viewport.x;
        const tileOffsetY = point.y - viewport.y;
        const screenX = tileOffsetX * TILE_SIZE + TILE_SIZE / 2;
        const screenY = tileOffsetY * TILE_SIZE + TILE_SIZE / 2;
        ctx.lineTo(screenX, screenY);
      });

      ctx.stroke();

      // Draw dots at each waypoint
      currentPath.forEach((point, index) => {
        const tileOffsetX = point.x - viewport.x;
        const tileOffsetY = point.y - viewport.y;
        const screenX = tileOffsetX * TILE_SIZE + TILE_SIZE / 2;
        const screenY = tileOffsetY * TILE_SIZE + TILE_SIZE / 2;

        // Draw a circle at each waypoint
        ctx.fillStyle = 'rgba(255, 255, 100, 0.6)';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw number for last waypoint (destination)
        if (index === currentPath.length - 1) {
          ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
          ctx.beginPath();
          ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.restore();
    }

    // === MAIN PLAYER - LAYER 5 (Topmost, always visible above everything) ===
    // Calculate player's position on screen (center of viewport)
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
      let heroOffsetX = playerScreenX - (heroSize - TILE_SIZE) / 2;
      let heroOffsetY = playerScreenY - (heroSize - TILE_SIZE) / 2;

      // Add bouncing animation when moving (like riding a horse)
      if (isMoving && currentPath && currentPath.length > 0) {
        const bounceSpeed = 0.01; // Speed of bouncing
        const bounceAmount = TILE_SIZE * 0.1; // How high the bounce goes (10% of tile size)
        const bounceOffset = Math.abs(Math.sin(elapsedTime * bounceSpeed)) * bounceAmount;
        heroOffsetY -= bounceOffset; // Move up during bounce
      }

      // Apply horizontal flip if facing left
      if (facingLeft) {
        ctx.save();
        ctx.translate(heroOffsetX + heroSize / 2, 0); // Move to center of hero
        ctx.scale(-1, 1); // Flip horizontally
        ctx.translate(-(heroOffsetX + heroSize / 2), 0); // Move back
      }

      // Draw hero image centered on tile with increased size
      ctx.drawImage(heroImage, heroOffsetX, heroOffsetY, heroSize, heroSize);

      // Restore context if we flipped
      if (facingLeft) {
        ctx.restore();
      }
    } else {
      // Fallback to emoji if image not loaded yet
      ctx.font = `${Math.floor(TILE_SIZE * 0.9)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let emojiY = playerScreenY + TILE_SIZE / 2;

      // Add bouncing animation when moving
      if (isMoving && currentPath && currentPath.length > 0) {
        const bounceSpeed = 0.01;
        const bounceAmount = TILE_SIZE * 0.1;
        const bounceOffset = Math.abs(Math.sin(elapsedTime * bounceSpeed)) * bounceAmount;
        emojiY -= bounceOffset;
      }

      ctx.fillText('🧙', playerScreenX + TILE_SIZE / 2, emojiY);
    }

    // Reset shadow
    ctx.shadowBlur = 0;

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

  }, [worldMap, playerPosition, viewport, zoom, TILE_SIZE, terrainImages, heroImage, dungeonImages, treasureChestImages, portalImages, travelingMerchantImages, hiddenPathImages, monsterImages, cityImages, weather, timeOfDay, animationTrigger, currentPath, isMoving, facingLeft]);

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
   * Movement animation system - handles step-by-step movement along the path
   * Moves player one tile at a time with smooth animation
   */
  useEffect(() => {
    if (!currentPath || currentPath.length === 0 || !isMoving) {
      return;
    }

    const MOVEMENT_SPEED = 300; // milliseconds per tile
    let animationStartTime = Date.now();

    const moveStep = () => {
      const elapsed = Date.now() - animationStartTime;
      const progress = Math.min(elapsed / MOVEMENT_SPEED, 1);

      setMovementProgress(progress);

      if (progress >= 1) {
        // Move to next tile
        const nextPosition = currentPath[0];

        // Update facing direction based on movement
        if (nextPosition.x < playerPosition.x) {
          setFacingLeft(true); // Moving left
        } else if (nextPosition.x > playerPosition.x) {
          setFacingLeft(false); // Moving right
        }
        // If moving only vertically (y direction), keep current facing direction

        // Call the onTileClick callback to actually move the player
        // Pass true to indicate this is automatic path movement (don't trigger object interactions)
        if (onTileClick) {
          onTileClick(nextPosition.x, nextPosition.y, true);
        }

        // Remove the first position from the path
        const newPath = currentPath.slice(1);
        setCurrentPath(newPath);

        // If there are more positions, continue moving
        if (newPath.length > 0) {
          animationStartTime = Date.now();
          setMovementProgress(0);
        } else {
          // Path complete - check if there's an object at destination and interact with it
          setIsMoving(false);
          setMovementProgress(0);

          // Check if we arrived at a tile with an object and trigger interaction
          const destTile = worldMap.tiles[nextPosition.y]?.[nextPosition.x];
          if (destTile) {
            const hasStaticObject = destTile.staticObject;
            const hasDynamicObject = worldMap.dynamicObjects.some(
              obj => obj.position.x === nextPosition.x && obj.position.y === nextPosition.y && obj.isActive
            );

            // If there's an object at destination, call onTileClick with isPathMovement = false
            // to trigger the object interaction (open chest, enter town, etc.)
            if ((hasStaticObject || hasDynamicObject) && onTileClick) {
              onTileClick(nextPosition.x, nextPosition.y, false);
            }
          }
        }
      }
    };

    const intervalId = setInterval(moveStep, 16); // ~60fps

    return () => clearInterval(intervalId);
  }, [currentPath, isMoving, onTileClick, playerPosition]);

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
   * Handle cancel movement
   *
   * @description Stops current movement and clears the path at current position.
   */
  const handleCancelMovement = () => {
    if (!isMoving || !currentPath) return;

    console.log('⛔ Cancelling movement at current position');

    // Stop movement and clear path
    setIsMoving(false);
    setCurrentPath(null);
    setMovementProgress(0);

    // Call parent callback if provided
    if (onCancelMovement) {
      onCancelMovement();
    }
  };

  /**
   * Handle canvas click
   *
   * @description Processes mouse click events on canvas, calculates clicked tile position,
   * and triggers pathfinding to move player step-by-step to the destination
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

    // Don't allow new path while already moving
    if (isMoving) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Calculate tile position (TILE_SIZE already includes zoom)
    const tileX = Math.floor(clickX / TILE_SIZE + viewport.x);
    const tileY = Math.floor(clickY / TILE_SIZE + viewport.y);

    if (tileX >= 0 && tileX < worldMap.width && tileY >= 0 && tileY < worldMap.height) {
      const tile = worldMap.tiles[tileY][tileX];

      // Check if clicking on the player's current position
      const isCurrentPosition = tileX === playerPosition.x && tileY === playerPosition.y;

      // If clicking on current position with an object, interact with it directly (no movement needed)
      if (isCurrentPosition && onTileClick) {
        // Check for static or dynamic objects at current position
        const hasObject = tile.staticObject || worldMap.dynamicObjects.some(
          obj => obj.position.x === tileX && obj.position.y === tileY && obj.isActive
        );

        if (hasObject) {
          // Call onTileClick with isPathMovement = false to trigger object interaction
          onTileClick(tileX, tileY, false);
          return;
        }
      }

      // For any other click (different position), use pathfinding
      const path = findPath(worldMap, playerPosition.x, playerPosition.y, tileX, tileY);

      if (path) {
        // Set the path and start movement
        setCurrentPath(path);
        setIsMoving(true);
        setMovementProgress(0);
      } else {
        // No path found (destination is unreachable)
        console.log('No path found to destination');
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
   * Handle mouse wheel zoom with useCallback to prevent re-creating on every render
   *
   * @description Processes mouse wheel events to zoom in/out on the map
   * @param e - Native wheel event from canvas
   *
   * @example
   * ```typescript
   * canvas.addEventListener('wheel', handleWheel, { passive: false });
   * ```
   */
  const handleWheel = useCallback((e: WheelEvent): void => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta);
  }, []);

  /**
   * Setup wheel event listener with passive: false
   * This prevents the "Unable to preventDefault inside passive event listener" warning
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Add wheel event listener with { passive: false } to allow preventDefault
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // Cleanup
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  /**
   * Calculate distance and cost for hovered tile (memoized)
   *
   * @description Computes travel distance and energy cost from player position to hovered tile.
   * Also checks for dynamic objects (wandering monsters, traveling merchants) at the hovered position.
   * Memoized to prevent unnecessary recalculations on unrelated state changes.
   * @returns Object with tile info, distance, cost, explored status, and optional dynamic object, or null if no hover
   *
   * @example
   * ```typescript
   * if (hoverInfo) {
   *   console.log(`Distance: ${hoverInfo.distance}, Cost: ${hoverInfo.totalCost}`);
   * }
   * ```
   */
  const hoverInfo = useMemo((): { tile: Tile; distance: number; totalCost: number; isExplored: boolean; dynamicObject?: DynamicObject } | null => {
    if (!hoveredTile) return null;
    const tile = worldMap.tiles[hoveredTile.y]?.[hoveredTile.x];
    if (!tile) return null;

    const distance = Math.abs(hoveredTile.x - playerPosition.x) + Math.abs(hoveredTile.y - playerPosition.y);
    const costPerTile = Math.ceil(tile.movementCost / 100);
    const totalCost = distance * costPerTile;

    // Check if there's an active dynamic object at this position
    const dynamicObject = worldMap.dynamicObjects.find(
      obj => obj.isActive && obj.position.x === hoveredTile.x && obj.position.y === hoveredTile.y
    );

    return {
      tile,
      distance,
      totalCost,
      isExplored: tile.isExplored,
      dynamicObject
    };
  }, [hoveredTile, worldMap.tiles, worldMap.dynamicObjects, playerPosition.x, playerPosition.y]);

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
          {/* Dynamic Object Info (wandering monsters, traveling merchants) */}
          {hoverInfo.dynamicObject && (
            <div style={styles.tooltipRow}>
              <span>
                {hoverInfo.dynamicObject.type === 'wanderingMonster' && '👾'}
                {hoverInfo.dynamicObject.type === 'travelingMerchant' && '🧳'}
                {hoverInfo.dynamicObject.type === 'encounter' && '⚔️'}
                {hoverInfo.dynamicObject.type === 'event' && '❗'}
              </span>
              <span style={{ ...styles.tooltipValue, color: '#f59e0b', fontWeight: 'bold' }}>
                {hoverInfo.dynamicObject.type === 'wanderingMonster' && 'Wandering Monster'}
                {hoverInfo.dynamicObject.type === 'travelingMerchant' && 'Traveling Merchant'}
                {hoverInfo.dynamicObject.type === 'encounter' && 'Encounter'}
                {hoverInfo.dynamicObject.type === 'event' && 'Event'}
              </span>
            </div>
          )}
          {/* Static Object Info (towns, dungeons, portals, etc.) */}
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
          {/* Terrain Info (always show if no dynamic object) */}
          {!hoverInfo.dynamicObject && (
            <div style={styles.tooltipRow}>
              <span>{t('worldmap.terrain')}:</span>
              <span style={styles.tooltipValue}>{hoverInfo.tile.terrain}</span>
            </div>
          )}
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
        style={styles.canvas}
      />

      {/* Render Current Player Chat Bubble */}
      {playerChatMessage && playerChatTimestamp && (
        <div
          style={{
            position: 'absolute',
            left: `${VIEWPORT_WIDTH / 2 + 10}px`, // Offset 10px to the right to center above avatar head
            top: `${VIEWPORT_HEIGHT / 2}px`,
            zIndex: 150 // Above canvas and other players
          }}
        >
          <ChatBubble
            message={playerChatMessage}
            timestamp={playerChatTimestamp}
          />
        </div>
      )}

      {/* Cancel Movement Button - shown when player is moving */}
      {isMoving && currentPath && currentPath.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: `${VIEWPORT_WIDTH / 2}px`,
            top: `${VIEWPORT_HEIGHT / 2 + 45}px`, // Below player avatar
            transform: 'translateX(-50%)', // Center horizontally
            zIndex: 160 // Above everything
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCancelMovement();
            }}
            style={{
              padding: `${SPACING[1]} ${SPACING[4]}`,
              backgroundColor: `${COLORS.danger}F2`,
              color: COLORS.white,
              border: `2px solid ${COLORS.dangerDark}`,
              borderRadius: BORDER_RADIUS.md,
              fontSize: FONT_SIZE[13],
              fontWeight: FONT_WEIGHT.bold,
              cursor: 'pointer',
              boxShadow: `${SHADOWS.md}, ${SHADOWS.glowRed}`,
              transition: TRANSITIONS.allBase,
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              textShadow: SHADOWS.md
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.dangerDark;
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = `${SHADOWS.lg}, ${SHADOWS.glowRed}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `${COLORS.danger}F2`;
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `${SHADOWS.md}, ${SHADOWS.glowRed}`;
            }}
          >
            ⛔ {t('worldmap.cancelMovement')}
          </button>
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
              zIndex: 100 + player.y // Above canvas (zIndex: 1) but below UI elements (zIndex: 10+)
            }}
          >
            {/* Chat Bubble (if message exists and recent) */}
            {player.chatMessage && player.chatTimestamp && (
              <ChatBubble
                message={player.chatMessage}
                timestamp={player.chatTimestamp}
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
    backgroundColor: COLORS.bgDarkSolid,
    color: COLORS.white
  },
  controls: {
    position: 'absolute',
    top: SPACING[2],
    right: SPACING[2],
    ...flexCenter,
    gap: SPACING[2],
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    padding: `${SPACING[2]} ${SPACING[3]}`,
    borderRadius: BORDER_RADIUS.md,
    border: `1px solid ${COLORS.borderDark}`,
    zIndex: Z_INDEX.sticky,
    backdropFilter: 'blur(10px)',
    boxShadow: SHADOWS.lg
  },
  button: {
    padding: `${SPACING[1]} ${SPACING[3]}`,
    backgroundColor: COLORS.successLight,
    color: COLORS.white,
    border: 'none',
    borderRadius: BORDER_RADIUS.sm,
    cursor: 'pointer',
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    minWidth: '32px'
  },
  info: {
    fontSize: FONT_SIZE[13],
    color: COLORS.gold,
    fontWeight: FONT_WEIGHT.bold
  },
  tooltip: {
    position: 'absolute',
    top: SPACING[2],
    left: SPACING[2],
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    padding: `${SPACING[3]} ${SPACING[4]}`,
    borderRadius: BORDER_RADIUS.md,
    border: `2px solid ${COLORS.primary}`,
    zIndex: Z_INDEX.sticky,
    backdropFilter: 'blur(10px)',
    boxShadow: SHADOWS.lg,
    minWidth: '180px'
  },
  tooltipRow: {
    ...flexBetween,
    marginBottom: SPACING[1],
    fontSize: FONT_SIZE[13],
    color: COLORS.textGray,
    gap: SPACING[3]
  },
  tooltipValue: {
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textLight,
    textTransform: 'capitalize'
  },
  canvas: {
    cursor: 'crosshair',
    display: 'block',
    width: '100%',
    height: '100%',
    position: 'relative',
    zIndex: Z_INDEX.base
  }
};
