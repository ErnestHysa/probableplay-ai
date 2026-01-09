/**
 * Validation Utility Tests
 *
 * Tests for probability validation and normalization functions.
 */

import { describe, it, expect } from 'vitest';
import { validateProbabilities, normalizeProbabilities } from '../validation';

describe('validateProbabilities', () => {
  it('should accept valid probabilities that sum to 1.0', () => {
    const result = validateProbabilities({
      homeWin: 0.5,
      draw: 0.3,
      awayWin: 0.2,
    });
    expect(result.valid).toBe(true);
    expect(result.sum).toBeCloseTo(1.0, 2);
  });

  it('should accept probabilities within tolerance range (0.95-1.05)', () => {
    const result = validateProbabilities({
      homeWin: 0.48,
      draw: 0.28,
      awayWin: 0.22,
    });
    expect(result.valid).toBe(true); // sum = 0.98
  });

  it('should reject probabilities that sum to less than 0.90', () => {
    const result = validateProbabilities({
      homeWin: 0.3,
      draw: 0.2,
      awayWin: 0.2,
    });
    expect(result.valid).toBe(false);
    expect(result.sum).toBeCloseTo(0.7, 2);
  });

  it('should reject probabilities that sum to more than 1.10', () => {
    const result = validateProbabilities({
      homeWin: 0.6,
      draw: 0.4,
      awayWin: 0.2,
    });
    expect(result.valid).toBe(false);
    expect(result.sum).toBeCloseTo(1.2, 2);
  });

  it('should handle zero probabilities', () => {
    const result = validateProbabilities({
      homeWin: 0.5,
      draw: 0.5,
      awayWin: 0,
    });
    expect(result.valid).toBe(true);
  });

  it('should handle very small probabilities', () => {
    const result = validateProbabilities({
      homeWin: 0.99,
      draw: 0.005,
      awayWin: 0.005,
    });
    expect(result.valid).toBe(true);
  });
});

describe('normalizeProbabilities', () => {
  it('should normalize probabilities that sum to less than 1.0', () => {
    const result = normalizeProbabilities({
      homeWin: 0.4,
      draw: 0.3,
      awayWin: 0.2,
    });
    // Sum = 0.9, each should be scaled by 1/0.9
    expect(result.homeWin).toBeCloseTo(0.4 / 0.9, 3);
    expect(result.draw).toBeCloseTo(0.3 / 0.9, 3);
    expect(result.awayWin).toBeCloseTo(0.2 / 0.9, 3);
    expect(result.homeWin + result.draw + result.awayWin).toBeCloseTo(1.0, 3);
  });

  it('should normalize probabilities that sum to more than 1.0', () => {
    const result = normalizeProbabilities({
      homeWin: 0.6,
      draw: 0.4,
      awayWin: 0.2,
    });
    // Sum = 1.2, each should be scaled by 1/1.2
    expect(result.homeWin).toBeCloseTo(0.6 / 1.2, 3);
    expect(result.draw).toBeCloseTo(0.4 / 1.2, 3);
    expect(result.awayWin).toBeCloseTo(0.2 / 1.2, 3);
    expect(result.homeWin + result.draw + result.awayWin).toBeCloseTo(1.0, 3);
  });

  it('should handle already normalized probabilities', () => {
    const result = normalizeProbabilities({
      homeWin: 0.5,
      draw: 0.3,
      awayWin: 0.2,
    });
    expect(result.homeWin).toBeCloseTo(0.5, 3);
    expect(result.draw).toBeCloseTo(0.3, 3);
    expect(result.awayWin).toBeCloseTo(0.2, 3);
  });

  it('should handle all zeros (edge case)', () => {
    const result = normalizeProbabilities({
      homeWin: 0,
      draw: 0,
      awayWin: 0,
    });
    // Should return equal probabilities when all are zero
    expect(result.homeWin).toBeCloseTo(1/3, 3);
    expect(result.draw).toBeCloseTo(1/3, 3);
    expect(result.awayWin).toBeCloseTo(1/3, 3);
  });
});
