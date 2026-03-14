"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import QuizEngine from "@/components/QuizEngine";
import MathRenderer from "@/components/MathRenderer";
import type { Lesson, ProgressUpdateRequest, ProgressUpdateResponse } from "@/types/api";

export default function LessonPage() {
  const params = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false); // New lock state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/lessons/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setLesson(data);
        setLoading(false);
      });
  }, [params.id]);

  const handleMarkAsUnderstood = async () => {
    // This remains the same as T8, sending the signal to the SRS engine
    const payload: ProgressUpdateRequest = { user_id: 1, quality: 5 };

    const response = await fetch(`http://127.0.0.1:8000/api/progress/${params.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data: ProgressUpdateResponse = await response.json();
      alert(`${data.message} Next review: ${data.next_review_date}`);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-blue-900">Loading lesson...</div>;
  if (!lesson) return <div className="p-8 text-center text-red-600">Lesson not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">{lesson.title}</h1>

      {/* 1. VIDEO COMPONENT (The Reel) */}
      {lesson.video_url && <VideoPlayer url={lesson.video_url} />}

      {/* 2. TEXT & MATH CONTENT */}
      <div className="prose prose-blue max-w-none mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <p className="text-gray-800 leading-relaxed mb-4">{lesson.content_text}</p>
        
        {lesson.content_math && (
          <MathRenderer formula={lesson.content_math} />
        )}
      </div>

      {/* 3. QUIZ ENGINE (The knowledge check) */}
      {lesson.quiz_question && lesson.quiz_options && lesson.correct_answer && (
        <QuizEngine
          question={lesson.quiz_question}
          options={lesson.quiz_options}
          correctAnswer={lesson.correct_answer}
          onSuccess={() => setIsUnlocked(true)} // Flipping the lock!
        />
      )}

      {/* 4. COMPLETION BUTTON (The Spaced Repetition trigger) */}
      <div className="flex justify-center mt-12 pb-12">
        <button
          onClick={handleMarkAsUnderstood}
          disabled={!isUnlocked} // Disabled until the quiz is passed
          className={`px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 shadow-lg ${
            isUnlocked
              ? "bg-green-600 text-white hover:bg-green-700 hover:scale-105 active:scale-95 cursor-pointer"
              : "bg-gray-300 text-gray-500 cursor-not-allowed grayscale"
          }`}
        >
          {isUnlocked ? "🚀 Mark as Understood" : "🔒 Pass Quiz to Unlock"}
        </button>
      </div>
    </div>
  );
}