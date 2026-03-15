"use client";
import React, { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  url: string;
}

export default function VideoPlayer({ url }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasMounted(true); // Mount the iframe permanently once seen
          setIsPlaying(true);  // Trigger play state
        } else {
          setIsPlaying(false); // Pause state when scrolled away
        }
      },
      { threshold: 0.5 } // Triggers when 50% of the video is visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Dynamically append YouTube parameters for auto-play and mute
  // Mute is strictly required by browsers for auto-play to work without user interaction
  const activeUrl = `${url}?enablejsapi=1&autoplay=${isPlaying ? 1 : 0}&mute=1&controls=0&modestbranding=1`;

  return (
    <div 
      ref={containerRef} 
      className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center shadow-inner border border-gray-800"
    >
      {!hasMounted ? (
        /* The Lightweight Facade / Skeleton */
        <div className="flex flex-col items-center justify-center text-gray-500 space-y-2">
          <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-xs font-mono uppercase tracking-widest">Loading Media</span>
        </div>
      ) : (
        /* The Heavy Iframe - Only loads when in view! */
        <iframe
          src={activeUrl}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          allow="autoplay; encrypted-media"
          title="Micro-Lesson Video"
          frameBorder="0"
        />
      )}
    </div>
  );
}