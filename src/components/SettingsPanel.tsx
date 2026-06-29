import { useState, useEffect } from 'react';
import { US_SPORTSBOOKS, SPORT_GROUPS, SPORTS } from '../utils/sportsbooks';
import {
  getApiKey, setApiKey,
  getSelectedBooks, setSelectedBooks,
  getNotificationsEnabled, setNotificationsEnabled,
  getFavoriteSports, setFavoriteSports,
} from '../utils/storage';
import { requestNotificationPermission, canNotify } from '../utils/hedgeMonitor';

const sportMap = Object.fromEntries(SPORTS.map(s => [s.key, s]));

export default function SettingsPanel({ onSave }: { onSave?: () => void }) {
  const [apiKey, setApiKeyState] = useState('');
  const [selectedBooks, setSelectedBooksState] = useState<string[]>([]);
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [notifStatus, setNotifStatus] = useState<'idle' | 'requesting' | 'denied'>('idle');
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [favSports, setFavSports] = useState<string[]>([]);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    setApiKeyState(getApiKey());
    setSelectedBooksState(getSelectedBooks());
    setNotificationsOn(getNotificationsEnabled());
    setFavSports(getFavoriteSports());
  }, []);

  async function handleNotifToggle() {
    if (notificationsOn) {
      setNotificationsOn(false);
      setNotificationsEnabled(false);
      return;
    }
    if (canNotify()) {
      setNotificationsOn(true);
      setNotificationsEnabled(true);
      return;
    }
    setNotifStatus('requesting');
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationsOn(true);
      setNotificationsEnabled(true);
      setNotifStatus('idle');
    } else {
      setNotifStatus('denied');
    }
  }

  function toggleBook(key: string) {
    setSelectedBooksState((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
    setSaved(false);
  }

  function toggleFavSport(key: string) {
    setFavSports(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      setFavoriteSports(next);
      return next;
    });
  }

  function toggleGroup(label: string) {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function handleSave() {
    setApiKey(apiKey);
    setSelectedBooks(selectedBooks);
    setSaved(true);
    onSave?.();
  }

  const isReady = apiKey.trim().length > 0 && selectedBooks.length > 0;

  return (
    <div className="space-y-5 px-4 pt-2 pb-32">

      {/* Notifications */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-200 font-grotesk">Hedge alerts</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Get notified the moment a guaranteed profit appears
            </p>
          </div>
          <button
            onClick={handleNotifToggle}
            disabled={notifStatus === 'requesting'}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ${
              notificationsOn ? 'bg-purple-500 border-purple-500' : 'bg-[#2D0060] border-[#3D1A6E]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                notificationsOn ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {notifStatus === 'denied' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-xs text-red-400">
              Notifications blocked. Go to your browser settings → site permissions → allow notifications for this site, then try again.
            </p>
          </div>
        )}

        {notificationsOn && (
          <div className="flex items-center gap-2 text-xs text-purple-400">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M4 6l1.5 1.5L8 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            You'll be notified when it's time to place your hedge
          </div>
        )}
      </div>

      {/* API Key */}
      <div className="card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 font-grotesk">Odds API Key</h2>
          <p className="text-xs text-slate-500 mt-1">
            Required to fetch live odds. Get a free key at{' '}
            <span className="text-purple-400">the-odds-api.com</span>
            {' '}(500 requests/month free)
          </p>
        </div>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            placeholder="Paste your API key here"
            value={apiKey}
            onChange={(e) => { setApiKeyState(e.target.value); setSaved(false); }}
            className="input-field pr-20 font-mono text-sm"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            onClick={() => setShowKey((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
        {apiKey && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-purple-500 shrink-0">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M4 6l1.5 1.5L8 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Key stored locally on your device only
          </div>
        )}
      </div>

      {/* Sportsbook selection */}
      <div className="card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 font-grotesk">Your Betting Apps</h2>
          <p className="text-xs text-slate-500 mt-1">
            Select every app you have an account with — the more you pick, the better your chances of finding a guaranteed profit.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {US_SPORTSBOOKS.map((book) => {
            const selected = selectedBooks.includes(book.key);
            return (
              <button
                key={book.key}
                onClick={() => toggleBook(book.key)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150 ${
                  selected
                    ? 'bg-purple-500/12 border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                    : 'bg-[#180032] border-[#3D1A6E] text-slate-400 hover:border-purple-500/30 hover:text-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    selected ? 'border-purple-500 bg-purple-500' : 'border-slate-600'
                  }`}
                >
                  {selected && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{book.name}</p>
                  <p className="text-xs text-slate-500">{book.shortName}</p>
                </div>
              </button>
            );
          })}
        </div>
        {selectedBooks.length > 0 && (
          <p className="text-xs text-slate-500">
            {selectedBooks.length} app{selectedBooks.length !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Favorite Sports */}
      <div className="card p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-200 font-grotesk">Favorite Sports</h2>
            <p className="text-xs text-slate-500 mt-1">
              {favSports.length === 0
                ? "Leave empty — we'll show the best across all leagues"
                : `${favSports.length} sport${favSports.length !== 1 ? 's' : ''} selected · shown first in Find Hedges`}
            </p>
          </div>
          {favSports.length > 0 && (
            <button
              onClick={() => { setFavSports([]); setFavoriteSports([]); }}
              className="text-[10px] text-slate-600 hover:text-red-400 transition-colors shrink-0 mt-0.5"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          {SPORT_GROUPS.map(group => {
            const sports = group.keys.map(k => sportMap[k]).filter(Boolean);
            const selectedCount = group.keys.filter(k => favSports.includes(k)).length;
            const isOpen = openGroups.has(group.label);

            return (
              <div key={group.label} className="rounded-xl border border-[#3D1A6E] overflow-hidden">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors"
                >
                  <span className="text-xs font-semibold text-slate-300">{group.label}</span>
                  <div className="flex items-center gap-2">
                    {selectedCount > 0 && (
                      <span className="text-[10px] font-bold text-purple-400 bg-purple-500/15 px-1.5 py-0.5 rounded-full">
                        {selectedCount}
                      </span>
                    )}
                    <svg
                      width="12" height="12" viewBox="0 0 12 12" fill="none"
                      className={`text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    >
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-3 pb-3 pt-2.5 grid grid-cols-2 gap-1.5 border-t border-[#3D1A6E]/50">
                    {sports.map(s => {
                      const selected = favSports.includes(s.key);
                      return (
                        <button
                          key={s.key}
                          onClick={() => toggleFavSport(s.key)}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left text-xs transition-all duration-150 ${
                            selected
                              ? 'bg-purple-500/12 border-purple-500/50 text-purple-300'
                              : 'bg-[#180032] border-[#2D1A4E] text-slate-400 hover:border-purple-500/30 hover:text-slate-300'
                          }`}
                        >
                          <span className="shrink-0 text-sm leading-none">{s.emoji}</span>
                          <span className="truncate font-medium flex-1">{s.name}</span>
                          {selected && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
                              <path d="M2 5l2.5 2.5L8 3" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!isReady}
        className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all duration-150 ${
          saved
            ? 'bg-purple-600 text-white shadow-[0_0_24px_rgba(168,85,247,0.4)]'
            : isReady
              ? 'bg-purple-500 hover:bg-purple-400 text-white btn-glow'
              : 'bg-[#180032] text-slate-500 cursor-not-allowed'
        }`}
      >
        {saved ? '✓ Settings saved' : isReady ? 'Save Settings' : 'Enter API key and select apps to continue'}
      </button>

      {!isReady && (
        <div className="card p-4 border-[#CCFF00]/40 bg-[#CCFF00]/10 space-y-1 shadow-[0_0_16px_rgba(204,255,0,0.15)]">
          <p className="text-xs font-bold text-[#CCFF00] tracking-wide uppercase flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
            To find live hedge opportunities:
          </p>
          <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
            <li>Go to <span className="text-purple-400">the-odds-api.com</span> — it's free</li>
            <li>Sign up and copy your API key</li>
            <li>Paste it above and pick your betting apps</li>
          </ol>
        </div>
      )}

      <p className="text-center text-[10px] text-slate-700 pt-2 select-none">Hedge v1.3 · Jun 2026</p>
    </div>
  );
}
