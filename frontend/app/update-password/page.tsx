"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Image from "next/image";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false); 

  // Hardware lock to prevent React Strict Mode / Brave from burning the single-use code twice
  const exchangeLock = useRef(false); 

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      // 1. Give Supabase's internal PKCE handler a split second to work automatically
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 2. Check if Supabase successfully logged us in automatically!
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        if (isMounted) {
          setIsSessionReady(true);
          setError(null); // Wipe any false-positive errors
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        return; // EXIT EARLY! Do not attempt manual exchange.
      }

      // 3. If no session, check the URL for errors or codes
      const urlParams = new URLSearchParams(window.location.search);
      const errorDesc = urlParams.get("error_description");
      const code = urlParams.get("code");

      if (errorDesc && isMounted) {
        setError(errorDesc.replace(/\+/g, " "));
        return;
      }

      // 4. Try manual exchange ONLY if automatic failed or didn't run
      if (code && !exchangeLock.current && isMounted) {
        exchangeLock.current = true;
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError && isMounted) {
          setError("Recovery link is invalid or has expired. Please request a new one.");
        } else if (isMounted) {
          setIsSessionReady(true);
          setError(null);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else if (isMounted && !isSessionReady) {
        setError("Waiting for secure session initialization... If this persists, the link is expired.");
      }
    };

    // 5. Fallback Listener: If the session initializes late, catch it and wipe the error
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && isMounted) {
        setIsSessionReady(true);
        setError(null);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    });

    initializeSession();

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSessionReady) {
      setError("Secure session not established. Please click the link in your email again.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Encryption keys do not match. Please verify your new password.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setMessage("Keys successfully updated. Redirecting to Command Center...");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    }
  };

  const handleRemembered = async () => {
    // If they remembered it, sign them out of this temporary recovery session and send to login
    await supabase.auth.signOut();
    alert("There you go, you remember your password, no need to change it!");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex bg-slate-900">
      {/* LEFT SIDE: Brand / Graphic */}
      <div className="hidden lg:flex lg:w-1/2 bg-white relative overflow-hidden items-center justify-center">
        <div className="absolute left-10 top-0 h-full w-[2px] bg-red-300/60 pointer-events-none z-10" />
        <div className="absolute right-0 top-0 h-full w-px bg-slate-200/70 pointer-events-none z-10" />
        
        {/* Amber/Red glows to signify a security override event */}
        <div className="absolute left-[18%] top-[22%] h-72 w-72 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-8%] left-[-8%] h-80 w-80 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
        
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="relative z-20 px-12 py-16 max-w-xl text-center -translate-y-6">
          <div className="flex justify-center mb-4">
            <div className="drop-shadow-[0_0_24px_rgba(245,158,11,0.2)]">
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

          <p className="text-[15px] font-bold tracking-[0.18em] text-amber-500 uppercase mb-6 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Security Override
          </p>

          <p className="max-w-lg mx-auto text-lg text-slate-800 font-large leading-8">
            Your identity has been verified via secure email link. <br/>
            Please establish a new encryption key to restore terminal access.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center lg:items-start p-8 sm:p-12 lg:pt-32 bg-slate-900 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-amber-600/30 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-sky-500/20 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden mb-8 text-center">
            <div className="w-28 mx-auto mb-4">
              <Image src="/spirelay_logo_noBg.png" alt="Spirelay Logo" width={220} height={220} className="object-contain w-full h-auto" priority />
            </div>
            <p className="text-xs font-bold tracking-[0.18em] text-amber-400 uppercase">Spirelay</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 sm:p-10 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <div className="mb-10 text-center lg:text-left">
              <p className="text-xs font-bold tracking-[0.2em] text-amber-400 uppercase mb-3">Key Recovery</p>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Reset Password</h2>
            </div>

            <form className="space-y-6" onSubmit={handleUpdatePassword}>
              <div>
                <label className="block text-sm font-bold text-slate-200 mb-1.5">New Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white/10 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-400/50 transition-all duration-200 placeholder:text-slate-400"
                  placeholder="Min. 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-200 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white/10 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-400/50 transition-all duration-200 placeholder:text-slate-400"
                  placeholder="Re-type password"
                />
              </div>

              {error && !isSessionReady && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm font-semibold flex items-center">
                  <span className="mr-2">⚠️</span>{error}
                </div>
              )}
              
              {message && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-sm font-semibold flex items-center">
                  <span className="mr-2">✅</span>{message}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || !!message || !isSessionReady} 
                  className="w-full flex justify-center py-4 px-4 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] text-sm font-bold text-slate-900 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  {loading ? "Encrypting..." : isSessionReady ? "Update Keys" : "Initializing Session..."}
                </button>

                <button
                  type="button"
                  onClick={handleRemembered}
                  className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-bold text-slate-400 bg-transparent border border-white/10 hover:bg-white/5 hover:text-white transition-colors"
                >
                  Abort: I remembered my password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}