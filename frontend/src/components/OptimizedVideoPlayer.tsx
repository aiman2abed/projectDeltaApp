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

const railButtonClassName =
  "flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/30 backdrop-blur-md shadow-lg shadow-black/20 transition-all duration-300 hover:scale-105 hover:bg-black/45";

const railLabelClassName =
  "text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200/90";

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
  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
  const isFeed = mode === "feed";

  // Local play state belongs to each reel.
  // When a new reel becomes active, it should autoplay independently.
  const [isPlaying, setIsPlaying] = useState(false);

  // Local mute state is used in non-feed contexts.
  // In the feed, mute can be controlled globally by DiscoverPage.
  const [localMuted, setLocalMuted] = useState(isFeed);

  // In feed mode, the parent page can override mute globally.
  // Outside the feed, the player uses its own local mute state.
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

      // Slight delay so the embedded media is ready before receiving commands.
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
    // Prevent the click from bubbling into the reel surface.
    e.stopPropagation();

    // This button controls the current reel's play state only.
    if (isYouTube) {
      sendYTCmd(isPlaying ? "pauseVideo" : "playVideo");
    } else if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else void videoRef.current.play().catch(() => {});
    }

    setIsPlaying((prev) => !prev);
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    // Prevent the click from bubbling into the reel surface.
    e.stopPropagation();

    // In feed mode this delegates mute changes up to DiscoverPage,
    // which updates the shared mute state for all reels.
    if (isFeed && onToggleMute) {
      onToggleMute();
    } else {
      // Outside the feed, the player controls its own mute state.
      setLocalMuted((prev) => !prev);
    }
  };

  if (!shouldMount) {
    // Placeholder layer for off-screen reels:
    // occupies the reel's background area without loading active media.
    return <div className="absolute inset-0 z-0 bg-[#0B0F19] pointer-events-none" />;
  }

  const ytUrl = buildYouTubeUrl(url, mode);

  if (mode === "focus") {
    return (
      // Focus-mode player wrapper:
      // controls the standard lesson-page video box, not the full-screen reel.
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

  const aspectClassMap: Record<ReelAspect, string> = {
    portrait: "aspect-[9/16]",
    square: "aspect-square",
    landscape: "aspect-video",
  };

  const frameWidthMap: Record<ReelAspect, string> = {
    portrait: "max-w-sm",
    square: "max-w-4xl",
    landscape: "max-w-5xl",
  };

  const ytScaleMap: Record<ReelAspect, Record<ReelFit, string>> = {
    portrait: { cover: "w-[120%] h-[120%]", contain: "w-[100%] h-[100%]" },
    square: { cover: "w-[112%] h-[112%]", contain: "w-[100%] h-[100%]" },
    landscape: { cover: "w-[110%] h-[110%]", contain: "w-[100%] h-[100%]" },
  };

  return (
    // Full-screen reel media layer:
    // fills the reel section and acts as the base visual layer under text overlays.
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#0B0F19]">
      {/* Background ambience layer:
          fills the entire reel screen behind the main framed video.
          Controls blurred video/glow and overall cinematic darkening. */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {isYouTube ? (
          // Radial glow behind YouTube reels, affecting the whole reel background.
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.18),transparent_65%)] opacity-70" />
        ) : (
          // Blurred full-screen background clone for direct video reels.
          <video
            src={url}
            loop
            muted
            playsInline
            className="pointer-events-none h-full w-full scale-125 object-cover opacity-20 blur-3xl"
          />
        )}

        {/* Global darkening wash over the whole reel background */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      </div>

      {/* Main centered media frame:
          controls the actual visible reel frame in the middle of the screen.
          Its width changes with portrait/square/landscape aspect. */}
      <div
        className={`absolute left-1/2 top-[45%] z-10 w-full -translate-x-1/2 -translate-y-1/2 px-6 pointer-events-auto ${frameWidthMap[aspect]}`}
      >
        {/* Framed video box:
            controls the bordered, rounded, glowing card that contains the reel media itself. */}
        <div
          className={`relative w-full overflow-hidden rounded-2xl border border-sky-500/20 bg-black/80 shadow-[0_0_50px_rgba(56,189,248,0.15)] backdrop-blur-md ${aspectClassMap[aspect]}`}
        >
          {isYouTube ? (
            // YouTube iframe positioned inside the centered media frame.
            // This controls only the video content area, not the whole screen.
            <iframe
              ref={iframeRef}
              src={ytUrl}
              title="Spirelay reel video player"
              loading="lazy"
              className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${ytScaleMap[aspect][fit]}`}
              allow="autoplay; encrypted-media"
            />
          ) : (
            // Native video element inside the centered media frame.
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

      {/* Right-side action rail:
          controls the vertical stack of reel actions on the lower-right side of the screen.
          This is where mute, play/pause, and injected lesson actions appear. */}
      <div className="absolute right-4 bottom-28 z-[40] flex flex-col items-center gap-4 pointer-events-auto md:right-6 md:bottom-32">
        <button onClick={handleMuteToggle} className="group flex flex-col items-center gap-2">
          {/* Circular mute/unmute control button in the action rail */}
          <div className={railButtonClassName}>
            <span className="text-xl">{currentlyMuted ? "🔇" : "🔊"}</span>
          </div>

          {/* Label under the mute button */}
          <span className={railLabelClassName}>Audio</span>
        </button>

        <button onClick={togglePlay} className="group flex flex-col items-center gap-2">
          {/* Circular play/pause control button in the action rail */}
          <div className={railButtonClassName}>
            <span className="text-xl">{isPlaying ? "⏸️" : "▶️"}</span>
          </div>

          {/* Label under the play/pause button */}
          <span className={railLabelClassName}>{isPlaying ? "Pause" : "Play"}</span>
        </button>

        {/* Extra injected action slot from DiscoverPage.
            Currently used for the Inject button, so it appears in the same vertical rail. */}
        {feedActionSlot}
      </div>
    </div>
  );
}