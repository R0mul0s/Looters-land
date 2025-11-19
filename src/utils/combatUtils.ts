/**
 * Combat Utility Functions
 *
 * Helper functions for combat system
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import { COMBAT_CONFIG } from '../config/BALANCE_CONFIG';
import type { CombatSpeed } from '../components/combat/CombatSpeedControl';

/**
 * Get delay in milliseconds for given combat speed
 */
export function getSpeedDelay(speed: CombatSpeed): number {
  return COMBAT_CONFIG.SPEED_PRESETS[speed];
}
