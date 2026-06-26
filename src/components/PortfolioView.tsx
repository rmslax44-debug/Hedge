import { useMemo } from 'react';
import { getAllBets, getPortfolioStats, type TrackedBet, type BetResult } from '../utils/storage';

function resultBadge(result: BetResult | undefined, status: string) {
  if (status === 'hedged' || result === 'hedged') return { label: 'HEDGED', cls: 'bg-blue-500/20 text-blue-400' };
  if (result === 'win') return { label: 'WIN', cls: 'bg-purple-500/20 text-purple-400' };
  if (result === 'loss') return { label: 'LOSS', cls: 'bg-red-500/20 text-red-400' };
  if (result === 'push') return { label: 'PUSH', cls: 'bg-slate-500/20 text-slate-400' };
  return { label: 'SETTLED', cls: 'bg-slate-500/20 text-slate-400' };
}

function pnlColor(pnl: number | undefined) {
  if (pnl === undefined) return 'text-slate-400';
  if (pnl > 0) return 'text-purple-400';
  if (pnl < 0) return 'text-red-400';
  return 'text-slate-400';
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function MiniPnlChart({ bets }: { bets: TrackedBet[] }) {
  const recent = bets
    .filter((b) => b.settledPnl !== undefined || b.status === 'hedged')
    .sort((a, b) => (a.settledAt ?? a.createdAt) - (b.settledAt ?? b.createdAt))
    .slice(-15);

  if (recent.length < 2) return null;

  const values = recent.map((b) => b.settledPnl ?? (b.hedgeOpportunity?.guaranteedProfit ?? 0));
  const maxAbs = Math.max(...values.map(Math.abs), 1);

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">P&L History</p>
      <div className="flex items-end gap-1 h-16">
        {values.map((v, i) => {
          const heightPct = Math.max(4, (Math.abs(v) / maxAbs) * 100);
          return (
            <div key={i} className="flex-1 flex flex-col justify-end items-center gap-0.5">
              <div
                className={`w-full rounded-sm transition-all ${v >= 0 ? 'bg-purple-500/70' : 'bg-red-500/60'}`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PortfolioView() {
  const allBets = useMemo(() => getAllBets(), []);
  const stats = useMemo(() => getPortfolioStats(), []);

  const history: TrackedBet[] = allBets
    .filter((b) => b.status === 'settled' || b.status === 'hedged')
    .sort((a, b) => (b.settledAt ?? b.createdAt) - (a.settledAt ?? a.createdAt));

  return (
    <div className="px-4 pt-4 pb-32 space-y-4">

      {/* Summary stats */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Portfolio</p>
          <p className="text-xs font-mono text-slate-600">{stats.totalBets} total bets</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#09000F] rounded-xl p-3 space-y-0.5">
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Total P&L</p>
            <p className={`text-2xl font-bold font-mono ${pnlColor(stats.totalPnl)}`}>
              {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}
            </p>
          </div>
          <div className="bg-[#09000F] rounded-xl p-3 space-y-0.5">
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">ROI</p>
            <p className={`text-2xl font-bold font-mono ${pnlColor(stats.roi)}`}>
              {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Won', value: stats.wins, cls: 'text-purple-400' },
            { label: 'Lost', value: stats.losses, cls: 'text-red-400' },
            { label: 'Hedged', value: stats.hedged, cls: 'text-blue-400' },
            { label: 'Push', value: stats.pushes, cls: 'text-slate-400' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="bg-[#09000F] rounded-xl p-2.5 text-center space-y-0.5">
              <p className={`text-lg font-bold font-mono ${cls}`}>{value}</p>
              <p className="text-[10px] font-mono text-slate-600">{label}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-[#3D1A6E] pt-3 flex justify-between text-xs font-mono text-slate-600">
          <span>Staked: <span className="text-slate-400">${stats.totalStaked.toFixed(2)}</span></span>
          <span>Active: <span className="text-slate-400">{stats.activeBets}</span></span>
        </div>

        {history.length >= 2 && <MiniPnlChart bets={allBets} />}
      </div>

      {/* History list */}
      {history.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-xs font-mono text-slate-600 uppercase tracking-widest">No settled bets yet</p>
          <p className="text-xs text-slate-600 mt-1">Settle bets from the Active tab to see your history here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">History</p>
          {history.map((bet) => {
            const badge = resultBadge(bet.result, bet.status);
            const pnl = bet.settledPnl ?? (bet.hedgeOpportunity?.guaranteedProfit ?? 0);
            return (
              <div key={bet.id} className="card p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{bet.label}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    ${bet.stake.toFixed(2)} · {bet.settledAt ? fmtDate(bet.settledAt) : fmtDate(bet.createdAt)}
                    {bet.isParlay && <span className="ml-1 text-amber-400/70">PARLAY</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-sm font-bold font-mono ${pnlColor(pnl)}`}>
                    {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
