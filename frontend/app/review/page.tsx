"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import MathRenderer from "@/components/MathRenderer";

export default function ReviewPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);

  const supabase = createClient();

  // 1. Fetch the Review Queue from the Smart Feed
  useEffect(() => {
    const fetchQueue = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      try {
        const response = await fetch("http://localhost:8000/api/feed/smart", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await response.json();
        
        // Filter: In Review mode, we only show items that have been 'started' or are due.
        // For now, we'll use the smart feed which prioritizes due items.
        setQueue(data);
      } catch (err) {
        console.error("Queue fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, [supabase]);

  const currentLesson = queue[currentIndex];

  // 2. Handle SM-2 Progress Update
  const handleRating = async (quality: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !currentLesson) return;

    try {
      await fetch(`http://localhost:8000/api/progress/${currentLesson.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        // IMPORTANT: Ensure your backend schemas.ProgressUpdateRequest accepts 'quality'
        body: JSON.stringify({ quality }), 
      });

      // Move to next card or finish
      setIsFlipped(false);
      if (currentIndex < queue.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setSessionComplete(true);
      }
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  if (loading) return <div className="p-10 text-center text-sky-400 font-mono animate-pulse mt-12">LOADING NEURAL QUEUE...</div>;

  if (sessionComplete || queue.length === 0) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
        <div className="glass-panel p-12 rounded-3xl text-center max-w-lg border border-sky-500/30 shadow-[0_0_30px_rgba(56,189,248,0.1)]">
          <h2 className="text-3xl font-extrabold text-white mb-4">Sync Complete</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">All due lessons have been processed. Your memory retention is currently optimized.</p>
          <Link href="/" className="px-8 py-3 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-700 transition-colors border border-white/10 shadow-lg">
            Return to Command Center
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Progress Tracking */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold tracking-[0.2em] text-sky-400 uppercase">Active Session</p>
          <span className="text-sm font-bold text-slate-500">{currentIndex + 1} / {queue.length}</span>
        </div>
        <div className="w-full bg-slate-800/60 rounded-full h-1.5 border border-white/5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-sky-400 transition-all duration-500"
            style={{ width: `${((currentIndex) / queue.length) * 100}%` }}
          />
        </div>
      </div>

      {/* The Flashcard Interface */}
      <div className="flex-1 flex flex-col relative perspective-1000">
        <div className={`glass-panel flex-1 rounded-3xl p-8 md:p-12 flex flex-col justify-center transition-all duration-500 ${isFlipped ? 'border-sky-500/30 shadow-[0_0_20px_rgba(56,189,248,0.15)]' : ''}`}>
          
          <div className="absolute top-8 left-8">
            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-800/50 border border-white/5 rounded-full shadow-inner">
              Module Node: {currentLesson.module_id}
            </span>
          </div>

          <div className="text-center w-full max-w-2xl mx-auto mt-4">
            <h3 className="text-2xl md:text-3xl font-medium text-white leading-relaxed">
              {currentLesson.title}
            </h3>
            
            {/* Front content */}
            <p className="mt-6 text-slate-400 text-lg">
                {currentLesson.content_text}
            </p>
          </div>

          {/* Flipped Content (The "Quiz" / Answer part) */}
          {isFlipped && (
            <div className="mt-8 pt-8 border-t border-slate-700/50 text-center animate-in fade-in slide-in-from-top-4 duration-300 w-full max-w-2xl mx-auto">
              <p className="text-[10px] font-bold tracking-[0.2em] text-sky-400 uppercase mb-4 text-glow">Technical Detail</p>
              
              {/* Math Renderer Integration */}
              <div className="text-xl md:text-2xl font-mono text-white">
                {currentLesson.content_math ? (
                  <div className="bg-slate-900/50 border border-sky-500/30 rounded-2xl p-6 flex justify-center shadow-inner mt-4">
                    <MathRenderer formula={currentLesson.content_math} />
                  </div>
                ) : (
                  <p className="text-slate-400 text-base mt-4">Check your understanding of the concept above.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SM-2 Control Buttons */}
      <div className="h-32 mt-6 flex items-center justify-center">
        {!isFlipped ? (
          <button 
            onClick={() => setIsFlipped(true)}
            className="w-full max-w-md px-8 py-4 rounded-2xl shadow-lg text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 transition-all hover:-translate-y-1 active:translate-y-0"
          >
            Show Technical Detail
          </button>
        ) : (
          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button onClick={() => handleRating(1)} className="flex flex-col items-center justify-center py-4 rounded-2xl glass-panel hover:bg-red-500/10 border-transparent hover:border-red-500/30 transition-all hover:-translate-y-1 group">
              <span className="text-sm font-bold text-red-400">Again</span>
              <span className="text-[10px] text-slate-500 group-hover:text-red-400/70">Reset</span>
            </button>
            <button onClick={() => handleRating(3)} className="flex flex-col items-center justify-center py-4 rounded-2xl glass-panel hover:bg-amber-500/10 border-transparent hover:border-amber-500/30 transition-all hover:-translate-y-1 group">
              <span className="text-sm font-bold text-amber-400">Hard</span>
              <span className="text-[10px] text-slate-500 group-hover:text-amber-400/70">Short</span>
            </button>
            <button onClick={() => handleRating(4)} className="flex flex-col items-center justify-center py-4 rounded-2xl glass-panel hover:bg-emerald-500/10 border-transparent hover:border-emerald-500/30 transition-all hover:-translate-y-1 shadow-[0_0_15px_rgba(16,185,129,0.05)] group">
              <span className="text-sm font-bold text-emerald-400">Good</span>
              <span className="text-[10px] text-slate-500 group-hover:text-emerald-400/70">Mid</span>
            </button>
            <button onClick={() => handleRating(5)} className="flex flex-col items-center justify-center py-4 rounded-2xl glass-panel hover:bg-blue-500/10 border-transparent hover:border-blue-500/30 transition-all hover:-translate-y-1 group">
              <span className="text-sm font-bold text-blue-400">Easy</span>
              <span className="text-[10px] text-slate-500 group-hover:text-blue-400/70">Long</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}