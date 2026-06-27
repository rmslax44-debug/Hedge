import { useState } from 'react';
import { calculate } from '../utils/odds';
import { calcRisk } from '../utils/risk';

interface Scenario {
  id: string;
  sport: string;
  emoji: string;
  story: string;
  situation: string;
  myTeam: string;
  otherTeam: string;
  originalStake: number;
  originalPayout: number;
  currentHedgeDecOdds: number;
}

const SCENARIOS: Scenario[] = [
  {
    id: 's1',
    sport: 'NFL',
    emoji: '🏈',
    story: 'You placed $100 on the Chiefs to win the Super Bowl at the start of the season (+150 odds).',
    situation: "It's Super Bowl Sunday! Chiefs are heavy favorites now. The Eagles' live moneyline is +170.",
    myTeam: 'Kansas City Chiefs',
    otherTeam: 'Philadelphia Eagles',
    originalStake: 100,
    originalPayout: 250,
    currentHedgeDecOdds: 2.7,
  },
  {
    id: 's2',
    sport: 'NBA',
    emoji: '🏀',
    story: 'You turned a $50 parlay into a chance at $800. Three legs are in — the Lakers just need to win tonight.',
    situation: 'Lakers are up 5 with 2 minutes to go. The Celtics\' live odds are now +220.',
    myTeam: 'Los Angeles Lakers (parlay leg)',
    otherTeam: 'Boston Celtics',
    originalStake: 50,
    originalPayout: 800,
    currentHedgeDecOdds: 3.2,
  },
  {
    id: 's3',
    sport: 'MLB',
    emoji: '⚾',
    story: 'You bet $200 on the Dodgers to win the World Series at the start of the playoffs (+120).',
    situation: "Game 7 of the World Series. Dodgers lead 3-2 in the 8th. Yankees' live odds are at +150.",
    myTeam: 'Los Angeles Dodgers',
    otherTeam: 'New York Yankees',
    originalStake: 200,
    originalPayout: 440,
    currentHedgeDecOdds: 2.5,
  },
  {
    id: 's4',
    sport: 'MMA',
    emoji: '🥊',
    story: "You bet $75 on the underdog fighter at +300. He's absolutely dominating through 4 rounds.",
    situation: "One round left. Your fighter's odds have tightened to +120. Opponent is now -140 (dec 1.71).",
    myTeam: 'Your fighter',
    otherTeam: 'Opponent',
    originalStake: 75,
    originalPayout: 300,
    currentHedgeDecOdds: 1.71,
  },
];

type Phase = 'pick' | 'decide' | 'result';

interface SimRun {
  scenario: Scenario;
  hedged: boolean;
  originalWon: boolean;
  profit: number;
}

