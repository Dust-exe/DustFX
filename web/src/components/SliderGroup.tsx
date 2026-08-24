import React from 'react';
import { Sun, Palette, Contrast, Eye, Sparkles, Layers, Sliders } from 'lucide-react';
import { DisplaySettings } from '../types';

interface SliderGroupProps {
  settings: DisplaySettings;
  onChange: (newSettings: Partial<DisplaySettings>) => void;
}

export const SliderGroup: React.FC<SliderGroupProps> = ({ settings, onChange }) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-fuchsia-400" />
          <h2 className="text-base font-bold tracking-wide text-zinc-100 uppercase font-mono">
            Ekran Görüntü Filtre Ayarları
          </h2>
        </div>
        <span className="text-xs text-zinc-400 font-mono">
          GAMA: <span className="text-fuchsia-400 font-bold">{settings.gamma.toFixed(2)}x</span> | CANLILIK: <span className="text-fuchsia-400 font-bold">%{settings.digitalVibrance}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Core Gamma & Vibrance */}
        <div className="flex flex-col gap-5 glass-card p-5 rounded-2xl border border-purple-500/10 shadow-lg">
          {/* 1. DCCW Gama Boost */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-400" />
                DCCW Gama Boost (Gece Görüşü)
              </span>
              <span className="font-mono font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded-md border border-fuchsia-500/20">
                {settings.gamma.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.05"
              value={settings.gamma}
              onChange={(e) => onChange({ gamma: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>0.5x (Karanlık)</span>
              <span>1.0x (Standart)</span>
              <span>3.0x (Ultra Aydınlık)</span>
            </div>
          </div>

          {/* 2. Digital Vibrance */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-pink-400" />
                Digital Vibrance (Canlılık)
              </span>
              <span className="font-mono font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/20">
                %{settings.digitalVibrance}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={settings.digitalVibrance}
              onChange={(e) => onChange({ digitalVibrance: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>%0 (Doğal)</span>
              <span>%50 (Dengeli)</span>
              <span>%100 (Maksimum Doygunluk)</span>
            </div>
          </div>

          {/* 3. Parlaklık Ofset */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-400" />
                Parlaklık Ofset (Gölge Detay)
              </span>
              <span className="font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                {settings.brightnessOffset >= 0 ? `+${(settings.brightnessOffset * 100).toFixed(0)}%` : `${(settings.brightnessOffset * 100).toFixed(0)}%`}
              </span>
            </div>
            <input
              type="range"
              min="-0.5"
              max="0.5"
              step="0.02"
              value={settings.brightnessOffset}
              onChange={(e) => onChange({ brightnessOffset: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* 4. Kontrast Keskinliği */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Contrast className="w-4 h-4 text-purple-400" />
                Kontrast Keskinliği
              </span>
              <span className="font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                {settings.contrast.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={settings.contrast}
              onChange={(e) => onChange({ contrast: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>

        {/* Right Column: RGB Channels & Sharpening */}
        <div className="flex flex-col gap-5 glass-card p-5 rounded-2xl border border-purple-500/10 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200 uppercase tracking-wider pb-1 border-b border-white/5 font-mono">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            RGB Renk Kanalları (Özel Ayar)
          </div>

          {/* Kırmızı Kanalı */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-red-400 font-medium flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                Kırmızı Kanalı (R)
              </span>
              <span className="font-mono text-red-300 font-bold">{settings.rgbRed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.8"
              step="0.02"
              value={settings.rgbRed}
              onChange={(e) => onChange({ rgbRed: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Yeşil Kanalı */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                Yeşil Kanalı (G)
              </span>
              <span className="font-mono text-emerald-300 font-bold">{settings.rgbGreen.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.8"
              step="0.02"
              value={settings.rgbGreen}
              onChange={(e) => onChange({ rgbGreen: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Mavi Kanalı */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-400 font-medium flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                Mavi Kanalı (B)
              </span>
              <span className="font-mono text-blue-300 font-bold">{settings.rgbBlue.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.8"
              step="0.02"
              value={settings.rgbBlue}
              onChange={(e) => onChange({ rgbBlue: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Keskinlik (CAS / RIS) */}
          <div className="flex flex-col gap-1.5 mt-2 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-200 font-semibold flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-fuchsia-400" />
                Düşman Netliği & Keskinlik (CAS)
              </span>
              <span className="font-mono font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded-md">
                %{(settings.sharpness * 100).toFixed(0)}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={settings.sharpness}
              onChange={(e) => onChange({ sharpness: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
