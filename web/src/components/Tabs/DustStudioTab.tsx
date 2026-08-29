import React, { useState } from 'react';
import {
  Sparkles,
  Star,
  ExternalLink,
  Shield,
  Monitor,
  Video,
  Globe,
  Layers,
  Boxes,
  CheckCircle2,
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
      {/* Symmetrical Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/25 bg-gradient-to-b from-[#130d29]/90 to-[#0a0717]/95 p-7 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-72 h-72 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Row: Pure Logo & Studio Info on Left, Symmetric Buttons on Right */}
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Pure Logo + Studio Title */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <img
              src="/logo.png"
              alt="Dust Studio Logo"
              className="w-14 h-14 object-contain drop-shadow-[0_0_16px_rgba(168,85,247,0.5)] flex-shrink-0"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-bold text-white font-mono tracking-wider">
                  DUST STUDIO
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                  {t.developerBadge}
                </span>
              </div>
              <a
                href="https://dust-studio.com"
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenExternal('https://dust-studio.com');
                }}
                className="text-xs text-fuchsia-400/90 font-mono hover:text-fuchsia-300 transition-colors mt-0.5 flex items-center gap-1 w-fit"
              >
                <Globe className="w-3 h-3 text-fuchsia-400" />
                https://dust-studio.com
              </a>
            </div>
          </div>

          {/* Right: Symmetrical Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-start md:justify-end">
            <button
              onClick={handleStarClick}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-xs font-mono shadow-[0_0_18px_rgba(245,158,11,0.35)] transition-all active:scale-95"
            >
              <Star className="w-3.5 h-3.5 fill-black" />
              {starredLocally ? (lang === 'tr' ? 'Yıldızlandı!' : 'Starred!') : t.starButton}
            </button>

            <button
              onClick={() => onOpenExternal('https://github.com/Dust-exe')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-xs border border-white/10 transition-all active:scale-95 font-mono"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              GitHub: Dust-exe
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="my-5 border-t border-white/5" />

        {/* Bio & Star Text */}
        <div className="relative z-10 flex flex-col gap-3">
          <p className="text-xs text-zinc-300 leading-relaxed font-light">
            {t.developerBio}
          </p>
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-fuchsia-400 flex-shrink-0" />
            <span>{t.starDesc}</span>
          </div>
        </div>
      </div>

      {/* Tech Stack Bar */}
      <div className="glass-card p-5 rounded-3xl border border-white/5 bg-[#0d0a1a]/70 flex flex-col gap-3 shadow-xl">
        <span className="text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider flex items-center gap-2">
          <Boxes className="w-4 h-4 text-purple-400" />
          {t.techStackHeader}
        </span>
        <div className="flex flex-wrap gap-2">
          {techStack.map((tech) => (
            <span
              key={tech.name}
              className={`text-xs font-mono font-medium px-3 py-1.5 rounded-xl border ${tech.color} shadow-sm transition-transform hover:scale-105`}
            >
              {tech.name}
            </span>
          ))}
        </div>
      </div>

      {/* Selected Projects Header */}
      <div className="flex flex-col gap-1 pt-1">
        <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
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
              <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                {t.dustVpnCategory}
              </span>
            </div>

            <div>
              <h4 className="text-base font-bold text-white font-mono group-hover:text-blue-300 transition-colors">
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
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-mono font-semibold border border-blue-500/20 transition-all active:scale-95"
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
              <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                v2.0.0 Active
              </span>
            </div>

            <div>
              <h4 className="text-base font-bold text-white font-mono group-hover:text-purple-300 transition-colors">
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
              <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                {t.dustReplayCategory}
              </span>
            </div>

            <div>
              <h4 className="text-base font-bold text-white font-mono group-hover:text-emerald-300 transition-colors">
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
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-mono font-semibold border border-emerald-500/20 transition-all active:scale-95"
          >
            <Globe className="w-3.5 h-3.5" />
            {t.visitWebsiteBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
