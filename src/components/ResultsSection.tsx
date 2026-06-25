import { useState, useEffect } from 'react';
import { HedgeResult, formatCurrency, formatProfit, formatPercent, calculate } from '../utils/odds';

interface ResultsSectionProps {
  result: HedgeResult;
  originalStake: number;
  originalPayout: number;
  hedgeDecimalOdds: number;
  originalLabel: string;
  hedgeLabel: string;
}

function ProfitValue({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' | 'lg' }) {
  const isPositive = value >= 0;
  const color = isPositive ? 'text-emerald-400' : 'text-red-400';
  const sizeClass = size === 'lg' ? 'text-3xl font-bold' : size === 'md' ? 'text-base font-semibold' : 'text-sm font-medium';
  return (
    <span className={`${color} ${sizeClass} font-mono tabular-nums`}>
      {formatProfit(value)}
    </span>
  );
}

function OutcomeCard({
  label,
  sublabel,
  payout,
  totalInvested,
  profit,
  accent,
}: {
  label: string;
  sublabel: string;
  payout: number;
  totalInvested: number;
  profit: number;
  accent: 'emerald' | 'blue';
}) {
  const accentColor = accent === 'emerald' ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-blue-500/40 bg-blue-500/5';
  const dotColor = accent === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500';

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${accentColor}`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
        <div>
          <p className="text-xs font-semibold text-slate-300 leading-none">{label}</p>
          {sublabel && <p className="text-xs text-slate-500 mt-0.5 leading-none truncate max-w-[120px]">{sublabel}</p>}
        </div>
      </div>
      <div className="space-y-1.5 text-xs text-slate-400 font-mono">
        <div className="flex justify-between">
          <span>Payout</span>
          <span className="text-slate-200">{formatCurrency(payout)}</span>
        </div>
        <div className="flex justify-between">
          <span>Total invested</span>
          <span className="text-red-400">-{formatCurrency(totalInvested)}</span>
        </div>
        <div className="border-t border-[#1A2A40] pt-1.5 flex justify-between">
          <span className="font-semibold text-slate-300">Net profit</span>
          <ProfitValue value={profit} size="sm" />
        </div>
      </div>
    </div>
  );
}

export default function ResultsSection({
  result,
  originalStake,
  originalPayout,
  hedgeDecimalOdds,
  originalLabel,
  hedgeLabel,
}: ResultsSectionProps) {
  const [customHedge, setCustomHedge] = useState<number | null>(null);
  const [showAdjuster, setShowAdjuster] = useState(false);

  // Reset adjuster when optimal changes significantly
  useEffect(() => {
    setCustomHedge(null);
  }, [result.optimalHedgeStake]);

  const displayResult =
    customHedge !== null
      ? calculate(originalStake, originalPayout, hedgeDecimalOdds, customHedge)
      : result;

  const sliderMax = Math.ceil(result.optimalHedgeStake * 2.5);
  const sliderValue = customHedge ?? result.optimalHedgeStake;

  const origLabel = originalLabel || 'Original bet';
  const hLabel = hedgeLabel || 'Hedge bet';

  const isCustom = customHedge !== null && Math.abs(customHedge - result.optimalHedgeStake) > 0.01;

  return (
    <div className="animate-slide-up space-y-4">
      {/* Status banner */}
      <div className="card p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2">
              {result.isGuaranteedProfit ? (
                <span className="badge-profit">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <path d="M8.5 2L4 7.5 1.5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Guaranteed Profit
                </span>
              ) : (
                <span className="badge-loss">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <path d="M5 1v5M5 8.5v.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  </svg>
                  Loss Minimizer
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {result.isGuaranteedProfit
                ? 'No matter what happens, you profit.'
                : 'Hedge to reduce your maximum possible loss.'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-500 mb-0.5">Guaranteed</p>
            <ProfitValue value={displayResult.guaranteedProfit} size="lg" />
          </div>
        </div>

        {/* Recommended hedge amount */}
        <div className="bg-[#132035] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1">
                {isCustom ? 'Custom hedge stake' : 'Recommended hedge stake'}
              </p>
              <p className="text-2xl font-bold font-mono text-white">
                {formatCurrency(displayResult.hedgeStakeUsed)}
              </p>
            </div>
            {isCustom && (
              <button
                onClick={() => setCustomHedge(null)}
                className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60 px-3 py-1.5 rounded-lg transition-colors"
              >
                Reset to optimal
              </button>
            )}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-slate-500 font-mono">
            <span>Total invested: <span className="text-slate-300">{formatCurrency(displayResult.totalInvested)}</span></span>
            <span>ROI: <span className={displayResult.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatPercent(displayResult.roi)}</span></span>
          </div>
        </div>
      </div>

      {/* Outcome cards */}
      <div className="grid grid-cols-2 gap-3">
        <OutcomeCard
          label={`${origLabel} wins`}
          sublabel={origLabel !== 'Original bet' ? origLabel : ''}
          payout={originalPayout}
          totalInvested={displayResult.totalInvested}
          profit={displayResult.profitIfOriginalWins}
          accent="emerald"
        />
        <OutcomeCard
          label={`${hLabel} wins`}
          sublabel={hLabel !== 'Hedge bet' ? hLabel : ''}
          payout={displayResult.hedgeStakeUsed * hedgeDecimalOdds}
          totalInvested={displayResult.totalInvested}
          profit={displayResult.profitIfHedgeWins}
          accent="blue"
        />
      </div>

      {/* Comparison table */}
      <div className="card p-5 space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Scenario Comparison
        </h3>
        <div className="overflow-hidden rounded-xl border border-[#1A2A40]">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-[#132035] text-slate-500">
                <th className="text-left px-4 py-2.5 font-medium">Scenario</th>
                <th className="text-right px-4 py-2.5 font-medium">{origLabel} wins</th>
                <th className="text-right px-4 py-2.5 font-medium">{hLabel} wins</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2A40]">
              <tr className="bg-transparent hover:bg-[#132035]/50 transition-colors">
                <td className="px-4 py-3 text-slate-400">No hedge</td>
                <td className="px-4 py-3 text-right">
                  <span className="text-emerald-400">{formatProfit(result.noHedgeProfitIfWins)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-red-400">{formatProfit(result.noHedgeLossIfLoses)}</span>
                </td>
              </tr>
              <tr className="bg-transparent hover:bg-[#132035]/50 transition-colors">
                <td className="px-4 py-3 text-slate-300 font-semibold">Optimal hedge</td>
                <td className="px-4 py-3 text-right">
                  <span className={result.profitIfOriginalWins >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {formatProfit(result.profitIfOriginalWins)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={result.profitIfHedgeWins >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {formatProfit(result.profitIfHedgeWins)}
                  </span>
                </td>
              </tr>
              {isCustom && (
                <tr className="bg-[#132035]/30 hover:bg-[#132035]/50 transition-colors">
                  <td className="px-4 py-3 text-slate-300">Custom hedge</td>
                  <td className="px-4 py-3 text-right">
                    <span className={displayResult.profitIfOriginalWins >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {formatProfit(displayResult.profitIfOriginalWins)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={displayResult.profitIfHedgeWins >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {formatProfit(displayResult.profitIfHedgeWins)}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hedge adjuster */}
      <div className="card p-5 space-y-4">
        <button
          onClick={() => setShowAdjuster((s) => !s)}
          className="w-full flex items-center justify-between text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          <span>Adjust hedge amount</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={`text-slate-500 transition-transform duration-200 ${showAdjuster ? 'rotate-180' : ''}`}
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {showAdjuster && (
          <div className="space-y-4 pt-1">
            <p className="text-xs text-slate-500">
              Drag the slider to explore different hedge amounts and their outcomes.
              The optimal balance point is marked.
            </p>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="range"
                  min={0}
                  max={sliderMax}
                  step={0.5}
                  value={sliderValue}
                  onChange={(e) => setCustomHedge(parseFloat(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${(sliderValue / sliderMax) * 100}%, #1A2A40 ${(sliderValue / sliderMax) * 100}%, #1A2A40 100%)`,
                  }}
                />
                {/* Optimal marker */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-amber-400/70 rounded-full pointer-events-none"
                  style={{ left: `${(result.optimalHedgeStake / sliderMax) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-600 font-mono">
                <span>$0</span>
                <span className="text-amber-500/70">▲ optimal {formatCurrency(result.optimalHedgeStake)}</span>
                <span>{formatCurrency(sliderMax)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-[#132035] rounded-xl p-3 text-center">
                <p className="text-slate-500 mb-1">If original wins</p>
                <ProfitValue value={displayResult.profitIfOriginalWins} />
              </div>
              <div className="bg-[#132035] rounded-xl p-3 text-center">
                <p className="text-slate-500 mb-1">If hedge wins</p>
                <ProfitValue value={displayResult.profitIfHedgeWins} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
