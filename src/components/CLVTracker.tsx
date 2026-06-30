import { americanToDecimal, calculateCLV } from '../utils/proMath';
import { type TrackedBet } from '../utils/storage';
import InfoTooltip from './InfoTooltip';
import ProDisclaimer from './ProDisclaimer';

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface ClvEntry {
  bet: TrackedBet;
  clvPts: number; // percentage points
}

function computeClvEntries(bets: TrackedBet[]): ClvEntry[] {
  return bets
    .filter(
      (b) =>
        b.initialOdds !== undefined &&
        b.initialOpposingOdds !== undefined &&
        b.closingOdds !== undefined &&
        b.closingOpposingOdds !== undefined,
    )
    .map((b) => {
      const result = calculateCLV(
        americanToDecimal(b.initialOdds!),
        americanToDecimal(b.initialOpposingOdds!),
        americanToDecimal(b.closingOdds!),
        americanToDecimal(b.closingOpposingOdds!),
      );
      return { bet: b, clvPts: result.clv * 100 };
    })
    .sort((a, b) => a.bet.createdAt - b.bet.createdAt);
}

function ClvSparkline({ entries }: { entries: ClvEntry[] }) {
  const recent = entries.slice(-15);
  if (recent.length < 2) return null;
  const maxAbs = Math.max(...recent.map((e) => Math.abs(e.clvPts)), 0.5);

  return (
    <div className="flex items-end gap-1 h-16">
      {recent.map((e, i) => {
        const heightPct = Math.max(4, (Math.abs(e.clvPts) / maxAbs) * 100);
        return (
          <div key={i} className="flex-1 flex flex-col justify-end items-center gap-0.5">
            <div
              className={`w-full rounded-sm transition-all ${e.clvPts >= 0 ? 'bg-purple-500/70' : 'bg-red-500/60'}`}
              style={{ height: `${heightPct}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

// Closing-line value section, embedded in PortfolioView after the summary
// stats card. Only counts bets with both sides' odds captured at placement
// (initialOdds/initialOpposingOdds) and at close (closingOdds/closingOpposingOdds)
// — bets missing closing data are simply omitted, matching the plan's
// "no error state needed" call.
export default function CLVTracker({ bets }: { bets: TrackedBet[] }) {
  const entries = computeClvEntries(bets);
  if (entries.length === 0) return null;

  const avgClv = entries.reduce((sum, e) => sum + e.clvPts, 0) / entries.length;
  const recentList = [...entries].reverse().slice(0, 10);

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Closing Line Value</p>
          <InfoTooltip
            label="Closing line value (CLV)"
            text="CLV compares the no-vig fair probability of your bet at the time you placed it to the fair probability right before the game started (the closing line). Beating the close consistently — positive CLV — is one of the strongest long-run signs you're finding genuine value, independent of whether any single bet won."
          />
        </div>
        <p className="text-xs font-mono text-slate-500">{entries.length} bet{entries.length !== 1 ? 's' : ''}</p>
      </div>

      <div className={`rounded-xl p-3 space-y-0.5 border ${avgClv >= 0 ? 'bg-purple-500/5 border-purple-500/25 shadow-[0_0_14px_rgba(168,85,247,0.15)]' : 'bg-red-500/5 border-red-500/20'}`}>
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Average CLV</p>
        <p className={`text-2xl font-bold font-mono ${avgClv >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
          {avgClv >= 0 ? '+' : ''}{avgClv.toFixed(2)} pts
        </p>
      </div>

      <ClvSparkline entries={entries} />

      <div className="space-y-1.5">
        {recentList.map(({ bet, clvPts }) => (
          <div key={bet.id} className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 truncate flex-1 min-w-0 pr-2">{bet.label}</span>
            <span className="text-slate-600 shrink-0">{fmtDate(bet.createdAt)}</span>
            <span className={`shrink-0 ml-2 font-bold ${clvPts >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
              {clvPts >= 0 ? '+' : ''}{clvPts.toFixed(2)} pts
            </span>
          </div>
        ))}
      </div>

      <ProDisclaimer />
    </div>
  );
}
