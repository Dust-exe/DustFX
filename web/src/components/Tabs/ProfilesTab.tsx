import React, { useState } from 'react';
import { Bookmark, Upload, Check, Play, FileJson } from 'lucide-react';
import { GameProfile } from '../../types';

interface ProfilesTabProps {
  profiles: GameProfile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
}

export const ProfilesTab: React.FC<ProfilesTabProps> = ({
  profiles,
  activeProfileId,
  onSelectProfile,
}) => {
  const [importJson, setImportJson] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-purple-400" />
            Hazır Ekran Profilleri & Topluluk
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Tek tıkla optimize edilmiş görsel ayarlarını yükleyin veya özel profillerinizi paylaşın.
          </p>
        </div>
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-xs font-semibold text-purple-200 border border-purple-500/40 transition-all shadow-md active:scale-95"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Topluluk Profili İçe Aktar</span>
        </button>
      </div>

      {/* Profile Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {profiles.map((p) => {
          const isActive = p.id === activeProfileId;
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
                      <h3 className="text-sm font-bold text-white group-hover:text-fuchsia-300 transition-colors">
                        {p.name}
                      </h3>
                      {p.hotkey && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/5 inline-block mt-1">
                          Kısayol: {p.hotkey}
                        </span>
                      )}
                    </div>
                  </div>
                  {isActive && (
                    <span className="w-7 h-7 rounded-full bg-fuchsia-500 text-white flex items-center justify-center shadow-[0_0_15px_rgba(192,38,211,0.8)]">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400 mt-3 font-light leading-relaxed">
                  {p.description}
                </p>
              </div>

              {/* Specs Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/5 text-[10px] font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Gama: {p.settings.gamma.toFixed(2)}x
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-pink-500/10 text-pink-300 border border-pink-500/20">
                  Canlılık: %{p.settings.digitalVibrance}
                </span>
                {p.settings.sharpness > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    Netlik: %{(p.settings.sharpness * 100).toFixed(0)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-purple-500/30 flex flex-col gap-4 shadow-2xl">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <FileJson className="w-5 h-5 text-fuchsia-400" />
              Profil JSON İçe Aktar
            </h3>
            <p className="text-xs text-zinc-400">
              Diğer oyunculardan aldığınız profil JSON metnini yapıştırarak listenize ekleyin.
            </p>
            <textarea
              rows={6}
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='{"id":"custom_profile","name":"Gece Modu","settings":{"gamma":2.0,"digitalVibrance":50}}'
              className="w-full p-3 rounded-2xl bg-black/50 border border-white/10 text-xs font-mono text-zinc-200 outline-none focus:border-purple-500"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-300"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  try {
                    const parsed = JSON.parse(importJson);
                    onSelectProfile(parsed.id || 'night_vision');
                    setShowImportModal(false);
                  } catch {
                    alert('Geçersiz JSON formatı!');
                  }
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-xs font-bold text-white shadow-lg"
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
