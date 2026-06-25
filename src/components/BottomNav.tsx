import type { Tab } from '../App';

const TABS: { key: Tab; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    key: 'odds',
    label: 'Live Odds',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="3" fill={active ? '#10b981' : 'none'} stroke={active ? '#10b981' : 'currentColor'} strokeWidth="1.5" />
        <path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.93 4.93l1.41 1.41M15.66 15.66l1.41 1.41M4.93 17.07l1.41-1.41M15.66 6.34l1.41-1.41"
          stroke={active ? '#10b981' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'calculator',
    label: 'Calculator',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="16" height="16" rx="3" stroke={active ? '#10b981' : 'currentColor'} strokeWidth="1.5" />
        <path d="M7 7h2M13 7h2M7 11h2M13 11h2M7 15h2M13 15h2" stroke={active ? '#10b981' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="3" stroke={active ? '#10b981' : 'currentColor'} strokeWidth="1.5" />
        <path d="M11 2a9 9 0 0 1 2.29.3l.6 1.45a7.3 7.3 0 0 1 1.62.94l1.52-.35A9 9 0 0 1 20 7l-.89 1.34a7.3 7.3 0 0 1 0 1.87L20 11.57a9 9 0 0 1-2.97 2.66l-1.52-.35a7.3 7.3 0 0 1-1.62.94l-.6 1.45A9 9 0 0 1 11 16.5a9 9 0 0 1-2.29-.3l-.6-1.45a7.3 7.3 0 0 1-1.62-.94l-1.52.35A9 9 0 0 1 2 11.57l.89-1.23A7.3 7.3 0 0 1 2.89 8.43L2 7.43a9 9 0 0 1 2.97-2.66l1.52.35a7.3 7.3 0 0 1 1.62-.94l.6-1.45A9 9 0 0 1 11 2z"
          stroke={active ? '#10b981' : 'currentColor'} strokeWidth="1.5" />
      </svg>
    ),
  },
];

export default function BottomNav({
  activeTab,
  onChange,
}: {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D1625]/95 backdrop-blur-sm border-t border-[#1A2A40]">
      <div className="max-w-2xl mx-auto flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                active ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.icon(active)}
              <span className="text-[10px] font-semibold tracking-wide">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
