/**
 * Named Enemies - Special enemies for wandering monsters and rare spawns
 *
 * Defines unique named enemies with custom stats for worldmap encounters.
 * These enemies appear as wandering monsters (Elite) and rare spawns (Boss).
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-13
 */

import { Enemy } from './Enemy';
import type { EnemyType } from '../../types/combat.types';

/**
 * Named enemy configuration
 */
export interface NamedEnemyConfig {
  name: string;
  type: EnemyType;
  description: string;
  statMultipliers?: {
    hp?: number;
    atk?: number;
    def?: number;
    spd?: number;
    crit?: number;
  };
}

/**
 * Named enemies database
 * These match the monsters shown on the worldmap
 */
export const NAMED_ENEMIES: Record<string, NamedEnemyConfig> = {
  // === RARE SPAWNS (Boss tier) ===
  'Ancient Golem': {
    name: 'Ancient Golem',
    type: 'boss',
    description: 'A massive stone construct from ancient times',
    statMultipliers: { hp: 1.2, def: 1.3, atk: 0.9 } // Tanky but slower
  },
  'Frost Giant': {
    name: 'Frost Giant',
    type: 'boss',
    description: 'A towering giant wielding frost magic',
    statMultipliers: { hp: 1.1, atk: 1.2, def: 1.1 }
  },
  'Shadow Dragon': {
    name: 'Shadow Dragon',
    type: 'boss',
    description: 'A dragon corrupted by shadow magic',
    statMultipliers: { hp: 1.3, atk: 1.3, spd: 1.1 }
  },
  'Phoenix': {
    name: 'Phoenix',
    type: 'boss',
    description: 'A legendary firebird that rises from ashes',
    statMultipliers: { hp: 0.9, atk: 1.4, spd: 1.3, crit: 1.5 }
  },

  // === WANDERING MONSTERS (Elite tier) ===
  'Dire Wolf': {
    name: 'Dire Wolf',
    type: 'elite',
    description: 'A massive wolf with razor-sharp fangs',
    statMultipliers: { spd: 1.2, crit: 1.3 }
  },
  'Troll': {
    name: 'Troll',
    type: 'elite',
    description: 'A brutish troll with regenerative abilities',
    statMultipliers: { hp: 1.2, def: 1.1 }
  },
  'Ogre': {
    name: 'Ogre',
    type: 'elite',
    description: 'A hulking ogre with immense strength',
    statMultipliers: { hp: 1.1, atk: 1.2 }
  },
  'Harpy': {
    name: 'Harpy',
    type: 'elite',
    description: 'A vicious harpy with deadly talons',
    statMultipliers: { spd: 1.3, atk: 1.1 }
  },
  'Manticore': {
    name: 'Manticore',
    type: 'elite',
    description: 'A deadly chimera with a scorpion tail',
    statMultipliers: { atk: 1.2, crit: 1.2 }
  },
  'Wyvern': {
    name: 'Wyvern',
    type: 'elite',
    description: 'A lesser dragon with venomous breath',
    statMultipliers: { hp: 1.1, atk: 1.2, spd: 1.1 }
  },
  'Bandit Leader': {
    name: 'Bandit Leader',
    type: 'elite',
    description: 'A cunning outlaw commanding bandits',
    statMultipliers: { atk: 1.1, spd: 1.2, crit: 1.2 }
  },
  'Dark Knight': {
    name: 'Dark Knight',
    type: 'elite',
    description: 'A fallen knight wielding dark magic',
    statMultipliers: { hp: 1.1, atk: 1.1, def: 1.2 }
  }
};

/**
 * Create a named enemy with custom stats
 */
export function createNamedEnemy(enemyName: string, level: number): Enemy {
  const config = NAMED_ENEMIES[enemyName];

  if (!config) {
    console.warn(`Named enemy "${enemyName}" not found, creating generic enemy`);
    return new Enemy(enemyName, level, 'elite');
  }

  const enemy = new Enemy(config.name, level, config.type);

  // Apply stat multipliers
  if (config.statMultipliers) {
    const mult = config.statMultipliers;
    if (mult.hp) enemy.maxHP = Math.floor(enemy.maxHP * mult.hp);
    if (mult.atk) enemy.ATK = Math.floor(enemy.ATK * mult.atk);
    if (mult.def) enemy.DEF = Math.floor(enemy.DEF * mult.def);
    if (mult.spd) enemy.SPD = Math.floor(enemy.SPD * mult.spd);
    if (mult.crit) enemy.CRIT = enemy.CRIT * mult.crit;

    // Update current HP to match new max
    enemy.currentHP = enemy.maxHP;
  }

  return enemy;
}

/**
 * Generate a combat encounter for wandering monster
 * Boss enemy + 2-3 normal minions
 */
export function generateWanderingMonsterEncounter(
  enemyName: string,
  level: number,
  difficulty: 'Normal' | 'Elite'
): Enemy[] {
  const enemies: Enemy[] = [];

  // Main boss enemy (the named one)
  const boss = createNamedEnemy(enemyName, level);
  enemies.push(boss);

  // Add minions based on difficulty
  const minionCount = difficulty === 'Elite' ? 3 : 2;
  const minionLevel = Math.max(1, level - 1); // Minions are 1 level lower

  for (let i = 0; i < minionCount; i++) {
    const minion = new Enemy(getRandomMinionName(), minionLevel, 'normal');
    enemies.push(minion);
  }

  return enemies;
}

/**
 * Generate a combat encounter for rare spawn
 * Boss enemy + 3-4 elite minions (harder than wandering)
 */
export function generateRareSpawnEncounter(
  enemyName: string,
  level: number
): Enemy[] {
  const enemies: Enemy[] = [];

  // Main boss enemy (the named one)
  const boss = createNamedEnemy(enemyName, level);
  enemies.push(boss);

  // Add elite minions
  const minionCount = 3 + Math.floor(Math.random() * 2); // 3-4 minions
  const minionLevel = Math.max(1, level - 1); // Minions are 1 level lower

  for (let i = 0; i < minionCount; i++) {
    const minion = new Enemy(getRandomMinionName(), minionLevel, 'elite');
    enemies.push(minion);
  }

  return enemies;
}

/**
 * Get a random minion name
 */
function getRandomMinionName(): string {
  const minionNames = [
    'Goblin', 'Orc', 'Skeleton', 'Spider', 'Wolf',
    'Bandit', 'Zombie', 'Imp', 'Slime', 'Bat'
  ];
  return minionNames[Math.floor(Math.random() * minionNames.length)];
}

/**
 * Check if an enemy name is a named boss
 */
export function isNamedEnemy(enemyName: string): boolean {
  return enemyName in NAMED_ENEMIES;
}

/**
 * Get all named enemy names for a specific type
 */
export function getNamedEnemiesByType(type: 'boss' | 'elite'): string[] {
  return Object.entries(NAMED_ENEMIES)
    .filter(([, config]) => config.type === type)
    .map(([name]) => name);
}
