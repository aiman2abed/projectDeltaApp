"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";

export default function DiscoverPage() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchSmartFeed = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      try {
        const response = await fetch("http://localhost:8000/api/feed/smart", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const data = await response.json();
        setLessons(data);
      } catch (err) {
        console.error("Feed Sync Failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSmartFeed();
  }, []);

  const handleInject = async (lessonId: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Call your existing progress endpoint to start tracking this lesson
    // We send quality: 3 as a 'neutral' starting point for the SM-2 algorithm
    try {
      await fetch(`http://localhost:8000/api/progress/${lessonId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ quality: 3 }),
      });
      alert("Payload Injected: This lesson is now in your SM-2 queue!");
    } catch (err) {
      console.error("Injection failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[80vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-400 rounded-full animate-spin" />
        <p className="font-mono text-sky-400 text-sm tracking-widest">SYNCING GLOBAL REELS...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-16 bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
      {lessons.map((lesson) => (
        <section 
          key={lesson.id} 
          className="h-[calc(100vh-4rem)] w-full snap-start relative flex items-center justify-center overflow-hidden"
        >
          {/* Background Video / Visualizer */}
          <div className="absolute inset-0 z-0">
            {lesson.video_url ? (
              <video 
                src={lesson.video_url} 
                autoPlay loop muted playsInline
                className="w-full h-full object-cover opacity-60"
              />
            ) : (
              <div className="w-full h-full bg-[#0B0F19] opacity-40" />
            )}
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          </div>

          {/* Interaction Bar (Right Side) */}
          <div className="absolute right-6 bottom-40 z-20 flex flex-col gap-8 items-center">
            <button 
              onClick={() => handleInject(lesson.id)}
              className="group flex flex-col items-center gap-1"
            >
              <div className="w-14 h-14 rounded-full glass-panel flex items-center justify-center border-sky-500/50 shadow-[0_0_20px_rgba(56,189,248,0.3)] group-hover:scale-110 transition-all duration-300">
                <span className="text-2xl">⚡</span>
              </div>
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-tighter">Inject</span>
            </button>

            <button className="group flex flex-col items-center gap-1">
              <div className="w-14 h-14 rounded-full glass-panel flex items-center justify-center border-white/10 group-hover:bg-red-500/20 transition-all">
                <span className="text-2xl">❤️</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Save</span>
            </button>
          </div>

          {/* Content Info (Bottom) */}
          <div className="relative z-10 w-full max-w-2xl px-8 flex flex-col justify-end h-full pb-20 pointer-events-none">
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700">
              
              <div className="flex items-center gap-3 pointer-events-auto">
                <span className="px-3 py-1 bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest rounded shadow-[0_0_15px_rgba(56,189,248,0.5)]">
                  Module ID: {lesson.module_id}
                </span>
                <span className="text-sm font-bold text-slate-300">Spirelay Community</span>
              </div>

              <h2 className="text-4xl font-black text-white tracking-tight text-glow pointer-events-auto">
                {lesson.title}
              </h2>

              {/* Math Payload Container */}
              {lesson.content_math && (
                <div className="p-4 glass-panel border-sky-500/30 rounded-2xl w-full max-w-md pointer-events-auto">
                  <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2">Math Payload</p>
                  <div className="text-lg md:text-xl font-mono text-slate-200 text-center">
                    {lesson.content_math}
                  </div>
                </div>
              )}

              <p className="text-slate-300 text-base leading-relaxed max-w-lg pointer-events-auto">
                {lesson.content_text}
              </p>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}