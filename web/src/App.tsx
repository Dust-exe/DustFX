import React, { useEffect, useState, useCallback } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar, TabId } from './components/Sidebar';
import { ScreenFilterTab } from './components/Tabs/ScreenFilterTab';
import { ProfilesTab } from './components/Tabs/ProfilesTab';
import { CrosshairTab } from './components/Tabs/CrosshairTab';
import { MonitorsTab } from './components/Tabs/MonitorsTab';
import { HotkeysTab } from './components/Tabs/HotkeysTab';
import { UpdatesTab } from './components/Tabs/UpdatesTab';
import { UpdateModal } from './components/UpdateModal';
import { api } from './api';
import { AppStatus, DisplaySettings, GameProfile, ReleaseInfo } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('filter');
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [profiles, setProfiles] = useState<GameProfile[]>([]);
  const [settings, setSettings] = useState<DisplaySettings>({
    gamma: 1.0,
    digitalVibrance: 0,
    brightnessOffset: 0.0,
    contrast: 1.0,
    rgbRed: 1.0,
    rgbGreen: 1.0,
    rgbBlue: 1.0,
    sharpness: 0.0,
    crosshairEnabled: false,
    crosshairStyle: 'dot',
    crosshairColor: '#00FF66',
    crosshairSize: 6,
  });
  const [activeProfileId, setActiveProfileId] = useState<string>('pvp_contrast');
  const [selectedMonitorIndex, setSelectedMonitorIndex] = useState<number>(-1);
  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);

  // Load initial backend status and profiles
  useEffect(() => {
    async function loadData() {
      const [st, profs, upd] = await Promise.all([
        api.getStatus(),
        api.getProfiles(),
        api.checkUpdate(),
      ]);

      setStatus(st);
      setProfiles(profs);
      setSettings(st.currentSettings);
      setActiveProfileId(st.activeProfileId);
      setSelectedMonitorIndex(st.targetMonitorIndex);
      setReleaseInfo(upd);
    }
    loadData();
  }, []);

  // Handle slider changes and apply immediately
  const handleSettingsChange = useCallback((patch: Partial<DisplaySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      api.applySettings(next);
      return next;
    });
  }, []);

  // Profile activation
  const handleSelectProfile = async (id: string) => {
    setActiveProfileId(id);
    const p = profiles.find((item) => item.id === id);
    if (p) {
      setSettings(p.settings);
      await api.activateProfile(id);
    }
  };

  // Quick Max Gamma
  const handleMaxGamma = async () => {
    setSettings((prev) => {
      const next = { ...prev, gamma: 2.5 };
      api.applySettings(next);
      return next;
    });
    await api.maxGamma();
  };

  // Quick Reset
  const handleReset = async () => {
    const defaultSettings: DisplaySettings = {
      gamma: 1.0,
      digitalVibrance: 0,
      brightnessOffset: 0.0,
      contrast: 1.0,
      rgbRed: 1.0,
      rgbGreen: 1.0,
      rgbBlue: 1.0,
      sharpness: 0.0,
      crosshairEnabled: false,
      crosshairStyle: 'dot',
      crosshairColor: '#00FF66',
      crosshairSize: 6,
    };
    setSettings(defaultSettings);
    await api.resetSettings();
  };

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden select-none font-sans">
      {/* Dynamic Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[60%] left-[70%] w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[5%] left-[30%] w-[450px] h-[450px] bg-cyan-600/10 rounded-full blur-[120px]" />
      </div>

      {/* 1. Integrated Window TitleBar */}
      <TitleBar
        version={status?.version || '1.1.0'}
        gpuVendor={status?.gpuVendor || 'DirectX / DWM Engine'}
        onMaxGamma={handleMaxGamma}
        onReset={handleReset}
        onOpenUpdateModal={() => setShowUpdateModal(true)}
        releaseInfo={releaseInfo}
      />

      {/* 2. Main Studio Body with Sidebar + Tab Content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          releaseInfo={releaseInfo}
        />

        {/* Tab View Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            {activeTab === 'filter' && (
              <ScreenFilterTab
                settings={settings}
                onChange={handleSettingsChange}
              />
            )}

            {activeTab === 'profiles' && (
              <ProfilesTab
                profiles={profiles}
                activeProfileId={activeProfileId}
                onSelectProfile={handleSelectProfile}
              />
            )}

            {activeTab === 'crosshair' && (
              <CrosshairTab
                settings={settings}
                onChange={handleSettingsChange}
              />
            )}

            {activeTab === 'monitors' && (
              <MonitorsTab
                monitors={status?.monitors || []}
                selectedIndex={selectedMonitorIndex}
                onSelectMonitor={async (idx) => {
                  setSelectedMonitorIndex(idx);
                }}
              />
            )}

            {activeTab === 'hotkeys' && <HotkeysTab />}

            {activeTab === 'updates' && (
              <UpdatesTab
                releaseInfo={releaseInfo}
                onCheckAgain={async () => {
                  const upd = await api.checkUpdate();
                  setReleaseInfo(upd);
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modal Popup */}
      {showUpdateModal && (
        <UpdateModal
          releaseInfo={releaseInfo}
          onClose={() => setShowUpdateModal(false)}
        />
      )}
    </div>
  );
}

export default App;
