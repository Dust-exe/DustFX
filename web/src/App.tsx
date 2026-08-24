import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { SliderGroup } from './components/SliderGroup';
import { ProfileCards } from './components/ProfileCards';
import { MonitorPicker } from './components/MonitorPicker';
import { CrosshairOverlay } from './components/CrosshairOverlay';
import { HotkeyManagerUI } from './components/HotkeyManagerUI';
import { UpdateModal } from './components/UpdateModal';
import { api } from './api';
import { AppStatus, DisplaySettings, GameProfile, ReleaseInfo } from './types';

export function App() {
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

  // Load initial data
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

  // Handle slider change (debounced apply)
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
    setSettings((prev) => ({ ...prev, gamma: 2.5 }));
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
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Dynamic Background Shader Lights */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[60%] left-[70%] w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[5%] left-[30%] w-[450px] h-[450px] bg-cyan-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Main Header / Navbar */}
      <Navbar
        version={status?.version || '1.1.0'}
        gpuVendor={status?.gpuVendor || 'NVIDIA GeForce (Hardware NVAPI)'}
        onMaxGamma={handleMaxGamma}
        onReset={handleReset}
        onOpenUpdateModal={() => setShowUpdateModal(true)}
        releaseInfo={releaseInfo}
      />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 relative z-10 flex flex-col gap-8">
        {/* Top Sliders & Control Panel */}
        <section className="glass-panel p-6 rounded-3xl border border-purple-500/20 shadow-2xl">
          <SliderGroup
            settings={settings}
            onChange={handleSettingsChange}
          />
        </section>

        {/* Profile Cards Grid */}
        <section className="glass-panel p-6 rounded-3xl border border-purple-500/20 shadow-2xl">
          <ProfileCards
            profiles={profiles}
            activeProfileId={activeProfileId}
            onSelectProfile={handleSelectProfile}
          />
        </section>

        {/* Tools: Crosshair, Monitor Picker & Hotkeys */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CrosshairOverlay
            settings={settings}
            onChange={handleSettingsChange}
          />
          <MonitorPicker
            monitors={status?.monitors || []}
            selectedIndex={selectedMonitorIndex}
            onSelectMonitor={(idx) => {
              setSelectedMonitorIndex(idx);
            }}
          />
        </div>

        {/* Global Hotkeys & Short Info */}
        <HotkeyManagerUI />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-4 px-6 text-center text-xs text-zinc-500 font-light relative z-10">
        DUSTFX PRO — Engineered by <span className="text-zinc-300 font-medium">dust.exe</span> • Dust Studio
      </footer>

      {/* GitHub Update Modal */}
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
