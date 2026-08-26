import React, { useState } from 'react';
import { RefreshCw, Download, ExternalLink, CheckCircle, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { ReleaseInfo } from '../../types';
import { api } from '../../api';

interface UpdatesTabProps {
  releaseInfo: ReleaseInfo | null;
  onCheckAgain: () => void;
  onOpenExternal: (url: string) => void;
}

export const UpdatesTab: React.FC<UpdatesTabProps> = ({ releaseInfo, onCheckAgain, onOpenExternal }) => {
  const [updating, setUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [updateError, setUpdateError] = useState<string>('');

  const hasUpdate = releaseInfo?.hasUpdate === true;

  const handleDirectUpdate = async () => {
    if (!releaseInfo?.downloadUrl) return;
    setUpdating(true);
    setUpdateError('');
    setUpdateStatus('GitHub üzerinden yeni sürüm indiriliyor...');

    try {
      const res = await api.downloadAndApplyUpdate();
      if (res.success) {
        setUpdateStatus('İndirme tamamlandı! Eski dosyalar temizleniyor ve uygulama yeniden başlatılıyor...');
      } else {
        setUpdateError(res.error || 'Güncelleme uygulanamadı. Manuel indirmeyi deneyin.');
        setUpdating(false);
      }
    } catch {
      setUpdateError('Güncelleme sunucusuna ulaşılamadı. Lütfen bağlantınızı kontrol edin.');
      setUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-emerald-400" />
            GitHub Otomatik Güncelleme Takibi
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Her 10 dakikada bir <strong className="text-white">Dust-exe/DustFX</strong> GitHub Releases API'si otomatik kontrol edilir.
          </p>
        </div>
        <button
          onClick={onCheckAgain}
          disabled={updating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-200 border border-white/10 transition-all active:scale-95 disabled:opacity-40"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Şimdi Kontrol Et
        </button>
      </div>

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
                DustFX v{releaseInfo?.latestVersion || '1.2.0'}
              </h3>
              <p className="text-xs text-zinc-400">
                Yüklü: <span className="font-mono text-zinc-300 font-bold">v{releaseInfo?.currentVersion || '1.2.0'}</span>
              </p>
            </div>
          </div>

          <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
            hasUpdate
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
          }`}>
            {hasUpdate ? (
              <>🔔 Yeni Sürüm Mevcut</>
            ) : (
              <><CheckCircle className="w-3.5 h-3.5" /> En Güncel Sürüm</>
            )}
          </span>
        </div>

        {/* Release Notes */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">Sürüm Notları:</span>
          <pre className="text-xs text-zinc-300 font-light leading-relaxed whitespace-pre-wrap max-h-44 overflow-y-auto mt-2 font-sans">
            {releaseInfo?.releaseNotes || '• En son değişiklikler için GitHub sayfasını ziyaret edin.'}
          </pre>
        </div>

        {/* Progress or status banner during update */}
        {updating && (
          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-fuchsia-400 animate-spin flex-shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-white font-mono">Otomatik Güncelleme Devam Ediyor</span>
              <span className="text-[11px] text-zinc-300">{updateStatus}</span>
            </div>
          </div>
        )}

        {updateError && (
          <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{updateError}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            onClick={() => onOpenExternal(releaseInfo?.htmlUrl || 'https://github.com/Dust-exe/DustFX/releases')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-200 border border-white/10 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            GitHub Release Sayfası
          </button>

          {hasUpdate && releaseInfo?.downloadUrl && (
            <button
              onClick={handleDirectUpdate}
              disabled={updating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-xs font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-95 disabled:opacity-50"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Güncelleniyor...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Şimdi Güncelle & Yeniden Başlat
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
