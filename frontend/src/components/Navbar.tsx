"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import Image from "next/image";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const checkRole = async () => {
      setRoleLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAdmin(false);
        setRoleLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      console.log("role query data:", data);
      console.log("role query error:", error);

      const admin = data?.role?.toLowerCase() === "admin";
      setIsAdmin(admin);
      setRoleLoading(false);

      console.log("isAdmin state should become:", admin);
    };

    checkRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkRole();
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const baseLinks = [
    { name: "Dashboard", href: "/" },
    { name: "Discover", href: "/discover" },
    { name: "Modules", href: "/modules" },
    { name: "Review", href: "/review" },
    { name: "Settings", href: "/settings" },
  ];

  const navLinks = isAdmin
    ? [...baseLinks, { name: "Admin", href: "/admin" }]
    : baseLinks;

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b-0 border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity group">
            <div className="bg-gradient-to-tr from-cyan-400/70 to-indigo-500/30 rounded-2xl p-1 shadow-[0_0_25px_rgba(56,189,248,0.25)] group-hover:shadow-[0_0_35px_rgba(56,189,248,0.4)] transition-all duration-300">
              <div className="w-10 h-10 rounded-2xl bg-slate-800/40 border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.25)] group-hover:shadow-[0_0_35px_rgba(56,189,248,0.4)] transition-all duration-300 overflow-hidden">
                <Image
                  src="/spirelay_logo_noBg.png"
                  alt="Spirelay Logo"
                  width={56}
                  height={56}
                  className="object-contain p-3 scale-600 w-full h-full"
                  priority
                />
              </div>
            </div>

            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tighter text-white leading-tight">
                SPIRELAY
              </span>
              <span className="text-[10px] font-bold tracking-[0.4em] text-sky-400 uppercase leading-tight -mt-0.5">
                Engineered Mastery
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-white/10 text-sky-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-white/5"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="text-sm font-bold text-slate-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}