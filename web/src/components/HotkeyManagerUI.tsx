import React from 'react';
import { Keyboard, Command } from 'lucide-react';

export const HotkeyManagerUI: React.FC = () => {
  const hotkeys = [
    { label: 'Max Gama Boost', key: 'F11', action: 'Anlık 2.5x Gama Aydınlatma' },
    { label: 'Digital Vibrance Toggle', key: 'F12', action: '%75 Canlılık Aç / Kapat' },
    { label: 'Hızlı Sıfırla (Reset)', key: 'F10', action: 'Varsayılan Windows Renklerine Dön' },
    { label: 'Crosshair Overlay', key: 'Alt + Z', action: 'Özel Nişangah Aç / Kapat' },
    { label: 'DustFX HUD Bildirimi', key: 'Alt + X', action: 'Oyun İçi OSD Durumu Göster' },
  ];

  return (
    <div className="flex flex-col gap-3 glass-card p-5 rounded-2xl border border-purple-500/10">
      <div className="flex items-center gap-2">
        <Keyboard className="w-5 h-5 text-fuchsia-400" />
        <h3 className="text-sm font-bold text-zinc-100 uppercase font-mono">
          Tuş Atamaları (Global Hotkeys)
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {hotkeys.map((h, i) => (
          <div
            key={i}
            className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3"
          >
            <div>
              <div className="text-xs font-semibold text-zinc-200">{h.label}</div>
              <div className="text-[10px] text-zinc-500 font-light mt-0.5">{h.action}</div>
            </div>
            <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold shadow-sm whitespace-nowrap">
              {h.key}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
