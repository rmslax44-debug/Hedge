import { describe, it, expect } from 'vitest';
import { americanToDecimal, findArb, calcLiveHedge } from './arb';
import type { OddsEvent } from './oddsApi';

// Baseline regression coverage for the existing arbitrage-detection math.
// No test suite existed for this module before the Pro-tab analytics work;
// this file is the "before" snapshot proving that work didn't change it.

function mockTwoWayEvent(homePrice: number, awayPrice: number): OddsEvent {
  return {
    id: 'evt-1',
    sport_key: 'basketball_nba',
    sport_title: 'NBA',
    commence_time: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    home_team: 'Boston Celtics',
    away_team: 'Los Angeles Lakers',
    bookmakers: [
      { key: 'draftkings', title: 'DraftKings', markets: [{ key: 'h2h', outcomes: [{ name: 'Boston Celtics', price: homePrice }] }] },
      { key: 'fanduel', title: 'FanDuel', markets: [{ key: 'h2h', outcomes: [{ name: 'Los Angeles Lakers', price: awayPrice }] }] },
    ],
  };
}

describe('americanToDecimal', () => {
  it('-110 -> ~1.9091', () => {
    expect(americanToDecimal(-110)).toBeCloseTo(1.909090909, 6);
  });
  it('+150 -> 2.5', () => {
    expect(americanToDecimal(150)).toBeCloseTo(2.5, 6);
  });
});

describe('findArb (two-way)', () => {
  it('finds a guaranteed-profit arb when implied probabilities sum below 1.0', () => {
    const event = mockTwoWayEvent(-110, 150); // DK Celtics -110, FD Lakers +150
    const arb = findArb(event, ['draftkings', 'fanduel']);
    expect(arb).not.toBeNull();
    expect(arb!.guaranteedProfit).toBeGreaterThan(0);
    expect(arb!.stakeA + arb!.stakeB).toBeCloseTo(100, 6);
  });

  it('returns null when there is no arb (implied total >= 1.0)', () => {
    const event = mockTwoWayEvent(-200, -200);
    const arb = findArb(event, ['draftkings', 'fanduel']);
    expect(arb).toBeNull();
  });
});

describe('calcLiveHedge', () => {
  it('hand-verified: $100 stake, $250 potential payout, hedge decimal 2.5 -> $50 guaranteed profit', () => {
    const result = calcLiveHedge(100, 250, 2.5);
    expect(result.hedgeStake).toBeCloseTo(100, 6);
    expect(result.guaranteedProfit).toBeCloseTo(50, 6);
  });
});
