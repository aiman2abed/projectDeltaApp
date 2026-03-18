"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QuizEngine from "@/components/QuizEngine";
import { createClient } from "@/lib/supabase";
import type { Lesson, ProgressUpdateRequest, ReviewQueueResponse } from "@/types/api";

export default function ReviewQueuePage() {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
  const [isQueueComplete, setIsQueueComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const loadNextLesson = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    const headers = {
      "Authorization": `Bearer ${session.access_token}`,
      "Content-Type": "application/json"
    };

    try {
      const queueResponse = await fetch("http://127.0.0.1:8000/api/progress/review-queue", { headers });
      
      if (!queueResponse.ok) throw new Error("Unable to fetch review queue.");
      const queueData: ReviewQueueResponse = await queueResponse.json();

      if (queueData.lesson_id === null) {
        setLesson(null);
        setActiveLessonId(null);
        setIsQueueComplete(true);
        return;
      }

      // Fetch the actual lesson data
      const lessonResponse = await fetch(`http://127.0.0.1:8000/api/lessons/${queueData.lesson_id}`, { headers });
      if (!lessonResponse.ok) throw new Error("Unable to fetch the next lesson for review.");

      const lessonData: Lesson = await lessonResponse.json();
      setLesson(lessonData);
      setActiveLessonId(queueData.lesson_id);
      setIsQueueComplete(false);
    } catch (error) {
      console.error("Failed to load review queue:", error);
      setErrorMessage("We couldn't load your review queue. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    loadNextLesson();
  }, [loadNextLesson]);

  const handleQuizSuccess = async (isFirstTry: boolean) => {
    if (!activeLessonId) return;

    setIsLoading(true);
    setErrorMessage(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const payload: ProgressUpdateRequest = {
      user_id: 1, // Dummy data, backend uses JWT UUID
      quality: isFirstTry ? 5 : 1,
    };

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/progress/${activeLessonId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Unable to submit review result.");
      await loadNextLesson(); // Load the next one in the queue!
      
    } catch (error) {
      console.error("Failed to submit review result:", error);
      setErrorMessage("Your answer was correct, but we couldn't save your progress. Please try again.");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-blue-900 animate-pulse">Authenticating & Loading Queue...</h2>
          <p className="text-gray-600 mt-3">Preparing the next review prompt.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 py-12">
      <h1 className="text-3xl font-black text-blue-900 mb-2">Daily Review</h1>
      <p className="text-gray-600 mb-8">Strengthen memory by recalling the answer before you reveal mastery.</p>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 font-medium">{errorMessage}</div>
      )}

      {isQueueComplete ? (
        <div className="bg-white border border-green-200 rounded-2xl p-8 shadow-sm text-center">
          <h2 className="text-2xl font-black text-green-700 mb-3">🎉 Review Complete</h2>
          <p className="text-gray-700 mb-6 font-medium">No lessons are due right now. Great consistency—keep the streak alive.</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-md"
          >
            Back to Dashboard
          </Link>
        </div>
      ) : (
        lesson?.quiz_question &&
        lesson.quiz_options &&
        lesson.correct_answer && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <QuizEngine
              question={lesson.quiz_question}
              options={lesson.quiz_options}
              correctAnswer={lesson.correct_answer}
              onSuccess={handleQuizSuccess}
            />
          </div>
        )
      )}
    </div>
  );
}