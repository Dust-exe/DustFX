import React from 'react';
import { Target, Circle, Minus, Plus, X as XIcon, CrosshairIcon } from 'lucide-react';
import { DisplaySettings } from '../../types';

type CrosshairStyleType = 'dot' | 'cross' | 'circle' | 'gap-cross' | 'x-cross' | 't-cross' | 'cross-dot' | 'square';

interface CrosshairTabProps {
  settings: DisplaySettings;
  onChange: (newSettings: Partial<DisplaySettings>) => void;
}

// Crosshair preview SVG renderers
const CrosshairPreview: React.FC<{ style: CrosshairStyleType; color: string; size: number }> = ({
  style,
  color,
  size,
}) => {
  const s = size;
  const half = s / 2;
  const glow = `drop-shadow(0 0 ${s / 3}px ${color}) drop-shadow(0 0 ${s / 2}px ${color})`;

  const renderShape = () => {
    switch (style) {
      case 'dot':
        return <circle cx={50} cy={50} r={s} fill={color} style={{ filter: glow }} />;
      case 'cross':
        return (
          <>
            <line x1={50 - s * 3} y1={50} x2={50 + s * 3} y2={50} stroke={color} strokeWidth={Math.max(2, s / 2)} style={{ filter: glow }} />
            <line x1={50} y1={50 - s * 3} x2={50} y2={50 + s * 3} stroke={color} strokeWidth={Math.max(2, s / 2)} style={{ filter: glow }} />
          </>
        );
      case 'x-cross':
        return (
          <>
            <line x1={50 - s * 2.5} y1={50 - s * 2.5} x2={50 + s * 2.5} y2={50 + s * 2.5} stroke={color} strokeWidth={Math.max(2, s / 2)} style={{ filter: glow }} />
            <line x1={50 + s * 2.5} y1={50 - s * 2.5} x2={50 - s * 2.5} y2={50 + s * 2.5} stroke={color} strokeWidth={Math.max(2, s / 2)} style={{ filter: glow }} />
          </>
        );
      case 't-cross':
        return (
          <>
            <line x1={50 - s * 3} y1={50} x2={50 + s * 3} y2={50} stroke={color} strokeWidth={Math.max(2, s / 2)} style={{ filter: glow }} />
            <line x1={50} y1={50} x2={50} y2={50 + s * 3} stroke={color} strokeWidth={Math.max(2, s / 2)} style={{ filter: glow }} />
          </>
        );
      case 'circle':
        return (
          <>
            <circle cx={50} cy={50} r={s * 3} stroke={color} strokeWidth={Math.max(1.5, s / 3)} fill="none" style={{ filter: glow }} />
            <circle cx={50} cy={50} r={s / 2} fill={color} style={{ filter: glow }} />
          </>
        );
      case 'gap-cross':
        const gap = s * 1.5;
        return (
          <>
            <line x1={50 - s * 3} y1={50} x2={50 - gap} y2={50} stroke={color} strokeWidth={Math.max(2, s / 2)} style={{ filter: glow }} />
            <line x1={50 + gap} y1={50} x2={50 + s * 3} y2={50} stroke={color} strokeWidth={Math.max(2, s / 2)} style={{ filter: glow }} />
            <line x1={50} y1={50 - s * 3} x2={50} y2={50 - gap} stroke={color} strokeWidth={Math.max(2, s / 2)} style={{ filter: glow }} />
            <line x1={50} y1={50 + gap} x2={50} y2={50 + s * 3} stroke={color} strokeWidth={Math.max(2, s / 2)} style={{ filter: glow }} />
          </>
        );
      case 'cross-dot':
        return (
          <>
            <line x1={50 - s * 3} y1={50} x2={50 + s * 3} y2={50} stroke={color} strokeWidth={Math.max(2, s / 2)} style={{ filter: glow }} />
            <line x1={50} y1={50 - s * 3} x2={50} y2={50 + s * 3} stroke={color} strokeWidth={Math.max(2, s / 2)} style={{ filter: glow }} />
            <circle cx={50} cy={50} r={s * 0.8} fill={color} style={{ filter: glow }} />
          </>
        );
      case 'square':
        return (
          <rect x={50 - s * 2.5} y={50 - s * 2.5} width={s * 5} height={s * 5} stroke={color} strokeWidth={Math.max(1.5, s / 3)} fill="none" style={{ filter: glow }} />
        );
    }
  };

  return (
    <svg viewBox="0 0 100 100" width={100} height={100} xmlns="http://www.w3.org/2000/svg">
      {renderShape()}
    </svg>
  );
};

