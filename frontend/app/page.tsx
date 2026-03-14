"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [dueCount, setDueCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/progress/due")
      .then((res) => res.json())
      .then((data) => {
        setDueCount(data.due_count);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching due count:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-4xl font-extrabold text-blue-900 mb-4">
        Welcome to Delta EE
      </h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl">
        Master complex electrical engineering concepts through spaced repetition and bite-sized micro-lessons.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        
        {/* The Dynamic Spaced Repetition Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Continue Learning</h2>
          
          <p className="text-gray-500 mb-4">
            You have <span className="font-extrabold text-blue-600 text-lg">{loading ? "..." : dueCount}</span> reviews due today.
          </p>
          
          {dueCount > 0 ? (
            <Link href="/review">
              <button className="px-4 py-2 rounded font-medium transition bg-blue-600 text-white hover:bg-blue-700 cursor-pointer">
                Start Review
              </button>
            </Link>
          ) : (
            <button className="px-4 py-2 rounded font-medium transition bg-gray-300 text-gray-500 cursor-not-allowed" disabled>
              All Caught Up!
            </button>
          )}
        </div>

        {/* The Explore Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Explore Tracks</h2>
          <p className="text-gray-500 mb-4">Dive into VLSI, Power Electronics, and more.</p>
          <Link href="/modules">
            <button className="bg-gray-100 text-blue-600 px-4 py-2 rounded border border-gray-300 hover:bg-gray-200 transition cursor-pointer">
              Browse Modules
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}