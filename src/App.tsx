import { useState, useMemo, useCallback } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import InputSection from './components/InputSection';
import ResultsSection from './components/ResultsSection';
import OddsBrowser from './components/OddsBrowser';
import SettingsPanel from './components/SettingsPanel';
import { parseOdds, calculate, OddsFormat, BetMode } from './utils/odds';
import { getApiKey, getSelectedBooks } from './utils/storage';

export type Tab = 'odds' | 'calculator' | 'settings';

export interface HedgePrefill {
  originalLabel: string;
  hedgeLabel: string;
  originalOdds: string;
  hedgeOdds: string;
  hedgeBookName?: string;
}

function isConfigured(): boolean {
  return getApiKey().length > 0 && getSelectedBooks().length > 0;
}

export default function App() {
  const [tab, setTab] = useState<Tab>(isConfigured() ? 'odds' : 'settings');

  // Calculator state
  const [oddsFormat, setOddsFormat] = useState<OddsFormat>('american');
  const [betMode, setBetMode] = useState<BetMode>('straight');
  const [originalOdds, setOriginalOdds] = useState('');
  const [originalStake, setOriginalStake] = useState('');
  const [potentialPayout, setPotentialPayout] = useState('');
  const [hedgeOdds, setHedgeOdds] = useState('');
  const [originalLabel, setOriginalLabel] = useState('');
  const [hedgeLabel, setHedgeLabel] = useState('');
  const [fromLiveOdds, setFromLiveOdds] = useState(false);

  const parsedHedgeDecimalOdds = useMemo(
    () => parseOdds(hedgeOdds, oddsFormat),
    [hedgeOdds, oddsFormat],
  );

  const parsedStake = useMemo(() => {
    const v = parseFloat(originalStake);
    return isNaN(v) || v <= 0 ? null : v;
  }, [originalStake]);

  const parsedPayout = useMemo(() => {
    if (betMode === 'parlay') {
      const v = parseFloat(potentialPayout);
      return isNaN(v) || v <= 0 ? null : v;
    }
    const dec = parseOdds(originalOdds, oddsFormat);
    if (!dec || !parsedStake) return null;
    return parsedStake * dec;
  }, [betMode, potentialPayout, originalOdds, oddsFormat, parsedStake]);

  const result = useMemo(() => {
    if (!parsedStake || !parsedPayout || !parsedHedgeDecimalOdds) return null;
    if (parsedPayout <= parsedStake) return null;
    return calculate(parsedStake, parsedPayout, parsedHedgeDecimalOdds);
  }, [parsedStake, parsedPayout, parsedHedgeDecimalOdds]);

  const handleOddsFormatChange = useCallback((format: OddsFormat) => {
    setOddsFormat(format);
    setOriginalOdds('');
    setHedgeOdds('');
  }, []);

  const handleBetModeChange = useCallback((mode: BetMode) => {
    setBetMode(mode);
    setOriginalOdds('');
    setOriginalStake('');
    setPotentialPayout('');
    setHedgeOdds('');
    setOriginalLabel('');
    setHedgeLabel('');
    setFromLiveOdds(false);
  }, []);

  const handlePrefill = useCallback((prefill: HedgePrefill) => {
    setOddsFormat('american');
    setBetMode('straight');
    setOriginalOdds(prefill.originalOdds);
    setOriginalStake('');
    setHedgeOdds(prefill.hedgeOdds);
    setOriginalLabel(prefill.originalLabel);
    setHedgeLabel(prefill.hedgeLabel + (prefill.hedgeBookName ? ` (${prefill.hedgeBookName})` : ''));
    setPotentialPayout('');
    setFromLiveOdds(true);
    setTab('calculator');
  }, []);

  const handleSettingsSave = useCallback(() => {
    if (isConfigured()) setTab('odds');
  }, []);

  const hasInputs = Boolean(parsedStake && parsedPayout && parsedHedgeDecimalOdds);
  const payoutTooLow = parsedStake && parsedPayout && parsedPayout <= parsedStake;

  return (
    <div className="min-h-screen bg-[#080E1A]">
      <Header />

      <main className="max-w-2xl mx-auto">
        {/* Live Odds tab */}
        {tab === 'odds' && <OddsBrowser onHedge={handlePrefill} />}

        {/* Calculator tab */}
        {tab === 'calculator' && (
          <div className="px-4 pt-6 pb-32 space-y-4">
            {fromLiveOdds && originalLabel && (
              <div className="card p-3 border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-emerald-400 shrink-0">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M6 8l1.5 1.5L10 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-xs text-emerald-300">
                  Loaded from live odds — enter your stake to see your guaranteed profit.
                </p>
              </div>
            )}

            <InputSection
              oddsFormat={oddsFormat}
              onOddsFormatChange={handleOddsFormatChange}
              betMode={betMode}
              onBetModeChange={handleBetModeChange}
              originalOdds={originalOdds}
              onOriginalOddsChange={setOriginalOdds}
              originalStake={originalStake}
              onOriginalStakeChange={setOriginalStake}
              potentialPayout={potentialPayout}
              onPotentialPayoutChange={setPotentialPayout}
              hedgeOdds={hedgeOdds}
              onHedgeOddsChange={setHedgeOdds}
              originalLabel={originalLabel}
              onOriginalLabelChange={setOriginalLabel}
              hedgeLabel={hedgeLabel}
              onHedgeLabelChange={setHedgeLabel}
            />

            {payoutTooLow && (
              <div className="card p-4 border-amber-500/30 bg-amber-500/5">
                <p className="text-xs text-amber-400">
                  Potential payout must be greater than your stake. For a straight bet, make sure your odds are correct.
                </p>
              </div>
            )}

            {!hasInputs && !payoutTooLow && (
              <div className="card p-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#132035] flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-emerald-500">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm font-medium">Enter your bet details above</p>
                <p className="text-slate-600 text-xs max-w-xs mx-auto">
                  Or browse Live Odds to auto-fill from a real game.
                </p>
              </div>
            )}

            {result && parsedStake && parsedPayout && parsedHedgeDecimalOdds && (
              <ResultsSection
                result={result}
                originalStake={parsedStake}
                originalPayout={parsedPayout}
                hedgeDecimalOdds={parsedHedgeDecimalOdds}
                originalLabel={originalLabel}
                hedgeLabel={hedgeLabel}
              />
            )}
          </div>
        )}

        {/* Settings tab */}
        {tab === 'settings' && (
          <div className="pt-4">
            <SettingsPanel onSave={handleSettingsSave} />
          </div>
        )}
      </main>

      <BottomNav activeTab={tab} onChange={setTab} />
    </div>
  );
}
