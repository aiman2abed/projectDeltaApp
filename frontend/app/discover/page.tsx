"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import QuizEngine from "@/components/QuizEngine";
import MathRenderer from "@/components/MathRenderer";
import type { Lesson, ProgressUpdateRequest } from "@/types/api";
import { createClient } from "@/lib/supabase";

export default function DiscoverFeed() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchSmartFeed = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("http://127.0.0.1:8000/api/feed/smart", {
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json"
          }
        });

        if (!res.ok) throw new Error("Feed unavailable");
        
        const data = await res.json();
        setLessons(data); 
      } catch (err) {
        console.error("Error loading smart feed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSmartFeed();
  }, [router, supabase]);

  const handleLessonSuccess = async (lessonIndex: number, lessonId: number, isFirstTry: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const payload: ProgressUpdateRequest = {
      user_id: 1, 
      quality: isFirstTry ? 5 : 3, 
    };

    try {
      await fetch(`http://127.0.0.1:8000/api/progress/${lessonId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}` 
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Failed to sync progress:", error);
    }

    const nextSection = sectionRefs.current[lessonIndex + 1];
    if (!nextSection) return;

    nextSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });
  };

  if (loading)
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="font-mono text-sm uppercase tracking-widest text-slate-400">Tuning the Algorithm...</p>
      </div>
    );

  return (
    // Note the dynamic height calc to account for the layout navbar and prevent double-scrolling
    <main className="h-[calc(100vh-64px)] overflow-y-scroll snap-y snap-mandatory bg-gradient-to-b from-slate-900 to-slate-950 scrollbar-hide">
      {lessons.map((lesson, index) => (
        <section
          key={lesson.id}
          ref={(element) => {
            sectionRefs.current[index] = element;
          }}
          className="h-[calc(100vh-64px)] w-full snap-start flex flex-col items-center justify-center p-4 sm:p-6"
        >
          {/* Enhanced Glassmorphism & Shadow Card */}
          <div className="max-w-md w-full bg-white rounded-[2rem] overflow-hidden shadow-2xl shadow-blue-900/20 ring-1 ring-white/10 flex flex-col h-[85vh] transition-all">
            
            {/* Cleaner Header without the debug counter */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center z-10">
              <span className="text-xs font-black tracking-widest uppercase text-slate-400">Spirelay <span className="text-blue-500">Stream</span></span>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              <h2 className="text-2xl font-extrabold text-slate-900 leading-tight tracking-tight">{lesson.title}</h2>

              {lesson.video_url && (
                <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                  <VideoPlayer url={lesson.video_url} mode="feed" />
                </div>
              )}

              <div className="prose prose-sm prose-slate text-slate-600">
                <p className="leading-relaxed">{lesson.content_text}</p>
              </div>

              {lesson.content_math && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <MathRenderer formula={lesson.content_math} />
                </div>
              )}

              {lesson.quiz_question && (
                <div className="pt-6 mt-6 border-t border-slate-100">
                  <QuizEngine
                    question={lesson.quiz_question}
                    options={lesson.quiz_options || []}
                    correctAnswer={lesson.correct_answer || ""}
                    onSuccess={(isFirstTry) => {
                      handleLessonSuccess(index, lesson.id, isFirstTry);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}