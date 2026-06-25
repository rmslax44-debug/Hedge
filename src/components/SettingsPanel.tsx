import { useState, useEffect } from 'react';
import { US_SPORTSBOOKS } from '../utils/sportsbooks';
import { getApiKey, setApiKey, getSelectedBooks, setSelectedBooks } from '../utils/storage';

export default function SettingsPanel({ onSave }: { onSave?: () => void }) {
  const [apiKey, setApiKeyState] = useState('');
  const [selectedBooks, setSelectedBooksState] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setApiKeyState(getApiKey());
    setSelectedBooksState(getSelectedBooks());
  }, []);

  function toggleBook(key: string) {
    setSelectedBooksState((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
    setSaved(false);
  }

  function handleSave() {
    setApiKey(apiKey);
    setSelectedBooks(selectedBooks);
    setSaved(true);
    onSave?.();
  }

  const isReady = apiKey.trim().length > 0 && selectedBooks.length > 0;

  return (
    <div className="space-y-6 px-4 pt-2 pb-32">
      {/* API Key */}
      <div className="card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">Odds API Key</h2>
          <p className="text-xs text-slate-500 mt-1">
            Required to fetch live odds. Get a free key (500 requests/month) at{' '}
            <span className="text-emerald-400">the-odds-api.com</span>
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
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-emerald-500 shrink-0">
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
          <h2 className="text-sm font-semibold text-slate-200">Your Sportsbooks</h2>
          <p className="text-xs text-slate-500 mt-1">
            Select the apps you have accounts with. Odds will be compared across these books.
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
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#132035] border-[#1A2A40] text-slate-400 hover:border-slate-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    selected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
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
                  <p className="text-[10px] text-slate-600">{book.shortName}</p>
                </div>
              </button>
            );
          })}
        </div>
        {selectedBooks.length > 0 && (
          <p className="text-xs text-slate-600">
            {selectedBooks.length} book{selectedBooks.length !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!isReady}
        className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all duration-150 ${
          saved
            ? 'bg-emerald-600 text-white'
            : isReady
              ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-[#132035] text-slate-600 cursor-not-allowed'
        }`}
      >
        {saved ? '✓ Settings saved' : isReady ? 'Save & Go to Live Odds' : 'Enter API key and select books to continue'}
      </button>

      {!isReady && (
        <div className="card p-4 border-amber-500/20 bg-amber-500/5 space-y-1">
          <p className="text-xs font-semibold text-amber-400">To get live odds:</p>
          <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
            <li>Sign up at <span className="text-emerald-400">the-odds-api.com</span> — free</li>
            <li>Copy your API key from the dashboard</li>
            <li>Paste it above and select your sportsbooks</li>
          </ol>
        </div>
      )}
    </div>
  );
}
