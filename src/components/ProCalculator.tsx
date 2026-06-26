import { useState, useEffect } from 'react';
import { calculate, parseOdds, decimalToAmerican } from '../utils/odds';
import { US_SPORTSBOOKS } from '../utils/sportsbooks';
import { addBetWithHedge } from '../utils/storage';

export type OddsFormat = 'american' | 'decimal';

export interface CalcPrefill {
  originalOdds?: string;    // raw string in current format
  originalStake?: string;
  originalPayout?: string;  // parlay total payout
  hedgeOdds?: string;
  hedgeBook?: string;
  isParlay?: boolean;
}

interface Props {
  prefill?: CalcPrefill | null;
  onClearPrefill?: () => void;
  fmt: OddsFormat;
  onFmtChange: (f: OddsFormat) => void;
  onSaveToTracker?: () => void;
}

function impliedPct(decOdds: number) { return (1 / decOdds) * 100; }
function holdPct(d1: number, d2: number) { return (1 / d1 + 1 / d2 - 1) * 100; }
function noVigLine(impl1: number, impl2: number, target: number): number {
  return 100 / ((target / (impl1 + impl2)) * 100);
}

export default function ProCalculator({ prefill, onClearPrefill, fmt, onFmtChange, onSaveToTracker }: Props) {
  const [origOdds, setOrigOdds] = useState('');
  const [origStake, setOrigStake] = useState('');
  const [origPayout, setOrigPayout] = useState('');
  const [isParlay, setIsParlay] = useState(false);
  const [hedgeOdds, setHedgeOdds] = useState('');
  const [hedgeStakeOverride, setHedgeStakeOverride] = useState('');
  const [hedgeBook, setHedgeBook] = useState('');

  // Track-both-bets form state
  const [showTrackForm, setShowTrackForm] = useState(false);
  const [trackLabel, setTrackLabel] = useState('');
  const [trackHedgeTeam, setTrackHedgeTeam] = useState('');
  const [trackOrigBook, setTrackOrigBook] = useState('');

  useEffect(() => {
    if (!prefill) return;
    if (prefill.originalOdds !== undefined) setOrigOdds(prefill.originalOdds);
    if (prefill.originalStake !== undefined) setOrigStake(prefill.originalStake);
    if (prefill.originalPayout !== undefined) setOrigPayout(prefill.originalPayout);
    if (prefill.hedgeOdds !== undefined) setHedgeOdds(prefill.hedgeOdds);
    if (prefill.hedgeBook !== undefined) setHedgeBook(prefill.hedgeBook);
    if (prefill.isParlay !== undefined) setIsParlay(prefill.isParlay);
    // Reset track form when new prefill arrives
    setShowTrackForm(false);
    setTrackLabel('');
    setTrackHedgeTeam('');
    setTrackOrigBook('');
  }, [prefill]);

  // Parse original side
  const origDecOdds = isParlay ? null : parseOdds(origOdds, fmt);
  const parsedStake = parseFloat(origStake);
  const parsedPayoutInput = parseFloat(origPayout);
  const parsedPayout = isParlay
    ? (!isNaN(parsedPayoutInput) ? parsedPayoutInput : null)
    : (origDecOdds && !isNaN(parsedStake) ? parsedStake * origDecOdds : null);

  // Parse hedge side
  const hedgeDecOdds = parseOdds(hedgeOdds, fmt);
  const hedgeStake = parseFloat(hedgeStakeOverride) || undefined;

  const valid =
    !isNaN(parsedStake) && parsedStake > 0 &&
    parsedPayout !== null && parsedPayout > parsedStake &&
    hedgeDecOdds !== null && hedgeDecOdds > 1;

  const result = valid ? calculate(parsedStake, parsedPayout!, hedgeDecOdds!, hedgeStake) : null;

  // Analytics
  const hold = (!isParlay && origDecOdds && hedgeDecOdds)
    ? holdPct(origDecOdds, hedgeDecOdds) : null;

  const implOrig = origDecOdds ? impliedPct(origDecOdds) : null;
  const implHedge = hedgeDecOdds ? impliedPct(hedgeDecOdds) : null;

  // No-vig fair lines
  let fairOrigAm: string | null = null;
  let fairHedgeAm: string | null = null;
  if (implOrig && implHedge) {
    const total = implOrig + implHedge;
    fairOrigAm = decimalToAmerican(noVigLine(implOrig, implHedge, implOrig) * (total / 100));
    fairHedgeAm = decimalToAmerican(noVigLine(implHedge, implOrig, implHedge) * (total / 100));
    // Simpler: fair dec = total_implied/team_implied
    const fairOrigDec = (implOrig + implHedge) / implOrig;
    const fairHedgeDec = (implOrig + implHedge) / implHedge;
    fairOrigAm = decimalToAmerican(fairOrigDec);
    fairHedgeAm = decimalToAmerican(fairHedgeDec);
  }

  const bookName = US_SPORTSBOOKS.find((b) => b.key === hedgeBook)?.name;
  const bookUrl = US_SPORTSBOOKS.find((b) => b.key === hedgeBook)?.url;

  const trackFormReady = trackLabel.trim().length > 0 && trackOrigBook.length > 0;

  function handleSaveToTracker() {
    if (!result || !parsedPayout || !hedgeDecOdds || !trackFormReady) return;
    const amStr = decimalToAmerican(hedgeDecOdds);
    const hedgeAmOdds = parseFloat(amStr);
    const hedgeBookDisplay = US_SPORTSBOOKS.find((b) => b.key === hedgeBook)?.name ?? hedgeBook;
    addBetWithHedge({
      label: trackLabel.trim(),
      myTeam: trackLabel.trim(),
      sportsbook: trackOrigBook,
      stake: parsedStake,
      potentialPayout: parsedPayout,
      sport: 'other',
      isParlay,
      hedgeOpportunity: {
        hedgeTeam: trackHedgeTeam.trim() || 'Opposing outcome',
        hedgeBook: hedgeBookDisplay,
        hedgeBookKey: hedgeBook,
        hedgeStake: result.optimalHedgeStake,
        hedgeOdds: hedgeAmOdds,
        guaranteedProfit: result.guaranteedProfit,
        foundAt: Date.now(),
      },
    });
    setShowTrackForm(false);
    onSaveToTracker?.();
  }

  const placeholder = (side: 'orig' | 'hedge') =>
    fmt === 'american'
      ? (side === 'orig' ? '+150' : '+170')
      : (side === 'orig' ? '2.500' : '2.700');

  return (
    <div className="px-4 pt-2 pb-32 space-y-3">

      {prefill && (
        <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-2">
          <p className="text-xs text-purple-400 font-mono">PRE-FILLED FROM {prefill.hedgeBook ? 'RADAR' : 'LINES'}</p>
          <button onClick={onClearPrefill} className="text-[10px] text-slate-500 hover:text-slate-300 font-mono uppercase">Clear</button>
        </div>
      )}

      {/* Odds format + parlay toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-0.5 bg-[#100020] rounded-lg p-0.5">
          {(['american', 'decimal'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { onFmtChange(f); setOrigOdds(''); setHedgeOdds(''); }}
              className={`text-[11px] px-3 py-1 rounded-md font-mono font-bold tracking-wider transition-colors ${fmt === f ? 'bg-[#180032] text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {f === 'american' ? 'AM' : 'DEC'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsParlay((v) => !v)}
          className={`text-[11px] px-3 py-1 rounded-lg font-mono font-bold tracking-wider border transition-colors ${isParlay ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' : 'border-[#3D1A6E] text-slate-500 hover:text-slate-300'}`}
        >
          PARLAY
        </button>
      </div>

      {/* Original bet inputs */}
      <div className="card p-4 space-y-3">
        <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Original Bet</p>
        <div className={`grid gap-2 ${isParlay ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {!isParlay && (
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">Odds</label>
              <input
                type="text"
                value={origOdds}
                onChange={(e) => setOrigOdds(e.target.value)}
                placeholder={placeholder('orig')}
                className="input-field font-mono text-sm tracking-wide"
                autoComplete="off"
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">Stake</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">$</span>
              <input
                type="number"
                value={origStake}
                onChange={(e) => setOrigStake(e.target.value)}
                placeholder="0.00"
                className="input-field pl-6 font-mono text-sm"
                min="0"
                step="any"
              />
            </div>
          </div>
          {isParlay && (
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">Total Payout</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">$</span>
                <input
                  type="number"
                  value={origPayout}
                  onChange={(e) => setOrigPayout(e.target.value)}
                  placeholder="0.00"
                  className="input-field pl-6 font-mono text-sm"
                  min="0"
                  step="any"
                />
              </div>
            </div>
          )}
        </div>
        {parsedPayout !== null && !isNaN(parsedPayout) && parsedPayout > parsedStake && (
          <div className="flex gap-4 text-[11px] font-mono text-slate-500 border-t border-[#3D1A6E] pt-2">
            <span>PAYOUT <span className="text-slate-300">${parsedPayout.toFixed(2)}</span></span>
            <span>NET <span className="text-purple-400">+${(parsedPayout - parsedStake).toFixed(2)}</span></span>
            {implOrig && <span>IMPL <span className="text-slate-300">{implOrig.toFixed(1)}%</span></span>}
          </div>
        )}
      </div>

      {/* Hedge inputs */}
      <div className="card p-4 space-y-3">
        <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Hedge Leg</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">Odds</label>
            <input
              type="text"
              value={hedgeOdds}
              onChange={(e) => setHedgeOdds(e.target.value)}
              placeholder={placeholder('hedge')}
              className="input-field font-mono text-sm tracking-wide"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">Stake Override</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">$</span>
              <input
                type="number"
                value={hedgeStakeOverride}
                onChange={(e) => setHedgeStakeOverride(e.target.value)}
                placeholder={result ? result.optimalHedgeStake.toFixed(2) : 'optimal'}
                className="input-field pl-6 font-mono text-sm"
                min="0"
                step="any"
              />
            </div>
          </div>
        </div>

        {/* Book selector */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">Book</label>
          <select
            value={hedgeBook}
            onChange={(e) => setHedgeBook(e.target.value)}
            className="input-field text-sm font-mono bg-[#180032]"
          >
            <option value="">— select book —</option>
            {US_SPORTSBOOKS.map((b) => (
              <option key={b.key} value={b.key}>{b.shortName} · {b.name}</option>
            ))}
          </select>
        </div>

        {(implHedge || hold !== null) && (
          <div className="flex gap-4 text-[11px] font-mono text-slate-500 border-t border-[#3D1A6E] pt-2">
            {implHedge && <span>IMPL <span className="text-slate-300">{implHedge.toFixed(1)}%</span></span>}
            {hold !== null && (
              <span>
                HOLD <span className={hold > 6 ? 'text-red-400' : hold > 3.5 ? 'text-amber-400' : 'text-slate-300'}>{hold.toFixed(2)}%</span>
              </span>
            )}
            {fairOrigAm && <span>FAIR-O <span className="text-slate-300">{fairOrigAm}</span></span>}
            {fairHedgeAm && <span>FAIR-H <span className="text-slate-300">{fairHedgeAm}</span></span>}
          </div>
        )}
      </div>

      {/* Results */}
      {result && valid && (
        <>
          {/* Main metrics 2×2 */}
          <div className="grid grid-cols-2 gap-2">
            <div className={`card p-3 ${result.isGuaranteedProfit ? 'border-purple-500/30 bg-purple-500/5' : 'border-amber-500/20'}`}>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Optimal Hedge</p>
              <p className="text-lg font-bold font-mono text-white">${result.optimalHedgeStake.toFixed(2)}</p>
            </div>
            <div className={`card p-3 ${result.isGuaranteedProfit ? 'border-purple-500/30 bg-purple-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Guaranteed P&L</p>
              <p className={`text-lg font-bold font-mono ${result.isGuaranteedProfit ? 'text-purple-400' : 'text-red-400'}`}>
                {result.guaranteedProfit >= 0 ? '+' : ''}${result.guaranteedProfit.toFixed(2)}
              </p>
            </div>
            <div className="card p-3">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">If Orig Wins</p>
              <p className="text-base font-bold font-mono text-white">+${result.profitIfOriginalWins.toFixed(2)}</p>
            </div>
            <div className="card p-3">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">If Hedge Wins</p>
              <p className="text-base font-bold font-mono text-white">+${result.profitIfHedgeWins.toFixed(2)}</p>
            </div>
          </div>

          {/* Analytics table */}
          <div className="card p-4 space-y-2">
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Analytics</p>
            <div className="space-y-1.5">
              {([
                ['Total Invested',   `-$${result.totalInvested.toFixed(2)}`],
                ['ROI on Hedge',     `${(result.roi * 100).toFixed(2)}%`],
                hold !== null ? ['Market Hold', `${hold.toFixed(2)}%`] : null,
                fairOrigAm ? ['No-Vig Line (orig)', fairOrigAm] : null,
                fairHedgeAm ? ['No-Vig Line (hedge)', fairHedgeAm] : null,
                ['No-Hedge Win',    `+$${result.noHedgeProfitIfWins.toFixed(2)}`],
                ['No-Hedge Loss',   `-$${Math.abs(result.noHedgeLossIfLoses).toFixed(2)}`],
                ['Break-even Prob', `${(parsedStake / parsedPayout! * 100).toFixed(1)}%`],
                hedgeStake ? ['Hedge Stake (custom)', `-$${result.hedgeStakeUsed.toFixed(2)}`] : null,
              ] as ([string, string] | null)[])
                .filter((r): r is [string, string] => r !== null)
                .map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center text-[11px] font-mono">
                    <span className="text-slate-500 uppercase tracking-wide">{label}</span>
                    <span className="text-slate-300">{val}</span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Quick launch */}
          {bookName && bookUrl && (
            <a
              href={bookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between card p-4 hover:border-slate-500 transition-colors"
            >
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Place Hedge At</p>
                <p className="text-sm font-bold text-white">{bookName}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {result.optimalHedgeStake.toFixed(2)} · {hedgeOdds}
                </p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-slate-400">
                <path d="M3 13L13 3M13 3H7M13 3v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}

          {/* Track Both Bets */}
          <div className="card p-4 space-y-3 border-[#CCFF00]/30 bg-[#CCFF00]/5 shadow-[0_0_16px_rgba(204,255,0,0.08)]">
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse shrink-0" />
              <p className="text-[10px] font-mono font-bold text-[#CCFF00] uppercase tracking-widest">
                Add Both Bets to Tracker
              </p>
            </div>

            {!showTrackForm ? (
              <button
                onClick={() => setShowTrackForm(true)}
                className="w-full py-3 rounded-xl border border-[#CCFF00]/30 bg-[#CCFF00]/5 text-[#CCFF00] text-xs font-bold font-mono hover:bg-[#CCFF00]/15 transition-colors tracking-wider"
              >
                TRACK THIS HEDGE →
              </button>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">Bet Label</label>
                  <input
                    type="text"
                    value={trackLabel}
                    onChange={(e) => setTrackLabel(e.target.value)}
                    placeholder="e.g. Chiefs to win Super Bowl"
                    className="input-field text-sm"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">Hedge Outcome (Bet B)</label>
                  <input
                    type="text"
                    value={trackHedgeTeam}
                    onChange={(e) => setTrackHedgeTeam(e.target.value)}
                    placeholder="e.g. Eagles (team/outcome you're hedging on)"
                    className="input-field text-sm"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">Original Sportsbook (Bet A)</label>
                  <select
                    value={trackOrigBook}
                    onChange={(e) => setTrackOrigBook(e.target.value)}
                    className="input-field text-sm font-mono bg-[#180032]"
                  >
                    <option value="">— where you placed your original bet —</option>
                    {US_SPORTSBOOKS.map((b) => (
                      <option key={b.key} value={b.key}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Summary */}
                <div className="bg-[#100020] rounded-xl p-3 space-y-1.5 text-[11px] font-mono border border-[#3D1A6E]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 uppercase tracking-wide">Bet A (original)</span>
                    <span className="text-slate-300">${parsedStake.toFixed(2)} → ${parsedPayout!.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 uppercase tracking-wide">Bet B (hedge)</span>
                    <span className="text-slate-300">${result.optimalHedgeStake.toFixed(2)} · {hedgeOdds} · {bookName ?? '—'}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-[#3D1A6E] pt-1.5">
                    <span className="text-[#CCFF00] font-bold uppercase tracking-wide">Guaranteed Profit</span>
                    <span className="text-[#CCFF00] font-bold">+${result.guaranteedProfit.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowTrackForm(false)}
                    className="w-20 py-3 rounded-xl border border-[#3D1A6E] text-slate-500 text-xs font-mono hover:text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveToTracker}
                    disabled={!trackFormReady}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold font-mono transition-colors ${
                      trackFormReady
                        ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-[#180032] text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    Save to My Bets →
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {!valid && (
        <div className="card p-6 text-center">
          <p className="text-[11px] text-slate-600 font-mono tracking-widest uppercase">
            Enter original bet + hedge odds to calculate
          </p>
        </div>
      )}
    </div>
  );
}
