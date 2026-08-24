import React from 'react';
import { Flame, RotateCcw, Sparkles, RefreshCw, Cpu, Monitor, Download } from 'lucide-react';
import { ReleaseInfo } from '../types';

interface NavbarProps {
  version: string;
  gpuVendor: string;
  onMaxGamma: () => void;
  onReset: () => void;
  onOpenUpdateModal: () => void;
  releaseInfo: ReleaseInfo | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  version,
  gpuVendor,
  onMaxGamma,
  onReset,
  onOpenUpdateModal,
  releaseInfo,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-purple-500/20 px-6 py-3.5 flex items-center justify-between shadow-2xl backdrop-blur-xl">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-indigo-600 p-[1px] shadow-[0_0_20px_rgba(168,85,247,0.4)]">
          <div className="w-full h-full bg-[#0d0a18] rounded-[11px] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-fuchsia-400 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-wider text-white font-mono flex items-center gap-1.5">
              DUST<span className="text-fuchsia-400">FX</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                PRO v{version}
              </span>
            </h1>
          </div>
          <p className="text-xs text-zinc-400 flex items-center gap-1.5 font-light">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="truncate max-w-[280px]">{gpuVendor}</span>
          </p>
        </div>
      </div>

      {/* Center / Fast Actions */}
      <div className="flex items-center gap-3">
        {/* Max Gamma Quick Action */}
        <button
          onClick={onMaxGamma}
          className="group relative flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600/90 to-orange-600/90 hover:from-red-500 hover:to-orange-500 text-white text-xs font-bold tracking-wide transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] active:scale-95 border border-red-400/30"
        >
          <Flame className="w-4 h-4 text-orange-200 group-hover:scale-110 transition-transform" />
          <span>MAX DCCW GAMA</span>
          <span className="text-[10px] opacity-75 font-mono">(F11)</span>
        </button>

        {/* Reset Quick Action */}
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 text-xs font-semibold tracking-wide border border-white/10 hover:border-white/20 transition-all duration-300 active:scale-95 shadow-md"
        >
          <RotateCcw className="w-4 h-4 text-zinc-400" />
          <span>Sıfırla</span>
          <span className="text-[10px] text-zinc-500 font-mono">(F10)</span>
        </button>
      </div>

      {/* Right Side: GitHub Update Tracker */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenUpdateModal}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 ${
            releaseInfo?.hasUpdate
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-bounce'
              : 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
          }`}
          title="GitHub Otomatik Güncelleme Takibi"
        >
          {releaseInfo?.hasUpdate ? (
            <>
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Yeni Sürüm (v{releaseInfo.latestVersion})</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
              <span>GitHub Güncel (v{version})</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
