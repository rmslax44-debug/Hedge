import { useState, useEffect, useCallback } from 'react';
import {
  getAllBets,
  deleteBet,
  markHedged,
  updateBet,
  settleBet,
  updateParlayLeg,
  type TrackedBet,
  type HedgeOpportunity,
  type BetResult,
} from '../utils/storage';
import { checkMonitoredBets } from '../utils/hedgeMonitor';
import { calcLiveHedge, americanToDecimal } from '../utils/arb';
import { US_SPORTSBOOKS } from '../utils/sportsbooks';
import { calcRisk } from '../utils/risk';
import AddBetWizard from './AddBetWizard';
import LinkEventModal from './LinkEventModal';
import PortfolioView from './PortfolioView';

// ─── Risk Bar (always visible in collapsed card header) ───────────────────────

function RiskBar({ stake, payout }: { stake: number; payout: number }) {
  if (payout <= stake || stake <= 0) return null;
  const risk = calcRisk(stake, payout);
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 w-5 rounded-full transition-all duration-500 ${
              i <= risk.tierIndex ? risk.barColor : 'bg-[#2D0060]'
            }`}
          />
        ))}
      </div>
      <span className={`text-xs font-mono font-bold uppercase tracking-wider ${risk.textColor}`}>
        {risk.label}
      </span>
      <span className="text-xs font-mono text-slate-500 ml-auto">
        {(risk.impliedProb * 100).toFixed(0)}% win prob
      </span>
    </div>
  );
}

// ─── Radar Ping (better hedge alert indicator) ────────────────────────────────

function RadarPing() {
  return (
    <div className="relative shrink-0 w-9 h-9">
      <span
        className="absolute inset-0 rounded-full border border-purple-400/40 animate-ping"
        style={{ animationDuration: '2s' }}
      />
      <div
        className="absolute inset-0 rounded-full overflow-hidden border border-purple-500/80 shadow-[0_0_16px_rgba(168,85,247,0.9),inset_0_0_10px_rgba(80,0,140,0.6)]"
        style={{ background: '#06000F' }}
      >
        {/* Concentric rings + crosshairs */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 36 36">
          {[14, 10, 6.5, 3].map(r => (
            <circle key={r} cx="18" cy="18" r={r} fill="none" stroke="rgba(168,85,247,0.22)" strokeWidth="0.45" />
          ))}
          <line x1="18" y1="2" x2="18" y2="34" stroke="rgba(168,85,247,0.12)" strokeWidth="0.35" />
          <line x1="2" y1="18" x2="34" y2="18" stroke="rgba(168,85,247,0.12)" strokeWidth="0.35" />
          {/* Outer tick marks */}
          {Array.from({ length: 24 }, (_, i) => {
            const angle = (i / 24) * Math.PI * 2;
            const x1 = 18 + Math.cos(angle) * 14.5;
            const y1 = 18 + Math.sin(angle) * 14.5;
            const x2 = 18 + Math.cos(angle) * 16;
            const y2 = 18 + Math.sin(angle) * 16;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(168,85,247,0.35)" strokeWidth="0.5" />;
          })}
        </svg>

        {/* Sweeping sector — conic gradient rotating */}
        <div
          className="absolute inset-0 animate-spin"
          style={{
            animationDuration: '2s',
            animationTimingFunction: 'linear',
            background: 'conic-gradient(from 0deg, rgba(200,40,255,0.85) 0deg, rgba(170,30,230,0.55) 35deg, rgba(130,10,190,0.25) 75deg, rgba(80,0,140,0.08) 110deg, transparent 135deg, transparent 360deg)',
          }}
        />

        {/* Bright leading sweep line */}
        <svg
          className="absolute inset-0 w-full h-full animate-spin"
          viewBox="0 0 36 36"
          style={{ animationDuration: '2s', animationTimingFunction: 'linear' }}
        >
          <line x1="18" y1="18" x2="18" y2="4" stroke="rgba(230,80,255,1)" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="18" y1="18" x2="18" y2="4" stroke="rgba(255,120,255,0.4)" strokeWidth="3" strokeLinecap="round" />
        </svg>

        {/* Center dot */}
        <div
          className="absolute rounded-full"
          style={{
            width: 4, height: 4,
            top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            background: 'rgba(220,80,255,1)',
            boxShadow: '0 0 6px rgba(200,60,255,1)',
          }}
        />

        {/* Blip dots */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 36 36">
          <circle cx="25" cy="11" r="2" fill="rgba(230,80,255,1)" style={{ filter: 'drop-shadow(0 0 2px rgba(220,80,255,0.9))' }}>
            <animate attributeName="opacity" values="0;1;0.7;1;0.3;0" dur="4s" begin="0.4s" repeatCount="indefinite" />
            <animate attributeName="r" values="1.2;2;1.5;2;1.2" dur="4s" begin="0.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="12" cy="24" r="1.5" fill="rgba(210,60,255,0.9)">
            <animate attributeName="opacity" values="0;0;0.9;0.5;0.9;0" dur="4s" begin="2.1s" repeatCount="indefinite" />
          </circle>
          <circle cx="22" cy="27" r="1.2" fill="rgba(200,50,255,0.7)">
            <animate attributeName="opacity" values="0;0.7;0.3;0.7;0" dur="4s" begin="1.3s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
    </div>
  );
}

// ─── Hedge Action Card ────────────────────────────────────────────────────────

function fmtOdds(o: number) { return o > 0 ? `+${o}` : `${o}`; }

function HedgeActionCard({
  bet,
  opp,
  onDone,
  onGoToProRadar,
}: {
  bet: TrackedBet;
  opp: HedgeOpportunity;
  onDone: () => void;
  onGoToProRadar?: () => void;
}) {
  // Derive decimal odds from stored bet values (works for both scanner and manual bets)
  const decA = bet.potentialPayout / bet.stake;
  const decB = americanToDecimal(opp.hedgeOdds);
  const impliedTotal = 1 / decA + 1 / decB;
  const optimalTotal = +(bet.stake + opp.hedgeStake).toFixed(2);

  const [totalInput, setTotalInput] = useState(String(optimalTotal));
  const [betADone, setBetADone] = useState(false);
  const [betBDone, setBetBDone] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showAlert, setShowAlert] = useState(bet.hedgeValueTrend === 'up');
  const [showDownAlert, setShowDownAlert] = useState(bet.hedgeValueTrend === 'down');

  const isGoneNegative = bet.hedgeValueTrend === 'gone_negative';
  const isExpired = bet.hedgeValueTrend === 'expired';

  // Only show the "better hedge" / "value decreased" banners when hedgeMonitor
  // has explicitly flagged an improvement or decline — avoids false positives
  // from tiny floating-point fluctuations caused by re-renders or Pro Radar scans.
  useEffect(() => {
    if (bet.hedgeValueTrend === 'up') {
      setShowAlert(true);
      setShowDownAlert(false);
    } else if (bet.hedgeValueTrend === 'down') {
      setShowDownAlert(true);
      setShowAlert(false);
    }
  }, [bet.hedgeValueTrend]);

  // Total-investment math: split optimally between Bet A and Bet B
  const parsedTotal = Math.max(0, parseFloat(totalInput) || 0);
  const stakeA = parsedTotal > 0 && impliedTotal > 0 ? (parsedTotal * (1 / decA)) / impliedTotal : 0;
  const stakeB = parsedTotal > 0 ? parsedTotal - stakeA : 0;
  const liveProfit = parsedTotal > 0 ? stakeA * decA - parsedTotal : 0;
  const isAtOptimal = Math.abs(parsedTotal - optimalTotal) < 0.10;

  // Derive display odds for Bet A
  const oddsANum = bet.initialOdds !== undefined
    ? bet.initialOdds
    : decA >= 2 ? Math.round((decA - 1) * 100) : -(Math.round(100 / (decA - 1)));
  const oddsAStr = oddsANum >= 0 ? `+${oddsANum}` : `${oddsANum}`;

  const betABook = US_SPORTSBOOKS.find(b => b.key === bet.sportsbook)?.name ?? bet.sportsbook;
  const betBBook = opp.hedgeBook || US_SPORTSBOOKS.find(b => b.key === opp.hedgeBookKey)?.name || 'Sportsbook';
  const betBUrl = US_SPORTSBOOKS.find(b => b.key === opp.hedgeBookKey)?.url;
  const betAUrl = US_SPORTSBOOKS.find(b => b.key === bet.sportsbook)?.url;

  function markA() {
    setBetADone(true);
    if (betBDone) finalize();
  }
  function markB() {
    updateBet(bet.id, {
      stake: stakeA,
      potentialPayout: stakeA * decA,
      hedgeOpportunity: { ...opp, hedgeStake: stakeB, guaranteedProfit: liveProfit },
    });
    setBetBDone(true);
    if (betADone) finalize();
  }
  function finalize() {
    markHedged(bet.id);
    setConfirmed(true);
    setTimeout(onDone, 1200);
  }

  if (confirmed) {
    return (
      <div className="rounded-2xl bg-purple-500/15 border border-purple-500/50 p-5 text-center space-y-1 animate-fade-in shadow-[0_0_28px_rgba(168,85,247,0.35)]">
        <p className="text-2xl">✓</p>
        <p className="text-purple-400 font-bold">Both bets placed!</p>
        <p className="text-xs text-slate-400">+${liveProfit.toFixed(2)} profit locked in.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-slide-up">

      {/* Better hedge alert banner — tap to go to Pro Radar */}
      {showAlert && !isGoneNegative && !isExpired && (
        <div className="relative rounded-xl border border-purple-500/40 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.25)]">
          <button
            onClick={() => onGoToProRadar?.()}
            className="w-full flex items-center gap-3 px-3 py-2.5 pr-8 text-left"
          >
            <RadarPing />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">Better hedge detected</p>
              <p className="text-xs text-slate-400 mt-0.5">+${opp.guaranteedProfit.toFixed(2)} guaranteed · Tap to scan Pro Radar now →</p>
            </div>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAlert(false);
              updateBet(bet.id, { hedgeValueTrend: undefined, previousGuaranteedProfit: undefined });
            }}
            className="absolute top-2.5 right-3 text-slate-500 hover:text-slate-300 text-sm transition-colors"
          >✕</button>
        </div>
      )}

      {/* Value decreased alert */}
      {showDownAlert && !isGoneNegative && !isExpired && !confirmed && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/35 bg-amber-500/8 px-3 py-2.5">
          <div className="shrink-0 w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shadow-[0_0_8px_rgba(251,191,36,0.4)]">
            <span className="text-amber-400 font-bold text-sm leading-none">↓</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Hedge value decreased</p>
            <p className="text-xs text-slate-400 mt-0.5">+${opp.guaranteedProfit.toFixed(2)} guaranteed now · Lines moved since you found this</p>
          </div>
          <button
            onClick={() => {
              setShowDownAlert(false);
              updateBet(bet.id, { hedgeValueTrend: undefined, previousGuaranteedProfit: undefined });
            }}
            className="text-slate-500 hover:text-slate-300 text-sm shrink-0 transition-colors"
          >✕</button>
        </div>
      )}

      {/* No longer viable */}
      {isGoneNegative && !confirmed && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/8 px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-red-400 font-bold text-base">⚠</span>
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider">No longer a good opportunity</p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Lines have moved — this hedge would now result in a loss. Wait for better odds or go back to monitoring.
          </p>
          <button
            onClick={() => {
              updateBet(bet.id, { status: 'monitoring', hedgeOpportunity: undefined, hedgeValueTrend: undefined });
              onDone();
            }}
            className="w-full py-2 rounded-lg border border-red-500/35 text-red-400 text-xs font-semibold hover:border-red-500/60 hover:bg-red-500/10 transition-all"
          >
            Back to monitoring →
          </button>
        </div>
      )}

      {/* Opportunity expired */}
      {isExpired && !confirmed && (
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/20 px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold text-base">⊘</span>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Opportunity has expired</p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            These odds are no longer available. Go to Find Hedges tab to scan for current opportunities on this game.
          </p>
          <button
            onClick={() => {
              updateBet(bet.id, { status: 'monitoring', hedgeOpportunity: undefined, hedgeValueTrend: undefined });
              onDone();
            }}
            className="w-full py-2 rounded-lg border border-slate-700/60 text-slate-400 text-xs font-semibold hover:border-slate-600 hover:text-slate-300 transition-all"
          >
            Back to monitoring →
          </button>
        </div>
      )}

      {/* Total investment input */}
      <div className="bg-[#09000F] rounded-xl p-4 space-y-3 border border-[#3D1A6E]">
        <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest">How much do you want to invest?</p>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
          <input
            type="number"
            value={totalInput}
            onChange={(e) => setTotalInput(e.target.value)}
            className="input-field pl-8"
            min="1"
            step="10"
          />
        </div>
        {!isAtOptimal && parsedTotal > 0 && (
          <button
            onClick={() => setTotalInput(String(optimalTotal))}
            className="text-xs text-purple-400/70 hover:text-purple-400 transition-colors"
          >
            Reset to optimal (${optimalTotal.toFixed(2)})
          </button>
        )}
      </div>

      {/* Guaranteed profit display */}
      {parsedTotal > 0 && (
        <div className={`text-center py-3 rounded-xl border shadow-[0_0_18px_rgba(168,85,247,0.18)] ${
          liveProfit < 0 ? 'bg-red-500/8 border-red-500/25' : 'bg-purple-500/8 border-purple-500/25'
        }`}>
          <p className="text-xs text-slate-500 mb-0.5">No matter who wins</p>
          <p className={`text-3xl font-bold font-mono drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] ${
            liveProfit < 0 ? 'text-red-400' : 'text-purple-400'
          }`}>
            {liveProfit >= 0 ? '+' : ''}${liveProfit.toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {liveProfit < 0 ? 'would be a loss at current odds' : 'guaranteed profit'}
          </p>
        </div>
      )}

      {/* Step-by-step bet instructions */}
      {parsedTotal > 0 && (
        <div className="space-y-2">

          {/* Bet 1 */}
          <div className={`rounded-xl p-4 border-2 transition-all duration-300 ${
            betADone ? 'bg-green-500/5 border-green-500/40 shadow-[0_0_14px_rgba(34,197,94,0.18)]' : 'pill-glow-white'
          }`}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                  betADone ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white border border-white/20'
                }`}>
                  {betADone ? '✓' : '1'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Open {betABook}</span>
              </div>
              {betADone && <span className="text-xs font-mono font-bold text-green-400 tracking-wide">Placed ✓</span>}
            </div>
            <p className="text-sm font-bold text-white">{bet.myTeam || bet.label}</p>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Bet <span className="text-white font-bold">${stakeA.toFixed(2)}</span>
              <span className="text-slate-500 ml-1.5">({oddsAStr})</span>
            </p>
            {!betADone && (
              <div className="flex gap-2 mt-3">
                {betAUrl && (
                  <a href={betAUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-2.5 rounded-lg border border-white/20 text-white/80 text-xs font-semibold text-center hover:border-white/40 hover:text-white transition-all">
                    Open {betABook} ↗
                  </a>
                )}
                <button onClick={markA}
                  className="flex-1 py-2.5 rounded-lg bg-white/10 border border-white/25 text-white text-xs font-bold hover:bg-white/15 transition-all">
                  Done ✓
                </button>
              </div>
            )}
          </div>

          {/* Bet 2 */}
          <div className={`rounded-xl p-4 border-2 transition-all duration-300 ${
            betBDone ? 'bg-green-500/5 border-green-500/40 shadow-[0_0_14px_rgba(34,197,94,0.18)]' : 'pill-glow-purple glow-ring'
          }`}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                  betBDone ? 'bg-green-500/20 text-green-400' : 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.6)]'
                }`}>
                  {betBDone ? '✓' : '2'}
                </span>
                <span className={`text-xs font-mono font-bold uppercase tracking-wider ${betBDone ? 'text-slate-500' : 'text-purple-300'}`}>
                  Open {betBBook}
                </span>
              </div>
              {betBDone
                ? <span className="text-xs font-mono font-bold text-green-400 tracking-wide">Placed ✓</span>
                : <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shrink-0 shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
              }
            </div>
            <p className="text-sm font-bold text-white">{opp.hedgeTeam}</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Bet <span className="text-white font-bold">${stakeB.toFixed(2)}</span>
              <span className="text-slate-500 ml-1.5">({fmtOdds(opp.hedgeOdds)})</span>
            </p>
            {!betBDone && (
              <div className="flex gap-2 mt-3">
                {betBUrl && (
                  <a href={betBUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-2.5 rounded-lg border border-purple-500/40 text-purple-300 text-xs font-semibold text-center hover:border-purple-500/70 transition-all">
                    Open {betBBook} ↗
                  </a>
                )}
                <button onClick={markB}
                  className="flex-1 py-2.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold transition-all btn-glow">
                  Done ✓
                </button>
              </div>
            )}
            {betBDone && <p className="text-xs text-slate-400 font-mono mt-1">${stakeB.toFixed(2)} staked</p>}
          </div>
        </div>
      )}

      <button
        onClick={() => {
          updateBet(bet.id, { status: 'monitoring', hedgeOpportunity: undefined, hedgeValueTrend: undefined });
          onDone();
        }}
        className="w-full py-2 text-xs text-slate-500 hover:text-slate-400 transition-colors"
      >
        Save for later
      </button>
    </div>
  );
}

// ─── Manual Hedge Input ───────────────────────────────────────────────────────

function ManualHedgePanel({
  bet,
  onFound,
}: {
  bet: TrackedBet;
  onFound: (opp: HedgeOpportunity) => void;
}) {
  const [winback, setWinback] = useState('');
  const [teamName, setTeamName] = useState(bet.opposingTeam ?? '');
  const [bookKey, setBookKey] = useState('');

  const parsed = parseFloat(winback);
  const per100 = !isNaN(parsed) && parsed > 100 ? parsed : null;
  const calc =
    per100
      ? calcLiveHedge(bet.stake, bet.potentialPayout, per100 / 100)
      : null;

  function handleSave() {
    if (!calc || !teamName || !bookKey) return;
    const dec = (per100 ?? 0) / 100;
    const americanOdds = dec >= 2 ? Math.round((dec - 1) * 100) : Math.round(-100 / (dec - 1));
    onFound({
      hedgeTeam: teamName,
      hedgeBook: US_SPORTSBOOKS.find(b => b.key === bookKey)?.name ?? bookKey,
      hedgeBookKey: bookKey,
      hedgeStake: calc.hedgeStake,
      hedgeOdds: americanOdds,
      guaranteedProfit: calc.guaranteedProfit,
      foundAt: Date.now(),
    });
  }

  return (
    <div className="card p-4 space-y-4 border-blue-500/20 bg-blue-500/5">
      <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest">Find your hedge manually</p>
      <p className="text-xs text-slate-400">
        Open any sportsbook, find the opposite outcome from your bet, and answer:
      </p>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <p className="text-xs text-slate-400">What outcome are you hedging? (the opposite of your bet)</p>
          <input
            type="text"
            placeholder={bet.opposingTeam ?? 'e.g. Eagles to win'}
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="input-field text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs text-slate-400">
            If you bet $100 on that outcome, how much total would you get back?
          </p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
            <input
              type="number"
              placeholder="195"
              value={winback}
              onChange={(e) => setWinback(e.target.value)}
              className="input-field pl-8 text-sm"
              min="100"
            />
          </div>
          <p className="text-xs text-slate-500">Must be more than $100 (your bet back + profit)</p>
        </div>

        {calc && calc.guaranteedProfit > 0 && (
          <>
            <div className="space-y-1.5">
              <p className="text-xs text-slate-400">Which app did you find these odds on?</p>
              <div className="grid grid-cols-3 gap-1.5">
                {US_SPORTSBOOKS.slice(0, 6).map(b => (
                  <button key={b.key} onClick={() => setBookKey(b.key)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                      bookKey === b.key
                        ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                        : 'bg-[#180032] border-[#3D1A6E] text-slate-400'
                    }`}>
                    {b.shortName}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-purple-500/10 rounded-xl p-3 text-center space-y-0.5">
              <p className="text-xs text-purple-400 font-semibold">Hedge this to guarantee</p>
              <p className="text-2xl font-bold text-purple-400">+${calc.guaranteedProfit.toFixed(2)}</p>
              <p className="text-xs text-slate-500">by betting ${calc.hedgeStake.toFixed(2)} on the opposite outcome</p>
            </div>

            <button
              onClick={handleSave}
              disabled={!bookKey}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                bookKey
                  ? 'bg-purple-500 text-white hover:bg-purple-400'
                  : 'bg-[#180032] text-slate-500 cursor-not-allowed'
              }`}
            >
              Show me exactly what to do
            </button>
          </>
        )}

        {calc && calc.guaranteedProfit <= 0 && (
          <div className="card p-3 border-amber-500/30 bg-amber-500/5">
            <p className="text-xs text-amber-400">
              At those odds, hedging would result in a small loss. Try checking other sportsbooks for better odds on the opposing outcome.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Settle Panel ─────────────────────────────────────────────────────────────

function SettlePanel({ bet, onSettled }: { bet: TrackedBet; onSettled: () => void }) {
  const [confirming, setConfirming] = useState<BetResult | null>(null);

  function doSettle(result: BetResult) {
    settleBet(bet.id, result);
    onSettled();
  }

  if (confirming) {
    const labels: Record<BetResult, string> = {
      win: 'Mark as WON?',
      loss: 'Mark as LOST?',
      push: 'Mark as PUSH?',
      hedged: 'Mark as HEDGED?',
    };
    return (
      <div className="bg-[#09000F] rounded-xl p-3 space-y-2 border border-purple-500/20">
        <p className="text-xs text-slate-400 text-center">{labels[confirming]}</p>
        <div className="flex gap-2">
          <button onClick={() => doSettle(confirming)} className="flex-1 py-2 rounded-lg bg-purple-500 text-white text-xs font-bold btn-glow">Confirm</button>
          <button onClick={() => setConfirming(null)} className="flex-1 py-2 rounded-lg border border-white/15 text-slate-400 text-xs hover:border-white/30 transition-all">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Settle bet</p>
      <div className="grid grid-cols-3 gap-1.5">
        <button onClick={() => setConfirming('win')} className="py-2 rounded-lg border border-purple-500/40 text-purple-300 text-xs font-semibold bg-purple-500/8 hover:bg-purple-500/15 hover:border-purple-500/70 hover:shadow-[0_0_10px_rgba(168,85,247,0.25)] transition-all">Won ✓</button>
        <button onClick={() => setConfirming('loss')} className="py-2 rounded-lg border border-red-500/40 text-red-400 text-xs font-semibold hover:bg-red-500/10 hover:shadow-[0_0_8px_rgba(239,68,68,0.2)] transition-all">Lost ✗</button>
        <button onClick={() => setConfirming('push')} className="py-2 rounded-lg border border-white/15 text-slate-400 text-xs font-semibold hover:border-white/30 transition-all">Push</button>
      </div>
    </div>
  );
}

// ─── Parlay Legs Display ──────────────────────────────────────────────────────

function ParlayLegs({ bet, onRefresh }: { bet: TrackedBet; onRefresh: () => void }) {
  if (!bet.legs?.length) return null;

  const statusIcon: Record<string, string> = {
    pending: '⏳',
    won: '✓',
    lost: '✗',
    push: '~',
  };
  const statusCls: Record<string, string> = {
    pending: 'text-slate-400',
    won: 'text-purple-400',
    lost: 'text-red-400',
    push: 'text-slate-400',
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Parlay Legs</p>
      <div className="space-y-1">
        {bet.legs.map((leg) => (
          <div key={leg.id} className="flex items-center gap-2 bg-[#09000F] rounded-lg px-3 py-2">
            <span className={`text-xs font-bold w-4 text-center ${statusCls[leg.status]}`}>
              {statusIcon[leg.status]}
            </span>
            <span className="text-xs text-slate-300 flex-1">{leg.label}</span>
            {leg.status === 'pending' && (
              <div className="flex gap-1">
                <button onClick={() => { updateParlayLeg(bet.id, leg.id, 'won'); onRefresh(); }}
                  className="text-xs px-1.5 py-0.5 rounded border border-purple-500/30 text-purple-400 hover:bg-purple-500/10">W</button>
                <button onClick={() => { updateParlayLeg(bet.id, leg.id, 'lost'); onRefresh(); }}
                  className="text-xs px-1.5 py-0.5 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10">L</button>
                <button onClick={() => { updateParlayLeg(bet.id, leg.id, 'push'); onRefresh(); }}
                  className="text-xs px-1.5 py-0.5 rounded border border-[#3D1A6E] text-slate-500">P</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Bet Card ─────────────────────────────────────────────────────────────────

function BetCard({
  bet,
  onDelete,
  onRefresh,
  onGoToProRadar,
}: {
  bet: TrackedBet;
  onDelete: () => void;
  onRefresh: () => void;
  onGoToProRadar?: () => void;
}) {
  const [expanded, setExpanded] = useState(bet.status === 'hedge_ready');
  const [showManual, setShowManual] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [localNotify, setLocalNotify] = useState(bet.notifyHedge ?? false);
  const [showActivate, setShowActivate] = useState(false);
  const [stakeInput, setStakeInput] = useState('');
  const [bookInput, setBookInput] = useState(bet.sportsbook ?? '');
  const bookName = US_SPORTSBOOKS.find(b => b.key === bet.sportsbook)?.name ?? bet.sportsbook;
  const profit = bet.potentialPayout - bet.stake;

  const trend = bet.hedgeValueTrend;

  const statusDot =
    bet.status === 'watching'
      ? 'bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.55)]'
      : bet.status === 'hedge_ready' && trend === 'gone_negative'
      ? 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.7)]'
      : bet.status === 'hedge_ready' && trend === 'expired'
      ? 'bg-slate-500'
      : bet.status === 'hedge_ready'
      ? 'bg-purple-400 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]'
      : bet.status === 'monitoring'
      ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.65)]'
      : bet.status === 'hedged'
      ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.65)]'
      : 'bg-slate-500';

  const statusLabel =
    bet.status === 'watching'
      ? 'Watching'
      : bet.status === 'hedge_ready' && trend === 'gone_negative'
      ? 'Not viable'
      : bet.status === 'hedge_ready' && trend === 'expired'
      ? 'Expired'
      : bet.status === 'hedge_ready' && trend === 'up'
      ? 'Hedge now! ↑'
      : bet.status === 'hedge_ready' && trend === 'down'
      ? 'Hedge now! ↓'
      : bet.status === 'hedge_ready'
      ? 'Hedge now!'
      : bet.status === 'hedged'
      ? 'Hedged ✓'
      : bet.status === 'monitoring'
      ? 'Active'
      : bet.result === 'win' ? 'Won ✓'
      : bet.result === 'loss' ? 'Lost'
      : bet.result === 'push' ? 'Push'
      : 'Settled';

  function handleOppFound(opp: HedgeOpportunity) {
    updateBet(bet.id, { status: 'hedge_ready', hedgeOpportunity: opp });
    setShowManual(false);
    onRefresh();
  }

  function toggleNotify() {
    const newVal = !localNotify;
    setLocalNotify(newVal);
    updateBet(bet.id, { notifyHedge: newVal });
  }

  const isActive = bet.status === 'monitoring' || bet.status === 'hedge_ready';
  const noEventLinked = isActive && !bet.eventId;

  // Risk bar values: active bets use real stake/payout; watching bets derive from initialOdds
  const riskStake = isActive
    ? bet.stake
    : bet.status === 'watching' && bet.initialOdds
    ? 100
    : 0;
  const riskPayout = isActive
    ? bet.potentialPayout
    : bet.status === 'watching' && bet.initialOdds
    ? (bet.initialOdds > 0 ? 100 + bet.initialOdds : 100 + (100 * 100 / Math.abs(bet.initialOdds)))
    : 0;

  const isHedgeView = bet.opposingTeam && (bet.status === 'hedge_ready' || bet.status === 'hedged');
  const headerTitle = isHedgeView
    ? `${bet.myTeam} vs ${bet.opposingTeam}`
    : bet.label;
  const eventTime = bet.hedgeOpportunity?.eventTime;
  const fmtInitialOdds = bet.initialOdds !== undefined
    ? (bet.initialOdds >= 0 ? `+${bet.initialOdds}` : `${bet.initialOdds}`)
    : null;
  const prevProfit = bet.previousGuaranteedProfit;
  const headerSub = bet.status === 'watching'
    ? `Monitoring${fmtInitialOdds ? ` · ${fmtInitialOdds}` : ''} · ${bookName}`
    : bet.status === 'hedge_ready' && trend === 'gone_negative'
    ? `Hedge no longer profitable${prevProfit !== undefined ? ` · was +$${prevProfit.toFixed(2)}` : ''}`
    : bet.status === 'hedge_ready' && trend === 'expired'
    ? 'Opportunity has expired — odds moved'
    : bet.status === 'hedge_ready' && trend === 'up' && bet.hedgeOpportunity && prevProfit !== undefined
    ? `↑ Now +$${bet.hedgeOpportunity.guaranteedProfit.toFixed(2)} · was +$${prevProfit.toFixed(2)}`
    : bet.status === 'hedge_ready' && trend === 'down' && bet.hedgeOpportunity && prevProfit !== undefined
    ? `↓ Now +$${bet.hedgeOpportunity.guaranteedProfit.toFixed(2)} · was +$${prevProfit.toFixed(2)}`
    : isHedgeView && eventTime
    ? new Date(eventTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : `$${bet.stake.toFixed(2)} at ${bookName} · win +$${profit.toFixed(2)}`;

  return (
    <>
      {showLink && (
        <LinkEventModal
          bet={bet}
          onLinked={() => { setShowLink(false); onRefresh(); }}
          onClose={() => setShowLink(false)}
        />
      )}

      <div className={`card overflow-hidden transition-all ${
        bet.status === 'watching'
          ? 'border-white/10'
          : bet.status === 'hedge_ready' && trend === 'gone_negative'
          ? 'border-red-500/40 shadow-[0_0_16px_rgba(239,68,68,0.15)]'
          : bet.status === 'hedge_ready' && trend === 'expired'
          ? 'border-slate-700/50'
          : bet.status === 'hedge_ready'
          ? 'border-purple-500/50 shadow-[0_0_22px_rgba(168,85,247,0.22)] glow-ring'
          : bet.status === 'hedged'
          ? 'border-blue-500/30 shadow-[0_0_14px_rgba(59,130,246,0.12)]'
          : ''
      }`}>
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full p-4 text-left"
        >
          {/* Row 1: dot + title + status + chevron */}
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDot}`} />
            <div className="flex-1 min-w-0 flex items-center gap-1.5">
              <p className="text-sm font-semibold text-white truncate">{headerTitle}</p>
              {bet.isParlay && (
                <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 shrink-0">PARLAY</span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-semibold ${
                bet.status === 'watching' ? 'text-white/60' :
                bet.status === 'hedge_ready' && (trend === 'gone_negative') ? 'text-red-400' :
                bet.status === 'hedge_ready' && trend === 'expired' ? 'text-slate-500' :
                bet.status === 'hedge_ready' && trend === 'down' ? 'text-amber-400' :
                bet.status === 'hedge_ready' ? 'text-purple-400' :
                bet.status === 'hedged' ? 'text-blue-400' :
                bet.status === 'monitoring' ? 'text-green-400' :
                bet.result === 'win' ? 'text-purple-400' :
                bet.result === 'loss' ? 'text-red-400' : 'text-slate-500'
              }`}>
                {statusLabel}
              </span>
              <svg
                width="14" height="14" viewBox="0 0 14 14" fill="none"
                className={`text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
              >
                <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          {/* Row 2: subtitle + risk bar (indented to align with title) */}
          <div className="pl-[22px] mt-0.5">
            <p className="text-xs text-slate-500 truncate">{headerSub}</p>
            {(isActive || bet.status === 'watching') && (
              <div className="mt-1.5">
                <RiskBar stake={riskStake} payout={riskPayout} />
              </div>
            )}
          </div>
        </button>

        {expanded && (
          <div className="px-4 pb-4 space-y-3 animate-fade-in border-t border-[#3D1A6E] pt-3">
            {/* Notification toggle */}
            {(bet.status === 'watching' || bet.status === 'monitoring' || bet.status === 'hedge_ready') && (
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-slate-400 shrink-0">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p className="text-xs text-slate-400">Hedge notifications</p>
                </div>
                <button
                  onClick={toggleNotify}
                  className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 transition-colors ${
                    localNotify ? 'bg-purple-500 border-purple-500' : 'bg-[#2D0060] border-[#3D1A6E]'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow-md transform transition-transform ${
                    localNotify ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            )}

            {/* Activate flow for watching bets */}
            {bet.status === 'watching' && !showActivate && (
              <button
                onClick={() => setShowActivate(true)}
                className="w-full py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-semibold hover:bg-green-500/20 hover:border-green-500/60 transition-all"
              >
                Activate bet →
              </button>
            )}

            {bet.status === 'watching' && showActivate && (
              <div className="space-y-3 bg-[#09000F] rounded-xl p-3 border border-[#3D1A6E]">
                <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Activate Bet</p>

                {/* Sportsbook selector */}
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-400">Which sportsbook did you use?</p>
                  <select
                    value={bookInput}
                    onChange={(e) => setBookInput(e.target.value)}
                    className="input-field text-sm bg-[#180032]"
                  >
                    <option value="">Select a sportsbook…</option>
                    {US_SPORTSBOOKS.map((b) => (
                      <option key={b.key} value={b.key}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Stake input */}
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-400">How much did you wager?</p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
                    <input
                      type="number"
                      placeholder="100"
                      value={stakeInput}
                      onChange={(e) => setStakeInput(e.target.value)}
                      className="input-field pl-8 text-sm"
                      min="1"
                    />
                  </div>
                </div>

                {stakeInput && parseFloat(stakeInput) > 0 && bet.initialOdds !== undefined && (
                  <div className="text-xs text-slate-400 text-center">
                    {(() => {
                      const s = parseFloat(stakeInput);
                      const o = bet.initialOdds!;
                      const pay = o > 0 ? s + (s * o / 100) : s + (s * 100 / Math.abs(o));
                      return `Potential payout: $${pay.toFixed(2)}`;
                    })()}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowActivate(false)}
                    className="flex-1 py-2 rounded-lg border border-white/15 text-slate-400 text-xs hover:border-white/30 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!stakeInput || parseFloat(stakeInput) <= 0 || !bookInput}
                    onClick={() => {
                      const s = parseFloat(stakeInput);
                      if (isNaN(s) || s <= 0 || !bookInput) return;
                      const o = bet.initialOdds ?? 0;
                      const pay = o > 0 ? s + (s * o / 100) : s + (s * 100 / Math.abs(o));
                      updateBet(bet.id, { stake: s, potentialPayout: pay, sportsbook: bookInput, status: 'monitoring' });
                      onRefresh();
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      stakeInput && parseFloat(stakeInput) > 0 && bookInput
                        ? 'bg-green-500 text-white hover:bg-green-400'
                        : 'bg-[#180032] text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}

            {/* Hedge action card */}
            {bet.status === 'hedge_ready' && bet.hedgeOpportunity && (
              <HedgeActionCard
                bet={bet}
                opp={bet.hedgeOpportunity}
                onDone={onRefresh}
                onGoToProRadar={onGoToProRadar}
              />
            )}

            {/* Parlay legs */}
            {bet.isParlay && <ParlayLegs bet={bet} onRefresh={onRefresh} />}

            {/* Link to live game */}
            {noEventLinked && (
              <button
                onClick={() => setShowLink(true)}
                className="w-full py-2.5 rounded-xl border border-blue-500/30 text-blue-400 text-xs font-semibold hover:border-blue-500/60 hover:bg-blue-500/5 hover:shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-all"
              >
                Link to Live Game → enable auto-monitoring
              </button>
            )}

            {/* Manual hedge for monitoring bets */}
            {bet.status === 'monitoring' && !showManual && (
              <button
                onClick={() => setShowManual(true)}
                className="w-full py-3 rounded-xl border border-purple-500/30 text-purple-400 text-sm hover:border-purple-500/60 hover:shadow-[0_0_14px_rgba(168,85,247,0.22)] transition-all"
              >
                Check if I can hedge now →
              </button>
            )}

            {bet.status === 'monitoring' && showManual && (
              <ManualHedgePanel bet={bet} onFound={handleOppFound} />
            )}

            {bet.status === 'hedged' && (
              <div className="space-y-3">
                {/* Bet A pill — completed */}
                <div className="rounded-xl p-4 pill-glow-white">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold flex items-center justify-center shrink-0">A</span>
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Original Bet</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-green-400 tracking-wide">✓ Done</span>
                  </div>
                  <p className="text-sm font-bold text-white">{bet.myTeam || bet.label}</p>
                  <p className="text-xs text-slate-400 font-mono mt-1">${bet.stake.toFixed(2)} · {bookName}</p>
                </div>

                {/* Bet B pill — completed */}
                {bet.hedgeOpportunity && (
                  <div className="rounded-xl p-4 pill-glow-purple">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.5)]">B</span>
                        <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider">Hedge Bet</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-green-400 tracking-wide">✓ Done</span>
                    </div>
                    <p className="text-sm font-bold text-white">{bet.hedgeOpportunity.hedgeTeam}</p>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      {fmtOdds(bet.hedgeOpportunity.hedgeOdds)} · ${bet.hedgeOpportunity.hedgeStake.toFixed(2)} · {bet.hedgeOpportunity.hedgeBook}
                    </p>
                  </div>
                )}

                {/* Locked profit */}
                <div className="bg-purple-500/8 border border-purple-500/30 rounded-xl p-4 text-center space-y-0.5 shadow-[0_0_18px_rgba(168,85,247,0.2)]">
                  <p className="text-purple-300 font-semibold text-sm">Profit locked in — awaiting payout</p>
                  {bet.hedgeOpportunity && (
                    <p className="text-2xl font-bold font-mono text-purple-400 mt-1 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">
                      +${bet.hedgeOpportunity.guaranteedProfit.toFixed(2)}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">guaranteed no matter who wins</p>
                </div>

                <button
                  onClick={() => { settleBet(bet.id, 'hedged'); onRefresh(); }}
                  className="w-full py-3 rounded-xl bg-purple-500/10 border border-purple-500/40 text-purple-300 text-sm font-semibold hover:bg-purple-500/20 hover:border-purple-500/60 hover:shadow-[0_0_16px_rgba(168,85,247,0.3)] transition-all"
                >
                  Payout received — move to history ✓
                </button>
              </div>
            )}

            {/* Settle panel for active bets */}
            {isActive && (
              <SettlePanel bet={bet} onSettled={onRefresh} />
            )}

            {/* Settled P&L */}
            {bet.status === 'settled' && bet.settledPnl !== undefined && (
              <div className={`rounded-xl p-3 text-center ${bet.settledPnl >= 0 ? 'bg-purple-500/10' : 'bg-red-500/10'}`}>
                <p className={`text-lg font-bold font-mono ${bet.settledPnl >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
                  {bet.settledPnl >= 0 ? '+' : ''}${bet.settledPnl.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{bet.result === 'win' ? 'Profit' : bet.result === 'loss' ? 'Lost' : 'P&L'}</p>
              </div>
            )}

            {/* Delete */}
            <button
              onClick={onDelete}
              className="w-full py-2 text-xs text-slate-500 hover:text-red-400 transition-colors"
            >
              Remove this bet
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── My Bets Screen ───────────────────────────────────────────────────────────

export default function MyBets({ onBadgeChange, onGoToProRadar }: { onBadgeChange?: (count: number) => void; onGoToProRadar?: () => void }) {
  const [bets, setBets] = useState<TrackedBet[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');

  const refresh = useCallback(() => {
    const all = getAllBets();
    setBets(all);
    const readyCount = all.filter(b => b.status === 'hedge_ready').length;
    onBadgeChange?.(readyCount);
  }, [onBadgeChange]);

  useEffect(() => {
    refresh();
    const interval = setInterval(() => checkMonitoredBets(refresh), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  const hedgeReady = bets.filter(b => b.status === 'hedge_ready');
  const active = bets.filter(b => b.status === 'monitoring');
  const watching = bets.filter(b => b.status === 'watching');
  const hedged = bets.filter(b => b.status === 'hedged');
  const done = bets.filter(b => b.status === 'settled');
  const hasHistory = done.length > 0;

  return (
    <div className="pb-32">
      {/* No bets empty state */}
      {bets.length === 0 && (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center space-y-5">
          <div className="w-20 h-20 rounded-3xl bg-[#180032] flex items-center justify-center">
            <span className="text-4xl">🎯</span>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-bold">No bets yet</p>
            <p className="text-slate-400 text-sm max-w-xs">
              Add any bet you've placed and we'll watch it and tell you exactly when and how to hedge it.
            </p>
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="bg-purple-500 hover:bg-purple-400 text-white font-bold py-4 px-8 rounded-2xl transition-all btn-glow"
          >
            Add my first bet
          </button>
        </div>
      )}

      {bets.length > 0 && (
        <>
          {/* Sub-tabs */}
          <div className="flex items-center gap-1 px-4 pt-4 pb-2">
            <button
              onClick={() => setViewMode('active')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'active'
                  ? 'bg-purple-500/15 text-purple-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Active
              {hedgeReady.length + active.length + hedged.length + watching.length > 0 && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                  {hedgeReady.length + active.length + hedged.length + watching.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'history'
                  ? 'bg-purple-500/15 text-purple-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              History & Portfolio
              {hasHistory && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-slate-500/20 text-slate-400">{done.length}</span>}
            </button>
          </div>

          {viewMode === 'history' && <PortfolioView />}

          {viewMode === 'active' && (
            <div className="px-4 space-y-5">
              {/* Hedge alerts section */}
              {hedgeReady.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                      Hedge now!
                    </p>
                  </div>
                  {hedgeReady.map(bet => (
                    <BetCard key={bet.id} bet={bet}
                      onDelete={() => { deleteBet(bet.id); refresh(); }}
                      onRefresh={refresh}
                      onGoToProRadar={onGoToProRadar}
                    />
                  ))}
                </div>
              )}

              {/* Hedged — awaiting payout */}
              {hedged.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest">
                      Hedged — awaiting payout
                    </p>
                  </div>
                  {hedged.map(bet => (
                    <BetCard key={bet.id} bet={bet}
                      onDelete={() => { deleteBet(bet.id); refresh(); }}
                      onRefresh={refresh}
                      onGoToProRadar={onGoToProRadar}
                    />
                  ))}
                </div>
              )}

              {/* Active monitoring */}
              {active.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
                    <p className="text-xs font-semibold text-green-400 uppercase tracking-widest">
                      Active — watching for hedge
                    </p>
                  </div>
                  {active.map(bet => (
                    <BetCard key={bet.id} bet={bet}
                      onDelete={() => { deleteBet(bet.id); refresh(); }}
                      onRefresh={refresh}
                      onGoToProRadar={onGoToProRadar}
                    />
                  ))}
                </div>
              )}

              {/* Watching (no stake yet) */}
              {watching.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-white/70 shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                      Monitoring odds
                    </p>
                  </div>
                  {watching.map(bet => (
                    <BetCard key={bet.id} bet={bet}
                      onDelete={() => { deleteBet(bet.id); refresh(); }}
                      onRefresh={refresh}
                      onGoToProRadar={onGoToProRadar}
                    />
                  ))}
                </div>
              )}

              {hedgeReady.length === 0 && active.length === 0 && hedged.length === 0 && watching.length === 0 && (
                <div className="card p-8 text-center mt-4">
                  <p className="text-xs text-slate-500">No active bets — tap + to add one.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Floating add button */}
      {bets.length > 0 && (
        <button
          onClick={() => setShowWizard(true)}
          className="fixed bottom-24 right-5 w-14 h-14 bg-purple-500 hover:bg-purple-400 rounded-full flex items-center justify-center transition-all active:scale-95 z-40 shadow-[0_0_28px_rgba(168,85,247,0.55),0_8px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(168,85,247,0.7),0_8px_24px_rgba(0,0,0,0.5)]"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {showWizard && (
        <AddBetWizard
          onClose={() => setShowWizard(false)}
          onAdded={() => { setShowWizard(false); refresh(); }}
        />
      )}
    </div>
  );
}
