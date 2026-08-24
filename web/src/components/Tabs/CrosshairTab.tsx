import React from 'react';
import { Target, Crosshair, Circle, Dot, Zap } from 'lucide-react';
import { DisplaySettings } from '../../types';

interface CrosshairTabProps {
  settings: DisplaySettings;
  onChange: (newSettings: Partial<DisplaySettings>) => void;
}

export const CrosshairTab: React.FC<CrosshairTabProps> = ({ settings, onChange }) => {
  const colors = ['#00FF66', '#FF0055', '#00E5FF', '#FFFF00', '#FFFFFF', '#FF8800'];
  const styles: Array<{ id: DisplaySettings['crosshairStyle']; label: string; icon: React.ReactNode }> = [
    { id: 'dot', label: 'Nokta', icon: <Dot className="w-5 h-5" /> },
    { id: 'cross', label: 'Artı (+)', icon: <Crosshair className="w-5 h-5" /> },
    { id: 'circle', label: 'Daire (O)', icon: <Circle className="w-5 h-5" /> },
    { id: 'gap-cross', label: 'Açık Artı', icon: <Target className="w-5 h-5" /> },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Özel PvP Nişangah (Crosshair Overlay)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Ekranın tam merkezine kilitlenen, tüm oyunların üzerinde saydam çalışan harici donanım nişangahı.
          </p>
        </div>

        {/* Master Toggle */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.crosshairEnabled}
            onChange={(e) => onChange({ crosshairEnabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-12 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Customization Settings */}
        <div className="glass-card p-6 rounded-3xl border border-purple-500/15 flex flex-col gap-5 shadow-xl">
          {/* Style Selector */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold text-zinc-300">Nişangah Deseni / Stili:</span>
            <div className="grid grid-cols-2 gap-2">
              {styles.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onChange({ crosshairStyle: s.id })}
                  className={`p-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold border transition-all ${
                    settings.crosshairStyle === s.id
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
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
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold text-zinc-300">Neon Renk Seçimi:</span>
            <div className="flex items-center gap-3 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => onChange({ crosshairColor: c })}
                  style={{ backgroundColor: c }}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    settings.crosshairColor === c
                      ? 'scale-125 ring-2 ring-white shadow-[0_0_15px_rgba(255,255,255,0.9)]'
                      : 'hover:scale-110 opacity-75 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Size Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-zinc-300 font-semibold">
              <span>Nişangah Boyutu:</span>
              <span className="font-mono text-emerald-400">{settings.crosshairSize}px</span>
            </div>
            <input
              type="range"
              min="2"
              max="24"
              value={settings.crosshairSize}
              onChange={(e) => onChange({ crosshairSize: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>

        {/* Right: Live Preview Box */}
        <div className="glass-card p-6 rounded-3xl border border-purple-500/15 flex flex-col gap-4 items-center justify-center shadow-xl relative min-h-[250px]">
          <span className="absolute top-4 left-4 text-xs font-mono text-zinc-500 uppercase tracking-wider">
            Oyun İçi Görsel Önizleme
          </span>
          <div className="w-full h-48 rounded-2xl bg-black/80 border border-white/10 flex items-center justify-center relative overflow-hidden shadow-inner">
            {/* Ambient Background Grid for preview */}
            <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
            
            {settings.crosshairEnabled ? (
              <div
                style={{
                  backgroundColor: settings.crosshairColor,
                  width: `${settings.crosshairSize}px`,
                  height: `${settings.crosshairSize}px`,
                  borderRadius: settings.crosshairStyle === 'circle' || settings.crosshairStyle === 'dot' ? '50%' : '0',
                }}
                className="shadow-[0_0_12px_rgba(255,255,255,0.9)] transition-all duration-150 relative z-10"
              />
            ) : (
              <span className="text-xs text-zinc-500 font-mono">Nişangah Kapalı (Alt + Z ile Açın)</span>
            )}
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">
            Kısayol Tuşu: <strong className="text-white">Alt + Z</strong> ile oyundayken anında açıp kapatabilirsiniz.
          </span>
        </div>
      </div>
    </div>
  );
};
