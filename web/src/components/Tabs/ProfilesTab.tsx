import React, { useState, useMemo } from 'react';
import {
  Bookmark,
  Upload,
  Check,
  Search,
  Plus,
  Share2,
  Trash2,
  Copy,
  Sparkles,
  FileText,
  Gamepad2,
  Sliders,
  X,
  CheckCircle,
} from 'lucide-react';
import { GameProfile, DisplaySettings } from '../../types';

interface ProfilesTabProps {
  profiles: GameProfile[];
  activeProfileId: string;
  currentSettings: DisplaySettings;
  onSelectProfile: (id: string) => void;
  onSaveProfile: (profile: GameProfile) => void;
  onDeleteProfile: (id: string) => void;
}

// Built-in curated community profiles to enrich search
const extraCommunityPresets: GameProfile[] = [
  {
    id: 'comm_cs2_pro',
    name: 'CS2 Pro Vivid & Crisp',
    icon: '⚡',
    description: 'Counter-Strike 2 için sarı-yeşil ve terörist silüetlerini maksimum öne çıkaran turnuva modu.',
    exePattern: 'cs2.exe',
    hotkey: 'F6',
    isBuiltin: true,
    autoApplyOnLaunch: true,
    settings: {
      gamma: 1.40,
      digitalVibrance: 75,
      brightnessOffset: 0.04,
      contrast: 1.35,
      rgbRed: 1.05,
      rgbGreen: 1.0,
      rgbBlue: 0.95,
      sharpness: 0.80,
      colorTemperature: 6500,
      shadowDetail: 0.1,
      crosshairEnabled: true,
      crosshairStyle: 'cross',
      crosshairColor: '#00FF66',
      crosshairSize: 8,
      crosshairThickness: 2,
      crosshairGap: 3,
      crosshairDotSize: 0,
      crosshairOutline: 1,
      crosshairOpacity: 1.0,
    },
  },
  {
    id: 'comm_rust_night',
    name: 'Rust Night & Bush Hunter',
    icon: '🌲',
    description: 'Rust gece döngülerinde ve yoğun çalılıklarda kamuflajlı oyuncuları fark ettiren yüksek gama eğrisi.',
    exePattern: 'RustClient.exe',
    hotkey: 'F9',
    isBuiltin: true,
    autoApplyOnLaunch: true,
    settings: {
      gamma: 2.20,
      digitalVibrance: 50,
      brightnessOffset: 0.15,
      contrast: 1.20,
      rgbRed: 1.0,
      rgbGreen: 1.0,
      rgbBlue: 1.0,
      sharpness: 0.65,
      colorTemperature: 6500,
      shadowDetail: 0.5,
      crosshairEnabled: true,
      crosshairStyle: 'dot',
      crosshairColor: '#FF0055',
      crosshairSize: 6,
      crosshairThickness: 2,
      crosshairGap: 0,
      crosshairDotSize: 3,
      crosshairOutline: 1,
      crosshairOpacity: 1.0,
    },
  },
  {
    id: 'comm_val_headshot',
    name: 'Valorant Neon Headshot',
    icon: '🎯',
    description: 'Viper dumanları ve parlak ajan yeteneklerinde düşman kafalarını izole eden yüksek kontrast.',
    exePattern: 'VALORANT-Win64-Shipping.exe',
    hotkey: 'F8',
    isBuiltin: true,
    autoApplyOnLaunch: true,
    settings: {
      gamma: 1.25,
      digitalVibrance: 85,
      brightnessOffset: 0.02,
      contrast: 1.30,
      rgbRed: 1.0,
      rgbGreen: 1.0,
      rgbBlue: 1.05,
      sharpness: 0.70,
      colorTemperature: 6800,
      shadowDetail: 0.1,
      crosshairEnabled: true,
      crosshairStyle: 'cross',
      crosshairColor: '#00E5FF',
      crosshairSize: 6,
      crosshairThickness: 2,
      crosshairGap: 2,
      crosshairDotSize: 0,
      crosshairOutline: 1,
      crosshairOpacity: 1.0,
    },
  },
  {
    id: 'comm_tarkov_clarity',
    name: 'Tarkov High-Pass Clarity',
    icon: '🩸',
    description: 'Escape from Tarkov bina içi gölgeleri aydınlatır, donuk renkleri açar ve uzak mesafe netliği sağlar.',
    exePattern: 'EscapeFromTarkov.exe',
    hotkey: 'Alt+F9',
    isBuiltin: true,
    autoApplyOnLaunch: true,
    settings: {
      gamma: 1.90,
      digitalVibrance: 55,
      brightnessOffset: 0.10,
      contrast: 1.25,
      rgbRed: 1.02,
      rgbGreen: 1.0,
      rgbBlue: 0.98,
      sharpness: 0.90,
      colorTemperature: 6400,
      shadowDetail: 0.4,
      crosshairEnabled: false,
      crosshairStyle: 'dot',
      crosshairColor: '#00FF66',
      crosshairSize: 6,
    },
  },
  {
    id: 'comm_fivem_cinematic',
    name: 'FiveM / GTA V Sunset',
    icon: '🏎️',
    description: 'Sıcak sinematik Hollywood renk tonlaması, araç ışıkları ve gece şehir detaylarını canlandırır.',
    exePattern: 'FiveM.exe;GTA5.exe',
    hotkey: 'F7',
    isBuiltin: true,
    autoApplyOnLaunch: true,
    settings: {
      gamma: 1.15,
      digitalVibrance: 70,
      brightnessOffset: -0.02,
      contrast: 1.15,
      rgbRed: 1.08,
      rgbGreen: 0.96,
      rgbBlue: 0.88,
      sharpness: 0.40,
      colorTemperature: 5000,
      shadowDetail: 0.1,
      crosshairEnabled: false,
      crosshairStyle: 'dot',
      crosshairColor: '#00FF66',
      crosshairSize: 6,
    },
  },
];

