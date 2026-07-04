/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { familyMembers } from '../data/familyData';
import { Search, User, ShieldAlert, Sparkles, Smile, Coffee } from 'lucide-react';

export default function FamilySection() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtering members by Name, Nickname, or Description (case insensitive)
  const filteredMembers = familyMembers.filter((member) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      member.name.toLowerCase().includes(query) ||
      member.nickname.toLowerCase().includes(query) ||
      member.description.toLowerCase().includes(query)
    );
  });

  // Procedural retro-styled avatars helper using colors based on names
  const getAvatarConfig = (name: string) => {
    const colors = [
      'from-cyan-500 to-blue-600 border-cyan-400 text-cyan-200',
      'from-purple-500 to-indigo-600 border-purple-400 text-purple-200',
      'from-pink-500 to-rose-600 border-pink-400 text-pink-200',
      'from-emerald-500 to-teal-600 border-emerald-400 text-emerald-200',
      'from-amber-500 to-orange-600 border-amber-400 text-amber-200',
    ];
    // Hash based on name length + first characters
    const charSum = name.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const index = charSum % colors.length;
    
    // Initials helper
    const parts = name.split(' ');
    const initials = parts.length > 1 
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() 
      : name.substr(0, 2).toUpperCase();

    return {
      gradient: colors[index],
      initials,
    };
  };

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto px-4" id="family-section-container">
      
      {/* Search Header */}
      <div className="text-center mb-8 w-full max-w-2xl">
        <h2 className="font-sans text-3xl md:text-4xl text-purple-400 font-bold tracking-widest uppercase mb-3 drop-shadow-[0_2px_8px_rgba(168,85,247,0.4)]" style={{ fontFamily: '"Pixelify Sans", sans-serif' }}>
          TSK Family Directory
        </h2>
        <p className="text-gray-400 text-xs md:text-sm mb-6" style={{ fontFamily: '"Pixelify Sans", sans-serif' }}>
          Meet the extraordinary members of the TSK gang. Search by name, nickname, or description.
        </p>

        {/* Custom Search Box */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
          <input
            type="text"
            id="member-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search family members..."
            className="w-full py-3.5 pl-12 pr-4 bg-slate-900 border-2 border-slate-700 hover:border-purple-500 focus:border-cyan-400 focus:outline-none text-white rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] font-mono text-sm transition-all placeholder:text-slate-500"
            style={{ fontFamily: '"Pixelify Sans", sans-serif' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 hover:text-white uppercase"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Grid Content */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-12">
          {filteredMembers.map((member) => {
            const avatar = getAvatarConfig(member.name);
            const isSpecialBadge = member.nickname.toLowerCase().includes('lady boss') || member.nickname.toLowerCase().includes('professor');

            return (
              <div
                key={member.id}
                id={`member-card-${member.id}`}
                className="group relative flex flex-col bg-slate-900/80 border-2 border-slate-800 hover:border-purple-500 rounded-xl p-5 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.4)] transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-[0_10px_20px_rgba(168,85,247,0.15)] overflow-hidden"
              >
                {/* Visual grid accent lines inside cards */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-transparent to-purple-500/5 group-hover:to-purple-500/15 transition-all duration-300 rounded-tr-xl border-t border-r border-transparent" />
                
                {/* Header info (Avatar and Names) */}
                <div className="flex items-start gap-4 mb-4">
                  {/* Avatar */}
                  <div className={`relative flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${avatar.gradient} border-2 font-mono text-base font-bold shadow-md shrink-0`}>
                    <span>{avatar.initials}</span>
                    {/* Tiny retro dot/flare */}
                    <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse border border-slate-900" />
                  </div>

                  {/* Name and Nickname */}
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-white text-base md:text-lg tracking-tight truncate group-hover:text-cyan-300 transition-colors">
                      {member.name}
                    </span>
                    
                    {/* Nickname Badge - omitted if nickname is empty or dash */}
                    {member.nickname && member.nickname !== '-' ? (
                      <span className={`inline-block text-[11px] font-bold tracking-wider uppercase mt-1 px-2 py-0.5 rounded border self-start ${
                        isSpecialBadge 
                          ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-[0_0_4px_rgba(245,158,11,0.2)]' 
                          : 'bg-purple-950/80 border-purple-500/50 text-purple-300'
                      }`}>
                        {member.nickname}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Description Text */}
                <p className="text-gray-300 text-xs md:text-sm leading-relaxed border-t border-slate-800/60 pt-3 flex-grow font-normal italic">
                  &ldquo;{member.description}&rdquo;
                </p>

                {/* Card footer indicator decorative item */}
                <div className="flex items-center justify-between mt-4 pt-2 border-t border-slate-800/30 text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                  <span className="flex items-center gap-1">
                    {member.id === 1 && <Sparkles className="w-3 h-3 text-cyan-400" />}
                    {member.id === 8 && <Smile className="w-3 h-3 text-purple-400" />}
                    {member.id === 9 && <ShieldAlert className="w-3 h-3 text-pink-400" />}
                    {member.id !== 1 && member.id !== 8 && member.id !== 9 && <Coffee className="w-3 h-3 text-slate-500" />}
                    TSK MEMBER #{member.id}
                  </span>
                  <span className="text-gray-600">ID: {member.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 border border-slate-800 rounded-xl w-full max-w-2xl text-center mb-12">
          <User className="w-12 h-12 text-gray-600 mb-3 animate-bounce" />
          <p className="text-gray-400 font-mono text-sm" style={{ fontFamily: '"Pixelify Sans", sans-serif' }}>
            No members matched &ldquo;{searchQuery}&rdquo;. Try another name, nickname, or quote!
          </p>
        </div>
      )}
    </div>
  );
}
