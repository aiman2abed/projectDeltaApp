"use client";

import Link from "next/link";
import { useState } from "react";

// Mock data for the curriculum 
const mockModules = [
  {
    id: "pe-101",
    title: "Power Electronics",
    description: "Rectifiers, Inverters, and DC-DC Converters topology and analysis.",
    icon: "⚡",
    progress: 85,
    totalLessons: 12,
    color: "from-amber-400 to-orange-600",
    glow: "group-hover:bg-amber-500/20"
  },
  {
    id: "vlsi-201",
    title: "VLSI Design",
    description: "CMOS logic, SRAM structures, adders, and layout optimization.",
    icon: "🔬",
    progress: 40,
    totalLessons: 18,
    color: "from-purple-400 to-indigo-600",
    glow: "group-hover:bg-purple-500/20"
  },
  {
    id: "ctrl-301",
    title: "Control Theory",
    description: "System stability, Bode plots, gain/phase margins, and PID controllers.",
    icon: "📈",
    progress: 15,
    totalLessons: 10,
    color: "from-sky-400 to-blue-600",
    glow: "group-hover:bg-sky-500/20"
  },
  {
    id: "emb-401",
    title: "Embedded Systems",
    description: "MIPS assembly, C programming, and hardware-software interfaces.",
    icon: "📟",
    progress: 0,
    totalLessons: 15,
    color: "from-emerald-400 to-teal-600",
    glow: "group-hover:bg-emerald-500/20"
  },
  {
    id: "dsp-501",
    title: "Signal Processing",
    description: "Discrete-time signals, Z-transforms, and FIR/IIR filter design.",
    icon: "🌊",
    progress: 100,
    totalLessons: 14,
    color: "from-pink-400 to-rose-600",
    glow: "group-hover:bg-pink-500/20"
  }
];

export default function ModulesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Simple filter based on search input
  const filteredModules = mockModules.filter(mod => 
    mod.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    mod.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header & Search Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-sm font-bold tracking-[0.2em] text-sky-400 uppercase mb-1">
            Curriculum
          </p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Learning Modules
          </h1>
        </div>
        
        {/* Glass Search Bar */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input
            type="text"
            placeholder="Search topics, equations, or concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400/40 transition-all duration-200 placeholder:text-slate-500 shadow-inner"
          />
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.length > 0 ? (
          filteredModules.map((mod) => (
            <Link href={`/modules/${mod.id}`} key={mod.id} className="block group">
              <div className="glass-panel p-6 rounded-2xl h-full flex flex-col relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-slate-500/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
                
                {/* Background Ambient Glow */}
                <div className={`absolute -right-12 -top-12 w-40 h-40 rounded-full blur-3xl transition-colors duration-500 opacity-0 group-hover:opacity-100 ${mod.glow}`} />

                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center text-2xl shadow-lg`}>
                    {mod.icon}
                  </div>
                  {mod.progress === 100 && (
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      Mastered
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-white mb-2 relative z-10 group-hover:text-sky-300 transition-colors">
                  {mod.title}
                </h3>
                <p className="text-sm text-slate-400 flex-grow relative z-10 line-clamp-2">
                  {mod.description}
                </p>

                {/* Progress Footer */}
                <div className="mt-6 pt-4 border-t border-white/5 relative z-10">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <span>{mod.totalLessons} Lessons</span>
                    <span className={mod.progress > 0 ? "text-sky-400" : ""}>{mod.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${mod.color} transition-all duration-1000 ease-out`}
                      style={{ width: `${mod.progress}%` }}
                    />
                  </div>
                </div>

              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 glass-panel rounded-2xl border-dashed border-white/10">
            <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p className="text-lg font-medium">No modules found matching "{searchQuery}"</p>
          </div>
        )}
      </div>

    </div>
  );
}