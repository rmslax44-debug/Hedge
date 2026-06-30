import { describe, it, expect } from 'vitest';
import {
  americanToDecimal,
  impliedProbability,
  removeVig,
  calculateEV,
  calculateKelly,
  calculateCLV,
  hasNoEdge,
  fractionalToDecimal,
  decimalToFractional,
  NO_EDGE_TOLERANCE,
} from './proMath';

describe('americanToDecimal / impliedProbability', () => {
  it('-110 converts to ~1.9091 decimal and 52.38% implied probability', () => {
    const dec = americanToDecimal(-110);
    expect(dec).toBeCloseTo(1.909090909, 6);
    expect(impliedProbability(dec)).toBeCloseTo(0.523809524, 6);
  });

  it('+150 converts to 2.5 decimal and 40% implied probability', () => {
    const dec = americanToDecimal(150);
    expect(dec).toBeCloseTo(2.5, 6);
    expect(impliedProbability(dec)).toBeCloseTo(0.4, 6);
  });
});

describe('removeVig', () => {
  it('normalizes a clean two-way 110% market to 1.0', () => {
    const fair = removeVig([0.55, 0.55]);
    expect(fair[0]).toBeCloseTo(0.5, 10);
    expect(fair[1]).toBeCloseTo(0.5, 10);
    expect(fair[0] + fair[1]).toBeCloseTo(1.0, 10);
  });

  it('normalizes a three-way market with overround to sum to 1.0', () => {
    // Implied probs of 0.5 / 0.3 / 0.3 sum to 1.1 (10% overround).
    const fair = removeVig([0.5, 0.3, 0.3]);
    expect(fair[0]).toBeCloseTo(0.5 / 1.1, 10);
    expect(fair[1]).toBeCloseTo(0.3 / 1.1, 10);
    expect(fair[2]).toBeCloseTo(0.3 / 1.1, 10);
    const sum = fair.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it('property: de-vigged probabilities always sum to 1.0 within tolerance for random overrounds', () => {
    for (let i = 0; i < 50; i++) {
      const raw = [0.2 + Math.random() * 0.3, 0.2 + Math.random() * 0.3, 0.2 + Math.random() * 0.3];
      const fair = removeVig(raw);
      const sum = fair.reduce((a, b) => a + b, 0);
      expect(Math.abs(sum - 1.0)).toBeLessThan(1e-9);
    }
  });
});

describe('calculateEV', () => {
  it('p=0.6, decimal=2.0, stake=100 -> EV = $20 (20% of stake)', () => {
    const result = calculateEV(0.6, 2.0, 100);
    expect(result.profitIfWin).toBeCloseTo(100, 6);
    expect(result.ev).toBeCloseTo(20, 6);
    expect(result.evPct).toBeCloseTo(0.2, 6);
  });

  it('flags negative EV when probability is below break-even', () => {
    const result = calculateEV(0.3, 2.0, 100);
    // EV = 0.3*100 - 0.7*100 = -40
    expect(result.ev).toBeCloseTo(-40, 6);
    expect(result.evPct).toBeLessThan(0);
  });
});

describe('calculateKelly', () => {
  it('p=0.6, decimal=2.0 -> full Kelly f*=0.2, quarter Kelly=0.05', () => {
    const full = calculateKelly(0.6, 2.0, 1, 1);
    expect(full.rawFraction).toBeCloseTo(0.2, 6);
    expect(full.recommendedFraction).toBeCloseTo(0.2, 6);
    expect(full.noBet).toBe(false);

    const quarter = calculateKelly(0.6, 2.0, 0.25, 1);
    expect(quarter.rawFraction).toBeCloseTo(0.2, 6);
    expect(quarter.recommendedFraction).toBeCloseTo(0.05, 6);
    expect(quarter.noBet).toBe(false);
  });

  it('caps the recommendation at the user-set max bankroll percentage', () => {
    const result = calculateKelly(0.6, 2.0, 1, 0.1);
    expect(result.recommendedFraction).toBeCloseTo(0.1, 6);
  });

  it('never recommends a stake when f* <= 0 (no edge / negative edge)', () => {
    const result = calculateKelly(0.4, 2.0, 0.25, 1);
    expect(result.noBet).toBe(true);
    expect(result.recommendedFraction).toBe(0);
    expect(result.recommendedPct).toBe(0);
  });

  it('property: never returns NaN or a positive stake when no edge exists', () => {
    for (let i = 0; i < 50; i++) {
      const p = Math.random() * 0.4; // low probabilities, likely no edge
      const dec = 1.5 + Math.random() * 3;
      const result = calculateKelly(p, dec, 0.25, 1);
      expect(Number.isNaN(result.recommendedFraction)).toBe(false);
      expect(Number.isNaN(result.rawFraction)).toBe(false);
      if (result.noBet) {
        expect(result.recommendedFraction).toBe(0);
      }
      expect(result.recommendedFraction).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('calculateCLV', () => {
  it('hand-verified: symmetric placement (fair 0.5) moving to a 7/13 closing fair probability', () => {
    // placed: both sides 1.95 decimal (implied 0.512820513 each) -> symmetric, fair = 0.5
    // closing: own side 1.8 (implied 5/9), opposing 2.1 (implied 10/21) -> fair = 7/13
    const result = calculateCLV(1.95, 1.95, 1.8, 2.1);
    expect(result.placedFairProb).toBeCloseTo(0.5, 9);
    expect(result.closingFairProb).toBeCloseTo(7 / 13, 9);
    expect(result.clv).toBeCloseTo(7 / 13 - 0.5, 9);
    expect(result.clv).toBeGreaterThan(0); // market moved toward the user's side after placement
  });
});

describe('hasNoEdge / NO_EDGE_TOLERANCE', () => {
  it('NO_EDGE_TOLERANCE is fixed at 0.015 (1.5 percentage points)', () => {
    expect(NO_EDGE_TOLERANCE).toBe(0.015);
  });

  it('triggers no-edge when the estimate is within tolerance of the fair probability', () => {
    expect(hasNoEdge(0.5649, 0.55)).toBe(true); // 1.49pp away
    expect(hasNoEdge(0.515, 0.5)).toBe(true); // exactly at the 1.5pp boundary
  });

  it('does not trigger no-edge when the estimate is outside tolerance', () => {
    expect(hasNoEdge(0.5651, 0.55)).toBe(false); // 1.51pp away
    expect(hasNoEdge(0.65, 0.5)).toBe(false);
  });
});

describe('fractional odds support', () => {
  it('converts 1/1 (evens) to decimal 2.0 and back', () => {
    expect(fractionalToDecimal(1, 1)).toBeCloseTo(2.0, 6);
    const frac = decimalToFractional(2.0);
    expect(frac.numerator / frac.denominator).toBeCloseTo(1, 6);
  });

  it('converts 5/2 to decimal 3.5', () => {
    expect(fractionalToDecimal(5, 2)).toBeCloseTo(3.5, 6);
  });
});
