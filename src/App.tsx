import { useState, useMemo, useCallback } from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection';
import ResultsSection from './components/ResultsSection';
import { parseOdds, calculate, OddsFormat, BetMode } from './utils/odds';

export default function App() {
  const [oddsFormat, setOddsFormat] = useState<OddsFormat>('american');
  const [betMode, setBetMode] = useState<BetMode>('straight');

  const [originalOdds, setOriginalOdds] = useState('');
  const [originalStake, setOriginalStake] = useState('');
  const [potentialPayout, setPotentialPayout] = useState('');
  const [hedgeOdds, setHedgeOdds] = useState('');
  const [originalLabel, setOriginalLabel] = useState('');
  const [hedgeLabel, setHedgeLabel] = useState('');

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
    const oddsDecimal = parseOdds(originalOdds, oddsFormat);
    if (!oddsDecimal || !parsedStake) return null;
    return parsedStake * oddsDecimal;
  }, [betMode, potentialPayout, originalOdds, oddsFormat, parsedStake]);

  const result = useMemo(() => {
    if (!parsedStake || !parsedPayout || !parsedHedgeDecimalOdds) return null;
    if (parsedPayout <= parsedStake) return null; // payout must exceed stake
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
  }, []);

  const hasInputs = Boolean(parsedStake && parsedPayout && parsedHedgeDecimalOdds);
  const payoutTooLow = parsedStake && parsedPayout && parsedPayout <= parsedStake;

  return (
    <div className="min-h-screen bg-[#080E1A]">
      <Header />
      <main className="max-w-2xl mx-auto px-4 pt-6 pb-16 space-y-4">
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

        {/* Validation hint */}
        {payoutTooLow && (
          <div className="card p-4 border-amber-500/30 bg-amber-500/5">
            <p className="text-xs text-amber-400">
              Potential payout must be greater than your stake. For a straight bet, make sure your odds are correct.
            </p>
          </div>
        )}

        {/* Placeholder when inputs are empty */}
        {!hasInputs && !payoutTooLow && (
          <div className="card p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#132035] flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-emerald-500">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-medium">Enter your bet details above</p>
            <p className="text-slate-600 text-xs max-w-xs mx-auto">
              Fill in your original bet and the hedge odds to calculate your optimal hedge stake and guaranteed outcome.
            </p>
          </div>
        )}

        {/* Results */}
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
      </main>
    </div>
  );
}
