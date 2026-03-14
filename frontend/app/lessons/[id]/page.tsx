"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface Lesson {
  id: number;
  title: string;
  content_text: string;
  content_math: string;
}

export default function LessonDetailPage() {
  const { id } = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/lessons/${id}`)
      .then(res => res.json())
      .then(data => setLesson(data))
      .catch(err => console.error("Error:", err));
  }, [id]);

  if (!lesson) return <div className="text-center mt-10">Loading Lesson Content...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/modules" className="text-blue-600 hover:text-blue-800 font-medium mb-6 inline-block">
        ← Back to All Modules
      </Link>
      
      <article className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{lesson.title}</h1>
        
        <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed mb-8">
          {lesson.content_text}
        </div>

        {lesson.content_math && (
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 my-8">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Core Formula</p>
            <div className="text-2xl text-blue-900 overflow-x-auto">
              <BlockMath math={lesson.content_math} />
            </div>
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between">
          <button className="text-gray-400 font-medium cursor-not-allowed">Previous</button>
          <button className="bg-green-600 text-white px-6 py-2 rounded-full font-bold hover:bg-green-700 transition">
            Mark as Understood
          </button>
        </div>
      </article>
    </div>
  );
}