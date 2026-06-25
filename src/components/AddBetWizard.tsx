import { useState } from 'react';
import { US_SPORTSBOOKS, SPORTS } from '../utils/sportsbooks';
import { addBet } from '../utils/storage';

interface Props {
  onClose: () => void;
  onAdded: () => void;
  // Pre-filled from opportunities screen
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

  // Step 2
  const [stake, setStake] = useState(prefill?.stake ? String(prefill.stake) : '');
  const [payout, setPayout] = useState(prefill?.potentialPayout ? String(prefill.potentialPayout) : '');

  // Step 3
  const [sportsbook, setSportsbook] = useState('');

  const parsedStake = parseFloat(stake);
  const parsedPayout = parseFloat(payout);
  const payoutProfit = !isNaN(parsedPayout) && !isNaN(parsedStake) ? parsedPayout - parsedStake : null;

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
    });
    onAdded();
  }

  const step1Valid = label.trim().length > 0;
  const step2Valid = !isNaN(parsedStake) && parsedStake > 0 && !isNaN(parsedPayout) && parsedPayout > parsedStake;
  const step3Valid = sportsbook.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#080E1A] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-4 border-b border-[#1A2A40]">
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
                ? 'w-6 h-2 bg-emerald-500'
                : n < step
                  ? 'w-2 h-2 bg-emerald-500/50'
                  : 'w-2 h-2 bg-[#1A2A40]'
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

            <div className="space-y-2">
              <input
                type="text"
                placeholder='e.g. "Chiefs to win" or "Patriots -3.5"'
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="input-field text-base"
                autoFocus
              />
              <p className="text-xs text-slate-600 pl-1">Just describe what you need to happen to win your bet</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Sport (optional)</p>
              <div className="grid grid-cols-4 gap-2">
                {SPORTS.slice(0, 8).map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSport(sport === s.key ? '' : s.key)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      sport === s.key
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-[#132035] border-[#1A2A40] text-slate-400'
                    }`}
                  >
                    <span className="text-lg">{s.emoji}</span>
                    <span>{s.name}</span>
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
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center space-y-1">
                  <p className="text-xs text-emerald-400 uppercase tracking-widest font-semibold">If your bet wins</p>
                  <p className="text-3xl font-bold text-emerald-400">
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
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                      : 'bg-[#132035] border-[#1A2A40] text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    sportsbook === book.key ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
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
              <div className="card p-4 space-y-2 border-emerald-500/20 bg-emerald-500/5">
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Your bet summary</p>
                <p className="text-sm text-white font-medium">{label}</p>
                <div className="flex gap-4 text-xs text-slate-400 font-mono">
                  <span>Bet: <span className="text-white">${parsedStake.toFixed(2)}</span></span>
                  <span>Win: <span className="text-emerald-400">+${(parsedPayout - parsedStake).toFixed(2)}</span></span>
                  <span>At: <span className="text-white">{US_SPORTSBOOKS.find(b => b.key === sportsbook)?.name}</span></span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom button */}
      <div className="px-5 pb-safe pb-6 pt-4 border-t border-[#1A2A40] bg-[#080E1A]">
        {step < 3 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 1 ? !step1Valid : !step2Valid}
            className={`w-full py-4 rounded-2xl font-semibold text-base transition-all ${
              (step === 1 ? step1Valid : step2Valid)
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-[#132035] text-slate-600 cursor-not-allowed'
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
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-[#132035] text-slate-600 cursor-not-allowed'
            }`}
          >
            Start monitoring this bet ✓
          </button>
        )}
      </div>
    </div>
  );
}
