"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import MathRenderer from "@/components/MathRenderer";
import OptimizedVideoPlayer from "@/components/OptimizedVideoPlayer"; // 🛡️ IMPORT NEW PLAYER

type ReelAspect = "portrait" | "square" | "landscape";
type ReelFit = "cover" | "contain";

type Lesson = {
  id: number;
  module_id: number;
  title: string;
  content_text?: string;
  content_math?: string;
  video_url?: string | null;
  video_aspect?: ReelAspect | null;
  video_fit?: ReelFit | null;
};

const normalizeAspect = (aspect?: string | null): ReelAspect => {
  if (aspect === "portrait" || aspect === "square" || aspect === "landscape") return aspect;
  return "landscape";
};

const normalizeFit = (fit?: string | null): ReelFit => {
  if (fit === "cover" || fit === "contain") return fit;
  return "contain";
};

export default function DiscoverPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReelIndex, setActiveReelIndex] = useState(0); 
  const [isGlobalMuted, setIsGlobalMuted] = useState(true); // 🔊 NEW: Global mute state
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchSmartFeed = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch("http://localhost:8000/api/feed/smart", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data: Lesson[] = await response.json();
        setLessons(data);
      } catch (err) {
        console.error("Feed Sync Failed:", err);
      } finally {
        setLoading(false);
      }
    };
    void fetchSmartFeed();
  }, [supabase]);

  useEffect(() => {
    if (lessons.length === 0) {
      setActiveReelIndex(0);
      return;
    }
    if (activeReelIndex > lessons.length - 1) {
      setActiveReelIndex(lessons.length - 1);
    }
  }, [activeReelIndex, lessons]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    observerRef.current?.disconnect();
    const sections = Array.from(container.querySelectorAll<HTMLElement>("[data-index]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            setActiveReelIndex((prev) => (prev === index ? prev : index));
          }
        });
      },
      { threshold: 0.6 }
    );
    observerRef.current = observer;

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
      observer.disconnect();
    };
  }, [lessons]);

  const handleInject = async (lessonId: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      await fetch(`http://localhost:8000/api/progress/${lessonId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
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
    <div ref={containerRef} className="fixed inset-0 top-16 bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
      {lessons.map((lesson, index) => {
        const aspect = normalizeAspect(lesson.video_aspect);
        const fit = normalizeFit(lesson.video_fit);

        const isActive = index === activeReelIndex;
        const shouldMount = Math.abs(index - activeReelIndex) <= 1;

        return (
          <section
            key={lesson.id}
            data-index={index}
            className="h-[calc(100vh-4rem)] w-full snap-start relative flex items-center justify-center overflow-hidden"
          >
            {lesson.video_url ? (
               <OptimizedVideoPlayer
                 url={lesson.video_url}
                 aspect={aspect}
                 fit={fit}
                 isActive={isActive} 
                 shouldMount={shouldMount}
                 mode="feed"
                 isGlobalMuted={isGlobalMuted} // 🔊 PASS DOWN GLOBAL MUTE STATE
                 onToggleMute={() => setIsGlobalMuted(prev => !prev)} // 🔊 PASS DOWN MUTE TOGGLE HANDLER
               />
            ) : (
              <div className="absolute inset-0 z-0 bg-[#0B0F19] relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.05)_1px,transparent_1px)] bg-[size:40px_40px] animate-[pulse_4s_ease-in-out_infinite]" />
                <div className="w-256 h-256 bg-sky-500/10 rounded-full blur-3xl" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              </div>
            )}

            <div className="absolute right-6 bottom-40 z-20 flex flex-col gap-8 items-center pointer-events-auto">
              <button onClick={() => handleInject(lesson.id)} className="group flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-full glass-panel flex items-center justify-center border-sky-500/50 shadow-[0_0_20px_rgba(56,189,248,0.3)] group-hover:scale-110 transition-all duration-300">
                  <span className="text-2xl">⚡</span>
                </div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-tighter">Inject</span>
              </button>
            </div>

            <div className="relative z-10 w-full max-w-2xl px-8 flex flex-col justify-end h-full pb-10 pointer-events-none">
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700">
                <div className="flex items-center gap-3 pointer-events-auto w-max">
                  <span className="px-3 py-1 bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest rounded shadow-[0_0_15px_rgba(56,189,248,0.5)]">
                    Module Node: {lesson.module_id}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight text-glow pointer-events-auto w-max">
                  {lesson.title}
                </h2>
                {lesson.content_math && shouldMount && (
                  <div className="glass-panel border-sky-500/30 rounded-2xl w-full max-w-lg pointer-events-auto overflow-hidden">
                    <div className="bg-sky-500/10 px-4 py-2 border-b border-sky-500/20">
                      <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Math Payload</p>
                    </div>
                    <div className="p-4 text-lg md:text-xl font-mono text-white text-center">
                      <MathRenderer formula={lesson.content_math} />
                    </div>
                  </div>
                )}
                <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-lg pointer-events-auto drop-shadow-md pb-6">
                  {lesson.content_text}
                </p>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
