import React from 'react';
import { Flame, RotateCcw, X, Download } from 'lucide-react';
import { ReleaseInfo } from '../types';

interface TitleBarProps {
  version: string;
  gpuVendor: string;
  onMaxGamma: () => void;
  onReset: () => void;
  onOpenUpdateModal: () => void;
  releaseInfo: ReleaseInfo | null;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  version,
  gpuVendor,
  onMaxGamma,
  onReset,
  onOpenUpdateModal,
  releaseInfo,
}) => {
  return (
    <div className="w-full bg-[#0a0814]/90 border-b border-purple-500/20 px-4 py-2 flex items-center justify-between select-none z-50 backdrop-blur-md">
      {/* Left: App Logo & Title */}
      <div className="flex items-center gap-2.5">
        <img
          src="/logo.png"
          alt="Dust Studio Logo"
          className="w-6 h-6 object-contain rounded-md shadow-[0_0_10px_rgba(168,85,247,0.5)]"
          onError={(e) => {
            // fallback if logo fails
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-widest text-white font-mono">
            DUST<span className="text-fuchsia-400">FX</span> PRO
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
            v{version}
          </span>
        </div>
        <span className="text-[11px] text-zinc-500 hidden sm:inline-block font-light border-l border-white/10 pl-2">
          {gpuVendor}
        </span>
      </div>

      {/* Center: Quick Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMaxGamma}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-[11px] font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] active:scale-95"
        >
          <Flame className="w-3.5 h-3.5 text-orange-200" />
          <span>MAX GAMA (F11)</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] font-medium border border-white/10 transition-all active:scale-95"
        >
          <RotateCcw className="w-3 h-3 text-zinc-400" />
          <span>Sıfırla (F10)</span>
        </button>

        {releaseInfo?.hasUpdate && (
          <button
            onClick={onOpenUpdateModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.3)]"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span>Güncelleme (v{releaseInfo.latestVersion})</span>
          </button>
        )}
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => window.close()}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-500/80 text-zinc-400 hover:text-white transition-colors"
          title="Kapat"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
