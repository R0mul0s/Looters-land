/**
 * Debug Test Combat Script
 *
 * Utility for testing combat improvements with various enemy compositions
 *
 * Usage in browser console:
 * ```
 * import { startTestCombat } from './debug/testCombat';
 * startTestCombat('mixed'); // or 'boss', 'elite', 'swarm'
 * ```
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import { Enemy } from '../engine/combat/Enemy';

/**
 * Test combat scenarios
 */
export type TestScenario = 'mixed' | 'boss' | 'elite' | 'swarm' | 'tough';

/**
 * Create test enemies for different scenarios
 */
export function createTestEnemies(scenario: TestScenario, playerLevel: number = 5): Enemy[] {
  const enemies: Enemy[] = [];

  switch (scenario) {
    case 'mixed':
      // 1 normal, 1 elite, varied levels
      enemies.push(new Enemy('Goblin Warrior', playerLevel - 1, 'normal'));
      enemies.push(new Enemy('Orc Champion', playerLevel + 1, 'elite'));
      enemies.push(new Enemy('Dark Mage', playerLevel, 'normal'));
      break;

    case 'boss':
      // Boss fight with 2 adds
      enemies.push(new Enemy('Goblin Minion', playerLevel - 2, 'normal'));
      enemies.push(new Enemy('Dragon Lord', playerLevel + 2, 'boss'));
      enemies.push(new Enemy('Goblin Shaman', playerLevel - 1, 'normal'));
      break;

    case 'elite':
      // Multiple elite enemies
      enemies.push(new Enemy('Elite Guard', playerLevel, 'elite'));
      enemies.push(new Enemy('Elite Mage', playerLevel, 'elite'));
      enemies.push(new Enemy('Elite Archer', playerLevel + 1, 'elite'));
      break;

    case 'swarm':
      // Many weak enemies
      enemies.push(new Enemy('Rat', playerLevel - 3, 'normal'));
      enemies.push(new Enemy('Bat', playerLevel - 3, 'normal'));
      enemies.push(new Enemy('Spider', playerLevel - 2, 'normal'));
      enemies.push(new Enemy('Snake', playerLevel - 2, 'normal'));
      enemies.push(new Enemy('Wolf', playerLevel - 1, 'normal'));
      break;

    case 'tough':
      // High level enemies
      enemies.push(new Enemy('Demon Knight', playerLevel + 3, 'elite'));
      enemies.push(new Enemy('Ancient Dragon', playerLevel + 5, 'boss'));
      break;

    default:
      // Default: simple mixed fight
      enemies.push(new Enemy('Goblin', playerLevel, 'normal'));
      enemies.push(new Enemy('Orc', playerLevel + 1, 'normal'));
  }

  return enemies;
}

/**
 * Print test scenario info to console
 */
export function printTestScenario(scenario: TestScenario, enemies: Enemy[]): void {
  console.log('\n=================================');
  console.log(`🎮 TEST COMBAT SCENARIO: ${scenario.toUpperCase()}`);
  console.log('=================================');
  console.log('\n📋 Enemies:');

  enemies.forEach((enemy, idx) => {
    const typeIcon = enemy.type === 'boss' ? '💀' : enemy.type === 'elite' ? '⭐' : '👹';
    console.log(`  ${idx + 1}. ${typeIcon} ${enemy.name} (Lv.${enemy.level}, ${enemy.type})`);
    console.log(`     HP: ${enemy.currentHP}/${enemy.maxHP} | ATK: ${enemy.ATK} | DEF: ${enemy.DEF} | SPD: ${enemy.SPD}`);
  });

  console.log('\n✨ Combat Features to Test:');
  console.log('  ▶️  Combat Speed Controls (1x/2x/4x)');
  console.log('  📊 Initiative Order Bar');
  console.log('  ⭐ Active Character Highlighting');
  console.log('  📱 Responsive Layout (resize window)');
  console.log('  💬 Enemy Tooltips (hover over enemies)');
  console.log('\n=================================\n');
}

/**
 * Available test scenarios with descriptions
 */
export const TEST_SCENARIOS = {
  mixed: {
    name: 'Mixed Fight',
    description: '3 enemies: 1 normal, 1 elite, varied levels',
    difficulty: 'Medium'
  },
  boss: {
    name: 'Boss Fight',
    description: '1 boss + 2 minions',
    difficulty: 'Hard'
  },
  elite: {
    name: 'Elite Squad',
    description: '3 elite enemies',
    difficulty: 'Very Hard'
  },
  swarm: {
    name: 'Swarm',
    description: '5 weak enemies to test initiative order',
    difficulty: 'Easy'
  },
  tough: {
    name: 'Tough Challenge',
    description: '1 elite + 1 boss, high level',
    difficulty: 'Extreme'
  }
};

/**
 * Print available scenarios
 */
export function printAvailableScenarios(): void {
  console.log('\n🎯 AVAILABLE TEST SCENARIOS:\n');

  Object.entries(TEST_SCENARIOS).forEach(([key, scenario]) => {
    console.log(`  ${key.padEnd(10)} - ${scenario.name.padEnd(20)} [${scenario.difficulty}]`);
    console.log(`                ${scenario.description}`);
  });

  console.log('\n💡 Usage in browser console:');
  console.log('  window.startTestCombat("mixed")');
  console.log('  window.startTestCombat("boss")');
  console.log('  window.startTestCombat("swarm")');
  console.log('\n');
}

// Make it globally available for browser console
if (typeof window !== 'undefined') {
  (window as any).createTestEnemies = createTestEnemies;
  (window as any).printTestScenario = printTestScenario;
  (window as any).printAvailableScenarios = printAvailableScenarios;
  (window as any).TEST_SCENARIOS = TEST_SCENARIOS;
}
