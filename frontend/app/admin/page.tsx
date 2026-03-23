"use client";

import { useState } from "react";

// Mock Database for the Admin View
const mockModulesDB = [
  { id: "mod_01", title: "Power Electronics: Rectifiers", status: "Published", cards: 142, lastUpdated: "2026-03-22" },
  { id: "mod_02", title: "VLSI: CMOS Layouts", status: "Published", cards: 89, lastUpdated: "2026-03-20" },
  { id: "mod_03", title: "Embedded: MIPS Architecture", status: "Draft", cards: 45, lastUpdated: "2026-03-23" },
  { id: "mod_04", title: "Control Theory: PID Tuning", status: "Published", cards: 112, lastUpdated: "2026-03-15" },
];

const mockUsersDB = [
  { id: "usr_001", name: "Aiman Abed", role: "Super Admin", status: "Active", lastLogin: "Just now" },
  { id: "usr_002", name: "Mohamad", role: "Admin", status: "Active", lastLogin: "2 hours ago" },
  { id: "usr_003", name: "Guest Student", role: "User", status: "Inactive", lastLogin: "4 days ago" },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"modules" | "users">("modules");

  return (
    <div className="w-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header & Global Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
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
          <button className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-300 bg-slate-800 border border-white/10 hover:bg-slate-700 transition-colors">
            Export Logs
          </button>
          <button className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-[0_0_15px_rgba(56,189,248,0.3)] transition-all hover:-translate-y-0.5">
            + Inject Payload
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
          <span className="text-xl font-bold text-white">{mockUsersDB.length}</span>
        </div>
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Modules</span>
          <span className="text-xl font-bold text-white">{mockModulesDB.length}</span>
        </div>
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Database Ping</span>
          <span className="text-xl font-bold text-white">24ms</span>
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
                <th className="p-4 font-bold">ID</th>
                <th className="p-4 font-bold">{activeTab === "modules" ? "Module Title" : "Operator Name"}</th>
                <th className="p-4 font-bold">{activeTab === "modules" ? "Cards" : "Role"}</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              
              {/* Modules View */}
              {activeTab === "modules" && mockModulesDB.map((mod) => (
                <tr key={mod.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4 text-slate-500 font-mono">{mod.id}</td>
                  <td className="p-4 text-white font-medium group-hover:text-sky-300 transition-colors">{mod.title}</td>
                  <td className="p-4 text-slate-400">{mod.cards}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${mod.status === 'Published' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>
                      {mod.status}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    <button className="p-2 text-slate-400 hover:text-sky-400 transition-colors rounded-lg hover:bg-sky-500/10">Edit</button>
                    <button className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10">Del</button>
                  </td>
                </tr>
              ))}

              {/* Users View */}
              {activeTab === "users" && mockUsersDB.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4 text-slate-500 font-mono">{user.id}</td>
                  <td className="p-4 text-white font-medium group-hover:text-sky-300 transition-colors">{user.name}</td>
                  <td className="p-4 text-slate-400">{user.role}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${user.status === 'Active' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    <button className="p-2 text-slate-400 hover:text-sky-400 transition-colors rounded-lg hover:bg-sky-500/10">Manage</button>
                    <button className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10">Ban</button>
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