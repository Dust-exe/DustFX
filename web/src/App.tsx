import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Sidebar, TabId } from './components/Sidebar';
import { ScreenFilterTab } from './components/Tabs/ScreenFilterTab';
import { ProfilesTab } from './components/Tabs/ProfilesTab';
import { CrosshairTab } from './components/Tabs/CrosshairTab';
import { MonitorsTab } from './components/Tabs/MonitorsTab';
import { HotkeysTab } from './components/Tabs/HotkeysTab';
import { UpdatesTab } from './components/Tabs/UpdatesTab';
import { DustStudioTab } from './components/Tabs/DustStudioTab';
import { UpdateModal } from './components/UpdateModal';
import { api } from './api';
import { AppStatus, DisplaySettings, GameProfile, ReleaseInfo, HotkeyConfig } from './types';
import { Flame, RotateCcw, Download, Globe } from 'lucide-react';
import { translations, Language } from './translations';

const CURRENT_VERSION = '1.7.1';

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('filter');
  const [lang, setLang] = useState<Language>(() => {
    try {
      const savedLang = localStorage.getItem('dustfx_lang');
      if (savedLang === 'tr' || savedLang === 'en') return savedLang;
    } catch {}
    return 'en'; // Default English as requested
  });

  const t = translations[lang];

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    try {
      localStorage.setItem('dustfx_lang', newLang);
    } catch {}
  };

  const [status, setStatus] = useState<AppStatus | null>(null);
  const [profiles, setProfiles] = useState<GameProfile[]>([]);
  const [hotkeys, setHotkeys] = useState<HotkeyConfig>({
    maxGammaKey: 'F11',
    vibranceKey: 'F12',
    quickResetKey: 'F10',
    toggleOverlayKey: 'Alt+X',
    toggleCrosshairKey: 'Alt+Z',
  });
  const [settings, setSettings] = useState<DisplaySettings>({
    gamma: 1.0,
    digitalVibrance: 0,
    brightnessOffset: 0.0,
    contrast: 1.0,
    rgbRed: 1.0,
    rgbGreen: 1.0,
    rgbBlue: 1.0,
    sharpness: 0.0,
    colorTemperature: 6500,
    shadowDetail: 0.0,
    edgeEnhance: 0.0,
    crosshairEnabled: false,
    crosshairStyle: 'cross',
    crosshairColor: '#00FF66',
    crosshairSize: 10,
    crosshairThickness: 2,
    crosshairGap: 4,
    crosshairDotSize: 0,
    crosshairOutline: 1,
    crosshairOpacity: 1.0,
  });
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [selectedMonitorIndex, setSelectedMonitorIndex] = useState<number>(-1);
  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);

  // Settings ref for stable event listeners & debouncer
  const settingsRef = useRef<DisplaySettings>(settings);
  settingsRef.current = settings;

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [st, profs, hk] = await Promise.all([
          api.getStatus(),
          api.getProfiles(),
          api.getHotkeys(),
        ]);
        setStatus(st);
        setProfiles(profs);
        setHotkeys(hk);
        if (st.currentSettings) {
          setSettings(st.currentSettings);
        }
        setActiveProfileId(st.activeProfileId);
        setSelectedMonitorIndex(st.targetMonitorIndex);
      } catch (err) {
        console.warn('Initial data load error:', err);
      }
    }
    loadData();

    // Check updates on startup
    api.checkUpdate().then((upd) => {
      setReleaseInfo(upd);
    });

    // Poll updates every 10 minutes
    const updateInterval = setInterval(() => {
      api.checkUpdate().then((upd) => setReleaseInfo(upd));
    }, 10 * 60 * 1000);

    return () => clearInterval(updateInterval);
  }, []);

  // Apply settings with 16ms debounce to prevent API flooding during fast slider drags
  const handleSettingsChange = useCallback((patch: Partial<DisplaySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      settingsRef.current = next;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;
        api.applySettings(next, controller.signal).catch(() => {});
      }, 16);

      return next;
    });
  }, []);

  // Profile activation
  const handleSelectProfile = async (id: string) => {
    setActiveProfileId(id);
    const p = profiles.find((item) => item.id === id);
    if (p) {
      const cur = settingsRef.current;
      const profileSettings: DisplaySettings = {
        ...p.settings,
        crosshairEnabled: cur.crosshairEnabled,
        crosshairStyle: cur.crosshairStyle,
        crosshairColor: cur.crosshairColor,
        crosshairSize: cur.crosshairSize,
        crosshairThickness: cur.crosshairThickness,
        crosshairGap: cur.crosshairGap,
        crosshairDotSize: cur.crosshairDotSize,
        crosshairOutline: cur.crosshairOutline,
        crosshairOpacity: cur.crosshairOpacity,
      };
      setSettings(profileSettings);
      await api.applySettings(profileSettings);
      await api.activateProfile(id);
    }
  };

  const handleSaveProfile = async (profile: GameProfile) => {
    await api.saveProfile(profile);
    const updated = await api.getProfiles();
    setProfiles(updated);
    setActiveProfileId(profile.id);
  };

  const handleDeleteProfile = async (id: string) => {
    await api.deleteProfile(id);
    const updated = await api.getProfiles();
    setProfiles(updated);
    if (activeProfileId === id) {
      setActiveProfileId('night_vision');
    }
  };

  const handleSelectMonitor = async (index: number) => {
    setSelectedMonitorIndex(index);
    await api.selectMonitor(index);
  };

  const handleMaxGamma = async () => {
    const cur = settingsRef.current;
    const isMax = cur.gamma >= 2.4;
    const newGamma = isMax ? 1.0 : 2.5;
    handleSettingsChange({ gamma: newGamma });
    await api.maxGamma();
  };

  const handleReset = async () => {
    const cur = settingsRef.current;
    const defaultSettings: DisplaySettings = {
      gamma: 1.0,
      digitalVibrance: 0,
      brightnessOffset: 0.0,
      contrast: 1.0,
      rgbRed: 1.0,
      rgbGreen: 1.0,
      rgbBlue: 1.0,
      sharpness: 0.0,
      colorTemperature: 6500,
      shadowDetail: 0.0,
      edgeEnhance: 0.0,
      crosshairEnabled: cur.crosshairEnabled,
      crosshairStyle: cur.crosshairStyle,
      crosshairColor: cur.crosshairColor,
      crosshairSize: cur.crosshairSize,
      crosshairThickness: cur.crosshairThickness,
      crosshairGap: cur.crosshairGap,
      crosshairDotSize: cur.crosshairDotSize,
      crosshairOutline: cur.crosshairOutline,
      crosshairOpacity: cur.crosshairOpacity,
    };
    setSettings(defaultSettings);
    await api.resetSettings();
  };

  // Listen to in-window keyboard triggers (stable listeners with refs)
  useEffect(() => {
    const onMaxGamma = () => handleMaxGamma();
    const onReset = () => handleReset();
    const onVibrance = () => {
      const cur = settingsRef.current;
      const nextVib = cur.digitalVibrance > 0 ? 0 : 75;
      handleSettingsChange({ digitalVibrance: nextVib });
    };

    window.addEventListener('dustfx-action-maxgamma', onMaxGamma);
    window.addEventListener('dustfx-action-reset', onReset);
    window.addEventListener('dustfx-action-vibrance', onVibrance);

    return () => {
      window.removeEventListener('dustfx-action-maxgamma', onMaxGamma);
      window.removeEventListener('dustfx-action-reset', onReset);
      window.removeEventListener('dustfx-action-vibrance', onVibrance);
    };
  }, [handleSettingsChange]);

  // Open external links in DEFAULT system browser (Brave, Chrome, etc.)
  const openExternal = (url: string) => {
    api.openInDefaultBrowser(url);
  };

  return (
    <div className="h-screen w-screen bg-[#08060f] text-foreground flex flex-col overflow-hidden select-none font-sans">
      {/* 0% GPU Static Gradient Background */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          background: 'radial-gradient(circle at 20% 15%, rgba(168, 85, 247, 0.12) 0%, transparent 40%), radial-gradient(circle at 80% 65%, rgba(217, 70, 239, 0.10) 0%, transparent 45%), radial-gradient(circle at 35% 85%, rgba(6, 182, 212, 0.08) 0%, transparent 40%)'
        }}
      />

      {/* Top App Header */}
      <header className="app-titlebar-drag flex items-center justify-between px-5 h-12 border-b border-purple-500/10 bg-[#08060f]/95 z-20 backdrop-blur-xl">
        {/* Left: Logo + App Name + GPU */}
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="DustFX Logo"
            className="w-5 h-5 object-contain rounded shadow-[0_0_8px_rgba(168,85,247,0.5)]"
          />
          <span className="text-xs font-bold text-white font-mono tracking-widest">
            DUST<span className="text-fuchsia-400">FX</span>
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 font-bold">
            v{status?.version || CURRENT_VERSION}
          </span>
          <span className="text-[11px] text-zinc-500 hidden sm:inline border-l border-white/10 pl-3">
            {status?.gpuVendor || 'GPU Engine'}
          </span>
        </div>

        {/* Right: Language Switcher + Quick Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* EN / TR Language Switcher */}
          <div className="flex items-center bg-white/5 p-0.5 rounded-xl border border-white/10 text-[11px] font-mono shadow-inner">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                lang === 'en'
                  ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Switch to English"
            >
              EN
            </button>
            <button
              onClick={() => handleLanguageChange('tr')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                lang === 'tr'
                  ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Türkçe'ye Geç"
            >
              TR
            </button>
          </div>

          <button
            onClick={handleMaxGamma}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-[11px] font-bold tracking-wide transition-all shadow-[0_0_12px_rgba(239,68,68,0.3)] active:scale-95"
            title={`${t.maxGamma} (${hotkeys.maxGammaKey})`}
          >
            <Flame className="w-3 h-3 text-orange-200" />
            {t.maxGamma} ({hotkeys.maxGammaKey})
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] font-medium border border-white/10 transition-all active:scale-95"
            title={`${t.reset} (${hotkeys.quickResetKey})`}
          >
            <RotateCcw className="w-3 h-3 text-zinc-400" />
            {t.reset} ({hotkeys.quickResetKey})
          </button>

          {releaseInfo?.hasUpdate && (
            <button
              onClick={() => setShowUpdateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.3)]"
            >
              <Download className="w-3 h-3" />
              {t.updateAvailable} (v{releaseInfo.latestVersion})
            </button>
          )}
        </div>
      </header>

      {/* === MAIN BODY: Sidebar + Tab Content === */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          releaseInfo={releaseInfo}
          lang={lang}
        />

        <main className="flex-1 overflow-y-auto p-6 relative">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            {activeTab === 'filter' && (
              <ScreenFilterTab settings={settings} onChange={handleSettingsChange} lang={lang} />
            )}
            {activeTab === 'profiles' && (
              <ProfilesTab
                profiles={profiles}
                activeProfileId={activeProfileId}
                currentSettings={settings}
                onSelectProfile={handleSelectProfile}
                onSaveProfile={handleSaveProfile}
                onDeleteProfile={handleDeleteProfile}
              />
            )}
            {activeTab === 'crosshair' && (
              <CrosshairTab settings={settings} onChange={handleSettingsChange} lang={lang} />
            )}
            {activeTab === 'monitors' && (
              <MonitorsTab
                monitors={status?.monitors || []}
                selectedIndex={selectedMonitorIndex}
                onSelectMonitor={handleSelectMonitor}
              />
            )}
            {activeTab === 'hotkeys' && (
              <HotkeysTab
                hotkeys={hotkeys}
                onHotkeysChange={setHotkeys}
                profiles={profiles}
                onProfilesChange={setProfiles}
              />
            )}
            {activeTab === 'updates' && (
              <UpdatesTab
                releaseInfo={releaseInfo}
                onCheckAgain={async () => {
                  const upd = await api.checkUpdate();
                  setReleaseInfo(upd);
                }}
                onOpenExternal={openExternal}
              />
            )}
            {activeTab === 'dust_studio' && (
              <DustStudioTab lang={lang} onOpenExternal={openExternal} />
            )}
          </div>
        </main>
      </div>

      {showUpdateModal && (
        <UpdateModal
          releaseInfo={releaseInfo}
          onClose={() => setShowUpdateModal(false)}
          onOpenExternal={openExternal}
        />
      )}
    </div>
  );
}

export default App;
