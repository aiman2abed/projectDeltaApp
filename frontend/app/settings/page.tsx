"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface UserProfile {
  id: string;
  email: string;
  role: string;
}

const API_BASE_URL = "http://127.0.0.1:8000";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"account" | "preferences" | "admin">("account");
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          throw new Error("Failed to fetch profile");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handlePasswordReset = async () => {
    if (!user) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: "http://localhost:3000/settings", // Redirects back here after they click the email
    });

    if (error) {
      setActionMessage({ text: error.message, type: "error" });
    } else {
      setActionMessage({ text: "Password reset link sent to your email.", type: "success" });
    }
    setTimeout(() => setActionMessage(null), 5000);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <span className="font-mono text-sm tracking-widest uppercase">Loading Settings</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 min-h-[85vh]">
      
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-lg text-slate-500 font-medium mt-2">Manage your account and application preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-full md:w-64 flex-shrink-0 space-y-2">
          <button 
            onClick={() => setActiveTab("account")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "account" ? "bg-blue-50 text-blue-700 border border-blue-100" : "text-slate-600 hover:bg-slate-50 border border-transparent"}`}
          >
            👤 Account & Security
          </button>
          
          <button 
            onClick={() => setActiveTab("preferences")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "preferences" ? "bg-blue-50 text-blue-700 border border-blue-100" : "text-slate-600 hover:bg-slate-50 border border-transparent"}`}
          >
            🎛️ Learning Preferences
          </button>

          {/* ADMIN ONLY TAB */}
          {user?.role === "admin" && (
            <div className="pt-4 mt-4 border-t border-slate-200">
              <p className="px-4 text-xs font-black uppercase tracking-widest text-slate-400 mb-2">System Admin</p>
              <button 
                onClick={() => setActiveTab("admin")}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "admin" ? "bg-slate-900 text-white border border-slate-800 shadow-md" : "text-slate-600 hover:bg-slate-50 border border-transparent"}`}
              >
                ⚙️ Global Settings
              </button>
            </div>
          )}
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          
          {/* TOAST MESSAGE */}
          {actionMessage && (
            <div className={`p-4 text-sm font-semibold border-b ${actionMessage.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}>
              {actionMessage.text}
            </div>
          )}

          <div className="p-8 sm:p-10">
            
            {/* =====================================
                TAB: ACCOUNT
            ====================================== */}
            {activeTab === "account" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Profile Information</h2>
                  <div className="grid gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={user?.email || ""} 
                        className="w-full max-w-md px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 focus:outline-none cursor-not-allowed"
                      />
                      <p className="text-xs text-slate-500 mt-2 font-medium">Your email is tied to your identity and cannot be changed.</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Account Role</label>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${user?.role === 'admin' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {user?.role} Access
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Security</h2>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={handlePasswordReset}
                      className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      Request Password Reset
                    </button>
                    <button 
                      onClick={handleSignOut}
                      className="px-6 py-3 bg-rose-50 border border-rose-100 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-colors shadow-sm"
                    >
                      Sign Out of Spirelay
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* =====================================
                TAB: PREFERENCES (Placeholders for future)
            ====================================== */}
            {activeTab === "preferences" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Spaced Repetition Algorithm</h2>
                  <p className="text-slate-500 font-medium mb-6">Tune how the learning engine delivers your reviews.</p>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-5 border border-slate-100 rounded-2xl bg-slate-50">
                      <div>
                        <h3 className="font-bold text-slate-800">Daily Review Limit</h3>
                        <p className="text-sm text-slate-500">Maximum number of flashcards shown per day.</p>
                      </div>
                      <select className="px-4 py-2 border border-slate-200 rounded-lg bg-white font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
                        <option>20 cards</option>
                        <option>50 cards</option>
                        <option>100 cards</option>
                        <option>Unlimited</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-5 border border-slate-100 rounded-2xl bg-slate-50 opacity-60">
                      <div>
                        <h3 className="font-bold text-slate-800">Strict Interleaving</h3>
                        <p className="text-sm text-slate-500">Force the feed to constantly switch subjects.</p>
                      </div>
                      <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-not-allowed">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <p className="text-xs text-right text-slate-400 italic">Advanced settings coming in v4.1</p>
                  </div>
                </div>
              </div>
            )}

            {/* =====================================
                TAB: ADMIN DANGER ZONE
            ====================================== */}
            {activeTab === "admin" && user?.role === "admin" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">System Diagnostics</h2>
                  <p className="text-slate-500 font-medium mb-6">Global configuration and dangerous operations.</p>
                  
                  <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-rose-500"></div>
                    <h3 className="font-black text-rose-800 text-lg mb-2">Danger Zone</h3>
                    <p className="text-sm text-rose-700/80 mb-6 font-medium">These actions affect the entire database and all users. They cannot be undone.</p>
                    
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-rose-100">
                        <div>
                          <p className="font-bold text-slate-900">Factory Reset Curriculum</p>
                          <p className="text-xs text-slate-500">Deletes all modules and resets ID sequences to 1.</p>
                        </div>
                        <button className="px-4 py-2 bg-rose-100 text-rose-700 font-bold rounded-lg hover:bg-rose-600 hover:text-white transition-colors" onClick={() => alert("Requires SuperAdmin override.")}>
                          Execute Reset
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-rose-100">
                        <div>
                          <p className="font-bold text-slate-900">Clear Global User Progress</p>
                          <p className="text-xs text-slate-500">Wipes the SRS intervals for every user on the platform.</p>
                        </div>
                        <button className="px-4 py-2 bg-rose-100 text-rose-700 font-bold rounded-lg hover:bg-rose-600 hover:text-white transition-colors" onClick={() => alert("Requires SuperAdmin override.")}>
                          Wipe Progress
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}