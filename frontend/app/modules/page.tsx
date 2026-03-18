"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface Module {
  id: number;
  title: string;
  description: string;
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchModules = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("http://127.0.0.1:8000/api/modules", {
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json"
          }
        });

        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        setModules(data);
      } catch (error) {
        console.error("Error fetching modules:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex justify-center mt-20 text-blue-900 font-bold text-xl animate-pulse">
        Authenticating & Loading Tracks...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Engineering Tracks</h1>
      
      {modules.length === 0 ? (
        <p className="text-gray-500">No modules found. Is the backend running?</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((mod) => (
            <div key={mod.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
              <h2 className="text-xl font-bold text-blue-900 mb-2">{mod.title}</h2>
              <p className="text-gray-600 mb-4 h-20 overflow-hidden text-sm">{mod.description}</p>
              <Link href={`/lessons/${mod.id}`}>
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition cursor-pointer shadow-sm">
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