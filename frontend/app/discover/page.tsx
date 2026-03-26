"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import MathRenderer from "@/components/MathRenderer";
import OptimizedVideoPlayer from "@/components/OptimizedVideoPlayer";

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
  const [isGlobalMuted, setIsGlobalMuted] = useState(true);
  
  // Pull-to-refresh state
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const supabase = createClient();

  const fetchSmartFeed = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/feed/smart`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const data = await response.json();
      
      // STRICT ARRAY CHECK: Prevents the .map() TypeError
      if (Array.isArray(data)) {
        setLessons(data);
      } else {
        console.warn("API did not return an array for lessons:", data);
        setLessons([]);
      }
      setActiveReelIndex(0); 
    } catch (err) {
      console.error("Feed Sync Failed:", err);
      setLessons([]); // Fallback to empty array on network failure
    } finally {
      setLoading(false);
      setIsPulling(false);
    }
  }, [supabase]);

  useEffect(() => {
    void fetchSmartFeed();
  }, [fetchSmartFeed]);

  // Use a safe reference for bounds checking
  const safeLessons = Array.isArray(lessons) ? lessons : [];

  useEffect(() => {
    if (safeLessons.length === 0) {
      setActiveReelIndex(0);
      return;
    }
    if (activeReelIndex > safeLessons.length - 1) {
      setActiveReelIndex(safeLessons.length - 1);
    }
  }, [activeReelIndex, safeLessons]);

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
  }, [safeLessons]);

  const handleInject = async (lessonId: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/progress/${lessonId}`, {
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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0 && touchStartY.current > 0) {
      const currentY = e.touches[0].clientY;
      if (currentY - touchStartY.current > 75) { 
        setIsPulling(true);
      }
    }
  };

  const handleTouchEnd = () => {
    if (isPulling) {
      void fetchSmartFeed();
    }
    touchStartY.current = 0;
  };

  if (loading && !isPulling) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500/30 border-t-sky-400" />
        <p className="font-mono text-sm tracking-widest text-sky-400">
          SYNCING GLOBAL REELS...
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-x-0 top-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] md:top-16 md:bottom-0 snap-y snap-mandatory overflow-y-scroll bg-black scrollbar-hide"
    >
      {isPulling && (
        <div className="absolute top-4 left-0 right-0 z-50 flex justify-center animate-pulse">
          <div className="bg-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-sky-500/30 backdrop-blur-md">
            Release to Refresh
          </div>
        </div>
      )}

      {/* SAFE RENDER LOOP */}
      {safeLessons.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center text-slate-500 italic text-sm">
          No lessons found in the Discovery Feed.
        </div>
      ) : (
        safeLessons.map((lesson, index) => {
          const aspect = normalizeAspect(lesson.video_aspect);
          const fit = normalizeFit(lesson.video_fit);
          const isActive = index === activeReelIndex;
          const shouldMount = Math.abs(index - activeReelIndex) <= 1;

          return (
            <section
              key={lesson.id}
              data-index={index}
              className="relative flex h-full w-full snap-start items-center justify-center overflow-hidden"
            >
              {lesson.video_url ? (
                <OptimizedVideoPlayer
                  url={lesson.video_url}
                  aspect={aspect}
                  fit={fit}
                  isActive={isActive}
                  shouldMount={shouldMount}
                  mode="feed"
                  isGlobalMuted={isGlobalMuted}
                  onToggleMute={() => setIsGlobalMuted((prev) => !prev)}
                  feedActionSlot={
                    <button
                      onClick={() => handleInject(lesson.id)}
                      className="group flex flex-col items-center gap-2"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-sky-400/30 bg-black/30 backdrop-blur-md shadow-lg shadow-sky-500/20 transition-all duration-300 group-hover:scale-105 group-hover:border-sky-300/50 group-hover:bg-black/45">
                        <span className="text-xl">⚡</span>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300/90">
                        Inject
                      </span>
                    </button>
                  }
                />
              ) : (
                <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden bg-[#0B0F19]">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.05)_1px,transparent_1px)] bg-[size:40px_40px] animate-[pulse_4s_ease-in-out_infinite]" />
                  <div className="h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>
              )}

              <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[42%] bg-gradient-to-t from-cyan-500/20 via-black/25 to-transparent" />

              <div className="relative z-10 flex h-full w-full items-end px-5 pb-8 md:px-8 md:pb-10 pointer-events-none">
                <div className="w-full max-w-xl">
                  <div className="flex flex-col gap-4 md:gap-5 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="pointer-events-auto w-max">
                      <span className="inline-flex items-center rounded-md border border-sky-300/20 bg-sky-500/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-md">
                        Module Node: {lesson.module_id}
                      </span>
                    </div>

                    <h2 className="pointer-events-auto max-w-lg text-3xl font-black tracking-tight text-white drop-shadow-md md:text-4xl">
                      {lesson.title}
                    </h2>

                    {lesson.content_math && shouldMount && (
                      <div className="pointer-events-auto w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-black/25 shadow-lg backdrop-blur-sm">
                        <div className="border-b border-white/10 bg-white/5 px-4 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                            Math Payload
                          </p>
                        </div>
                        <div className="p-4 text-center text-lg font-mono text-white md:text-xl">
                          <MathRenderer formula={lesson.content_math} />
                        </div>
                      </div>
                    )}

                    <p className="pointer-events-auto max-w-md rounded-xl bg-gradient-to-r from-black/50 via-black/30 to-black/15 px-4 py-3 text-sm leading-6 text-slate-100 shadow-lg backdrop-blur-sm md:text-base">
                      {lesson.content_text}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}