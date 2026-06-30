import { useEffect, useState } from 'react';
import {
  removeVig,
  impliedProbability,
  calculateEV,
  calculateKelly,
  hasNoEdge,
} from '../utils/proMath';
import InfoTooltip from './InfoTooltip';
import ProDisclaimer from './ProDisclaimer';

interface Props {
  origDecOdds: number;
  hedgeDecOdds: number;
  stake: number;
}

type KellyMode = 'quarter' | 'half' | 'full';
const KELLY_FRACTIONS: Record<KellyMode, number> = { quarter: 0.25, half: 0.5, full: 1 };
const KELLY_LABELS: Record<KellyMode, string> = { quarter: '¼', half: '½', full: 'Full' };

// New analytics panel embedded inside ProCalculator's results block. Reuses
// origDecOdds/hedgeDecOdds already computed there (no new odds parsing) to
// de-vig the original side's market, then lets the user adjust off that
// fair number to size EV/Kelly. Never auto-bets — output is a recommendation,
// "Track Both Bets" above remains the only flow that writes a bet.
export default function ProEdgeFinder({ origDecOdds, hedgeDecOdds, stake }: Props) {
  const [rawOrigProb, rawHedgeProb] = [impliedProbability(origDecOdds), impliedProbability(hedgeDecOdds)];
  const [fairOrigProb] = removeVig([rawOrigProb, rawHedgeProb]);
  const fairPct = fairOrigProb * 100;

  const [userPct, setUserPct] = useState(() => Math.round(fairPct * 10) / 10);
  const [kellyMode, setKellyMode] = useState<KellyMode>('quarter');
  const [maxPct, setMaxPct] = useState('10');
  const [bankroll, setBankroll] = useState('');

  // Re-anchor the user's estimate to the new market number whenever the
  // entered odds change — the input is always an adjustment, not blank entry.
  useEffect(() => {
    setUserPct(Math.round(fairPct * 10) / 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origDecOdds, hedgeDecOdds]);

  const p = userPct / 100;
  const noEdge = hasNoEdge(p, fairOrigProb);
  const ev = calculateEV(p, origDecOdds, stake);
  const maxFraction = (parseFloat(maxPct) || 0) / 100;
  const kelly = calculateKelly(p, origDecOdds, KELLY_FRACTIONS[kellyMode], maxFraction);
  const bankrollNum = parseFloat(bankroll);
  const recommendedDollar = !isNaN(bankrollNum) && bankrollNum > 0 ? bankrollNum * kelly.recommendedFraction : null;

  function step(delta: number) {
    setUserPct((v) => Math.min(99, Math.max(1, Math.round((v + delta) * 10) / 10)));
  }

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Edge Finder</p>
        <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">Pro</span>
      </div>

      {/* Vig removal: raw vs fair */}
      <div className="flex items-center justify-between bg-[#100020] rounded-xl p-3">
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-slate-500 font-mono uppercase tracking-wide">No-Vig Probability</p>
          <InfoTooltip
            label="Vig removal"
            text="Sportsbook odds always imply slightly more than 100% total probability — that extra is the book's built-in edge (the vig). Removing it proportionally gives the market's true, de-vigged estimate of each side's chances."
          />
        </div>
        <div className="text-right">
          <p className="text-sm font-bold font-mono text-white">{fairPct.toFixed(1)}%</p>
          <p className="text-[10px] font-mono text-slate-600">raw {(rawOrigProb * 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Probability estimate input */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-slate-400 font-mono">
            The market puts this at <span className="text-white font-bold">{fairPct.toFixed(1)}%</span> — adjust only if you know something it doesn't:
          </p>
          <InfoTooltip
            label="Your probability estimate"
            text="Start from the market's number — it's already a strong estimate. Only move it if you have a specific reason the market hasn't priced in yet: injury news, weather, a matchup edge, or a lineup/motivation factor. Moving it without a real reason just adds noise."
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => step(-0.5)}
            className="w-8 h-8 shrink-0 rounded-lg border border-[#3D1A6E] text-slate-400 hover:border-purple-500/40 hover:text-purple-400 transition-colors font-mono"
          >
            −
          </button>
          <input
            type="range"
            min={1}
            max={99}
            step={0.5}
            value={userPct}
            onChange={(e) => setUserPct(parseFloat(e.target.value))}
            className="flex-1 accent-purple-500"
          />
          <button
            type="button"
            onClick={() => step(0.5)}
            className="w-8 h-8 shrink-0 rounded-lg border border-[#3D1A6E] text-slate-400 hover:border-purple-500/40 hover:text-purple-400 transition-colors font-mono"
          >
            +
          </button>
          <span className="w-14 text-right text-sm font-bold font-mono text-white shrink-0">{userPct.toFixed(1)}%</span>
        </div>
      </div>

      {noEdge ? (
        <div className="rounded-xl border border-slate-600/40 bg-[#100020] p-4 text-center space-y-1">
          <p className="text-sm font-bold font-mono text-slate-300 uppercase tracking-widest">No Edge — No Bet</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your estimate is within 1.5 points of the market's own number — that's not enough of a difference to call it an edge.
          </p>
        </div>
      ) : (
        <>
          {/* EV display */}
          <div className={`rounded-xl border p-3 flex items-center justify-between ${ev.ev > 0 ? 'border-purple-500/30 bg-purple-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-mono text-slate-500 uppercase tracking-wide">Expected Value</p>
              <InfoTooltip
                label="Expected value (EV)"
                text="EV = (your probability × profit if you win) − (your probability of losing × your stake). A positive EV means this bet wins more than it loses on average over many bets — not that it will win this time."
              />
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold font-mono ${ev.ev > 0 ? 'text-purple-400' : 'text-red-400'}`}>
                {ev.ev >= 0 ? '+' : ''}${ev.ev.toFixed(2)}
              </p>
              <p className={`text-[10px] font-mono ${ev.ev > 0 ? 'text-purple-400/70' : 'text-red-400/70'}`}>
                {ev.evPct >= 0 ? '+' : ''}{(ev.evPct * 100).toFixed(1)}% of stake · {ev.ev > 0 ? '+EV' : '−EV'}
              </p>
            </div>
          </div>

          {/* Kelly staking */}
          <div className="space-y-2 border-t border-[#3D1A6E] pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-mono text-slate-500 uppercase tracking-wide">Kelly Staking</p>
                <InfoTooltip
                  label="Fractional Kelly"
                  text="Full Kelly sizes a bet to maximize long-run bankroll growth, but it's aggressive and volatile. Most bettors use a fraction of it (¼ or ½) to cut variance while keeping most of the growth benefit. The bankroll cap is a hard ceiling regardless of what Kelly suggests."
                />
              </div>
              <div className="flex gap-0.5 bg-[#100020] rounded-lg p-0.5">
                {(['quarter', 'half', 'full'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setKellyMode(m)}
                    className={`text-xs px-2.5 py-1 rounded-md font-mono font-bold tracking-wider transition-colors ${kellyMode === m ? 'bg-[#180032] text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {KELLY_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-500 uppercase tracking-wider">Bankroll Cap %</label>
                <input
                  type="number"
                  value={maxPct}
                  onChange={(e) => setMaxPct(e.target.value)}
                  className="input-field text-sm font-mono"
                  min="0"
                  max="100"
                  step="any"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-500 uppercase tracking-wider">Bankroll $ (optional)</label>
                <input
                  type="number"
                  value={bankroll}
                  onChange={(e) => setBankroll(e.target.value)}
                  placeholder="e.g. 1000"
                  className="input-field text-sm font-mono"
                  min="0"
                  step="any"
                />
              </div>
            </div>

            {kelly.noBet ? (
              <div className="rounded-xl border border-slate-600/40 bg-[#100020] p-3 text-center">
                <p className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">No Bet — Negative Edge</p>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-[#100020] rounded-xl p-3">
                <p className="text-xs font-mono text-slate-500 uppercase tracking-wide">Recommended Stake</p>
                <div className="text-right">
                  <p className="text-sm font-bold font-mono text-white">
                    {recommendedDollar !== null ? `$${recommendedDollar.toFixed(2)}` : '—'}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">{kelly.recommendedPct.toFixed(2)}% of bankroll</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <ProDisclaimer />
    </div>
  );
}
