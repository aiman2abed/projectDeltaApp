"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { ModuleProgressSummary } from "@/types/api";

export default function Dashboard() {
  // Dashboard owns telemetry state used by both KPI cards and the priority panel.
  const [stats, setStats] = useState<ModuleProgressSummary[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Engineer");
  const router = useRouter();

  useEffect(() => {
    // Synchronizes the landing dashboard with auth identity and backend progress snapshots.
    const fetchTelemetry = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (session.user?.user_metadata?.first_name) {
        setUserName(session.user.user_metadata.first_name);
      } else if (session.user?.email) {
        setUserName(session.user.email.split('@')[0]);
      }

      const headers = { Authorization: `Bearer ${session.access_token}` };

      try {
        const [statsRes, dueRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}$1`/api/progress/summary", { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}$1`/api/progress/due", { headers })
        ]);

        const statsData = await statsRes.json();
        const dueData = await dueRes.json();

        setStats(statsData);
        setDueCount(dueData.due_count);
      } catch (err) {
        console.error("Telemetry Sync Failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
  }, []);

  const priorityModule = stats.length > 0 
    ? stats.reduce((prev, current) => (prev.mastery_score < current.mastery_score) ? prev : current)
    : null;

  const avgRetention = stats.length > 0 
    ? Math.round(stats.reduce((acc, curr) => acc + curr.mastery_score, 0) / stats.length) 
    : 0;

  const handlePriorityClick = () => {
    // Interaction ownership: clicking the hero card navigates into the chosen module detail page.
    if (priorityModule) {
      router.push(`/modules/${priorityModule.module_id}`);
    }
  };

  if (loading) {
    return <div className="w-full h-96 flex items-center justify-center text-sky-400 font-mono animate-pulse">
      INITIALIZING SYSTEM TELEMETRY...
    </div>;
  }

  return (
    // Page container controls vertical rhythm for header, KPI row, and two-column content region.
    <div className="w-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold tracking-[0.2em] text-sky-400 uppercase mb-1">
            Command Center
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600 text-glow capitalize">{userName}</span>
          </h1>
        </div>
        <Link 
          href="/review"
          className="px-6 py-3 rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
        >
          <span>Start Review Session</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </Link>
      </div>

      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2 hover:border-sky-500/30 transition-colors group">
          <div className="flex items-center gap-3 text-slate-400 group-hover:text-sky-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012-2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <span className="text-sm font-bold uppercase tracking-wider">Memory Retention</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-white">{avgRetention}</span>
            <span className="text-xl font-bold text-slate-500 mb-1">%</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2 hover:border-sky-500/30 transition-colors group">
          <div className="flex items-center gap-3 text-slate-400 group-hover:text-amber-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>
            <span className="text-sm font-bold uppercase tracking-wider">Modules Active</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-white">{stats.length}</span>
            <span className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">Topics</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2 hover:border-sky-500/30 transition-colors group">
          <div className="flex items-center gap-3 text-slate-400 group-hover:text-red-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-sm font-bold uppercase tracking-wider">Pending Reviews</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-white">{dueCount}</span>
            <span className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">Cards</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        {/* Left content column owns primary CTA and progress narrative. */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            Priority Module
          </h2>
          
          <div 
            onClick={handlePriorityClick}
            className="glass-panel-active p-8 rounded-3xl relative overflow-hidden group cursor-pointer hover:shadow-[0_0_30px_rgba(56,189,248,0.2)] transition-all duration-300"
          >
            <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-sky-400/20 transition-colors duration-500" />
            
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-widest text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-full w-max">
                  {priorityModule?.module_title || "Initializing..."}
                </span>
                <span className="text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                  Enter Sequence →
                </span>
              </div>

              <h3 className="text-3xl font-extrabold text-white">
                {priorityModule ? `Mastery Level: ${Math.round(priorityModule.mastery_score)}%` : "Database Syncing..."}
              </h3>
              <p className="text-slate-400 max-w-md leading-relaxed">
                {priorityModule 
                  ? `Your memory decay curve suggests focusing on ${priorityModule.module_title} today to maintain optimal retention.` 
                  : "Scanning your neural decay patterns to determine the optimal study path..."}
              </p>
              
              <div className="mt-4 flex items-center gap-4">
                <div className="w-full bg-slate-800/50 rounded-full h-2 max-w-xs border border-white/5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-sky-400 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: `${priorityModule?.mastery_score || 0}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-400">{Math.round(priorityModule?.mastery_score || 0)}% Mastered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar owns module activity list and remains secondary to the priority card. */}
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-slate-200">System Activity</h2>
          <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4 h-full  overflow-hidden relative">
            {stats.length === 0 ? (
               <div className="flex-1 flex items-center justify-center text-center text-slate-500 italic text-sm  px-4  animate-pulse">
                 <p>Awaiting data injection. Visit the Discover page to add payloads to your engine.</p>
               </div>
            ) : (
              <div className="flex flex-col gap-4 overflow-y-auto max-h-[300px] scrollbar-hide pr-2">
                {stats.map((stat, idx) => (
                  <Link href={`/modules/${stat.module_id}`} key={idx} className="flex flex-col gap-2 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 group cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors truncate pr-4">
                        {stat.module_title}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {stat.lessons_started}/{stat.total_lessons}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800/50 rounded-full h-1 border border-white/5">
                      <div 
                        className={`h-1 rounded-full ${stat.mastery_score > 80 ? 'bg-emerald-400' : stat.mastery_score > 40 ? 'bg-amber-400' : 'bg-sky-400'}`}
                        style={{ width: `${stat.mastery_score}%` }}
                      />
                    </div>
                  </Link>
                 ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
