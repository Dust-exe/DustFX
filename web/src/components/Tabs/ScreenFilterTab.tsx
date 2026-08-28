import React from 'react';
import { Sun, Palette, Contrast, Eye, Sparkles, Layers, Sliders, Thermometer, ShieldCheck, Zap } from 'lucide-react';
import { DisplaySettings } from '../../types';
import { translations, Language } from '../../translations';

interface ScreenFilterTabProps {
  settings: DisplaySettings;
  onChange: (newSettings: Partial<DisplaySettings>) => void;
  lang?: Language;
}

export const ScreenFilterTab: React.FC<ScreenFilterTabProps> = ({ settings, onChange, lang = 'en' }) => {
  const t = translations[lang];
  const edgeVal = settings.edgeEnhance ?? settings.msaaStrength ?? 0.0;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Sliders className="w-5 h-5 text-fuchsia-400" />
            {t.filterTitle}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {t.filterSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20">
            Gamma: <strong className="text-white">{settings.gamma.toFixed(2)}x</strong>
          </span>
          <span className="px-3 py-1 rounded-xl bg-pink-500/10 text-pink-300 border border-pink-500/20">
            Vibrance: <strong className="text-white">%{settings.digitalVibrance}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Core Lighting & Gamma */}
        <div className="glass-card p-6 rounded-3xl border border-purple-500/15 flex flex-col gap-5 shadow-xl">
          <div className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2 pb-2 border-b border-white/5">
            <Sun className="w-4 h-4 text-amber-400" />
            {lang === 'tr' ? 'Aydınlatma & Renk Canlılığı' : 'Core Lighting & Color Vibrance'}
          </div>

          {/* 1. DCCW Gama Boost */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                {t.gammaTitle}
              </span>
              <span className="font-mono font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2.5 py-0.5 rounded-lg border border-fuchsia-500/30">
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
              <span>0.5x ({lang === 'tr' ? 'Karanlık' : 'Dark'})</span>
              <span>1.0x ({lang === 'tr' ? 'Varsayılan' : 'Default'})</span>
              <span>3.0x ({lang === 'tr' ? 'Maksimum Gece Aydınlatması' : 'Max Night Vision'})</span>
            </div>
          </div>

          {/* 2. Digital Vibrance */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-pink-400" />
                {t.vibranceTitle}
              </span>
              <span className="font-mono font-bold text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-lg border border-pink-500/30">
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
              <span>%0 ({lang === 'tr' ? 'Doğal' : 'Natural'})</span>
              <span>%50 ({lang === 'tr' ? 'Canlı' : 'Vibrant'})</span>
              <span>%100 ({lang === 'tr' ? 'Ultra Doygun' : 'Ultra Vivid'})</span>
            </div>
          </div>

          {/* 3. Gölge Detay Kurtarma */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {t.shadowDetailTitle}
              </span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                %{((settings.shadowDetail ?? 0) * 100).toFixed(0)}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={settings.shadowDetail ?? 0.0}
              onChange={(e) => onChange({ shadowDetail: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>%0 ({lang === 'tr' ? 'Standart' : 'Standard'})</span>
              <span>%50 ({lang === 'tr' ? 'Karanlık Aydınlat' : 'Lifts Shadows'})</span>
              <span>%100 ({lang === 'tr' ? 'Maksimum Detay' : 'Max Recovery'})</span>
            </div>
          </div>

          {/* 4. Parlaklık Ofseti */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-400" />
                {t.brightnessTitle}
              </span>
              <span className="font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
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

          {/* 5. Kontrast */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Contrast className="w-4 h-4 text-purple-400" />
                {t.contrastTitle}
              </span>
              <span className="font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-lg border border-purple-500/30">
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

        {/* Right Card: RGB Channels & Edge Sharpness & Color Temp */}
        <div className="glass-card p-6 rounded-3xl border border-purple-500/15 flex flex-col gap-5 shadow-xl">
          <div className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2 pb-2 border-b border-white/5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            {lang === 'tr' ? 'RGB Renk Kanalları & Kenar Netliği' : 'RGB Channels & Edge Sharpness'}
          </div>

          {/* Renk Sıcaklığı (Kelvin) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-amber-400" />
                {t.colorTempTitle}
              </span>
              <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                {Math.round(settings.colorTemperature ?? 6500)}K {Math.round(settings.colorTemperature ?? 6500) < 6000 ? `(${lang === 'tr' ? 'Sıcak' : 'Warm'})` : Math.round(settings.colorTemperature ?? 6500) > 7000 ? `(${lang === 'tr' ? 'Soğuk' : 'Cool'})` : `(${lang === 'tr' ? 'Nötr' : 'Neutral'})`}
              </span>
            </div>
            <input
              type="range"
              min="2700"
              max="10000"
              step="100"
              value={settings.colorTemperature ?? 6500}
              onChange={(e) => onChange({ colorTemperature: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>2700K ({lang === 'tr' ? 'Gece Filtresi' : 'Night Warm'})</span>
              <span>6500K ({lang === 'tr' ? 'D65 Nötr' : 'Neutral'})</span>
              <span>10000K ({lang === 'tr' ? 'Buz Mavi' : 'Ice Blue'})</span>
            </div>
          </div>

          {/* Red Channel */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-red-400 font-semibold flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
                {lang === 'tr' ? 'Kırmızı Kanalı (R)' : 'Red Channel (R)'}
              </span>
              <span className="font-mono font-bold text-red-300">{settings.rgbRed.toFixed(2)}x</span>
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

          {/* Green Channel */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-semibold flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                {lang === 'tr' ? 'Yeşil Kanalı (G)' : 'Green Channel (G)'}
              </span>
              <span className="font-mono font-bold text-emerald-300">{settings.rgbGreen.toFixed(2)}x</span>
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

          {/* Blue Channel */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-400 font-semibold flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
                {lang === 'tr' ? 'Mavi Kanalı (B)' : 'Blue Channel (B)'}
              </span>
              <span className="font-mono font-bold text-blue-300">{settings.rgbBlue.toFixed(2)}x</span>
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

          {/* CAS / RIS Sharpness */}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-100 font-semibold flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-fuchsia-400" />
                {t.casTitle}
              </span>
              <span className="font-mono font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2.5 py-0.5 rounded-lg border border-fuchsia-500/30">
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
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>%0 ({lang === 'tr' ? 'Doğal' : 'Off'})</span>
              <span>%50 ({lang === 'tr' ? 'Düşman Silüeti' : 'Enemy Focus'})</span>
              <span>%100 ({lang === 'tr' ? 'Maksimum CAS' : 'Max CAS'})</span>
            </div>
          </div>

          {/* Edge & Silhouette Contour Contrast (Outline Sharpness Boost) */}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-100 font-semibold flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" />
                {t.edgeEnhanceTitle}
              </span>
              <span className="font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                {edgeVal > 0 ? `+${(edgeVal * 100).toFixed(0)}% ${lang === 'tr' ? 'Belirgin' : 'Pop'}` : (lang === 'tr' ? 'Kapalı' : 'Off')}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={edgeVal}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onChange({ edgeEnhance: val, msaaStrength: val });
              }}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>{lang === 'tr' ? 'Kapalı' : 'Off'}</span>
              <span>{lang === 'tr' ? '%50 Kontur Netliği' : '50% Edge Outline'}</span>
              <span>{lang === 'tr' ? '%100 Keskin Silüet' : '100% Crisp Silhouette'}</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              {t.edgeEnhanceDesc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
