import React, { useState } from 'react';
import { Bookmark, Sparkles, Upload, Download, Check, Play } from 'lucide-react';
import { GameProfile } from '../types';

interface ProfileCardsProps {
  profiles: GameProfile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
}

export const ProfileCards: React.FC<ProfileCardsProps> = ({
  profiles,
  activeProfileId,
  onSelectProfile,
}) => {
  const [importJson, setImportJson] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold tracking-wide text-zinc-100 uppercase font-mono">
            Hazır Ekran Profilleri
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 border border-white/10 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Topluluk Profili İçe Aktar</span>
          </button>
        </div>
      </div>

      {/* Grid of Profile Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((p) => {
          const isActive = p.id === activeProfileId;
          return (
            <div
              key={p.id}
              onClick={() => onSelectProfile(p.id)}
              className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between gap-3 border ${
                isActive
                  ? 'bg-gradient-to-b from-purple-900/40 to-fuchsia-950/30 border-fuchsia-500 shadow-[0_0_25px_rgba(192,38,211,0.35)] -translate-y-1'
                  : 'glass-card border-white/5 hover:border-purple-500/40 hover:-translate-y-0.5'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{p.icon}</span>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100 group-hover:text-fuchsia-300 transition-colors">
                        {p.name}
                      </h3>
                      {p.hotkey && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-400 border border-white/5 inline-block mt-0.5">
                          Kısayol: {p.hotkey}
                        </span>
                      )}
                    </div>
                  </div>
                  {isActive && (
                    <span className="w-6 h-6 rounded-full bg-fuchsia-500 text-white flex items-center justify-center shadow-[0_0_10px_rgba(192,38,211,0.8)]">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400 mt-2.5 font-light leading-relaxed">
                  {p.description}
                </p>
              </div>

              {/* Specs Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Gama: {p.settings.gamma.toFixed(2)}x
                </span>
                <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-300 border border-pink-500/20">
                  Canlılık: %{p.settings.digitalVibrance}
                </span>
                {p.settings.sharpness > 0 && (
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-purple-500/30 flex flex-col gap-4 shadow-2xl">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Upload className="w-5 h-5 text-fuchsia-400" />
              Profil JSON İçe Aktar
            </h3>
            <p className="text-xs text-zinc-400">
              Diğer oyunculardan aldığınız profil JSON metnini buraya yapıştırarak profil listenize ekleyin.
            </p>
            <textarea
              rows={5}
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='{"id":"custom_rust","name":"Rust PvP Gece","settings":{...}}'
              className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-zinc-200 outline-none focus:border-purple-500"
            />
            <div className="flex justify-end gap-2">
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
                className="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-xs font-bold text-white shadow-lg"
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
