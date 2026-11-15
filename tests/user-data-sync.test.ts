import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createUserDataStore } from "@/lib/user-data/store";
import { emptyUserData } from "@/lib/user-data/schema";
import { clearLocalAccountData, startUserDataSync, SYNC_OWNER_KEY } from "@/lib/user-data/sync";

function memory() {
  const data: Record<string, string> = {};
  return { data, getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => void (data[k] = v), removeItem: (k: string) => void delete data[k] };
}

function fakeSupabase(serverState = emptyUserData()) {
  const calls: { mode: string; payload: unknown }[] = [];
  return {
    calls,
    rpc: vi.fn(async (_fn: string, args: { payload: unknown; mode: string }) => {
      calls.push(args);
      if (args.mode === "replace") return { data: args.payload, error: null };
      return { data: serverState, error: null };
    }),
  };
}

describe("synchronisation du carnet avec le compte", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fusionne lors de la première connexion sur l'appareil, puis mémorise le propriétaire", async () => {
    const storage = memory();
    const store = createUserDataStore({ storage: () => storage, debounceMs: 0 });
    store.toggleFavorite("rampe-des-docks");
    const server = { ...emptyUserData(), places: { "rampe-des-docks": { favorite: true }, "club-nautique": { visitedAt: "2026-11-01T00:00:00.000Z" } } };
    const sb = fakeSupabase(server);
    const sync = startUserDataSync({ supabase: sb as never, userId: "u1", store, storage });
    await sync.ready;
    expect(sb.calls[0].mode).toBe("merge");
    expect((sb.calls[0].payload as { places: object }).places).toHaveProperty("rampe-des-docks");
    expect(store.getState().places["club-nautique"]?.visitedAt).toBeTruthy();
    expect(storage.data[SYNC_OWNER_KEY]).toBe("u1");
    sync.stop();
  });

  it("se contente de récupérer les données lors des connexions suivantes", async () => {
    const storage = memory();
    storage.setItem(SYNC_OWNER_KEY, "u1");
    const store = createUserDataStore({ storage: () => storage });
    const sb = fakeSupabase();
    const sync = startUserDataSync({ supabase: sb as never, userId: "u1", store, storage });
    await sync.ready;
    expect(sb.calls.map((c) => c.mode)).toEqual(["pull"]);
    sync.stop();
  });

  it("efface les données d'un autre compte avant de synchroniser", async () => {
    const storage = memory();
    storage.setItem(SYNC_OWNER_KEY, "autre");
    const store = createUserDataStore({ storage: () => storage });
    store.addObjective("Objectif de quelqu'un d'autre");
    const sb = fakeSupabase();
    const sync = startUserDataSync({ supabase: sb as never, userId: "u1", store, storage });
    expect(store.getState().objectives).toHaveLength(0);
    await sync.ready;
    expect((sb.calls[0].payload as { objectives: unknown[] }).objectives).toHaveLength(0);
    sync.stop();
  });

  it("renvoie les modifications du joueur après une pause, une seule fois", async () => {
    const storage = memory();
    storage.setItem(SYNC_OWNER_KEY, "u1");
    const store = createUserDataStore({ storage: () => storage, debounceMs: 0 });
    const sb = fakeSupabase();
    const sync = startUserDataSync({ supabase: sb as never, userId: "u1", store, storage, debounceMs: 1000 });
    await sync.ready;
    store.toggleFavorite("a");
    store.toggleFavorite("b");
    await vi.advanceTimersByTimeAsync(999);
    expect(sb.calls.filter((c) => c.mode === "replace")).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(sb.calls.filter((c) => c.mode === "replace")).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(5000);
    expect(sb.calls.filter((c) => c.mode === "replace")).toHaveLength(1);
    sync.stop();
  });

  it("signale une erreur réseau sans perdre les données locales", async () => {
    const storage = memory();
    const store = createUserDataStore({ storage: () => storage });
    store.toggleFavorite("x");
    const onError = vi.fn();
    const sb = { rpc: vi.fn(async () => ({ data: null, error: { message: "réseau" } })) };
    const sync = startUserDataSync({ supabase: sb as never, userId: "u1", store, storage, onError });
    await sync.ready;
    expect(onError).toHaveBeenCalled();
    expect(store.getState().places.x?.favorite).toBe(true);
    sync.stop();
  });

  it("efface les données privées à la déconnexion", () => {
    const storage = memory();
    storage.setItem(SYNC_OWNER_KEY, "u1");
    const store = createUserDataStore({ storage: () => storage });
    store.toggleFavorite("x");
    clearLocalAccountData(store, storage);
    expect(store.getState().places).toEqual({});
    expect(storage.data[SYNC_OWNER_KEY]).toBeUndefined();
  });
});
