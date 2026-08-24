import React from 'react';
import { Monitor, Check } from 'lucide-react';
import { MonitorInfo } from '../types';

interface MonitorPickerProps {
  monitors: MonitorInfo[];
  selectedIndex: number;
  onSelectMonitor: (index: number) => void;
}

export const MonitorPicker: React.FC<MonitorPickerProps> = ({
  monitors,
  selectedIndex,
  onSelectMonitor,
}) => {
  return (
    <div className="flex flex-col gap-3 glass-card p-5 rounded-2xl border border-purple-500/10">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2">
          <Monitor className="w-4 h-4 text-cyan-400" />
          Hedef Monitör Seçimi
        </span>
        <span className="text-[10px] text-zinc-400">
          {selectedIndex === -1 ? 'Tüm Monitörler' : `Monitör ${selectedIndex + 1}`}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Option: All Monitors */}
        <button
          onClick={() => onSelectMonitor(-1)}
          className={`p-3 rounded-xl flex items-center justify-between border text-left transition-all ${
            selectedIndex === -1
              ? 'bg-purple-950/40 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
              : 'bg-white/5 border-white/5 hover:border-white/10 text-zinc-400'
          }`}
        >
          <div>
            <div className="text-xs font-bold text-zinc-100">Tüm Ekranlar</div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Senkronize Renk</div>
          </div>
          {selectedIndex === -1 && <Check className="w-4 h-4 text-purple-400" />}
        </button>

        {/* Specific Monitors */}
        {monitors.map((m) => {
          const isSelected = selectedIndex === m.index;
          return (
            <button
              key={m.index}
              onClick={() => onSelectMonitor(m.index)}
              className={`p-3 rounded-xl flex items-center justify-between border text-left transition-all ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-white/5 border-white/5 hover:border-white/10 text-zinc-400'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-zinc-100 flex items-center gap-1">
                  <span>Monitör {m.index + 1}</span>
                  {m.isPrimary && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                      Ana Ekran
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  {m.width}x{m.height} @ {m.refreshRate}Hz
                </div>
              </div>
              {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
