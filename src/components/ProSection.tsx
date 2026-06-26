import { useState } from 'react';
import ProCalculator from './ProCalculator';
import HedgeSimulator from './HedgeSimulator';

type SubTab = 'calculator' | 'simulator';

export default function ProSection() {
  const [subTab, setSubTab] = useState<SubTab>('calculator');

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-14 pb-0">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-lg font-bold text-white">Pro Tools</h1>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold tracking-wide">PRO</span>
        </div>
        <p className="text-xs text-slate-500">Advanced calculator and interactive simulator</p>

        {/* Sub-tabs */}
        <div className="flex gap-1 mt-4 bg-[#0D1625] rounded-xl p-1">
          <button
            onClick={() => setSubTab('calculator')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'calculator'
                ? 'bg-[#132035] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Calculator
          </button>
          <button
            onClick={() => setSubTab('simulator')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'simulator'
                ? 'bg-[#132035] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Simulator
          </button>
        </div>
      </div>

      {subTab === 'calculator' ? <ProCalculator /> : <HedgeSimulator />}
    </div>
  );
}
