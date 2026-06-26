import { useState, useEffect } from 'react';
import { fetchOdds, type OddsEvent } from '../utils/oddsApi';
import { findArb, type ArbOpportunity, americanToDecimal } from '../utils/arb';
import { findBestOddsForTeam } from '../utils/oddsApi';
import {} from '../utils/sportsbooks';
import { getApiKey, getSelectedBooks, addBetWithHedge } from '../utils/storage';

const SCAN_SPORTS = ['americanfootball_nfl', 'basketball_nba', 'baseball_mlb', 'icehockey_nhl', 'mma_mixed_martial_arts'];

function formatOdds(price: number): string {
  return price > 0 ? `+${price}` : `${price}`;
}

function formatGameTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (d.getTime() - now.getTime()) / 3_600_000;
  if (diffH < 0) return 'In progress';
  if (diffH < 24) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

// ─── Arb Opportunity Card ─────────────────────────────────────────────────────

function ArbCard({
  opp,
  onAddToTracker,
}: {
  opp: ArbOpportunity;
  onAddToTracker: (stakeA: number, stakeB: number, profit: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [betAmount, setBetAmount] = useState('100');
  const parsed = parseFloat(betAmount);
  const multiplier = isNaN(parsed) || parsed <= 0 ? 1 : parsed / 100;
  const stakeA = opp.stakeA * multiplier;
  const stakeB = opp.stakeB * multiplier;
  const profit = opp.guaranteedProfit * multiplier;

  return (
    <div className="card overflow-hidden border-purple-500/50 bg-purple-500/5 shadow-[0_0_20px_rgba(168,85,247,0.18)]">
      <button onClick={() => setExpanded(e => !e)} className="w-full p-4 text-left space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-profit text-[10px]">Guaranteed Profit</span>
              <span className="text-purple-400 font-bold text-sm font-mono">
                +{(opp.profitPct * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-sm font-semibold text-white">
              {opp.event.away_team} @ {opp.event.home_team}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{formatGameTime(opp.event.commence_time)}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-500">Per $100</p>
            <p className="text-xl font-bold text-purple-400">+${opp.guaranteedProfit.toFixed(2)}</p>
          </div>
        </div>

        {/* Quick preview */}
        <div className="flex gap-2 text-xs font-mono">
          <div className="flex-1 rounded-lg px-3 py-2 space-y-0.5 pill-glow-white">
            <p className="text-slate-500">Bet A</p>
            <p className="text-white font-semibold">{opp.teamA.split(' ').slice(-1)[0]}</p>
            <p className="text-white font-bold">{formatOdds(opp.oddsA)}</p>
            <p className="text-slate-500 text-[10px]">{opp.bookAName}</p>
          </div>
          <div className="flex items-center text-slate-600 font-sans text-xs">+</div>
          <div className="flex-1 rounded-lg px-3 py-2 space-y-0.5 pill-glow-purple">
            <p className="text-purple-400/70">Bet B</p>
            <p className="text-white font-semibold">{opp.teamB.split(' ').slice(-1)[0]}</p>
            <p className="text-purple-300 font-bold">{formatOdds(opp.oddsB)}</p>
            <p className="text-purple-400/50 text-[10px]">{opp.bookBName}</p>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[#3D1A6E] px-4 pb-4 pt-3 space-y-4 animate-fade-in">
          {/* Plain language explanation */}
          <div className="bg-[#100020] rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest">How this works</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              By betting on <span className="text-white font-semibold">both teams</span> across two different apps,
              the math works out so that no matter who wins, you come out ahead.
              This is called an <span className="text-purple-400 font-semibold">arbitrage opportunity</span> — rare, but real.
            </p>
          </div>

          {/* Adjustable amount */}
          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-semibold">How much total do you want to invest?</p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="input-field pl-8"
                min="10"
                step="10"
              />
            </div>
          </div>

          {/* Step-by-step instructions */}
          {!isNaN(parsed) && parsed > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Exactly what to do</p>
              <div className="space-y-2">
                <div className="flex items-start gap-3 rounded-xl p-3 pill-glow-white">
                  <span className="w-6 h-6 rounded-full bg-white/10 border border-white/25 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.15)]">1</span>
                  <div className="text-sm">
                    <p className="text-white">Open <span className="text-white font-bold">{opp.bookAName}</span></p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Bet <span className="text-white font-bold font-mono">${stakeA.toFixed(2)}</span> on{' '}
                      <span className="text-white font-semibold">{opp.teamA}</span>{' '}
                      ({formatOdds(opp.oddsA)})
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl p-3 pill-glow-purple">
                  <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.6)]">2</span>
                  <div className="text-sm">
                    <p className="text-white">Open <span className="text-purple-300 font-bold">{opp.bookBName}</span></p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Bet <span className="text-white font-bold font-mono">${stakeB.toFixed(2)}</span> on{' '}
                      <span className="text-white font-semibold">{opp.teamB}</span>{' '}
                      ({formatOdds(opp.oddsB)})
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-[#180032] border border-purple-500/15 rounded-xl p-3">
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center justify-center shrink-0">3</span>
                  <div className="text-sm">
                    <p className="text-white">Sit back and collect 💰</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Guaranteed <span className="text-purple-300 font-bold drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]">+${profit.toFixed(2)}</span>{' '}
                      profit no matter what happens
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center py-3 bg-purple-500/8 rounded-xl border border-purple-500/35 shadow-[0_0_18px_rgba(168,85,247,0.22)]">
                <p className="text-xs text-slate-400">Total invested: <span className="text-white font-mono">${parsed.toFixed(2)}</span></p>
                <p className="text-2xl font-bold text-purple-400 mt-1 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">+${profit.toFixed(2)}</p>
                <p className="text-xs text-slate-500">guaranteed return</p>
              </div>

              <button
                onClick={() => onAddToTracker(stakeA, stakeB, profit)}
                className="w-full py-3.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-sm transition-all btn-glow"
              >
                Add both bets to my tracker →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Near-Arb / Best Lines Card ───────────────────────────────────────────────

function BestLinesCard({ event, userBooks }: { event: OddsEvent; userBooks: string[] }) {
  const bestHome = findBestOddsForTeam(event, event.home_team, userBooks);
  const bestAway = findBestOddsForTeam(event, event.away_team, userBooks);
  if (!bestHome || !bestAway) return null;

  const decH = americanToDecimal(bestHome.price);
  const decA = americanToDecimal(bestAway.price);
  const impliedTotal = 1 / decH + 1 / decA;
  const margin = ((impliedTotal - 1) * 100).toFixed(1);

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 mb-1">{formatGameTime(event.commence_time)}</p>
          <p className="text-sm font-semibold text-white truncate">
            {event.away_team} @ {event.home_team}
          </p>
        </div>
        <span className="text-[10px] text-slate-500 shrink-0 font-mono">
          {margin}% juice
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="bg-[#180032] rounded-lg p-2 space-y-0.5">
          <p className="text-slate-500 truncate">{event.home_team.split(' ').slice(-1)}</p>
          <p className={`font-bold ${bestHome.price > 0 ? 'text-purple-400' : 'text-slate-200'}`}>
            {formatOdds(bestHome.price)}
          </p>
          <p className="text-slate-600 text-[10px]">{bestHome.bookName}</p>
        </div>
        <div className="bg-[#180032] rounded-lg p-2 space-y-0.5">
          <p className="text-slate-500 truncate">{event.away_team.split(' ').slice(-1)}</p>
          <p className={`font-bold ${bestAway.price > 0 ? 'text-purple-400' : 'text-slate-200'}`}>
            {formatOdds(bestAway.price)}
          </p>
          <p className="text-slate-600 text-[10px]">{bestAway.bookName}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Opportunities Screen ─────────────────────────────────────────────────────

export default function Opportunities({ onSwitchToMyBets }: { onSwitchToMyBets?: () => void }) {
  const [arbs, setArbs] = useState<ArbOpportunity[]>([]);
  const [nearArbs, setNearArbs] = useState<OddsEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);

  const apiKey = getApiKey();
  const userBooks = getSelectedBooks();
  const isConfigured = apiKey.length > 0 && userBooks.length > 0;

  async function scan() {
    setLoading(true);
    setError(null);
    setArbs([]);
    setNearArbs([]);
    try {
      const results = await Promise.allSettled(
        SCAN_SPORTS.map((s) => fetchOdds(s, apiKey, userBooks)),
      );
      const allEvents: OddsEvent[] = results
        .filter((r): r is PromiseFulfilledResult<OddsEvent[]> => r.status === 'fulfilled')
        .flatMap((r) => r.value);

      const foundArbs: ArbOpportunity[] = [];
      const foundNear: OddsEvent[] = [];

      for (const event of allEvents) {
        const arb = findArb(event, userBooks);
        if (arb) {
          foundArbs.push(arb);
        } else {
          // Show events with < 3% vig as "near arb" (close lines worth watching)
          const bA = findBestOddsForTeam(event, event.home_team, userBooks);
          const bB = findBestOddsForTeam(event, event.away_team, userBooks);
          if (bA && bB) {
            const implied = 1 / americanToDecimal(bA.price) + 1 / americanToDecimal(bB.price);
            if (implied < 1.04) foundNear.push(event);
          }
        }
      }

      foundArbs.sort((a, b) => b.profitPct - a.profitPct);
      setArbs(foundArbs);
      setNearArbs(foundNear.slice(0, 6));
      setScanned(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isConfigured) scan();
  }, []); // eslint-disable-line

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center space-y-4">
        <span className="text-5xl">⭐</span>
        <div>
          <p className="text-lg font-bold">Set up your books first</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Go to Settings, add your free Odds API key and select your sportsbooks to start finding opportunities.
          </p>
        </div>
        <p className="text-xs text-purple-400">↓ Tap Settings below</p>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">Guaranteed Profit Opportunities</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Situations where betting both sides locks in profit
            </p>
          </div>
          <button
            onClick={scan}
            disabled={loading}
            className="text-xs text-purple-300 hover:text-white border border-purple-500/40 px-3 py-1.5 rounded-lg transition-all hover:border-purple-500/70 hover:shadow-[0_0_10px_rgba(168,85,247,0.3)] disabled:opacity-50"
          >
            {loading ? '…' : '↺ Scan'}
          </button>
        </div>

        {/* What is this? */}
        <div className="card p-3 border-blue-500/20 bg-blue-500/5">
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="text-blue-300 font-semibold">How it works:</span> Different sportsbooks sometimes price the same game differently. When the difference is big enough, you can bet on BOTH sides and make money no matter who wins.
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-12 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500">Scanning {SCAN_SPORTS.length} sports across your books…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 card p-4 border-red-500/30 bg-red-500/5">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {!loading && scanned && (
        <div className="px-4 space-y-5">
          {/* True arbs */}
          {arbs.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                  {arbs.length} guaranteed profit opportunity{arbs.length !== 1 ? 'ies' : 'y'} found
                </p>
              </div>
              {arbs.map((a) => (
                <ArbCard
                  key={a.event.id}
                  opp={a}
                  onAddToTracker={(scaledStakeA, scaledStakeB, scaledProfit) => {
                    addBetWithHedge({
                      label: `${a.teamA} to win`,
                      myTeam: a.teamA,
                      sportsbook: a.bookAKey,
                      stake: scaledStakeA,
                      potentialPayout: scaledStakeA * americanToDecimal(a.oddsA),
                      sport: a.event.sport_key,
                      eventId: a.event.id,
                      opposingTeam: a.teamB,
                      hedgeOpportunity: {
                        hedgeTeam: a.teamB,
                        hedgeBook: a.bookBName,
                        hedgeBookKey: a.bookBKey,
                        hedgeStake: scaledStakeB,
                        hedgeOdds: a.oddsB,
                        guaranteedProfit: scaledProfit,
                        foundAt: Date.now(),
                        eventTime: a.event.commence_time,
                      },
                    });
                    onSwitchToMyBets?.();
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="card p-5 text-center space-y-2">
              <p className="text-slate-300 font-semibold">No guaranteed profit opportunities right now</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                These are rare — check back during peak betting hours or try different sports in Settings.
              </p>
            </div>
          )}

          {/* Near arbs */}
          {nearArbs.length > 0 && (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Best Lines Right Now</p>
                <p className="text-xs text-slate-600 mt-0.5">Lowest juice across your books — closer to equal odds means less risk</p>
              </div>
              {nearArbs.map((e) => (
                <BestLinesCard key={e.id} event={e} userBooks={userBooks} />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
