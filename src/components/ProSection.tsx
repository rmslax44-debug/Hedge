import { useState, useCallback, useEffect } from 'react';
import ProDashboard from './ProDashboard';
import ProCalculator, { type CalcPrefill, type OddsFormat } from './ProCalculator';
import ProMarkets from './ProMarkets';
import { getApiKey, getSelectedBooks } from '../utils/storage';

type SubTab = 'radar' | 'calc' | 'lines';

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: 'radar', label: 'RADAR' },
  { key: 'calc',  label: 'CALC'  },
  { key: 'lines', label: 'LINES' },
];

interface ProSectionProps {
  onSwitchToMyBets?: () => void;
  scanTrigger?: number;
  externalCalcPrefill?: CalcPrefill | null;
  externalCalcTrigger?: number;
}

export default function ProSection({ onSwitchToMyBets, scanTrigger, externalCalcPrefill, externalCalcTrigger }: ProSectionProps) {
  const [subTab, setSubTab] = useState<SubTab>('radar');
  const [calcPrefill, setCalcPrefill] = useState<CalcPrefill | null>(null);
  const [fmt, setFmt] = useState<OddsFormat>('american');

  const noSetup = !getApiKey() || !getSelectedBooks().length;

  const openCalc = useCallback((prefill: CalcPrefill) => {
    setCalcPrefill(prefill);
    setSubTab('calc');
  }, []);

  const clearPrefill = useCallback(() => setCalcPrefill(null), []);

  // When triggered from My Bets notification, switch to RADAR sub-tab
  useEffect(() => {
    if (scanTrigger && scanTrigger > 0) setSubTab('radar');
  }, [scanTrigger]);

  // When triggered from another tab's "send to calculator" button, load the prefill and switch to CALC
  useEffect(() => {
    if (externalCalcTrigger && externalCalcTrigger > 0) {
      setCalcPrefill(externalCalcPrefill ?? null);
      setSubTab('calc');
    }
  }, [externalCalcTrigger]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-14 border-b border-[#3D1A6E]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* H·PRO logo */}
            <svg width="64" height="64" viewBox="100 40 180 180" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="hpro-glow" x="-90%" y="-90%" width="280%" height="280%">
                  <feGaussianBlur stdDeviation="6" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="hpro-white-glow" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="5" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="hpro-bloom" x="-150%" y="-150%" width="400%" height="400%">
                  <feGaussianBlur stdDeviation="6" result="big"/>
                  <feGaussianBlur stdDeviation="2" result="small"/>
                  <feMerge><feMergeNode in="big"/><feMergeNode in="small"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <radialGradient id="hpro-bg" cx="50%" cy="34%" r="82%">
                  <stop offset="0%" stopColor="#2C0061"/>
                  <stop offset="100%" stopColor="#0B0016"/>
                </radialGradient>
                <linearGradient id="hpro-metal" x1="0" y1="40" x2="0" y2="220" gradientUnits="userSpaceOnUse">
                  <stop offset="0%"  stopColor="#FFFFFF" stopOpacity="0.16"/>
                  <stop offset="16%" stopColor="#C9A9F2" stopOpacity="0.06"/>
                  <stop offset="36%" stopColor="#000000" stopOpacity="0.05"/>
                  <stop offset="54%" stopColor="#FFFFFF" stopOpacity="0.08"/>
                  <stop offset="72%" stopColor="#000000" stopOpacity="0.18"/>
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.35"/>
                </linearGradient>
                <linearGradient id="hpro-rim" x1="0" y1="40" x2="0" y2="78" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#E9D5FF" stopOpacity="0.38"/>
                  <stop offset="100%" stopColor="#E9D5FF" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="hpro-chrome" x1="0" y1="69" x2="0" y2="177" gradientUnits="userSpaceOnUse">
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
                <linearGradient id="hpro-spec" x1="0" y1="69" x2="0" y2="135" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6"/>
                  <stop offset="22%" stopColor="#FFFFFF" stopOpacity="0.18"/>
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
                </linearGradient>
                <mask id="hpro-edgecut">
                  <rect x="100" y="40" width="180" height="180" fill="#fff"/>
                  <text x="190" y="130" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="17" fontWeight="700" fill="#000">EDGE</text>
                </mask>
                <mask id="hpro-hshape">
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
                <clipPath id="hpro-clip"><rect x="100" y="40" width="180" height="180" rx="44"/></clipPath>
              </defs>
              <rect x="100" y="40" width="180" height="180" rx="44" fill="url(#hpro-bg)"/>
              <g clipPath="url(#hpro-clip)">
                <rect x="100" y="40" width="180" height="180" fill="url(#hpro-metal)"/>
                <rect x="100" y="40" width="180" height="38" fill="url(#hpro-rim)"/>
              </g>
              <rect x="97" y="37" width="186" height="186" rx="47" fill="none" stroke="white" strokeWidth="1.5" filter="url(#hpro-white-glow)" opacity="0.55"/>
              <rect x="100" y="40" width="180" height="180" rx="44" fill="none" stroke="#A855F7" strokeWidth="2" filter="url(#hpro-glow)" opacity="0.9"/>
              <rect x="109" y="49" width="162" height="162" rx="36" fill="none" stroke="#A855F7" strokeWidth="0.7" opacity="0.35"/>
              <g mask="url(#hpro-edgecut)">
                <g fill="url(#hpro-chrome)">
                  <rect x="152" y="69" width="20" height="108"/>
                  <rect x="208" y="69" width="20" height="108"/>
                  <path d="M152 111 L228 111 L240 123 L228 135 L152 135 L140 123 Z"/>
                  <path d="M134 69 L172 69 L172 83 L152 83 Z"/>
                  <path d="M246 69 L208 69 L208 83 L228 83 Z"/>
                  <path d="M134 177 L172 177 L172 163 L152 163 Z"/>
                  <path d="M246 177 L208 177 L208 163 L228 163 Z"/>
                </g>
                <rect x="120" y="69" width="140" height="70" fill="url(#hpro-spec)" mask="url(#hpro-hshape)"/>
              </g>
              <text x="195" y="200" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="12" fontWeight="500" letterSpacing="6" fill="#E9C9FF" filter="url(#hpro-bloom)">PRO</text>
            </svg>
            {/* v2 badge with purple backlight */}
            <span
              className="text-xs font-bold tracking-widest px-2 py-0.5 rounded font-mono"
              style={{
                color: '#E9C9FF',
                background: 'rgba(168,85,247,0.18)',
                border: '1px solid rgba(168,85,247,0.45)',
                boxShadow: '0 0 10px 2px rgba(168,85,247,0.35), 0 0 24px 4px rgba(168,85,247,0.15)',
              }}
            >
              v2
            </span>
          </div>
          {/* Global odds format toggle always visible */}
          <div className="flex gap-0.5 bg-[#100020] rounded-lg p-0.5">
            {(['american', 'decimal'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFmt(f)}
                className={`text-xs px-2.5 py-1 rounded-md font-mono font-bold tracking-wider transition-colors ${fmt === f ? 'bg-[#180032] text-white' : 'text-slate-600 hover:text-slate-400'}`}
              >
                {f === 'american' ? 'AM' : 'DEC'}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex">
          {SUB_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={`flex-1 py-2.5 text-xs font-mono font-bold tracking-widest transition-colors relative ${
                subTab === t.key ? 'text-purple-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.label}
              {subTab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-purple-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Setup warning (non-blocking) */}
      {noSetup && subTab !== 'calc' && (
        <div className="mx-4 mt-3 px-3 py-2 border border-[#CCFF00]/40 bg-[#CCFF00]/10 rounded-xl shadow-[0_0_16px_rgba(204,255,0,0.15)]">
          <p className="text-xs font-bold font-mono text-[#CCFF00] tracking-wide uppercase flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse shrink-0" />
            LIVE FEATURES REQUIRE API KEY + BOOKS → Settings
          </p>
        </div>
      )}

      {/* CSS-hidden sub-tabs keep state alive (Lines sport/data, Calc inputs, Radar results) */}
      <div className="pt-2">
        <div className={subTab === 'radar' ? '' : 'hidden'}>
          <ProDashboard
            onOpenCalc={openCalc}
            fmt={fmt}
            onSwitchToMyBets={onSwitchToMyBets}
            scanTrigger={scanTrigger}
          />
        </div>
        <div className={subTab === 'calc' ? '' : 'hidden'}>
          <ProCalculator
            prefill={calcPrefill}
            onClearPrefill={clearPrefill}
            fmt={fmt}
            onFmtChange={setFmt}
            onSaveToTracker={onSwitchToMyBets}
          />
        </div>
        <div className={subTab === 'lines' ? '' : 'hidden'}>
          <ProMarkets onPrefill={openCalc} fmt={fmt} />
        </div>
      </div>
    </div>
  );
}
