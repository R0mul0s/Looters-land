/**
 * Perlin Noise Generator
 *
 * Simple 2D Perlin noise implementation for procedural terrain generation.
 * Based on Ken Perlin's improved noise algorithm.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-07
 */

/**
 * Perlin Noise class for generating smooth random noise
 *
 * @example
 * ```typescript
 * const noise = new PerlinNoise('my-seed-123');
 * const value = noise.get(x * 0.1, y * 0.1); // Returns value between -1 and 1
 * ```
 */
export class PerlinNoise {
  private permutation: number[];
  private p: number[];

  /**
   * Create a new Perlin Noise generator
   *
   * @param seed - Seed string for reproducible generation
   *
   * @example
   * ```typescript
   * const noise = new PerlinNoise('world-123');
   * ```
   */
  constructor(seed: string) {
    this.permutation = this.generatePermutation(seed);
    this.p = [...this.permutation, ...this.permutation];
  }

  /**
   * Generate permutation table from seed
   *
   * @param seed - Seed string
   * @returns Permutation array
   */
  private generatePermutation(seed: string): number[] {
    const permutation = Array.from({ length: 256 }, (_, i) => i);

    // Simple hash function from seed
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash = hash & hash;
    }

    // Shuffle using seeded random
    const random = this.seededRandom(hash);
    for (let i = permutation.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
    }

    return permutation;
  }

  /**
   * Create seeded random function
   *
   * @param seed - Number seed
   * @returns Random function
   */
  private seededRandom(seed: number): () => number {
    return function () {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  /**
   * Fade function for smooth interpolation
   *
   * @param t - Value to fade
   * @returns Faded value
   */
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  /**
   * Linear interpolation
   *
   * @param a - Start value
   * @param b - End value
   * @param t - Interpolation factor
   * @returns Interpolated value
   */
  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  /**
   * Gradient function
   *
   * @param hash - Hash value
   * @param x - X coordinate
   * @param y - Y coordinate
   * @returns Gradient value
   */
  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  /**
   * Get noise value at coordinates
   *
   * @param x - X coordinate (use 0.1 scale for smooth terrain)
   * @param y - Y coordinate (use 0.1 scale for smooth terrain)
   * @returns Noise value between -1 and 1
   *
   * @example
   * ```typescript
   * const noise = new PerlinNoise('seed');
   * const value = noise.get(5 * 0.1, 10 * 0.1); // Smooth terrain noise
   * ```
   */
  get(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);

    const u = this.fade(x);
    const v = this.fade(y);

    const a = this.p[X] + Y;
    const aa = this.p[a];
    const ab = this.p[a + 1];
    const b = this.p[X + 1] + Y;
    const ba = this.p[b];
    const bb = this.p[b + 1];

    return this.lerp(
      this.lerp(this.grad(this.p[aa], x, y), this.grad(this.p[ba], x - 1, y), u),
      this.lerp(this.grad(this.p[ab], x, y - 1), this.grad(this.p[bb], x - 1, y - 1), u),
      v
    );
  }

  /**
   * Get octave noise (multiple layers for more detail)
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param octaves - Number of layers (more = more detail)
   * @param persistence - How much each octave contributes (0-1)
   * @returns Noise value between -1 and 1
   *
   * @example
   * ```typescript
   * const noise = new PerlinNoise('seed');
   * // More detailed terrain
   * const value = noise.getOctave(x * 0.05, y * 0.05, 4, 0.5);
   * ```
   */
  getOctave(x: number, y: number, octaves: number, persistence: number): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.get(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }
}
