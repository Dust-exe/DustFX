import React from 'react';
import { Target, Crosshair, Circle, Dot } from 'lucide-react';
import { DisplaySettings } from '../types';

interface CrosshairOverlayProps {
  settings: DisplaySettings;
  onChange: (newSettings: Partial<DisplaySettings>) => void;
}

export const CrosshairOverlay: React.FC<CrosshairOverlayProps> = ({ settings, onChange }) => {
  const colors = ['#00FF66', '#FF0055', '#00E5FF', '#FFFF00', '#FFFFFF', '#FF8800'];
  const styles: Array<{ id: DisplaySettings['crosshairStyle']; label: string; icon: React.ReactNode }> = [
    { id: 'dot', label: 'Nokta', icon: <Dot className="w-4 h-4" /> },
    { id: 'cross', label: 'Artı (+)', icon: <Crosshair className="w-4 h-4" /> },
    { id: 'circle', label: 'Daire (O)', icon: <Circle className="w-4 h-4" /> },
    { id: 'gap-cross', label: 'Açık Artı', icon: <Target className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col gap-4 glass-card p-5 rounded-2xl border border-purple-500/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-zinc-100 uppercase font-mono">
            Özel PvP Nişangah (Crosshair Overlay)
          </h3>
        </div>

        {/* Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.crosshairEnabled}
            onChange={(e) => onChange({ crosshairEnabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>

      {settings.crosshairEnabled && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2 border-t border-white/5">
          {/* Style Selector */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-zinc-400 font-medium">Stil:</span>
            <div className="grid grid-cols-2 gap-1.5">
              {styles.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onChange({ crosshairStyle: s.id })}
                  className={`p-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold border transition-all ${
                    settings.crosshairStyle === s.id
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'bg-white/5 border-white/5 hover:border-white/10 text-zinc-400'
                  }`}
                >
                  {s.icon}
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-zinc-400 font-medium">Renk:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => onChange({ crosshairColor: c })}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    settings.crosshairColor === c
                      ? 'scale-125 ring-2 ring-white shadow-[0_0_12px_rgba(255,255,255,0.8)]'
                      : 'hover:scale-110 opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Size & Preview */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Boyut: {settings.crosshairSize}px</span>
            </div>
            <input
              type="range"
              min="2"
              max="20"
              value={settings.crosshairSize}
              onChange={(e) => onChange({ crosshairSize: parseInt(e.target.value) })}
              className="w-full"
            />
            {/* Live Crosshair Preview Box */}
            <div className="h-16 w-full rounded-xl bg-black/60 border border-white/10 flex items-center justify-center relative overflow-hidden mt-1">
              <div
                style={{
                  backgroundColor: settings.crosshairColor,
                  width: `${settings.crosshairSize}px`,
                  height: `${settings.crosshairSize}px`,
                  borderRadius: settings.crosshairStyle === 'circle' || settings.crosshairStyle === 'dot' ? '50%' : '0',
                }}
                className="shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
