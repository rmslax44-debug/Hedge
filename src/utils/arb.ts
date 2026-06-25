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
  // Per $100 total stake:
  stakeA: number;
  stakeB: number;
  guaranteedProfit: number;
  profitPct: number;
}

export function americanToDecimal(price: number): number {
  return price > 0 ? price / 100 + 1 : 100 / Math.abs(price) + 1;
}

export function findArb(
  event: OddsEvent,
  userBookKeys: string[],
): ArbOpportunity | null {
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
