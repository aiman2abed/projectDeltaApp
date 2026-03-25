"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";

// Define routes that do NOT require authentication
const PUBLIC_ROUTES = ["/login", "/signup", "/update-password"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const checkSecurityClearance = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

      if (!session && !isPublicRoute) {
        // Intruder detected on a private route -> Bounce to login
        router.push("/login");
      } else if (session && isPublicRoute) {
        // Logged-in user trying to access login/signup -> Bounce to dashboard
        router.push("/");
      } else {
        // Cleared!
        setIsAuthorized(true);
      }
    };

    checkSecurityClearance();

    // Listen for live login/logout events across tabs
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
      
      if (!session && !isPublicRoute) {
        router.push("/login");
      } else if (session && isPublicRoute) {
        router.push("/");
      } else {
        setIsAuthorized(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router, supabase.auth]);

  // Show a sleek "Verifying" screen while checking credentials to prevent flashing private data
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