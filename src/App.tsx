import { useState, useCallback, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import MyBets from './components/MyBets';
import Opportunities from './components/Opportunities';
import ProSection from './components/ProSection';
import FuturesTab from './components/FuturesTab';
import SettingsPanel from './components/SettingsPanel';
import { getApiKey, getSelectedBooks } from './utils/storage';
import type { CalcPrefill } from './components/ProCalculator';

export type Tab = 'bets' | 'opportunities' | 'pro' | 'futures' | 'settings';

function isConfigured(): boolean {
  return getApiKey().length > 0 && getSelectedBooks().length > 0;
}

export default function App() {
  const [tab, setTab] = useState<Tab>(isConfigured() ? 'bets' : 'settings');
  const [badge, setBadge] = useState<{ bets?: number }>({});
  const [proScanTrigger, setProScanTrigger] = useState(0);
  const [betsRefreshTrigger, setBetsRefreshTrigger] = useState(0);
  const [oppsRefreshTrigger, setOppsRefreshTrigger] = useState(0);
  const [calcPrefill, setCalcPrefill] = useState<CalcPrefill | null>(null);
  const [calcTrigger, setCalcTrigger] = useState(0);

  // Refresh data automatically whenever the user switches to these tabs
  useEffect(() => {
    if (tab === 'bets') setBetsRefreshTrigger(n => n + 1);
    if (tab === 'opportunities') setOppsRefreshTrigger(n => n + 1);
  }, [tab]);

  const handleBadgeChange = useCallback((count: number) => {
    setBadge({ bets: count });
  }, []);

  const handleSettingsSave = useCallback(() => {
    if (isConfigured()) setTab('bets');
  }, []);

  const goToProRadar = useCallback(() => {
    setTab('pro');
    setProScanTrigger((n) => n + 1);
  }, []);

  const goToProCalc = useCallback((prefill: CalcPrefill) => {
    setCalcPrefill(prefill);
    setTab('pro');
    setCalcTrigger((n) => n + 1);
  }, []);

  return (
    <div className="min-h-screen bg-[#09000F]">
      <main className="max-w-2xl mx-auto">
        {/* CSS-hidden tabs keep component state alive across tab switches */}
        <div className={tab === 'bets' ? '' : 'hidden'}>
          <MyBets onBadgeChange={handleBadgeChange} onGoToProRadar={goToProRadar} onSendToCalc={goToProCalc} refreshTrigger={betsRefreshTrigger} />
        </div>

        <div className={tab === 'opportunities' ? '' : 'hidden'}>
          <Opportunities onSwitchToMyBets={() => setTab('bets')} onSendToCalc={goToProCalc} refreshTrigger={oppsRefreshTrigger} />
        </div>

        <div className={tab === 'pro' ? '' : 'hidden'}>
          <ProSection
            onSwitchToMyBets={() => setTab('bets')}
            scanTrigger={proScanTrigger}
            externalCalcPrefill={calcPrefill}
            externalCalcTrigger={calcTrigger}
          />
        </div>

        <div className={tab === 'futures' ? '' : 'hidden'}>
          <FuturesTab />
        </div>

        <div className={tab === 'settings' ? '' : 'hidden'}>
          <div className="pt-0 pb-4">
            <div className="px-5 pt-12 pb-4 border-b border-[#1E0840] mb-5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Preferences</p>
              <h1 className="text-xl font-bold text-white mt-0.5 font-grotesk">Settings</h1>
            </div>
            <SettingsPanel onSave={handleSettingsSave} />
          </div>
        </div>
      </main>

      <BottomNav activeTab={tab} onChange={setTab} badge={badge} />
    </div>
  );
}
