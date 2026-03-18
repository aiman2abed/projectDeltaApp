"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Lesson {
  id: number;
  title: string;
  content_text: string;
}

export default function ModuleIndexPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id;
  
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch only the lessons that belong to this specific module
    fetch(`http://127.0.0.1:8000/api/modules/${moduleId}/lessons`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch lessons");
        return res.json();
      })
      .then((data) => {
        setLessons(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, [moduleId]);

  if (loading) {
    return <div className="mt-20 text-center font-bold text-xl text-blue-900">Loading curriculum...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <button 
        onClick={() => router.push('/modules')}
        className="mb-6 text-sm font-semibold text-slate-500 hover:text-slate-800 transition flex items-center gap-2"
      >
        ← Back to All Tracks
      </button>

      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Module Lessons</h1>
      <p className="text-slate-600 mb-8">Select a topic below to begin studying.</p>

      {lessons.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200">
          <p className="text-slate-500">No lessons have been added to this module yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {lessons.map((lesson, index) => (
            <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-cyan-300 transition cursor-pointer group flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 mb-1">
                    Lesson {index + 1}
                  </p>
                  <h2 className="text-lg font-bold text-slate-900 group-hover:text-cyan-700 transition">
                    {lesson.title}
                  </h2>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-2 max-w-xl">
                    {lesson.content_text}
                  </p>
                </div>
                <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-cyan-100 transition">
                  <span className="text-slate-400 group-hover:text-cyan-600">▶</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}