"use client";
import { useEffect, useState, useRef, useCallback, type ReactNode } from "react";

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
  feedActionSlot?: ReactNode;
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

// 🚀 UPGRADED RAIL BUTTONS: Now they match the high-visibility Inject button style
const railButtonClassName =
  "flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-600/80 bg-slate-900/90 backdrop-blur-xl shadow-[0_4px_15px_rgba(0,0,0,0.6)] transition-all duration-300 hover:scale-105 hover:bg-slate-800 hover:border-slate-500";

const railLabelClassName =
  "text-[10px] font-extrabold uppercase tracking-[0.18em] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]";

export default function OptimizedVideoPlayer({
  url,
  aspect = "landscape",
  fit = "contain",
  isActive = true,
  shouldMount = true,
  mode = "focus",
  isGlobalMuted,
  onToggleMute,
  feedActionSlot,
}: OptimizedVideoPlayerProps) {
  const isYouTube = url.includes("youtube") || url.includes("youtu.be");
  const isFeed = mode === "feed";

  const [isPlaying, setIsPlaying] = useState(false);
  const [localMuted, setLocalMuted] = useState(isFeed);
  const currentlyMuted = isFeed && isGlobalMuted !== undefined ? isGlobalMuted : localMuted;

  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendYTCmd = useCallback((func: string, args: unknown[] = []) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func, args }),
        "https://www.youtube.com"
      );
    }
  }, []);

  useEffect(() => {
    if (!isFeed) return;

    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }

    if (isActive) {
      setTimeout(() => setIsPlaying(true), 0);
      playTimerRef.current = setTimeout(() => {
        if (isYouTube) {
          sendYTCmd("playVideo");
          sendYTCmd(currentlyMuted ? "mute" : "unMute");
        } else if (videoRef.current) {
          videoRef.current.muted = currentlyMuted;
          void videoRef.current.play().catch(() => {});
        }
      }, 200);
    } else {
      setTimeout(() => setIsPlaying(false), 0);
      if (isYouTube) sendYTCmd("pauseVideo");
      else if (videoRef.current) videoRef.current.pause();
    }

    return () => {
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [isActive, isYouTube, sendYTCmd, isFeed, currentlyMuted]);

  useEffect(() => {
    if (!isActive) return;

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
      onToggleMute();
    } else {
      setLocalMuted((prev) => !prev);
    }
  };

  if (!shouldMount) {
    return <div className="absolute inset-0 z-0 bg-[#0B0F19] pointer-events-none" />;
  }

  const ytUrl = buildYouTubeUrl(url, mode);

  if (mode === "focus") {
    return (
      <div className="relative w-full aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black shadow-inner group">
        {isYouTube ? (
          <iframe
            src={ytUrl}
            className="absolute left-0 top-0 h-full w-full"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        ) : (
          <video src={url} controls className="h-full w-full object-contain" />
        )}
      </div>
    );
  }

// 🚀 TWEAK: Enforce a max-height on desktop so it never overflows the monitor vertically
  const aspectClassMap: Record<ReelAspect, string> = {
    portrait: "h-full md:aspect-[9/16] md:max-h-[80vh]",
    square: "h-full md:aspect-square md:max-h-[80vh]",
    landscape: "h-full md:aspect-video md:max-h-[80vh]",
  };

  // 🚀 TWEAK: Increased the landscape width to massive cinematic proportions on desktop (85vw)
  const frameWidthMap: Record<ReelAspect, string> = {
    portrait: "w-full md:max-w-md lg:max-w-lg",
    square: "w-full md:max-w-5xl",
    landscape: "w-full md:w-[85vw] max-w-7xl",
  };

  // Ensure YouTube videos stretch far enough to cover vertical mobile screens without black bars
  const ytScaleMap: Record<ReelAspect, Record<ReelFit, string>> = {
    portrait: { cover: "w-[100%] h-[100%] md:w-[100%] md:h-[100%]", contain: "w-[100%] h-[100%]" },
    square: { cover: "w-[100%] h-[100%] md:w-[112%] md:h-[112%]", contain: "w-[100%] h-[100%]" },
    landscape: { cover: "w-[90%] h-[90%] md:w-[110%] md:h-[110%]", contain: "w-[100%] h-[100%]" },
  };

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#0B0F19]">
      <div className="pointer-events-none absolute inset-0 z-0">
        {isYouTube ? (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.18),transparent_65%)] opacity-70" />
        ) : (
          <video
            src={url}
            loop
            muted
            playsInline
            className="pointer-events-none h-full w-full scale-125 object-cover opacity-20 blur-3xl"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      </div>

      <div
        // 🚀 TWEAK: Removed 'px-6' padding on mobile so the video touches the absolute edge of the phone.
        className={`absolute left-1/2 top-1/2 z-10 h-full md:h-auto w-full -translate-x-1/2 -translate-y-1/2 md:px-6 pointer-events-auto ${frameWidthMap[aspect]}`}
      >
        <div
          // 🚀 TWEAK: Removed 'rounded-2xl border' on mobile. It now only looks like a card on desktop (md:).
          className={`relative w-full h-full rounded-xl border border-sky-500/20 md:h-auto overflow-hidden md:rounded-2xl md:border md:border-sky-500/20 bg-black shadow-[0_0_50px_rgba(56,189,248,0.15)] md:backdrop-blur-md ${aspectClassMap[aspect]}`}
        >
          {isYouTube ? (
            <iframe
              ref={iframeRef}
              src={ytUrl}
              title="Spirelay reel video player"
              loading="lazy"
              className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${ytScaleMap[aspect][fit]}`}
              allow="autoplay; encrypted-media"
            />
          ) : (
            <video
              ref={videoRef}
              src={url}
              loop
              muted
              playsInline
              className={`pointer-events-none h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"}`}
            />
          )}
        </div>
      </div>

      <div className="absolute right-4 bottom-28 z-[40] flex flex-col items-center gap-4 pointer-events-auto md:right-6 md:bottom-32">
        <button onClick={handleMuteToggle} className="group flex flex-col items-center gap-1.5 md:gap-2">
          <div className={railButtonClassName}>
            <span className="text-xl drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">{currentlyMuted ? "🔇" : "🔊"}</span>
          </div>
          <span className={railLabelClassName}>Audio</span>
        </button>

        <button onClick={togglePlay} className="group flex flex-col items-center gap-1.5 md:gap-2">
          <div className={railButtonClassName}>
            <span className="text-xl drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">{isPlaying ? "⏸️" : "▶️"}</span>
          </div>
          <span className={railLabelClassName}>{isPlaying ? "Pause" : "Play"}</span>
        </button>

        {feedActionSlot}
      </div>
    </div>
  );
}