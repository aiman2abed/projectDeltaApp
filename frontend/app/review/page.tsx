"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReviewQueuePage() {
  const router = useRouter();

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/progress/review-queue")
      .then((res) => res.json())
      .then((data) => {
        if (data.lesson_id) {
          // If a lesson is due, instantly send the user to that lesson page!
          router.push(`/lessons/${data.lesson_id}`);
        } else {
          // If nothing is due, send them back to the dashboard
          router.push("/");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch review queue:", err);
        router.push("/");
      });
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <h2 className="text-2xl font-bold text-blue-900 animate-pulse">
        Finding your next review...
      </h2>
    </div>
  );
}