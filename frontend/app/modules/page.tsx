"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Upgrade: Bring in the Next.js router

interface Module {
  id: number;
  title: string;
  description: string;
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [navigatingId, setNavigatingId] = useState<number | null>(null); // Loading state for buttons
  const router = useRouter();

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/modules")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        setModules(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching modules:", error);
        setLoading(false);
      });
  }, []);

  // Upgrade: Dynamic fetching and routing
  const handleViewLessons = async (moduleId: number) => {
    setNavigatingId(moduleId); // Trigger loading spinner on this specific button
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/modules/${moduleId}/lessons`);
      if (!res.ok) throw new Error("Failed to fetch lessons");
      const lessons = await res.json();

      if (lessons.length > 0) {
        // Jump the user to the VERY FIRST lesson inside this module
        router.push(`/lessons/${lessons[0].id}`);
      } else {
        alert("This module doesn't have any lessons yet! Head to the Admin Studio to add some.");
        setNavigatingId(null);
      }
    } catch (error) {
      console.error(error);
      setNavigatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center mt-20 text-blue-900 font-bold text-xl">
        Loading EE Modules...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Engineering Tracks</h1>
      
      {modules.length === 0 ? (
        <p className="text-gray-500">No modules found. Is the backend running?</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((mod) => (
            <div key={mod.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
              <h2 className="text-xl font-bold text-blue-900 mb-2">{mod.title}</h2>
              <p className="text-gray-600 mb-4 h-20 overflow-hidden">{mod.description}</p>
              
              {/* Upgrade: Replaced Link with an onClick router action */}
              <button 
                onClick={() => handleViewLessons(mod.id)}
                disabled={navigatingId === mod.id}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-700 transition cursor-pointer disabled:bg-blue-400"
              >
                {navigatingId === mod.id ? "Loading..." : "View Lessons"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}