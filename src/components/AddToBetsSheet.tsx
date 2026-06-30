import { useState, useEffect } from 'react';
import { getAllBets, addWatchedBet, addLegToParlay, type TrackedBet } from '../utils/storage';

export interface AddToBetsPrefill {
  label: string;
  myTeam: string;
  sport: string;
  sportsbook: string;
  initialOdds?: number;
  initialOpposingOdds?: number;
  isFutures?: boolean;
  futuresMarket?: string;
  isProp?: boolean;
  propMarket?: string;
  propLine?: number;
  eventId?: string;
  opposingTeam?: string;
}

interface Props {
  prefill: AddToBetsPrefill | null;
  onClose: () => void;
}

export default function AddToBetsSheet({ prefill, onClose }: Props) {
  const [parlays, setParlays] = useState<TrackedBet[]>([]);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (prefill) {
      const all = getAllBets();
      setParlays(all.filter((b) => b.isParlay && b.status !== 'settled' && b.status !== 'hedged'));
      setAdded(false);
    }
  }, [prefill]);

  if (!prefill) return null;

  const oddsLabel =
    prefill.initialOdds != null
      ? prefill.initialOdds >= 0
        ? `+${prefill.initialOdds}`
        : `${prefill.initialOdds}`
      : '';

  const bookLabel = prefill.sportsbook
    ? prefill.sportsbook.charAt(0).toUpperCase() + prefill.sportsbook.slice(1)
    : '';

  function finish() {
    setAdded(true);
    setTimeout(onClose, 700);
  }

  function handleSingle() {
    addWatchedBet({
      label: prefill!.label,
      myTeam: prefill!.myTeam,
      sport: prefill!.sport,
      sportsbook: prefill!.sportsbook,
      initialOdds: prefill!.initialOdds,
      initialOpposingOdds: prefill!.initialOpposingOdds,
      isFutures: prefill!.isFutures,
      futuresMarket: prefill!.futuresMarket,
      isProp: prefill!.isProp,
      propMarket: prefill!.propMarket,
      propLine: prefill!.propLine,
      eventId: prefill!.eventId,
      opposingTeam: prefill!.opposingTeam ?? '',
      stake: 0,
      potentialPayout: 0,
      notifyHedge: false,
    });
    finish();
  }

  function handleNewParlay() {
    addWatchedBet({
      label: prefill!.label,
      myTeam: prefill!.myTeam,
      sport: prefill!.sport,
      sportsbook: prefill!.sportsbook,
      initialOdds: prefill!.initialOdds,
      initialOpposingOdds: prefill!.initialOpposingOdds,
      isFutures: prefill!.isFutures,
      futuresMarket: prefill!.futuresMarket,
      isProp: prefill!.isProp,
      propMarket: prefill!.propMarket,
      propLine: prefill!.propLine,
      eventId: prefill!.eventId,
      opposingTeam: prefill!.opposingTeam ?? '',
      isParlay: true,
      legs: [
        {
          id: crypto.randomUUID(),
          label: prefill!.label,
          odds: prefill!.initialOdds,
          sport: prefill!.sport,
          eventId: prefill!.eventId,
          status: 'pending',
        },
      ],
      stake: 0,
      potentialPayout: 0,
      notifyHedge: false,
    });
    finish();
  }

  function handleAddToParlay(betId: string) {
    addLegToParlay(betId, {
      label: prefill!.label,
      odds: prefill!.initialOdds,
      sport: prefill!.sport,
      eventId: prefill!.eventId,
      status: 'pending',
    });
    finish();
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />

      {/* Sheet — sits above the bottom nav bar */}
      <div className="fixed left-0 right-0 z-50 max-w-2xl mx-auto" style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
        <div className="bg-[#0E0020] border border-[#3D1A6E] rounded-2xl px-5 pt-4 pb-6 mx-2 shadow-2xl">
          {/* Handle bar */}
          <div className="w-10 h-1 bg-[#3D1A6E] rounded-full mx-auto mb-4" />

          {added ? (
            <div className="text-center py-8">
              <p className="text-purple-400 font-bold font-mono text-lg">✓ ADDED</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">Check My Bets</p>
            </div>
          ) : (
            <>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">Add to My Bets</p>
              <p className="text-sm font-semibold text-white mb-0.5 truncate">{prefill.label}</p>
              {(bookLabel || oddsLabel) && (
                <p className="text-xs text-slate-500 font-mono mb-4">
                  {bookLabel}
                  {oddsLabel ? ` · ${oddsLabel}` : ''}
                </p>
              )}

              <div className="space-y-2 mt-4">
                <button
                  onClick={handleSingle}
                  className="w-full py-3 px-4 rounded-xl border border-[#3D1A6E] text-sm font-semibold text-slate-300 hover:border-purple-500/40 hover:text-purple-400 transition-colors text-left"
                >
                  Track as Single Bet
                </button>

                <button
                  onClick={handleNewParlay}
                  className="w-full py-3 px-4 rounded-xl border border-[#3D1A6E] text-sm font-semibold text-slate-300 hover:border-purple-500/40 hover:text-purple-400 transition-colors text-left"
                >
                  + Start New Parlay
                </button>

                {parlays.length > 0 && (
                  <>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest pt-2 pb-1">
                      Add to existing parlay
                    </p>
                    {parlays.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleAddToParlay(p.id)}
                        className="w-full py-3 px-4 rounded-xl border border-[#3D1A6E] text-sm font-semibold text-slate-300 hover:border-purple-500/40 hover:text-purple-400 transition-colors text-left flex items-center gap-2"
                      >
                        <span className="text-purple-400 shrink-0">+</span>
                        <span className="flex-1 truncate">{p.label}</span>
                        <span className="text-xs text-slate-500 shrink-0 font-normal">
                          {p.legs?.length ?? 0} leg{(p.legs?.length ?? 0) !== 1 ? 's' : ''}
                        </span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
