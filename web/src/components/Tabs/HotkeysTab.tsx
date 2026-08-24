import React, { useState } from 'react';
import { Keyboard, Plus, Trash2, Edit3, Check, X } from 'lucide-react';

interface HotkeyEntry {
  id: string;
  action: string;
  key: string;
  desc: string;
  icon: string;
  editable: boolean;
}

const defaultHotkeys: HotkeyEntry[] = [
  { id: 'max_gamma', action: 'Max Gama Boost', key: 'F11', desc: 'Anlık 2.5x Gama Aydınlatma Aç/Kapat', icon: '🔥', editable: true },
  { id: 'vibrance', action: 'Digital Vibrance Toggle', key: 'F12', desc: '%75 Canlılık Aç/Kapat', icon: '🎨', editable: true },
  { id: 'reset', action: 'Hızlı Sıfırla', key: 'F10', desc: 'Varsayılan Windows Renklerine Dön', icon: '🔄', editable: true },
  { id: 'crosshair', action: 'Crosshair Overlay', key: 'Alt+Z', desc: 'Özel Nişangahı Aç/Kapat', icon: '🎯', editable: true },
  { id: 'osd', action: 'DustFX OSD Panel', key: 'Alt+X', desc: 'Oyun İçi Ekran Bildirimi', icon: '📢', editable: true },
];

export const HotkeysTab: React.FC = () => {
  const [hotkeys, setHotkeys] = useState<HotkeyEntry[]>(defaultHotkeys);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [listeningFor, setListeningFor] = useState<string | null>(null);
  const [pressedKey, setPressedKey] = useState<string>('');

  const startListening = (id: string) => {
    setListeningFor(id);
    setPressedKey('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    e.preventDefault();
    const keys: string[] = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');

    const key = e.key;
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
      keys.push(key.length === 1 ? key.toUpperCase() : key);
    }

    const combo = keys.join('+');
    if (combo && !['Control', 'Alt', 'Shift'].includes(combo)) {
      setPressedKey(combo);
    }
  };

  const confirmKey = (id: string) => {
    if (!pressedKey) return;
    setHotkeys((prev) =>
      prev.map((h) => (h.id === id ? { ...h, key: pressedKey } : h))
    );
    setListeningFor(null);
    setPressedKey('');
  };

  const cancelListening = () => {
    setListeningFor(null);
    setPressedKey('');
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div className="pb-3 border-b border-white/5">
        <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
          <Keyboard className="w-5 h-5 text-fuchsia-400" />
          Global Kısayol Tuşları
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Düzenle butonuna tıklayın ve ardından yeni kısayol tuşuna basın. Oyun içindeyken her yerden çalışır.
        </p>
      </div>

      {/* Hotkeys List */}
      <div className="flex flex-col gap-3">
        {hotkeys.map((h) => {
          const isListening = listeningFor === h.id;
          return (
            <div
              key={h.id}
              className={`p-4 rounded-2xl glass-card border flex items-center justify-between gap-4 transition-all ${
                isListening
                  ? 'border-fuchsia-500/60 shadow-[0_0_20px_rgba(192,38,211,0.2)]'
                  : 'border-purple-500/15 hover:border-purple-500/30'
              }`}
            >
              {/* Left Info */}
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{h.icon}</span>
                <div>
                  <div className="text-sm font-bold text-white">{h.action}</div>
                  <div className="text-xs text-zinc-400 font-light">{h.desc}</div>
                </div>
              </div>

              {/* Right: Key + Edit */}
              <div className="flex items-center gap-2">
                {isListening ? (
                  <>
                    <div
                      tabIndex={0}
                      onKeyDown={(e) => handleKeyDown(e, h.id)}
                      className="min-w-[120px] px-3 py-2 rounded-xl bg-fuchsia-950/60 border-2 border-fuchsia-500 text-sm font-mono text-fuchsia-200 text-center outline-none animate-pulse focus:outline-none cursor-text"
                      autoFocus
                    >
                      {pressedKey || <span className="text-zinc-500">Tuşa bas...</span>}
                    </div>
                    <button
                      onClick={() => confirmKey(h.id)}
                      disabled={!pressedKey}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-500/80 hover:bg-emerald-500 text-white disabled:opacity-30 transition-all"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </button>
                    <button
                      onClick={cancelListening}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-sm px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold shadow-md whitespace-nowrap">
                      {h.key}
                    </span>
                    {h.editable && (
                      <button
                        onClick={() => startListening(h.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-all border border-white/5"
                        title="Kısayolu Değiştir"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-300 font-light">
        <strong className="text-white">Not:</strong> Kısayol değişiklikleri anlık etkinleşmez — uygulamayı yeniden başlattığınızda kayıt edilir. F9–F12 ve Alt+[tuş] kombinasyonları önerilir.
      </div>
    </div>
  );
};
