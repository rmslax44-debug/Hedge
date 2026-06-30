import { fetchOdds, findBestOddsForTeam, getOddsForTeamAtBook } from './oddsApi';
import {
  getAllBets,
  updateBet,
  getApiKey,
  getSelectedBooks,
  getNotificationsEnabled,
  type TrackedBet,
  type HedgeOpportunity,
} from './storage';
import { americanToDecimal, calcLiveHedge } from './arb';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function canNotify(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

function showNotification(bet: TrackedBet, opp: HedgeOpportunity) {
  if (!canNotify()) return;
  const profit = opp.guaranteedProfit.toFixed(0);
  const stake = opp.hedgeStake.toFixed(0);
  try {
    new Notification('💰 Time to hedge!', {
      body: `Lock in $${profit} on "${bet.label}" — bet $${stake} on ${opp.hedgeTeam} at ${opp.hedgeBook}`,
      tag: `hedge-${bet.id}`,
      icon: '/hedge-icon.png',
    });
  } catch {
    // Notification API not available in this context
  }
}

// Check all monitoring and hedge_ready bets linked to a live event
export async function checkMonitoredBets(
  onUpdate?: (id: string, opp: HedgeOpportunity) => void,
): Promise<void> {
  const apiKey = getApiKey();
  const books = getSelectedBooks();
  const notifyEnabled = getNotificationsEnabled();
  if (!apiKey || !books.length) return;

  const allBets = getAllBets();

  const monitoringBets = allBets.filter(
    (b) => b.status === 'monitoring' && b.eventId && b.opposingTeam,
  );
  const hedgeReadyBets = allBets.filter(
    (b) => b.status === 'hedge_ready' && b.eventId && b.opposingTeam && b.hedgeOpportunity,
  );

  const needsCheck = [...monitoringBets, ...hedgeReadyBets];
  if (!needsCheck.length) return;

  // Group by sport to minimise API calls
  const bySport = new Map<string, TrackedBet[]>();
  for (const bet of needsCheck) {
    if (!bet.sport) continue;
    const list = bySport.get(bet.sport) ?? [];
    list.push(bet);
    bySport.set(bet.sport, list);
  }

  for (const [sport, sportBets] of bySport) {
    try {
      const events = await fetchOdds(sport, apiKey, books);

      for (const bet of sportBets) {
        const event = events.find((e) => e.id === bet.eventId);

        // Closing-line capture for CLV tracking — additive, runs regardless of
        // hedge status below and only fires once per bet (closingOdds unset).
        if (
          event &&
          bet.opposingTeam &&
          bet.eventStartTime &&
          Date.now() >= new Date(bet.eventStartTime).getTime() &&
          bet.closingOdds === undefined
        ) {
          const ownClosing = getOddsForTeamAtBook(event, bet.myTeam, bet.sportsbook);
          const bestOppClosing = findBestOddsForTeam(event, bet.opposingTeam, books);
          if (ownClosing !== null && bestOppClosing) {
            updateBet(bet.id, { closingOdds: ownClosing, closingOpposingOdds: bestOppClosing.price });
          }
        }

        if (bet.status === 'monitoring') {
          if (!event || !bet.opposingTeam) continue;
          const bestHedge = findBestOddsForTeam(event, bet.opposingTeam, books);
          if (!bestHedge) continue;
          const dec = americanToDecimal(bestHedge.price);
          const { hedgeStake, guaranteedProfit } = calcLiveHedge(bet.stake, bet.potentialPayout, dec);
          if (guaranteedProfit <= 0) continue;
          const opp: HedgeOpportunity = {
            hedgeTeam: bet.opposingTeam,
            hedgeBook: bestHedge.bookName,
            hedgeBookKey: bestHedge.bookKey,
            hedgeStake,
            hedgeOdds: bestHedge.price,
            guaranteedProfit,
            foundAt: Date.now(),
          };
          updateBet(bet.id, { status: 'hedge_ready', hedgeOpportunity: opp });
          if (notifyEnabled) showNotification(bet, opp);
          onUpdate?.(bet.id, opp);

        } else if (bet.status === 'hedge_ready' && bet.hedgeOpportunity) {
          const prevProfit = bet.hedgeOpportunity.guaranteedProfit;

          if (!event || !bet.opposingTeam) {
            updateBet(bet.id, { hedgeValueTrend: 'expired', previousGuaranteedProfit: prevProfit });
            continue;
          }

          const bestHedge = findBestOddsForTeam(event, bet.opposingTeam, books);
          if (!bestHedge) {
            updateBet(bet.id, { hedgeValueTrend: 'expired', previousGuaranteedProfit: prevProfit });
            continue;
          }

          const dec = americanToDecimal(bestHedge.price);
          const { hedgeStake, guaranteedProfit } = calcLiveHedge(bet.stake, bet.potentialPayout, dec);

          const newOpp: HedgeOpportunity = {
            hedgeTeam: bet.opposingTeam,
            hedgeBook: bestHedge.bookName,
            hedgeBookKey: bestHedge.bookKey,
            hedgeStake,
            hedgeOdds: bestHedge.price,
            guaranteedProfit,
            foundAt: Date.now(),
            eventTime: bet.hedgeOpportunity.eventTime,
          };

          if (guaranteedProfit <= 0) {
            updateBet(bet.id, { hedgeOpportunity: newOpp, hedgeValueTrend: 'gone_negative', previousGuaranteedProfit: prevProfit });
          } else if (guaranteedProfit > prevProfit + 0.01) {
            updateBet(bet.id, { hedgeOpportunity: newOpp, hedgeValueTrend: 'up', previousGuaranteedProfit: prevProfit });
            onUpdate?.(bet.id, newOpp);
          } else if (guaranteedProfit < prevProfit - 0.01) {
            updateBet(bet.id, { hedgeOpportunity: newOpp, hedgeValueTrend: 'down', previousGuaranteedProfit: prevProfit });
          } else {
            updateBet(bet.id, { hedgeOpportunity: newOpp, hedgeValueTrend: undefined });
          }
        }
      }
    } catch {
      // Silently skip failed sport fetch
    }
  }
}
