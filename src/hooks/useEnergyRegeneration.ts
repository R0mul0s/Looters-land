/**
 * useEnergyRegeneration Hook - Automatic energy regeneration system
 *
 * ⚠️ **DEPRECATED** - No longer used as of 2025-11-18
 *
 * Energy regeneration is now handled by hourly cron job in database:
 * - Migration: supabase/migrations/20251118_add_hourly_energy_regen.sql
 * - Function: regenerate_player_energy()
 * - Schedule: Every hour at :00 minutes
 *
 * This hook was disabled because:
 * 1. Caused duplicate regeneration when multiple tabs were open
 * 2. Only worked when game was open (no offline regeneration)
 * 3. Created race conditions with Realtime updates
 *
 * Server-side cron job provides:
 * - Consistent regeneration for all players
 * - Works even when game is closed (offline regeneration)
 * - No duplicate regeneration issues
 * - No race conditions
 *
 * @deprecated Use database cron job instead (see migration file)
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-18
 */

import { useEffect, useRef } from 'react';

interface EnergyRegenerationConfig {
  currentEnergy: number;
  maxEnergy: number;
  onEnergyChange: (newEnergy: number) => void;
  regenRate?: number; // Energy per hour (default: 10)
  enabled?: boolean; // Enable/disable regeneration
}

/**
 * Hook for automatic energy regeneration
 * Regenerates energy over time at specified rate
 *
 * @deprecated This hook is no longer used. Energy regeneration is now handled by database cron job.
 * @see supabase/migrations/20251118_add_hourly_energy_regen.sql
 * @param config - Energy regeneration configuration
 */
export function useEnergyRegeneration(config: EnergyRegenerationConfig) {
  const {
    currentEnergy,
    maxEnergy,
    onEnergyChange,
    regenRate = 10, // Default: 10 energy per hour
    enabled = true
  } = config;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  // Use refs to avoid stale closure - always get current values
  const currentEnergyRef = useRef(currentEnergy);
  const maxEnergyRef = useRef(maxEnergy);
  const onEnergyChangeRef = useRef(onEnergyChange);

  // Update refs whenever values change
  useEffect(() => {
    currentEnergyRef.current = currentEnergy;
    maxEnergyRef.current = maxEnergy;
    onEnergyChangeRef.current = onEnergyChange;
  }, [currentEnergy, maxEnergy, onEnergyChange]);

  useEffect(() => {
    // Don't start if disabled
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // If already running, don't restart
    if (intervalRef.current) {
      return;
    }

    // Initialize last tick time
    lastTickRef.current = Date.now();

    // Calculate milliseconds per energy point
    const msPerEnergy = (60 * 60 * 1000) / regenRate; // Hour in ms divided by rate

    // Regeneration tick (runs every minute for smooth updates)
    const TICK_INTERVAL = 60 * 1000; // 1 minute

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const timePassed = now - lastTickRef.current;
      lastTickRef.current = now;

      // Calculate energy to add based on time passed
      const energyToAdd = timePassed / msPerEnergy;

      // Use ref values to avoid stale closure
      const current = currentEnergyRef.current;
      const max = maxEnergyRef.current;

      // Only update if we're below max energy and would add at least 0.1 energy
      if (current < max && energyToAdd >= 0.1) {
        const energyToAddFloored = Math.floor(energyToAdd);
        // Only proceed if we have at least 1 full energy point to add
        if (energyToAddFloored >= 1) {
          console.log(`🔋 Energy regen: attempting to add ${energyToAddFloored} energy (from ${energyToAdd.toFixed(2)})`);
          // Calculate new energy value
          const prevEnergy = currentEnergyRef.current;
          const newEnergy = Math.min(maxEnergyRef.current, prevEnergy + energyToAddFloored);
          console.log(`🔋 Energy regen result: ${prevEnergy} + ${energyToAddFloored} = ${newEnergy} (max: ${maxEnergyRef.current})`);
          console.log(`🔋 Energy regen: calling onEnergyChange callback...`);

          // Update ref BEFORE calling callback to avoid double-regen on next tick
          currentEnergyRef.current = newEnergy;

          onEnergyChangeRef.current(newEnergy);
          console.log(`🔋 Energy regen: callback completed, ref updated to: ${currentEnergyRef.current}`);
        }
      }
    }, TICK_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [regenRate, enabled]); // Removed currentEnergy and maxEnergy from dependencies!

  // Return regeneration info for UI display
  return {
    regenRate,
    isRegenerating: enabled && currentEnergyRef.current < maxEnergyRef.current,
    timeToFull: currentEnergyRef.current < maxEnergyRef.current
      ? Math.ceil(((maxEnergyRef.current - currentEnergyRef.current) / regenRate) * 60) // minutes
      : 0
  };
}
