"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MasteryChart from "@/components/MasteryChart";
import type { ModuleProgressSummary } from "@/types/api";
import { createClient } from "@/lib/supabase"; 

export default function Home() {
  const [dueCount, setDueCount] = useState<number>(0);
  const [summaryData, setSummaryData] = useState<ModuleProgressSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("Engineer");
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      // Extract the first part of the email to use as a generic name
      const emailName = session.user.email?.split("@")[0] || "Engineer";
      setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));

      const headers = {
        "Authorization": `Bearer ${session.access_token}`,
        "Content-Type": "application/json"
      };

      try {
        const dueRes = await fetch("http://127.0.0.1:8000/api/progress/due", { headers });
        if (dueRes.ok) {
          const dueData = await dueRes.json();
          setDueCount(dueData.due_count);
        }

        const summaryRes = await fetch("http://127.0.0.1:8000/api/progress/summary", { headers });
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setSummaryData(summaryData);
        } else {
          setSummaryData([]);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router, supabase]);

  return (
    <div className="flex flex-col items-center min-h-[80vh] py-12">
      
      {/* Refined Hero Section */}
      <div className="text-center mb-14 w-full max-w-3xl px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
          Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{userName}</span>
        </h1>
        <p className="text-lg text-slate-500 font-medium">
          Your personalized spaced repetition algorithm is ready.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        
        {/* Left Column: Actions */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Premium Spaced Repetition Card */}
          <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 blur-2xl"></div>
            
            <h2 className="text-xl font-bold text-slate-800 mb-1 relative z-10">Daily Review</h2>
            
            {loading ? (
              <div className="h-20 flex items-center text-slate-400 animate-pulse">Calculating due cards...</div>
            ) : dueCount > 0 ? (
              <div className="relative z-10">
                <p className="text-slate-500 mb-6">
                  You have <span className="font-extrabold text-blue-600 text-2xl mx-1">{dueCount}</span> items pending retention.
                </p>
                <Link href="/review" className="flex items-center justify-center w-full px-4 py-4 rounded-xl font-bold transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95">
                  Start Session 🚀
                </Link>
              </div>
            ) : (
              /* Beautiful Empty State */
              <div className="flex flex-col items-center justify-center p-6 mt-4 bg-emerald-50 rounded-2xl border border-emerald-100/50 relative z-10">
                <span className="text-3xl mb-2">✨</span>
                <h3 className="text-emerald-800 font-bold text-lg">All Caught Up!</h3>
                <p className="text-emerald-600/80 text-sm text-center mt-1 font-medium">Your memory is fully optimized for today.</p>
              </div>
            )}
          </div>

          {/* Explore Card */}
          <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Explore Tracks</h2>
            <p className="text-slate-500 mb-6 text-sm font-medium">Expand your neural pathways into new subjects.</p>
            <Link href="/modules" className="flex items-center justify-center w-full bg-slate-50 text-blue-700 px-4 py-4 rounded-xl border border-blue-100 font-bold hover:bg-blue-50 hover:border-blue-200 transition-colors duration-200">
              Browse Curriculum
            </Link>
          </div>
        </div>

        {/* Right Column: Mastery Visualization */}
        <div className="lg:col-span-2 flex flex-col h-full">
          {loading ? (
            <div className="flex-1 bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center justify-center text-slate-400 min-h-[400px]">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-400 rounded-full animate-spin mb-4"></div>
              <span className="font-mono text-sm tracking-widest uppercase">Rendering Data</span>
            </div>
          ) : (
            <div className="flex-1 bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 h-full">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Mastery Overview</h2>
              <MasteryChart data={summaryData} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}