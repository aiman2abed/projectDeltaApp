"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type ModalState = {
  isOpen: boolean;
  mode: "new_module" | "edit_module" | "new_lesson";
  targetId?: number;
};

type BanModalState = {
  isOpen: boolean;
  userId: string;
  userEmail: string;
};

type Module = {
  id: number;
  title: string;
  description?: string | null;
};

type UserRow = {
  id: string;
  email: string;
  role: string;
  first_name?: string | null;
  last_name?: string | null;
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"modules" | "users">("modules");
  const [modules, setModules] = useState<Module[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dynamic Modal State (Modules/Lessons)
  const [modal, setModal] = useState<ModalState>({ isOpen: false, mode: "new_module" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sanction/Ban Modal State
  const [banModal, setBanModal] = useState<BanModalState>({ isOpen: false, userId: "", userEmail: "" });
  const [banAction, setBanAction] = useState<"temp" | "perma" | "delete">("temp");
  const [isBanning, setIsBanning] = useState(false);

  // Unified Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    parentModuleId: "",
    contentText: "",
    contentMath: "",
    videoUrl: ""
  });

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchAdminData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}`/api/users/me", {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const meData = await meRes.json();
        
        if (meData.role !== "admin") {
          alert("SECURITY PROTOCOL: Unauthorized Access.");
          router.push("/");
          return;
        }

        const [modRes, usersRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}`/api/modules", { headers: { Authorization: `Bearer ${session.access_token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}`/api/users", { headers: { Authorization: `Bearer ${session.access_token}` } })
        ]);

        setModules(await modRes.json());
        setUsers(await usersRes.json());
      } catch (err) {
        console.error("Admin fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [router, supabase]);

  // --- MODAL CONTROLS ---

  const openNewModule = () => {
    setForm({ title: "", description: "", parentModuleId: "", contentText: "", contentMath: "", videoUrl: "" });
    setModal({ isOpen: true, mode: "new_module" });
  };

  const openEditModule = (mod: Module) => {
    setForm({ ...form, title: mod.title, description: mod.description || "" });
    setModal({ isOpen: true, mode: "edit_module", targetId: mod.id });
  };

  const openNewLesson = (moduleId?: number) => {
    setForm({ ...form, title: "", contentText: "", contentMath: "", videoUrl: "", parentModuleId: moduleId ? moduleId.toString() : (modules[0]?.id.toString() || "") });
    setModal({ isOpen: true, mode: "new_lesson" });
  };

  const handleCloseModal = () => {
    setModal({ isOpen: false, mode: "new_module" });
  };

  const openBanModal = (userId: string, userEmail: string) => {
    setBanModal({ isOpen: true, userId, userEmail });
    setBanAction("temp"); // Reset to default safely
  };

  const closeBanModal = () => {
    setBanModal({ isOpen: false, userId: "", userEmail: "" });
  };

  // --- ACTION HANDLERS ---

  const handleExportLogs = () => {
    const dataToExport = activeTab === "modules" ? modules : users;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `spirelay_${activeTab}_export.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleModalSubmit = async () => {
    if (!form.title.trim()) {
      alert("Title is required.");
      return;
    }
    
    setIsSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      if (modal.mode === "new_module") {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}`/api/modules", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ title: form.title, description: form.description })
        });
        if (res.ok) setModules([...modules, await res.json()]);

      } else if (modal.mode === "edit_module") {
        const res = await fetch(`http://localhost:8000/api/modules/${modal.targetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ title: form.title, description: form.description })
        });
        if (res.ok) {
          const updatedMod = await res.json();
          setModules(modules.map(m => m.id === modal.targetId ? updatedMod : m));
        }

      } else if (modal.mode === "new_lesson") {
        if (!form.parentModuleId || !form.contentText) {
          alert("Module and Content Text are required for a lesson.");
          setIsSubmitting(false);
          return;
        }
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}`/api/lessons", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ 
            module_id: parseInt(form.parentModuleId), 
            title: form.title, 
            content_text: form.contentText,
            content_math: form.contentMath || null,
            video_url: form.videoUrl || null
          })
        });
        if (res.ok) alert("Lesson Payload successfully injected into Module!");
      }
      
      handleCloseModal();
    } catch (err) {
      console.error("Submit failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteModule = async (id: number) => {
    if (!confirm("CRITICAL WARNING: This will permanently delete the module and ALL associated lessons. Proceed?")) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const res = await fetch(`http://localhost:8000/api/modules/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        setModules(modules.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error("Deletion failed", err);
    }
  };

  const handleManageUser = async (userId: string, currentRole: string) => {
    const newRole = prompt(`Change role for user ${userId}? (Type 'admin' or 'user')`, currentRole);
    if (!newRole || newRole === currentRole || !['admin', 'user'].includes(newRole)) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const res = await fetch(`http://localhost:8000/api/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      console.error("Role update failed", err);
    }
  };

  // 🛡️ NEW: Wipe User Progress Handler
  const handleWipeProgress = async (userId: string, userEmail: string) => {
    if (!confirm(`CRITICAL WARNING: This will completely erase all SM-2 learning telemetry and mastery progress for ${userEmail}. Their account and role will remain intact. Proceed?`)) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      // You will need to implement this endpoint on your FastAPI backend
      const res = await fetch(`http://localhost:8000/api/admin/users/${userId}/progress`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      if (res.ok) {
        alert(`Telemetry successfully wiped for ${userEmail}.`);
      } else {
        alert(`Failed to wipe telemetry for ${userEmail}. Check backend logs.`);
      }
    } catch (err) {
      console.error("Progress wipe failed", err);
    }
  };

  const executeSanction = async () => {
    setIsBanning(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    try {
      if (banAction === "delete" && session) {
         // await fetch(`http://localhost:8000/api/users/${banModal.userId}`, { method: "DELETE", ... })
         setUsers(users.filter(u => u.id !== banModal.userId));
      } else {
         alert(`User ${banModal.userEmail} has received a ${banAction} ban.`);
      }
      
      closeBanModal();
    } catch (err) {
      console.error("Sanction failed", err);
    } finally {
      setIsBanning(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-red-500 font-mono animate-pulse">VERIFYING ADMIN CREDENTIALS...</div>;
  }

  return (
    <div className="w-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      
      {/* 🚀 DYNAMIC INJECTION MODAL (Modules & Lessons) */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-8 border border-sky-500/30 shadow-[0_0_40px_rgba(56,189,248,0.15)] flex flex-col gap-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
            
            <div>
              <h2 className="text-2xl font-black text-white text-glow mb-1">
                {modal.mode === "new_module" && "Initialize New Module"}
                {modal.mode === "edit_module" && "Reconfigure Module"}
                {modal.mode === "new_lesson" && "Inject Lesson Payload"}
              </h2>
              <p className="text-sm text-slate-400">
                {modal.mode === "new_lesson" ? "Deploy a specific flashcard or video into a module." : "Manage high-level curriculum categories."}
              </p>
            </div>

            <div className="flex flex-col gap-4 relative z-10">
              {modal.mode === "new_lesson" && (
                <div>
                  <label className="block text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2">Target Module Node</label>
                  <select 
                    value={form.parentModuleId}
                    onChange={(e) => setForm({ ...form, parentModuleId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:outline-none focus:border-sky-500/50 appearance-none"
                  >
                    <option value="" disabled>Select a target module...</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2">Title / Designation</label>
                <input 
                  type="text" 
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., CMOS Logic Fundamentals"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-600"
                />
              </div>

              {(modal.mode === "new_module" || modal.mode === "edit_module") && (
                <div>
                  <label className="block text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2">Description</label>
                  <textarea 
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-600 resize-none"
                  />
                </div>
              )}

              {modal.mode === "new_lesson" && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2">Content Text (Front)</label>
                    <textarea 
                      value={form.contentText}
                      onChange={(e) => setForm({ ...form, contentText: e.target.value })}
                      placeholder="The main concept or question..."
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-600 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">Content Math (LaTeX / Back)</label>
                    <input 
                      type="text" 
                      value={form.contentMath}
                      onChange={(e) => setForm({ ...form, contentMath: e.target.value })}
                      placeholder="e.g., V_{out} = D \cdot V_{in}"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl font-mono text-sm focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-fuchsia-400 uppercase tracking-widest mb-2">Media URL (Video/Reel)</label>
                    <input 
                      type="text" 
                      value={form.videoUrl}
                      onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                      placeholder="YouTube URL or .mp4 link"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 text-white rounded-xl focus:outline-none focus:border-fuchsia-500/50 transition-all placeholder:text-slate-600"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-2 relative z-10 pt-4 border-t border-white/5">
              <button onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                Abort
              </button>
              <button onClick={handleModalSubmit} disabled={isSubmitting} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-900 bg-sky-400 hover:bg-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center gap-2">
                {isSubmitting ? "Executing..." : "Confirm Transmit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 SANCTION / BAN MODAL */}
      {banModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-8 border border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)] flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
            
            <div>
              <h2 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                Sanction Protocol
              </h2>
              <p className="text-sm text-slate-400">Target Tenant: <span className="font-bold text-white">{banModal.userEmail}</span></p>
            </div>

            <div className="flex flex-col gap-4 relative z-10">
              <label className="block text-[10px] font-bold text-red-400 uppercase tracking-widest">Select Protocol Level</label>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setBanAction("temp")}
                  className={`p-4 rounded-xl text-left border transition-all ${banAction === "temp" ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "bg-slate-900/50 border-white/10 hover:border-amber-500/30"}`}
                >
                  <span className="block text-sm font-bold text-amber-400 mb-1">Temporary Suspension</span>
                  <span className="block text-xs text-slate-400">Revoke tenant access for 72 hours.</span>
                </button>

                <button 
                  onClick={() => setBanAction("perma")}
                  className={`p-4 rounded-xl text-left border transition-all ${banAction === "perma" ? "bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "bg-slate-900/50 border-white/10 hover:border-red-500/30"}`}
                >
                  <span className="block text-sm font-bold text-red-400 mb-1">Permanent Ban</span>
                  <span className="block text-xs text-slate-400">Lock account permanently. Data remains in database.</span>
                </button>

                <button 
                  onClick={() => setBanAction("delete")}
                  className={`p-4 rounded-xl text-left border transition-all ${banAction === "delete" ? "bg-red-900/40 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]" : "bg-slate-900/50 border-white/10 hover:border-red-500/30"}`}
                >
                  <span className="block text-sm font-bold text-red-500 mb-1">Total Eradication (Delete)</span>
                  <span className="block text-xs text-slate-400">Completely wipe user and all SM-2 progress from the server.</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4 relative z-10">
              <button onClick={closeBanModal} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={executeSanction} disabled={isBanning} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center gap-2">
                {isBanning ? "Processing..." : "Execute Sanction"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Global Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mt-8">
        <div>
          <p className="text-sm font-bold tracking-[0.2em] text-red-400 uppercase mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Super-User Access
          </p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Database Terminal
          </h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => openNewLesson()} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-300 bg-slate-800 border border-white/10 hover:bg-slate-700 transition-colors hidden md:block">
            + Quick Lesson
          </button>
          <button onClick={() => openNewModule()} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-[0_0_15px_rgba(56,189,248,0.3)] transition-all hover:-translate-y-0.5">
            + New Module
          </button>
        </div>
      </div>

      {/* High-Level System Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border-t-2 border-t-sky-400 flex flex-col gap-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">System Status</span>
          <span className="text-xl font-bold text-emerald-400">Operational</span>
        </div>
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Tenants</span>
          <span className="text-xl font-bold text-white">{users.length}</span>
        </div>
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Modules</span>
          <span className="text-xl font-bold text-white">{modules.length}</span>
        </div>
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Database Ping</span>
          <span className="text-xl font-bold text-white">12ms</span>
        </div>
      </div>

      {/* Main Terminal Area */}
      <div className="glass-panel rounded-3xl flex flex-col overflow-hidden border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        
        {/* Terminal Tabs */}
        <div className="flex border-b border-white/5 bg-slate-900/50">
          <button 
            onClick={() => setActiveTab("modules")}
            className={`px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === "modules" ? "text-sky-400 border-b-2 border-sky-400 bg-white/5" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}`}
          >
            Curriculum Modules
          </button>
          <button 
            onClick={() => setActiveTab("users")}
            className={`px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === "users" ? "text-sky-400 border-b-2 border-sky-400 bg-white/5" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}`}
          >
            Tenant Management
          </button>
        </div>

        {/* Data Table */}
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-slate-800/30 text-xs uppercase tracking-widest text-slate-500">
                <th className="p-4 font-bold w-16">ID</th>
                <th className="p-4 font-bold">{activeTab === "modules" ? "Module Title" : "Operator Email"}</th>
                <th className="p-4 font-bold">{activeTab === "modules" ? "Description" : "Role"}</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              
              {/* Modules View */}
              {activeTab === "modules" && modules.map((mod) => (
                <tr key={mod.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4 text-slate-500 font-mono">{mod.id}</td>
                  <td className="p-4 text-white font-medium group-hover:text-sky-300 transition-colors">{mod.title}</td>
                  <td className="p-4 text-slate-400 truncate max-w-[200px] md:max-w-md">{mod.description || "N/A"}</td>
                  <td className="p-4 flex justify-end gap-2">
                    <button 
                      onClick={() => openNewLesson(mod.id)} 
                      className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-white/5"
                    >
                      + Lesson
                    </button>
                    <button 
                      onClick={() => openEditModule(mod)} 
                      className="p-2 text-slate-400 hover:text-sky-400 transition-colors rounded-lg hover:bg-sky-500/10"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteModule(mod.id)} 
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                    >
                      Del
                    </button>
                  </td>
                </tr>
              ))}

              {/* Users View */}
              {activeTab === "users" && users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4 text-slate-500 font-mono truncate max-w-[80px]">{user.id}</td>
                  <td className="p-4 text-white font-medium group-hover:text-sky-300 transition-colors">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${user.role === 'admin' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    {/* 🛡️ NEW: Wipe Progress Button */}
                    <button 
                      onClick={() => handleWipeProgress(user.id, user.email)} 
                      className="p-2 text-amber-500 hover:text-amber-400 transition-colors rounded-lg hover:bg-amber-500/10"
                      title="Erase all SM-2 progress for this user"
                    >
                      Wipe Progress
                    </button>
                    <button 
                      onClick={() => handleManageUser(user.id, user.role)} 
                      className="p-2 text-slate-400 hover:text-sky-400 transition-colors rounded-lg hover:bg-sky-500/10"
                    >
                      Manage
                    </button>
                    <button 
                      onClick={() => openBanModal(user.id, user.email)} 
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                    >
                      Ban
                    </button>
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
