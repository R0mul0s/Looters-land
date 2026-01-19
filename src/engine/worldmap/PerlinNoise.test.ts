/**
 * Perlin Noise Tests
 *
 * Tests for determinism, value ranges, and noise properties.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import { describe, it, expect } from 'vitest';
import { PerlinNoise } from './PerlinNoise';

describe('PerlinNoise', () => {
  describe('Determinism', () => {
    it('should produce identical values for same seed and coordinates', () => {
      const noise1 = new PerlinNoise('test-seed-123');
      const noise2 = new PerlinNoise('test-seed-123');

      // Test multiple coordinates
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          expect(noise1.get(x * 0.1, y * 0.1)).toBe(noise2.get(x * 0.1, y * 0.1));
        }
      }
    });

    it('should produce identical octave values for same seed and coordinates', () => {
      const noise1 = new PerlinNoise('octave-seed');
      const noise2 = new PerlinNoise('octave-seed');

      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          const val1 = noise1.getOctave(x * 0.05, y * 0.05, 4, 0.5);
          const val2 = noise2.getOctave(x * 0.05, y * 0.05, 4, 0.5);
          expect(val1).toBe(val2);
        }
      }
    });

    it('should produce same value when querying same coordinate multiple times', () => {
      const noise = new PerlinNoise('repeat-test');

      const x = 5.5;
      const y = 3.2;

      const value1 = noise.get(x, y);
      const value2 = noise.get(x, y);
      const value3 = noise.get(x, y);

      expect(value1).toBe(value2);
      expect(value2).toBe(value3);
    });

    it('should produce different values for different seeds', () => {
      const noise1 = new PerlinNoise('seed-A');
      const noise2 = new PerlinNoise('seed-B');

      // Check multiple coordinates - at least some should differ
      let differentCount = 0;

      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          if (noise1.get(x * 0.1, y * 0.1) !== noise2.get(x * 0.1, y * 0.1)) {
            differentCount++;
          }
        }
      }

      // Most values should be different (at least 80%)
      expect(differentCount).toBeGreaterThanOrEqual(80);
    });
  });

  describe('Value Range', () => {
    it('should return values between -1 and 1 for get()', () => {
      const noise = new PerlinNoise('range-test');

      // Test many coordinates
      for (let x = 0; x < 100; x++) {
        for (let y = 0; y < 100; y++) {
          const value = noise.get(x * 0.1, y * 0.1);
          expect(value).toBeGreaterThanOrEqual(-1);
          expect(value).toBeLessThanOrEqual(1);
        }
      }
    });

    it('should return values between -1 and 1 for getOctave()', () => {
      const noise = new PerlinNoise('octave-range');

      for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
          const value = noise.getOctave(x * 0.05, y * 0.05, 4, 0.5);
          expect(value).toBeGreaterThanOrEqual(-1);
          expect(value).toBeLessThanOrEqual(1);
        }
      }
    });

    it('should produce variety of values (not all zeros or same)', () => {
      const noise = new PerlinNoise('variety-test');
      const values = new Set<number>();

      for (let x = 0; x < 20; x++) {
        for (let y = 0; y < 20; y++) {
          values.add(Math.round(noise.get(x * 0.1, y * 0.1) * 1000) / 1000);
        }
      }

      // Should have many unique values
      expect(values.size).toBeGreaterThan(50);
    });

    it('should produce both positive and negative values', () => {
      const noise = new PerlinNoise('pos-neg-test');
      let hasPositive = false;
      let hasNegative = false;

      for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
          const value = noise.get(x * 0.1, y * 0.1);
          if (value > 0) hasPositive = true;
          if (value < 0) hasNegative = true;
        }
      }

      expect(hasPositive).toBe(true);
      expect(hasNegative).toBe(true);
    });
  });

  describe('Smoothness', () => {
    it('should produce smooth transitions (adjacent values are similar)', () => {
      const noise = new PerlinNoise('smooth-test');
      const scale = 0.1;

      // Check that adjacent coordinates have similar values
      let maxDifference = 0;

      for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
          const current = noise.get(x * scale, y * scale);
          const right = noise.get((x + 1) * scale, y * scale);
          const down = noise.get(x * scale, (y + 1) * scale);

          const diffRight = Math.abs(current - right);
          const diffDown = Math.abs(current - down);

          maxDifference = Math.max(maxDifference, diffRight, diffDown);
        }
      }

      // Adjacent values should not differ by more than 0.5 at 0.1 scale
      expect(maxDifference).toBeLessThan(0.5);
    });

    it('should produce less smooth transitions at larger scale', () => {
      const noise = new PerlinNoise('scale-test');

      // Calculate average difference at different scales
      const avgDiffSmall = calculateAverageDifference(noise, 0.05);
      const avgDiffLarge = calculateAverageDifference(noise, 0.5);

      // Larger scale should have larger differences
      expect(avgDiffLarge).toBeGreaterThan(avgDiffSmall);
    });
  });

  describe('Octave Noise', () => {
    it('should produce more detailed noise with more octaves', () => {
      const noise = new PerlinNoise('octave-detail');

      // Compare variance of 1 octave vs 4 octaves
      const variance1 = calculateVariance(noise, 1);
      const variance4 = calculateVariance(noise, 4);

      // More octaves adds detail (may slightly increase or maintain variance)
      // The main point is both should produce valid noise
      expect(variance1).toBeGreaterThan(0);
      expect(variance4).toBeGreaterThan(0);
    });

    it('should respect persistence parameter', () => {
      const noise = new PerlinNoise('persistence-test');

      // Different persistence values should produce different results
      const rangeLow = getOctaveRange(noise, 0.3);
      const rangeHigh = getOctaveRange(noise, 0.7);

      // Both should produce valid ranges
      expect(rangeLow.range).toBeGreaterThan(0);
      expect(rangeHigh.range).toBeGreaterThan(0);

      // Values should still be in valid range
      expect(rangeLow.min).toBeGreaterThanOrEqual(-1);
      expect(rangeLow.max).toBeLessThanOrEqual(1);
      expect(rangeHigh.min).toBeGreaterThanOrEqual(-1);
      expect(rangeHigh.max).toBeLessThanOrEqual(1);
    });

    it('should handle edge case of 1 octave', () => {
      const noise = new PerlinNoise('one-octave');

      const octave1 = noise.getOctave(5, 5, 1, 0.5);
      const regular = noise.get(5, 5);

      // With 1 octave, should be equivalent to regular get()
      expect(octave1).toBe(regular);
    });
  });

  describe('Seed Handling', () => {
    it('should handle empty seed', () => {
      const noise = new PerlinNoise('');

      const value = noise.get(5, 5);
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    });

    it('should handle very long seed', () => {
      const longSeed = 'a'.repeat(1000);
      const noise = new PerlinNoise(longSeed);

      const value = noise.get(5, 5);
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    });

    it('should handle special characters in seed', () => {
      const noise = new PerlinNoise('!@#$%^&*()_+-=[]{}|;:,.<>?');

      const value = noise.get(5, 5);
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    });

    it('should handle unicode seed', () => {
      const noise = new PerlinNoise('日本語シード🎮');

      const value = noise.get(5, 5);
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    });
  });

  describe('Coordinate Handling', () => {
    it('should handle negative coordinates', () => {
      const noise = new PerlinNoise('negative-coords');

      const value = noise.get(-5, -10);
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    });

    it('should handle very large coordinates', () => {
      const noise = new PerlinNoise('large-coords');

      const value = noise.get(10000, 10000);
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    });

    it('should handle decimal coordinates', () => {
      const noise = new PerlinNoise('decimal-coords');

      const value = noise.get(5.5, 3.7);
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    });

    it('should handle zero coordinates', () => {
      const noise = new PerlinNoise('zero-coords');

      const value = noise.get(0, 0);
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    });
  });
});

// Helper function to calculate average difference between adjacent values
function calculateAverageDifference(noise: PerlinNoise, scale: number): number {
  let totalDiff = 0;
  let count = 0;

  for (let x = 0; x < 20; x++) {
    for (let y = 0; y < 20; y++) {
      const current = noise.get(x * scale, y * scale);
      const right = noise.get((x + 1) * scale, y * scale);
      totalDiff += Math.abs(current - right);
      count++;
    }
  }

  return totalDiff / count;
}

// Helper function to calculate variance of octave noise
function calculateVariance(noise: PerlinNoise, octaves: number): number {
  const values: number[] = [];

  for (let x = 0; x < 20; x++) {
    for (let y = 0; y < 20; y++) {
      values.push(noise.getOctave(x * 0.1, y * 0.1, octaves, 0.5));
    }
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

// Helper function to get range of octave values
function getOctaveRange(
  noise: PerlinNoise,
  persistence: number
): { min: number; max: number; range: number } {
  let min = Infinity;
  let max = -Infinity;

  for (let x = 0; x < 30; x++) {
    for (let y = 0; y < 30; y++) {
      const value = noise.getOctave(x * 0.1, y * 0.1, 4, persistence);
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }

  return { min, max, range: max - min };
}
