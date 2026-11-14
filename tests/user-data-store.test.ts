import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createUserDataStore, STORAGE_KEY, type StorageLike } from "@/lib/user-data/store";

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) };
}

const fixedNow = () => new Date("2026-11-15T12:00:00Z");
let n = 0;
const make = (storage: StorageLike | null) =>
  createUserDataStore({ storage: () => storage, now: fixedNow, newId: () => `id-${++n}`, debounceMs: 100 });

describe("stockage des données joueur", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("démarre vide et sauvegarde automatiquement après un court délai", () => {
    const storage = memoryStorage();
    const store = make(storage);
    expect(store.getState().objectives).toEqual([]);
    store.toggleFavorite("rampe-des-docks");
    expect(store.getStatus()).toBe("saving");
    expect(storage.data[STORAGE_KEY]).toBeUndefined();
    vi.advanceTimersByTime(100);
    expect(store.getStatus()).toBe("saved");
    expect(JSON.parse(storage.data[STORAGE_KEY]).places["rampe-des-docks"].favorite).toBe(true);
  });

  it("recharge les données sauvegardées", () => {
    const storage = memoryStorage();
    const a = make(storage);
    a.setVisited("club-nautique", true);
    a.flush();
    const b = make(storage);
    expect(b.getState().places["club-nautique"].visitedAt).toBe("2026-11-15T12:00:00.000Z");
  });

  it("ignore des données corrompues", () => {
    const store = make(memoryStorage({ [STORAGE_KEY]: "{pas du json" }));
    expect(store.getState().places).toEqual({});
    const store2 = make(memoryStorage({ [STORAGE_KEY]: JSON.stringify({ version: 99 }) }));
    expect(store2.getState().version).toBe(1);
  });

  it("signale une erreur si le stockage est indisponible", () => {
    const store = make(null);
    store.setProgress("mission-introduction", true);
    vi.advanceTimersByTime(100);
    expect(store.getStatus()).toBe("error");
    expect(store.getState().progress["mission-introduction"]).toBeTruthy();
  });

  it("marquer deux fois comme visité garde la première date", () => {
    let t = 0;
    const store = createUserDataStore({ storage: () => memoryStorage(), now: () => new Date(Date.UTC(2026, 10, 15, 12, t++)) });
    store.setVisited("x", true);
    const first = store.getState().places.x.visitedAt;
    store.setVisited("x", true);
    expect(store.getState().places.x.visitedAt).toBe(first);
    store.setVisited("x", false);
    expect(store.getState().places.x.visitedAt).toBeUndefined();
  });

  it("valide les objectifs personnels", () => {
    const store = make(memoryStorage());
    expect(store.addObjective("  ")).toMatch(/au moins 3/);
    expect(store.addObjective("x".repeat(121))).toMatch(/120/);
    expect(store.addObjective("  Visiter les panoramas  ")).toBeNull();
    const [o] = store.getState().objectives;
    expect(o.title).toBe("Visiter les panoramas");
    expect(store.renameObjective(o.id, "ab")).not.toBeNull();
    expect(store.renameObjective(o.id, "Visiter tous les panoramas")).toBeNull();
    store.setObjectiveDone(o.id, true);
    expect(store.getState().objectives[0]).toMatchObject({ title: "Visiter tous les panoramas", done: true });
    store.removeObjective(o.id);
    expect(store.getState().objectives).toHaveLength(0);
  });

  it("limite le nombre d'objectifs à 100", () => {
    const store = make(memoryStorage());
    for (let i = 0; i < 100; i++) expect(store.addObjective(`Objectif ${i}`)).toBeNull();
    expect(store.addObjective("Un de trop")).toMatch(/limite de 100/);
  });

  it("gère les favoris et étapes de guide", () => {
    const store = make(memoryStorage());
    store.toggleGuideFavorite("g");
    expect(store.getState().guideFavorites).toEqual(["g"]);
    store.toggleGuideFavorite("g");
    expect(store.getState().guideFavorites).toEqual([]);
    store.toggleGuideStep("g", 2);
    store.toggleGuideStep("g", 0);
    expect(store.getState().guideSteps.g).toEqual([0, 2]);
    store.toggleGuideStep("g", 2);
    expect(store.getState().guideSteps.g).toEqual([0]);
  });

  it("prévient les abonnés à chaque changement", () => {
    const store = make(memoryStorage());
    const spy = vi.fn();
    const off = store.subscribe(spy);
    store.toggleFavorite("a");
    expect(spy).toHaveBeenCalled();
    off();
    spy.mockClear();
    store.toggleFavorite("a");
    expect(spy).not.toHaveBeenCalled();
  });
});
