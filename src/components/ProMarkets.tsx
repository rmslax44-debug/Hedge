import { useState, useCallback } from 'react';
import { fetchOdds, getOddsForTeamAtBook, type OddsEvent } from '../utils/oddsApi';
import { getApiKey, getSelectedBooks, addWatchedBet } from '../utils/storage';
import { US_SPORTSBOOKS, SPORTS } from '../utils/sportsbooks';
import { americanToDecimal } from '../utils/arb';
import type { CalcPrefill, OddsFormat } from './ProCalculator';
import AddToBetsSheet, { type AddToBetsPrefill } from './AddToBetsSheet';
import PlayerPropsSection from './PlayerPropsSection';

interface Props {
  onPrefill: (prefill: CalcPrefill) => void;
  fmt: OddsFormat;
}

function holdPct(d1: number | null, d2: number | null): number | null {
  if (!d1 || !d2) return null;
  return (1 / d1 + 1 / d2 - 1) * 100;
}

function fmtPrice(price: number, fmt: OddsFormat): string {
  if (fmt === 'american') return price >= 0 ? `+${price}` : `${price}`;
  return americanToDecimal(price).toFixed(3);
}

function commenceLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function ProMarkets({ onPrefill, fmt }: Props) {
  const [sport, setSport] = useState('americanfootball_nfl');
  const [events, setEvents] = useState<OddsEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showImplied, setShowImplied] = useState(false);
  const [watchedKeys, setWatchedKeys] = useState<Set<string>>(new Set());
  const [sheetPrefill, setSheetPrefill] = useState<AddToBetsPrefill | null>(null);

  const apiKey = getApiKey();
  const userBooks = getSelectedBooks();
  const activeBooks = US_SPORTSBOOKS.filter((b) => userBooks.includes(b.key));

  const load = useCallback(async () => {
    if (!apiKey || !userBooks.length) return;
    setLoading(true);
    setError(null);
    setEvents([]);
    setExpandedId(null);
    try {
      const data = await fetchOdds(sport, apiKey, userBooks);
      // Sort soonest first
      data.sort((a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime());
      setEvents(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [sport, apiKey, userBooks.join(',')]);

  const noApi = !apiKey || !userBooks.length;

  function bestPrice(event: OddsEvent, team: string): number | null {
    let best: number | null = null;
    let bestDec = 0;
    for (const bk of userBooks) {
      const p = getOddsForTeamAtBook(event, team, bk);
      if (p === null) continue;
      const dec = americanToDecimal(p);
      if (dec > bestDec) { bestDec = dec; best = p; }
    }
    return best;
  }

  function oddsCell(event: OddsEvent, team: string, bookKey: string): { price: number | null; isBest: boolean; isSecond: boolean } {
    const price = getOddsForTeamAtBook(event, team, bookKey);
    const bst = bestPrice(event, team);
    const isBest = price !== null && price === bst;

    // Second-best: highest dec among non-best
    let secondDec = 0;
    for (const bk of userBooks) {
      if (bk === bookKey) continue;
      const p = getOddsForTeamAtBook(event, team, bk);
      if (p === null) continue;
      const dec = americanToDecimal(p);
      if (dec > secondDec && (bst === null || p !== bst)) secondDec = dec;
    }
    const isSecond = !isBest && price !== null && Math.abs(americanToDecimal(price) - secondDec) < 0.001;

    return { price, isBest, isSecond };
  }

  return (
    <div className="px-4 pt-2 pb-32 space-y-3">

      {/* Sport + load controls */}
      <div className="flex gap-2">
        <select
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          className="flex-1 input-field text-sm font-mono bg-[#180032] truncate"
        >
          {SPORTS.map((s) => (
            <option key={s.key} value={s.key}>{s.emoji} {s.name}</option>
          ))}
        </select>
        <button
          onClick={load}
          disabled={loading || noApi}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-colors ${
            loading
              ? 'border-purple-500/20 text-purple-400'
              : noApi
              ? 'border-[#3D1A6E] text-slate-500 cursor-not-allowed'
              : 'border-[#3D1A6E] text-slate-300 hover:border-purple-500/30 hover:text-purple-400'
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 border border-purple-500 border-t-transparent rounded-full animate-spin" />
              LOAD
            </span>
          ) : 'LOAD'}
        </button>
      </div>

      {/* View toggle */}
      {events.length > 0 && (
        <div className="flex items-center gap-2 justify-end">
          <span className="text-xs font-mono text-slate-500">SHOW:</span>
          <button
            onClick={() => setShowImplied((v) => !v)}
            className={`text-xs font-mono px-2 py-0.5 rounded border transition-colors ${showImplied ? 'border-purple-500/30 text-purple-400' : 'border-[#3D1A6E] text-slate-500'}`}
          >
            {showImplied ? 'IMPL %' : 'ODDS'}
          </button>
        </div>
      )}

      {noApi && (
        <div className="card p-4 border-[#CCFF00]/40 bg-[#CCFF00]/10 shadow-[0_0_16px_rgba(204,255,0,0.15)]">
          <p className="text-xs font-bold font-mono text-[#CCFF00] tracking-wide uppercase flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse shrink-0" />
            API KEY + BOOKS REQUIRED — configure in Settings
          </p>
        </div>
      )}

      {error && (
        <div className="card p-3 border-red-500/20 bg-red-500/5">
          <p className="text-xs font-mono text-red-400">{error}</p>
        </div>
      )}

      {/* Event list */}
      {events.map((event) => {
        const expanded = expandedId === event.id;
        const teams = [event.home_team, event.away_team];

        // Pre-compute best prices per team
        const bestPrices = teams.map((t) => bestPrice(event, t));
        const homeDecBest = bestPrices[0] !== null ? americanToDecimal(bestPrices[0]) : null;
        const awayDecBest = bestPrices[1] !== null ? americanToDecimal(bestPrices[1]) : null;
        const hold = holdPct(homeDecBest, awayDecBest);

        return (
          <div key={event.id} className="card overflow-hidden">
            {/* Event header */}
            <button
              onClick={() => setExpandedId(expanded ? null : event.id)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#180032]/30 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {event.away_team} <span className="text-slate-500">@</span> {event.home_team}
                </p>
                <div className="flex gap-3 mt-0.5 text-xs font-mono text-slate-500">
                  <span>{commenceLabel(event.commence_time)}</span>
                  {hold !== null && (
                    <span className={hold > 6 ? 'text-amber-400' : hold > 3.5 ? 'text-amber-400/70' : 'text-slate-500'}>
                      HOLD {hold.toFixed(1)}%
                    </span>
                  )}
                  {bestPrices[0] !== null && bestPrices[1] !== null && (
                    <span className="text-slate-500">
                      {fmtPrice(bestPrices[0], fmt)} / {fmtPrice(bestPrices[1], fmt)}
                    </span>
                  )}
                </div>
              </div>
              <svg
                width="14" height="14" viewBox="0 0 14 14" fill="none"
                className={`text-slate-500 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
              >
                <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Odds matrix */}
            {expanded && (
              <div className="border-t border-[#3D1A6E] overflow-x-auto">
                <table className="w-full text-xs font-mono">

                  <thead>
                    <tr className="border-b border-[#3D1A6E]">
                      <th className="text-left px-4 py-2 text-slate-500 font-normal uppercase tracking-wider w-28">Team</th>
                      {activeBooks.map((bk) => (
                        <th key={bk.key} className="px-3 py-2 text-slate-500 font-normal text-center">{bk.shortName}</th>
                      ))}
                      <th className="px-3 py-2 text-slate-500 font-normal text-center">BEST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((team, ti) => (
                      <tr key={team} className="border-b border-[#100020]">
                        <td className="px-4 py-2.5 text-slate-300 truncate max-w-[7rem]">
                          {team.split(' ').pop()}
                        </td>
                        {activeBooks.map((bk) => {
                          const { price, isBest, isSecond } = oddsCell(event, team, bk.key);
                          const displayVal = price === null ? '—'
                            : showImplied
                            ? `${(1 / americanToDecimal(price) * 100).toFixed(0)}%`
                            : fmtPrice(price, fmt);

                          return (
                            <td key={bk.key} className="px-3 py-2.5 text-center">
                              {price !== null ? (
                                <button
                                  onClick={() => {
                                    const dec = americanToDecimal(price);
                                    const hedgeOddsStr = fmt === 'american'
                                      ? (price >= 0 ? `+${price}` : `${price}`)
                                      : dec.toFixed(3);
                                    onPrefill({ hedgeOdds: hedgeOddsStr, hedgeBook: bk.key });
                                  }}
                                  className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                                    isBest
                                      ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                                      : isSecond
                                      ? 'text-amber-400/80 hover:text-amber-400'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  {displayVal}
                                </button>
                              ) : (
                                <span className="text-slate-700">{displayVal}</span>
                              )}
                            </td>
                          );
                        })}
                        {/* Best column */}
                        <td className="px-3 py-2.5 text-center">
                          {bestPrices[ti] !== null ? (
                            <button
                              onClick={() => {
                                const bst = US_SPORTSBOOKS.find((b) =>
                                  userBooks.includes(b.key) &&
                                  getOddsForTeamAtBook(event, team, b.key) === bestPrices[ti],
                                );
                                const dec = americanToDecimal(bestPrices[ti]!);
                                const hedgeOddsStr = fmt === 'american'
                                  ? (bestPrices[ti]! >= 0 ? `+${bestPrices[ti]}` : `${bestPrices[ti]}`)
                                  : dec.toFixed(3);
                                onPrefill({ hedgeOdds: hedgeOddsStr, hedgeBook: bst?.key ?? '' });
                              }}
                              className="text-purple-400 font-bold hover:text-purple-300 transition-colors"
                            >
                              {showImplied
                                ? `${(1 / americanToDecimal(bestPrices[ti]!) * 100).toFixed(0)}%`
                                : fmtPrice(bestPrices[ti]!, fmt)}
                            </button>
                          ) : (
                            <span className="text-slate-700">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {/* Hold row */}
                    <tr className="bg-[#0A1220]">
                      <td className="px-4 py-1.5 text-slate-500 text-xs uppercase tracking-wider">Hold</td>
                      {activeBooks.map((bk) => {
                        const p1 = getOddsForTeamAtBook(event, teams[0], bk.key);
                        const p2 = getOddsForTeamAtBook(event, teams[1], bk.key);
                        const h = holdPct(
                          p1 !== null ? americanToDecimal(p1) : null,
                          p2 !== null ? americanToDecimal(p2) : null,
                        );
                        return (
                          <td key={bk.key} className="px-3 py-1.5 text-center">
                            {h !== null ? (
                              <span className={`text-xs ${h > 6 ? 'text-red-400' : h > 3.5 ? 'text-amber-400' : 'text-slate-500'}`}>
                                {h.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-slate-700 text-xs">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-1.5 text-center">
                        <span className={`text-xs ${hold !== null && hold > 6 ? 'text-red-400' : hold !== null && hold > 3.5 ? 'text-amber-400' : 'text-slate-500'}`}>
                          {hold !== null ? `${hold.toFixed(1)}%` : '—'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
                {/* Watch buttons */}
                <div className="border-t border-[#3D1A6E] px-4 py-2 flex gap-2">
                  {teams.map((team, ti) => {
                    const watchKey = `${event.id}-${team}`;
                    const isWatched = watchedKeys.has(watchKey);
                    const opponent = teams[1 - ti];
                    const bstPrice = bestPrices[ti];
                    const bestBookKey = userBooks.find(
                      (bk) => getOddsForTeamAtBook(event, team, bk) === bstPrice,
                    ) ?? '';
                    return (
                      <div key={team} className="flex-1 flex gap-1">
                        <button
                          disabled={isWatched}
                          onClick={() => {
                            addWatchedBet({
                              label: `${team} vs ${opponent}`,
                              myTeam: team,
                              opposingTeam: opponent,
                              sport,
                              eventId: event.id,
                              sportsbook: bestBookKey,
                              stake: 0,
                              potentialPayout: 0,
                              initialOdds: bstPrice ?? undefined,
                              notifyHedge: false,
                            });
                            setWatchedKeys((prev) => new Set([...prev, watchKey]));
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
                            isWatched
                              ? 'border-white/20 text-white/50 cursor-default'
                              : 'border-[#3D1A6E] text-slate-400 hover:border-purple-500/40 hover:text-purple-400'
                          }`}
                        >
                          {isWatched ? `✓ ${team.split(' ').pop()}` : `+ Watch ${team.split(' ').pop()}`}
                        </button>
                        {!isWatched && (
                          <button
                            onClick={() =>
                              setSheetPrefill({
                                label: `${team} vs ${opponent}`,
                                myTeam: team,
                                opposingTeam: opponent,
                                sport,
                                eventId: event.id,
                                sportsbook: bestBookKey,
                                initialOdds: bstPrice ?? undefined,
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border border-[#3D1A6E] text-slate-500 hover:border-purple-500/40 hover:text-purple-400 transition-colors"
                            title="Add to parlay"
                          >
                            ⋯
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Player Props */}
                <PlayerPropsSection
                  event={event}
                  sport={sport}
                  apiKey={apiKey ?? ''}
                  userBooks={userBooks}
                  fmt={fmt}
                  onAddToBets={setSheetPrefill}
                />
              </div>
            )}
          </div>
        );
      })}

      {!loading && !error && events.length === 0 && !noApi && (
        <div className="card p-6 text-center">
          <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">
            Select a sport and hit LOAD
          </p>
        </div>
      )}

      <AddToBetsSheet prefill={sheetPrefill} onClose={() => setSheetPrefill(null)} />
    </div>
  );
}
