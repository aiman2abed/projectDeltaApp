"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import MasteryChart from "@/components/MasteryChart";
import type { ModuleProgressSummary } from "@/types/api";

export default function Home() {
  const [dueCount, setDueCount] = useState<number>(0);
  const [summaryData, setSummaryData] = useState<ModuleProgressSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Due Count
    fetch("http://127.0.0.1:8000/api/progress/due")
      .then((res) => res.json())
      .then((data) => setDueCount(data.due_count))
      .catch(console.error);

    // Fetch Mastery Summary
    fetch("http://127.0.0.1:8000/api/progress/summary")
      .then((res) => res.json())
      .then((data) => {
        setSummaryData(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="flex flex-col items-center min-h-[80vh] py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-blue-900 mb-4 tracking-tight">
          Welcome to Delta EE
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Master complex electrical engineering concepts through spaced repetition and bite-sized micro-lessons.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        
        {/* Left Column: Actions */}
        <div className="space-y-8 lg:col-span-1">
          {/* Spaced Repetition Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Daily Review</h2>
            <p className="text-gray-500 mb-6">
              You have <span className="font-extrabold text-blue-600 text-xl">{loading ? "..." : dueCount}</span> reviews due today.
            </p>
            {dueCount > 0 ? (
              <Link href="/review" className="block w-full text-center px-4 py-3 rounded-xl font-bold transition bg-blue-600 text-white hover:bg-blue-700 shadow-md">
                Start Review Session
              </Link>
            ) : (
              <button className="w-full px-4 py-3 rounded-xl font-bold transition bg-gray-100 text-gray-400 cursor-not-allowed" disabled>
                All Caught Up!
              </button>
            )}
          </div>

          {/* Explore Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Explore Tracks</h2>
            <p className="text-gray-500 mb-6 text-sm">Dive into VLSI, Power Electronics, and Architecture.</p>
            <Link href="/modules" className="block w-full text-center bg-gray-50 text-blue-700 px-4 py-3 rounded-xl border border-blue-200 font-bold hover:bg-blue-50 hover:border-blue-300 transition">
              Browse Modules
            </Link>
          </div>
        </div>

        {/* Right Column: Mastery Visualization */}
        <div className="lg:col-span-2 flex flex-col">
          {loading ? (
            <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center text-gray-400 font-mono animate-pulse">
              Aggregating Mastery Data...
            </div>
          ) : (
            <MasteryChart data={summaryData} />
          )}
        </div>

      </div>
    </div>
  );
}