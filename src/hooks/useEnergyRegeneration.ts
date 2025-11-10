/**
 * useEnergyRegeneration Hook - Automatic energy regeneration system
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-08
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

      // Only update if we're below max energy and would add at least 0.1 energy
      if (currentEnergy < maxEnergy && energyToAdd >= 0.1) {
        const newEnergy = Math.min(maxEnergy, currentEnergy + energyToAdd);
        onEnergyChange(Math.floor(newEnergy)); // Floor to avoid decimals
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
    isRegenerating: enabled && currentEnergy < maxEnergy,
    timeToFull: currentEnergy < maxEnergy
      ? Math.ceil(((maxEnergy - currentEnergy) / regenRate) * 60) // minutes
      : 0
  };
}
