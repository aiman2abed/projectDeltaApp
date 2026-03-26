"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  Home,
  Compass,
  BrainCircuit,
  BookOpen,
  Settings,
  UserStar,
} from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      setRoleLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      console.log("BottomNav auth user:", user);
      console.log("BottomNav auth user error:", userError);

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


      const admin = data?.role?.toLowerCase() === "admin";
      setIsAdmin(admin);
      setRoleLoading(false);
    };

    checkRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkRole();
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const baseNavItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Discover", href: "/discover", icon: Compass },
    { name: "Review", href: "/review", icon: BrainCircuit },
    { name: "Modules", href: "/modules", icon: BookOpen },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const navItems =
    !roleLoading && isAdmin
      ? [...baseNavItems, { name: "Admin", href: "/admin", icon: UserStar }]
      : baseNavItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-cyan-500/30 pb-safe">
      <div
        className="grid items-center h-16 px-1"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 touch-manipulation min-h-[44px] min-w-[44px] transition-colors duration-200 ${
                isActive ? "text-cyan-400" : "text-gray-500 hover:text-cyan-200"
              }`}
            >
              <Icon
                className={`w-6 h-6 transition-transform duration-200 ${
                  isActive
                    ? "scale-110 drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]"
                    : "scale-100"
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[9px] font-medium tracking-wide">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}