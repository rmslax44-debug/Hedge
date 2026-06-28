import { useState, useCallback } from 'react';
import { fetchOutrights, type OddsEvent } from '../utils/oddsApi';
import { getApiKey, getSelectedBooks } from '../utils/storage';
import { US_SPORTSBOOKS, FUTURES_SPORTS } from '../utils/sportsbooks';
import { americanToDecimal } from '../utils/arb';
import AddToBetsSheet, { type AddToBetsPrefill } from './AddToBetsSheet';

function fmtOdds(price: number): string {
  return price >= 0 ? `+${price}` : `${price}`;
}

interface TeamEntry {
  name: string;
  bestPrice: number;
  bestBookKey: string;
  bestBookShort: string;
  eventId: string;
}

function extractTeams(events: OddsEvent[], userBooks: string[]): TeamEntry[] {
  const map = new Map<string, TeamEntry>();

  for (const event of events) {
    const allNames = new Set<string>();
    for (const bm of event.bookmakers) {
      if (!userBooks.includes(bm.key)) continue;
      const mkt = bm.markets.find((m) => m.key === 'outrights');
      if (!mkt) continue;
      for (const o of mkt.outcomes) allNames.add(o.name);
    }

    for (const name of allNames) {
      let bestDec = 0;
      let bestPrice = 0;
      let bestBookKey = '';
      let bestBookShort = '';

      for (const bm of event.bookmakers) {
        if (!userBooks.includes(bm.key)) continue;
        const mkt = bm.markets.find((m) => m.key === 'outrights');
        if (!mkt) continue;
        const outcome = mkt.outcomes.find((o) => o.name === name);
        if (!outcome) continue;
        const dec = americanToDecimal(outcome.price);
        if (dec > bestDec) {
          bestDec = dec;
          bestPrice = outcome.price;
          const sb = US_SPORTSBOOKS.find((b) => b.key === bm.key);
          bestBookKey = bm.key;
          bestBookShort = sb?.shortName ?? bm.key;
        }
      }

      if (bestPrice && !map.has(name)) {
        map.set(name, { name, bestPrice, bestBookKey, bestBookShort, eventId: event.id });
      }
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => americanToDecimal(a.bestPrice) - americanToDecimal(b.bestPrice),
  );
}

export default function FuturesTab() {
  const [selectedSport, setSelectedSport] = useState(FUTURES_SPORTS[0]);
  const [events, setEvents] = useState<OddsEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sheetPrefill, setSheetPrefill] = useState<AddToBetsPrefill | null>(null);

  const apiKey = getApiKey();
  const userBooks = getSelectedBooks();
  const noSetup = !apiKey || !userBooks.length;

  const load = useCallback(async () => {
    if (noSetup) return;
    setLoading(true);
    setError(null);
    setEvents([]);
    try {
      const data = await fetchOutrights(selectedSport.key, apiKey, userBooks);
      setEvents(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [selectedSport.key, apiKey, userBooks.join(','), noSetup]);

  const teams = extractTeams(events, userBooks);
  const filtered = search
    ? teams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : teams;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-12 pb-3 border-b border-[#1E0840]">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Outrights</p>
        <h1 className="text-xl font-bold text-white font-grotesk mb-3">Futures</h1>

        {/* Sport pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FUTURES_SPORTS.map((fs) => (
            <button
              key={fs.key}
              onClick={() => {
                setSelectedSport(fs);
                setEvents([]);
                setError(null);
                setSearch('');
              }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-mono font-bold border transition-colors ${
                selectedSport.key === fs.key
                  ? 'border-purple-500/50 text-purple-400 bg-purple-500/10'
                  : 'border-[#3D1A6E] text-slate-500 hover:border-purple-500/30 hover:text-slate-300'
              }`}
            >
              {fs.emoji} {fs.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-3 pb-32 space-y-3">
        {/* Title row + load button */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white font-grotesk">{selectedSport.label}</p>
            {teams.length > 0 && (
              <p className="text-xs text-slate-500 font-mono">{teams.length} outcomes</p>
            )}
          </div>
          <button
            onClick={load}
            disabled={loading || noSetup}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-colors ${
              loading
                ? 'border-purple-500/20 text-purple-400'
                : noSetup
                ? 'border-[#3D1A6E] text-slate-500 cursor-not-allowed'
                : 'border-[#3D1A6E] text-slate-300 hover:border-purple-500/30 hover:text-purple-400'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border border-purple-500 border-t-transparent rounded-full animate-spin" />
                LOAD
              </span>
            ) : (
              'LOAD'
            )}
          </button>
        </div>

        {noSetup && (
          <div className="card p-4 border-[#CCFF00]/40 bg-[#CCFF00]/10 shadow-[0_0_16px_rgba(204,255,0,0.15)]">
            <p className="text-xs font-bold font-mono text-[#CCFF00] tracking-wide uppercase flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse shrink-0" />
              API KEY + BOOKS REQUIRED — configure in Settings
            </p>
          </div>
        )}

        {error && (
          <div className="card p-3 border-red-500/20 bg-red-500/5">
            <p className="text-xs font-mono text-red-400">{error}</p>
          </div>
        )}

        {/* Search bar */}
        {teams.length > 0 && (
          <input
            type="text"
            placeholder="Search team or player..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full input-field text-sm font-mono"
          />
        )}

        {/* Outcome cards */}
        {filtered.map((team, i) => {
          const dec = americanToDecimal(team.bestPrice);
          const impliedPct = ((1 / dec) * 100).toFixed(1);
          const rank = i + 1;
          const isTopThree = rank <= 3;

          return (
            <div key={team.name} className="card px-4 py-3 flex items-center gap-3">
              {/* Rank badge */}
              <div
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                  isTopThree
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-[#180032] text-slate-500'
                }`}
              >
                {rank}
              </div>

              {/* Team info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{team.name}</p>
                <p className="text-xs font-mono text-slate-500">
                  {impliedPct}% implied · {team.bestBookShort}
                </p>
              </div>

              {/* Odds + add */}
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-sm font-bold font-mono ${
                    dec < 5.0 ? 'text-amber-400' : 'text-purple-400'
                  }`}
                >
                  {fmtOdds(team.bestPrice)}
                </span>
                <button
                  onClick={() =>
                    setSheetPrefill({
                      label: `${team.name} — ${selectedSport.label}`,
                      myTeam: team.name,
                      sport: selectedSport.gameKey,
                      sportsbook: team.bestBookKey,
                      initialOdds: team.bestPrice,
                      isFutures: true,
                      futuresMarket: selectedSport.label,
                      eventId: team.eventId,
                      opposingTeam: '',
                    })
                  }
                  className="w-7 h-7 rounded-lg border border-[#3D1A6E] text-slate-500 hover:border-purple-500/40 hover:text-purple-400 transition-colors flex items-center justify-center text-sm font-bold"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && teams.length > 0 && (
          <div className="card p-4 text-center">
            <p className="text-xs text-slate-500 font-mono">No results for "{search}"</p>
          </div>
        )}

        {!loading && !error && events.length === 0 && !noSetup && (
          <div className="card p-6 text-center">
            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">
              Select a league and hit LOAD
            </p>
          </div>
        )}
      </div>

      <AddToBetsSheet prefill={sheetPrefill} onClose={() => setSheetPrefill(null)} />
    </div>
  );
}
