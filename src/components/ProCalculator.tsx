import { useState } from 'react';
import { calculate, parseOdds } from '../utils/odds';

function ProbabilityBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-bold" style={{ color }}>~{pct}%</span>
      </div>
      <div className="h-2 bg-[#1A2A40] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function ProCalculator() {
  const [stake, setStake] = useState('');
  const [payout, setPayout] = useState('');
  const [hedgeMode, setHedgeMode] = useState<'payout' | 'american'>('payout');
  const [hedgeInput, setHedgeInput] = useState('');
  const [hedgePct, setHedgePct] = useState(100);

  const parsedStake = parseFloat(stake);
  const parsedPayout = parseFloat(payout);

  let hedgeDecOdds: number | null = null;
  if (hedgeMode === 'payout') {
    const v = parseFloat(hedgeInput);
    if (!isNaN(v) && v > 100) hedgeDecOdds = v / 100;
  } else {
    hedgeDecOdds = parseOdds(hedgeInput, 'american');
  }

  const valid =
    !isNaN(parsedStake) && parsedStake > 0 &&
    !isNaN(parsedPayout) && parsedPayout > parsedStake &&
    hedgeDecOdds !== null && hedgeDecOdds > 1;

  const optResult = valid ? calculate(parsedStake, parsedPayout, hedgeDecOdds!) : null;

  const hedgeStakeAtPct = optResult
    ? Math.max(0.01, (hedgePct / 100) * optResult.optimalHedgeStake)
    : 0;

  const curResult = valid && optResult && hedgePct > 0
    ? calculate(parsedStake, parsedPayout, hedgeDecOdds!, hedgeStakeAtPct)
    : null;

  const noHedgeWin = valid ? parsedPayout - parsedStake : 0;
  const noHedgeLose = valid ? -parsedStake : 0;
  const displayWin = curResult ? curResult.profitIfOriginalWins : (hedgePct === 0 ? noHedgeWin : 0);
  const displayLose = curResult ? curResult.profitIfHedgeWins : (hedgePct === 0 ? noHedgeLose : 0);

  const maxAbs = Math.max(Math.abs(noHedgeWin), Math.abs(noHedgeLose), 1);

  const originalDecOdds = valid ? parsedPayout / parsedStake : 2;
  const pOriginalWins = Math.min(99, Math.round((1 / originalDecOdds) * 100));
  const pHedgeWins = hedgeDecOdds ? Math.min(99, Math.round((1 / hedgeDecOdds) * 100)) : 50;

  return (
    <div className="px-4 pt-4 pb-32 space-y-4">
      {/* Your original bet */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">Your original bet</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Amount you bet</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder="100"
                className="input-field pl-7 text-sm"
                min="1"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Total payout if you win</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
              <input
                type="number"
                value={payout}
                onChange={(e) => setPayout(e.target.value)}
                placeholder="250"
                className="input-field pl-7 text-sm"
                min="1"
              />
            </div>
          </div>
        </div>
        {valid && (
          <p className="text-xs text-slate-500">
            You're risking <span className="text-white">${parsedStake.toFixed(0)}</span> to win a{' '}
            <span className="text-emerald-400">+${(parsedPayout - parsedStake).toFixed(0)}</span> profit
          </p>
        )}
      </div>

      {/* Hedge odds */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Hedge odds available</h3>
          <div className="flex gap-0.5 bg-[#0D1625] rounded-lg p-0.5">
            <button
              onClick={() => { setHedgeMode('payout'); setHedgeInput(''); }}
              className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${hedgeMode === 'payout' ? 'bg-[#132035] text-white' : 'text-slate-500'}`}
            >
              $/100
            </button>
            <button
              onClick={() => { setHedgeMode('american'); setHedgeInput(''); }}
              className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${hedgeMode === 'american' ? 'bg-[#132035] text-white' : 'text-slate-500'}`}
            >
              Odds
            </button>
          </div>
        </div>

        {hedgeMode === 'payout' ? (
          <div className="space-y-1">
            <label className="text-xs text-slate-400">
              If I bet $100 on the other side, I'd get back in total:
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
              <input
                type="number"
                value={hedgeInput}
                onChange={(e) => setHedgeInput(e.target.value)}
                placeholder="185"
                className="input-field pl-7 text-sm"
                min="101"
              />
            </div>
            <p className="text-xs text-slate-600">Must be over $100 — check the app for the current total payout</p>
          </div>
        ) : (
          <div className="space-y-1">
            <label className="text-xs text-slate-400">American odds on the other side</label>
            <input
              type="text"
              value={hedgeInput}
              onChange={(e) => setHedgeInput(e.target.value)}
              placeholder="+150 or -120"
              className="input-field text-sm"
            />
            <p className="text-xs text-slate-600">The number next to the team in your betting app</p>
          </div>
        )}
      </div>

      {/* Results */}
      {valid && optResult && (
        <>
          {/* Optimal hedge callout */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Optimal Hedge</p>
              {optResult.isGuaranteedProfit && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                  GUARANTEED PROFIT
                </span>
              )}
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-slate-500">Bet this on the other side</p>
                <p className="text-2xl font-bold text-white">${optResult.optimalHedgeStake.toFixed(2)}</p>
              </div>
              <div className="w-px bg-[#1A2A40]" />
              <div>
                <p className="text-xs text-slate-500">Guaranteed profit either way</p>
                <p className={`text-2xl font-bold ${optResult.guaranteedProfit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {optResult.guaranteedProfit >= 0 ? '+' : ''}${optResult.guaranteedProfit.toFixed(2)}
                </p>
              </div>
            </div>
            {!optResult.isGuaranteedProfit && (
              <p className="text-xs text-amber-400">
                No guaranteed profit — hedging still reduces your maximum loss from ${parsedStake.toFixed(0)} to ${Math.abs(optResult.guaranteedProfit).toFixed(0)}.
              </p>
            )}
          </div>

          {/* Risk vs Reward interactive section */}
          <div className="card p-5 space-y-5">
            <div>
              <p className="text-sm font-semibold text-slate-200">Risk vs Reward</p>
              <p className="text-xs text-slate-500 mt-0.5">Drag the slider to see how hedging changes your outcomes</p>
            </div>

            {/* Outcome cards */}
            <div className="flex gap-3">
              <div className={`flex-1 rounded-xl border p-4 space-y-2 transition-all duration-300 ${displayWin >= 0 ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                <p className="text-xs text-slate-500">Your bet WINS</p>
                <p className={`text-xl font-bold transition-all duration-300 ${displayWin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {displayWin >= 0 ? '+' : ''}${displayWin.toFixed(0)}
                </p>
                <div className="h-1.5 bg-[#1A2A40] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${displayWin >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, Math.round((Math.abs(displayWin) / maxAbs) * 100))}%` }}
                  />
                </div>
              </div>

              <div className={`flex-1 rounded-xl border p-4 space-y-2 transition-all duration-300 ${displayLose >= 0 ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                <p className="text-xs text-slate-500">Other team WINS</p>
                <p className={`text-xl font-bold transition-all duration-300 ${displayLose >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {displayLose >= 0 ? '+' : ''}${displayLose.toFixed(0)}
                </p>
                <div className="h-1.5 bg-[#1A2A40] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${displayLose >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, Math.round((Math.abs(displayLose) / maxAbs) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>No hedge</span>
                <span className="text-slate-300 font-medium">
                  ${hedgeStakeAtPct.toFixed(0)} hedge ({hedgePct}%)
                </span>
                <span>Full hedge</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={hedgePct}
                onChange={(e) => setHedgePct(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="bg-[#0D1625] rounded-xl p-3 text-xs text-slate-400">
              {hedgePct === 0
                ? `High risk / high reward: win $${noHedgeWin.toFixed(0)} or lose $${Math.abs(noHedgeLose).toFixed(0)}`
                : hedgePct === 100
                ? `You lock in $${(curResult?.guaranteedProfit ?? 0).toFixed(0)} profit regardless of the outcome`
                : `Partial hedge: ${100 - hedgePct}% of upside preserved, downside reduced`}
            </div>
          </div>

          {/* Probability section */}
          <div className="card p-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-200">Likelihood based on odds</p>
              <p className="text-xs text-slate-500 mt-0.5">What the market thinks will happen — not a guarantee</p>
            </div>
            <div className="space-y-3">
              <ProbabilityBar label="Your original bet wins" pct={pOriginalWins} color="#10b981" />
              <ProbabilityBar label="The other side wins (your hedge succeeds)" pct={pHedgeWins} color="#6366f1" />
            </div>
            <div className="bg-[#0D1625] rounded-xl p-3">
              <p className="text-xs text-slate-400">
                These don't add to 100% because sportsbooks take a cut (the "vig"). The true probabilities are somewhere in between.
              </p>
            </div>
          </div>

          {/* Full breakdown */}
          <div className="card p-5 space-y-3">
            <p className="text-sm font-semibold text-slate-200">Full breakdown</p>
            <div className="space-y-2">
              {[
                { label: 'Original stake (already paid)', value: `-$${parsedStake.toFixed(2)}`, accent: false },
                { label: 'Optimal hedge stake to place now', value: `-$${optResult.optimalHedgeStake.toFixed(2)}`, accent: false },
                { label: 'Total money in play', value: `-$${(parsedStake + optResult.optimalHedgeStake).toFixed(2)}`, accent: false, bold: true },
              ].map((r, i) => (
                <div key={i} className={`flex justify-between text-sm ${r.bold ? 'font-semibold border-t border-[#1A2A40] pt-2' : ''}`}>
                  <span className="text-slate-400">{r.label}</span>
                  <span className="text-red-400">{r.value}</span>
                </div>
              ))}

              <div className="border-t border-[#1A2A40] pt-2 space-y-2">
                {[
                  { label: 'If your original bet wins', value: `+$${optResult.profitIfOriginalWins.toFixed(2)}` },
                  { label: 'If the other side wins', value: `+$${optResult.profitIfHedgeWins.toFixed(2)}` },
                  { label: 'Your guaranteed profit', value: `${optResult.guaranteedProfit >= 0 ? '+' : ''}$${optResult.guaranteedProfit.toFixed(2)}`, bold: true },
                ].map((r, i) => (
                  <div key={i} className={`flex justify-between text-sm ${r.bold ? 'font-semibold' : ''}`}>
                    <span className="text-slate-400">{r.label}</span>
                    <span className={optResult.guaranteedProfit > 0 ? 'text-emerald-400' : 'text-amber-400'}>{r.value}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#1A2A40] pt-2 space-y-2">
                <p className="text-xs text-slate-500 font-semibold">vs. no hedge:</p>
                {[
                  { label: 'If original wins (no hedge)', value: `+$${optResult.noHedgeProfitIfWins.toFixed(2)}` },
                  { label: 'If original loses (no hedge)', value: `$${optResult.noHedgeLossIfLoses.toFixed(2)}` },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-500">{r.label}</span>
                    <span className="text-slate-400">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {!valid && (
        <div className="card p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#132035] flex items-center justify-center mx-auto">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-emerald-500">
              <path d="M11 2L2 7l9 5 9-5-9-5zM2 17l9 5 9-5M2 12l9 5 9-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-slate-300 text-sm font-medium">Enter your bet details above</p>
          <p className="text-slate-600 text-xs">Fill in all three fields to see the full risk / reward analysis</p>
        </div>
      )}
    </div>
  );
}
