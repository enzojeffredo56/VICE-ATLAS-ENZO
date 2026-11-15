"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { clearLocalAccountData, startUserDataSync } from "@/lib/user-data/sync";
import { userData } from "@/lib/user-data/use-user-data";

export type AuthState =
  | { status: "disabled" | "loading" | "anonymous"; user: null; profile: null; supabase: SupabaseClient | null }
  | { status: "authenticated"; user: { id: string; email: string | null }; profile: { username: string; avatar_url: string | null } | null; supabase: SupabaseClient };

const AuthContext = createContext<AuthState>({ status: "disabled", user: null, profile: null, supabase: null });

export const useAuth = () => useContext(AuthContext);

const safeStorage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => (isSupabaseConfigured ? createSupabaseBrowserClient() : null), []);
  const [state, setState] = useState<AuthState>(() =>
    supabase ? { status: "loading", user: null, profile: null, supabase } : { status: "disabled", user: null, profile: null, supabase: null },
  );

  useEffect(() => {
    if (!supabase) return;
    let sync: ReturnType<typeof startUserDataSync> | null = null;
    let currentId: string | null = null;

    const apply = async (user: { id: string; email?: string | null } | null) => {
      if (user?.id === currentId) return;
      sync?.stop();
      sync = null;
      if (!user) {
        if (currentId) clearLocalAccountData(userData, safeStorage());
        currentId = null;
        setState({ status: "anonymous", user: null, profile: null, supabase });
        return;
      }
      currentId = user.id;
      const { data: profile } = await supabase.from("profiles").select("username,avatar_url").eq("id", user.id).maybeSingle();
      setState({ status: "authenticated", user: { id: user.id, email: user.email ?? null }, profile, supabase });
      sync = startUserDataSync({ supabase, userId: user.id, store: userData, storage: safeStorage(), onError: (m) => toast.error(m) });
    };

    supabase.auth.getUser().then(({ data }) => apply(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void apply(session?.user ?? null);
    });
    const flush = () => void sync?.flush();
    window.addEventListener("pagehide", flush);
    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener("pagehide", flush);
      sync?.stop();
    };
  }, [supabase]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
