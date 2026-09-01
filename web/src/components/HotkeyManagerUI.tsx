import React, { useState } from 'react';
import { Keyboard } from 'lucide-react';

export const HotkeyManagerUI: React.FC = () => {
  const [hotkeys, setHotkeys] = useState([
    { id: '1', label: 'Max Gama Boost', key: 'F11', action: 'Anlık 2.5x Gama Aydınlatma' },
    { id: '2', label: 'Digital Vibrance Toggle', key: 'F12', action: '%75 Canlılık Aç / Kapat' },
    { id: '3', label: 'Hızlı Sıfırla (Reset)', key: 'F10', action: 'Varsayılan Windows Renklerine Dön' },
    { id: '4', label: 'Crosshair Overlay', key: 'Alt + Z', action: 'Özel Nişangah Aç / Kapat' },
    { id: '5', label: 'DustFX HUD Bildirimi', key: 'Alt + X', action: 'Oyun İçi OSD Durumu Göster' },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    e.preventDefault();
    if (e.key === 'Escape') {
      setEditingId(null);
      return;
    }

    // Ignore standalone modifier keys
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
      return;
    }

    let newKey = '';
    if (e.ctrlKey) newKey += 'Ctrl + ';
    if (e.altKey) newKey += 'Alt + ';
    if (e.shiftKey) newKey += 'Shift + ';
    if (e.metaKey) newKey += 'Win + ';

    // Convert keys like 'a' to 'A' for consistency, use the key name directly for others like 'F11'
    const keyName = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    newKey += keyName;

    setHotkeys(hotkeys.map(h => (h.id === id ? { ...h, key: newKey } : h)));
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-3 glass-card p-5 rounded-2xl border border-purple-500/10">
      <div className="flex items-center gap-2">
        <Keyboard className="w-5 h-5 text-fuchsia-400" />
        <h3 className="text-sm font-bold text-zinc-100 uppercase font-mono">
          Tuş Atamaları (Global Hotkeys)
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {hotkeys.map((h) => (
          <div
            key={h.id}
            data-testid={`hotkey-item-${h.id}`}
            onClick={() => setEditingId(h.id)}
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
              editingId === h.id ? 'bg-white/10 border-fuchsia-500/50' : 'bg-white/5 border-white/5 hover:border-white/20'
            }`}
          >
            <div>
              <div className="text-xs font-semibold text-zinc-200">{h.label}</div>
              <div className="text-[10px] text-zinc-500 font-light mt-0.5">{h.action}</div>
            </div>
            {editingId === h.id ? (
              <input
                data-testid={`hotkey-input-${h.id}`}
                autoFocus
                onBlur={() => setEditingId(null)}
                onKeyDown={(e) => handleKeyDown(e, h.id)}
                className="font-mono text-xs px-2.5 py-1 rounded-lg bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/50 font-bold shadow-sm whitespace-nowrap outline-none w-24 text-center cursor-text"
                value="Press a key..."
                readOnly
              />
            ) : (
              <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold shadow-sm whitespace-nowrap">
                {h.key}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
