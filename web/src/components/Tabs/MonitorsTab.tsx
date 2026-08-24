import React from 'react';
import { Monitor, Cpu, Check, Activity, ShieldCheck } from 'lucide-react';
import { MonitorInfo } from '../../types';

interface MonitorsTabProps {
  monitors: MonitorInfo[];
  selectedIndex: number;
  onSelectMonitor: (index: number) => void;
}

export const MonitorsTab: React.FC<MonitorsTabProps> = ({
  monitors,
  selectedIndex,
  onSelectMonitor,
}) => {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Monitor className="w-5 h-5 text-cyan-400" />
            Çoklu Monitör & Otomatik Oyun Algılama
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Filtre uygulanacak monitörü seçin ve oyun/masaüstü geçiş politikalarını yönetin.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Monitor Selection Cards */}
        <div className="glass-card p-6 rounded-3xl border border-purple-500/15 flex flex-col gap-4 shadow-xl">
          <div className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2 pb-2 border-b border-white/5">
            <Monitor className="w-4 h-4 text-cyan-400" />
            Hedef Monitör Yapılandırması
          </div>

          <div className="flex flex-col gap-3">
            {/* All Monitors Button */}
            <button
              onClick={() => onSelectMonitor(-1)}
              className={`p-4 rounded-2xl flex items-center justify-between border text-left transition-all ${
                selectedIndex === -1
                  ? 'bg-gradient-to-r from-purple-950/50 to-indigo-950/50 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                  : 'bg-white/5 border-white/5 hover:border-white/10 text-zinc-400'
              }`}
            >
              <div>
                <div className="text-sm font-bold text-white">Tüm Monitörler (Senkronize)</div>
                <div className="text-xs text-zinc-400 font-mono mt-0.5">Tüm bağlı ekranlara aynı anda filtre uygular</div>
              </div>
              {selectedIndex === -1 && <Check className="w-5 h-5 text-purple-400 stroke-[3]" />}
            </button>

            {/* Individual Monitors */}
            {monitors.map((m) => {
              const isSelected = selectedIndex === m.index;
              return (
                <button
                  key={m.index}
                  onClick={() => onSelectMonitor(m.index)}
                  className={`p-4 rounded-2xl flex items-center justify-between border text-left transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-950/50 to-blue-950/50 border-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                      : 'bg-white/5 border-white/5 hover:border-white/10 text-zinc-400'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Monitör {m.index + 1}</span>
                      {m.isPrimary && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                          Ana Oyun Ekranı
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-400 font-mono mt-1">
                      {m.width}x{m.height} @ {m.refreshRate}Hz • {m.name}
                    </div>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-cyan-400 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Smart Game Hook & Alt+Tab Reset Policy */}
        <div className="glass-card p-6 rounded-3xl border border-purple-500/15 flex flex-col gap-5 shadow-xl">
          <div className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2 pb-2 border-b border-white/5">
            <Activity className="w-4 h-4 text-emerald-400" />
            Otomatik Süreç & Masaüstü Sıfırlama
          </div>

          <div className="flex flex-col gap-4 text-xs text-zinc-300">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-2">
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Masaüstüne Dönünce Sıfırla (Alt+Tab)
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  AKTİF
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-light leading-relaxed">
                Oyundan masaüstüne geçiş yaptığınızda renk ayarları otomatik olarak Windows varsayılanına döner. Oyuna döndüğünüzde profil yeniden aktif olur.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-2">
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  Otomatik Oyun Tanıma Motoru
                </span>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  AKTİF (1000ms)
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-light leading-relaxed">
                Arka planda çalışan oyun ve 3D grafik süreçlerini tarayarak profil otomatik bağlanır.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
