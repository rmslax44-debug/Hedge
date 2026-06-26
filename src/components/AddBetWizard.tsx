import { useState } from 'react';
import { US_SPORTSBOOKS, SPORTS } from '../utils/sportsbooks';
import { addBet, type ParlayLeg } from '../utils/storage';
import SportIcon from './SportIcon';

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

export default function AddBetWizard({ onClose, onAdded, prefill }: Props) {
  const [step, setStep] = useState(1);

  // Step 1
  const [label, setLabel] = useState(prefill?.label ?? '');
  const [sport, setSport] = useState(prefill?.sport ?? '');
  const [isParlay, setIsParlay] = useState(false);
  const [legs, setLegs] = useState<ParlayLeg[]>([]);
  const [legInput, setLegInput] = useState('');

  // Step 2
  const [stake, setStake] = useState(prefill?.stake ? String(prefill.stake) : '');
  const [payout, setPayout] = useState(prefill?.potentialPayout ? String(prefill.potentialPayout) : '');

  // Step 3
  const [sportsbook, setSportsbook] = useState('');

  const parsedStake = parseFloat(stake);
  const parsedPayout = parseFloat(payout);
  const payoutProfit = !isNaN(parsedPayout) && !isNaN(parsedStake) ? parsedPayout - parsedStake : null;

  function addLeg() {
    const t = legInput.trim();
    if (!t) return;
    setLegs(prev => [...prev, { id: crypto.randomUUID(), label: t, sport: sport || undefined, status: 'pending' }]);
    setLegInput('');
  }

  function removeLeg(id: string) {
    setLegs(prev => prev.filter(l => l.id !== id));
  }

  function handleAdd() {
    if (!label || isNaN(parsedStake) || isNaN(parsedPayout) || !sportsbook) return;
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

  const step1Valid = label.trim().length > 0 && (!isParlay || legs.length >= 2);
  const step2Valid = !isNaN(parsedStake) && parsedStake > 0 && !isNaN(parsedPayout) && parsedPayout > parsedStake;
  const step3Valid = sportsbook.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#09000F] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-4 border-b border-[#3D1A6E]">
        <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <h2 className="text-sm font-semibold">Add a Bet to Monitor</h2>
        <div className="w-8" />
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 py-4">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`rounded-full transition-all duration-300 ${
              n === step
                ? 'w-6 h-2 bg-purple-500'
                : n < step
                  ? 'w-2 h-2 bg-purple-500/50'
                  : 'w-2 h-2 bg-[#2D0060]'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">

        {/* ── Step 1: What did you bet on? ─────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-1 pt-2">
              <p className="text-2xl font-bold">What did you bet on?</p>
              <p className="text-slate-400 text-sm">Describe it in plain words — no need for odds</p>
            </div>

            {/* Parlay toggle */}
            <div className="flex items-center justify-between card p-4">
              <div>
                <p className="text-sm font-semibold text-slate-200">Parlay bet</p>
                <p className="text-xs text-slate-500 mt-0.5">Multiple legs that all need to win</p>
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

            <div className="space-y-2">
              <input
                type="text"
                placeholder={isParlay ? 'Parlay name (e.g. "3-team NFL parlay")' : 'e.g. "Chiefs to win" or "Patriots -3.5"'}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="input-field text-base"
                autoFocus
              />
              <p className="text-xs text-slate-600 pl-1">
                {isParlay ? 'A name for this parlay' : 'Just describe what you need to happen to win your bet'}
              </p>
            </div>

            {/* Parlay legs entry */}
            {isParlay && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Legs ({legs.length} added — min 2)</p>
                {legs.length > 0 && (
                  <div className="space-y-1.5">
                    {legs.map((leg, i) => (
                      <div key={leg.id} className="flex items-center gap-2 bg-[#1A003A] rounded-xl px-3 py-2.5">
                        <span className="text-xs font-mono text-slate-500 w-5 text-center">{i + 1}</span>
                        <span className="text-sm text-slate-300 flex-1">{leg.label}</span>
                        <button onClick={() => removeLeg(leg.id)} className="text-slate-600 hover:text-red-400 transition-colors text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder='e.g. "Chiefs ML" or "Over 47.5"'
                    value={legInput}
                    onChange={(e) => setLegInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addLeg()}
                    className="input-field text-sm flex-1"
                  />
                  <button
                    onClick={addLeg}
                    disabled={!legInput.trim()}
                    className="px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-semibold disabled:opacity-40 hover:bg-amber-500/25 transition-all"
                  >
                    + Add
                  </button>
                </div>
                {legs.length < 2 && (
                  <p className="text-xs text-slate-600 pl-1">Add at least 2 legs to continue</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Sport (optional)</p>
              <div className="grid grid-cols-4 gap-2">
                {SPORTS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSport(sport === s.key ? '' : s.key)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-all ${
                      sport === s.key
                        ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                        : 'bg-[#180032] border-[#3D1A6E] text-slate-400'
                    }`}
                  >
                    <SportIcon sportKey={s.key} size={30} />
                    <span className="truncate w-full text-center leading-tight">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: The money ─────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-1 pt-2">
              <p className="text-2xl font-bold">The money</p>
              <p className="text-slate-400 text-sm">Open your betting app — we just need two numbers</p>
            </div>

            <div className="space-y-4">
              <div className="card p-4 space-y-2">
                <p className="text-sm font-semibold text-slate-300">How much did you bet?</p>
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
                    autoFocus
                  />
                </div>
              </div>

              <div className="card p-4 space-y-2">
                <p className="text-sm font-semibold text-slate-300">
                  If you win, what do you get back? <span className="text-slate-500 font-normal">(total)</span>
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono">$</span>
                  <input
                    type="number"
                    placeholder="250"
                    value={payout}
                    onChange={(e) => setPayout(e.target.value)}
                    className="input-field pl-8 text-lg"
                    min="1"
                    step="any"
                  />
                </div>
                <p className="text-xs text-slate-600">
                  💡 This is the total shown in your app — including your original bet amount back
                </p>
              </div>

              {/* Live preview */}
              {payoutProfit !== null && payoutProfit > 0 && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 text-center space-y-1">
                  <p className="text-xs text-purple-400 uppercase tracking-widest font-semibold">If your bet wins</p>
                  <p className="text-3xl font-bold text-purple-400">
                    +${payoutProfit.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500">profit on top of getting your ${stake} back</p>
                </div>
              )}

              {parsedPayout > 0 && parsedStake > 0 && parsedPayout <= parsedStake && (
                <div className="card p-3 border-red-500/30 bg-red-500/5">
                  <p className="text-xs text-red-400">
                    "If you win" should be more than your bet amount. Double-check the total shown in your app.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: Which app? ───────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-1 pt-2">
              <p className="text-2xl font-bold">Which app did you bet on?</p>
              <p className="text-slate-400 text-sm">We'll use this to compare odds across your books</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {US_SPORTSBOOKS.map((book) => (
                <button
                  key={book.key}
                  onClick={() => setSportsbook(book.key)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    sportsbook === book.key
                      ? 'bg-purple-500/15 border-purple-500/50 text-purple-300'
                      : 'bg-[#180032] border-[#3D1A6E] text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    sportsbook === book.key ? 'border-purple-500 bg-purple-500' : 'border-slate-600'
                  }`}>
                    {sportsbook === book.key && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium">{book.name}</span>
                </button>
              ))}
            </div>

            {/* Confirmation summary */}
            {step3Valid && (
              <div className="card p-4 space-y-2 border-purple-500/20 bg-purple-500/5">
                <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest">Your bet summary</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-white font-medium">{label}</p>
                  {isParlay && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">
                      {legs.length}-LEG PARLAY
                    </span>
                  )}
                </div>
                <div className="flex gap-4 text-xs text-slate-400 font-mono">
                  <span>Bet: <span className="text-white">${parsedStake.toFixed(2)}</span></span>
                  <span>Win: <span className="text-purple-400">+${(parsedPayout - parsedStake).toFixed(2)}</span></span>
                  <span>At: <span className="text-white">{US_SPORTSBOOKS.find(b => b.key === sportsbook)?.name}</span></span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom button */}
      <div className="px-5 pb-safe pb-6 pt-4 border-t border-[#3D1A6E] bg-[#09000F]">
        {step < 3 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 1 ? !step1Valid : !step2Valid}
            className={`w-full py-4 rounded-2xl font-semibold text-base transition-all ${
              (step === 1 ? step1Valid : step2Valid)
                ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-lg shadow-purple-500/20'
                : 'bg-[#180032] text-slate-600 cursor-not-allowed'
            }`}
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={handleAdd}
            disabled={!step3Valid}
            className={`w-full py-4 rounded-2xl font-semibold text-base transition-all ${
              step3Valid
                ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-lg shadow-purple-500/20'
                : 'bg-[#180032] text-slate-600 cursor-not-allowed'
            }`}
          >
            Start monitoring this bet ✓
          </button>
        )}
      </div>
    </div>
  );
}
