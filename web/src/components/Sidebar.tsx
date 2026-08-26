import React from 'react';
import {
  Sliders,
  Bookmark,
  Target,
  Monitor,
  Keyboard,
  RefreshCw,
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
  const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode; badge?: string; hasAlert?: boolean }> = [
    { id: 'filter', label: 'Ekran Filtresi', icon: <Sliders className="w-4 h-4" /> },
    { id: 'profiles', label: 'Hazır Profiller', icon: <Bookmark className="w-4 h-4" />, badge: '5' },
    { id: 'crosshair', label: 'PvP Nişangah', icon: <Target className="w-4 h-4" />, badge: 'Bakımda' },
    { id: 'monitors', label: 'Monitör & Oyun', icon: <Monitor className="w-4 h-4" /> },
    { id: 'hotkeys', label: 'Kısayollar', icon: <Keyboard className="w-4 h-4" /> },
    {
      id: 'updates',
      label: 'Güncellemeler',
      icon: <RefreshCw className="w-4 h-4" />,
      hasAlert: releaseInfo?.hasUpdate === true,
    },
  ];

  return (
    <aside className="w-56 bg-[#0a0714]/90 border-r border-purple-500/10 flex flex-col justify-between py-4 select-none backdrop-blur-xl">
      <div className="flex flex-col gap-5 px-3">
        {/* Brand Banner */}
        <div className="p-3 rounded-2xl bg-gradient-to-b from-purple-900/25 to-fuchsia-950/15 border border-purple-500/15 flex items-center gap-2.5 shadow-lg">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-black/40 border border-purple-500/25 flex items-center justify-center p-1 shadow-[0_0_12px_rgba(168,85,247,0.35)] flex-shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-white font-mono tracking-wider">DUST STUDIO</div>
            <div className="text-[9px] text-fuchsia-400 font-medium flex items-center gap-1 mt-0.5">
              <Zap className="w-2.5 h-2.5" />
              DWM Hardware Engine
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          <div className="px-2 pb-1 text-[9px] font-bold text-zinc-600 uppercase tracking-widest font-mono">
            Menü
          </div>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/80 to-fuchsia-600/80 text-white shadow-[0_0_18px_rgba(168,85,247,0.3)] translate-x-1'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-white' : 'text-purple-400'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {tab.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/10 text-zinc-400 font-mono">
                      {tab.badge}
                    </span>
                  )}
                  {tab.hasAlert && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Status — no port shown */}
      <div className="mx-3 p-3 rounded-2xl bg-black/40 border border-white/5 text-[10px] font-mono">
        <div className="flex items-center justify-between text-zinc-400">
          <span>Motor:</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            DWM Aktif
          </span>
        </div>
      </div>
    </aside>
  );
};
