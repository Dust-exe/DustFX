import React, { useState, useMemo } from 'react';
import {
  Target,
  Sliders,
  Sparkles,
  RotateCcw,
  Plus,
  Minus,
  Share2,
  Upload,
  Copy,
  CheckCircle,
  Search,
  X,
  ShieldCheck,
} from 'lucide-react';
import { DisplaySettings } from '../../types';

type CrosshairStyleType = 'dot' | 'cross' | 'circle' | 'gap-cross' | 'x-cross' | 't-cross' | 'cross-dot' | 'square';

interface CrosshairTabProps {
  settings: DisplaySettings;
  onChange: (newSettings: Partial<DisplaySettings>) => void;
}

interface CommunityCrosshairPreset {
  id: string;
  name: string;
  creator: string;
  tag: string;
  style: CrosshairStyleType;
  color: string;
  size: number;
  thickness: number;
  gap: number;
  dotSize: number;
  outline: number;
  opacity: number;
}

const communityCrosshairs: CommunityCrosshairPreset[] = [
  {
    id: 'tenz_cyan',
    name: 'TenZ Pro Cyan Cross',
    creator: 'TenZ',
    tag: 'Valorant / CS2',
    style: 'cross',
    color: '#00E5FF',
    size: 6,
    thickness: 2,
    gap: 2,
    dotSize: 0,
    outline: 1,
    opacity: 1.0,
  },
  {
    id: 'scream_dot',
    name: 'Scream One-Tap Dot',
    creator: 'Scream',
    tag: 'One-Tap Headshot',
    style: 'dot',
    color: '#00FF66',
    size: 4,
    thickness: 2,
    gap: 0,
    dotSize: 3,
    outline: 1,
    opacity: 1.0,
  },
  {
    id: 'cs2_classic',
    name: 'CS2 Classic Green',
    creator: 'CS2 Esports',
    tag: 'CS2 / Competitive',
    style: 'cross',
    color: '#00FF66',
    size: 10,
    thickness: 2,
    gap: 4,
    dotSize: 0,
    outline: 1,
    opacity: 1.0,
  },
  {
    id: 'shroud_compact',
    name: 'Shroud Compact Red',
    creator: 'Shroud',
    tag: 'FPS All-Rounder',
    style: 'cross',
    color: '#FF0055',
    size: 7,
    thickness: 2,
    gap: 3,
    dotSize: 0,
    outline: 1,
    opacity: 1.0,
  },
  {
    id: 'shaiiko_t',
    name: 'Shaiiko Yellow T-Cross',
    creator: 'Shaiiko',
    tag: 'R6 / Tactical',
    style: 't-cross',
    color: '#FFFF00',
    size: 8,
    thickness: 2,
    gap: 2,
    dotSize: 0,
    outline: 1,
    opacity: 1.0,
  },
  {
    id: 'white_minimal',
    name: 'Clean White 1px Dot',
    creator: 'AimLab Pro',
    tag: 'Micro-Aiming',
    style: 'dot',
    color: '#FFFFFF',
    size: 3,
    thickness: 1,
    gap: 0,
    dotSize: 2,
    outline: 1,
    opacity: 1.0,
  },
  {
    id: 'neon_gap',
    name: 'Neon Gap Hollow Cross',
    creator: 'Dust Pro',
    tag: 'Clarity / Dynamic',
    style: 'gap-cross',
    color: '#FF00FF',
    size: 9,
    thickness: 2,
    gap: 6,
    dotSize: 0,
    outline: 1,
    opacity: 1.0,
  },
  {
    id: 'tactical_circle',
    name: 'Tactical Precision Circle',
    creator: 'Apex Master',
    tag: 'Apex Legends / Fast Tracking',
    style: 'circle',
    color: '#00FF66',
    size: 6,
    thickness: 2,
    gap: 3,
    dotSize: 2,
    outline: 1,
    opacity: 1.0,
  },
];

// Helper: Generate safe crosshair share code
function generateCrosshairCode(s: DisplaySettings): string {
  const style = s.crosshairStyle || 'cross';
  const color = s.crosshairColor || '#00FF66';
  const size = s.crosshairSize ?? 10;
  const thick = s.crosshairThickness ?? 2;
  const gap = s.crosshairGap ?? 4;
  const dot = s.crosshairDotSize ?? 0;
  const outline = s.crosshairOutline ?? 1;
  const opacity = Math.round((s.crosshairOpacity ?? 1.0) * 100);

  return `DUST-CROSS:${style}:${color}:S${size}:T${thick}:G${gap}:D${dot}:O${outline}:A${opacity}`;
}