// Helper: encode/decode profile share string safely
function generateProfileShareCode(profile: GameProfile): string {
  const payload = {
    n: profile.name,
    i: profile.icon,
    d: profile.description,
    g: profile.settings.gamma,
    v: profile.settings.digitalVibrance,
    b: profile.settings.brightnessOffset,
    c: profile.settings.contrast,
    s: profile.settings.sharpness,
    r: profile.settings.rgbRed,
    gr: profile.settings.rgbGreen,
    bl: profile.settings.rgbBlue,
  };
  return 'DUST-COLOR:' + btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function parseProfileShareCode(code: string): Partial<GameProfile> | null {
  try {
    let jsonStr = '';
    if (code.startsWith('DUST-COLOR:')) {
      const b64 = code.replace('DUST-COLOR:', '').trim();
      jsonStr = decodeURIComponent(escape(atob(b64)));
    } else {
      jsonStr = code.trim();
    }
    const parsed = JSON.parse(jsonStr);
    return {
      name: String(parsed.n || parsed.name || 'Paylaşılan Profil').slice(0, 50),
      icon: String(parsed.i || parsed.icon || '🎯').slice(0, 10),
      description: String(parsed.d || parsed.description || 'Topluluktan içe aktarılan renk profili.').slice(0, 200),
      settings: {
        gamma: Math.max(0.5, Math.min(3.0, Number(parsed.g ?? parsed.settings?.gamma ?? 1.0))),
        digitalVibrance: Math.max(0, Math.min(100, Number(parsed.v ?? parsed.settings?.digitalVibrance ?? 0))),
        brightnessOffset: Math.max(-1.0, Math.min(1.0, Number(parsed.b ?? parsed.settings?.brightnessOffset ?? 0.0))),
        contrast: Math.max(0.5, Math.min(2.5, Number(parsed.c ?? parsed.settings?.contrast ?? 1.0))),
        sharpness: Math.max(0.0, Math.min(1.0, Number(parsed.s ?? parsed.settings?.sharpness ?? 0.0))),
        colorTemperature: Math.max(2700, Math.min(10000, Number(parsed.t ?? parsed.settings?.colorTemperature ?? 6500))),
        shadowDetail: Math.max(0.0, Math.min(1.0, Number(parsed.sd ?? parsed.settings?.shadowDetail ?? 0.0))),
        rgbRed: Math.max(0.2, Math.min(2.0, Number(parsed.r ?? parsed.settings?.rgbRed ?? 1.0))),
        rgbGreen: Math.max(0.2, Math.min(2.0, Number(parsed.gr ?? parsed.settings?.rgbGreen ?? 1.0))),
        rgbBlue: Math.max(0.2, Math.min(2.0, Number(parsed.bl ?? parsed.settings?.rgbBlue ?? 1.0))),
        crosshairEnabled: false,
        crosshairStyle: 'cross',
        crosshairColor: '#00FF66',
        crosshairSize: 10,
      },
    };
  } catch {
    return null;
  }
}

export const ProfilesTab: React.FC<ProfilesTabProps> = ({
  profiles,
  activeProfileId,
  currentSettings,
  onSelectProfile,
  onSaveProfile,
  onDeleteProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Save Modal Form State
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileIcon, setNewProfileIcon] = useState('🎯');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [newProfileHotkey, setNewProfileHotkey] = useState('');
  const [newProfileExe, setNewProfileExe] = useState('');

  // Import State
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState('');

  // Merge loaded profiles with extra curated community presets (avoiding duplicate IDs)
  const allProfiles = useMemo(() => {
    const list = [...profiles];
    for (const extra of extraCommunityPresets) {
      if (!list.some((p) => p.id === extra.id)) {
        list.push(extra);
      }
    }
    return list;
  }, [profiles]);

  // Filtered profiles based on search
  const filteredProfiles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allProfiles;
    return allProfiles.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.exePattern.toLowerCase().includes(q) ||
        p.hotkey.toLowerCase().includes(q)
    );
  }, [allProfiles, searchQuery]);

  const handleCopyCode = (e: React.MouseEvent, p: GameProfile) => {
    e.stopPropagation();
    const code = generateProfileShareCode(p);
    navigator.clipboard.writeText(code);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenSaveModal = () => {
    setNewProfileName(`Özel Profil #${profiles.length + 1}`);
    setNewProfileIcon('🎮');
    setNewProfileDesc(`Gama: ${currentSettings.gamma.toFixed(2)}x, Canlılık: %${currentSettings.digitalVibrance}, Netlik: %${(currentSettings.sharpness * 100).toFixed(0)}`);
    setNewProfileHotkey('');
    setNewProfileExe('');
    setShowSaveModal(true);
  };

  const handleConfirmSave = () => {
    if (!newProfileName.trim()) return;
    const customId = `custom_${Date.now()}`;
    const newP: GameProfile = {
      id: customId,
      name: newProfileName.trim(),
      icon: newProfileIcon || '🎯',
      description: newProfileDesc.trim() || 'Kullanıcı tarafından kaydedilen özel renk ayarı.',
      exePattern: newProfileExe.trim(),
      hotkey: newProfileHotkey.trim(),
      autoApplyOnLaunch: !!newProfileExe.trim(),
      isBuiltin: false,
      settings: { ...currentSettings },
    };
    onSaveProfile(newP);
    setShowSaveModal(false);
  };

  const handleConfirmImport = () => {
    setImportError('');
    if (!importCode.trim()) return;

    const parsed = parseProfileShareCode(importCode);
    if (!parsed || !parsed.settings) {
      setImportError('Geçersiz veya bozuk profil kodu! Lütfen DUST-COLOR veya JSON kodunu kontrol edin.');
      return;
    }

    const importedId = `comm_${Date.now()}`;
    const newP: GameProfile = {
      id: importedId,
      name: parsed.name || 'İçe Aktarılan Profil',
      icon: parsed.icon || '🎯',
      description: parsed.description || 'Topluluktan paylaşılan profil.',
      exePattern: '',
      hotkey: '',
      autoApplyOnLaunch: false,
      isBuiltin: false,
      settings: parsed.settings as DisplaySettings,
    };

    onSaveProfile(newP);
    onSelectProfile(importedId);
    setShowImportModal(false);
    setImportCode('');
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-purple-400" />
            Hazır Ekran Profilleri & Topluluk Hub
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Oyunlara özel optimize edilmiş renk profillerini kullanın, aratın, kaydedin veya toplulukla paylaşın.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleOpenSaveModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-xs font-bold text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.35)] active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Mevcut Ayarları Kaydet</span>
          </button>

          <button
            onClick={() => {
              setImportCode('');
              setImportError('');
              setShowImportModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-200 border border-white/10 transition-all active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Kod İçe Aktar</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Toplulukta veya profillerde ara... (Örn: CS2, Rust, Valorant, Gece Görüşü, Tarkov, F9)"
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-black/40 border border-purple-500/15 focus:border-purple-500/50 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Profile Cards Grid */}
      {filteredProfiles.length === 0 ? (
        <div className="p-12 text-center glass-card rounded-3xl border border-white/5 flex flex-col items-center gap-2">
          <Gamepad2 className="w-8 h-8 text-zinc-600" />
          <span className="text-sm font-bold text-zinc-300">Aramanıza uygun profil bulunamadı</span>
          <p className="text-xs text-zinc-500">Farklı bir anahtar kelime deneyin veya "Mevcut Ayarları Kaydet" ile kendi profilinizi oluşturun.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProfiles.map((p) => {
            const isActive = p.id === activeProfileId;
            const isCustom = !p.isBuiltin;

            return (
              <div
                key={p.id}
                onClick={() => onSelectProfile(p.id)}
                className={`group relative p-5 rounded-3xl cursor-pointer transition-all duration-300 flex flex-col justify-between gap-4 border ${
                  isActive
                    ? 'bg-gradient-to-b from-purple-900/50 to-fuchsia-950/40 border-fuchsia-500 shadow-[0_0_30px_rgba(192,38,211,0.4)] -translate-y-1'
                    : 'glass-card border-white/5 hover:border-purple-500/40 hover:-translate-y-1'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{p.icon}</span>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-fuchsia-300 transition-colors flex items-center gap-1.5">
                          {p.name}
                          {isCustom && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                              Özel
                            </span>
                          )}
                        </h3>
                        {p.hotkey && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/5 inline-block mt-1">
                            Kısayol: {p.hotkey}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Share Button */}
                      <button
                        onClick={(e) => handleCopyCode(e, p)}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                        title="Topluluk Paylaşım Kodunu Kopyala"
                      >
                        {copiedId === p.id ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Delete Button (Only for Custom Profiles) */}
                      {isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`"${p.name}" profilini silmek istediğinize emin misiniz?`)) {
                              onDeleteProfile(p.id);
                            }
                          }}
                          className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/30 text-red-400 flex items-center justify-center transition-colors"
                          title="Profili Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Active Indicator */}
                      {isActive && (
                        <span className="w-7 h-7 rounded-full bg-fuchsia-500 text-white flex items-center justify-center shadow-[0_0_15px_rgba(192,38,211,0.8)]">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 mt-3 font-light leading-relaxed">
                    {p.description}
                  </p>
                </div>

                {/* Specs Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-white/5 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
                    G: {p.settings.gamma.toFixed(2)}x
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-pink-500/10 text-pink-300 border border-pink-500/20 font-bold">
                    V: %{p.settings.digitalVibrance}
                  </span>
                  {p.settings.sharpness > 0 && (
                    <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                      CAS: %{(p.settings.sharpness * 100).toFixed(0)}
                    </span>
                  )}
                  {p.settings.contrast !== 1.0 && (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      K: {p.settings.contrast.toFixed(2)}x
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Save Profile Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-purple-500/30 flex flex-col gap-4 shadow-2xl animate-fadeIn relative">
            <button
              onClick={() => setShowSaveModal(false)}
              className="absolute top-5 right-5 w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Plus className="w-5 h-5 text-fuchsia-400" />
              Mevcut Ayarları Kaydet
            </h3>
            <p className="text-xs text-zinc-400">
              Şu anki ekran filtresi ayarlarınızı kaydedip istediğiniz zaman hızlıca yükleyebilirsiniz.
            </p>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-zinc-300 font-semibold mb-1 block font-mono">Profil İsmi:</label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Örn: Rust Gece Modum"
                  maxLength={50}
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-purple-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold mb-1 block font-mono">Simge (Emoji):</label>
                  <input
                    type="text"
                    value={newProfileIcon}
                    onChange={(e) => setNewProfileIcon(e.target.value)}
                    maxLength={5}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-center text-base outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold mb-1 block font-mono">Kısayol Tuşu:</label>
                  <input
                    type="text"
                    value={newProfileHotkey}
                    onChange={(e) => setNewProfileHotkey(e.target.value)}
                    placeholder="Örn: F9"
                    maxLength={10}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-purple-500 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold mb-1 block font-mono">Açıklama (Opsiyonel):</label>
                <textarea
                  rows={2}
                  value={newProfileDesc}
                  onChange={(e) => setNewProfileDesc(e.target.value)}
                  placeholder="Profilin kullanım amacı ve ayar notları..."
                  maxLength={200}
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-purple-500 text-xs resize-none"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold mb-1 block font-mono">Otomatik Oyun .exe Bağlantısı:</label>
                <input
                  type="text"
                  value={newProfileExe}
                  onChange={(e) => setNewProfileExe(e.target.value)}
                  placeholder="Örn: RustClient.exe;cs2.exe (Oyun açılınca oto-aktif olur)"
                  maxLength={100}
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-purple-500 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-white/5">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-300"
              >
                İptal
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={!newProfileName.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-xs font-bold text-white shadow-lg disabled:opacity-40"
              >
                Kaydet & Listeye Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-purple-500/30 flex flex-col gap-4 shadow-2xl animate-fadeIn relative">
            <button
              onClick={() => setShowImportModal(false)}
              className="absolute top-5 right-5 w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Upload className="w-5 h-5 text-fuchsia-400" />
              Topluluk Kodunu İçe Aktar
            </h3>
            <p className="text-xs text-zinc-400">
              Diğer oyunculardan aldığınız <strong className="text-white">DUST-COLOR</strong> kodunu veya profil JSON metnini yapıştırın.
            </p>

            <textarea
              rows={4}
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              placeholder="Örn: DUST-COLOR:eyJ... veya JSON formatı"
              className="w-full p-3 rounded-2xl bg-black/50 border border-white/10 text-xs font-mono text-zinc-200 outline-none focus:border-purple-500 resize-none"
            />

            {importError && (
              <p className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded-xl border border-red-500/30 font-medium">
                ⚠️ {importError}
              </p>
            )}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-white/5">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-300"
              >
                İptal
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={!importCode.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-xs font-bold text-white shadow-lg disabled:opacity-40"
              >
                İçe Aktar & Uygula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
