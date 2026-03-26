"use client";

/**
 * Client-side route gate that prevents private page flashes while session state initializes.
 * Final authorization is enforced server-side and via RLS; this only controls navigation flow.
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";

const PUBLIC_ROUTES = ["/login", "/signup", "/update-password"];
const GUEST_ONLY_ROUTES = ["/login", "/signup"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    const checkSecurityClearance = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
      const isGuestOnly = GUEST_ONLY_ROUTES.includes(pathname);

      if (!session && !isPublicRoute) {
        setIsAuthorized(false);
        router.push("/login");
        return;
      }

      if (session && isGuestOnly) {
        setIsAuthorized(false);
        router.push("/");
        return;
      }

      setIsAuthorized(true);
    };

    void checkSecurityClearance();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;

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
      void checkSecurityClearance();
    };

    const recheckInterval = window.setInterval(() => {
      void checkSecurityClearance();
    }, 30000);

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      cancelled = true;
      window.clearInterval(recheckInterval);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router, supabase]);

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

  return <>{children}</>;
}