export const CrosshairTab: React.FC<CrosshairTabProps> = ({ settings, onChange }) => {
  const colors = ['#00FF66', '#FF0055', '#00E5FF', '#FFFF00', '#FF8800', '#FFFFFF', '#FF00FF', '#00FFFF'];

  const styles: Array<{ id: CrosshairStyleType; label: string }> = [
    { id: 'dot', label: 'Nokta' },
    { id: 'cross', label: 'Artı (+)' },
    { id: 'x-cross', label: 'X Çarpı' },
    { id: 't-cross', label: 'T Nişan' },
    { id: 'gap-cross', label: 'Açık Artı' },
    { id: 'circle', label: 'Daire' },
    { id: 'cross-dot', label: 'Artı + Nokta' },
    { id: 'square', label: 'Kare' },
  ];

  const currentStyle = (settings.crosshairStyle || 'dot') as CrosshairStyleType;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Özel PvP Nişangah — Crosshair Overlay
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Ekranın tam merkezine kilitlenen, tüm oyunların üzerinde çalışan neon nişangah. <strong className="text-white">Ekran filtresini etkilemez.</strong>
          </p>
        </div>
        {/* Master Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 font-mono">Alt + Z</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.crosshairEnabled}
              onChange={(e) => onChange({ crosshairEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Settings */}
        <div className="flex flex-col gap-5">
          {/* Style Selector 4x2 Grid */}
          <div className="glass-card p-5 rounded-3xl border border-purple-500/15">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono mb-3 block">Nişangah Deseni:</span>
            <div className="grid grid-cols-4 gap-2">
              {styles.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onChange({ crosshairStyle: s.id })}
                  className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-[10px] font-semibold border transition-all ${
                    currentStyle === s.id
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'bg-white/5 border-white/5 hover:border-white/15 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <CrosshairPreview
                    style={s.id}
                    color={currentStyle === s.id ? '#00FF66' : '#666'}
                    size={4}
                  />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color + Size */}
          <div className="glass-card p-5 rounded-3xl border border-purple-500/15 flex flex-col gap-4">
            <div>
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono mb-3 block">Neon Renk:</span>
              <div className="flex items-center gap-2.5 flex-wrap">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => onChange({ crosshairColor: c })}
                    style={{ backgroundColor: c }}
                    className={`w-8 h-8 rounded-full transition-all ${
                      settings.crosshairColor === c
                        ? 'scale-125 ring-2 ring-white shadow-[0_0_15px_rgba(255,255,255,0.9)]'
                        : 'hover:scale-110 opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
                {/* Custom Color Picker */}
                <label className="w-8 h-8 rounded-full border-2 border-dashed border-zinc-600 hover:border-zinc-400 flex items-center justify-center cursor-pointer transition-all overflow-hidden">
                  <input
                    type="color"
                    value={settings.crosshairColor}
                    onChange={(e) => onChange({ crosshairColor: e.target.value })}
                    className="opacity-0 absolute w-8 h-8 cursor-pointer"
                  />
                  <Plus className="w-3.5 h-3.5 text-zinc-500" />
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-zinc-300 uppercase tracking-wider font-mono">Boyut:</span>
                <span className="font-mono font-bold text-emerald-400">{settings.crosshairSize}px</span>
              </div>
              <input
                type="range"
                min={2}
                max={20}
                value={settings.crosshairSize}
                onChange={(e) => onChange({ crosshairSize: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="glass-card p-5 rounded-3xl border border-purple-500/15 flex flex-col gap-4">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">Canlı Önizleme:</span>
          <div className="flex-1 min-h-[220px] rounded-2xl bg-black/80 border border-white/10 flex items-center justify-center relative overflow-hidden shadow-inner">
            {/* Grid background */}
            <div className="absolute inset-0 bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />
            {/* Fake game elements */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <div className="w-24 h-32 border border-zinc-500 rounded" />
            </div>

            {settings.crosshairEnabled ? (
              <div className="relative z-10">
                <CrosshairPreview
                  style={currentStyle}
                  color={settings.crosshairColor}
                  size={settings.crosshairSize}
                />
              </div>
            ) : (
              <span className="text-xs text-zinc-500 font-mono z-10">Nişangah kapalı — toggle'ı aç</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-zinc-400">
              <span className="text-zinc-500">Açma/Kapama:</span><br />
              <strong className="text-white">Alt + Z</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-zinc-400">
              <span className="text-zinc-500">Ekran Filtresi:</span><br />
              <strong className="text-emerald-400">Bağımsız ✓</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
