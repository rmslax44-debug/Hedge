import { useState } from 'react';
import { SPORTS } from '../utils/sportsbooks';
import SportIcon from './SportIcon';
import { fetchOdds, type OddsEvent } from '../utils/oddsApi';
import { getApiKey, getSelectedBooks, updateBet, type TrackedBet } from '../utils/storage';

interface Props {
  bet: TrackedBet;
  onLinked: () => void;
  onClose: () => void;
}

export default function LinkEventModal({ bet, onLinked, onClose }: Props) {
  const [sport, setSport] = useState(bet.sport || 'americanfootball_nfl');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<OddsEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<OddsEvent | null>(null);
  const [myTeamKey, setMyTeamKey] = useState<'home' | 'away' | null>(null);

  const apiKey = getApiKey();
  const books = getSelectedBooks();

  async function loadEvents() {
    if (!apiKey) { setError('API key required — configure in Settings'); return; }
    setLoading(true);
    setError(null);
    setEvents([]);
    setSelectedEvent(null);
    setMyTeamKey(null);
    try {
      const data = await fetchOdds(sport, apiKey, books.length ? books : ['draftkings']);
      setEvents(data.slice(0, 30));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }

  function handleLink() {
    if (!selectedEvent || !myTeamKey) return;
    const opposingTeam = myTeamKey === 'home' ? selectedEvent.away_team : selectedEvent.home_team;
    const myTeamName = myTeamKey === 'home' ? selectedEvent.home_team : selectedEvent.away_team;
    updateBet(bet.id, {
      eventId: selectedEvent.id,
      sport,
      opposingTeam,
      myTeam: myTeamName,
    });
    onLinked();
  }

  function fmtTime(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch { return iso; }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#0F001E] border border-[#3D1A6E] rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#3D1A6E]">
          <div>
            <p className="text-sm font-bold text-white">Link to Live Game</p>
            <p className="text-xs text-slate-500 truncate max-w-[200px]">{bet.label}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Sport picker */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Sport</p>
            <div className="flex flex-wrap gap-1.5">
              {SPORTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => { setSport(s.key); setEvents([]); setSelectedEvent(null); }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    sport === s.key
                      ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                      : 'bg-[#180032] border-[#3D1A6E] text-slate-400'
                  }`}
                >
                  <SportIcon sportKey={s.key} size={18} />
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={loadEvents}
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold border border-[#3D1A6E] text-slate-300 hover:border-purple-500/40 hover:text-purple-400 transition-all disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Load Upcoming Games'}
          </button>

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          {events.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Select your game</p>
              {events.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => { setSelectedEvent(ev); setMyTeamKey(null); }}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    selectedEvent?.id === ev.id
                      ? 'bg-purple-500/10 border-purple-500/40'
                      : 'bg-[#180032] border-[#3D1A6E] hover:border-slate-600'
                  }`}
                >
                  <p className="text-sm font-semibold text-white">
                    {ev.away_team} @ {ev.home_team}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{fmtTime(ev.commence_time)}</p>
                </button>
              ))}
            </div>
          )}

          {selectedEvent && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Which team did you bet on?</p>
              <div className="grid grid-cols-2 gap-2">
                {(['home', 'away'] as const).map((side) => {
                  const teamName = side === 'home' ? selectedEvent.home_team : selectedEvent.away_team;
                  return (
                    <button
                      key={side}
                      onClick={() => setMyTeamKey(side)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                        myTeamKey === side
                          ? 'bg-purple-500/15 border-purple-500/50 text-purple-300'
                          : 'bg-[#180032] border-[#3D1A6E] text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {teamName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#3D1A6E]">
          <button
            onClick={handleLink}
            disabled={!selectedEvent || !myTeamKey}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
              selectedEvent && myTeamKey
                ? 'bg-purple-500 hover:bg-purple-400 text-white'
                : 'bg-[#180032] text-slate-600 cursor-not-allowed'
            }`}
          >
            Link Game — Enable Auto-Monitoring
          </button>
        </div>
      </div>
    </div>
  );
}