// Helper: Parse & safely validate crosshair share code
function parseCrosshairCode(code: string): Partial<DisplaySettings> | null {
  try {
    const trimmed = code.trim();

    // Format 1: DUST-CROSS:style:color:S..:T..:G..:D..:O..:A..
    if (trimmed.startsWith('DUST-CROSS:')) {
      const parts = trimmed.split(':');
      if (parts.length >= 3) {
        const styleRaw = parts[1] as CrosshairStyleType;
        const validStyles: CrosshairStyleType[] = ['dot', 'cross', 'circle', 'gap-cross', 'x-cross', 't-cross', 'cross-dot', 'square'];
        const style = validStyles.includes(styleRaw) ? styleRaw : 'cross';

        const colorRaw = parts[2];
        const color = /^#[0-9A-Fa-f]{6}$/.test(colorRaw) ? colorRaw : '#00FF66';

        let size = 10;
        let thickness = 2;
        let gap = 4;
        let dotSize = 0;
        let outline = 1;
        let opacity = 1.0;

        for (let i = 3; i < parts.length; i++) {
          const p = parts[i];
          if (p.startsWith('S')) size = Math.max(2, Math.min(40, parseInt(p.slice(1)) || 10));
          if (p.startsWith('T')) thickness = Math.max(1, Math.min(10, parseInt(p.slice(1)) || 2));
          if (p.startsWith('G')) gap = Math.max(0, Math.min(30, parseInt(p.slice(1)) || 4));
          if (p.startsWith('D')) dotSize = Math.max(0, Math.min(10, parseInt(p.slice(1)) || 0));
          if (p.startsWith('O')) outline = Math.max(0, Math.min(3, parseInt(p.slice(1)) || 1));
          if (p.startsWith('A')) opacity = Math.max(0.2, Math.min(1.0, (parseInt(p.slice(1)) || 100) / 100));
        }

        return {
          crosshairEnabled: true,
          crosshairStyle: style,
          crosshairColor: color,
          crosshairSize: size,
          crosshairThickness: thickness,
          crosshairGap: gap,
          crosshairDotSize: dotSize,
          crosshairOutline: outline,
          crosshairOpacity: opacity,
        };
      }
    }

    // Format 2: JSON format
    const parsed = JSON.parse(trimmed);
    return {
      crosshairEnabled: true,
      crosshairStyle: parsed.crosshairStyle || 'cross',
      crosshairColor: /^#[0-9A-Fa-f]{6}$/.test(parsed.crosshairColor) ? parsed.crosshairColor : '#00FF66',
      crosshairSize: Math.max(2, Math.min(40, Number(parsed.crosshairSize) || 10)),
      crosshairThickness: Math.max(1, Math.min(10, Number(parsed.crosshairThickness) || 2)),
      crosshairGap: Math.max(0, Math.min(30, Number(parsed.crosshairGap) || 4)),
      crosshairDotSize: Math.max(0, Math.min(10, Number(parsed.crosshairDotSize) || 0)),
      crosshairOutline: Math.max(0, Math.min(3, Number(parsed.crosshairOutline) || 1)),
      crosshairOpacity: Math.max(0.2, Math.min(1.0, Number(parsed.crosshairOpacity) || 1.0)),
    };
  } catch {
    return null;
  }
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
            <line x1={cx} y1={cy - g - s} x2={cx} y2={cy - g} />
            <line x1={cx} y1={cy + g} x2={cx} y2={cy + g + s} />
            <line x1={cx - g - s} y1={cy} x2={cx - g} y2={cy} />
            <line x1={cx + g} y1={cy} x2={cx + g + s} y2={cy} />
          </g>
        );

      case 't-cross':
        return (
          <g stroke={strokeCol} strokeWidth={strokeW} strokeLinecap="square">
            <line x1={cx} y1={cy + g} x2={cx} y2={cy + g + s} />
            <line x1={cx - g - s} y1={cy} x2={cx - g} y2={cy} />
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
      {renderShapes(true)}
      {renderShapes(false)}
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
  const [copiedCode, setCopiedCode] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCodeInput, setImportCodeInput] = useState('');
  const [importError, setImportError] = useState('');
  const [searchPreset, setSearchPreset] = useState('');

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

  const handleCopyShareCode = () => {
    const code = generateCrosshairCode(settings);
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleConfirmImport = () => {
    setImportError('');
    if (!importCodeInput.trim()) return;

    const parsed = parseCrosshairCode(importCodeInput);
    if (!parsed) {
      setImportError('Geçersiz veya bozuk crosshair kodu! Lütfen DUST-CROSS kodunu kontrol edin.');
      return;
    }

    onChange(parsed);
    setShowImportModal(false);
    setImportCodeInput('');
  };

  const handleApplyPreset = (preset: CommunityCrosshairPreset) => {
    onChange({
      crosshairEnabled: true,
      crosshairStyle: preset.style,
      crosshairColor: preset.color,
      crosshairSize: preset.size,
      crosshairThickness: preset.thickness,
      crosshairGap: preset.gap,
      crosshairDotSize: preset.dotSize,
      crosshairOutline: preset.outline,
      crosshairOpacity: preset.opacity,
    });
  };

  // Filtered community presets
  const filteredCommunityPresets = useMemo(() => {
    const q = searchPreset.toLowerCase().trim();
    if (!q) return communityCrosshairs;
    return communityCrosshairs.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.creator.toLowerCase().includes(q) ||
        p.tag.toLowerCase().includes(q)
    );
  }, [searchPreset]);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Özel PvP Nişangah — Donanım Overlay Motoru
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Ekranın tam merkezine kilitlenen, tüm oyunların üzerinde çalışan sıfır gecikmeli donanım nişangahı (<strong className="text-white">Alt+Z</strong>).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400 hidden sm:inline">Kısayol: <strong className="text-emerald-400">Alt+Z</strong></span>
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-white/5 border border-white/10">
            <span className={`text-xs font-mono font-bold ${settings.crosshairEnabled ? 'text-emerald-400' : 'text-zinc-400'}`}>
              {settings.crosshairEnabled ? 'NİŞANGAH AÇIK' : 'NİŞANGAH KAPALI'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.crosshairEnabled}
                onChange={(e) => onChange({ crosshairEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Shapes & Tuning Sliders (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Preset Shapes 4x2 Grid */}
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
                    width={38}
                    height={38}
                  />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Tuning Sliders */}
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

        {/* Right Column: Live Interactive Canvas + Community Presets (5 cols) */}
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
          <div className="glass-card p-5 rounded-3xl border border-purple-500/15 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Canlı Önizleme:
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                settings.crosshairEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-zinc-800 text-zinc-500'
              }`}>
                {settings.crosshairEnabled ? '● Ekranda Açık' : '○ Kapalı'}
              </span>
            </div>

            <div className="h-[180px] rounded-2xl bg-[#07050d] border border-white/10 flex items-center justify-center relative overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(#332454_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />
              <div className="absolute w-32 h-32 rounded-full border border-purple-500/10 pointer-events-none" />
              <div className="absolute w-16 h-16 rounded-full border border-purple-500/15 pointer-events-none" />

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
                  width={120}
                  height={120}
                />
              </div>

              <div className="absolute bottom-2 left-2 text-[9px] font-mono text-zinc-500 bg-black/60 px-2 py-0.5 rounded border border-white/5">
                {size}L × {thickness}T • Gap: {gap}
              </div>
            </div>
          </div>

          {/* Community Crosshair Presets & Search */}
          <div className="glass-card p-5 rounded-3xl border border-purple-500/15 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                Popüler Oyuncu Nişangahları:
              </span>
            </div>

            {/* Mini Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchPreset}
                onChange={(e) => setSearchPreset(e.target.value)}
                placeholder="Oyuncu veya stil ara (TenZ, Scream, CS2...)"
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-[11px] text-white outline-none focus:border-cyan-500 placeholder:text-zinc-500"
              />
            </div>

            {/* Presets List */}
            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
              {filteredCommunityPresets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-purple-950/40 border border-white/5 hover:border-purple-500/40 cursor-pointer flex items-center justify-between gap-3 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center p-0.5">
                      <CrosshairSvgRenderer
                        style={preset.style}
                        color={preset.color}
                        size={preset.size}
                        thickness={preset.thickness}
                        gap={preset.gap}
                        dotSize={preset.dotSize}
                        outline={preset.outline}
                        opacity={preset.opacity}
                        width={28}
                        height={28}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {preset.creator} • {preset.tag}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyPreset(preset);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-bold border border-cyan-500/20"
                  >
                    Uygula
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-purple-500/30 flex flex-col gap-4 shadow-2xl animate-fadeIn relative">
            <button
              onClick={() => setShowImportModal(false)}
              className="absolute top-5 right-5 w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-400" />
              Crosshair Kodunu İçe Aktar
            </h3>
            <p className="text-xs text-zinc-400">
              Diğer oyunculardan aldığınız <strong className="text-white">DUST-CROSS</strong> kodunu buraya yapıştırın.
            </p>

            <textarea
              rows={3}
              value={importCodeInput}
              onChange={(e) => setImportCodeInput(e.target.value)}
              placeholder="Örn: DUST-CROSS:cross:#00FF66:S10:T2:G4:D0:O1:A100"
              className="w-full p-3 rounded-2xl bg-black/50 border border-white/10 text-xs font-mono text-zinc-200 outline-none focus:border-emerald-500 resize-none"
            />

            {importError && (
              <p className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded-xl border border-red-500/30 font-medium">
                ⚠️ {importError}
              </p>
            )}

            <div className="flex items-center gap-2 text-[10px] text-zinc-400 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-500/20 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Güvenlik Doğrulaması: Kod parametreleri otomatik olarak güvenli aralıklara sınırlandırılır.</span>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-white/5">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-300"
              >
                İptal
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={!importCodeInput.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg disabled:opacity-40"
              >
                İçe Aktar & Ekrana Yansıt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
