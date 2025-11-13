/**
 * Pathfinding utility using A* algorithm
 * Finds optimal path between two points on a grid, avoiding obstacles
 */

import type { WorldMap, TerrainType } from '../types/worldmap.types';

export interface PathNode {
  x: number;
  y: number;
  g: number; // Cost from start to this node
  h: number; // Heuristic cost from this node to end
  f: number; // Total cost (g + h)
  parent: PathNode | null;
}

/**
 * Check if a tile is walkable (not water or mountains)
 */
function isWalkable(worldMap: WorldMap, x: number, y: number): boolean {
  if (x < 0 || x >= worldMap.width || y < 0 || y >= worldMap.height) {
    return false;
  }

  const tile = worldMap.tiles[y][x];

  // Water and mountains are not walkable
  if (tile.terrain === 'water' || tile.terrain === 'mountains') {
    return false;
  }

  return true;
}

/**
 * Calculate movement cost for a terrain type
 */
function getTerrainCost(terrain: TerrainType): number {
  switch (terrain) {
    case 'plains':
      return 1;
    case 'forest':
      return 1.5;
    case 'desert':
      return 1.3;
    case 'swamp':
      return 2;
    case 'road':
      return 0.75;
    case 'mountains':
    case 'water':
      return Infinity; // Impassable
    default:
      return 1;
  }
}

/**
 * Manhattan distance heuristic
 */
function heuristic(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Find path using A* algorithm
 * Returns array of coordinates from start to end (excluding start, including end)
 */
export function findPath(
  worldMap: WorldMap,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): { x: number; y: number }[] | null {
  // If start or end is not walkable, return null
  if (!isWalkable(worldMap, startX, startY) || !isWalkable(worldMap, endX, endY)) {
    return null;
  }

  // If already at destination
  if (startX === endX && startY === endY) {
    return [];
  }

  const openSet: PathNode[] = [];
  const closedSet = new Set<string>();

  // Start node
  const startNode: PathNode = {
    x: startX,
    y: startY,
    g: 0,
    h: heuristic(startX, startY, endX, endY),
    f: 0,
    parent: null
  };
  startNode.f = startNode.g + startNode.h;
  openSet.push(startNode);

  const getKey = (x: number, y: number) => `${x},${y}`;

  while (openSet.length > 0) {
    // Find node with lowest f cost
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;

    // Reached destination
    if (current.x === endX && current.y === endY) {
      const path: { x: number; y: number }[] = [];
      let node: PathNode | null = current;
      while (node && node.parent) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }

    closedSet.add(getKey(current.x, current.y));

    // Check all 4 neighbors (up, down, left, right)
    const neighbors = [
      { x: current.x, y: current.y - 1 }, // Up
      { x: current.x, y: current.y + 1 }, // Down
      { x: current.x - 1, y: current.y }, // Left
      { x: current.x + 1, y: current.y }  // Right
    ];

    for (const neighbor of neighbors) {
      const { x, y } = neighbor;

      // Skip if not walkable or already evaluated
      if (!isWalkable(worldMap, x, y) || closedSet.has(getKey(x, y))) {
        continue;
      }

      const terrain = worldMap.tiles[y][x].terrain;
      const movementCost = getTerrainCost(terrain);
      const gScore = current.g + movementCost;

      // Check if this node is already in open set
      let neighborNode = openSet.find(n => n.x === x && n.y === y);

      if (!neighborNode) {
        // New node
        neighborNode = {
          x,
          y,
          g: gScore,
          h: heuristic(x, y, endX, endY),
          f: 0,
          parent: current
        };
        neighborNode.f = neighborNode.g + neighborNode.h;
        openSet.push(neighborNode);
      } else if (gScore < neighborNode.g) {
        // Better path found
        neighborNode.g = gScore;
        neighborNode.f = neighborNode.g + neighborNode.h;
        neighborNode.parent = current;
      }
    }
  }

  // No path found
  return null;
}
