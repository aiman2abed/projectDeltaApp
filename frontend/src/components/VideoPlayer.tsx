"use client";
import React, { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  url: string;
  mode?: "feed" | "focus";
}

export default function VideoPlayer({ url, mode = "focus" }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null); // NEW: A reference directly to the iframe

  const [hasMounted, setHasMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Default to muted for auto-play

  const isFeed = mode === "feed";

  // 1. The Facade Pattern Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasMounted(true);
          setIsPlaying(true);
          // Send a message to the iframe to play WITHOUT reloading it
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
          }
        } else {
          setIsPlaying(false);
          // Send a message to the iframe to pause
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
          }
        }
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 2. Custom Play/Pause logic (No URL reloading!)
  const togglePlay = () => {
    if (!iframeRef.current?.contentWindow) return;
    
    if (isPlaying) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
    } else {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
    }
    setIsPlaying(!isPlaying);
  };

  // 3. Custom Mute/Unmute logic
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents the click from accidentally pausing the video
    if (!iframeRef.current?.contentWindow) return;

    if (isMuted) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*');
    } else {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'mute', args: [] }), '*');
    }
    setIsMuted(!isMuted);
  };

  // Notice we only build this string ONCE. We removed the dynamic `isPlaying` variable.
  const activeUrl = `${url}?enablejsapi=1&autoplay=1&mute=1&controls=${isFeed ? 0 : 1}&modestbranding=1&playsinline=1`;

  return (
    <div 
      ref={containerRef} 
      className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center shadow-inner border border-gray-800"
    >
      {!hasMounted ? (
        <div className="flex flex-col items-center justify-center text-gray-500 space-y-2">
          <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-xs font-mono uppercase tracking-widest">Loading Media</span>
        </div>
      ) : (
        <>
          <iframe
            ref={iframeRef} // Attach the reference!
            src={activeUrl}
            className={`absolute top-0 left-0 w-full h-full ${isFeed ? "pointer-events-none" : "pointer-events-auto"}`}
            allow="autoplay; encrypted-media"
            title="Micro-Lesson Video"
            frameBorder="0"
            allowFullScreen={!isFeed}
          />
          
          {/* Custom Feed Controls */}
          {isFeed && (
            <>
              {/* Invisible Play/Pause Shield */}
              <div 
                className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center"
                onClick={togglePlay}
              >
                {!isPlaying && (
                  <div className="bg-black/60 rounded-full p-4 backdrop-blur-sm">
                    {/* Play Icon */}
                    <svg className="w-8 h-8 text-white translate-x-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                )}
              </div>

              {/* Unmute/Mute Toggle Button */}
              <button 
                onClick={toggleMute}
                className="absolute bottom-4 right-4 z-20 bg-black/70 hover:bg-black/90 text-white px-4 py-2 rounded-full backdrop-blur-md transition-all flex items-center gap-2 text-sm font-bold shadow-lg border border-gray-600"
              >
                {isMuted ? "🔇 Unmute" : "🔊 Muted"}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}