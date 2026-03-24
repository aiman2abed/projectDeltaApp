"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import MathRenderer from "@/components/MathRenderer";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
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

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const normalizeAspect = (aspect?: string | null): ReelAspect => {
  if (aspect === "portrait" || aspect === "square" || aspect === "landscape") return aspect;
  return "landscape";
};

const normalizeFit = (fit?: string | null): ReelFit => {
  if (fit === "cover" || fit === "contain") return fit;
  return "contain";
};

const getYouTubeEmbedId = (url: string): string => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.replace("/", "").trim();
    if (parsed.searchParams.get("v")) return parsed.searchParams.get("v") || "";
    const parts = parsed.pathname.split("/").filter(Boolean);
    const embedIndex = parts.findIndex((part) => part === "embed");
    if (embedIndex !== -1 && parts[embedIndex + 1]) return parts[embedIndex + 1];
    return parts[parts.length - 1] || "";
  } catch {
    const parts = url.split("/");
    return parts[parts.length - 1]?.split("?")[0] ?? "";
  }
};

const buildYouTubeUrl = (url: string): string => {
  const videoId = getYouTubeEmbedId(url);
  // Changed autoplay=1 to 0 so pre-loaded adjacent videos don't play in the background
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&modestbranding=1&rel=0`;
};

// ------------------------------------------------------------------
// 🎬 REEL PLAYER COMPONENT (Fully controlled by parent)
// ------------------------------------------------------------------
const ReelPlayer = ({
  url,
  aspect = "landscape",
  fit = "contain",
  isActive,     // Dictates if it should play
  shouldMount,  // Dictates if it should exist in the DOM (Pre-loading)
}: {
  url: string;
  aspect?: ReelAspect;
  fit?: ReelFit;
  isActive: boolean;
  shouldMount: boolean;
}) => {
  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const sendYTCmd = useCallback((func: string, args: any[] = []) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func, args }),
        "*"
      );
    }
  }, []);

  // Sync Video Playback strictly with `isActive`
  useEffect(() => {
    if (isActive) {
      setIsPlaying(true);
      if (isYouTube) sendYTCmd("playVideo");
      else if (videoRef.current) void videoRef.current.play().catch(() => {});
    } else {
      setIsPlaying(false);
      if (isYouTube) sendYTCmd("pauseVideo");
      else if (videoRef.current) videoRef.current.pause();
    }
  }, [isActive, isYouTube, sendYTCmd]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isYouTube) {
      sendYTCmd(isPlaying ? "pauseVideo" : "playVideo");
    } else if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else void videoRef.current.play().catch(() => {});
    }
    setIsPlaying((prev) => !prev);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isYouTube) {
      sendYTCmd(isMuted ? "unMute" : "mute");
    } else if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted((prev) => !prev);
  };

  const skip = (e: React.MouseEvent, seconds: number) => {
    e.stopPropagation();
    if (!isYouTube && videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  // 🛑 If we shouldn't mount, return an empty husk to save RAM
  if (!shouldMount) {
    return <div className="absolute inset-0 z-0 bg-[#0B0F19] pointer-events-none" />;
  }

  const ytUrl = buildYouTubeUrl(url);

  const aspectClassMap: Record<ReelAspect, string> = {
    portrait: "aspect-[9/16]",
    square: "aspect-square",
    landscape: "aspect-video",
  };

  const frameWidthMap: Record<ReelAspect, string> = {
    portrait: "max-w-sm",
    square: "max-w-8xl",
    landscape: "max-w-12xl",
  };

  const htmlVideoFitClassMap: Record<ReelFit, string> = {
    cover: "object-cover",
    contain: "object-contain",
  };

  const ytScaleMap: Record<ReelAspect, Record<ReelFit, string>> = {
    portrait: { cover: "w-[120%] h-[120%]", contain: "w-[100%] h-[100%]" },
    square: { cover: "w-[112%] h-[112%]", contain: "w-[100%] h-[100%]" },
    landscape: { cover: "w-[110%] h-[110%]", contain: "w-[100%] h-[100%]" },
  };

  return (
    <div className="absolute inset-0 z-0 bg-[#0B0F19] overflow-hidden pointer-events-none">
      
      {/* 1. DYNAMIC BLURRED BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {isYouTube ? (
          <iframe
            src={ytUrl}
            className="absolute top-1/2 left-1/2 w-[150vw] h-[150vh] -translate-x-1/2 -translate-y-1/2 opacity-20 blur-3xl scale-125 pointer-events-none"
            allow="autoplay; encrypted-media"
          />
        ) : (
          <video
            src={url}
            loop muted playsInline
            className="w-full h-full object-cover opacity-20 blur-3xl scale-125 pointer-events-none"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      </div>

      {/* 2. CRISP FOREGROUND VIDEO */}
      <div className={`absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-6 z-10 pointer-events-auto ${frameWidthMap[aspect]}`}>
        <div className={`w-full ${aspectClassMap[aspect]} rounded-2xl overflow-hidden border border-sky-500/20 shadow-[0_0_50px_rgba(56,189,248,0.15)] bg-black/80 relative backdrop-blur-md`}>
          {isYouTube ? (
            <iframe
              ref={iframeRef}
              src={ytUrl}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none ${ytScaleMap[aspect][fit]}`}
              allow="autoplay; encrypted-media"
            />
          ) : (
            <video
              ref={videoRef}
              src={url}
              loop muted playsInline
              className={`w-full h-full ${htmlVideoFitClassMap[fit]} pointer-events-none`}
            />
          )}
        </div>
      </div>

      {/* 3. CUSTOM MEDIA CONTROLS */}
      <div className="absolute left-6 bottom-40 z-30 flex flex-col gap-3 pointer-events-auto">
        <button onClick={toggleMute} className="w-12 h-12 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-110">
          <span className="text-xl">{isMuted ? "🔇" : "🔊"}</span>
        </button>

        <button onClick={togglePlay} className="w-12 h-12 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-110">
          <span className="text-xl">{isPlaying ? "⏸️" : "▶️"}</span>
        </button>

        {!isYouTube && (
          <>
            <button onClick={(e) => skip(e, -10)} className="w-12 h-12 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-110">
              <span className="text-sm font-bold text-white tracking-tighter">⏪</span>
            </button>
            <button onClick={(e) => skip(e, 10)} className="w-12 h-12 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-110">
              <span className="text-sm font-bold text-white tracking-tighter">⏩</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// 🚀 MAIN DISCOVER PAGE COMPONENT
// ------------------------------------------------------------------
export default function DiscoverPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReelIndex, setActiveReelIndex] = useState(0); 
  
  const observerRef = useRef<IntersectionObserver | null>(null);
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

  // High-performance Intersection Observer to track active reel
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            setActiveReelIndex(index);
          }
        });
      },
      { threshold: 0.6 } // Active when 60% of the reel is visible
    );

    return () => observerRef.current?.disconnect();
  }, []);

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
    <div className="fixed inset-0 top-16 bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
      {lessons.map((lesson, index) => {
        const aspect = normalizeAspect(lesson.video_aspect);
        const fit = normalizeFit(lesson.video_fit);

        const isActive = index === activeReelIndex;
        // Mount the previous, current, and next video for instant snapping
        const shouldMount = Math.abs(index - activeReelIndex) <= 1;

        return (
          <section
            key={lesson.id}
            data-index={index}
            ref={(el) => {
              if (el && observerRef.current) observerRef.current.observe(el);
            }}
            className="h-[calc(100vh-4rem)] w-full snap-start relative flex items-center justify-center overflow-hidden"
          >
            {/* Optimized Media Player */}
            {lesson.video_url ? (
               <ReelPlayer
                 url={lesson.video_url}
                 aspect={aspect}
                 fit={fit}
                 isActive={isActive} 
                 shouldMount={shouldMount}
               />
            ) : (
              <div className="absolute inset-0 z-0 bg-[#0B0F19] relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.05)_1px,transparent_1px)] bg-[size:40px_40px] animate-[pulse_4s_ease-in-out_infinite]" />
                <div className="w-256 h-256 bg-sky-500/10 rounded-full blur-3xl" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              </div>
            )}

            {/* Interaction Bar */}
            <div className="absolute right-6 bottom-40 z-20 flex flex-col gap-8 items-center pointer-events-auto">
              <button
                onClick={() => handleInject(lesson.id)}
                className="group flex flex-col items-center gap-1"
              >
                <div className="w-14 h-14 rounded-full glass-panel flex items-center justify-center border-sky-500/50 shadow-[0_0_20px_rgba(56,189,248,0.3)] group-hover:scale-110 transition-all duration-300">
                  <span className="text-2xl">⚡</span>
                </div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-tighter">Inject</span>
              </button>
            </div>

            {/* Content Info */}
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

                {/* Only render math if the reel is near active to save DOM nodes */}
                {lesson.content_math && shouldMount && (
                  <div className="glass-panel border-sky-500/30 rounded-2xl w-full max-w-lg pointer-events-auto overflow-hidden">
                    <div className="bg-sky-500/10 px-4 py-2 border-b border-sky-500/20">
                      <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">
                        Math Payload
                      </p>
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