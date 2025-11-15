/**
 * WorldMap Demo Component
 *
 * Demo page for testing worldmap generation and visualization.
 * Can be accessed separately to test worldmap features.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React, { useState } from 'react';
import { WorldMapGenerator } from '../engine/worldmap/WorldMapGenerator';
import { WorldMapViewer } from './WorldMapViewer';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITIONS } from '../styles/tokens';
import { flexColumn, flexCenter } from '../styles/common';
import type { WorldMap, StaticObject, Town, DungeonEntrance } from '../types/worldmap.types';

/**
 * WorldMap Demo Component
 *
 * @returns React component
 */
export function WorldMapDemo() {
  const [worldMap, setWorldMap] = useState<WorldMap | null>(null);
  const [playerPos, setPlayerPos] = useState({ x: 25, y: 25 });
  const [seed, setSeed] = useState('demo-world-123');
  const [selectedObject, setSelectedObject] = useState<StaticObject | null>(null);
  const [log, setLog] = useState<string[]>([]);

  /**
   * Generate new worldmap
   */
  const handleGenerateWorld = () => {
    addLog('🗺️ Generating new worldmap...');

    const newWorld = WorldMapGenerator.generate({
      width: 50,
      height: 50,
      seed,
      townCount: 4,
      dungeonCount: 5,
      encounterCount: 15,
      resourceCount: 50
    });

    setWorldMap(newWorld);

    // Set player at capital (center)
    const capital = newWorld.staticObjects.find(
      obj => obj.type === 'town' && obj.name === 'Capital'
    );
    if (capital) {
      setPlayerPos(capital.position);
      // Reveal tiles around capital
      revealArea(newWorld, capital.position.x, capital.position.y, 5);
    }

    addLog(`✅ Worldmap generated! Size: ${newWorld.width}x${newWorld.height}`);
    addLog(`  🏰 Towns: ${newWorld.staticObjects.filter(o => o.type === 'town').length}`);
    addLog(`  🕳️ Dungeons: ${newWorld.staticObjects.filter(o => o.type === 'dungeon').length}`);
    addLog(`  ⚔️ Encounters: ${newWorld.dynamicObjects.filter(o => o.type === 'encounter').length}`);
    addLog(`  💎 Resources: ${newWorld.dynamicObjects.filter(o => o.type === 'resource').length}`);
  };

  /**
   * Reveal tiles in area (for fog of war)
   */
  const revealArea = (world: WorldMap, centerX: number, centerY: number, radius: number) => {
    for (let y = centerY - radius; y <= centerY + radius; y++) {
      for (let x = centerX - radius; x <= centerX + radius; x++) {
        if (world.tiles[y]?.[x]) {
          world.tiles[y][x].isExplored = true;
        }
      }
    }
  };

  /**
   * Handle tile click
   */
  const handleTileClick = (x: number, y: number) => {
    if (!worldMap) return;

    const tile = worldMap.tiles[y]?.[x];
    if (!tile) return;

    addLog(`📍 Clicked tile (${x}, ${y}) - ${tile.terrain} (${tile.biome})`);

    // Move player
    setPlayerPos({ x, y });

    // Reveal area around player
    revealArea(worldMap, x, y, 3);
    setWorldMap({ ...worldMap }); // Force re-render
  };

  /**
   * Handle object click (town, dungeon)
   */
  const handleObjectClick = (object: StaticObject) => {
    setSelectedObject(object);

    if (object.type === 'town') {
      const town = object as Town;
      addLog(`🏰 Entered ${town.name} (${town.faction}, Level ${town.level})`);
    } else if (object.type === 'dungeon') {
      const dungeon = object as DungeonEntrance;
      addLog(`🕳️ Found ${dungeon.name} (${dungeon.difficulty}, Recommended Level: ${dungeon.recommendedLevel})`);
    }
  };

  /**
   * Add message to log
   */
  const addLog = (message: string) => {
    setLog(prev => [...prev.slice(-9), message]); // Keep last 10 messages
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.mainTitle}>🗺️ Worldmap Generator Demo</h1>
        <p style={styles.subtitle}>
          Test procedural worldmap generation with Perlin noise and HOMAM-style exploration
        </p>
      </div>

      <div style={styles.controls}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>World Seed:</label>
          <input
            type="text"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            style={styles.input}
            placeholder="Enter seed..."
          />
        </div>

        <button onClick={handleGenerateWorld} style={styles.generateButton}>
          🌍 Generate New World
        </button>

        {worldMap && (
          <div style={styles.stats}>
            <span>🏰 Towns: {worldMap.staticObjects.filter(o => o.type === 'town').length}</span>
            <span>🕳️ Dungeons: {worldMap.staticObjects.filter(o => o.type === 'dungeon').length}</span>
            <span>⚔️ Encounters: {worldMap.dynamicObjects.filter(o => o.type === 'encounter').length}</span>
            <span>💎 Resources: {worldMap.dynamicObjects.filter(o => o.type === 'resource').length}</span>
          </div>
        )}
      </div>

      {worldMap && (
        <div style={styles.content}>
          <div style={styles.mapContainer}>
            <WorldMapViewer
              worldMap={worldMap}
              playerPosition={playerPos}
              onTileClick={handleTileClick}
            />
          </div>

          <div style={styles.sidebar}>
            {selectedObject && (
              <div style={styles.objectInfo}>
                <h3 style={styles.objectTitle}>
                  {selectedObject.type === 'town' ? '🏰' : '🕳️'} {selectedObject.name}
                </h3>
                {selectedObject.type === 'town' && (
                  <div style={styles.objectDetails}>
                    <p>Faction: {(selectedObject as Town).faction}</p>
                    <p>Level: {(selectedObject as Town).level}</p>
                    <p>Buildings:</p>
                    <ul style={styles.buildingList}>
                      {Object.entries((selectedObject as Town).buildings).map(([key, value]) =>
                        value ? <li key={key}>{key}</li> : null
                      )}
                    </ul>
                  </div>
                )}
                {selectedObject.type === 'dungeon' && (
                  <div style={styles.objectDetails}>
                    <p>Difficulty: {(selectedObject as DungeonEntrance).difficulty}</p>
                    <p>Max Floors: {(selectedObject as DungeonEntrance).maxFloors}</p>
                    <p>Recommended Level: {(selectedObject as DungeonEntrance).recommendedLevel}</p>
                    <p>Theme: {(selectedObject as DungeonEntrance).theme}</p>
                  </div>
                )}
              </div>
            )}

            <div style={styles.logContainer}>
              <h3 style={styles.logTitle}>📜 Event Log</h3>
              <div style={styles.logContent}>
                {log.map((msg, i) => (
                  <div key={i} style={styles.logEntry}>{msg}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!worldMap && (
        <div style={styles.placeholder}>
          <h2>👆 Click "Generate New World" to create a worldmap</h2>
          <p>Features:</p>
          <ul style={styles.featureList}>
            <li>✨ Procedural terrain generation with Perlin noise</li>
            <li>🏰 Fixed town placements (4 towns)</li>
            <li>🕳️ Fixed dungeon entrances (5 dungeons)</li>
            <li>🛤️ Roads connecting towns</li>
            <li>⚔️ Dynamic enemy encounters</li>
            <li>💎 Resource nodes (gold, wood, stone, ore, gems)</li>
            <li>🌫️ Fog of war (explore to reveal)</li>
            <li>🧙 Player movement (click tiles to move)</li>
          </ul>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: COLORS.bgDarkSolid,
    color: COLORS.textPrimary,
    padding: SPACING[5]
  },
  header: {
    textAlign: 'center',
    marginBottom: SPACING[6]
  },
  mainTitle: {
    fontSize: FONT_SIZE['5xl'],
    margin: `0 0 ${SPACING[2]} 0`
  },
  subtitle: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
    margin: 0
  },
  controls: {
    display: 'flex',
    gap: SPACING[5],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[6],
    flexWrap: 'wrap'
  },
  inputGroup: {
    display: 'flex',
    gap: SPACING[2],
    alignItems: 'center'
  },
  label: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSlate
  },
  input: {
    padding: `${SPACING[2]} ${SPACING[3]}`,
    backgroundColor: COLORS.bgInput,
    border: `1px solid ${COLORS.borderDarker}`,
    borderRadius: BORDER_RADIUS.md,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    minWidth: '200px'
  },
  generateButton: {
    padding: `${SPACING[2]} ${SPACING[5]}`,
    backgroundColor: COLORS.successLight,
    color: COLORS.textPrimary,
    border: 'none',
    borderRadius: BORDER_RADIUS.md,
    fontSize: FONT_SIZE.base,
    cursor: 'pointer',
    fontWeight: FONT_WEIGHT.bold,
    transition: TRANSITIONS.allFast
  },
  stats: {
    display: 'flex',
    gap: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSlate
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 350px',
    gap: SPACING[5]
  },
  mapContainer: {
    ...flexCenter,
    justifyContent: 'center'
  },
  sidebar: {
    ...flexColumn,
    gap: SPACING[5]
  },
  objectInfo: {
    backgroundColor: COLORS.bgCardDark,
    padding: SPACING[5],
    borderRadius: BORDER_RADIUS.lg,
    border: `2px solid ${COLORS.borderDarker}`
  },
  objectTitle: {
    margin: `0 0 ${SPACING.md} 0`,
    fontSize: FONT_SIZE.xl
  },
  objectDetails: {
    fontSize: FONT_SIZE.md,
    lineHeight: '1.8'
  },
  buildingList: {
    margin: `${SPACING.xs} 0 0 ${SPACING[5]}`,
    padding: 0
  },
  logContainer: {
    backgroundColor: COLORS.bgCardDark,
    padding: SPACING[5],
    borderRadius: BORDER_RADIUS.lg,
    border: `2px solid ${COLORS.borderDarker}`,
    flex: 1
  },
  logTitle: {
    margin: `0 0 ${SPACING.md} 0`,
    fontSize: FONT_SIZE.lg
  },
  logContent: {
    ...flexColumn,
    gap: SPACING.xs,
    fontSize: FONT_SIZE[13],
    color: COLORS.textSlate,
    maxHeight: '400px',
    overflowY: 'auto'
  },
  logEntry: {
    padding: `${SPACING.xs} 0`,
    borderBottom: `1px solid ${COLORS.borderDark}`
  },
  placeholder: {
    textAlign: 'center',
    padding: `${SPACING[16]} ${SPACING[5]}`,
    backgroundColor: COLORS.bgCardDark,
    borderRadius: BORDER_RADIUS.lg,
    border: `2px dashed ${COLORS.borderDarker}`
  },
  featureList: {
    textAlign: 'left',
    display: 'inline-block',
    fontSize: FONT_SIZE.md,
    lineHeight: '2'
  }
};
