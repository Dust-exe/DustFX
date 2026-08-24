import React from 'react';
import { RefreshCw, Download, ExternalLink, CheckCircle, Sparkles, AlertCircle } from 'lucide-react';
import { ReleaseInfo } from '../../types';

interface UpdatesTabProps {
  releaseInfo: ReleaseInfo | null;
  onCheckAgain: () => void;
}

export const UpdatesTab: React.FC<UpdatesTabProps> = ({ releaseInfo, onCheckAgain }) => {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-emerald-400" />
            GitHub Otomatik Güncelleme Takibi
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            GitHub Releases API üzerinden otomatik sürüm ve yama kontrolü.
          </p>
        </div>
        <button
          onClick={onCheckAgain}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-200 border border-white/10 transition-all active:scale-95 shadow-md"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Şimdi Kontrol Et</span>
        </button>
      </div>

      {/* Main Release Card */}
      <div className="glass-card p-6 rounded-3xl border border-purple-500/20 flex flex-col gap-5 shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-600 p-[1px] shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <div className="w-full h-full bg-[#0e0b1c] rounded-[15px] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-fuchsia-400" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                DustFX PRO v{releaseInfo?.latestVersion || '1.1.0'}
              </h3>
              <p className="text-xs text-zinc-400">
                Yüklü Sürüm: <span className="font-mono text-zinc-300 font-bold">v{releaseInfo?.currentVersion || '1.1.0'}</span>
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
              releaseInfo?.hasUpdate
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
            }`}
          >
            {releaseInfo?.hasUpdate ? 'Yeni Sürüm Mevcut' : '✓ En Güncel Sürüm'}
          </span>
        </div>

        {/* Release Notes */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-2">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
            Sürüm Notları & Yenilikler:
          </span>
          <div className="text-xs text-zinc-300 font-light leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
            {releaseInfo?.releaseNotes || '• Donanım seviyesi GPU & DCCW Gama optimizasyonları yapıldı.\n• Çoklu monitör desteği ve bağımsız parlaklık yönetimi eklendi.\n• Modern Medal.tv / DustPlay tarzı Glassmorphism UI tasarımı.'}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <a
            href={releaseInfo?.htmlUrl || 'https://github.com/Dust-exe/DustFX/releases'}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-200 border border-white/10 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>GitHub Release Sayfası</span>
          </a>

          {releaseInfo?.downloadUrl && (
            <a
              href={releaseInfo.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-xs font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Güncellemeyi İndir (.exe)</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
