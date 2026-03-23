"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import QuizEngine from "@/components/QuizEngine";
import MathRenderer from "@/components/MathRenderer";
import type { Lesson, ProgressUpdateRequest, ProgressUpdateResponse } from "@/types/api";
import { createClient } from "@/lib/supabase";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessonData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(`http://localhost:8000/api/lessons/${params.id}`, {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });
        const data = await res.json();
        setLesson(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [params.id, router, supabase]);

  const handleMarkAsUnderstood = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Quality 4 (Good) signifies they successfully passed the lesson
    const payload: ProgressUpdateRequest = { quality: 4 };

    const response = await fetch(`http://localhost:8000/api/progress/${params.id}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      alert(`✅ Telemetry Logged! This sequence is now in your Spaced Repetition Engine.`);
      router.push("/modules");
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-sky-400 font-mono mt-12">DECRYPTING PAYLOAD...</div>;
  if (!lesson) return <div className="p-10 text-center text-red-500 font-bold">Error: Lesson data corrupted.</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div>
        <p className="text-sm font-bold tracking-[0.2em] text-sky-400 uppercase mb-1">Technical Payload</p>
        <h1 className="text-3xl md:text-4xl font-black text-white text-glow">{lesson.title}</h1>
      </div>

      {lesson.video_url && (
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <VideoPlayer url={lesson.video_url} />
        </div>
      )}

      {/* Content & Math block */}
      <div className="glass-panel p-8 rounded-2xl flex flex-col gap-6">
        <p className="text-slate-300 leading-relaxed text-lg">{lesson.content_text}</p>
        
        {lesson.content_math && (
           <div className="bg-slate-900/50 border border-sky-500/30 rounded-xl p-6 flex justify-center shadow-inner">
             <div className="text-white text-xl">
               <MathRenderer formula={lesson.content_math} />
             </div>
           </div>
        )}
      </div>

      {/* Quiz Engine */}
      {lesson.quiz_question && lesson.quiz_options && lesson.correct_answer && (
        <div className="glass-panel-active p-8 rounded-2xl">
          <p className="text-[10px] font-bold tracking-[0.2em] text-sky-400 uppercase mb-4">Verification Check</p>
          <QuizEngine
            question={lesson.quiz_question}
            options={lesson.quiz_options}
            correctAnswer={lesson.correct_answer}
            onSuccess={() => setIsUnlocked(true)} 
          />
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-center mt-4 pb-12">
        <button
          onClick={handleMarkAsUnderstood}
          disabled={!isUnlocked}
          className={`w-full max-w-md px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg ${
            isUnlocked
              ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-white hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              : "glass-panel text-slate-500 cursor-not-allowed border-dashed"
          }`}
        >
          {isUnlocked ? "🚀 INJECT INTO ENGINE" : "🔒 PASS VERIFICATION TO UNLOCK"}
        </button>
      </div>
    </div>
  );
}