"use client";

import { useEffect, useState, useRef, useCallback } from "react";

type ReelAspect = "portrait" | "square" | "landscape";
type ReelFit = "cover" | "contain";

interface OptimizedVideoPlayerProps {
  url: string;
  aspect?: ReelAspect;
  fit?: ReelFit;
  isActive?: boolean;     
  shouldMount?: boolean;  
  mode?: "feed" | "focus"; 
  isGlobalMuted?: boolean; 
  onToggleMute?: () => void; 
}

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

const buildYouTubeUrl = (url: string, mode: "feed" | "focus"): string => {
  const videoId = getYouTubeEmbedId(url);
  if (mode === "focus") {
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1`;
  }
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&modestbranding=1&rel=0`;
};

export default function OptimizedVideoPlayer({
  url,
  aspect = "landscape",
  fit = "contain",
  isActive = true,
  shouldMount = true,
  mode = "focus",
  isGlobalMuted,
  onToggleMute
}: OptimizedVideoPlayerProps) {
  
  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
  const isFeed = mode === "feed";
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [localMuted, setLocalMuted] = useState(isFeed);

  // 🛡️ Determine the source of truth for the mute state
  const currentlyMuted = isFeed && isGlobalMuted !== undefined ? isGlobalMuted : localMuted;

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

  // 1. Play/Pause based on scroll
  useEffect(() => {
    if (!isFeed) return;
    
    if (isActive) {
      setIsPlaying(true);
      setTimeout(() => {
        if (isYouTube) {
           sendYTCmd("playVideo");
           // Ensure it starts with the correct mute state
           sendYTCmd(currentlyMuted ? "mute" : "unMute");
        } else if (videoRef.current) {
           videoRef.current.muted = currentlyMuted;
           void videoRef.current.play().catch(() => {});
        }
      }, 200);//2ms delay to ensure the video is ready before sending commands
    } else {
      setIsPlaying(false);
      if (isYouTube) sendYTCmd("pauseVideo");
      else if (videoRef.current) videoRef.current.pause();
    }
  }, [isActive, isYouTube, sendYTCmd, isFeed]); 
  // removed currentlyMuted from deps so it doesn't accidentally trigger a play event

  // 2. 🛡️ NEW: Instantly react to mute toggles while the video is playing
  useEffect(() => {
    if (!isActive) return; // Only send commands to the active video

    if (isYouTube) {
      sendYTCmd(currentlyMuted ? "mute" : "unMute");
    } else if (videoRef.current) {
      videoRef.current.muted = currentlyMuted;
    }
  }, [currentlyMuted, isActive, isYouTube, sendYTCmd]);

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

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isFeed && onToggleMute) {
      onToggleMute(); // Flips the global state in DiscoverPage
    } else {
      setLocalMuted(!localMuted); // Flips the local state in LessonPage
    }
  };

  if (!shouldMount) {
    return <div className="absolute inset-0 z-0 bg-[#0B0F19] pointer-events-none" />;
  }

  const ytUrl = buildYouTubeUrl(url, mode);

  if (mode === "focus") {
    return (
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-inner border border-white/10 group">
        {isYouTube ? (
          <iframe src={ytUrl} className="absolute top-0 left-0 w-full h-full" allow="autoplay; encrypted-media; fullscreen" allowFullScreen />
        ) : (
          <video src={url} controls className="w-full h-full object-contain" />
        )}
      </div>
    );
  }

  const aspectClassMap: Record<ReelAspect, string> = { portrait: "aspect-[9/16]", square: "aspect-square", landscape: "aspect-video" };
  const frameWidthMap: Record<ReelAspect, string> = { portrait: "max-w-sm", square: "max-w-8xl", landscape: "max-w-12xl" };
  const ytScaleMap: Record<ReelAspect, Record<ReelFit, string>> = {
    portrait: { cover: "w-[120%] h-[120%]", contain: "w-[100%] h-[100%]" },
    square: { cover: "w-[112%] h-[112%]", contain: "w-[100%] h-[100%]" },
    landscape: { cover: "w-[110%] h-[110%]", contain: "w-[100%] h-[100%]" },
  };

  return (
    <div className="absolute inset-0 z-0 bg-[#0B0F19] overflow-hidden pointer-events-none">
      <div className="absolute inset-0 z-0 pointer-events-none">
        {isYouTube ? (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.18),transparent_65%)] opacity-70" />
        ) : (
          <video src={url} loop muted playsInline className="w-full h-full object-cover opacity-20 blur-3xl scale-125 pointer-events-none" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      </div>

      <div className={`absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-6 z-10 pointer-events-auto ${frameWidthMap[aspect]}`}>
        <div className={`w-full ${aspectClassMap[aspect]} rounded-2xl overflow-hidden border border-sky-500/20 shadow-[0_0_50px_rgba(56,189,248,0.15)] bg-black/80 relative backdrop-blur-md`}>
          {isYouTube ? (
            <iframe ref={iframeRef} src={ytUrl} title="Spirelay reel video player" loading="lazy" className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none ${ytScaleMap[aspect][fit]}`} allow="autoplay; encrypted-media" />
          ) : (
            <video ref={videoRef} src={url} loop muted playsInline className={`w-full h-full ${fit === "cover" ? "object-cover" : "object-contain"} pointer-events-none`} />
          )}
        </div>
      </div>

      <div className="absolute left-6 bottom-40 z-30 flex flex-col gap-3 pointer-events-auto">
        <button onClick={handleMuteToggle} className="w-12 h-12 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-110">
          <span className="text-xl">{currentlyMuted ? "🔇" : "🔊"}</span>
        </button>
        <button onClick={togglePlay} className="w-12 h-12 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-110">
          <span className="text-xl">{isPlaying ? "⏸️" : "▶️"}</span>
        </button>
      </div>
    </div>
  );
}
