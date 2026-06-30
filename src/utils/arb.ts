import { type OddsEvent, findBestOddsForTeam } from './oddsApi';

export interface ArbOpportunity {
  event: OddsEvent;
  teamA: string;
  bookAName: string;
  bookAKey: string;
  oddsA: number; // American
  teamB: string;
  bookBName: string;
  bookBKey: string;
  oddsB: number; // American
  // Three-way markets (soccer, etc.) carry a third Draw leg — when present,
  // all three legs must be covered for the hedge to actually be guaranteed.
  teamC?: string;
  bookCName?: string;
  bookCKey?: string;
  oddsC?: number;
  stakeC?: number;
  // Per $100 total stake:
  stakeA: number;
  stakeB: number;
  guaranteedProfit: number;
  profitPct: number;
}

export function americanToDecimal(price: number): number {
  return price > 0 ? price / 100 + 1 : 100 / Math.abs(price) + 1;
}

function hasDrawOutcome(event: OddsEvent): boolean {
  return event.bookmakers.some((bm) =>
    bm.markets.some((m) => m.key === 'h2h' && m.outcomes.some((o) => o.name === 'Draw')),
  );
}

export function findArb(
  event: OddsEvent,
  userBookKeys: string[],
): ArbOpportunity | null {
  return hasDrawOutcome(event)
    ? findThreeWayArb(event, userBookKeys)
    : findTwoWayArb(event, userBookKeys);
}

function findTwoWayArb(event: OddsEvent, userBookKeys: string[]): ArbOpportunity | null {
  const bestA = findBestOddsForTeam(event, event.home_team, userBookKeys);
  const bestB = findBestOddsForTeam(event, event.away_team, userBookKeys);
  if (!bestA || !bestB) return null;

  const decA = americanToDecimal(bestA.price);
  const decB = americanToDecimal(bestB.price);
  const impliedTotal = 1 / decA + 1 / decB;

  // Only return true arbs (guaranteed profit)
  if (impliedTotal >= 1.0) return null;

  // Equal-profit stakes: stakeA = 100 × (1/decA) / (1/decA + 1/decB)
  const stakeA = (100 * (1 / decA)) / impliedTotal;
  const stakeB = 100 - stakeA;
  const guaranteedProfit = stakeA * decA - 100;

  return {
    event,
    teamA: event.home_team,
    bookAName: bestA.bookName,
    bookAKey: bestA.bookKey,
    oddsA: bestA.price,
    teamB: event.away_team,
    bookBName: bestB.bookName,
    bookBKey: bestB.bookKey,
    oddsB: bestB.price,
    stakeA,
    stakeB,
    guaranteedProfit,
    profitPct: guaranteedProfit / 100,
  };
}

// Soccer-style 3-outcome markets (Home / Draw / Away) only pay out a
// guaranteed profit if ALL THREE results are covered. Summing just two of
// the three implied probabilities (the old bug) understates the true total
// and flags normal book pricing as a fake arb — a draw would lose both bets.
function findThreeWayArb(event: OddsEvent, userBookKeys: string[]): ArbOpportunity | null {
  const bestA = findBestOddsForTeam(event, event.home_team, userBookKeys);
  const bestC = findBestOddsForTeam(event, 'Draw', userBookKeys);
  const bestB = findBestOddsForTeam(event, event.away_team, userBookKeys);
  if (!bestA || !bestB || !bestC) return null;

  const decA = americanToDecimal(bestA.price);
  const decB = americanToDecimal(bestB.price);
  const decC = americanToDecimal(bestC.price);
  const impliedTotal = 1 / decA + 1 / decB + 1 / decC;

  // Only return true arbs (guaranteed profit across all 3 outcomes)
  if (impliedTotal >= 1.0) return null;

  const stakeA = (100 * (1 / decA)) / impliedTotal;
  const stakeB = (100 * (1 / decB)) / impliedTotal;
  const stakeC = (100 * (1 / decC)) / impliedTotal;
  const guaranteedProfit = stakeA * decA - 100;

  return {
    event,
    teamA: event.home_team,
    bookAName: bestA.bookName,
    bookAKey: bestA.bookKey,
    oddsA: bestA.price,
    teamB: event.away_team,
    bookBName: bestB.bookName,
    bookBKey: bestB.bookKey,
    oddsB: bestB.price,
    teamC: 'Draw',
    bookCName: bestC.bookName,
    bookCKey: bestC.bookKey,
    oddsC: bestC.price,
    stakeA,
    stakeB,
    stakeC,
    guaranteedProfit,
    profitPct: guaranteedProfit / 100,
  };
}

// For a tracked bet: can we hedge the opposing team right now for guaranteed profit?
export function calcLiveHedge(
  myStake: number,
  myPotentialPayout: number,
  hedgeDecimalOdds: number,
): { hedgeStake: number; guaranteedProfit: number } {
  const hedgeStake = myPotentialPayout / hedgeDecimalOdds;
  const total = myStake + hedgeStake;
  const guaranteedProfit = myPotentialPayout - total;
  return { hedgeStake, guaranteedProfit };
}
