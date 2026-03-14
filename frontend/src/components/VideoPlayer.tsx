import React from "react";

interface VideoPlayerProps {
  url: string;
}

export default function VideoPlayer({ url }: VideoPlayerProps) {
  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-md mb-8">
      <iframe
        className="w-full h-full"
        src={url}
        title="Engineering Micro-Lesson"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
}