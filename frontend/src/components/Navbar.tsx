"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import Image from "next/image";
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Auth pages own their full-screen layout, so the shared navigation shell is suppressed there.
  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const handleLogout = async () => {
    // Interaction ownership: this clears auth state, then redirects into the guest route boundary.
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Define your Spirelay routes
  const navLinks = [
    { name: "Dashboard", href: "/" },
    { name: "Discover", href: "/discover" },
    { name: "Modules", href: "/modules" },
    { name: "Review", href: "/review" },
    { name: "Settings", href: "/settings" },
    { name: "Admin", href: "/admin" },
  ];

  return (
    // Sticky header layer that stays above page content with z-50 ownership.
    <header className="sticky top-0 z-50 w-full glass-panel border-b-0 border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left header region owns brand identity and desktop route navigation. */}
        <div className="flex items-center gap-8">
          
          {/* Brand Logo & Name */}
            <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity group">
            {/* Enlarged Logo Container */}
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
            {/* Architected Brand Name */}
            <div className="flex flex-col">
                <span className="font-black text-2xl tracking-tighter text-white leading-tight">
                SPIRELAY
                </span>
                <span className="text-[10px] font-bold tracking-[0.4em] text-sky-400 uppercase leading-tight -mt-0.5">
                Engineered Mastery
                </span>
            </div>
            </Link>
          {/* Desktop Navigation Links */}
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
        
        {/* Right header region owns session-level actions only. */}
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
