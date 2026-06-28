import { useState, useCallback } from 'react';
import { fetchEventProps, type OddsEvent } from '../utils/oddsApi';
import { US_SPORTSBOOKS, PROP_MARKETS } from '../utils/sportsbooks';
import { americanToDecimal } from '../utils/arb';
import type { OddsFormat } from './ProCalculator';
import type { AddToBetsPrefill } from './AddToBetsSheet';

interface Props {
  event: OddsEvent;
  sport: string;
  apiKey: string;
  userBooks: string[];
  fmt: OddsFormat;
  onAddToBets: (prefill: AddToBetsPrefill) => void;
}

function fmtPrice(price: number, fmt: OddsFormat): string {
  if (fmt === 'american') return price >= 0 ? `+${price}` : `${price}`;
  return americanToDecimal(price).toFixed(3);
}

export default function PlayerPropsSection({ event, sport, apiKey, userBooks, fmt, onAddToBets }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [propsData, setPropsData] = useState<OddsEvent | null>(null);
  const [selectedMarket, setSelectedMarket] = useState('');
  const [loadedOnce, setLoadedOnce] = useState(false);

  const markets = PROP_MARKETS[sport] ?? [];

  const loadProps = useCallback(async () => {
    if (!apiKey || !userBooks.length || !markets.length) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEventProps(sport, event.id, markets.map((m) => m.key), apiKey, userBooks);
      setPropsData(data);
      const firstWithData = markets.find((m) =>
        data.bookmakers.some((bk) => bk.markets.some((bkm) => bkm.key === m.key)),
      );
      setSelectedMarket(firstWithData?.key ?? markets[0]?.key ?? '');
      setLoadedOnce(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load props');
      setLoadedOnce(true);
    } finally {
      setLoading(false);
    }
  }, [sport, event.id, apiKey, userBooks, markets]);

  function getBestForPlayer(
    marketKey: string,
    playerName: string,
    direction: string,
  ): { price: number; bookKey: string; bookShort: string } | null {
    if (!propsData) return null;
    let best: { price: number; bookKey: string; bookShort: string } | null = null;
    let bestDec = 0;
    for (const bm of propsData.bookmakers) {
      if (!userBooks.includes(bm.key)) continue;
      const mkt = bm.markets.find((m) => m.key === marketKey);
      if (!mkt) continue;
      const outcome = mkt.outcomes.find((o) => o.name === playerName && o.description === direction);
      if (!outcome) continue;
      const dec = americanToDecimal(outcome.price);
      if (dec > bestDec) {
        bestDec = dec;
        const sb = US_SPORTSBOOKS.find((b) => b.key === bm.key);
        best = { price: outcome.price, bookKey: bm.key, bookShort: sb?.shortName ?? bm.key };
      }
    }
    return best;
  }

  function getLineForPlayer(marketKey: string, playerName: string): number | null {
    if (!propsData) return null;
    for (const bm of propsData.bookmakers) {
      const mkt = bm.markets.find((m) => m.key === marketKey);
      if (!mkt) continue;
      const outcome = mkt.outcomes.find((o) => o.name === playerName && o.point != null);
      if (outcome?.point != null) return outcome.point;
    }
    return null;
  }

  function getPlayersForMarket(marketKey: string): string[] {
    if (!propsData) return [];
    const players = new Set<string>();
    for (const bm of propsData.bookmakers) {
      if (!userBooks.includes(bm.key)) continue;
      const mkt = bm.markets.find((m) => m.key === marketKey);
      if (!mkt) continue;
      for (const o of mkt.outcomes) players.add(o.name);
    }
    return Array.from(players);
  }

  if (markets.length === 0) return null;

  const players = selectedMarket ? getPlayersForMarket(selectedMarket) : [];
  const marketLabel = markets.find((m) => m.key === selectedMarket)?.label ?? '';

  return (
    <div className="border-t border-[#3D1A6E]">
      {/* Toggle header */}
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open && !loadedOnce) loadProps();
        }}
        className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-[#180032]/30 transition-colors"
      >
        <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
          Player Props
        </span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-3">
          {loading && (
            <div className="flex items-center gap-2 py-3 text-xs font-mono text-slate-500">
              <span className="w-3 h-3 border border-purple-500 border-t-transparent rounded-full animate-spin" />
              Loading props...
            </div>
          )}

          {!loadedOnce && !loading && (
            <div className="py-2">
              <button
                onClick={loadProps}
                className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold border border-[#3D1A6E] text-slate-300 hover:border-purple-500/30 hover:text-purple-400 transition-colors"
              >
                Load Props
              </button>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 font-mono py-2">{error}</p>
          )}

          {loadedOnce && !loading && !error && (
            <>
              {/* Market pills */}
              <div className="flex gap-1.5 flex-wrap py-2">
                {markets.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setSelectedMarket(m.key)}
                    className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border transition-colors ${
                      selectedMarket === m.key
                        ? 'border-purple-500/50 text-purple-400 bg-purple-500/10'
                        : 'border-[#3D1A6E] text-slate-500 hover:border-purple-500/30 hover:text-slate-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
                <button
                  onClick={loadProps}
                  className="px-2 py-1 rounded-full text-xs font-mono border border-[#3D1A6E] text-slate-600 hover:text-slate-400 transition-colors ml-auto"
                  title="Reload"
                >
                  ↺
                </button>
              </div>

              {players.length === 0 ? (
                <p className="text-xs text-slate-500 font-mono text-center py-3">
                  No data for this market
                </p>
              ) : (
                <div className="space-y-2">
                  {players.map((player) => {
                    const line = getLineForPlayer(selectedMarket, player);
                    const over = getBestForPlayer(selectedMarket, player, 'Over');
                    const under = getBestForPlayer(selectedMarket, player, 'Under');
                    if (!over && !under) return null;

                    return (
                      <div key={player} className="bg-[#100020] rounded-lg p-3">
                        <p className="text-xs font-semibold text-slate-300 mb-2 truncate">{player}</p>
                        {over && (
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold text-green-400 w-3">O</span>
                              {line != null && (
                                <span className="text-xs font-mono text-slate-400">{line}</span>
                              )}
                              <span className="text-xs font-mono font-bold text-purple-400">
                                {fmtPrice(over.price, fmt)}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">{over.bookShort}</span>
                            </div>
                            <button
                              onClick={() =>
                                onAddToBets({
                                  label: `${player} ${marketLabel} O${line != null ? ` ${line}` : ''}`,
                                  myTeam: player,
                                  sport,
                                  sportsbook: over.bookKey,
                                  initialOdds: over.price,
                                  isProp: true,
                                  propMarket: marketLabel,
                                  propLine: line ?? undefined,
                                  eventId: event.id,
                                  opposingTeam: event.away_team,
                                })
                              }
                              className="w-6 h-6 rounded border border-[#3D1A6E] text-slate-500 hover:border-purple-500/40 hover:text-purple-400 transition-colors flex items-center justify-center text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                        )}
                        {under && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold text-red-400 w-3">U</span>
                              {line != null && (
                                <span className="text-xs font-mono text-slate-400">{line}</span>
                              )}
                              <span className="text-xs font-mono font-bold text-purple-400">
                                {fmtPrice(under.price, fmt)}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">{under.bookShort}</span>
                            </div>
                            <button
                              onClick={() =>
                                onAddToBets({
                                  label: `${player} ${marketLabel} U${line != null ? ` ${line}` : ''}`,
                                  myTeam: player,
                                  sport,
                                  sportsbook: under.bookKey,
                                  initialOdds: under.price,
                                  isProp: true,
                                  propMarket: marketLabel,
                                  propLine: line ?? undefined,
                                  eventId: event.id,
                                  opposingTeam: event.away_team,
                                })
                              }
                              className="w-6 h-6 rounded border border-[#3D1A6E] text-slate-500 hover:border-purple-500/40 hover:text-purple-400 transition-colors flex items-center justify-center text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
