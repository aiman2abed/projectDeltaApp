"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";

// Routes that do NOT require authentication
const PUBLIC_ROUTES = ["/login", "/signup", "/update-password"];
// Routes meant for unauthenticated users only
const GUEST_ONLY_ROUTES = ["/login", "/signup"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  // Guard-level state controls whether private route content can render at all.
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    // Keeps route access synchronized with current session and current route classification.
    const checkSecurityClearance = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

      const isGuestOnly = GUEST_ONLY_ROUTES.includes(pathname);

      if (!session && !isPublicRoute) {
        setIsAuthorized(false);
        // Intruder detected on a private route -> Bounce to login
        router.push("/login");
      } else if (session && isGuestOnly) {
        setIsAuthorized(false);
        // Logged-in user trying to access login/signup -> Bounce to dashboard
        router.push("/");
      } else {
        // Cleared!
        setIsAuthorized(true);
      }
    };

    checkSecurityClearance();

    // Syncs cross-tab auth transitions so route protection remains consistent everywhere.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
      const isGuestOnly = GUEST_ONLY_ROUTES.includes(pathname);
      
      if (!session && !isPublicRoute) {
        setIsAuthorized(false);
        router.push("/login");
      } else if (session && isGuestOnly) {
        setIsAuthorized(false);
        router.push("/");
      } else {
        setIsAuthorized(true);
      }
    });

    const handleVisibilityOrFocus = () => {
      // Re-validates session when user returns to this tab/window.
      void checkSecurityClearance();
    };

    // Defensive polling for token/session drift between auth callbacks.
    const recheckInterval = window.setInterval(() => {
      void checkSecurityClearance();
    }, 1500);

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      window.clearInterval(recheckInterval);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router, supabase.auth]);

  // Loading layer owns the full viewport to prevent private content flash before access resolves.
  if (!isAuthorized && !PUBLIC_ROUTES.includes(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
          <div className="text-sky-400 font-mono tracking-[0.2em] text-xs uppercase animate-pulse">
            Verifying Security Clearance...
          </div>
        </div>
      </div>
    );
  }

  // Render the actual page if authorized
  return <>{children}</>;
}
