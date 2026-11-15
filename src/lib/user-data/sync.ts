"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserDataStore } from "./store";

export const SYNC_OWNER_KEY = "vice-atlas:sync-owner";

type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">;

/**
 * Synchronise le carnet local avec le compte :
 *  - premier passage de ce compte sur l'appareil → fusion (rien n'est perdu) ;
 *  - ensuite → on récupère l'état du compte, puis chaque modification locale
 *    est renvoyée (état complet) après une courte pause.
 * Les données d'un autre compte présentes sur l'appareil sont effacées d'abord.
 */
export function startUserDataSync(opts: {
  supabase: Pick<SupabaseClient, "rpc">;
  userId: string;
  store: UserDataStore;
  storage: Storage | null;
  debounceMs?: number;
  onError?: (message: string) => void;
}) {
  const { supabase, userId, store, storage, debounceMs = 1500, onError } = opts;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pushedRevision = store.getRevision();
  let unsubscribe: (() => void) | null = null;

  const owner = storage?.getItem(SYNC_OWNER_KEY) ?? null;
  if (owner && owner !== userId) store.reset();
  const mode = owner === userId ? "pull" : "merge";

  const push = async () => {
    timer = null;
    const revision = store.getRevision();
    if (stopped || revision === pushedRevision) return;
    const { error } = await supabase.rpc("sync_user_data", { payload: store.getState(), mode: "replace" });
    if (error) onError?.("Synchronisation impossible : tes changements restent enregistrés sur cet appareil.");
    else pushedRevision = revision;
  };

  const ready = (async () => {
    const { data, error } = await supabase.rpc("sync_user_data", { payload: mode === "merge" ? store.getState() : {}, mode });
    if (stopped) return;
    if (error) {
      onError?.("Synchronisation impossible pour le moment.");
    } else {
      store.replaceAll(data);
      storage?.setItem(SYNC_OWNER_KEY, userId);
    }
    pushedRevision = store.getRevision();
    unsubscribe = store.subscribe(() => {
      if (store.getRevision() === pushedRevision || timer) return;
      timer = setTimeout(push, debounceMs);
    });
  })();

  return {
    ready,
    /** Envoie immédiatement les changements en attente. */
    flush: async () => {
      if (timer) clearTimeout(timer);
      await push();
    },
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
      unsubscribe?.();
    },
  };
}

/** À la déconnexion : on efface les données privées de l'appareil. */
export function clearLocalAccountData(store: UserDataStore, storage: Storage | null) {
  store.reset();
  storage?.removeItem(SYNC_OWNER_KEY);
}
