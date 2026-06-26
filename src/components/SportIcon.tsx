interface Props {
  sportKey: string;
  size?: number;
}

// Shield path for soccer leagues — reusable
const SHIELD = 'M12 2 L21 5.5 L21 13.5 Q21 19.5 12 23 Q3 19.5 3 13.5 L3 5.5 Z';

export default function SportIcon({ sportKey, size = 36 }: Props) {
  const s = size;
  const viewBox = '0 0 24 24';

  // ── American sports ───────────────────────────────────────────────────────────

  if (sportKey === 'americanfootball_nfl') return (
    <svg width={s} height={s} viewBox={viewBox} fill="none">
      <ellipse cx="12" cy="12" rx="9" ry="6.5" fill="#8B4513" stroke="#5C2A00" strokeWidth="1"/>
      <line x1="12" y1="5.5" x2="12" y2="18.5" stroke="white" strokeWidth="1.2"/>
      <line x1="8.5" y1="9.5" x2="15.5" y2="9.5" stroke="white" strokeWidth="0.9"/>
      <line x1="8.5" y1="12" x2="15.5" y2="12" stroke="white" strokeWidth="0.9"/>
      <line x1="8.5" y1="14.5" x2="15.5" y2="14.5" stroke="white" strokeWidth="0.9"/>
    </svg>
  );

  if (sportKey === 'americanfootball_ncaaf') return (
    <svg width={s} height={s} viewBox={viewBox} fill="none">
      <ellipse cx="12" cy="12" rx="9" ry="6.5" fill="#1A4A00" stroke="#0A2A00" strokeWidth="1"/>
      <line x1="12" y1="5.5" x2="12" y2="18.5" stroke="#FFD700" strokeWidth="1.2"/>
      <line x1="8.5" y1="9.5" x2="15.5" y2="9.5" stroke="#FFD700" strokeWidth="0.9"/>
      <line x1="8.5" y1="12" x2="15.5" y2="12" stroke="#FFD700" strokeWidth="0.9"/>
      <line x1="8.5" y1="14.5" x2="15.5" y2="14.5" stroke="#FFD700" strokeWidth="0.9"/>
    </svg>
  );

  if (sportKey === 'basketball_nba') return (
    <svg width={s} height={s} viewBox={viewBox} fill="none">
      <circle cx="12" cy="12" r="10" fill="#C85E00" stroke="#8B3E00" strokeWidth="1"/>
      <path d="M2.5 12 Q6 7 12 12 Q18 7 21.5 12" stroke="#5C2000" strokeWidth="1.2" fill="none"/>
      <path d="M2.5 12 Q6 17 12 12 Q18 17 21.5 12" stroke="#5C2000" strokeWidth="1.2" fill="none"/>
      <line x1="12" y1="2" x2="12" y2="22" stroke="#5C2000" strokeWidth="1.2"/>
    </svg>
  );

  if (sportKey === 'basketball_ncaab') return (
    <svg width={s} height={s} viewBox={viewBox} fill="none">
      <circle cx="12" cy="12" r="10" fill="#C41E3A" stroke="#8B0000" strokeWidth="1"/>
      <path d="M2.5 12 Q6 7 12 12 Q18 7 21.5 12" stroke="#7B0000" strokeWidth="1.2" fill="none"/>
      <path d="M2.5 12 Q6 17 12 12 Q18 17 21.5 12" stroke="#7B0000" strokeWidth="1.2" fill="none"/>
      <line x1="12" y1="2" x2="12" y2="22" stroke="#7B0000" strokeWidth="1.2"/>
    </svg>
  );

  if (sportKey === 'baseball_mlb') return (
    <svg width={s} height={s} viewBox={viewBox} fill="none">
      <circle cx="12" cy="12" r="10" fill="#F5F5F5" stroke="#DDD" strokeWidth="1"/>
      <path d="M5 7 Q8.5 5.5 10.5 10" stroke="#CC0000" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M19 7 Q15.5 5.5 13.5 10" stroke="#CC0000" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M5 17 Q8.5 18.5 10.5 14" stroke="#CC0000" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M19 17 Q15.5 18.5 13.5 14" stroke="#CC0000" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
    </svg>
  );

  if (sportKey === 'icehockey_nhl') return (
    <svg width={s} height={s} viewBox={viewBox} fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" fill="#001F5B" stroke="#003087" strokeWidth="1"/>
      <ellipse cx="12" cy="16" rx="6.5" ry="3" fill="#222" stroke="#555" strokeWidth="0.8"/>
      <path d="M6 15 L6 8 Q6 6 8 6 L10 6 L10 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M10 10 L15 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );

  if (sportKey === 'soccer_usa_mls') return (
    <svg width={s} height={s} viewBox={viewBox} fill="none">
      <circle cx="12" cy="12" r="10" fill="#012169" stroke="#BF0A30" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="3.5" fill="white"/>
      <path d="M12 2 L12 8.5M12 15.5 L12 22" stroke="white" strokeWidth="1"/>
      <path d="M2 12 L8.5 12M15.5 12 L22 12" stroke="white" strokeWidth="1"/>
    </svg>
  );

  // ── European Soccer ────────────────────────────────────────────────────────────

  if (sportKey === 'soccer_epl') return (
    <svg width={s} height={s} viewBox={viewBox} fill="none">
      {/* EPL Purple shield */}
      <path d={SHIELD} fill="#37003C"/>
      <path d={SHIELD} stroke="#00FF85" strokeWidth="1.2" fill="none"/>
      {/* Simplified lion */}
      <circle cx="12" cy="9" r="3" fill="#00FF85" opacity="0.9"/>
      <path d="M9 9 Q9 7 12 7 Q15 7 15 9 Q15 11.5 12 13 Q9 11.5 9 9 Z" fill="#00FF85"/>
      <path d="M10 13 Q12 15.5 14 13" stroke="#37003C" strokeWidth="0.8" fill="none"/>
      {/* Crown */}
      <path d="M9.5 7 L10 5 L12 6.5 L14 5 L14.5 7" stroke="#00FF85" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  if (sportKey === 'soccer_uefa_champs_league') return (
    <svg width={s} height={s} viewBox={viewBox} fill="none">
      <circle cx="12" cy="12" r="10.5" fill="#001C58"/>
      <circle cx="12" cy="12" r="10.5" stroke="#C5A028" strokeWidth="1"/>
      {/* Star ring */}
      {[0,45,90,135,180,225,270,315].map((deg, i) => {
        const r = 7;
        const rad = (deg - 90) * Math.PI / 180;
        const x = 12 + r * Math.cos(rad);
        const y = 12 + r * Math.sin(rad);
        return <circle key={i} cx={x} cy={y} r="1.1" fill="#C5A028"/>;
      })}
      {/* Ball in center */}
      <circle cx="12" cy="12" r="3" fill="#C5A028"/>
      <path d="M9.5 12 Q12 10 14.5 12 Q12 14 9.5 12" fill="#001C58"/>
    </svg>
  );

  if (sportKey === 'soccer_spain_la_liga') return (
    <svg width={s} height={s} viewBox={viewBox} fill="none">
      <path d={SHIELD} fill="#FF4500"/>
      {/* Spanish flag stripes */}
      <path d="M3 9 L21 9 L21 6 Q21 4 19 3.5 L12 2 L5 3.5 Q3 4 3 6 Z" fill="#C60B1E"/>
      <path d="M3 9 L21 9 L21 15 L3 15 Z" fill="#F1BF00"/>
      <path d="M3 15 L21 15 L21 13.5 Q21 19.5 12 23 Q3 19.5 3 13.5 Z" fill="#C60B1E"/>
      {/* LaLiga text */}
      <text x="12" y="13.5" textAnchor="middle" fontSize="4.5" fill="white" fontFamily="sans-serif" fontWeight="bold">LaLiga</text>
    </svg>
  );

  if (sportKey === 'soccer_germany_bundesliga') return (
    <svg width={s} height={s} viewBox={viewBox} fill="none">
      <path d={SHIELD} fill="#D00"/>
      <path d="M3 5.5 L21 5.5 L21 9 L3 9 Z" fill="#111"/>
      <path d="M3 15 L21 15 L21 13.5 Q21 19.5 12 23 Q3 19.5 3 13.5 Z" fill="#FFD700"/>
      {/* Eagle silhouette (simplified) */}
      <path d="M12 7 L8 10 L10 10 L9 14 L12 12 L15 14 L14 10 L16 10 Z" fill="#FFD700"/>
    </svg>
  );

  if (sportKey === 'soccer_italy_serie_a') return (
    <svg width={s} height={s} viewBox={viewBox} fill="none">
      <path d={SHIELD} fill="#003DA5"/>
      {/* Italian tricolor stripes */}
      <path d="M3 5.5 L9 5.5 L9 23 Q3 19.5 3 13.5 Z" fill="#009246" clipPath="url(#sh)"/>
      <path d="M15 5.5 L21 5.5 L21 13.5 Q21 19.5 15 22.5 Z" fill="#CE2B37" clipPath="url(#sh)"/>
      <defs>
        <clipPath id="sh">
          <path d={SHIELD}/>
        </clipPath>
      </defs>
      <path d={SHIELD} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
      {/* Star */}
      <path d="M12 5 L12.7 7.2 L15 7.2 L13.2 8.5 L13.9 10.7 L12 9.4 L10.1 10.7 L10.8 8.5 L9 7.2 L11.3 7.2 Z" fill="#FFD700"/>
    </svg>
  );

  if (sportKey === 'soccer_france_ligue_one') return (
    <svg width={s} height={s} viewBox={viewBox} fill="none">
      <path d={SHIELD} fill="#002395"/>
      {/* French flag stripes clipped to shield */}
      <defs>
        <clipPath id="sh-fr">
          <path d={SHIELD}/>
        </clipPath>
      </defs>
      <rect x="3" y="2" width="6" height="21" fill="#002395" clipPath="url(#sh-fr)"/>
      <rect x="9" y="2" width="6" height="21" fill="white" clipPath="url(#sh-fr)"/>
      <rect x="15" y="2" width="6" height="21" fill="#ED2939" clipPath="url(#sh-fr)"/>
      <path d={SHIELD} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
      {/* Rooster head simplified */}
      <ellipse cx="12" cy="13" rx="3" ry="3.5" fill="#ED2939" clipPath="url(#sh-fr)"/>
      <path d="M12 9.5 L11 10 L13 10 Z" fill="#FFD700" clipPath="url(#sh-fr)"/>
    </svg>
  );

  if (sportKey === 'soccer_uefa_europa_league') return (
    <svg width={s} height={s} viewBox={viewBox} fill="none">
      <circle cx="12" cy="12" r="10.5" fill="#FF6900"/>
      <circle cx="12" cy="12" r="10.5" stroke="#FFB347" strokeWidth="0.8"/>
      {/* UEL hexagonal design */}
      <path d="M12 4 L19 8 L19 16 L12 20 L5 16 L5 8 Z" fill="none" stroke="white" strokeWidth="1.2"/>
      <circle cx="12" cy="12" r="3.5" fill="white"/>
      <text x="12" y="14" textAnchor="middle" fontSize="4" fill="#FF6900" fontFamily="sans-serif" fontWeight="bold">UEL</text>
    </svg>
  );

  if (sportKey === 'soccer_netherlands_eredivisie') return (
    <svg width={s} height={s} viewBox={viewBox} fill="none">
      <path d={SHIELD} fill="#AE1C28"/>
      <defs>
        <clipPath id="sh-nl">
          <path d={SHIELD}/>
        </clipPath>
      </defs>
      <rect x="3" y="2" width="18" height="7" fill="#AE1C28" clipPath="url(#sh-nl)"/>
      <rect x="3" y="9" width="18" height="7" fill="white" clipPath="url(#sh-nl)"/>
      <rect x="3" y="16" width="18" height="7" fill="#21468B" clipPath="url(#sh-nl)"/>
      <path d={SHIELD} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
      {/* Lion */}
      <text x="12" y="15" textAnchor="middle" fontSize="10" fill="#FFD700" fontFamily="serif" clipPath="url(#sh-nl)" opacity="0.9">♛</text>
    </svg>
  );

  if (sportKey === 'soccer_portugal_primeira_liga') return (
    <svg width={s} height={s} viewBox={viewBox} fill="none">
      <path d={SHIELD} fill="#006600"/>
      <defs>
        <clipPath id="sh-pt">
          <path d={SHIELD}/>
        </clipPath>
      </defs>
      <rect x="3" y="2" width="7.5" height="21" fill="#006600" clipPath="url(#sh-pt)"/>
      <rect x="10.5" y="2" width="10.5" height="21" fill="#FF0000" clipPath="url(#sh-pt)"/>
      <path d={SHIELD} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
      {/* Portugal shield within */}
      <rect x="9.5" y="8" width="5" height="5" fill="white" rx="0.5" clipPath="url(#sh-pt)"/>
      <circle cx="12" cy="10.5" r="1.5" fill="#0066FF" clipPath="url(#sh-pt)"/>
    </svg>
  );

  if (sportKey === 'soccer_england_efl_champ') return (
    <svg width={s} height={s} viewBox={viewBox} fill="none">
      <path d={SHIELD} fill="#FFD700"/>
      <path d={SHIELD} stroke="#1C1C1C" strokeWidth="1.5" fill="none"/>
      {/* Championship badge */}
      <path d="M7 8 L12 5 L17 8 L17 14 L12 17 L7 14 Z" fill="#1C1C1C"/>
      <text x="12" y="13.5" textAnchor="middle" fontSize="4" fill="#FFD700" fontFamily="sans-serif" fontWeight="bold">EFL</text>
    </svg>
  );

  // ── Combat sports ─────────────────────────────────────────────────────────────

  if (sportKey === 'boxing_boxing') return (
    <svg width={s} height={s} viewBox={viewBox} fill="none">
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#1A0000"/>
      <text x="12" y="17" textAnchor="middle" fontSize="14" fill="none">🥊</text>
      {/* Boxing glove shape */}
      <path d="M7 17 Q7 10 10 9 Q12 8.5 13 9 L14 9 Q16 9.5 16 12 L16 17 Q16 18.5 14 19 L9 19 Q7 18.5 7 17 Z" fill="#CC0000"/>
      <path d="M10 9 L10 13" stroke="#AA0000" strokeWidth="1"/>
      <path d="M7 14 L16 14" stroke="#AA0000" strokeWidth="0.8"/>
      <path d="M7 17 Q7 18.5 9 19 L14 19 Q16 18.5 16 17" stroke="#FF3333" strokeWidth="0.8" fill="none"/>
      {/* Wrist */}
      <rect x="9" y="19" width="6" height="2.5" rx="1" fill="#CC0000"/>
      <rect x="9" y="19" width="6" height="1" fill="#FFEECC"/>
    </svg>
  );

  if (sportKey === 'mma_mixed_martial_arts') return (
    <svg width={s} height={s} viewBox={viewBox} fill="none">
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#1A0A00"/>
      {/* Octagon */}
      <path d="M8 3.5 L16 3.5 L21.5 9 L21.5 15 L16 20.5 L8 20.5 L2.5 15 L2.5 9 Z" fill="none" stroke="#FF4400" strokeWidth="1.5"/>
      <path d="M9 6 L15 6 L18.5 9.5 L18.5 14.5 L15 18 L9 18 L5.5 14.5 L5.5 9.5 Z" fill="#FF4400" opacity="0.2"/>
      <text x="12" y="14.5" textAnchor="middle" fontSize="6.5" fill="#FF4400" fontFamily="sans-serif" fontWeight="900">MMA</text>
    </svg>
  );

  // ── Other sports ──────────────────────────────────────────────────────────────

  if (sportKey === 'golf_pga_tour') return (
    <svg width={s} height={s} viewBox={viewBox} fill="none">
      <circle cx="12" cy="18" r="3.5" fill="white" stroke="#DDD" strokeWidth="0.8"/>
      <circle cx="10" cy="17" r="0.6" fill="#CCC"/>
      <circle cx="12" cy="16.5" r="0.6" fill="#CCC"/>
      <circle cx="14" cy="17" r="0.6" fill="#CCC"/>
      <circle cx="11" cy="19" r="0.6" fill="#CCC"/>
      <circle cx="13" cy="19" r="0.6" fill="#CCC"/>
      <line x1="12" y1="3" x2="12" y2="14.5" stroke="#5C4A00" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 3 L16 6 L12 9" fill="#2D7A00"/>
    </svg>
  );

  if (sportKey === 'tennis_atp') return (
    <svg width={s} height={s} viewBox={viewBox} fill="none">
      {/* Racket head */}
      <ellipse cx="10" cy="10" rx="7" ry="8.5" fill="none" stroke="#555" strokeWidth="1.5"/>
      <ellipse cx="10" cy="10" rx="7" ry="8.5" fill="#222"/>
      {/* Ball */}
      <circle cx="10" cy="10" r="4" fill="#CFE03A"/>
      <path d="M6.5 8 Q10 6 13.5 8" stroke="white" strokeWidth="0.8" fill="none"/>
      <path d="M6.5 12 Q10 14 13.5 12" stroke="white" strokeWidth="0.8" fill="none"/>
      {/* Handle */}
      <line x1="16" y1="17" x2="21" y2="22" stroke="#8B5A2B" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );

  // Default: circular badge with sport abbreviation
  const abbr = sportKey.split('_').pop()?.slice(0, 3).toUpperCase() ?? '?';
  return (
    <svg width={s} height={s} viewBox={viewBox} fill="none">
      <circle cx="12" cy="12" r="10" fill="#3D1A6E" stroke="#6D28D9" strokeWidth="1"/>
      <text x="12" y="16" textAnchor="middle" fontSize="7" fill="white" fontFamily="sans-serif" fontWeight="bold">{abbr}</text>
    </svg>
  );
}
