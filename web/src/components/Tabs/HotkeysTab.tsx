import React from 'react';
import { Keyboard, Bell, Zap } from 'lucide-react';

export const HotkeysTab: React.FC = () => {
  const hotkeys = [
    { label: 'Max Gama Boost', key: 'F11', desc: 'Anlık 2.5x Gama Aydınlatma Aç/Kapat', icon: '🔥' },
    { label: 'Digital Vibrance Toggle', key: 'F12', desc: '%75 Canlılık Aç/Kapat', icon: '🎨' },
    { label: 'Hızlı Sıfırla (Quick Reset)', key: 'F10', desc: 'Varsayılan Windows Renklerine Geri Dön', icon: '🔄' },
    { label: 'Crosshair Overlay', key: 'Alt + Z', desc: 'Özel Nişangahı Aç/Kapat', icon: '🎯' },
    { label: 'DustFX OSD Durumu', key: 'Alt + X', desc: 'Oyun İçi Ekran Bildirimi', icon: '📢' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-fuchsia-400" />
            Global Kısayol Tuşları & OSD Bildirimleri
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Oyun içindeyken ekranı küçültmeden klavyeden tek tuşla anında mod geçişi yapın.
          </p>
        </div>
      </div>

      {/* Hotkeys Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hotkeys.map((h, i) => (
          <div
            key={i}
            className="p-5 rounded-3xl glass-card border border-purple-500/15 flex items-center justify-between gap-4 shadow-lg hover:border-purple-500/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{h.icon}</span>
              <div>
                <div className="text-sm font-bold text-white">{h.label}</div>
                <div className="text-xs text-zinc-400 font-light mt-0.5">{h.desc}</div>
              </div>
            </div>
            <span className="font-mono text-sm px-3.5 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold shadow-md whitespace-nowrap">
              {h.key}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
