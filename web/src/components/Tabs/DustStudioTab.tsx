import React, { useState } from 'react';
import {
  Sparkles,
  Star,
  ExternalLink,
  Zap,
  ShieldCheck,
  Cpu,
  Layers,
  Heart,
  Code,
  CheckCircle,
  Flame,
  MessageSquare,
  Bookmark,
} from 'lucide-react';
import { translations, Language } from '../../translations';

interface DustStudioTabProps {
  lang: Language;
  onOpenExternal: (url: string) => void;
}

export const DustStudioTab: React.FC<DustStudioTabProps> = ({ lang, onOpenExternal }) => {
  const t = translations[lang];
  const [starredLocally, setStarredLocally] = useState(false);

  const handleStarClick = () => {
    setStarredLocally(true);
    onOpenExternal('https://github.com/Dust-exe/DustFX');
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-fuchsia-400" />
            {t.dustStudioTitle}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {t.dustStudioSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
            <Flame className="w-3.5 h-3.5 text-fuchsia-400" />
            100% Free & Open Source
          </span>
        </div>
      </div>

      {/* Hero Banner with Star Callout */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/60 via-[#0e0a1e]/90 to-fuchsia-950/50 p-7 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-cyan-400 p-[2px] shadow-[0_0_25px_rgba(168,85,247,0.5)] flex-shrink-0">
              <div className="w-full h-full bg-[#090614] rounded-[14px] flex items-center justify-center p-2">
                <img src="/logo.png" alt="Dust Studio Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-white font-mono tracking-wide">
                  DUST STUDIO
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-zinc-300 border border-white/10 font-bold">
                  v1.3.0
                </span>
              </div>
              <p className="text-xs text-fuchsia-300 font-medium">
                DCCW & GPU Hardware Display Optimization Engine
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleStarClick}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs font-mono shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all active:scale-95 group"
            >
              <Star className={`w-4 h-4 text-black fill-black ${starredLocally ? 'animate-bounce' : 'group-hover:rotate-12'} transition-transform`} />
              {starredLocally ? '⭐ Starred on GitHub!' : t.starButton}
            </button>

            <button
              onClick={() => onOpenExternal('https://github.com/Dust-exe/DustFX')}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/15 transition-all active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-300" />
              GitHub
            </button>
          </div>
        </div>

        {/* Star Message Banner */}
        <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-xs text-zinc-300">
          <p className="leading-relaxed text-zinc-300 max-w-3xl">
            {t.starDesc}
          </p>
        </div>
      </div>

      {/* About Developer & Philosophy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 glass-card p-6 rounded-3xl border border-white/10 bg-[#0e0a1a]/70 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center gap-2.5 text-sm font-bold text-white font-mono">
            <Code className="w-4 h-4 text-purple-400" />
            {t.aboutTitle}
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed font-light">
            {t.aboutContent}
          </p>
          <div className="pt-3 border-t border-white/5 flex flex-wrap gap-2">
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400">
              ⚡ C++20 Standard
            </span>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400">
              🛡️ Win32 GDI & NVAPI
            </span>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400">
              🎮 Zero Input Delay
            </span>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400">
              ⚛️ React + Tailwind
            </span>
          </div>
        </div>

        {/* Quick Links Card */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 bg-[#0e0a1a]/70 flex flex-col justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-2 text-sm font-bold text-white font-mono">
            <Heart className="w-4 h-4 text-fuchsia-400" />
            Ecosystem Links
          </div>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => onOpenExternal('https://github.com/Dust-exe/DustFX/releases')}
              className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-200 border border-white/10 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Bookmark className="w-3.5 h-3.5 text-purple-400" />
                {t.releasesButton}
              </span>
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </button>

            <button
              onClick={() => onOpenExternal('https://github.com/Dust-exe/DustFX/issues')}
              className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-200 border border-white/10 transition-colors"
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-fuchsia-400" />
                {t.issuesButton}
              </span>
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </button>
          </div>

          <div className="text-[11px] text-zinc-500 font-mono text-center">
            Developed with 💜 by Dust Studio
          </div>
        </div>
      </div>

      {/* 4 Feature Highlights Grid */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider">
          {t.featuresTitle}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white font-mono">{t.feat1Title}</h5>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{t.feat1Desc}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white font-mono">{t.feat2Title}</h5>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{t.feat2Desc}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 flex-shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white font-mono">{t.feat3Title}</h5>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{t.feat3Desc}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white font-mono">{t.feat4Title}</h5>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{t.feat4Desc}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
