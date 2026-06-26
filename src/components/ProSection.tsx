import { useState, useCallback } from 'react';
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

export default function ProSection() {
  const [subTab, setSubTab] = useState<SubTab>('radar');
  const [calcPrefill, setCalcPrefill] = useState<CalcPrefill | null>(null);
  const [fmt, setFmt] = useState<OddsFormat>('american');

  const noSetup = !getApiKey() || !getSelectedBooks().length;

  const openCalc = useCallback((prefill: CalcPrefill) => {
    setCalcPrefill(prefill);
    setSubTab('calc');
  }, []);

  const clearPrefill = useCallback(() => setCalcPrefill(null), []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-14 border-b border-[#1A2A40]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-white font-mono">HEDGE PRO</h1>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold tracking-widest">v2</span>
          </div>
          {/* Global odds format toggle always visible */}
          <div className="flex gap-0.5 bg-[#0D1625] rounded-lg p-0.5">
            {(['american', 'decimal'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFmt(f)}
                className={`text-[10px] px-2.5 py-1 rounded-md font-mono font-bold tracking-wider transition-colors ${fmt === f ? 'bg-[#132035] text-white' : 'text-slate-600 hover:text-slate-400'}`}
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
              className={`flex-1 py-2.5 text-[11px] font-mono font-bold tracking-widest transition-colors relative ${
                subTab === t.key ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.label}
              {subTab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-emerald-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Setup warning (non-blocking) */}
      {noSetup && subTab !== 'calc' && (
        <div className="mx-4 mt-3 px-3 py-2 border border-amber-500/20 bg-amber-500/5 rounded-xl">
          <p className="text-[10px] font-mono text-amber-400">LIVE FEATURES REQUIRE API KEY + BOOKS → Settings</p>
        </div>
      )}

      {/* Content */}
      <div className="pt-2">
        {subTab === 'radar' && (
          <ProDashboard onOpenCalc={openCalc} fmt={fmt} />
        )}
        {subTab === 'calc' && (
          <ProCalculator
            prefill={calcPrefill}
            onClearPrefill={clearPrefill}
            fmt={fmt}
            onFmtChange={setFmt}
          />
        )}
        {subTab === 'lines' && (
          <ProMarkets onPrefill={openCalc} fmt={fmt} />
        )}
      </div>
    </div>
  );
}
