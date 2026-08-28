import React, { useState, useEffect } from 'react';
import { Keyboard, Edit3, Check, X, Sparkles, Trash2 } from 'lucide-react';
import { api } from '../../api';
import { HotkeyConfig, GameProfile } from '../../types';

interface HotkeyEntry {
  id: string;
  action: string;
  key: string;
  desc: string;
  icon: string;
  isProfile?: boolean;
  profileId?: string;
}

interface HotkeysTabProps {
  hotkeys?: HotkeyConfig;
  onHotkeysChange?: (cfg: HotkeyConfig) => void;
  profiles?: GameProfile[];
  onProfilesChange?: (profiles: GameProfile[]) => void;
}

export const HotkeysTab: React.FC<HotkeysTabProps> = ({
  hotkeys,
  onHotkeysChange,
  profiles = [],
  onProfilesChange,
}) => {
  const [currentHotkeys, setCurrentHotkeys] = useState<HotkeyConfig>(
    hotkeys || {
      maxGammaKey: 'F11',
      vibranceKey: 'F12',
      quickResetKey: 'F10',
      toggleOverlayKey: 'Alt+X',
      toggleCrosshairKey: 'Alt+Z',
      sniperZoomKey: 'V',
    }
  );

  const [listeningFor, setListeningFor] = useState<string | null>(null);
  const [pressedKey, setPressedKey] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (hotkeys) {
      setCurrentHotkeys(hotkeys);
    } else {
      api.getHotkeys().then((cfg) => {
        setCurrentHotkeys(cfg);
        if (onHotkeysChange) onHotkeysChange(cfg);
      });
    }
  }, [hotkeys, onHotkeysChange]);

  const globalEntries: HotkeyEntry[] = [
    {
      id: 'maxGammaKey',
      action: 'Max Gama Boost (Anlık Aydınlatma)',
      key: currentHotkeys.maxGammaKey,
      desc: 'Zifiri karanlığı ve gölgeleri 2.5x netleştiren anlık donanım gama aydınlatması.',
      icon: '🔥',
    },
    {
      id: 'quickResetKey',
      action: 'Hızlı Sıfırla (Default Windows)',
      key: currentHotkeys.quickResetKey,
      desc: 'Tüm filtreleri kapatır ve monitörü standart Windows ayarlarına döndürür.',
      icon: '🔄',
    },
    {
      id: 'vibranceKey',
      action: 'Digital Vibrance Toggle',
      key: currentHotkeys.vibranceKey,
      desc: '%75 Donanımsal Renk Doygunluğunu Aç/Kapat (NVIDIA NVAPI / AMD DVC).',
      icon: '🎨',
    },
    {
      id: 'toggleCrosshairKey',
      action: 'Özel Nişangah (Crosshair Overlay)',
      key: currentHotkeys.toggleCrosshairKey,
      desc: 'Şeffaf ekran ortası nişangahını anında açar veya kapatır.',
      icon: '🎯',
    },
    {
      id: 'sniperZoomKey',
      action: 'Sniper Zoom Lens (Ekran Büyüteci)',
      key: currentHotkeys.sniperZoomKey || 'V',
      desc: 'Ekran ortası yakınlaştırma lensini/dürbününü açar veya basılı tutar.',
      icon: '🔭',
    },
    {
      id: 'toggleOverlayKey',
      action: 'DustFX OSD Bilgi Paneli',
      key: currentHotkeys.toggleOverlayKey,
      desc: 'Oyun içi sol üst durum bildirimini ekranda gösterir.',
      icon: '📢',
    },
  ];

  const startListening = (id: string) => {
    setListeningFor(id);
    setPressedKey('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    const keys: string[] = [];
    if (e.ctrlKey) keys.push('CTRL');
    if (e.altKey) keys.push('ALT');
    if (e.shiftKey) keys.push('SHIFT');

    let keyName = '';
    const code = e.code;

    if (code.startsWith('Key')) {
      keyName = code.substring(3).toUpperCase();
    } else if (code.startsWith('Digit')) {
      keyName = code.substring(5);
    } else if (code.startsWith('Numpad')) {
      keyName = 'NUMPAD' + code.substring(6).toUpperCase();
    } else if (code.startsWith('F') && /^F\d+$/.test(code)) {
      keyName = code.toUpperCase();
    } else if (code === 'Space') {
      keyName = 'SPACE';
    } else if (code === 'Home') {
      keyName = 'HOME';
    } else if (code === 'End') {
      keyName = 'END';
    } else if (code === 'PageUp') {
      keyName = 'PAGEUP';
    } else if (code === 'PageDown') {
      keyName = 'PAGEDOWN';
    } else if (code === 'Insert') {
      keyName = 'INSERT';
    } else if (code === 'Delete') {
      keyName = 'DELETE';
    } else if (code === 'ArrowUp') {
      keyName = 'UP';
    } else if (code === 'ArrowDown') {
      keyName = 'DOWN';
    } else if (code === 'ArrowLeft') {
      keyName = 'LEFT';
    } else if (code === 'ArrowRight') {
      keyName = 'RIGHT';
    } else if (code === 'Backquote') {
      keyName = '~';
    } else if (code === 'Tab') {
      keyName = 'TAB';
    } else if (code === 'CapsLock') {
      keyName = 'CAPSLOCK';
    } else if (code === 'Enter' || code === 'NumpadEnter') {
      keyName = 'ENTER';
    } else if (code === 'Escape') {
      keyName = 'ESC';
    } else if (code === 'Backspace') {
      keyName = 'BACKSPACE';
    } else {
      const k = e.key;
      if (!['Control', 'Alt', 'Shift', 'Meta'].includes(k)) {
        keyName = k.toUpperCase();
      }
    }

    if (keyName && !['CTRL', 'ALT', 'SHIFT'].includes(keyName)) {
      keys.push(keyName);
      setPressedKey(keys.join('+'));
    }
  };

  const handleMouseDownOnModal = (e: React.MouseEvent) => {
    let mouseKey = '';
    if (e.button === 1) mouseKey = 'MOUSE3';
    else if (e.button === 3) mouseKey = 'MOUSE4';
    else if (e.button === 4) mouseKey = 'MOUSE5';

    if (mouseKey) {
      e.preventDefault();
      e.stopPropagation();
      const keys: string[] = [];
      if (e.ctrlKey) keys.push('CTRL');
      if (e.altKey) keys.push('ALT');
      if (e.shiftKey) keys.push('SHIFT');
      keys.push(mouseKey);
      setPressedKey(keys.join('+'));
    }
  };

  const setManualKey = (key: string) => {
    setPressedKey(key);
  };

  const confirmKey = async (id: string) => {
    if (!pressedKey) return;

    if (id.startsWith('profile:')) {
      const profId = id.replace('profile:', '');
      const prof = profiles.find((p) => p.id === profId);
      if (prof) {
        const updatedProf: GameProfile = { ...prof, hotkey: pressedKey };
        await api.saveProfile(updatedProf);
        if (onProfilesChange) {
          onProfilesChange(profiles.map((p) => (p.id === profId ? updatedProf : p)));
        }
        setSaveStatus(`💾 ${prof.name} kısayolu [${pressedKey}] olarak kaydedildi!`);
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } else {
      const nextConfig: HotkeyConfig = {
        ...currentHotkeys,
        [id]: pressedKey,
      };
      setCurrentHotkeys(nextConfig);
      if (onHotkeysChange) onHotkeysChange(nextConfig);
      await api.saveHotkeys(nextConfig);
      setSaveStatus(`💾 Kısayol [${pressedKey}] başarıyla kaydedildi!`);
      setTimeout(() => setSaveStatus(null), 3000);
    }

    setListeningFor(null);
    setPressedKey('');
  };

  const cancelListening = () => {
    setListeningFor(null);
    setPressedKey('');
  };

  const clearHotkey = async (id: string) => {
    if (id.startsWith('profile:')) {
      const profId = id.replace('profile:', '');
      const prof = profiles.find((p) => p.id === profId);
      if (prof) {
        const updatedProf: GameProfile = { ...prof, hotkey: '' };
        await api.saveProfile(updatedProf);
        if (onProfilesChange) {
          onProfilesChange(profiles.map((p) => (p.id === profId ? updatedProf : p)));
        }
        setSaveStatus(`🗑️ ${prof.name} kısayolu kaldırıldı.`);
        setTimeout(() => setSaveStatus(null), 2500);
      }
    } else {
      const nextConfig: HotkeyConfig = { ...currentHotkeys, [id]: '' };
      setCurrentHotkeys(nextConfig);
      if (onHotkeysChange) onHotkeysChange(nextConfig);
      await api.saveHotkeys(nextConfig);
      setSaveStatus('🗑️ Kısayol kaldırıldı.');
      setTimeout(() => setSaveStatus(null), 2500);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn" onMouseDown={listeningFor ? handleMouseDownOnModal : undefined}>
      {/* Header */}
      <div className="pb-3 border-b border-white/5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-fuchsia-400" />
            Global Donanım Kısayol Tuşları & Mouse Atamaları (0% Input Lag)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Düşük seviyeli passthrough kanca mimarisi ile klavye tuşları (<strong className="text-zinc-300">F1-F12, Home, End, Numpad</strong>) ve oyuncu faresi (<strong className="text-fuchsia-300">Mouse 3/4/5</strong>) tam desteklenir.
          </p>
        </div>
        {saveStatus && (
          <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
            {saveStatus}
          </div>
        )}
      </div>

      {/* Listening Dialog / Key Selector Modal */}
      {listeningFor && (
        <div className="p-5 rounded-3xl bg-[#130f26]/95 border-2 border-fuchsia-500/60 shadow-[0_0_35px_rgba(217,70,239,0.3)] flex flex-col gap-4 animate-scaleUp">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-fuchsia-400 animate-spin" />
              <span className="text-sm font-bold text-white font-mono">
                Tuşa veya Mouse Butonuna Basın (veya Aşağıdan Seçin)
              </span>
            </div>
            <button
              onClick={cancelListening}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div
              tabIndex={0}
              onKeyDown={handleKeyDown}
              onMouseDown={handleMouseDownOnModal}
              autoFocus
              className="flex-1 p-4 rounded-2xl bg-black/60 border border-fuchsia-500/50 text-center font-mono text-lg font-bold text-fuchsia-300 outline-none shadow-inner animate-pulse cursor-pointer"
            >
              {pressedKey || <span className="text-zinc-500 text-sm">Klavyeden bir tuşa veya Mouse 3 / 4 / 5'e basın...</span>}
            </div>

            <button
              onClick={() => confirmKey(listeningFor)}
              disabled={!pressedKey}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-sm font-bold text-white shadow-lg disabled:opacity-40 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Kaydet
            </button>
          </div>

          {/* Quick Key Selection Palette */}
          <div className="flex flex-col gap-2.5 pt-2 border-t border-white/10">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
              🖱️ Hızlı Mouse & Tuş Seçim Paleti (Tek Tıkla Ata):
            </span>

            {/* Mouse Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-fuchsia-300 font-mono font-bold mr-1">Mouse:</span>
              {['MOUSE3', 'MOUSE4', 'MOUSE5', 'MOUSE1', 'MOUSE2'].map((m) => (
                <button
                  key={m}
                  onClick={() => setManualKey(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                    pressedKey === m
                      ? 'bg-fuchsia-600 text-white border-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.5)]'
                      : 'bg-white/5 hover:bg-fuchsia-500/20 text-zinc-300 border-white/10'
                  }`}
                >
                  {m === 'MOUSE3' ? '🖱️ MOUSE 3 (Tekerlek)' : m === 'MOUSE4' ? '🖱️ MOUSE 4 (Yan 1)' : m === 'MOUSE5' ? '🖱️ MOUSE 5 (Yan 2)' : m}
                </button>
              ))}
            </div>

            {/* Function Keys F1-F12 */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-purple-300 font-mono font-bold mr-1">F Tuşları:</span>
              {['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].map((f) => (
                <button
                  key={f}
                  onClick={() => setManualKey(f)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                    pressedKey === f
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'bg-white/5 hover:bg-purple-500/20 text-zinc-300 border-white/10'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Special & Navigation Keys */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-emerald-300 font-mono font-bold mr-1">Özel:</span>
              {['V', 'X', 'Z', 'C', 'G', '~', 'SPACE', 'HOME', 'END', 'PAGEUP', 'PAGEDOWN', 'INSERT', 'DELETE', 'UP', 'DOWN', 'LEFT', 'RIGHT'].map((k) => (
                <button
                  key={k}
                  onClick={() => setManualKey(k)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                    pressedKey === k
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-white/5 hover:bg-emerald-500/20 text-zinc-300 border-white/10'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Global Hotkeys List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {globalEntries.map((entry) => {
          return (
            <div
              key={entry.id}
              className={`p-4 rounded-3xl glass-card border flex flex-col justify-between gap-3 transition-all ${
                listeningFor === entry.id
                  ? 'border-fuchsia-500/70 shadow-[0_0_20px_rgba(217,70,239,0.25)]'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-2 rounded-2xl bg-white/5 border border-white/5">
                    {entry.icon}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono">{entry.action}</h3>
                    <p className="text-xs text-zinc-400 font-light mt-0.5 leading-relaxed">
                      {entry.desc}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider">Atanan Tuş:</span>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-xs px-3 py-1 rounded-xl font-bold ${
                    entry.key ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 shadow-sm' : 'bg-zinc-800/60 text-zinc-500 border border-white/5 italic'
                  }`}>
                    {entry.key || 'Atanmadı'}
                  </span>
                  <button
                    onClick={() => startListening(entry.id)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-200 border border-white/10 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-fuchsia-400" />
                    Değiştir
                  </button>
                  {entry.key && (
                    <button
                      onClick={() => clearHotkey(entry.id)}
                      className="p-1.5 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-500/20 transition-colors"
                      title="Kısayolu Kaldır"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preset & Profile Hotkeys Section */}
      <div className="flex flex-col gap-3 mt-2">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-2">
          <Keyboard className="w-3.5 h-3.5 text-emerald-400" />
          Kayıtlı Hazır Filtre & Profil Kısayolları (ReShade / FiveM / CS2):
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {profiles.map((p) => {
            const listenId = `profile:${p.id}`;
            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-2xl glass-card border flex items-center justify-between gap-3 transition-all ${
                  listeningFor === listenId
                    ? 'border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'border-emerald-500/15 hover:border-emerald-500/30'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl">{p.icon}</span>
                  <div className="truncate">
                    <div className="text-xs font-bold text-white truncate">{p.name}</div>
                    <div className="text-[11px] text-zinc-400 truncate font-light">{p.description}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`font-mono text-xs px-2.5 py-1 rounded-lg font-bold whitespace-nowrap ${
                    p.hotkey ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-800/60 text-zinc-500 border border-white/5 italic'
                  }`}>
                    {p.hotkey || 'Yok'}
                  </span>
                  <button
                    onClick={() => startListening(listenId)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border border-white/5"
                    title="Profil Kısayolunu Değiştir"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  {p.hotkey && (
                    <button
                      onClick={() => clearHotkey(listenId)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-900/30 hover:bg-red-900/60 text-red-400 hover:text-red-300 border border-red-500/20"
                      title="Kısayolu Kaldır"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
