// Shared math for the Pro tab's analytics suite (vig removal, EV, Kelly, CLV).
// Single source of truth — every new analytics feature imports from here instead
// of re-deriving its own odds math. Existing hedge/arb math in odds.ts and arb.ts
// is reused, not duplicated: americanToDecimal/decimalToAmerican are re-exported
// below rather than redefined.
//
// Uses decimal.js internally for chained arithmetic so values like the
// NO_EDGE_TOLERANCE comparison don't drift from float rounding across steps.
// Functions still accept/return plain `number` at their boundary — this buys
// precise intermediate math, not arbitrary-precision typing through the rest
// of the app, which still works in plain numbers everywhere else.
import Decimal from 'decimal.js';
import { americanToDecimal } from './arb';
import { decimalToAmerican } from './odds';

export { americanToDecimal, decimalToAmerican };

// Within 1.5 percentage points of the market's no-vig fair probability, a user's
// estimate isn't a real edge — it's noise. Defined once here for central tuning;
// every "no edge / no bet" check in the app must reference this constant.
export const NO_EDGE_TOLERANCE = 0.015;

export function fractionalToDecimal(numerator: number, denominator: number): number {
  return new Decimal(numerator).div(denominator).plus(1).toNumber();
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function decimalToFractional(decimalOdds: number, precision = 100): { numerator: number; denominator: number } {
  const profit = new Decimal(decimalOdds).minus(1).times(precision);
  const numerator = Math.round(profit.toNumber());
  const denominator = precision;
  const divisor = gcd(Math.abs(numerator), denominator) || 1;
  return { numerator: numerator / divisor, denominator: denominator / divisor };
}

export function impliedProbability(decimalOdds: number): number {
  return new Decimal(1).div(decimalOdds).toNumber();
}

// Generic n-way de-vig: normalizes a set of implied probabilities so they sum to 1.0.
// fair_i = implied_i / sum(implied)
export function removeVig(impliedProbs: number[]): number[] {
  const decs = impliedProbs.map((p) => new Decimal(p));
  const sum = decs.reduce((acc, d) => acc.plus(d), new Decimal(0));
  return decs.map((d) => d.div(sum).toNumber());
}

export interface EVResult {
  profitIfWin: number;
  ev: number;
  evPct: number; // EV as a fraction of stake (0.1 = 10%)
}

// EV = (p * profit_if_win) - ((1 - p) * stake)
export function calculateEV(probability: number, decimalOdds: number, stake: number): EVResult {
  const p = new Decimal(probability);
  const q = new Decimal(1).minus(p);
  const profitIfWin = new Decimal(stake).times(new Decimal(decimalOdds).minus(1));
  const ev = p.times(profitIfWin).minus(q.times(stake));
  const evPct = stake > 0 ? ev.div(stake).toNumber() : 0;
  return { profitIfWin: profitIfWin.toNumber(), ev: ev.toNumber(), evPct };
}

export interface KellyResult {
  rawFraction: number; // uncapped f*, before applying fractional-Kelly scaling or bankroll cap
  recommendedFraction: number; // 0-1, fraction of bankroll to stake after scaling + cap
  recommendedPct: number; // recommendedFraction * 100, for display
  noBet: boolean;
}

// Kelly criterion: f* = (b*p - q) / b, where b = decimalOdds - 1, q = 1 - p.
// `kellyFraction` applies fractional Kelly (e.g. 0.25 for quarter-Kelly).
// `maxBankrollFraction` caps the final recommendation (0-1, fraction of bankroll).
// Never recommends a negative or zero stake — surfaces noBet instead.
export function calculateKelly(
  probability: number,
  decimalOdds: number,
  kellyFraction: number = 0.25,
  maxBankrollFraction: number = 1,
): KellyResult {
  const p = new Decimal(probability);
  const q = new Decimal(1).minus(p);
  const b = new Decimal(decimalOdds).minus(1);

  if (b.lte(0)) {
    return { rawFraction: 0, recommendedFraction: 0, recommendedPct: 0, noBet: true };
  }

  const fStar = b.times(p).minus(q).div(b);

  if (fStar.lte(0)) {
    return { rawFraction: fStar.toNumber(), recommendedFraction: 0, recommendedPct: 0, noBet: true };
  }

  const scaled = fStar.times(kellyFraction);
  const capped = Decimal.min(scaled, new Decimal(maxBankrollFraction));

  return {
    rawFraction: fStar.toNumber(),
    recommendedFraction: capped.toNumber(),
    recommendedPct: capped.times(100).toNumber(),
    noBet: false,
  };
}

export interface CLVResult {
  placedFairProb: number;
  closingFairProb: number;
  clv: number; // percentage-point delta (closingFairProb - placedFairProb) for the user's own side
}

// Full de-vigged CLV: de-vigs both the placement-time market and the closing-time
// market for the user's own side, then compares the two fair probabilities.
// Positive CLV means the market's fair probability for the user's side rose
// between placement and close (the user got in before the market caught up).
export function calculateCLV(
  placedOwnDecimal: number,
  placedOpposingDecimal: number,
  closingOwnDecimal: number,
  closingOpposingDecimal: number,
): CLVResult {
  const [placedFairProb] = removeVig([
    impliedProbability(placedOwnDecimal),
    impliedProbability(placedOpposingDecimal),
  ]);
  const [closingFairProb] = removeVig([
    impliedProbability(closingOwnDecimal),
    impliedProbability(closingOpposingDecimal),
  ]);
  return { placedFairProb, closingFairProb, clv: closingFairProb - placedFairProb };
}

// True when a user's probability estimate is within NO_EDGE_TOLERANCE of the
// market's no-vig fair probability — i.e. no real edge, so no bet.
export function hasNoEdge(userProbability: number, marketFairProbability: number, tolerance: number = NO_EDGE_TOLERANCE): boolean {
  return new Decimal(userProbability).minus(marketFairProbability).abs().lte(tolerance);
}
