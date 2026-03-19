"use client"; 
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation"; 

const inter = Inter({ subsets: ["latin"] });

// Define how long a user can be inactive before being booted (in milliseconds)
// 15 minutes = 15 * 60 * 1000 = 900,000 ms
const INACTIVITY_LIMIT = 15 * 60 * 1000; 

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [role, setRole] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true); 
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Reference to hold our timeout timer so we can reset it
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if we are on an auth page
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  // 🚪 Manual & Auto Logout Function (Wrapped in useCallback so we can use it inside useEffects)
  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setRole(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current); // Kill the timer
    router.push("/login");
  }, [router, supabase]);

  // ==========================================
  // 1. GLOBAL AUTHENTICATION GUARD
  // ==========================================
  useEffect(() => {
    const enforceAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        if (!isAuthRoute) router.push("/login");
        setIsChecking(false);
        return;
      }

      if (session && isAuthRoute) {
        router.push("/");
        return;
      }

      try {
        const res = await fetch("http://127.0.0.1:8000/api/users/me", {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setRole(data.role);
        }
      } catch (error) {
        console.error("Failed to fetch user role", error);
      } finally {
        setIsChecking(false);
      }
    };

    enforceAuth();
  }, [pathname, router, supabase, isAuthRoute]);

  // ==========================================
  // 2. INACTIVITY AUTO-LOGOUT TRACKER
  // ==========================================
  useEffect(() => {
    // Don't run the inactivity tracker if they are already on the login/signup page
    if (isAuthRoute) return;

    const resetTimer = () => {
      // Clear the existing timer
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      // Start a new countdown
      timeoutRef.current = setTimeout(() => {
        console.log("User inactive for too long. Initiating auto-logout...");
        handleLogout();
      }, INACTIVITY_LIMIT);
    };

    // Start the timer immediately upon load
    resetTimer();

    // List of human interactions to watch for
    const events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart"];

    // Attach listeners to the browser window
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup function: remove listeners when the component unmounts
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isAuthRoute, handleLogout]);

  return (
    <html lang="en">
      <head>
        <title>Spirelay</title>
      </head>
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        
        {!isAuthRoute && (
          <nav className="bg-blue-900 text-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex-shrink-0 font-bold text-xl tracking-wider">
                  <Link href="/">⚡ Spirelay</Link>
                </div>
                
                <div className="flex space-x-4 items-center">
                  <Link href="/" className="hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">
                    Dashboard
                  </Link>

                  <Link href="/discover" className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm flex items-center gap-1">
                    <span>🔥</span> Discover
                  </Link>

                  <Link href="/modules" className="hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">
                    All Modules
                  </Link>
                  <Link href="/settings" className="text-slate-500 hover:text-slate-900 font-medium transition-colors">
                      Settings
                    </Link>

                  {role === "admin" && (
                    <Link href="/admin" className="text-red-400 font-bold px-3 py-2 rounded-md text-sm hover:text-red-300 border-l border-blue-800 ml-2 pl-4">
                      Admin Studio
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout} 
                    className="ml-4 bg-transparent border border-blue-700 text-blue-200 hover:text-white hover:border-white px-3 py-1.5 rounded-md text-sm font-medium transition cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          </nav>
        )}

        <main className={!isAuthRoute ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""}>
          {isChecking && !isAuthRoute ? (
             <div className="h-[50vh] flex items-center justify-center font-mono text-blue-900 font-bold tracking-widest uppercase animate-pulse">
               Securing Connection...
             </div>
          ) : (
            children
          )}
        </main>
      </body>
    </html>
  );
}