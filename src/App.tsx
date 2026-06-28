import { useState, useCallback, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import MyBets from './components/MyBets';
import Opportunities from './components/Opportunities';
import ProSection from './components/ProSection';
import FuturesTab from './components/FuturesTab';
import SettingsPanel from './components/SettingsPanel';
import { getApiKey, getSelectedBooks } from './utils/storage';

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

  return (
    <div className="min-h-screen bg-[#09000F]">
      <main className="max-w-2xl mx-auto">
        {/* CSS-hidden tabs keep component state alive across tab switches */}
        <div className={tab === 'bets' ? '' : 'hidden'}>
          <MyBets onBadgeChange={handleBadgeChange} onGoToProRadar={goToProRadar} refreshTrigger={betsRefreshTrigger} />
        </div>

        <div className={tab === 'opportunities' ? '' : 'hidden'}>
          <Opportunities onSwitchToMyBets={() => setTab('bets')} refreshTrigger={oppsRefreshTrigger} />
        </div>

        <div className={tab === 'pro' ? '' : 'hidden'}>
          <ProSection
            onSwitchToMyBets={() => setTab('bets')}
            scanTrigger={proScanTrigger}
          />
        </div>

        <div className={tab === 'futures' ? '' : 'hidden'}>
          <FuturesTab />
        </div>

        <div className={tab === 'settings' ? '' : 'hidden'}>
          <div className="pt-14 pb-4">
            <div className="px-5 pb-4 border-b border-[#3D1A6E] mb-5">
              <h1 className="text-lg font-bold text-white">Settings</h1>
              <p className="text-xs text-slate-500 mt-0.5">Configure your alerts and betting apps</p>
            </div>
            <SettingsPanel onSave={handleSettingsSave} />
          </div>
        </div>
      </main>

      <BottomNav activeTab={tab} onChange={setTab} badge={badge} />
    </div>
  );
}
