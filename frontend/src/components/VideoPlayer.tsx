"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

interface VideoPlayerProps {
  url: string;
}

const PLAYER_COMMAND_TARGET = "https://www.youtube.com";

function withYouTubePlayerParams(rawUrl: string): string {
  try {
    const parsedUrl = new URL(rawUrl);
    parsedUrl.searchParams.set("enablejsapi", "1");
    parsedUrl.searchParams.set("playsinline", "1");
    parsedUrl.searchParams.set("rel", "0");
    parsedUrl.searchParams.set("mute", "1");
    return parsedUrl.toString();
  } catch {
    return rawUrl;
  }
}

export default function VideoPlayer({ url }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isFullyVisible, setIsFullyVisible] = useState(false);

  const playerUrl = useMemo(() => withYouTubePlayerParams(url), [url]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFullyVisible(entry.isIntersecting && entry.intersectionRatio >= 1);
      },
      {
        threshold: [1],
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.postMessage(
      JSON.stringify({
        event: "command",
        func: isFullyVisible ? "playVideo" : "pauseVideo",
        args: [],
      }),
      PLAYER_COMMAND_TARGET
    );
  }, [isFullyVisible]);

  return (
    <div ref={containerRef} className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-md mb-8">
      <iframe
        ref={iframeRef}
        className="w-full h-full"
        src={playerUrl}
        title="Engineering Micro-Lesson"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
}
