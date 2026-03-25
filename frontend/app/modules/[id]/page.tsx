"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

interface Lesson {
  id: number;
  title: string;
  content_text: string;
}

export default function ModuleIndexPage() {
  const params = useParams();
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLessons([]);
          return;
        }

        const res = await fetch(`http://localhost:8000/api/modules/${params.id}/lessons`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch lessons");
        const data = await res.json();
        setLessons(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    void fetchLessons();
  }, [params.id, supabase]);

  if (loading) return <div className="p-10 text-sky-400 font-mono animate-pulse">DECRYPTING MODULE ARCHIVES...</div>;

  return (
    <div className="w-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
      <button 
        onClick={() => router.push('/modules')}
        className="text-sky-400 hover:text-sky-300 text-sm font-bold tracking-widest uppercase flex items-center gap-2 w-max transition-colors"
      >
        ← Back to Curriculum
      </button>

      <div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2 text-glow">Module Sequences</h1>
        <p className="text-slate-400">Select a technical payload below to begin your study sequence.</p>
      </div>

      {lessons.length === 0 ? (
        <div className="glass-panel p-10 text-center rounded-2xl border-dashed border-white/10">
          <p className="text-slate-500 font-medium">No payload data found in this module node.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {lessons.map((lesson, index) => (
            <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
              <div className="glass-panel p-6 rounded-2xl shadow-sm border border-white/5 hover:border-sky-500/50 hover:shadow-[0_0_20px_rgba(56,189,248,0.15)] transition-all cursor-pointer group flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-sky-400 mb-1">
                    Sequence {index + 1}
                  </p>
                  <h2 className="text-xl font-bold text-white group-hover:text-sky-300 transition">
                    {lesson.title}
                  </h2>
                  <p className="text-sm text-slate-400 mt-2 line-clamp-2 max-w-xl">
                    {lesson.content_text}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-sky-500/20 group-hover:border-sky-500/50 transition">
                  <span className="text-sky-400 ml-1">▶</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
