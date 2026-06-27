import { useState } from 'react';
import { US_SPORTSBOOKS, SPORTS } from '../utils/sportsbooks';
import { addBet, type ParlayLeg } from '../utils/storage';
import { calcRisk } from '../utils/risk';

interface Props {
  onClose: () => void;
  onAdded: () => void;
  prefill?: {
    label?: string;
    myTeam?: string;
    opposingTeam?: string;
    sport?: string;
    eventId?: string;
    stake?: number;
    potentialPayout?: number;
  };
}

function fmtOdds(n: number) { return n > 0 ? `+${n}` : `${n}`; }

function payoutFromOdds(stake: number, odds: number): number {
  return odds > 0
    ? stake + stake * (odds / 100)
    : stake + stake * (100 / Math.abs(odds));
}

function parseAmericanOdds(str: string): number | null {
  const n = parseInt(str.replace(/\s/g, ''), 10);
  if (isNaN(n) || Math.abs(n) < 100) return null;
  return n;
}

export default function AddBetWizard({ onClose, onAdded, prefill }: Props) {
  const [step, setStep] = useState(1);

  // ── Step 1 state ───────────────────────────────────────────────────────────
  const [label, setLabel]           = useState(prefill?.label ?? '');
  const [sportsbook, setSportsbook] = useState('');
  const [stake, setStake]           = useState(prefill?.stake ? String(prefill.stake) : '');
  const [oddsStr, setOddsStr]       = useState('');
  const [sport, setSport]           = useState(prefill?.sport ?? '');
  const [sportOpen, setSportOpen]   = useState(false);
  const [isParlay, setIsParlay]     = useState(false);
  const [legs, setLegs]             = useState<ParlayLeg[]>([]);
  const [legInput, setLegInput]     = useState('');
  const [legOddsInput, setLegOddsInput] = useState('');

  // ── Step 2 state ───────────────────────────────────────────────────────────
  const [manualPayout, setManualPayout] = useState(prefill?.potentialPayout ? String(prefill.potentialPayout) : '');

  // ── Derived values ─────────────────────────────────────────────────────────
  const parsedOdds  = parseAmericanOdds(oddsStr);
  const oddsValid   = parsedOdds !== null;
  const parsedStake = parseFloat(stake);
  const stakeValid  = !isNaN(parsedStake) && parsedStake > 0;

  const autoPayout   = oddsValid && stakeValid ? payoutFromOdds(parsedStake, parsedOdds!) : null;
  const parsedPayout = autoPayout ?? parseFloat(manualPayout);
  const bookName     = US_SPORTSBOOKS.find(b => b.key === sportsbook)?.name ?? '';
  const sportName    = SPORTS.find(s => s.key === sport);

  // ── Validation ─────────────────────────────────────────────────────────────
  const step1Valid =
    label.trim().length > 0 &&
    sportsbook.length > 0 &&
    stakeValid &&
    (!isParlay || legs.length >= 2);

  const step2Valid =
    !isNaN(parsedPayout) &&
    parsedPayout > parsedStake;

  // ── Parlay helpers ─────────────────────────────────────────────────────────
  function addLeg() {
    const t = legInput.trim();
    if (!t) return;
    const legOdds = parseAmericanOdds(legOddsInput);
    setLegs(prev => [...prev, {
      id: crypto.randomUUID(),
      label: t,
      odds: legOdds ?? undefined,
      sport: sport || undefined,
      status: 'pending',
    }]);
    setLegInput('');
    setLegOddsInput('');
  }
  function removeLeg(id: string) { setLegs(prev => prev.filter(l => l.id !== id)); }

  // ── Submit ─────────────────────────────────────────────────────────────────
  function handleAdd() {
    if (!step2Valid) return;
    addBet({
      label,
      myTeam: prefill?.myTeam ?? label,
      sportsbook,
      stake: parsedStake,
      potentialPayout: parsedPayout,
      sport: sport || 'americanfootball_nfl',
      eventId: prefill?.eventId,
      opposingTeam: prefill?.opposingTeam,
      isParlay,
      legs: isParlay && legs.length ? legs : undefined,
    });
    onAdded();
  }

  // ── Continue button label ──────────────────────────────────────────────────
  const continueLabel = !label.trim()
    ? 'Describe your bet to continue'
    : !sportsbook
      ? 'Select a sportsbook to continue'
      : !stakeValid
        ? 'Enter your stake to continue'
        : isParlay && legs.length < 2
          ? `Add ${2 - legs.length} more leg${legs.length === 1 ? '' : 's'} to continue`
          : 'Next →';

  return (
    // z-[60] so this sits above the BottomNav (z-50)
    <div className="fixed inset-0 z-[60] bg-[#09000F] flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-[#3D1A6E] shrink-0">
        <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <h2 className="text-sm font-semibold">{step === 1 ? 'Your Bet' : 'Payout & Risk'}</h2>
        <div className="w-8" />
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 py-3 shrink-0">
        {[1, 2].map((n) => (
          <div
            key={n}
            className={`rounded-full transition-all duration-300 ${
              n === step ? 'w-6 h-2 bg-purple-500' : n < step ? 'w-2 h-2 bg-purple-500/50' : 'w-2 h-2 bg-[#2D0060]'
            }`}
          />
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">

        {/* ── Step 1: Your Bet ──────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">

            {/* Description */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">What did you bet on?</p>
              <input
                type="text"
                placeholder={isParlay ? 'Parlay name — e.g. "3-team NFL parlay"' : 'e.g. "Chiefs to win Super Bowl" or "Lakers ML"'}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="input-field"
                autoFocus
              />
            </div>

            {/* Stake */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                How much did you bet? <span className="text-red-400">*</span>
              </p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono">$</span>
                <input
                  type="number"
                  placeholder="100"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  className="input-field pl-8 text-lg"
                  min="1"
                  step="any"
                />
              </div>
            </div>

            {/* Sportsbook — required */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Sportsbook <span className="text-red-400">*</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {US_SPORTSBOOKS.map((book) => {
                  const sel = sportsbook === book.key;
                  return (
                    <button
                      key={book.key}
                      onClick={() => setSportsbook(book.key)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-150 ${
                        sel
                          ? 'bg-purple-500/15 border-purple-500/50 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                          : 'bg-[#180032] border-[#3D1A6E] text-slate-400 hover:border-purple-500/30 hover:text-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${sel ? 'border-purple-500 bg-purple-500' : 'border-slate-600'}`}>
                        {sel && (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1.5 4l1.8 1.8L6.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs font-semibold truncate">{book.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Odds — optional */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Odds (optional)</p>
                <span className="text-[10px] text-slate-600 font-mono">American format</span>
              </div>
              <input
                type="text"
                placeholder="e.g. +500 or -150"
                value={oddsStr}
                onChange={(e) => setOddsStr(e.target.value)}
                className="input-field font-mono"
              />
              {oddsStr && !oddsValid && (
                <p className="text-[10px] text-amber-400 pl-1">Must be ≥ +100 (underdog) or ≤ -100 (favorite)</p>
              )}
              {oddsValid && parsedOdds !== null && stakeValid && (
                <p className="text-[10px] text-purple-400 pl-1 font-mono">
                  {parsedOdds > 0
                    ? `Win $${(parsedStake * parsedOdds / 100).toFixed(2)} on a $${parsedStake.toFixed(2)} bet`
                    : `Win $${(parsedStake * 100 / Math.abs(parsedOdds)).toFixed(2)} on a $${parsedStake.toFixed(2)} bet`
                  }
                </p>
              )}
              {oddsValid && parsedOdds !== null && !stakeValid && (
                <p className="text-[10px] text-purple-400 pl-1 font-mono">
                  {parsedOdds > 0
                    ? `Underdog · bet $100 to win $${parsedOdds}`
                    : `Favorite · bet $${Math.abs(parsedOdds)} to win $100`
                  }
                </p>
              )}
              <p className="text-[10px] text-slate-600 pl-1">
                Enter odds to auto-calculate your payout on the next step
              </p>
            </div>

            {/* Sport — custom dropdown */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Sport (optional)</p>

              {/* Trigger button */}
              <button
                type="button"
                onClick={() => setSportOpen(o => !o)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-150 ${
                  sport
                    ? 'bg-purple-500/12 border-purple-500/50 text-white shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                    : 'bg-[#180032] border-[#3D1A6E] text-slate-500'
                }`}
              >
                <span className="text-sm font-medium">
                  {sportName ? `${sportName.emoji}  ${sportName.name}` : 'Select a sport…'}
                </span>
                <div className="flex items-center gap-2">
                  {sport && (
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); setSport(''); setSportOpen(false); }}
                      className="text-slate-500 hover:text-slate-300 text-xs px-1"
                    >
                      ✕
                    </span>
                  )}
                  <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                    className={`text-slate-500 transition-transform duration-200 ${sportOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>

              {/* Dropdown list */}
              {sportOpen && (
                <div className="rounded-xl border border-[#3D1A6E] bg-[#100020] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                  <div className="max-h-56 overflow-y-auto">
                    {SPORTS.map((s, i) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => { setSport(s.key); setSportOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 ${
                          sport === s.key
                            ? 'bg-purple-500/15 text-purple-300'
                            : 'text-slate-300 hover:bg-purple-500/8 hover:text-white'
                        } ${i > 0 ? 'border-t border-[#1A003A]' : ''}`}
                      >
                        <span className="text-base leading-none w-6 text-center">{s.emoji}</span>
                        <span className="text-sm font-medium">{s.name}</span>
                        {sport === s.key && (
                          <svg className="ml-auto text-purple-400 shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Parlay toggle */}
            <div className="card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-200">Parlay bet</p>
                  <p className="text-xs text-slate-500 mt-0.5">Multiple legs — all must win</p>
                </div>
                <button
                  onClick={() => setIsParlay(p => !p)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ${
                    isParlay ? 'bg-amber-500 border-amber-500' : 'bg-[#2D0060] border-[#3D1A6E]'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                    isParlay ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {isParlay && (
                <div className="space-y-3 border-t border-[#2D0060] pt-3">

                  {/* Leg count header */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                      Legs
                    </p>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      legs.length >= 2
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-[#2D0060] text-slate-500'
                    }`}>
                      {legs.length} / min 2
                    </span>
                  </div>

                  {/* Existing legs */}
                  {legs.length > 0 && (
                    <div className="space-y-2">
                      {legs.map((leg, i) => (
                        <div key={leg.id} className="bg-[#1A003A] border border-[#2D0060] rounded-xl px-3 py-2.5 flex items-start gap-2">
                          <span className="text-[10px] font-mono text-slate-500 w-5 text-center mt-0.5 shrink-0">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-200 leading-tight">{leg.label}</p>
                            {leg.odds !== undefined && (
                              <p className="text-[10px] font-mono text-amber-400 mt-0.5">{fmtOdds(leg.odds)}</p>
                            )}
                          </div>
                          <button onClick={() => removeLeg(leg.id)} className="text-slate-600 hover:text-red-400 transition-colors text-xs shrink-0 mt-0.5">✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add leg form */}
                  <div className="bg-[#12002A] border border-[#2D0060] rounded-xl p-3 space-y-2.5">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Add a leg</p>

                    {/* Bet description */}
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500">Bet</p>
                      <input
                        type="text"
                        placeholder='e.g. "Chiefs ML" or "Over 47.5"'
                        value={legInput}
                        onChange={(e) => setLegInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addLeg()}
                        className="input-field text-sm"
                      />
                    </div>

                    {/* Leg odds */}
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500">Odds (optional)</p>
                      <input
                        type="text"
                        placeholder="e.g. -110 or +200"
                        value={legOddsInput}
                        onChange={(e) => setLegOddsInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addLeg()}
                        className="input-field text-sm font-mono"
                      />
                      {legOddsInput && parseAmericanOdds(legOddsInput) === null && (
                        <p className="text-[10px] text-amber-400">Must be ≥ +100 or ≤ -100</p>
                      )}
                    </div>

                    <button
                      onClick={addLeg}
                      disabled={!legInput.trim()}
                      className="w-full py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-semibold disabled:opacity-40 hover:bg-amber-500/25 transition-all"
                    >
                      + Add Leg
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── Step 2: Payout & Risk ─────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center space-y-1 pt-2">
              <p className="text-2xl font-bold">
                {oddsValid ? 'Confirm your payout' : 'What do you win?'}
              </p>
              <p className="text-slate-400 text-sm">
                {oddsValid ? 'We calculated it from your odds' : 'Open your app and enter the total payout'}
              </p>
            </div>

            {/* Payout — auto or manual */}
            {oddsValid && parsedOdds !== null ? (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-5 space-y-2 shadow-[0_0_14px_rgba(168,85,247,0.15)]">
                <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest">Auto-calculated from {fmtOdds(parsedOdds)} odds</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-4xl font-bold text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                    +${(parsedPayout - parsedStake).toFixed(2)}
                  </p>
                  <p className="text-sm text-slate-400">profit</p>
                </div>
                <p className="text-xs text-slate-500">
                  Total back: <span className="text-white font-mono">${parsedPayout.toFixed(2)}</span>
                  {' · '}Stake: <span className="text-white font-mono">${parsedStake.toFixed(2)}</span>
                </p>
              </div>
            ) : (
              <div className="card p-4 space-y-2">
                <p className="text-sm font-semibold text-slate-300">
                  If you win, what do you get back? <span className="text-slate-500 font-normal text-xs">(total including stake)</span>
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono">$</span>
                  <input
                    type="number"
                    placeholder="250"
                    value={manualPayout}
                    onChange={(e) => setManualPayout(e.target.value)}
                    className="input-field pl-8 text-lg"
                    min="1"
                    step="any"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-slate-600">Enter the total shown in your betting app — it includes your ${parsedStake > 0 ? parsedStake.toFixed(2) : '…'} stake back</p>
              </div>
            )}

            {/* Error: payout ≤ stake */}
            {!isNaN(parsedPayout) && stakeValid && parsedPayout <= parsedStake && (
              <div className="card p-3 border-red-500/30 bg-red-500/5">
                <p className="text-xs text-red-400">
                  Payout must be more than your stake of ${parsedStake.toFixed(2)}. Check the numbers in your app.
                </p>
              </div>
            )}

            {/* Risk meter */}
            {step2Valid && (() => {
              const risk = calcRisk(parsedStake, parsedPayout);
              return (
                <div className={`rounded-2xl p-4 space-y-3 border ${risk.borderColor} ${risk.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Risk Level</p>
                    <span className={`text-xs font-bold font-mono uppercase tracking-wider ${risk.textColor}`}>
                      {risk.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 h-2.5 rounded-full transition-all duration-500 ${
                          i <= risk.tierIndex ? risk.barColor : 'bg-[#2D0060]'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs ${risk.textColor}`}>{risk.sublabel}</p>
                    <p className="text-xs text-slate-500 font-mono shrink-0 ml-2">
                      ~{(risk.impliedProb * 100).toFixed(0)}% win prob
                    </p>
                  </div>
                  {(risk.tier === 'high' || risk.tier === 'extreme') && (
                    <p className="text-[10px] text-slate-500 border-t border-white/5 pt-2">
                      Hedge will alert you the moment a profitable hedge is available.
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Summary */}
            {step2Valid && (
              <div className="card p-4 space-y-2.5 border-purple-500/20 bg-purple-500/5">
                <p className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-widest">Bet summary</p>
                <div className="flex items-start gap-2 flex-wrap">
                  <p className="text-sm text-white font-medium">{label}</p>
                  {isParlay && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 shrink-0">
                      {legs.length}-LEG PARLAY
                    </span>
                  )}
                </div>
                {isParlay && legs.length > 0 && (
                  <div className="space-y-1 border-t border-white/5 pt-2">
                    {legs.map((leg, i) => (
                      <div key={leg.id} className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-mono text-slate-600 shrink-0">{i + 1}.</span>
                        <span>{leg.label}</span>
                        {leg.odds !== undefined && (
                          <span className="font-mono text-amber-400 ml-auto shrink-0">{fmtOdds(leg.odds)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-slate-400 border-t border-white/5 pt-2">
                  <span>Stake: <span className="text-white">${parsedStake.toFixed(2)}</span></span>
                  <span>Win: <span className="text-purple-300">+${(parsedPayout - parsedStake).toFixed(2)}</span></span>
                  {oddsValid && parsedOdds !== null && <span>Odds: <span className="text-purple-300">{fmtOdds(parsedOdds)}</span></span>}
                  <span>At: <span className="text-white">{bookName}</span></span>
                  {sportName && <span>Sport: <span className="text-white">{sportName.emoji} {sportName.name}</span></span>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom action bar — always visible above keyboard / safe area */}
      <div className="shrink-0 px-5 pt-4 border-t border-[#3D1A6E] bg-[#09000F]" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
        {step === 1 ? (
          <button
            onClick={() => setStep(2)}
            disabled={!step1Valid}
            className={`w-full py-4 rounded-2xl font-semibold text-base transition-all ${
              step1Valid
                ? 'bg-purple-500 hover:bg-purple-400 text-white btn-glow'
                : 'bg-[#180032] text-slate-600 cursor-not-allowed'
            }`}
          >
            {step1Valid ? 'Next →' : continueLabel}
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleAdd}
              disabled={!step2Valid}
              className={`w-full py-4 rounded-2xl font-semibold text-base transition-all ${
                step2Valid
                  ? 'bg-purple-500 hover:bg-purple-400 text-white btn-glow'
                  : 'bg-[#180032] text-slate-600 cursor-not-allowed'
              }`}
            >
              {step2Valid ? 'Start monitoring this bet ✓' : 'Enter payout to continue'}
            </button>
            <button
              onClick={() => setStep(1)}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
