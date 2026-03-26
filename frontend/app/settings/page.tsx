"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [dailyLimit, setDailyLimit] = useState(50);
  const [strictMode, setStrictMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("User");
  
  const supabase = createClient();
  const router = useRouter();

  // Load user data and saved preferences
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      
      setUserEmail(session.user.email || "Unknown Identity");

      try {
         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}`/api/users/me", {
           headers: { Authorization: `Bearer ${session.access_token}` }
         });
         const data = await res.json();
         setUserRole(data.role === 'admin' ? "Lead Engineer (Admin)" : "Engineering Student");
      } catch (e) {
         console.error(e);
      }
    };

    fetchUserData();

    // Load settings from local storage safely
    const savedLimit = localStorage.getItem("spirelay_dailyLimit");
    const savedStrict = localStorage.getItem("spirelay_strictMode");
    const savedNotifs = localStorage.getItem("spirelay_notifications");

    // 🛡️ DEFERRED UPDATE: Prevents React Strict Mode cascading renders
    setTimeout(() => {
      if (savedLimit) setDailyLimit(parseInt(savedLimit));
      if (savedStrict !== null) setStrictMode(savedStrict === "true");
      if (savedNotifs !== null) setNotifications(savedNotifs === "true");
    }, 0);
  }, [router, supabase]);

  // --- SETTINGS ACTIONS ---

  const handleSaveChanges = () => {
    localStorage.setItem("spirelay_dailyLimit", dailyLimit.toString());
    localStorage.setItem("spirelay_strictMode", strictMode.toString());
    localStorage.setItem("spirelay_notifications", notifications.toString());
    
    // Simulate a successful network save
    alert("SYSTEM UPDATED: Your configuration preferences have been saved.");
  };

  const handleSystemPurge = async () => {
    if (confirm("CRITICAL WARNING: This will terminate your session and clear local caches. Proceed?")) {
      localStorage.clear();
      await supabase.auth.signOut();
      router.push("/login");
    }
  };

  return (
    <div className="w-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold tracking-[0.2em] text-sky-400 uppercase mb-1">
            Configuration
          </p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            System Settings
          </h1>
        </div>
        <button onClick={handleSaveChanges} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-900 bg-sky-400 hover:bg-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all hover:-translate-y-0.5 active:translate-y-0">
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile & Account */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Profile Card */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-sky-400" />
            
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold text-white">Operator Profile</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-sky-400/30 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                👨‍💻
              </div>
              <div className="truncate">
                <p className="text-lg font-bold text-white truncate max-w-[200px]">{userEmail.split('@')[0] || "..."}</p>
                <p className="text-sm text-sky-400 font-medium">{userRole}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={userEmail}
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 text-slate-300 rounded-xl focus:outline-none transition-all duration-200"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Institution</label>
                <input 
                  type="text" 
                  defaultValue="Tel Aviv University"
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400/40 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="glass-panel p-6 rounded-3xl border-red-500/20 flex flex-col gap-4">
            <h2 className="text-xl font-bold text-red-400">Danger Zone</h2>
            <p className="text-sm text-slate-400 mb-2">
              Permanently erase your account, all memory decay data, and custom modules. This cannot be undone.
            </p>
            <button onClick={handleSystemPurge} className="w-full px-4 py-2.5 rounded-xl text-sm font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors">
              Initiate System Purge
            </button>
          </div>
        </div>

        {/* Right Column: Engine Preferences */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-panel p-6 md:p-8 rounded-3xl flex flex-col gap-8 h-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-white">SM-2 Engine Variables</h2>
            </div>

            {/* Setting 1 */}
            <div className="flex items-center justify-between py-4 border-b border-white/5">
              <div className="max-w-md">
                <h3 className="text-lg font-semibold text-slate-200">Daily Review Limit</h3>
                <p className="text-sm text-slate-400 mt-1">Maximum number of cards the algorithm will queue per 24-hour cycle to prevent burnout.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sky-400 font-mono font-bold">{dailyLimit}</span>
                <input 
                  type="range" 
                  min="10" 
                  max="200" 
                  step="10"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(parseInt(e.target.value))}
                  className="w-32 accent-sky-400"
                />
              </div>
            </div>

            {/* Setting 2 */}
            <div className="flex items-center justify-between py-4 border-b border-white/5">
              <div className="max-w-md">
                <h3 className="text-lg font-semibold text-slate-200">Strict Forgetting Curve</h3>
                <p className="text-sm text-slate-400 mt-1">Penalizes late reviews more aggressively, resetting interval multipliers if missed by &gt;48h.</p>
              </div>
              <button 
                onClick={() => setStrictMode(!strictMode)}
                className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors duration-300 ${strictMode ? 'bg-sky-500' : 'bg-slate-700'}`}
              >
                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${strictMode ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Setting 3 */}
            <div className="flex items-center justify-between py-4">
              <div className="max-w-md">
                <h3 className="text-lg font-semibold text-slate-200">Review Push Notifications</h3>
                <p className="text-sm text-slate-400 mt-1">Receive browser alerts when optimal memory decay thresholds are reached.</p>
              </div>
              <button 
                onClick={() => setNotifications(!notifications)}
                className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors duration-300 ${notifications ? 'bg-emerald-500' : 'bg-slate-700'}`}
              >
                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${notifications ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}