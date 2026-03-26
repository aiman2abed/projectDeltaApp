"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

export function useAdminRole() {
  const supabase = useMemo(() => createClient(), []);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const resolveRole = async () => {
      setRoleLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAdmin(false);
        setRoleLoading(false);
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      setIsAdmin(data?.role?.toLowerCase() === "admin");
      setRoleLoading(false);
    };

    void resolveRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void resolveRole();
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return { isAdmin, roleLoading };
}