export default function HedgeSimulator() {
  const [phase, setPhase] = useState<Phase>('pick');
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [hedged, setHedged] = useState(false);
  const [originalWon, setOriginalWon] = useState(false);
  const [history, setHistory] = useState<SimRun[]>([]);

  function pickScenario(s: Scenario) {
    setScenario(s);
    setPhase('decide');
  }

  function resolve(chooseHedge: boolean) {
    if (!scenario) return;
    setHedged(chooseHedge);

    const result = calculate(scenario.originalStake, scenario.originalPayout, scenario.currentHedgeDecOdds);
    const impliedP = 1 / (scenario.originalPayout / scenario.originalStake);
    const originalWins = Math.random() < impliedP;
    setOriginalWon(originalWins);

    let profit: number;
    if (chooseHedge) {
      profit = originalWins ? result.profitIfOriginalWins : result.profitIfHedgeWins;
    } else {
      profit = originalWins ? result.noHedgeProfitIfWins : result.noHedgeLossIfLoses;
    }

    setHistory((h) => [...h, { scenario, hedged: chooseHedge, originalWon: originalWins, profit }]);
    setPhase('result');
  }

  function reset() {
    setScenario(null);
    setPhase('pick');
  }

  const totalPnL = history.reduce((sum, r) => sum + r.profit, 0);
  const hedgedRuns = history.filter((r) => r.hedged).length;

  const result = scenario
    ? calculate(scenario.originalStake, scenario.originalPayout, scenario.currentHedgeDecOdds)
    : null;

  return (
    <div className="px-4 pt-4 pb-32 space-y-4">
      {/* Running totals */}
      {history.length > 0 && (
        <div className="card p-4 flex gap-4">
          <div className="flex-1 text-center">
            <p className="text-xs text-slate-500">Total P&L</p>
            <p className={`text-lg font-bold ${totalPnL >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(0)}
            </p>
          </div>
          <div className="w-px bg-[#2D0060]" />
          <div className="flex-1 text-center">
            <p className="text-xs text-slate-500">Simulations</p>
            <p className="text-lg font-bold text-white">{history.length}</p>
          </div>
          <div className="w-px bg-[#2D0060]" />
          <div className="flex-1 text-center">
            <p className="text-xs text-slate-500">Hedged</p>
            <p className="text-lg font-bold text-white">{hedgedRuns}/{history.length}</p>
          </div>
        </div>
      )}

      {/* Phase: Pick a scenario */}
      {phase === 'pick' && (
        <div className="space-y-3">
          <div className="text-center pt-2 space-y-1">
            <p className="text-lg font-bold">Pick a scenario</p>
            <p className="text-sm text-slate-400">These are based on realistic bet situations</p>
          </div>

          {SCENARIOS.map((s) => {
            const risk = calcRisk(s.originalStake, s.originalPayout);
            return (
              <button
                key={s.id}
                onClick={() => pickScenario(s)}
                className="card p-4 w-full text-left space-y-2 hover:border-purple-500/30 transition-all active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{s.emoji}</span>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{s.sport}</span>
                  </div>
                  <span className={`text-xs font-mono font-bold uppercase tracking-wider ${risk.textColor}`}>
                    {risk.label}
                  </span>
                </div>
                <p className="text-sm text-slate-200">{s.story}</p>
                <div className="flex gap-3 text-xs text-slate-500 font-mono">
                  <span>Stake: <span className="text-white">${s.originalStake}</span></span>
                  <span>To win: <span className="text-purple-400">+${(s.originalPayout - s.originalStake).toFixed(0)}</span></span>
                </div>
                {/* Risk bar */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 w-5 rounded-full transition-all ${i <= risk.tierIndex ? risk.barColor : 'bg-[#2D0060]'}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    ~{(risk.impliedProb * 100).toFixed(0)}% win probability
                  </span>
                </div>
              </button>
            );
          })}

          {history.length > 0 && (
            <div className="card p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-400">Recent runs</p>
              {history.slice(-4).reverse().map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {r.scenario.emoji} {r.hedged ? 'Hedged' : 'No hedge'} — {r.originalWon ? `${r.scenario.myTeam.split(' ')[0]} won` : 'other side won'}
                  </span>
                  <span className={r.profit >= 0 ? 'text-purple-400 font-semibold' : 'text-red-400 font-semibold'}>
                    {r.profit >= 0 ? '+' : ''}${r.profit.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Phase: Decide */}
      {phase === 'decide' && scenario && result && (
        <div className="space-y-4">
          <button onClick={reset} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>

          <div className="card p-4 space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{scenario.emoji} {scenario.sport}</span>
            <p className="text-sm text-white">{scenario.situation}</p>
          </div>

          <div className="bg-[#100020] rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Your position</p>
            <div className="flex gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs">Rooting for</p>
                <p className="text-white font-medium">{scenario.myTeam}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">If they win, you get</p>
                <p className="text-purple-400 font-bold text-lg">${scenario.originalPayout}</p>
              </div>
            </div>
          </div>

          <div className="card p-4 space-y-2 border-purple-500/20 bg-purple-500/5">
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest">
              {result.isGuaranteedProfit ? 'Hedge opportunity available' : 'Hedge to reduce risk'}
            </p>
            <p className="text-sm text-slate-300">
              Bet <span className="text-white font-bold">${result.optimalHedgeStake.toFixed(2)}</span>{' '}
              on <span className="text-white font-bold">{scenario.otherTeam}</span> right now
            </p>
            <div className="flex gap-4 text-xs text-slate-400 mt-1">
              <span>If {scenario.myTeam.split(' ')[0]} wins:
                <span className={result.profitIfOriginalWins >= 0 ? ' text-purple-400' : ' text-red-400'}> {result.profitIfOriginalWins >= 0 ? '+' : ''}${result.profitIfOriginalWins.toFixed(0)}</span>
              </span>
              <span>If {scenario.otherTeam.split(' ')[0]} wins:
                <span className={result.profitIfHedgeWins >= 0 ? ' text-purple-400' : ' text-red-400'}> {result.profitIfHedgeWins >= 0 ? '+' : ''}${result.profitIfHedgeWins.toFixed(0)}</span>
              </span>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500">What do you do?</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => resolve(true)}
              className="py-4 rounded-2xl font-semibold text-sm bg-purple-500 hover:bg-purple-400 text-white shadow-lg shadow-purple-500/20 transition-all"
            >
              Lock in the hedge
              <span className="block text-xs font-normal opacity-75 mt-0.5">
                Guaranteed {result.isGuaranteedProfit ? `+$${result.guaranteedProfit.toFixed(0)} profit` : 'reduced loss'}
              </span>
            </button>
            <button
              onClick={() => resolve(false)}
              className="py-4 rounded-2xl font-semibold text-sm bg-[#180032] border border-[#3D1A6E] text-slate-300 hover:border-slate-500 transition-all"
            >
              Let it ride
              <span className="block text-xs font-normal opacity-75 mt-0.5">
                Win +${result.noHedgeProfitIfWins.toFixed(0)} or lose ${Math.abs(result.noHedgeLossIfLoses).toFixed(0)}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Phase: Result */}
      {phase === 'result' && scenario && result && (
        <div className="space-y-4">
          {/* Outcome banner */}
          <div className={`rounded-2xl p-6 text-center space-y-2 ${
            originalWon
              ? 'bg-purple-500/10 border border-purple-500/20'
              : 'bg-slate-500/10 border border-slate-500/20'
          }`}>
            <p className="text-3xl">{originalWon ? '🎉' : '😬'}</p>
            <p className="text-base font-bold text-white">
              {originalWon ? `${scenario.myTeam.split(' ')[0]} WON!` : `${scenario.otherTeam.split(' ')[0]} WON`}
            </p>
          </div>

          {/* What happened */}
          <div className="card p-5 space-y-4">
            <p className="text-sm font-semibold text-slate-200">What happened to your money</p>

            {hedged ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Original stake (placed earlier)</span>
                  <span className="text-red-400">-${scenario.originalStake.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Hedge stake you just placed</span>
                  <span className="text-red-400">-${result.optimalHedgeStake.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-[#3D1A6E] pt-2">
                  <span className="text-slate-300">
                    {originalWon ? `${scenario.myTeam.split(' ')[0]} won → original payout` : `${scenario.otherTeam.split(' ')[0]} won → hedge payout`}
                  </span>
                  <span className="text-white">+${scenario.originalPayout.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-[#3D1A6E] pt-2">
                  <span className="text-white">Your profit</span>
                  <span className={
                    (originalWon ? result.profitIfOriginalWins : result.profitIfHedgeWins) >= 0
                      ? 'text-purple-400' : 'text-red-400'
                  }>
                    {(originalWon ? result.profitIfOriginalWins : result.profitIfHedgeWins) >= 0 ? '+' : ''}
                    ${(originalWon ? result.profitIfOriginalWins : result.profitIfHedgeWins).toFixed(0)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Stake</span>
                  <span className="text-red-400">-${scenario.originalStake.toFixed(0)}</span>
                </div>
                {originalWon && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Payout</span>
                    <span className="text-white">+${scenario.originalPayout.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold border-t border-[#3D1A6E] pt-2">
                  <span className="text-white">Your profit</span>
                  <span className={originalWon ? 'text-purple-400' : 'text-red-400'}>
                    {originalWon ? `+$${result.noHedgeProfitIfWins.toFixed(0)}` : `-$${scenario.originalStake.toFixed(0)}`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Comparison callout */}
          {hedged ? (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 space-y-1">
              <p className="text-xs font-semibold text-purple-400">The hedge worked exactly as planned</p>
              <p className="text-xs text-slate-400">
                Whether the game went your way or not, you walked away with the same profit.{' '}
                {originalWon
                  ? `${scenario.myTeam.split(' ')[0]} winning meant you left some money on the table, but you still profited.`
                  : `${scenario.otherTeam.split(' ')[0]} winning would have been a loss without the hedge.`}
              </p>
            </div>
          ) : originalWon ? (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 space-y-1">
              <p className="text-xs font-semibold text-purple-400">It paid off this time!</p>
              <p className="text-xs text-slate-400">
                You made +${result.noHedgeProfitIfWins.toFixed(0)} vs the hedged +${result.guaranteedProfit.toFixed(0)}.{' '}
                The extra risk was worth it here — but next time it might not be.
              </p>
            </div>
          ) : (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 space-y-1">
              <p className="text-xs font-semibold text-red-400">The hedge would have saved you</p>
              <p className="text-xs text-slate-400">
                You lost ${scenario.originalStake.toFixed(0)}. With the hedge you would have made +${result.guaranteedProfit.toFixed(0)} instead.{' '}
                A swing of ${(scenario.originalStake + result.guaranteedProfit).toFixed(0)}.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={reset}
              className="py-4 rounded-2xl font-semibold text-sm bg-purple-500 hover:bg-purple-400 text-white transition-all"
            >
              Try another
            </button>
            <button
              onClick={() => pickScenario(scenario)}
              className="py-4 rounded-2xl font-semibold text-sm bg-[#180032] border border-[#3D1A6E] text-slate-300 hover:border-slate-500 transition-all"
            >
              Replay this one
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
