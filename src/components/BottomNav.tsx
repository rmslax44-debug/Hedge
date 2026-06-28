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
      <svg width="30" height="30" viewBox="100 40 180 180" xmlns="http://www.w3.org/2000/svg" style={{ opacity: a ? 1 : 0.42 }}>
        <defs>
          <filter id="bnpro-glow" x="-90%" y="-90%" width="280%" height="280%">
            <feGaussianBlur stdDeviation="6" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="bnpro-white-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="bnpro-bloom" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="6" result="big"/>
            <feGaussianBlur stdDeviation="2" result="small"/>
            <feMerge><feMergeNode in="big"/><feMergeNode in="small"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <radialGradient id="bnpro-bg" cx="50%" cy="34%" r="82%">
            <stop offset="0%" stopColor="#2C0061"/>
            <stop offset="100%" stopColor="#0B0016"/>
          </radialGradient>
          <linearGradient id="bnpro-metal" x1="0" y1="40" x2="0" y2="220" gradientUnits="userSpaceOnUse">
            <stop offset="0%"  stopColor="#FFFFFF" stopOpacity="0.16"/>
            <stop offset="16%" stopColor="#C9A9F2" stopOpacity="0.06"/>
            <stop offset="36%" stopColor="#000000" stopOpacity="0.05"/>
            <stop offset="54%" stopColor="#FFFFFF" stopOpacity="0.08"/>
            <stop offset="72%" stopColor="#000000" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#000000" stopOpacity="0.35"/>
          </linearGradient>
          <linearGradient id="bnpro-rim" x1="0" y1="40" x2="0" y2="78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E9D5FF" stopOpacity="0.38"/>
            <stop offset="100%" stopColor="#E9D5FF" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="bnpro-chrome" x1="0" y1="69" x2="0" y2="177" gradientUnits="userSpaceOnUse">
            <stop offset="0%"  stopColor="#FFFFFF"/>
            <stop offset="14%" stopColor="#E7D6F7"/>
            <stop offset="30%" stopColor="#B79AD8"/>
            <stop offset="46%" stopColor="#F4EBFF"/>
            <stop offset="52%" stopColor="#FFFFFF"/>
            <stop offset="60%" stopColor="#C8B0E6"/>
            <stop offset="78%" stopColor="#9B7CC9"/>
            <stop offset="92%" stopColor="#E3D2F5"/>
            <stop offset="100%" stopColor="#FBF4FF"/>
          </linearGradient>
          <linearGradient id="bnpro-spec" x1="0" y1="69" x2="0" y2="135" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6"/>
            <stop offset="22%" stopColor="#FFFFFF" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
          </linearGradient>
          <mask id="bnpro-edgecut">
            <rect x="100" y="40" width="180" height="180" fill="#fff"/>
            <text x="190" y="130" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="17" fontWeight="700" fill="#000">EDGE</text>
          </mask>
          <mask id="bnpro-hshape">
            <g fill="#fff">
              <rect x="152" y="69" width="20" height="108"/>
              <rect x="208" y="69" width="20" height="108"/>
              <path d="M152 111 L228 111 L240 123 L228 135 L152 135 L140 123 Z"/>
              <path d="M134 69 L172 69 L172 83 L152 83 Z"/>
              <path d="M246 69 L208 69 L208 83 L228 83 Z"/>
              <path d="M134 177 L172 177 L172 163 L152 163 Z"/>
              <path d="M246 177 L208 177 L208 163 L228 163 Z"/>
            </g>
          </mask>
          <clipPath id="bnpro-clip"><rect x="100" y="40" width="180" height="180" rx="44"/></clipPath>
        </defs>

        {/* Badge background */}
        <rect x="100" y="40" width="180" height="180" rx="44" fill="url(#bnpro-bg)"/>
        <g clipPath="url(#bnpro-clip)">
          <rect x="100" y="40" width="180" height="180" fill="url(#bnpro-metal)"/>
          <rect x="100" y="40" width="180" height="38" fill="url(#bnpro-rim)"/>
        </g>

        {/* White outer glow ring */}
        <rect x="97" y="37" width="186" height="186" rx="47" fill="none" stroke="white" strokeWidth="1.5" filter="url(#bnpro-white-glow)" opacity="0.55"/>

        {/* Purple glow border */}
        <rect x="100" y="40" width="180" height="180" rx="44" fill="none" stroke="#A855F7" strokeWidth="2" filter="url(#bnpro-glow)" opacity="0.9"/>
        {/* Inner subtle border */}
        <rect x="109" y="49" width="162" height="162" rx="36" fill="none" stroke="#A855F7" strokeWidth="0.7" opacity="0.35"/>

        {/* H logo */}
        <g mask="url(#bnpro-edgecut)">
          <g fill="url(#bnpro-chrome)">
            <rect x="152" y="69" width="20" height="108"/>
            <rect x="208" y="69" width="20" height="108"/>
            <path d="M152 111 L228 111 L240 123 L228 135 L152 135 L140 123 Z"/>
            <path d="M134 69 L172 69 L172 83 L152 83 Z"/>
            <path d="M246 69 L208 69 L208 83 L228 83 Z"/>
            <path d="M134 177 L172 177 L172 163 L152 163 Z"/>
            <path d="M246 177 L208 177 L208 163 L228 163 Z"/>
          </g>
          <rect x="120" y="69" width="140" height="70" fill="url(#bnpro-spec)" mask="url(#bnpro-hshape)"/>
        </g>

        {/* PRO text */}
        <text x="195" y="200" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="12" fontWeight="500" letterSpacing="6" fill="#E9C9FF" filter="url(#bnpro-bloom)">PRO</text>
      </svg>
    ),
  },
  {
    key: 'futures',
    label: 'Futures',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 3l2.1 5.5H19l-4.6 3.4 1.7 5.4L11 14l-5.1 3.3 1.7-5.4L3 8.5h5.9L11 3z"
          stroke={a ? ACTIVE : INACTIVE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
