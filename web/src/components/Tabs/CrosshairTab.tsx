import React from 'react';
import { Target, Sliders, Sparkles, RotateCcw, Plus, Minus } from 'lucide-react';
import { DisplaySettings } from '../../types';

type CrosshairStyleType = 'dot' | 'cross' | 'circle' | 'gap-cross' | 'x-cross' | 't-cross' | 'cross-dot' | 'square';

interface CrosshairTabProps {
  settings: DisplaySettings;
  onChange: (newSettings: Partial<DisplaySettings>) => void;
}

// Reusable SVG Crosshair Renderer
export const CrosshairSvgRenderer: React.FC<{
  style: CrosshairStyleType;
  color: string;
  size: number;
  thickness: number;
  gap: number;
  dotSize: number;
  outline: number;
  opacity: number;
  width?: number;
  height?: number;
}> = ({
  style,
  color,
  size,
  thickness,
  gap,
  dotSize,
  outline,
  opacity,
  width = 120,
  height = 120,
}) => {
  const cx = 50;
  const cy = 50;
  const s = size;
  const t = Math.max(1, thickness);
  const g = gap;
  const o = outline;
  const glow = `drop-shadow(0 0 ${t + 2}px ${color})`;

  const renderShapes = (isOutline: boolean) => {
    const strokeCol = isOutline ? '#000000' : color;
    const fillCol = isOutline ? '#000000' : color;
    const strokeW = isOutline ? t + o * 2 : t;

    if (isOutline && o <= 0) return null;

    switch (style) {
      case 'dot': {
        const r = dotSize > 0 ? dotSize : s;
        return <circle cx={cx} cy={cy} r={isOutline ? r + o : r} fill={fillCol} />;
      }

      case 'cross':
        return (
          <g stroke={strokeCol} strokeWidth={strokeW} strokeLinecap="square">
            {/* Top */}
            <line x1={cx} y1={cy - g - s} x2={cx} y2={cy - g} />
            {/* Bottom */}
            <line x1={cx} y1={cy + g} x2={cx} y2={cy + g + s} />
            {/* Left */}
            <line x1={cx - g - s} y1={cy} x2={cx - g} y2={cy} />
            {/* Right */}
            <line x1={cx + g} y1={cy} x2={cx + g + s} y2={cy} />
          </g>
        );

      case 't-cross':
        return (
          <g stroke={strokeCol} strokeWidth={strokeW} strokeLinecap="square">
            {/* Bottom */}
            <line x1={cx} y1={cy + g} x2={cx} y2={cy + g + s} />
            {/* Left */}
            <line x1={cx - g - s} y1={cy} x2={cx - g} y2={cy} />
            {/* Right */}
            <line x1={cx + g} y1={cy} x2={cx + g + s} y2={cy} />
          </g>
        );

      case 'gap-cross': {
        const bigGap = Math.max(6, g);
        return (
          <g stroke={strokeCol} strokeWidth={strokeW} strokeLinecap="square">
            <line x1={cx} y1={cy - bigGap - s} x2={cx} y2={cy - bigGap} />
            <line x1={cx} y1={cy + bigGap} x2={cx} y2={cy + bigGap + s} />
            <line x1={cx - bigGap - s} y1={cy} x2={cx - bigGap} y2={cy} />
            <line x1={cx + bigGap} y1={cy} x2={cx + bigGap + s} y2={cy} />
          </g>
        );
      }

      case 'x-cross': {
        const sDiag = s * 0.707;
        const gDiag = g * 0.707;
        return (
          <g stroke={strokeCol} strokeWidth={strokeW} strokeLinecap="square">
            <line x1={cx - gDiag - sDiag} y1={cy - gDiag - sDiag} x2={cx - gDiag} y2={cy - gDiag} />
            <line x1={cx + gDiag} y1={cy + gDiag} x2={cx + gDiag + sDiag} y2={cy + gDiag + sDiag} />
            <line x1={cx + gDiag + sDiag} y1={cy - gDiag - sDiag} x2={cx + gDiag} y2={cy - gDiag} />
            <line x1={cx - gDiag} y1={cy + gDiag} x2={cx - gDiag - sDiag} y2={cy + gDiag + sDiag} />
          </g>
        );
      }

      case 'circle': {
        const r = s + g;
        return (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={strokeCol}
            strokeWidth={strokeW}
            fill="none"
          />
        );
      }

      case 'cross-dot':
        return (
          <g stroke={strokeCol} strokeWidth={strokeW} strokeLinecap="square">
            <line x1={cx} y1={cy - g - s} x2={cx} y2={cy - g} />
            <line x1={cx} y1={cy + g} x2={cx} y2={cy + g + s} />
            <line x1={cx - g - s} y1={cy} x2={cx - g} y2={cy} />
            <line x1={cx + g} y1={cy} x2={cx + g + s} y2={cy} />
            <circle cx={cx} cy={cy} r={isOutline ? Math.max(2, dotSize || t) + o : Math.max(2, dotSize || t)} fill={fillCol} stroke="none" />
          </g>
        );

      case 'square': {
        const halfS = s + g;
        return (
          <rect
            x={cx - halfS}
            y={cy - halfS}
            width={halfS * 2}
            height={halfS * 2}
            stroke={strokeCol}
            strokeWidth={strokeW}
            fill="none"
          />
        );
      }
    }
  };

  return (
    <svg
      viewBox="0 0 100 100"
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity, filter: glow }}
    >
      {/* 1. Outline Layer */}
      {renderShapes(true)}
      {/* 2. Main Color Layer */}
      {renderShapes(false)}
      {/* 3. Center Dot (if explicitly enabled on other styles) */}
      {dotSize > 0 && style !== 'dot' && style !== 'cross-dot' && (
        <>
          {outline > 0 && <circle cx={cx} cy={cy} r={dotSize + outline} fill="#000000" />}
          <circle cx={cx} cy={cy} r={dotSize} fill={color} />
        </>
      )}
    </svg>
  );
};

