import React, { useState, useMemo, useEffect } from 'react';
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
  Bookmark,
  Trash2,
  Save,
  Eye,
  Tv,
  Zap,
} from 'lucide-react';
import { api } from '../../api';
import { DisplaySettings, SavedCrosshairPreset } from '../../types';
import { translations, Language } from '../../translations';

type CrosshairStyleType = 'dot' | 'cross' | 'circle' | 'gap-cross' | 'x-cross' | 't-cross' | 'cross-dot' | 'square';

interface CrosshairTabProps {
  settings: DisplaySettings;
  onChange: (newSettings: Partial<DisplaySettings>) => void;
  lang?: Language;
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
    id: 'circle_aim',
    name: 'Neon Circle Holo',
    creator: 'Rust Combat',
    tag: 'Close Quarters',
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

export const CrosshairTab: React.FC<CrosshairTabProps> = ({ settings, onChange, lang = 'en' }) => {
  const t = translations[lang];
  const [copiedCode, setCopiedCode] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [importCodeInput, setImportCodeInput] = useState('');
  const [importError, setImportError] = useState('');
  const [searchPreset, setSearchPreset] = useState('');

  // Persistent Custom Saved Crosshairs
  const [savedPresets, setSavedPresets] = useState<SavedCrosshairPreset[]>(() => {
    try {
      const stored = localStorage.getItem('dustfx_custom_crosshairs');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const savePresetsToStorage = (list: SavedCrosshairPreset[]) => {
    setSavedPresets(list);
    try {
      localStorage.setItem('dustfx_custom_crosshairs', JSON.stringify(list));
    } catch {}
  };

  const handleSaveCustomPreset = () => {
    const name = newPresetName.trim() || `Crosshair #${savedPresets.length + 1}`;
    const newPreset: SavedCrosshairPreset = {
      id: `custom_${Date.now()}`,
      name,
      createdAt: new Date().toLocaleDateString(),
      style: (settings.crosshairStyle || 'cross') as CrosshairStyleType,
      color: settings.crosshairColor || '#00FF66',
      size: settings.crosshairSize ?? 10,
      thickness: settings.crosshairThickness ?? 2,
      gap: settings.crosshairGap ?? 4,
      dotSize: settings.crosshairDotSize ?? 0,
      outline: settings.crosshairOutline ?? 1,
      opacity: settings.crosshairOpacity ?? 1.0,
    };

    savePresetsToStorage([newPreset, ...savedPresets]);
    setNewPresetName('');
    setShowSavePresetModal(false);
  };

  const handleDeleteCustomPreset = (id: string) => {
    savePresetsToStorage(savedPresets.filter((p) => p.id !== id));
  };

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
    { id: 'cross', label: lang === 'tr' ? 'Artı (+)' : 'Cross (+)' },
    { id: 'dot', label: lang === 'tr' ? 'Nokta' : 'Dot' },
    { id: 't-cross', label: lang === 'tr' ? 'T Nişan' : 'T-Cross' },
    { id: 'gap-cross', label: lang === 'tr' ? 'Açık Artı' : 'Gap Cross' },
    { id: 'x-cross', label: lang === 'tr' ? 'X Çarpı' : 'X-Cross' },
    { id: 'circle', label: lang === 'tr' ? 'Daire' : 'Circle' },
    { id: 'cross-dot', label: lang === 'tr' ? 'Artı + Nokta' : 'Cross + Dot' },
    { id: 'square', label: lang === 'tr' ? 'Kare' : 'Square' },
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
      setImportError(lang === 'tr' ? 'Geçersiz veya bozuk crosshair kodu!' : 'Invalid or corrupt crosshair code!');
      return;
    }

    onChange(parsed);
    setShowImportModal(false);
    setImportCodeInput('');
  };

  const handleApplyPreset = (preset: CommunityCrosshairPreset | SavedCrosshairPreset) => {
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
    <div className="flex flex-col gap-6 animate-fadeIn select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            {t.crosshairTitle}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {t.crosshairSubtitle}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopyShareCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold border border-white/10 transition-all active:scale-95"
            title={t.copyShareCode}
          >
            {copiedCode ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">{lang === 'tr' ? 'Kopyalandı!' : 'Copied!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>{t.copyShareCode}</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold border border-white/10 transition-all active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.importShareCode}</span>
          </button>

          <button
            onClick={() => setShowSavePresetModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-xs font-bold shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-all active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{t.savePresetBtn}</span>
          </button>

          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10">
            <span className={`text-xs font-mono font-bold ${settings.crosshairEnabled ? 'text-emerald-400' : 'text-zinc-400'}`}>
              {settings.crosshairEnabled ? t.crosshairActive : t.crosshairInactive}
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
                {t.stylesTitle}:
              </span>
              <button
                onClick={handleResetCrosshair}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
                title={lang === 'tr' ? 'Varsayılana Sıfırla' : 'Reset Crosshair'}
              >
                <RotateCcw className="w-3 h-3" />
                {t.reset}
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
              {lang === 'tr' ? 'Detaylı Çizgi & Boyut Ayarları:' : 'Tuning Sliders & Geometry:'}
            </span>

            {/* 1. Length / Size */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">{t.size}:</span>
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
                <span className="text-zinc-300 font-medium">{t.thickness}:</span>
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
                <span className="text-zinc-300 font-medium">{t.gap}:</span>
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
                <span className="text-zinc-300 font-medium">{t.dotSize}:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStep('crosshairDotSize', -1, 0, 10)}
                    className="w-5 h-5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center text-xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono font-bold text-emerald-400 w-10 text-center">
                    {dotSize === 0 ? (lang === 'tr' ? 'Kapalı' : 'Off') : `${dotSize}px`}
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
                  <span className="text-zinc-300 font-medium">{t.outline}:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {outline === 0 ? (lang === 'tr' ? 'Yok' : 'None') : `${outline}px`}
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
                  <span className="text-zinc-300 font-medium">{t.opacity}:</span>
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

          {/* User's Saved Named Crosshairs Section */}
          <div className="glass-card p-5 rounded-3xl border border-purple-500/20 bg-[#0e0a1a]/60 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-fuchsia-400" />
                {t.savedPresetsHeader} ({savedPresets.length})
              </span>
              <button
                onClick={() => setShowSavePresetModal(true)}
                className="text-[11px] font-bold text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                {lang === 'tr' ? 'Yeni Ekle' : 'Save Current'}
              </button>
            </div>

            {savedPresets.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-2">
                {t.noSavedPresets}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[200px] overflow-y-auto pr-1">
                {savedPresets.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className="p-2.5 rounded-2xl bg-white/[0.04] hover:bg-purple-950/40 border border-white/5 hover:border-purple-500/40 cursor-pointer flex items-center justify-between gap-2.5 transition-all group"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-8 h-8 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center p-0.5 flex-shrink-0">
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
                      <div className="truncate">
                        <div className="text-xs font-bold text-white group-hover:text-fuchsia-300 transition-colors truncate">
                          {preset.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {preset.style} • {preset.createdAt}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyPreset(preset);
                        }}
                        className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/20"
                        title={t.applyPreset}
                      >
                        {t.applyPreset}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomPreset(preset.id);
                        }}
                        className="p-1 rounded-lg bg-white/5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                        title={t.deletePreset}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Interactive Canvas + Community Presets (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Color Palette */}
          <div className="glass-card p-5 rounded-3xl border border-purple-500/15 flex flex-col gap-3">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
              {t.colorsTitle}:
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
                {t.previewTitle}:
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                settings.crosshairEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-zinc-800 text-zinc-500'
              }`}>
                {settings.crosshairEnabled ? `● ${t.crosshairActive}` : `○ ${t.crosshairInactive}`}
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
                {t.communityHeader}:
              </span>
            </div>

            {/* Mini Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchPreset}
                onChange={(e) => setSearchPreset(e.target.value)}
                placeholder={t.searchPresetsPlaceholder}
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
                    {t.applyPreset}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sniper Zoom Lens Section */}
      <div className="glass-card p-6 rounded-3xl border border-fuchsia-500/25 bg-[#0e0a22]/80 flex flex-col gap-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.3)]">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                {t.zoomHeader}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                  Zero Lag
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                {t.zoomSub}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                const res = await api.toggleZoom();
                onChange({ sniperZoomEnabled: res.active });
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-xs font-mono font-bold shadow-[0_0_15px_rgba(217,70,239,0.35)] transition-all active:scale-95"
            >
              <Zap className="w-3.5 h-3.5" />
              {lang === 'tr' ? 'Zoom Test (Aç / Kapat)' : 'Test Zoom Lens'}
            </button>
          </div>
        </div>

        {/* Zoom Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {/* Left Column: Sliders & Shape */}
          <div className="flex flex-col gap-4">
            {/* Scale Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-fuchsia-400" />
                  {t.zoomScale}
                </span>
                <span className="font-mono font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2.5 py-0.5 rounded-lg border border-fuchsia-500/30">
                  {(settings.sniperZoomScale ?? 2.0).toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="1.2"
                max="4.0"
                step="0.1"
                value={settings.sniperZoomScale ?? 2.0}
                onChange={(e) => onChange({ sniperZoomScale: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>1.2x ({lang === 'tr' ? 'Hafif' : 'Mild'})</span>
                <span>2.0x ({lang === 'tr' ? 'Standart' : 'Standard'})</span>
                <span>4.0x ({lang === 'tr' ? 'Maksimum Dürbün' : 'Max Scope'})</span>
              </div>
            </div>

            {/* Lens Size / Diameter */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-200">
                  {t.zoomSize}
                </span>
                <span className="font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-lg border border-purple-500/30">
                  {settings.sniperZoomSize ?? 260}px
                </span>
              </div>
              <input
                type="range"
                min="120"
                max="480"
                step="10"
                value={settings.sniperZoomSize ?? 260}
                onChange={(e) => onChange({ sniperZoomSize: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Lens Shape */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-zinc-300">
                {t.zoomShape}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onChange({ sniperZoomShape: 'circle' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
                    (settings.sniperZoomShape ?? 'circle') === 'circle'
                      ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.25)]'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full border border-current"></span>
                  {t.zoomShapeCircle}
                </button>
                <button
                  onClick={() => onChange({ sniperZoomShape: 'square' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
                    settings.sniperZoomShape === 'square'
                      ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.25)]'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  <span className="w-3 h-3 rounded-sm border border-current"></span>
                  {t.zoomShapeSquare}
                </button>
              </div>
            </div>

            {/* Trigger Mode */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-zinc-300">
                {t.zoomMode}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onChange({ sniperZoomMode: 'hold' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all ${
                    (settings.sniperZoomMode ?? 'hold') === 'hold'
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  {t.zoomModeHold}
                </button>
                <button
                  onClick={() => onChange({ sniperZoomMode: 'toggle' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all ${
                    settings.sniperZoomMode === 'toggle'
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  {t.zoomModeToggle}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Border, Center Dot & Live Preview */}
          <div className="flex flex-col gap-4">
            {/* Border Reticle Color & Width */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300">
                  {t.zoomBorderColor}
                </span>
                <span className="font-mono font-bold text-xs" style={{ color: settings.sniperZoomBorderColor ?? '#A855F7' }}>
                  {settings.sniperZoomBorderColor ?? '#A855F7'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {['#A855F7', '#F59E0B', '#00FF66', '#00E5FF', '#FF0055', '#FFFFFF'].map((c) => (
                  <button
                    key={c}
                    onClick={() => onChange({ sniperZoomBorderColor: c })}
                    className={`w-7 h-7 rounded-xl border-2 transition-transform ${
                      (settings.sniperZoomBorderColor ?? '#A855F7') === c ? 'scale-110 border-white shadow-lg' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Center Dot Toggle */}
            <label className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 cursor-pointer">
              <span className="text-xs font-semibold text-zinc-200">
                {t.zoomShowDot}
              </span>
              <input
                type="checkbox"
                checked={settings.sniperZoomShowDot ?? true}
                onChange={(e) => onChange({ sniperZoomShowDot: e.target.checked })}
                className="w-4 h-4 accent-fuchsia-500 cursor-pointer"
              />
            </label>

            {/* Borderless / DWM Warning Indicator */}
            {settings.crosshairEnabled && (
              <div className="mt-4 flex items-center justify-between bg-black/40 border border-fuchsia-500/20 p-3 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-emerald-400 tracking-wider">COMPATIBILITY: SAFE</div>
                    <div className="text-[10px] text-zinc-400">{lang === 'tr' ? 'Oyunlarınızı Borderless modda oynayın' : 'Play your games in Borderless Windowed'}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    alert(lang === 'tr' ? 'DustFX Overlay, Anti-Cheat sistemlerine takılmamak için Borderless (Penceresiz Tam Ekran) modunda çalışır. Oyununuz Exclusive Fullscreen ise crosshair gözükmeyebilir.' : 'DustFX Overlay runs in Borderless Windowed mode to stay safe from Anti-Cheats. If your game is in Exclusive Fullscreen, the crosshair might not be visible.');
                  }}
                  className="px-3 py-1.5 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-300 text-[10px] rounded-xl font-bold transition-all border border-fuchsia-500/30 shadow-[0_0_10px_rgba(217,70,239,0.2)]"
                >
                  {lang === 'tr' ? 'Neden?' : 'Why?'}
                </button>
              </div>
            )}

            {/* Live Interactive Scope Preview */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col items-center justify-center gap-3 relative overflow-hidden h-[180px]">
              {/* Background simulated enemy texture */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
              
              {/* Magnified Lens Simulation */}
              <div
                className={`relative flex items-center justify-center transition-all duration-300 ${
                  (settings.sniperZoomShape ?? 'circle') === 'circle' ? 'rounded-full' : 'rounded-2xl'
                }`}
                style={{
                  width: Math.min(140, (settings.sniperZoomSize ?? 260) * 0.45),
                  height: Math.min(140, (settings.sniperZoomSize ?? 260) * 0.45),
                  border: `${Math.max(1, settings.sniperZoomBorderWidth ?? 2)}px solid ${settings.sniperZoomBorderColor ?? '#A855F7'}`,
                  boxShadow: `0 0 20px ${settings.sniperZoomBorderColor ?? '#A855F7'}40`,
                  backgroundColor: 'rgba(15, 10, 30, 0.75)',
                }}
              >
                {/* Background grid magnified */}
                <div
                  className="absolute inset-0 opacity-40 bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:24px_24px]"
                  style={{
                    transform: `scale(${settings.sniperZoomScale ?? 2.0})`,
                  }}
                />

                {/* Target silhouette indicator */}
                <div className="w-1.5 h-1.5 rounded-full bg-red-500/80 animate-ping absolute" />

                {/* Crosshair rendered on TOP at 1x original crisp scale */}
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
                    width={48}
                    height={48}
                  />
                </div>
              </div>

              <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1.5 z-10">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'tr' ? 'Nişangah zoom üstünde 1x netlikte izole edilir' : 'Crosshair isolated at 1x native sharpness'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Custom Preset Modal */}
      {showSavePresetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-purple-500/30 flex flex-col gap-4 shadow-2xl animate-fadeIn relative">
            <button
              onClick={() => setShowSavePresetModal(false)}
              className="absolute top-5 right-5 w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-fuchsia-400" />
              {t.savePresetModalTitle}
            </h3>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/50 border border-white/10">
              <CrosshairSvgRenderer
                style={currentStyle}
                color={settings.crosshairColor}
                size={size}
                thickness={thickness}
                gap={gap}
                dotSize={dotSize}
                outline={outline}
                opacity={opacity}
                width={40}
                height={40}
              />
              <div className="text-xs text-zinc-300 font-mono">
                {currentStyle} • {settings.crosshairColor} • {size}px
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300 font-mono">
                {lang === 'tr' ? 'Nişangah İsmi:' : 'Preset Name:'}
              </label>
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder={t.presetNamePlaceholder}
                autoFocus
                className="w-full p-3 rounded-2xl bg-black/50 border border-white/15 text-xs text-white outline-none focus:border-fuchsia-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-white/5">
              <button
                onClick={() => setShowSavePresetModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-300"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveCustomPreset}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-xs font-bold text-white shadow-lg active:scale-95"
              >
                {t.savePresetBtn}
              </button>
            </div>
          </div>
        </div>
      )}

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
              {t.importModalTitle}
            </h3>
            <p className="text-xs text-zinc-400">
              {t.importModalDesc}
            </p>

            <textarea
              rows={3}
              value={importCodeInput}
              onChange={(e) => setImportCodeInput(e.target.value)}
              placeholder="e.g. DUST-CROSS:cross:#00FF66:S10:T2:G4:D0:O1:A100"
              className="w-full p-3 rounded-2xl bg-black/50 border border-white/10 text-xs font-mono text-zinc-200 outline-none focus:border-emerald-500 resize-none"
            />

            {importError && (
              <p className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded-xl border border-red-500/30 font-medium">
                ⚠️ {importError}
              </p>
            )}

            <div className="flex items-center gap-2 text-[10px] text-zinc-400 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-500/20 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{lang === 'tr' ? 'Güvenlik Doğrulaması: Kod parametreleri otomatik olarak güvenli aralıklara sınırlandırılır.' : 'Security Verified: Code parameters are safely clamped to hardware limits.'}</span>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-white/5">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-300"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={!importCodeInput.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg disabled:opacity-40"
              >
                {t.importBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
