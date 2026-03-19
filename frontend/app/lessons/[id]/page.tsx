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
        const res = await fetch(`http://127.0.0.1:8000/api/lessons/${params.id}`, {
          headers: {
            "Authorization": `Bearer ${session.access_token}`
          }
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

    const payload: ProgressUpdateRequest = { user_id: 1, quality: 5 };

    const response = await fetch(`http://127.0.0.1:8000/api/progress/${params.id}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}` // Added the Lock-Pick!
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data: ProgressUpdateResponse = await response.json();
      alert(`✅ Mastery Recorded! Next review: ${data.next_review_date}`);
      router.push("/modules"); // Send them back to the curriculum after success
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-blue-900 font-bold mt-12">Authenticating & Loading Lesson...</div>;
  if (!lesson) return <div className="p-8 text-center text-red-600">Lesson not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 py-12">
      <h1 className="text-3xl font-black text-blue-900 mb-6">{lesson.title}</h1>

      {lesson.video_url && <VideoPlayer url={lesson.video_url} />}

      <div className="prose prose-blue max-w-none mb-8 bg-white shadow-sm p-6 rounded-2xl border border-gray-200">
        <p className="text-gray-800 leading-relaxed mb-4">{lesson.content_text}</p>
        {lesson.content_math && <MathRenderer formula={lesson.content_math} />}
      </div>

      {lesson.quiz_question && lesson.quiz_options && lesson.correct_answer && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <QuizEngine
            question={lesson.quiz_question}
            options={lesson.quiz_options}
            correctAnswer={lesson.correct_answer}
            onSuccess={() => setIsUnlocked(true)} 
          />
        </div>
      )}

      <div className="flex justify-center mt-12 pb-12">
        <button
          onClick={handleMarkAsUnderstood}
          disabled={!isUnlocked}
          className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg ${
            isUnlocked
              ? "bg-green-600 text-white hover:bg-green-700 hover:scale-105 active:scale-95 cursor-pointer"
              : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
          }`}
        >
          {isUnlocked ? "🚀 Mark as Understood" : "🔒 Pass Quiz to Unlock"}
        </button>
      </div>
    </div>
  );
}