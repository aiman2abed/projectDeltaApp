"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-900">
      {/* LEFT SIDE: Brand / Graphic */}
      <div className="hidden lg:flex lg:w-1/2 bg-white relative overflow-hidden items-center justify-center">
        {/* Notebook margin line */}
        <div className="absolute left-10 top-0 h-full w-[2px] bg-red-300/60 pointer-events-none z-10" />

        {/* Soft center divider */}
        <div className="absolute right-0 top-0 h-full w-px bg-slate-200/70 pointer-events-none z-10" />

        {/* Background glows */}
        <div className="absolute left-[18%] top-[22%] h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-8%] left-[-8%] h-80 w-80 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />

        {/* Light grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        {/* Brand content */}
        <div className="relative z-20 px-12 py-16 max-w-xl text-center -translate-y-6">
          <div className="flex justify-center mb-4">
            <div className="drop-shadow-[0_0_24px_rgba(99,102,241,0.18)]">
              <div className="w-72 xl:w-[24rem] mx-auto">
                <Image
                  src="/spirelay_logo_noBg.png"
                  alt="Spirelay Logo"
                  width={900}
                  height={900}
                  className="object-contain w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>

          <p className="text-[15px] font-bold tracking-[0.18em] text-sky-500 uppercase mb-6">
            System Authorization
          </p>

          <p className="max-w-lg mx-auto text-lg text-slate-800 font-large leading-8">
            Access your personalized learning matrices and monitor your neural decay curves. <br/> 
            Welcome back to the terminal.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center lg:items-start p-8 sm:p-12 lg:pt-32 bg-slate-900 relative overflow-hidden">
        {/* Dark glows */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-700/70 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-sky-500/40 rounded-full blur-3xl opacity-40 pointer-events-none" />

        {/* Dark grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile brand */}
          <div className="lg:hidden mb-8 text-center">
            <div className="w-28 mx-auto mb-4">
              <Image
                src="/spirelay_logo_noBg.png"
                alt="Spirelay Logo"
                width={220}
                height={220}
                className="object-contain w-full h-auto"
                priority
              />
            </div>
            <p className="text-xs font-bold tracking-[0.18em] text-sky-400 uppercase">
              Spirelay
            </p>
          </div>

          {/* Form card */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 sm:p-10 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <div className="mb-10 text-center lg:text-left">
              <p className="text-xs font-bold tracking-[0.2em] text-sky-400 uppercase mb-3">
                Secure Portal
              </p>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Operator Login
              </h2>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-bold text-slate-200 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white/10 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-400/50 transition-all duration-200 placeholder:text-slate-400"
                  placeholder="engineer@example.com"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-bold text-slate-200">
                    Password
                  </label>
                  <a href="#" className="text-xs font-bold text-slate-400 hover:text-sky-400 transition-colors">
                    Recover keys?
                  </a>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white/10 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-400/50 transition-all duration-200 placeholder:text-slate-400"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm font-semibold flex items-center">
                  <span className="mr-2">⚠️</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.2)] text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? "Authenticating..." : "Initialize Session"}
              </button>
            </form>

            <div className="mt-8 text-center text-sm">
              <p className="text-slate-300 font-medium">
                No active credentials?{" "}
                <Link
                  href="/signup"
                  className="text-sky-400 font-bold hover:text-sky-300 transition-colors"
                >
                  Request access
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}