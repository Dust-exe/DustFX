import React, { useState } from 'react';
import { Download, ExternalLink, Sparkles, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { ReleaseInfo } from '../types';
import { api } from '../api';

interface UpdateModalProps {
  releaseInfo: ReleaseInfo | null;
  onClose: () => void;
  onOpenExternal: (url: string) => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ releaseInfo, onClose, onOpenExternal }) => {
  const [updating, setUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [updateError, setUpdateError] = useState<string>('');

  if (!releaseInfo) return null;

  const handleDirectUpdate = async () => {
    if (!releaseInfo?.downloadUrl) return;
    setUpdating(true);
    setUpdateError('');
    setUpdateStatus('GitHub üzerinden yeni sürüm indiriliyor...');

    try {
      const res = await api.downloadAndApplyUpdate({
        downloadUrl: releaseInfo.downloadUrl,
        version: releaseInfo.latestVersion,
        tagName: releaseInfo.tagName,
        htmlUrl: releaseInfo.htmlUrl,
      });
      if (res.success) {
        setUpdateStatus('✅ İndirme tamamlandı! Kurulum yapılıyor ve uygulama yeniden başlatılıyor...');

        let attempts = 0;
        const checkRebootInterval = setInterval(async () => {
          attempts++;
          try {
            const status = await api.getStatus();
            if (status && status.status === 'online') {
              clearInterval(checkRebootInterval);
              setUpdateStatus('🎉 Yeni sürüm başarıyla yüklendi! Sayfa yenileniyor...');
              setTimeout(() => {
                window.location.reload();
              }, 1200);
            }
          } catch {
            if (attempts > 30) {
              clearInterval(checkRebootInterval);
              setUpdateStatus('⚠️ Güncelleme arka planda tamamlandı. Sayfayı yenileyerek yeni sürüme geçebilirsiniz.');
              setUpdating(false);
            }
          }
        }, 1500);
      } else {
        setUpdateError(res.error || 'Güncelleme uygulanamadı. Manuel indirmeyi deneyin.');
        setUpdating(false);
      }
    } catch (e) {
      setUpdateError(`Güncelleme sunucusuna ulaşılamadı: ${e}`);
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-purple-500/30 flex flex-col gap-5 shadow-[0_0_50px_rgba(168,85,247,0.25)] relative overflow-hidden animate-fadeIn">
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-fuchsia-600/30 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          disabled={updating}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors disabled:opacity-40"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 p-[1px] shadow-[0_0_20px_rgba(192,38,211,0.5)]">
            <div className="w-full h-full bg-[#0e0b1c] rounded-[15px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-fuchsia-400" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-mono">GitHub Otomatik Güncelleme</h3>
            <p className="text-xs text-zinc-400">
              Mevcut: <span className="font-mono text-zinc-300">v{releaseInfo.currentVersion}</span> • En Son: <span className="font-mono text-fuchsia-400 font-bold">v{releaseInfo.latestVersion}</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Sürüm Durumu:
            </span>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
              releaseInfo.hasUpdate
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
            }`}>
              {releaseInfo.hasUpdate ? 'Yeni Sürüm Mevcut' : 'Son Sürüm Yüklü'}
            </span>
          </div>

          {releaseInfo.releaseNotes && (
            <div className="flex flex-col gap-1.5 mt-1">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                Sürüm Notları & Değişiklikler:
              </span>
              <div className="p-3 rounded-xl bg-white/5 text-xs text-zinc-300 font-light leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto">
                {releaseInfo.releaseNotes}
              </div>
            </div>
          )}
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

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => onOpenExternal(releaseInfo.htmlUrl || 'https://github.com/Dust-exe/DustFX/releases')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-200 border border-white/10 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            GitHub Release Sayfası
          </button>

          {releaseInfo.hasUpdate && releaseInfo.downloadUrl && (
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
