import { useState, useCallback } from 'react';
import BottomNav from './components/BottomNav';
import MyBets from './components/MyBets';
import Opportunities from './components/Opportunities';
import ProSection from './components/ProSection';
import SettingsPanel from './components/SettingsPanel';
import { getApiKey, getSelectedBooks } from './utils/storage';

export type Tab = 'bets' | 'opportunities' | 'pro' | 'settings';

function isConfigured(): boolean {
  return getApiKey().length > 0 && getSelectedBooks().length > 0;
}

export default function App() {
  const [tab, setTab] = useState<Tab>(isConfigured() ? 'bets' : 'settings');
  const [badge, setBadge] = useState<{ bets?: number }>({});

  const handleBadgeChange = useCallback((count: number) => {
    setBadge({ bets: count });
  }, []);

  const handleSettingsSave = useCallback(() => {
    if (isConfigured()) setTab('bets');
  }, []);

  return (
    <div className="min-h-screen bg-[#080E1A]">
      <main className="max-w-2xl mx-auto">
        {tab === 'bets' && (
          <MyBets onBadgeChange={handleBadgeChange} />
        )}

        {tab === 'opportunities' && (
          <Opportunities />
        )}

        {tab === 'pro' && (
          <ProSection />
        )}

        {tab === 'settings' && (
          <div className="pt-14 pb-4">
            <div className="px-5 pb-4 border-b border-[#1A2A40] mb-5">
              <h1 className="text-lg font-bold text-white">Settings</h1>
              <p className="text-xs text-slate-500 mt-0.5">Configure your alerts and betting apps</p>
            </div>
            <SettingsPanel onSave={handleSettingsSave} />
          </div>
        )}
      </main>

      <BottomNav activeTab={tab} onChange={setTab} badge={badge} />
    </div>
  );
}
