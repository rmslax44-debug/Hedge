import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getAllBets,
  getApiKey,
  getSelectedBooks,
  updateBet,
  type TrackedBet,
  type HedgeOpportunity,
} from '../utils/storage';
import { fetchOdds, findBestOddsForTeam, type OddsEvent } from '../utils/oddsApi';
import { americanToDecimal, calcLiveHedge } from '../utils/arb';
import { US_SPORTSBOOKS } from '../utils/sportsbooks';
import type { CalcPrefill } from './ProCalculator';
import type { OddsFormat } from './ProCalculator';

interface LiveOpp {
  bet: TrackedBet;
  hedgeTeam: string;
  hedgeBook: string;
  hedgeBookKey: string;
  hedgeOddsAm: number;       // American
  hedgeDecOdds: number;
  hedgeStake: number;
  guaranteedProfit: number;
  roi: number;
}

interface Props {
  onOpenCalc: (prefill: CalcPrefill) => void;
  fmt: OddsFormat;
  onSwitchToMyBets?: () => void;
  scanTrigger?: number;
}

function fmtAm(price: number) { return price >= 0 ? `+${price}` : `${price}`; }

export default function ProDashboard({ onOpenCalc, fmt, onSwitchToMyBets, scanTrigger }: Props) {
  const [scanning, setScanning] = useState(false);
  const [opps, setOpps] = useState<LiveOpp[]>([]);
  const [noEventBets, setNoEventBets] = useState<TrackedBet[]>([]);
  const [lastScan, setLastScan] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiKey = getApiKey();
  const books = getSelectedBooks();
  const noApi = !apiKey || !books.length;

  // Track which trigger values we've already handled to avoid duplicate scans
  const handledTrigger = useRef(0);

  const scan = useCallback(async () => {
    setScanning(true);
    setError(null);

    const bets = getAllBets().filter((b) => b.status === 'monitoring' || b.status === 'hedge_ready');
    const withEvent = bets.filter((b) => b.eventId && b.opposingTeam && b.sport);
    const withoutEvent = bets.filter((b) => !(b.eventId && b.opposingTeam && b.sport));
    setNoEventBets(withoutEvent);

    if (!withEvent.length) {
      setOpps([]);
      setScanning(false);
      setLastScan(Date.now());
      return;
    }

    // Group by sport to minimise API calls
    const bySport = new Map<string, TrackedBet[]>();
    for (const b of withEvent) {
      const list = bySport.get(b.sport!) ?? [];
      list.push(b);
      bySport.set(b.sport!, list);
    }

    const found: LiveOpp[] = [];

    try {
      for (const [sport, sportBets] of bySport) {
        let events: OddsEvent[];
        try {
          events = await fetchOdds(sport, apiKey, books);
        } catch {
          continue;
        }

        for (const bet of sportBets) {
          const event = events.find((e) => e.id === bet.eventId);
          if (!event || !bet.opposingTeam) continue;

          const bestHedge = findBestOddsForTeam(event, bet.opposingTeam, books);
          if (!bestHedge) continue;

          const dec = americanToDecimal(bestHedge.price);
          const { hedgeStake, guaranteedProfit } = calcLiveHedge(
            bet.stake,
            bet.potentialPayout,
            dec,
          );
          const totalInvested = bet.stake + hedgeStake;
          const roi = totalInvested > 0 ? (guaranteedProfit / totalInvested) * 100 : 0;

          const opp: LiveOpp = {
            bet,
            hedgeTeam: bet.opposingTeam,
            hedgeBook: bestHedge.bookName,
            hedgeBookKey: bestHedge.bookKey,
            hedgeOddsAm: bestHedge.price,
            hedgeDecOdds: dec,
            hedgeStake,
            guaranteedProfit,
            roi,
          };

          if (guaranteedProfit > 0) {
            const hedgeOpp: HedgeOpportunity = {
              hedgeTeam: bet.opposingTeam,
              hedgeBook: bestHedge.bookName,
              hedgeBookKey: bestHedge.bookKey,
              hedgeStake,
              hedgeOdds: bestHedge.price,
              guaranteedProfit,
              foundAt: Date.now(),
            };
            // Clear stale trend flags so My Bets shows the live hedge, not "gone negative"
            updateBet(bet.id, {
              status: 'hedge_ready',
              hedgeOpportunity: hedgeOpp,
              hedgeValueTrend: undefined,
              previousGuaranteedProfit: undefined,
            });
            found.push(opp);
          } else if (bet.status === 'hedge_ready') {
            // Mark existing hedge_ready bets as gone_negative so My Bets shows the right state
            updateBet(bet.id, { hedgeValueTrend: 'gone_negative', previousGuaranteedProfit: bet.hedgeOpportunity?.guaranteedProfit });
          }
        }
      }

      // Sort: profitable first, then by ROI desc
      found.sort((a, b) => {
        if (a.guaranteedProfit > 0 && b.guaranteedProfit <= 0) return -1;
        if (a.guaranteedProfit <= 0 && b.guaranteedProfit > 0) return 1;
        return b.roi - a.roi;
      });

      setOpps(found);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
    } finally {
      setScanning(false);
      setLastScan(Date.now());
    }
  }, [apiKey, books]);

  // Auto-scan when triggered from a My Bets notification
  useEffect(() => {
    if (scanTrigger && scanTrigger > handledTrigger.current && !noApi) {
      handledTrigger.current = scanTrigger;
      scan();
    }
  }, [scanTrigger]); // eslint-disable-line

  const bookUrl = (key: string) => US_SPORTSBOOKS.find((b) => b.key === key)?.url;

  function sinceLabel(ts: number) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  }

  return (
    <div className="px-4 pt-2 pb-32 space-y-3">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Hedge Radar</p>
          {lastScan && !scanning && (
            <p className="text-xs font-mono text-slate-500">{sinceLabel(lastScan)}</p>
          )}
        </div>
        <button
          onClick={scan}
          disabled={scanning || noApi}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
            scanning
              ? 'border-purple-500/20 text-purple-400 bg-purple-500/10'
              : noApi
              ? 'border-[#3D1A6E] text-slate-500 cursor-not-allowed'
              : 'border-[#3D1A6E] text-slate-300 hover:border-purple-500/30 hover:text-purple-400'
          }`}
        >
          {scanning ? (
            <>
              <span className="w-3 h-3 border border-purple-500 border-t-transparent rounded-full animate-spin" />
              SCANNING
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M10 6A4 4 0 1 1 6 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <path d="M10 2v4H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              SCAN NOW
            </>
          )}
        </button>
      </div>

      {/* Setup required */}
      {noApi && (
        <div className="card p-4 border-[#CCFF00]/40 bg-[#CCFF00]/10 shadow-[0_0_16px_rgba(204,255,0,0.15)]">
          <p className="text-xs font-bold font-mono text-[#CCFF00] tracking-wide uppercase flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse shrink-0" />
            API KEY + BOOKS REQUIRED
          </p>
          <p className="text-xs text-slate-400 mt-1">Configure in Settings to enable live scanning.</p>
        </div>
      )}

      {error && (
        <div className="card p-3 border-red-500/20 bg-red-500/5">
          <p className="text-xs font-mono text-red-400">{error}</p>
        </div>
      )}

      {/* Live opportunities */}
      {opps.length > 0 && (
        <div className="space-y-2">
          {opps.map((o, i) => {
            const url = bookUrl(o.hedgeBookKey);
            const prefill: CalcPrefill = {
              originalStake: String(o.bet.stake),
              originalPayout: String(o.bet.potentialPayout),
              hedgeOdds: fmt === 'american'
                ? fmtAm(o.hedgeOddsAm)
                : o.hedgeDecOdds.toFixed(3),
              hedgeBook: o.hedgeBookKey,
              isParlay: true,
              label: o.bet.label,
              origBookKey: o.bet.sportsbook,
              hedgeTeam: o.hedgeTeam,
            };

            return (
              <div key={o.bet.id} className={`card p-4 space-y-3 ${o.guaranteedProfit > 0 ? 'border-purple-500/20' : 'border-amber-500/10'}`}>
                {/* Rank + bet label */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${o.guaranteedProfit > 0 ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-500/20 text-slate-400'}`}>
                      #{i + 1}
                    </span>
                    <p className="text-sm font-semibold text-white leading-tight">{o.bet.label}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-mono font-bold ${o.guaranteedProfit > 0 ? 'text-purple-400' : 'text-amber-400'}`}>
                      ROI {o.roi.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Hedge instruction */}
                <div className="font-mono text-xs space-y-0.5">
                  <div className="flex gap-3 text-slate-400">
                    <span>HEDGE</span>
                    <span className="text-white">{o.hedgeTeam}</span>
                    <span className="text-white">{fmtAm(o.hedgeOddsAm)}</span>
                    <span className={`px-1.5 rounded ${o.guaranteedProfit > 0 ? 'bg-purple-500/15 text-purple-400' : 'bg-[#2D0060] text-slate-400'}`}>
                      {o.hedgeBook}
                    </span>
                  </div>
                  <div className="flex gap-6 text-slate-500">
                    <span>STAKE <span className="text-white">${o.hedgeStake.toFixed(2)}</span></span>
                    <span>LOCK <span className={o.guaranteedProfit > 0 ? 'text-purple-400' : 'text-amber-400'}>
                      {o.guaranteedProfit >= 0 ? '+' : ''}${o.guaranteedProfit.toFixed(2)}
                    </span></span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onOpenCalc(prefill)}
                    className="flex-1 py-2 rounded-lg text-xs font-mono font-bold border border-[#3D1A6E] text-slate-300 hover:border-purple-500/30 hover:text-purple-400 transition-colors"
                  >
                    OPEN CALC →
                  </button>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 rounded-lg text-xs font-mono font-bold text-center border border-[#3D1A6E] text-slate-300 hover:border-slate-500 transition-colors"
                    >
                      {o.hedgeBook.toUpperCase()} ↗
                    </a>
                  )}
                </div>
                {onSwitchToMyBets && (
                  <button
                    onClick={() => {
                      // Re-apply the scanned hedge at click-time so My Bets always
                      // shows this exact opportunity with stale trend flags cleared.
                      updateBet(o.bet.id, {
                        status: 'hedge_ready',
                        hedgeOpportunity: {
                          hedgeTeam: o.hedgeTeam,
                          hedgeBook: o.hedgeBook,
                          hedgeBookKey: o.hedgeBookKey,
                          hedgeStake: o.hedgeStake,
                          hedgeOdds: o.hedgeOddsAm,
                          guaranteedProfit: o.guaranteedProfit,
                          foundAt: Date.now(),
                        },
                        hedgeValueTrend: undefined,
                        previousGuaranteedProfit: undefined,
                      });
                      onSwitchToMyBets();
                    }}
                    className="w-full py-2 rounded-lg text-xs font-mono font-bold bg-green-500/15 border border-green-500/40 text-green-400 hover:bg-green-500/25 transition-colors"
                  >
                    VIEW UPDATED HEDGE IN MY BETS →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bets without event data */}
      {noEventBets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">No Live Data</p>
          {noEventBets.map((b) => (
            <div key={b.id} className="card p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-slate-400 truncate">{b.label}</p>
                <p className="text-xs font-mono text-slate-500">Stake ${b.stake.toFixed(2)} · Payout ${b.potentialPayout.toFixed(2)}</p>
              </div>
              <button
                onClick={() =>
                  onOpenCalc({
                    originalStake: String(b.stake),
                    originalPayout: String(b.potentialPayout),
                    isParlay: true,
                  })
                }
                className="text-xs font-mono font-bold text-slate-400 hover:text-purple-400 shrink-0 border border-[#3D1A6E] px-2 py-1 rounded transition-colors"
              >
                CALC
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state after scan */}
      {lastScan && !scanning && opps.length === 0 && noEventBets.length === 0 && (
        <div className="card p-6 text-center">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">No monitoring bets found</p>
          <p className="text-xs text-slate-500 mt-1">Add bets via My Bets to track them here.</p>
        </div>
      )}

      {/* Initial state */}
      {!lastScan && !scanning && !noApi && (
        <div className="card p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl border border-[#3D1A6E] flex items-center justify-center mx-auto">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-slate-500">
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M8 5.5v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Hit SCAN NOW to check live odds</p>
        </div>
      )}
    </div>
  );
}
