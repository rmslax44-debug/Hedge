import { useState, useEffect, useRef } from 'react';
import { fetchOdds, type OddsEvent } from '../utils/oddsApi';
import { findArb, type ArbOpportunity, americanToDecimal, calcLiveHedge } from '../utils/arb';
import { findBestOddsForTeam } from '../utils/oddsApi';
import { SPORTS } from '../utils/sportsbooks';
import { getApiKey, getSelectedBooks, addBetWithHedge, addWatchedBet, getAllBets, updateBet, getFavoriteSports, type TrackedBet } from '../utils/storage';
import type { CalcPrefill } from './ProCalculator';

// Derived from the single source of truth — all sports the app supports
const SCAN_SPORTS = SPORTS.map(s => s.key);

const SPORT_LABEL: Record<string, string> = Object.fromEntries(
  SPORTS.map(s => [s.key, `${s.emoji} ${s.name}`])
);

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
  matchingBet,
  isFavorite,
  onAddToTracker,
  onSwitchToMyBets,
  onSendToCalc,
}: {
  opp: ArbOpportunity;
  matchingBet?: TrackedBet;
  isFavorite?: boolean;
  onAddToTracker: (stakeA: number, stakeB: number, profit: number) => void;
  onSwitchToMyBets?: () => void;
  onSendToCalc?: (prefill: CalcPrefill) => void;
}) {
  const [expanded, setExpanded] = useState(!!matchingBet);
  const [betAmount, setBetAmount] = useState('100');
  const [updated, setUpdated] = useState(false);
  const parsed = parseFloat(betAmount);
  const multiplier = isNaN(parsed) || parsed <= 0 ? 1 : parsed / 100;
  const stakeA = opp.stakeA * multiplier;
  const stakeB = opp.stakeB * multiplier;
  const stakeC = (opp.stakeC ?? 0) * multiplier;
  const profit = opp.guaranteedProfit * multiplier;
  const isThreeWay = !!opp.teamC;

  const now = Date.now();
  const startMs = new Date(opp.event.commence_time).getTime();
  const diffMs = startMs - now;
  const arbIsLive     = diffMs < 0 && diffMs > -4 * 3_600_000;
  const arbIsImminent = !arbIsLive && diffMs >= 0 && diffMs < 30 * 60_000;
  const arbMinsAway   = Math.max(0, Math.round(diffMs / 60_000));

  const cardBorder = arbIsLive
    ? 'border-red-500/70 bg-red-500/5 shadow-[0_0_28px_rgba(239,68,68,0.28),0_0_0_1px_rgba(239,68,68,0.08)]'
    : arbIsImminent
    ? 'border-amber-500/60 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
    : 'border-purple-500/50 bg-purple-500/5 shadow-[0_0_20px_rgba(168,85,247,0.18)]';

  return (
    <div className={`card overflow-hidden relative ${cardBorder}`}>
      {/* Left-edge live bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{
          background: arbIsLive ? '#EF4444' : arbIsImminent ? '#F59E0B' : '#A855F7',
          boxShadow: arbIsLive ? '0 0 10px rgba(239,68,68,0.9)' : arbIsImminent ? '0 0 8px rgba(245,158,11,0.7)' : '0 0 8px rgba(168,85,247,0.7)',
        }}
      />
      <button onClick={() => setExpanded(e => !e)} className="w-full p-4 text-left space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {arbIsLive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-red-500/70 bg-red-500/20 text-red-400 text-xs font-bold tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.35)]">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
                  LIVE NOW
                </span>
              ) : arbIsImminent ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-amber-500/60 bg-amber-500/15 text-amber-400 text-xs font-bold tracking-wider">
                  ⚡ {arbMinsAway}m
                </span>
              ) : null}
              <span className="badge-profit text-xs">Profit Lock</span>
              <span className="text-emerald-400 font-bold text-sm font-mono">
                +{(opp.profitPct * 100).toFixed(1)}%
              </span>
              {isFavorite && (
                <span className="text-yellow-400 text-xs leading-none" title="Favorite sport">⭐</span>
              )}
            </div>
            <p className="text-sm font-semibold text-white">
              {opp.event.away_team} @ {opp.event.home_team}
            </p>
            <p className={`text-xs mt-0.5 ${arbIsLive ? 'text-red-400/80 font-semibold' : 'text-slate-500'}`}>
              {arbIsLive ? 'In progress — bet now before odds move' : formatGameTime(opp.event.commence_time)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-500">Per $100</p>
            <p className="text-xl font-bold text-emerald-400">+${opp.guaranteedProfit.toFixed(2)}</p>
          </div>
        </div>

        {/* Quick preview */}
        <div className="flex gap-2 text-xs font-mono">
          <div className="flex-1 rounded-lg px-3 py-2 space-y-0.5 pill-glow-white">
            <p className="text-slate-500">Bet A</p>
            <p className="text-white font-semibold">{opp.teamA.split(' ').slice(-1)[0]}</p>
            <p className="text-white font-bold">{formatOdds(opp.oddsA)}</p>
            <p className="text-slate-500 text-xs">{opp.bookAName}</p>
          </div>
          <div className="flex items-center text-slate-500 font-sans text-xs">+</div>
          {isThreeWay && (
            <>
              <div className="flex-1 rounded-lg px-3 py-2 space-y-0.5 pill-glow-white">
                <p className="text-slate-500">Bet C</p>
                <p className="text-white font-semibold">Draw</p>
                <p className="text-white font-bold">{formatOdds(opp.oddsC!)}</p>
                <p className="text-slate-500 text-xs">{opp.bookCName}</p>
              </div>
              <div className="flex items-center text-slate-500 font-sans text-xs">+</div>
            </>
          )}
          <div className="flex-1 rounded-lg px-3 py-2 space-y-0.5 pill-glow-purple">
            <p className="text-purple-400/70">Bet B</p>
            <p className="text-white font-semibold">{opp.teamB.split(' ').slice(-1)[0]}</p>
            <p className="text-purple-300 font-bold">{formatOdds(opp.oddsB)}</p>
            <p className="text-purple-400/50 text-xs">{opp.bookBName}</p>
          </div>
        </div>
        {isThreeWay && (
          <p className="text-[10px] text-amber-400/80">3-way market — all three results must be covered for the edge to hold</p>
        )}
      </button>

      {expanded && (
        <div className="border-t border-[#3D1A6E] px-4 pb-4 pt-3 space-y-4 animate-fade-in">
          {/* Plain language explanation */}
          <div className="bg-[#100020] rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest">How this works</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isThreeWay ? (
                <>By betting on <span className="text-white font-semibold">all three results</span> (including the draw) across different apps,</>
              ) : (
                <>By betting on <span className="text-white font-semibold">both teams</span> across two different apps,</>
              )}{' '}
              the math is set up to come out ahead regardless of the final score —
              this is called an <span className="text-purple-400 font-semibold">arbitrage opportunity</span> — rare, but real.
              As with any bet, odds can shift before you place it and sportsbooks can limit or void wagers, so place both legs quickly.
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
                {isThreeWay && (
                  <div className="flex items-start gap-3 rounded-xl p-3 pill-glow-white">
                    <span className="w-6 h-6 rounded-full bg-white/10 border border-white/25 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.15)]">2</span>
                    <div className="text-sm">
                      <p className="text-white">Open <span className="text-white font-bold">{opp.bookCName}</span></p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Bet <span className="text-white font-bold font-mono">${stakeC.toFixed(2)}</span> on{' '}
                        <span className="text-white font-semibold">Draw</span>{' '}
                        ({formatOdds(opp.oddsC!)})
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 rounded-xl p-3 pill-glow-purple">
                  <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.6)]">{isThreeWay ? 3 : 2}</span>
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
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center justify-center shrink-0">{isThreeWay ? 4 : 3}</span>
                  <div className="text-sm">
                    <p className="text-white">Sit back and collect 💰</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      <span className="text-emerald-400 font-bold drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]">+${profit.toFixed(2)}</span>{' '}
                      locked in across every outcome, once both bets are placed
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center py-3 bg-emerald-500/8 rounded-xl border border-emerald-500/20 shadow-[0_0_18px_rgba(52,211,153,0.15)]">
                <p className="text-xs text-slate-400">Total invested: <span className="text-white font-mono">${parsed.toFixed(2)}</span></p>
                <p className="text-2xl font-bold text-emerald-400 mt-1 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">+${profit.toFixed(2)}</p>
                <p className="text-xs text-slate-500">locked-in edge across every outcome</p>
              </div>

              {matchingBet && (
                <button
                  onClick={() => {
                    // Determine which arb side is the hedge for this bet
                    const isHedgeA = matchingBet.opposingTeam === opp.teamA;
                    const isHedgeC = !isHedgeA && isThreeWay && matchingBet.opposingTeam === opp.teamC;
                    const hedgeOdds = isHedgeA ? opp.oddsA : isHedgeC ? opp.oddsC! : opp.oddsB;
                    const hedgeDec = americanToDecimal(hedgeOdds);
                    const { hedgeStake, guaranteedProfit } = calcLiveHedge(
                      matchingBet.stake,
                      matchingBet.potentialPayout,
                      hedgeDec,
                    );
                    const newOpp = {
                      hedgeTeam: isHedgeA ? opp.teamA : isHedgeC ? opp.teamC! : opp.teamB,
                      hedgeBook: isHedgeA ? opp.bookAName : isHedgeC ? opp.bookCName! : opp.bookBName,
                      hedgeBookKey: isHedgeA ? opp.bookAKey : isHedgeC ? opp.bookCKey! : opp.bookBKey,
                      hedgeStake,
                      hedgeOdds,
                      guaranteedProfit,
                      foundAt: Date.now(),
                      eventTime: opp.event.commence_time,
                    };
                    updateBet(matchingBet.id, {
                      hedgeOpportunity: newOpp,
                      hedgeValueTrend: undefined,
                      previousGuaranteedProfit: undefined,
                    });
                    setUpdated(true);
                    setTimeout(() => onSwitchToMyBets?.(), 1500);
                  }}
                  disabled={updated}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
                    updated
                      ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                      : 'bg-green-500 hover:bg-green-400 text-white shadow-[0_0_18px_rgba(34,197,94,0.4)]'
                  }`}
                >
                  {updated ? '✓ Hedge updated! Switching to My Bets…' : `Update ${matchingBet.opposingTeam?.split(' ').slice(-1)[0]} hedge in My Bets →`}
                </button>
              )}

              {isThreeWay ? (
                <p className="text-center text-[11px] text-slate-500 px-2">
                  3-way hedges (3 separate bets) aren't auto-tracked yet — place all three bets above, then log them manually in My Bets.
                </p>
              ) : (
                <button
                  onClick={() => onAddToTracker(stakeA, stakeB, profit)}
                  className="w-full py-3.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-sm transition-all btn-glow"
                >
                  Add both bets to my tracker →
                </button>
              )}

              {onSendToCalc && (
                <button
                  onClick={() => onSendToCalc({
                    originalOdds: formatOdds(opp.oddsA),
                    originalStake: stakeA.toFixed(2),
                    hedgeOdds: formatOdds(opp.oddsB),
                    hedgeBook: opp.bookBName,
                  })}
                  className="w-full py-2.5 rounded-xl border border-purple-500/30 text-purple-300 text-xs font-semibold hover:border-purple-500/60 hover:text-purple-200 transition-all"
                >
                  Send to Pro Calculator →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Live & Upcoming Game Card ────────────────────────────────────────────────

function UpcomingGameCard({ event, userBooks }: { event: OddsEvent; userBooks: string[] }) {
  const [watchedTeams, setWatchedTeams] = useState<Set<string>>(new Set());

  const bestHome = findBestOddsForTeam(event, event.home_team, userBooks);
  const bestAway = findBestOddsForTeam(event, event.away_team, userBooks);

  const now = Date.now();
  const startMs = new Date(event.commence_time).getTime();
  const diffMs = startMs - now;
  // Status tiers
  const isLive      = diffMs < 0 && diffMs > -4 * 3_600_000;        // started in last 4h
  const isImminent  = !isLive && diffMs < 30 * 60_000;               // < 30 min away
  const isSoon      = !isLive && !isImminent && diffMs < 2 * 3_600_000; // 30 min – 2h

  const isNearArb =
    bestHome && bestAway
      ? 1 / americanToDecimal(bestHome.price) + 1 / americanToDecimal(bestAway.price) < 1.04
      : false;

  // Card border + glow
  const cardStyle = isLive
    ? 'border-red-500/60 shadow-[0_0_28px_rgba(239,68,68,0.28),inset_0_0_0_1px_rgba(239,68,68,0.08)]'
    : isImminent
    ? 'border-amber-500/50 shadow-[0_0_18px_rgba(245,158,11,0.22)]'
    : isNearArb
    ? 'border-purple-500/30'
    : '';

  // Left-edge status bar
  const barBg = isLive     ? '#EF4444'
    : isImminent           ? '#F59E0B'
    : isSoon               ? 'rgba(245,158,11,0.35)'
    : 'transparent';
  const barShadow = isLive     ? '0 0 10px rgba(239,68,68,0.9)'
    : isImminent               ? '0 0 8px rgba(245,158,11,0.7)'
    : 'none';

  function watchTeam(team: string, opponent: string, best: { price: number; bookKey: string } | null) {
    if (watchedTeams.has(team)) return;
    const opponentBest = team === event.home_team ? bestAway : bestHome;
    addWatchedBet({
      label: `${team} vs ${opponent}`,
      myTeam: team,
      opposingTeam: opponent,
      sport: event.sport_key,
      eventId: event.id,
      sportsbook: best?.bookKey ?? '',
      stake: 0,
      potentialPayout: 0,
      initialOdds: best?.price,
      initialOpposingOdds: opponentBest?.price,
      notifyHedge: false,
      eventStartTime: event.commence_time,
    });
    setWatchedTeams((prev) => new Set([...prev, team]));
  }

  function watchBoth() {
    if (!watchedTeams.has(event.home_team)) {
      addWatchedBet({
        label: `${event.home_team} vs ${event.away_team}`,
        myTeam: event.home_team,
        opposingTeam: event.away_team,
        sport: event.sport_key,
        eventId: event.id,
        sportsbook: bestHome?.bookKey ?? '',
        stake: 0,
        potentialPayout: 0,
        initialOdds: bestHome?.price,
        initialOpposingOdds: bestAway?.price,
        notifyHedge: false,
        eventStartTime: event.commence_time,
      });
    }
    if (!watchedTeams.has(event.away_team)) {
      addWatchedBet({
        label: `${event.away_team} vs ${event.home_team}`,
        myTeam: event.away_team,
        opposingTeam: event.home_team,
        sport: event.sport_key,
        eventId: event.id,
        sportsbook: bestAway?.bookKey ?? '',
        stake: 0,
        potentialPayout: 0,
        initialOdds: bestAway?.price,
        initialOpposingOdds: bestHome?.price,
        notifyHedge: false,
        eventStartTime: event.commence_time,
      });
    }
    setWatchedTeams(new Set([event.home_team, event.away_team]));
  }

  const bothWatched   = watchedTeams.has(event.home_team) && watchedTeams.has(event.away_team);
  const neitherWatched = !watchedTeams.has(event.home_team) && !watchedTeams.has(event.away_team);

  return (
    <div className={`card overflow-hidden relative ${cardStyle}`}>
      {/* Left-edge status bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] shrink-0"
        style={{ background: barBg, boxShadow: barShadow }}
      />

      <div className="p-4 space-y-3">
        {/* Status row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {isLive ? (
              /* ── LIVE pill — red, pulsing, unmissable ── */
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-red-500/70 bg-red-500/20 text-red-400 text-xs font-bold tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.35)]">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
                LIVE NOW
              </span>
            ) : isImminent ? (
              /* ── IMMINENT pill — amber countdown ── */
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/60 bg-amber-500/15 text-amber-400 text-xs font-bold tracking-wider">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                {Math.round(diffMs / 60_000)} MIN
              </span>
            ) : isSoon ? (
              /* ── SOON — amber time ── */
              <span className="text-xs font-semibold text-amber-400/80 font-mono">
                {formatGameTime(event.commence_time)}
              </span>
            ) : (
              /* ── standard time ── */
              <span className="text-xs text-slate-500 font-mono">{formatGameTime(event.commence_time)}</span>
            )}
            <span className="text-[10px] text-slate-600 font-mono">
              {SPORT_LABEL[event.sport_key] ?? '🏟️'}
            </span>
          </div>

          {isNearArb && (
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest border border-purple-500/30 rounded-full px-2 py-0.5 bg-purple-500/10 shrink-0">
              Near Arb
            </span>
          )}
        </div>

        {/* Matchup */}
        <p className={`text-sm font-semibold leading-snug ${isLive ? 'text-white' : 'text-white'}`}>
          {event.away_team}{' '}
          <span className="text-slate-500 font-normal text-xs">@</span>{' '}
          {event.home_team}
        </p>

        {/* Best odds grid */}
        {(bestHome || bestAway) && (
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {[
              { team: event.home_team, best: bestHome },
              { team: event.away_team, best: bestAway },
            ].map(({ team, best }) => (
              <div
                key={team}
                className={`rounded-xl p-2.5 space-y-0.5 ${
                  isLive ? 'bg-red-500/8 border border-red-500/15' : 'bg-[#180032]'
                }`}
              >
                <p className="text-slate-500 truncate text-[11px]">{team.split(' ').slice(-1)[0]}</p>
                {best ? (
                  <>
                    <p className={`font-bold text-sm ${best.price > 0 ? 'text-purple-400' : 'text-slate-200'}`}>
                      {formatOdds(best.price)}
                    </p>
                    <p className="text-slate-600 text-[10px]">{best.bookName}</p>
                  </>
                ) : (
                  <p className="text-slate-700 text-sm">—</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Watch buttons */}
        <div className="space-y-1.5">
          <div className="flex gap-2">
            {[
              { team: event.home_team, opponent: event.away_team, best: bestHome },
              { team: event.away_team, opponent: event.home_team, best: bestAway },
            ].map(({ team, opponent, best }) => {
              const isWatched = watchedTeams.has(team);
              return (
                <button
                  key={team}
                  disabled={isWatched}
                  onClick={() => watchTeam(team, opponent, best)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    isWatched
                      ? 'border-white/20 text-white/50 cursor-default'
                      : 'border-[#3D1A6E] text-slate-400 hover:border-purple-500/40 hover:text-purple-400'
                  }`}
                >
                  {isWatched ? `✓ ${team.split(' ').slice(-1)[0]}` : `+ Watch ${team.split(' ').slice(-1)[0]}`}
                </button>
              );
            })}
          </div>
          {neitherWatched && (
            <button
              onClick={watchBoth}
              className="w-full py-1.5 rounded-lg text-xs font-semibold border border-[#3D1A6E] text-slate-500 hover:border-purple-500/40 hover:text-purple-400 transition-colors"
            >
              + Watch Both Teams
            </button>
          )}
          {bothWatched && (
            <p className="text-center text-[10px] text-slate-600 font-mono pt-0.5">Both teams tracked in My Bets</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Opportunities Screen ─────────────────────────────────────────────────────

export default function Opportunities({ onSwitchToMyBets, onSendToCalc, refreshTrigger }: { onSwitchToMyBets?: () => void; onSendToCalc?: (prefill: CalcPrefill) => void; refreshTrigger?: number }) {
  const [arbs, setArbs] = useState<ArbOpportunity[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<OddsEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);
  const [hedgeReadyBets, setHedgeReadyBets] = useState<TrackedBet[]>([]);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [showAllArbs, setShowAllArbs] = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const handledTrigger = useRef(0);

  const apiKey = getApiKey();
  const userBooks = getSelectedBooks();
  const isConfigured = apiKey.length > 0 && userBooks.length > 0;

  const favSports = getFavoriteSports();
  const hasFavorites = favSports.length > 0;
  const TOP_N = 10;
  const UPCOMING_LIMIT = 6;
  const sortedArbs = hasFavorites
    ? [...arbs.filter(a => favSports.includes(a.event.sport_key)),
       ...arbs.filter(a => !favSports.includes(a.event.sport_key))]
    : arbs;
  const visibleArbs = showAllArbs ? sortedArbs : sortedArbs.slice(0, TOP_N);
  const hasMoreArbs = sortedArbs.length > TOP_N && !showAllArbs;
  const visibleUpcoming = showAllUpcoming ? upcomingGames : upcomingGames.slice(0, UPCOMING_LIMIT);
  const hasMoreUpcoming = upcomingGames.length > UPCOMING_LIMIT && !showAllUpcoming;

  async function scan() {
    setLoading(true);
    setError(null);
    setArbs([]);
    setUpcomingGames([]);
    setShowAllArbs(false);
    setShowAllUpcoming(false);
    try {
      const results = await Promise.allSettled(
        SCAN_SPORTS.map((s) => fetchOdds(s, apiKey, userBooks)),
      );
      const allEvents: OddsEvent[] = results
        .filter((r): r is PromiseFulfilledResult<OddsEvent[]> => r.status === 'fulfilled')
        .flatMap((r) => r.value);

      const foundArbs: ArbOpportunity[] = [];
      const arbEventIds = new Set<string>();

      for (const event of allEvents) {
        const arb = findArb(event, userBooks);
        if (arb) {
          foundArbs.push(arb);
          arbEventIds.add(event.id);
        }
      }

      const currentBets = getAllBets();
      // Events where the user already has an active bet — suppress from arb list
      const activeBetEventIds = new Set(
        currentBets
          .filter(b => b.eventId && (b.status === 'monitoring' || b.status === 'hedge_ready' || b.status === 'hedged'))
          .map(b => b.eventId as string),
      );

      foundArbs.sort((a, b) => b.profitPct - a.profitPct);
      setArbs(foundArbs.filter((a) => a.guaranteedProfit > 0 && !activeBetEventIds.has(a.event.id)));

      // Live & upcoming: games starting within the next 24h or started < 4h ago
      const now = Date.now();
      const foundUpcoming = allEvents
        .filter((e) => {
          const diff = new Date(e.commence_time).getTime() - now;
          return diff > -4 * 3_600_000 && diff < 24 * 3_600_000;
        })
        .filter((e) => {
          // Always include live games so they appear in Live & Upcoming
          // Only exclude future arb games (they're already shown in the arb section above)
          if (!arbEventIds.has(e.id)) return true;
          const diff = new Date(e.commence_time).getTime() - now;
          return diff < 0; // include if already started (live)
        })
        .sort((a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime())
        .slice(0, 50);
      setUpcomingGames(foundUpcoming);

      setHedgeReadyBets(currentBets.filter((b) => b.status === 'hedge_ready' && b.eventId));
      setLastScanTime(new Date());
      setScanned(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
    } finally {
      setLoading(false);
    }
  }

  // Scan whenever the tab is focused (refreshTrigger increments on each visit)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > handledTrigger.current && isConfigured) {
      handledTrigger.current = refreshTrigger;
      scan();
    }
  }, [refreshTrigger]); // eslint-disable-line

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
      {/* Page header */}
      <div className="px-5 pt-12 pb-4 border-b border-[#1E0840]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Live Markets</p>
            <h1 className="text-xl font-bold text-white mt-0.5 font-grotesk">Find Hedges</h1>
            {lastScanTime && (
              <p className="text-[10px] text-slate-600 font-mono mt-0.5">
                scanned {lastScanTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <button
            onClick={scan}
            disabled={loading}
            className="text-xs text-purple-300 hover:text-white border border-purple-500/40 px-3 py-1.5 rounded-lg transition-all hover:border-purple-500/70 hover:shadow-[0_0_10px_rgba(168,85,247,0.3)] disabled:opacity-50"
          >
            {loading ? '…' : '↺ Scan'}
          </button>
        </div>
      </div>

      {/* How it works info */}
      <div className="px-4 pt-3">
        <div className="card p-3 border-blue-500/20 bg-blue-500/5">
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="text-blue-300 font-semibold">How it works:</span> Different sportsbooks sometimes price the same game differently. When the gap is big enough, betting BOTH sides can lock in a profit regardless of the final score — though odds can move before you finish placing both bets, so speed matters.
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
          {sortedArbs.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <p className="text-xs font-bold text-purple-400 uppercase tracking-widest font-grotesk">
                  {sortedArbs.length} profit-lock opportunit{sortedArbs.length !== 1 ? 'ies' : 'y'} found
                </p>
              </div>
              {visibleArbs.map((a) => (
                <ArbCard
                  key={a.event.id}
                  opp={a}
                  isFavorite={hasFavorites && favSports.includes(a.event.sport_key)}
                  matchingBet={hedgeReadyBets.find((b) => b.eventId === a.event.id)}
                  onSwitchToMyBets={onSwitchToMyBets}
                  onSendToCalc={onSendToCalc}
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
                    // Remove from list so it doesn't reappear when user comes back
                    setArbs(prev => prev.filter(arb => arb.event.id !== a.event.id));
                    onSwitchToMyBets?.();
                  }}
                />
              ))}
              {hasMoreArbs && (
                <button
                  onClick={() => setShowAllArbs(true)}
                  className="w-full py-3 rounded-xl border border-purple-500/30 text-purple-400 text-xs font-semibold hover:border-purple-500/60 hover:text-purple-300 transition-all"
                >
                  Show {sortedArbs.length - TOP_N} more opportunit{sortedArbs.length - TOP_N !== 1 ? 'ies' : 'y'} ↓
                </button>
              )}
            </div>
          ) : (
            <div className="card p-5 text-center space-y-2">
              <p className="text-slate-300 font-semibold">No profit-lock opportunities right now</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                These are rare — check back during peak betting hours or try different sports in Settings.
              </p>
            </div>
          )}

          {/* Live & Upcoming Games */}
          {upcomingGames.length > 0 && (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-grotesk">Live & Upcoming Today</p>
                <p className="text-xs text-slate-500 mt-0.5">Watch a team — get alerted the moment a hedge opportunity appears</p>
              </div>
              {visibleUpcoming.map((e) => (
                <UpcomingGameCard key={e.id} event={e} userBooks={userBooks} />
              ))}
              {hasMoreUpcoming && (
                <button
                  onClick={() => setShowAllUpcoming(true)}
                  className="w-full py-3 rounded-xl border border-[#3D1A6E] text-slate-500 text-xs font-semibold hover:border-purple-500/30 hover:text-slate-400 transition-all"
                >
                  Show {upcomingGames.length - UPCOMING_LIMIT} more game{upcomingGames.length - UPCOMING_LIMIT !== 1 ? 's' : ''} ↓
                </button>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
