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

    const key = e.key;
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
      keys.push(key.length === 1 ? key.toUpperCase() : key.toUpperCase());
    }

    const combo = keys.join('+');
    if (combo && !['CTRL', 'ALT', 'SHIFT'].includes(combo)) {
      setPressedKey(combo);
    }
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
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div className="pb-3 border-b border-white/5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-fuchsia-400" />
            Global Donanım Kısayol Tuşları (0% Key Lock)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Düşük seviyeli passthrough kanca mimarisi sayesinde atanan tuşlar oyunları ve diğer uygulamaları ASLA kilitlemez.
          </p>
        </div>
        {saveStatus && (
          <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
            {saveStatus}
          </div>
        )}
      </div>

      {/* Main Global Hotkeys List */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
          Ana Sistem Kısayolları:
        </h3>
        {globalEntries.map((h) => {
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
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{h.icon}</span>
                <div>
                  <div className="text-sm font-bold text-white">{h.action}</div>
                  <div className="text-xs text-zinc-400 font-light">{h.desc}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isListening ? (
                  <>
                    <div
                      tabIndex={0}
                      onKeyDown={handleKeyDown}
                      className="min-w-[130px] px-3 py-2 rounded-xl bg-fuchsia-950/80 border-2 border-fuchsia-500 text-sm font-mono text-fuchsia-200 text-center outline-none animate-pulse focus:outline-none cursor-text"
                      autoFocus
                    >
                      {pressedKey || <span className="text-zinc-500">Tuşa bas...</span>}
                    </div>
                    <button
                      onClick={() => confirmKey(h.id)}
                      disabled={!pressedKey}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-500/80 hover:bg-emerald-500 text-white disabled:opacity-30 transition-all"
                      title="Kaydet"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </button>
                    <button
                      onClick={cancelListening}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-all"
                      title="İptal"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className={`font-mono text-sm px-3.5 py-1.5 rounded-xl font-bold shadow-md whitespace-nowrap ${
                      h.key ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-zinc-800/60 text-zinc-500 border border-white/5 italic'
                    }`}>
                      {h.key || 'Yok'}
                    </span>
                    <button
                      onClick={() => startListening(h.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-all border border-white/5"
                      title="Kısayolu Değiştir"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {h.key && (
                      <button
                        onClick={() => clearHotkey(h.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-900/30 hover:bg-red-900/60 text-red-400 hover:text-red-300 transition-all border border-red-500/20"
                        title="Kısayolu Kaldır"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
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
            const isListening = listeningFor === listenId;
            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-2xl glass-card border flex items-center justify-between gap-3 transition-all ${
                  isListening
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

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isListening ? (
                    <>
                      <div
                        tabIndex={0}
                        onKeyDown={handleKeyDown}
                        className="min-w-[90px] px-2 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500 text-xs font-mono text-emerald-200 text-center outline-none animate-pulse"
                        autoFocus
                      >
                        {pressedKey || <span className="text-zinc-500">Bas...</span>}
                      </div>
                      <button
                        onClick={() => confirmKey(listenId)}
                        disabled={!pressedKey}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-30 text-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={cancelListening}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
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
                    </>
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
