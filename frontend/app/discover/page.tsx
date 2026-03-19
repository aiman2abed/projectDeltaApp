"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import QuizEngine from "@/components/QuizEngine";
import MathRenderer from "@/components/MathRenderer";
import type { Lesson, ProgressUpdateRequest } from "@/types/api";
import { createClient } from "@/lib/supabase"; // Import Supabase Client

export default function DiscoverFeed() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchSmartFeed = async () => {
      // 1. Get the current user session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      // If the user isn't logged in, send them to the login page
      if (!session) {
        router.push("/login");
        return;
      }

      try {
        // 2. Attach the JWT token to the headers
        const res = await fetch("http://127.0.0.1:8000/api/feed/smart", {
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json"
          }
        });

        if (!res.ok) throw new Error("Feed unavailable");
        
        const data = await res.json();
        setLessons(data); // The backend already shuffled and ranked them!
      } catch (err) {
        console.error("Error loading smart feed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSmartFeed();
  }, [router, supabase]);

  // Upgraded to handle the DB save AND the scroll
  const handleLessonSuccess = async (lessonIndex: number, lessonId: number, isFirstTry: boolean) => {
    // We fetch the session dynamically here to ensure the token hasn't expired while they were studying
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // 1. Save progress silently in the background
    const payload: ProgressUpdateRequest = {
      user_id: 1, // Dummy ID: The backend ignores this and securely uses the UUID from the token
      quality: isFirstTry ? 5 : 3, // Perfect score if first try, lower score if they guessed
    };

    try {
      await fetch(`http://127.0.0.1:8000/api/progress/${lessonId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}` // Attach token for progress saving!
        },
        body: JSON.stringify(payload),
      });
      console.log(`Successfully synced progress for lesson ${lessonId}`);
    } catch (error) {
      console.error("Failed to sync progress:", error);
    }

    // 2. Trigger the Auto-Swipe physics
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
      <div className="h-screen flex items-center justify-center bg-black text-white font-mono uppercase tracking-[0.2rem]">
        Authenticating Spirelay Stream...
      </div>
    );

  return (
    <main className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black scrollbar-hide">
      {lessons.map((lesson, index) => (
        <section
          key={lesson.id}
          ref={(element) => {
            sectionRefs.current[index] = element;
          }}
          className="h-screen w-full snap-start flex flex-col items-center justify-center p-4"
        >
          <div className="max-w-md w-full bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[85vh] border-4 border-gray-900">
            <div className="px-6 py-4 bg-blue-900 text-white flex justify-between items-center border-b border-blue-800">
              <span className="text-[10px] font-black tracking-widest uppercase italic">Spirelay</span>
              <span className="text-[10px] bg-blue-700 px-2 py-0.5 rounded-full font-bold">{index + 1} / {lessons.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <h2 className="text-2xl font-black text-gray-900 leading-tight">{lesson.title}</h2>

              {lesson.video_url && <VideoPlayer url={lesson.video_url} mode="feed" />}

              <div className="prose prose-sm text-gray-700">
                <p className="leading-relaxed">{lesson.content_text}</p>
              </div>

              {lesson.content_math && <MathRenderer formula={lesson.content_math} />}

              {lesson.quiz_question && (
                <div className="pt-4 border-t border-gray-100">
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