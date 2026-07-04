/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import GameSection from './components/GameSection';
import FamilySection from './components/FamilySection';
import DeveloperSection from './components/DeveloperSection';
import { Gamepad2, Users, Code, Sparkles } from 'lucide-react';

type Tab = 'game' | 'family' | 'developer';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('game');

  return (
    <div className="min-h-screen bg-[#030308] text-slate-100 flex flex-col relative overflow-x-hidden select-none">
      
      {/* Background neon grid/aura decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-pink-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* STICKY HEADER NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-[#030308]/90 backdrop-blur-md border-b-2 border-slate-900 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo / Title */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('game')}>
            <div className="relative p-1.5 bg-slate-900 border border-slate-700 rounded-md shadow-[0_0_8px_rgba(6,182,212,0.2)]">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <h1 className="font-sans text-lg md:text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-400 uppercase" style={{ fontFamily: '"Pixelify Sans", sans-serif' }}>
              TSK Family
            </h1>
          </div>

          {/* Navigation Tabs (44px touch targets on mobile) */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {[
              { id: 'game', label: 'Game', icon: Gamepad2, color: 'text-cyan-400', shadow: 'shadow-[0_0_10px_rgba(6,182,212,0.3)] border-cyan-500/50' },
              { id: 'family', label: 'Family', icon: Users, color: 'text-purple-400', shadow: 'shadow-[0_0_10px_rgba(168,85,247,0.3)] border-purple-500/50' },
              { id: 'developer', label: 'Developer', icon: Code, color: 'text-pink-400', shadow: 'shadow-[0_0_10px_rgba(236,72,153,0.3)] border-pink-500/50' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`relative flex items-center gap-1.5 px-3 sm:px-4 h-11 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isActive 
                      ? `bg-slate-900/90 text-white border-2 ${tab.shadow}` 
                      : 'text-slate-400 hover:text-slate-200 border-2 border-transparent hover:bg-slate-900/30'
                  }`}
                  style={{ fontFamily: '"Pixelify Sans", sans-serif' }}
                >
                  <Icon className={`w-4 h-4 ${isActive ? tab.color : 'text-slate-400'}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

        </div>
      </header>

      {/* CORE CONTENT TRANSITION STAGE */}
      <main className="flex-grow flex flex-col justify-center py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="w-full h-full flex flex-col items-center justify-center"
          >
            {activeTab === 'game' && <GameSection />}
            {activeTab === 'family' && <FamilySection />}
            {activeTab === 'developer' && <DeveloperSection />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER SYSTEM */}
      <footer className="w-full bg-slate-950/80 border-t-2 border-slate-900/60 py-6 text-center">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] text-slate-500 uppercase tracking-widest">
          <span>&copy; {new Date().getFullYear()} TSK FAMILY COUNCIL. ALL RIGHTS RESERVED.</span>
          <div className="flex gap-4">
            <span className="hover:text-cyan-400 transition-colors cursor-help" title="TSK SYSTEM ENGINE v1.0.4">ENGINE: v1.0.4</span>
            <span className="hover:text-purple-400 transition-colors">MADE FOR THE FAM</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
