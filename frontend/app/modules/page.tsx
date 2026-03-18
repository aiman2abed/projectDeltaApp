"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Define the shape of our data (matching our Python Pydantic schema)
interface Module {
  id: number;
  title: string;
  description: string;
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from your Python backend
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
              <Link href={`/modules/${mod.id}`}>
                  <button className="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-700 transition cursor-pointer">
                    View Lessons
                  </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}