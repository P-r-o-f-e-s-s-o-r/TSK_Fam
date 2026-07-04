/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Github, Mail, Globe, Sparkles, Terminal, Code } from 'lucide-react';

export default function DeveloperSection() {
  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-4" id="developer-section-container">
      
      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="font-sans text-3xl md:text-4xl text-cyan-400 font-bold tracking-widest uppercase mb-3 drop-shadow-[0_2px_8px_rgba(6,182,212,0.4)]" style={{ fontFamily: '"Pixelify Sans", sans-serif' }}>
          System Developer
        </h2>
        <p className="text-gray-400 text-xs md:text-sm" style={{ fontFamily: '"Pixelify Sans", sans-serif' }}>
          Credits and technical specifications for the TSK Family game console.
        </p>
      </div>

      {/* Main Dev Dashboard Card */}
      <div className="w-full bg-slate-900/90 border-2 border-slate-700 rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] mb-12">
        {/* Terminal Titlebar */}
        <div className="flex items-center justify-between bg-slate-950 px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-mono text-xs text-slate-400 tracking-wider">TSK-CORE-OS // DEV_CREDITS</span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Left Column: Stylized Retro Tech Graphic / Avatar */}
          <div className="md:col-span-2 flex flex-col items-center justify-center p-6 bg-slate-950 border border-slate-800 rounded-lg text-center">
            {/* Holographic Glowing Ring */}
            <div className="relative w-32 h-32 mb-4 flex items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 p-1 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse">
              <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center text-white font-mono">
                <Code className="w-8 h-8 text-cyan-400 mb-1" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">MRJ</span>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-black font-mono font-bold text-[10px] px-1.5 py-0.5 rounded shadow">
                PRO
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: '"Pixelify Sans", sans-serif' }}>
              Mukeshwar Raudra J
            </h3>
            <span className="text-xs font-bold uppercase text-purple-400 tracking-widest mb-4">
              Professor / Architect
            </span>
            <p className="text-gray-400 text-xs leading-relaxed max-w-xs">
              Specialist in web experiences, retro gameloops, and high-fidelity client-side compilation systems.
            </p>
          </div>

          {/* Right Column: Technical Details & Links */}
          <div className="md:col-span-3 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase text-slate-500 block mb-1">Current Operations</span>
                <p className="text-sm text-gray-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  Lead Creator of the <b>TSK Family Web Suite</b>
                </p>
              </div>

              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase text-slate-500 block mb-1">Tech Stack Utilized</span>
                <div className="flex flex-wrap gap-2 mt-1.5 font-mono text-[11px]">
                  <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-cyan-300">Vite React 19</span>
                  <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-cyan-300">TypeScript</span>
                  <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-cyan-300">Tailwind CSS v4</span>
                  <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-cyan-300">HTML5 Canvas</span>
                  <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-cyan-300">Web Audio Synth</span>
                  <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-cyan-300">Motion API</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase text-slate-500 block mb-2">Secure Communications</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs text-gray-300">
                  <a
                    href="mailto:mukeshwarraudra369@gmail.com"
                    id="dev-email-link"
                    className="flex items-center gap-2 p-2 bg-slate-950/60 border border-slate-800 hover:border-cyan-400 hover:bg-slate-950 rounded transition-all"
                  >
                    <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="truncate">mukeshwarraudra369@gmail.com</span>
                  </a>
                  <a
                    href="https://github.com/mukeshwarraudra369"
                    target="_blank"
                    rel="noreferrer"
                    id="dev-github-link"
                    className="flex items-center gap-2 p-2 bg-slate-950/60 border border-slate-800 hover:border-purple-400 hover:bg-slate-950 rounded transition-all"
                  >
                    <Github className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>github/mukeshwar</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Terminal Log Footer */}
            <div className="mt-6 p-3 bg-slate-950 border border-slate-800/80 rounded font-mono text-[10px] text-emerald-400 leading-normal">
              <span className="text-slate-500">SYSTEM STATUS: </span>SUCCESSFULLY COMPILED<br />
              <span className="text-slate-500">LOCAL TIMESTAMP: </span>{new Date().toISOString().split('T')[0]} @ TSK_SERVER
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
