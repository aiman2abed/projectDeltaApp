"use client";
import { useEffect, useState } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import QuizEngine from "@/components/QuizEngine";
import MathRenderer from "@/components/MathRenderer";
import type { Lesson } from "@/types/api";

export default function DiscoverFeed() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/lessons")
      .then((res) => res.json())
      .then((data) => {
        setLessons(data);
        setLoading(false);
      })
      .catch((err) => console.error("Discover Feed Error:", err));
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-black text-white font-mono uppercase tracking-[0.2rem]">
      Initializing Engineering Stream...
    </div>
  );

  return (
    /* Snap-Scroll Physics:
       'snap-y snap-mandatory' creates the 'TikTok' feel where the 
       browser 'locks' onto each child section during a scroll.
    */
    <main className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black scrollbar-hide">
      {lessons.map((lesson) => (
        <section 
          key={lesson.id} 
          className="h-screen w-full snap-start flex flex-col items-center justify-center p-4"
        >
          {/* The Content Card */}
          <div className="max-w-md w-full bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[85vh] border-4 border-gray-900">
            
            {/* Header: Lesson ID and Branding */}
            <div className="px-6 py-4 bg-blue-900 text-white flex justify-between items-center border-b border-blue-800">
              <span className="text-[10px] font-black tracking-widest uppercase italic">Project Delta</span>
              <span className="text-[10px] bg-blue-700 px-2 py-0.5 rounded-full font-bold">
                {lesson.id} / 12
              </span>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <h2 className="text-2xl font-black text-gray-900 leading-tight">
                {lesson.title}
              </h2>

              {lesson.video_url && <VideoPlayer url={lesson.video_url} />}

              <div className="prose prose-sm text-gray-700">
                <p className="leading-relaxed">{lesson.content_text}</p>
              </div>

              {lesson.content_math && (
                <MathRenderer formula={lesson.content_math} />
              )}

              {lesson.quiz_question && (
                <div className="pt-4 border-t border-gray-100">
                  <QuizEngine
                    question={lesson.quiz_question}
                    options={lesson.quiz_options || []}
                    correctAnswer={lesson.correct_answer || ""}
                    onSuccess={() => console.log(`Mastered Lesson ${lesson.id}`)}
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
