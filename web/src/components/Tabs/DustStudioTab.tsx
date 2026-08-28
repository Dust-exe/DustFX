import React, { useState } from 'react';
import {
  Sparkles,
  Star,
  ExternalLink,
  Shield,
  Monitor,
  Video,
  Code,
  Flame,
  Globe,
  Layers,
  Terminal,
  Server,
  Database,
  Cpu,
  Boxes,
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

  const techStack = [
    { name: 'Python', color: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20' },
    { name: 'TypeScript', color: 'text-blue-300 bg-blue-500/10 border-blue-500/20' },
    { name: 'React', color: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20' },
    { name: 'Next.js', color: 'text-zinc-200 bg-white/10 border-white/20' },
    { name: 'FastAPI', color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' },
    { name: 'C#', color: 'text-purple-300 bg-purple-500/10 border-purple-500/20' },
    { name: 'C / C++20', color: 'text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/20' },
    { name: 'Node.js', color: 'text-green-300 bg-green-500/10 border-green-500/20' },
    { name: 'PostgreSQL', color: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20' },
    { name: 'Redis', color: 'text-red-300 bg-red-500/10 border-red-500/20' },
    { name: 'Docker', color: 'text-sky-300 bg-sky-500/10 border-sky-500/20' },
    { name: 'Linux', color: 'text-orange-300 bg-orange-500/10 border-orange-500/20' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fadeIn select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/5">
        <div>
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-fuchsia-400" />
            {t.dustStudioTitle}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {t.dustStudioSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenExternal('https://dust-studio.com/')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold transition-all active:scale-95 shadow-[0_0_12px_rgba(168,85,247,0.25)]"
          >
            <Globe className="w-3.5 h-3.5 text-purple-400" />
            {t.visitWebsiteBtn}
          </button>
        </div>
      </div>

      {/* Hero Developer Banner with GitHub Star CTA */}
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
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  {t.developerBadge}
                </span>
              </div>
              <p className="text-xs text-fuchsia-300 font-medium font-mono">
                https://dust-studio.com
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
              onClick={() => onOpenExternal('https://github.com/Dust-exe')}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/15 transition-all active:scale-95 font-mono"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-300" />
              GitHub: Dust-exe
            </button>
          </div>
        </div>

        {/* Bio Description */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col gap-3">
          <p className="text-xs text-zinc-300 leading-relaxed max-w-4xl font-light">
            {t.developerBio}
          </p>
          <div className="flex items-center gap-2 text-xs text-amber-300/90 font-mono">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
            <span>{t.starDesc}</span>
          </div>
        </div>
      </div>

      {/* Tech Stack Bar */}
      <div className="glass-card p-5 rounded-3xl border border-white/10 bg-[#0e0a1a]/70 flex flex-col gap-3 shadow-xl">
        <span className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-2">
          <Boxes className="w-4 h-4 text-purple-400" />
          {t.techStackHeader}
        </span>
        <div className="flex flex-wrap gap-2">
          {techStack.map((tech) => (
            <span
              key={tech.name}
              className={`text-xs font-mono font-semibold px-3 py-1.5 rounded-xl border ${tech.color} shadow-sm transition-transform hover:scale-105`}
            >
              {tech.name}
            </span>
          ))}
        </div>
      </div>

      {/* Selected Projects Header */}
      <div className="flex flex-col gap-1 pt-2">
        <h3 className="text-base font-extrabold text-white font-mono flex items-center gap-2">
          <Layers className="w-5 h-5 text-fuchsia-400" />
          {t.selectedProjectsHeader}
        </h3>
        <p className="text-xs text-zinc-400">
          {t.selectedProjectsSub}
        </p>
      </div>

      {/* 3 Projects Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Project 1: Dust-vpn */}
        <div className="glass-card p-6 rounded-3xl border border-blue-500/20 bg-[#090b1c]/80 flex flex-col justify-between gap-5 shadow-xl hover:border-blue-500/40 transition-all group">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                {t.dustVpnCategory}
              </span>
            </div>

            <div>
              <h4 className="text-base font-extrabold text-white font-mono group-hover:text-blue-300 transition-colors">
                {t.dustVpnTitle}
              </h4>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400">Python</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400">Linux</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400">C</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400">AmneziaWG</span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-light">
              {t.dustVpnDesc}
            </p>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-blue-400 font-mono tracking-wider">
                {t.theEngineering}
              </span>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-light">
                {t.dustVpnEng}
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenExternal('https://github.com/Dust-exe/Dust-vpn')}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-mono font-bold border border-blue-500/20 transition-all active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t.viewSource}
          </button>
        </div>

        {/* Project 2: DustFX (Current App) */}
        <div className="glass-card p-6 rounded-3xl border border-purple-500/30 bg-[#0e0a1f]/90 flex flex-col justify-between gap-5 shadow-2xl hover:border-purple-500/50 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex flex-col gap-3 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Monitor className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                v1.4.0 Active
              </span>
            </div>

            <div>
              <h4 className="text-base font-extrabold text-white font-mono group-hover:text-purple-300 transition-colors">
                {t.dustFxTitle}
              </h4>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400">C++20</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400">React</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400">TypeScript</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400">Win32 GDI/NVAPI</span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-light">
              {t.dustFxDesc}
            </p>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-purple-400 font-mono tracking-wider">
                {t.theEngineering}
              </span>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-light">
                {t.dustFxEng}
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenExternal('https://github.com/Dust-exe/DustFX')}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-xs font-mono font-bold shadow-[0_0_15px_rgba(168,85,247,0.35)] transition-all active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t.viewSource}
          </button>
        </div>

        {/* Project 3: DustReplay */}
        <div className="glass-card p-6 rounded-3xl border border-emerald-500/20 bg-[#091512]/80 flex flex-col justify-between gap-5 shadow-xl hover:border-emerald-500/40 transition-all group">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Video className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                {t.dustReplayCategory}
              </span>
            </div>

            <div>
              <h4 className="text-base font-extrabold text-white font-mono group-hover:text-emerald-300 transition-colors">
                {t.dustReplayTitle}
              </h4>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400">C# WPF</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400">Python</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400">DXGI</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400">NVENC / FFmpeg</span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-light">
              {t.dustReplayDesc}
            </p>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-wider">
                {t.theEngineering}
              </span>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-light">
                {t.dustReplayEng}
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenExternal('https://dust-studio.com/')}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/20 transition-all active:scale-95"
          >
            <Globe className="w-3.5 h-3.5" />
            {t.visitWebsiteBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
