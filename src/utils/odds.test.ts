import { describe, it, expect } from 'vitest';
import { parseOdds, decimalToAmerican, calculate } from './odds';

// Baseline regression coverage for the existing core hedge-calculation math.
// No test suite existed for this module before the Pro-tab analytics work;
// this file is the "before" snapshot proving that work didn't change it.

describe('parseOdds', () => {
  it('parses American odds', () => {
    expect(parseOdds('+150', 'american')).toBeCloseTo(2.5, 6);
    expect(parseOdds('-110', 'american')).toBeCloseTo(1.909090909, 6);
  });

  it('rejects invalid American odds between -100 and 100', () => {
    expect(parseOdds('50', 'american')).toBeNull();
  });

  it('parses decimal odds', () => {
    expect(parseOdds('2.50', 'decimal')).toBeCloseTo(2.5, 6);
  });
});

describe('decimalToAmerican', () => {
  it('formats decimal >= 2 as positive American odds', () => {
    expect(decimalToAmerican(2.5)).toBe('+150');
  });

  it('formats decimal < 2 as negative American odds', () => {
    expect(decimalToAmerican(1.909090909)).toBe('-110');
  });
});

describe('calculate (hedge math)', () => {
  it('hand-verified: $100 @ +150 hedged at +150 -> $50 locked profit either way', () => {
    const result = calculate(100, 250, 2.5);
    expect(result.optimalHedgeStake).toBeCloseTo(100, 6);
    expect(result.totalInvested).toBeCloseTo(200, 6);
    expect(result.profitIfOriginalWins).toBeCloseTo(50, 6);
    expect(result.profitIfHedgeWins).toBeCloseTo(50, 6);
    expect(result.guaranteedProfit).toBeCloseTo(50, 6);
    expect(result.isGuaranteedProfit).toBe(true);
    expect(result.roi).toBeCloseTo(0.25, 6);
  });

  it('respects a manual hedge stake override', () => {
    const result = calculate(100, 250, 2.5, 80);
    expect(result.hedgeStakeUsed).toBe(80);
    expect(result.totalInvested).toBeCloseTo(180, 6);
  });
});
