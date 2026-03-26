"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type Module = {
  id: number;
  title: string;
  description?: string | null;
};

export default function ModulesPage() {
  // Page owns full module catalog state and local search filtering state.
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  useEffect(() => {
    // Synchronizes visible module cards with backend data for the current session.
    const fetchModules = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setModules([]);
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}`/api/modules", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await response.json();
        setModules(data);
      } catch (err) {
        console.error("Failed to fetch modules:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, [supabase]);

  const filteredModules = modules.filter(mod => 
    mod.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    mod.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-10 text-sky-400 font-mono animate-pulse">SYNCING ARCHIVES...</div>;

  return (
    // Screen ownership: header/search controls on top, module card grid in the content region.
    <div className="w-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-sm font-bold tracking-[0.2em] text-sky-400 uppercase mb-1">Curriculum</p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Learning Modules</h1>
        </div>
        <input
          type="text"
          placeholder="Search topics..."
          className="w-full md:w-96 px-4 py-2 bg-slate-800/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-sky-400/40 outline-none"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((mod) => (
          <Link href={`/modules/${mod.id}`} key={mod.id} className="block group">
            <div className="glass-panel p-6 rounded-2xl h-full flex flex-col hover:-translate-y-1 transition-all border-white/5 hover:border-sky-500/30">
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-sky-300">{mod.title}</h3>
              <p className="text-sm text-slate-400 line-clamp-3">{mod.description}</p>
              <div className="mt-auto pt-4 flex justify-between items-center text-[10px] font-bold text-sky-400 uppercase tracking-widest">
                <span>Database Node: {mod.id}</span>
                <span>Enter Module →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
