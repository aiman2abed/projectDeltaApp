"use client";

/**
 * Resolves whether the current authenticated user should see admin-only UI affordances.
 * Authorization is enforced by backend policies; this hook only controls presentation.
 */
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

export function useAdminRole() {
  const supabase = useMemo(() => createClient(), []);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const resolveRole = async () => {
      setRoleLoading(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!cancelled) {
            setIsAdmin(false);
            setRoleLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          if (!cancelled) {
            setIsAdmin(false);
            setRoleLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setIsAdmin(data?.role?.toLowerCase() === "admin");
          setRoleLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setRoleLoading(false);
        }
      }
    };

    void resolveRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void resolveRole();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return { isAdmin, roleLoading };
}
