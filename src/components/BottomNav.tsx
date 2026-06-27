import type { Tab } from '../App';

const ACTIVE = '#A855F7';
const INACTIVE = '#6B7280';

const TABS: {
  key: Tab;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}[] = [
  {
    key: 'bets',
    label: 'My Bets',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="16" height="16" rx="3"
          stroke={a ? ACTIVE : INACTIVE} strokeWidth="1.5" />
        <path d="M7 8h8M7 11h5M7 14h6"
          stroke={a ? ACTIVE : INACTIVE} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'opportunities',
    label: 'Find Hedges',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="10" cy="10" r="6.5"
          stroke={a ? ACTIVE : INACTIVE} strokeWidth="1.5" />
        <path d="M15 15l4 4"
          stroke={a ? ACTIVE : INACTIVE} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 7v3l2 2"
          stroke={a ? ACTIVE : INACTIVE} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'pro',
    label: 'Pro',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 16l5-5 4 4 7-8"
          stroke={a ? ACTIVE : INACTIVE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 19h16"
          stroke={a ? ACTIVE : INACTIVE} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="2.5"
          stroke={a ? ACTIVE : INACTIVE} strokeWidth="1.5" />
        <path d="M11 2.5A8.5 8.5 0 0 1 19.5 11M11 2.5A8.5 8.5 0 0 0 2.5 11M11 19.5A8.5 8.5 0 0 1 2.5 11M11 19.5A8.5 8.5 0 0 0 19.5 11"
          stroke={a ? ACTIVE : INACTIVE} strokeWidth="1.5" strokeDasharray="3 2" />
      </svg>
    ),
  },
];

export default function BottomNav({
  activeTab,
  onChange,
  badge,
}: {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
  badge?: { bets?: number };
}) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t"
      style={{
        background: 'rgba(9, 0, 15, 0.93)',
        borderColor: '#3D1A6E',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="max-w-2xl mx-auto flex">
        {TABS.map((t) => {
          const active = activeTab === t.key;
          const count = t.key === 'bets' ? badge?.bets : undefined;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className="flex-1 flex flex-col items-center gap-1 py-3 relative transition-colors"
              style={{ color: active ? ACTIVE : INACTIVE }}
            >
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: ACTIVE, boxShadow: `0 0 8px ${ACTIVE}` }}
                />
              )}
              <div className="relative">
                {t.icon(active)}
                {count != null && count > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[11px] font-bold text-white flex items-center justify-center"
                    style={{ background: ACTIVE }}
                  >
                    {count}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold tracking-wide">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
