"use client";

/**
 * Discover page owns the vertical reel feed lifecycle.
 * It synchronizes smart-feed data, active reel tracking, pull-to-refresh, and client-only video controls.
 */
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
  return "cover";
};

export default function DiscoverPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [isGlobalMuted, setIsGlobalMuted] = useState(true);
  const [isPulling, setIsPulling] = useState(false);

  const touchStartY = useRef(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const supabase = createClient();

  const isMountedRef = useRef(true);

  const fetchSmartFeed = useCallback(async () => {
    if (isMountedRef.current) {
      setLoading(true);
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      if (isMountedRef.current) {
        setLessons([]);
        setLoading(false);
      }
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/feed/smart`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        throw new Error(`Smart feed request failed with status ${response.status}`);
      }

      const payload: unknown = await response.json();

      if (isMountedRef.current) {
        setLessons(Array.isArray(payload) ? (payload as Lesson[]) : []);
        setActiveReelIndex(0);
      }
    } catch {
      if (isMountedRef.current) {
        setLessons([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsPulling(false);
      }
    }
  }, [supabase]);

  useEffect(() => {
    isMountedRef.current = true;
    void fetchSmartFeed();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchSmartFeed]);

  const safeLessons = useMemo(() => (Array.isArray(lessons) ? lessons : []), [lessons]);

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
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/progress/${lessonId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ quality: 3 }),
      });

      if (response.ok) {
        alert("Payload Injected: This lesson is now in your SM-2 queue!");
      }
    } catch {
      return;
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
        <p className="font-mono text-sm tracking-widest text-sky-400">SYNCING GLOBAL REELS...</p>
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
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 p-4 pt-safe bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <h1 className="text-white font-black text-xl tracking-tight drop-shadow-md">Discover</h1>
      </div>

      {isPulling && (
        <div className="absolute top-16 md:top-4 left-0 right-0 z-50 flex justify-center animate-pulse">
          <div className="bg-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-sky-500/30 backdrop-blur-md shadow-lg">
            Release to Refresh
          </div>
        </div>
      )}

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
              className="relative flex h-full w-full snap-start flex-col justify-start md:items-center md:justify-center overflow-hidden bg-black"
            >
              <div className="absolute inset-0 z-0 h-full w-full flex items-start md:items-center justify-center bg-black">
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
                        className="group flex flex-col items-center gap-1.5 md:gap-2 mb-4 md:mb-0 pointer-events-auto"
                      >
                        <div className="flex h-30 w-12 md:h-12 md:w-12 items-center justify-center rounded-full border-2 border-sky-400/80 bg-gradient-to-br from-sky-500/20 to-blue-500/20 shadow-[0_4px_15px_rgba(0,0,0,0.6)] transition-all duration-300 active:scale-95 group-hover:scale-105 group-hover:border-sky-300 group-hover:bg-slate-800">
                          <span className="text-2xl md:text-xl drop-shadow-[0_0_10px_rgba(56,189,248,0.9)]">⚡</span>
                        </div>
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white ">Inject</span>
                      </button>
                    }
                  />
                ) : (
                  <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden bg-[#0B0F19]">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.05)_1px,transparent_1px)] bg-[size:40px_40px] animate-[pulse_4s_ease-in-out_infinite]" />
                    <div className="h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
                  </div>
                )}
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[65%] bg-gradient-to-t from-cyan-500/20 via-blue-500/20 to-transparent md:h-[45%] md:from-black/80 md:via-black/30" />

              <div className="relative z-20 flex h-full w-full flex-row items-end justify-between px-4 pb-4 md:px-8 md:pb-10 pointer-events-none">
                <div className="flex w-[82%] md:w-full max-w-xl flex-col gap-2.5 md:gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="pointer-events-auto text-2xl md:text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight">
                    {lesson.title}
                  </h2>

                  {lesson.content_math && shouldMount && (
                    <div className="pointer-events-auto w-full max-w-[95%] md:max-w-lg overflow-hidden rounded-xl border border-white/10 bg-black/60 shadow-2xl backdrop-blur-xl">
                      <div className="border-b border-white/5 bg-white/5 px-3 py-1.5 md:px-4 md:py-2">
                        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400 opacity-90">
                          Math Payload
                        </p>
                      </div>
                      <div className="p-3 md:p-4 text-center text-sm md:text-xl font-mono text-white overflow-x-auto scrollbar-hide shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md bg-gradient-to-br from-sky-500/10 to-blue-500/10">
                        <MathRenderer formula={lesson.content_math} />
                      </div>
                    </div>
                  )}

                  {lesson.content_text && (
                    <p className="pointer-events-auto max-w-[95%] md:max-w-md rounded-xl bg-black/40 md:bg-gradient-to-r md:from-black/50 md:via-black/30 md:to-black/15 px-3 py-2 md:px-4 md:py-3 text-[13px] md:text-base leading-snug md:leading-6 text-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.5)] backdrop-blur-md border border-white/5 md:border-none line-clamp-3 md:line-clamp-none">
                      {lesson.content_text}
                    </p>
                  )}
                </div>

                <div className="w-[18%] flex flex-col justify-end items-center pointer-events-none pb-2" />
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
