import React from 'react';
import {
  Sliders,
  Bookmark,
  Target,
  Monitor,
  Keyboard,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ReleaseInfo } from '../types';

export type TabId = 'filter' | 'profiles' | 'crosshair' | 'monitors' | 'hotkeys' | 'updates';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  releaseInfo: ReleaseInfo | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, releaseInfo }) => {
  const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode; badge?: string; isNew?: boolean }> = [
    { id: 'filter', label: 'Ekran Filtresi', icon: <Sliders className="w-4 h-4" /> },
    { id: 'profiles', label: 'Hazır Profiller', icon: <Bookmark className="w-4 h-4" />, badge: '5' },
    { id: 'crosshair', label: 'PvP Nişangah', icon: <Target className="w-4 h-4" /> },
    { id: 'monitors', label: 'Monitör & Oyun', icon: <Monitor className="w-4 h-4" /> },
    { id: 'hotkeys', label: 'Kısayollar (OSD)', icon: <Keyboard className="w-4 h-4" /> },
    {
      id: 'updates',
      label: 'Güncellemeler',
      icon: <RefreshCw className={`w-4 h-4 ${releaseInfo?.hasUpdate ? 'animate-spin text-emerald-400' : ''}`} />,
      isNew: releaseInfo?.hasUpdate,
    },
  ];

  return (
    <aside className="w-60 bg-[#0d091a]/80 border-r border-purple-500/15 flex flex-col justify-between p-3 select-none backdrop-blur-xl">
      <div className="flex flex-col gap-5">
        {/* Brand Banner */}
        <div className="p-3 rounded-2xl bg-gradient-to-b from-purple-900/30 to-fuchsia-950/20 border border-purple-500/20 flex items-center gap-3 shadow-lg">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-black/40 border border-purple-500/30 flex items-center justify-center p-1 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="text-xs font-bold text-white font-mono tracking-wider flex items-center gap-1">
              DUST STUDIO
            </div>
            <div className="text-[10px] text-fuchsia-400 font-medium flex items-center gap-1 mt-0.5">
              <Zap className="w-3 h-3" />
              <span>DirectX Engine</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-col gap-1">
          <div className="px-3 pb-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
            Menü & Özellikler
          </div>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/90 to-fuchsia-600/90 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)] translate-x-1'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-purple-400'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </div>
                {tab.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-zinc-300 font-mono">
                    {tab.badge}
                  </span>
                )}
                {tab.isNew && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-1 text-[10px] text-zinc-500 font-mono">
        <div className="flex items-center justify-between text-zinc-400">
          <span>Durum:</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Aktif (DWM 0ms)
          </span>
        </div>
        <div className="flex items-center justify-between text-zinc-500 mt-0.5">
          <span>Port:</span>
          <span>127.0.0.1:19840</span>
        </div>
      </div>
    </aside>
  );
};
