"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import MathRenderer from "@/components/MathRenderer";

// ------------------------------------------------------------------
// 🎬 REEL PLAYER COMPONENT (Dynamic Background + Crisp Foreground)
// ------------------------------------------------------------------
const ReelPlayer = ({ url }: { url: string }) => {
  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const getYouTubeId = (u: string) => {
    const parts = u.split('/');
    return parts[parts.length - 1].split('?')[0];
  };

  const sendYTCmd = (func: string, args: any[] = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func, args }),
        "*"
      );
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsPlaying(true);
          if (isYouTube) sendYTCmd("playVideo");
          else if (videoRef.current) videoRef.current.play();
        } else {
          setIsPlaying(false);
          if (isYouTube) sendYTCmd("pauseVideo");
          else if (videoRef.current) videoRef.current.pause();
        }
      },
      { threshold: 0.6 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isYouTube]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isYouTube) {
      sendYTCmd(isPlaying ? "pauseVideo" : "playVideo");
    } else if (videoRef.current) {
      isPlaying ? videoRef.current.pause() : videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isYouTube) {
      sendYTCmd(isMuted ? "unMute" : "mute");
    } else if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const skip = (e: React.MouseEvent, seconds: number) => {
    e.stopPropagation();
    if (!isYouTube && videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const ytUrl = `${url}${url.includes('?') ? '&' : '?'}enablejsapi=1&autoplay=1&mute=1&controls=0&loop=1&playlist=${getYouTubeId(url)}&playsinline=1&modestbranding=1`;

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 bg-[#0B0F19] overflow-hidden pointer-events-none">
      
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
            autoPlay loop muted playsInline
            className="w-full h-full object-cover opacity-20 blur-3xl scale-125 pointer-events-none"
          />
        )}
        {/* Darkening gradient to ensure bottom text is perfectly readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      </div>

      {/* 2. CRISP FOREGROUND VIDEO (Framed and Cinematic) */}
      <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl px-6 z-10 pointer-events-auto">
        <div className="w-full aspect-video rounded-2xl overflow-hidden border border-sky-500/20 shadow-[0_0_50px_rgba(56,189,248,0.15)] bg-black/80 relative backdrop-blur-md">
          {isYouTube ? (
            <iframe
              ref={iframeRef}
              src={ytUrl}
              // A subtle scale-110 crops out the YouTube title bar without destroying the video content
              className="absolute top-1/2 left-1/2 w-[110%] h-[110%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              allow="autoplay; encrypted-media"
            />
          ) : (
            <video 
              ref={videoRef}
              src={url} 
              autoPlay loop muted playsInline
              className="w-full h-full object-contain pointer-events-none"
            />
          )}
        </div>
      </div>

      {/* 3. CUSTOM MEDIA CONTROLS OVERLAY (Left Side) */}
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
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchSmartFeed = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      try {
        const response = await fetch("http://localhost:8000/api/feed/smart", {
          headers: { Authorization: `Bearer ${session.access_token}` },
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
  }, [supabase]);

  const handleInject = async (lessonId: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

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
          {/* Conditional Media Rendering (Handles background + foreground) */}
          {lesson.video_url ? (
            <ReelPlayer url={lesson.video_url} />
          ) : (
            <div className="absolute inset-0 z-0 bg-[#0B0F19] relative overflow-hidden flex items-center justify-center">
               <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.05)_1px,transparent_1px)] bg-[size:40px_40px] animate-[pulse_4s_ease-in-out_infinite]" />
               <div className="w-64 h-64 bg-sky-500/10 rounded-full blur-3xl" />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>
          )}

          {/* Interaction Bar (Right Side) */}
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

          {/* Content Info (Bottom) */}
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

              {/* Math Payload Container */}
              {lesson.content_math && (
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
      ))}
    </div>
  );
}