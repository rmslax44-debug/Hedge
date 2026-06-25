import { useState, useEffect, useCallback } from 'react';
import {
  fetchOdds,
  findBestOddsForTeam,
  getOddsForTeamAtBook,
  type OddsEvent,
} from '../utils/oddsApi';
import { SPORTS, US_SPORTSBOOKS } from '../utils/sportsbooks';
import {
  getApiKey,
  getSelectedBooks,
  getSelectedSport,
  setSelectedSport,
} from '../utils/storage';
interface HedgePrefill {
  originalLabel: string;
  hedgeLabel: string;
  originalOdds: string;
  hedgeOdds: string;
  hedgeBookName?: string;
}

function formatOdds(price: number): string {
  return price > 0 ? `+${price}` : `${price}`;
}

function formatGameTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffH = diffMs / 3_600_000;

  if (diffH < 0) return 'In progress';
  if (diffH < 1) return `${Math.round(diffH * 60)}m`;
  if (diffH < 24) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ─── Event Detail Modal ──────────────────────────────────────────────────────

function EventDetailModal({
  event,
  userBookKeys,
  onClose,
  onHedge,
}: {
  event: OddsEvent;
  userBookKeys: string[];
  onClose: () => void;
  onHedge: (prefill: HedgePrefill) => void;
}) {
  const [myTeam, setMyTeam] = useState<'home' | 'away'>('home');
  const [myBookKey, setMyBookKey] = useState<string>(userBookKeys[0] ?? '');
  const [myOddsOverride, setMyOddsOverride] = useState<string>('');

  const myTeamName = myTeam === 'home' ? event.home_team : event.away_team;
  const hedgeTeamName = myTeam === 'home' ? event.away_team : event.home_team;

  const myOddsFromBook = getOddsForTeamAtBook(event, myTeamName, myBookKey);
  const myOddsDisplay = myOddsOverride || (myOddsFromBook !== null ? String(myOddsFromBook) : '');

  const bestHedge = findBestOddsForTeam(event, hedgeTeamName, userBookKeys);

  const canHedge = myOddsDisplay !== '' && bestHedge !== null;

  function handleGo() {
    if (!canHedge || !bestHedge) return;
    onHedge({
      originalLabel: `${myTeamName}`,
      hedgeLabel: `${hedgeTeamName}`,
      originalOdds: myOddsDisplay,
      hedgeOdds: String(bestHedge.price),
      hedgeBookName: bestHedge.bookName,
    });
  }

  // Build odds table: all user books × both teams
  const booksWithOdds = userBookKeys
    .map((key) => {
      const bm = event.bookmakers.find((b) => b.key === key);
      const bookInfo = US_SPORTSBOOKS.find((b) => b.key === key);
      const h2h = bm?.markets.find((m) => m.key === 'h2h');
      const homeOdds = h2h?.outcomes.find((o) => o.name === event.home_team)?.price ?? null;
      const awayOdds = h2h?.outcomes.find((o) => o.name === event.away_team)?.price ?? null;
      return { key, name: bookInfo?.shortName ?? key, homeOdds, awayOdds };
    })
    .filter((b) => b.homeOdds !== null || b.awayOdds !== null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-[#0D1625] rounded-t-3xl border-t border-x border-[#1A2A40] p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="w-10 h-1 bg-[#1A2A40] rounded-full mx-auto -mt-2" />

        {/* Matchup */}
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">{event.sport_title}</p>
          <h3 className="text-base font-bold">{event.away_team} @ {event.home_team}</h3>
          <p className="text-xs text-slate-500 mt-1">{formatGameTime(event.commence_time)}</p>
        </div>

        {/* Odds table */}
        {booksWithOdds.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-[#1A2A40]">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="bg-[#132035] text-slate-500">
                  <th className="text-left px-3 py-2 font-medium">Book</th>
                  <th className="text-right px-3 py-2 font-medium truncate max-w-[80px]">{event.away_team.split(' ').pop()}</th>
                  <th className="text-right px-3 py-2 font-medium truncate max-w-[80px]">{event.home_team.split(' ').pop()}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2A40]">
                {booksWithOdds.map((b) => (
                  <tr key={b.key} className="hover:bg-[#132035]/50">
                    <td className="px-3 py-2.5 text-slate-400">{b.name}</td>
                    <td className={`px-3 py-2.5 text-right ${b.awayOdds && b.awayOdds > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {b.awayOdds !== null ? formatOdds(b.awayOdds) : '—'}
                    </td>
                    <td className={`px-3 py-2.5 text-right ${b.homeOdds && b.homeOdds > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {b.homeOdds !== null ? formatOdds(b.homeOdds) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* My bet setup */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Set up your hedge</p>

          {/* Team toggle */}
          <div>
            <p className="text-xs text-slate-500 mb-2">I bet on</p>
            <div className="flex gap-2">
              {(['away', 'home'] as const).map((side) => {
                const name = side === 'home' ? event.home_team : event.away_team;
                return (
                  <button
                    key={side}
                    onClick={() => { setMyTeam(side); setMyOddsOverride(''); }}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      myTeam === side
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                        : 'bg-[#132035] border-[#1A2A40] text-slate-400'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Book picker */}
          <div>
            <p className="text-xs text-slate-500 mb-2">At which book</p>
            <div className="flex flex-wrap gap-2">
              {userBookKeys.map((key) => {
                const info = US_SPORTSBOOKS.find((b) => b.key === key);
                return (
                  <button
                    key={key}
                    onClick={() => { setMyBookKey(key); setMyOddsOverride(''); }}
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-all ${
                      myBookKey === key
                        ? 'bg-blue-500/15 border-blue-500/50 text-blue-300'
                        : 'bg-[#132035] border-[#1A2A40] text-slate-400'
                    }`}
                  >
                    {info?.shortName ?? key}
                  </button>
                );
              })}
            </div>
          </div>

          {/* My odds (editable, pre-filled from selected book) */}
          <div>
            <p className="text-xs text-slate-500 mb-2">
              My odds{myOddsFromBook !== null && !myOddsOverride ? ` (from ${US_SPORTSBOOKS.find(b => b.key === myBookKey)?.name})` : ' (edit if different)'}
            </p>
            <input
              type="text"
              value={myOddsDisplay}
              onChange={(e) => setMyOddsOverride(e.target.value)}
              placeholder="e.g. +150 or -110"
              className="input-field text-sm"
            />
          </div>
        </div>

        {/* Hedge recommendation */}
        {bestHedge && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-1">
            <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wide">Best available hedge</p>
            <p className="text-sm text-white">
              Bet <span className="font-bold">{hedgeTeamName}</span> at{' '}
              <span className="font-bold font-mono text-emerald-400">{formatOdds(bestHedge.price)}</span>
            </p>
            <p className="text-xs text-slate-400">via {bestHedge.bookName}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl border border-[#1A2A40] text-slate-400 text-sm font-medium hover:border-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGo}
            disabled={!canHedge}
            className={`flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all ${
              canHedge
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-[#132035] text-slate-600 cursor-not-allowed'
            }`}
          >
            Calculate hedge →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Game Card ───────────────────────────────────────────────────────────────

function GameCard({
  event,
  userBookKeys,
  onClick,
}: {
  event: OddsEvent;
  userBookKeys: string[];
  onClick: () => void;
}) {
  // Best odds for each team across user's books
  const bestHome = findBestOddsForTeam(event, event.home_team, userBookKeys);
  const bestAway = findBestOddsForTeam(event, event.away_team, userBookKeys);

  return (
    <button
      onClick={onClick}
      className="card w-full p-4 text-left hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-150 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">
            {formatGameTime(event.commence_time)}
          </p>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white truncate">{event.away_team}</p>
            <p className="text-xs text-slate-500">@</p>
            <p className="text-sm font-semibold text-white truncate">{event.home_team}</p>
          </div>
        </div>

        <div className="text-right space-y-2 shrink-0">
          <p className="text-[10px] text-slate-600 uppercase tracking-wide">Best odds</p>
          <div className="space-y-1">
            <p className={`text-sm font-mono font-semibold ${bestAway && bestAway.price > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
              {bestAway ? formatOdds(bestAway.price) : '—'}
            </p>
            <div className="h-px" />
            <p className={`text-sm font-mono font-semibold ${bestHome && bestHome.price > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
              {bestHome ? formatOdds(bestHome.price) : '—'}
            </p>
          </div>
          <p className="text-[10px] text-emerald-500">Tap to hedge →</p>
        </div>
      </div>
    </button>
  );
}

// ─── OddsBrowser ─────────────────────────────────────────────────────────────

export default function OddsBrowser({ onHedge }: { onHedge: (prefill: HedgePrefill) => void }) {
  const [sport, setSport] = useState(getSelectedSport);
  const [events, setEvents] = useState<OddsEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<OddsEvent | null>(null);

  const apiKey = getApiKey();
  const userBookKeys = getSelectedBooks();
  const isConfigured = apiKey.length > 0 && userBookKeys.length > 0;

  const load = useCallback(async () => {
    if (!isConfigured) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOdds(sport, apiKey, userBookKeys);
      setEvents(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load odds');
    } finally {
      setLoading(false);
    }
  }, [sport, apiKey, userBookKeys, isConfigured]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSportChange(key: string) {
    setSport(key);
    setSelectedSport(key);
  }

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#132035] flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-slate-500">
            <circle cx="14" cy="14" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M14 3v2M14 23v2M3 14h2M23 14h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <p className="text-slate-300 font-semibold">Set up live odds</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Add your free Odds API key and select your sportsbooks in Settings to see real-time odds here.
          </p>
        </div>
        <div className="text-xs text-emerald-400 font-medium">↓ Tap Settings below</div>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Sport tabs */}
      <div className="overflow-x-auto px-4 pt-3 pb-1">
        <div className="flex gap-2 min-w-max">
          {SPORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => handleSportChange(s.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                sport === s.key
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-[#132035] border-[#1A2A40] text-slate-400 hover:border-slate-600'
              }`}
            >
              <span>{s.emoji}</span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Book filters (display only) */}
      <div className="px-4 py-2">
        <div className="flex flex-wrap gap-1.5">
          {userBookKeys.map((key) => {
            const info = US_SPORTSBOOKS.find((b) => b.key === key);
            return (
              <span key={key} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#132035] text-slate-500 border border-[#1A2A40]">
                {info?.shortName ?? key}
              </span>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-2 space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        )}

        {error && (
          <div className="card p-4 border-red-500/30 bg-red-500/5 space-y-2">
            <p className="text-sm text-red-400 font-medium">{error}</p>
            <button
              onClick={load}
              className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="card p-8 text-center space-y-2">
            <p className="text-slate-400 text-sm">No upcoming games right now</p>
            <p className="text-slate-600 text-xs">Try a different sport or check back later</p>
            <button onClick={load} className="text-xs text-emerald-400 hover:text-emerald-300 mt-2">
              Refresh
            </button>
          </div>
        )}

        {!loading && events.map((event) => (
          <GameCard
            key={event.id}
            event={event}
            userBookKeys={userBookKeys}
            onClick={() => setSelectedEvent(event)}
          />
        ))}

        {!loading && events.length > 0 && (
          <div className="text-center pt-2">
            <button onClick={load} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
              ↺ Refresh odds
            </button>
          </div>
        )}
      </div>

      {/* Event detail modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          userBookKeys={userBookKeys}
          onClose={() => setSelectedEvent(null)}
          onHedge={(prefill) => {
            setSelectedEvent(null);
            onHedge(prefill);
          }}
        />
      )}
    </div>
  );
}