export const CrosshairTab: React.FC<CrosshairTabProps> = ({ settings, onChange }) => {
  const colors = [
    '#00FF66', // Toxic Green
    '#00E5FF', // Cyan
    '#FF0055', // Red / Crimson
    '#FFFF00', // Yellow
    '#FF00FF', // Neon Magenta
    '#FF8800', // Orange
    '#FFFFFF', // Pure White
    '#9D00FF', // Purple
  ];

  const styles: Array<{ id: CrosshairStyleType; label: string }> = [
    { id: 'cross', label: 'Artı (+)' },
    { id: 'dot', label: 'Nokta' },
    { id: 't-cross', label: 'T Nişan' },
    { id: 'gap-cross', label: 'Açık Artı' },
    { id: 'x-cross', label: 'X Çarpı' },
    { id: 'circle', label: 'Daire' },
    { id: 'cross-dot', label: 'Artı + Nokta' },
    { id: 'square', label: 'Kare' },
  ];

  const currentStyle = (settings.crosshairStyle || 'cross') as CrosshairStyleType;
  const size = settings.crosshairSize ?? 10;
  const thickness = settings.crosshairThickness ?? 2;
  const gap = settings.crosshairGap ?? 4;
  const dotSize = settings.crosshairDotSize ?? 0;
  const outline = settings.crosshairOutline ?? 1;
  const opacity = settings.crosshairOpacity ?? 1.0;

  const handleStep = (key: keyof DisplaySettings, delta: number, min: number, max: number) => {
    const current = (settings[key] as number) ?? min;
    const next = Math.max(min, Math.min(max, current + delta));
    onChange({ [key]: next });
  };

  const handleResetCrosshair = () => {
    onChange({
      crosshairStyle: 'cross',
      crosshairColor: '#00FF66',
      crosshairSize: 10,
      crosshairThickness: 2,
      crosshairGap: 4,
      crosshairDotSize: 0,
      crosshairOutline: 1,
      crosshairOpacity: 1.0,
    });
  };

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
            Ekranın tam merkezine kilitlenen, tüm oyunların üzerinde çalışan şeffaf neon nişangah. <strong className="text-white">Ekran filtresinden tamamen bağımsızdır.</strong>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Preset Styles & Tuning Sliders (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Preset Styles 4x2 Grid */}
          <div className="glass-card p-5 rounded-3xl border border-purple-500/15 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                Nişangah Deseni:
              </span>
              <button
                onClick={handleResetCrosshair}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Nişangahı Varsayılana Sıfırla"
              >
                <RotateCcw className="w-3 h-3" />
                Sıfırla
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {styles.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onChange({ crosshairStyle: s.id })}
                  className={`p-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-[11px] font-semibold border transition-all ${
                    currentStyle === s.id
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.35)] scale-[1.02]'
                      : 'bg-white/5 border-white/5 hover:border-white/15 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <CrosshairSvgRenderer
                    style={s.id}
                    color={currentStyle === s.id ? settings.crosshairColor : '#777'}
                    size={6}
                    thickness={2}
                    gap={2}
                    dotSize={0}
                    outline={1}
                    opacity={1}
                    width={40}
                    height={40}
                  />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Tuning Controls */}
          <div className="glass-card p-5 rounded-3xl border border-purple-500/15 flex flex-col gap-4">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-fuchsia-400" />
              Detaylı Çizgi & Boyut Ayarları:
            </span>

            {/* 1. Length / Size */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Uzunluk (Çizgi Boyu):</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStep('crosshairSize', -1, 2, 40)}
                    className="w-5 h-5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center text-xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono font-bold text-emerald-400 w-10 text-center">{size}px</span>
                  <button
                    onClick={() => handleStep('crosshairSize', 1, 2, 40)}
                    className="w-5 h-5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center text-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={2}
                max={40}
                value={size}
                onChange={(e) => onChange({ crosshairSize: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* 2. Thickness */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Kalınlık (Genişlik):</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStep('crosshairThickness', -1, 1, 10)}
                    className="w-5 h-5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center text-xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono font-bold text-emerald-400 w-10 text-center">{thickness}px</span>
                  <button
                    onClick={() => handleStep('crosshairThickness', 1, 1, 10)}
                    className="w-5 h-5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center text-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={thickness}
                onChange={(e) => onChange({ crosshairThickness: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* 3. Gap */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Merkez Boşluğu (Gap):</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStep('crosshairGap', -1, 0, 30)}
                    className="w-5 h-5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center text-xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono font-bold text-emerald-400 w-10 text-center">{gap}px</span>
                  <button
                    onClick={() => handleStep('crosshairGap', 1, 0, 30)}
                    className="w-5 h-5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center text-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={gap}
                onChange={(e) => onChange({ crosshairGap: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* 4. Center Dot */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Merkez Noktası:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStep('crosshairDotSize', -1, 0, 10)}
                    className="w-5 h-5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center text-xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono font-bold text-emerald-400 w-10 text-center">
                    {dotSize === 0 ? 'Kapalı' : `${dotSize}px`}
                  </span>
                  <button
                    onClick={() => handleStep('crosshairDotSize', 1, 0, 10)}
                    className="w-5 h-5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center text-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={dotSize}
                onChange={(e) => onChange({ crosshairDotSize: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* 5. Outline & Opacity */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
              {/* Outline */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-medium">Siyah Dış Hat:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {outline === 0 ? 'Yok' : `${outline}px`}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={3}
                  value={outline}
                  onChange={(e) => onChange({ crosshairOutline: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Opacity */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-medium">Opaklık / Netlik:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    %{(opacity * 100).toFixed(0)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={1.0}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => onChange({ crosshairOpacity: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Preview & Color Palette (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Color Palette */}
          <div className="glass-card p-5 rounded-3xl border border-purple-500/15 flex flex-col gap-3">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
              Neon Renk:
            </span>
            <div className="flex items-center gap-2.5 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => onChange({ crosshairColor: c })}
                  style={{ backgroundColor: c }}
                  className={`w-8 h-8 rounded-full transition-all ${
                    settings.crosshairColor === c
                      ? 'scale-125 ring-2 ring-white shadow-[0_0_18px_rgba(255,255,255,0.9)]'
                      : 'hover:scale-110 opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
              {/* Color Picker */}
              <label className="w-8 h-8 rounded-full border-2 border-dashed border-zinc-600 hover:border-zinc-400 flex items-center justify-center cursor-pointer transition-all relative overflow-hidden bg-black/40">
                <input
                  type="color"
                  value={settings.crosshairColor}
                  onChange={(e) => onChange({ crosshairColor: e.target.value })}
                  className="opacity-0 absolute inset-0 cursor-pointer"
                />
                <Plus className="w-3.5 h-3.5 text-zinc-400" />
              </label>
            </div>
          </div>

          {/* Live Dynamic Preview Canvas */}
          <div className="glass-card p-5 rounded-3xl border border-purple-500/15 flex flex-col gap-3 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Canlı Ekran Önizleme:
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                settings.crosshairEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-zinc-800 text-zinc-500'
              }`}>
                {settings.crosshairEnabled ? '● Ekranda Açık' : '○ Kapalı'}
              </span>
            </div>

            {/* Simulated Game/Desktop Viewport */}
            <div className="flex-1 min-h-[250px] rounded-2xl bg-[#07050d] border border-white/10 flex items-center justify-center relative overflow-hidden shadow-inner">
              {/* Tactical Grid Background */}
              <div className="absolute inset-0 bg-[radial-gradient(#332454_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

              {/* Center Target Rings (Subtle) */}
              <div className="absolute w-40 h-40 rounded-full border border-purple-500/10 pointer-events-none" />
              <div className="absolute w-20 h-20 rounded-full border border-purple-500/15 pointer-events-none" />
              <div className="absolute w-60 h-[1px] bg-purple-500/10 pointer-events-none" />
              <div className="absolute h-60 w-[1px] bg-purple-500/10 pointer-events-none" />

              {/* Crosshair Render */}
              <div className="relative z-10">
                <CrosshairSvgRenderer
                  style={currentStyle}
                  color={settings.crosshairColor}
                  size={size}
                  thickness={thickness}
                  gap={gap}
                  dotSize={dotSize}
                  outline={outline}
                  opacity={opacity}
                  width={150}
                  height={150}
                />
              </div>

              {/* Status Badge inside Canvas */}
              <div className="absolute bottom-3 left-3 text-[10px] font-mono text-zinc-500 bg-black/60 px-2 py-1 rounded-lg border border-white/5 backdrop-blur-sm pointer-events-none">
                {size}L × {thickness}T • Gap: {gap} • {settings.crosshairColor}
              </div>
            </div>

            {/* Info Footer */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-zinc-400">
                <span className="text-zinc-500">Kısayol:</span><br />
                <strong className="text-white">Alt + Z</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-zinc-400">
                <span className="text-zinc-500">Masaüstü & Oyun:</span><br />
                <strong className="text-emerald-400">Zero-Lag Click-Through ✓</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
