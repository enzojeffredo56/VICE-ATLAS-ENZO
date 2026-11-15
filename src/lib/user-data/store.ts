import { emptyUserData, OBJECTIVE_MAX, objectiveTitleSchema, userDataSchema, type UserData } from "./schema";

export const STORAGE_KEY = "vice-atlas:user-data:v1";

export type StorageLike = Pick<Storage, "getItem" | "setItem">;
export type SaveStatus = "idle" | "saving" | "saved" | "error";

type Options = {
  storage: () => StorageLike | null;
  now?: () => Date;
  newId?: () => string;
  debounceMs?: number;
};

/**
 * Données personnelles du joueur (favoris, lieux visités, carnet, objectifs…).
 * Phase 2 : sauvegarde automatique dans le navigateur.
 * Phase 4 : la même interface sera synchronisée avec le compte (Supabase).
 */
export function createUserDataStore({ storage, now = () => new Date(), newId, debounceMs = 250 }: Options) {
  let state: UserData | null = null;
  let status: SaveStatus = "idle";
  /** Compteur de modifications faites par le joueur (pas par la synchronisation). */
  let revision = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();
  const makeId = newId ?? (() => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`));

  const emit = () => listeners.forEach((l) => l());

  function load(): UserData {
    try {
      const raw = storage()?.getItem(STORAGE_KEY);
      if (!raw) return emptyUserData();
      const parsed = userDataSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : emptyUserData();
    } catch {
      return emptyUserData();
    }
  }

  function persist() {
    if (timer) clearTimeout(timer);
    status = "saving";
    timer = setTimeout(() => {
      timer = null;
      try {
        const s = storage();
        if (!s) throw new Error("stockage indisponible");
        s.setItem(STORAGE_KEY, JSON.stringify(state));
        status = "saved";
      } catch {
        status = "error";
      }
      emit();
    }, debounceMs);
  }

  function getState(): UserData {
    if (!state) state = load();
    return state;
  }

  function update(mutate: (draft: UserData) => UserData) {
    revision++;
    state = { ...mutate(getState()), updatedAt: now().toISOString() };
    persist();
    emit();
  }

  const stamp = () => now().toISOString();

  return {
    getState,
    getStatus: () => status,
    getRevision: () => revision,
    /** Remplace tout l'état (données reçues du compte), sans compter comme une modification du joueur. */
    replaceAll(next: unknown): boolean {
      const parsed = userDataSchema.safeParse(next);
      if (!parsed.success) return false;
      state = parsed.data;
      persist();
      emit();
      return true;
    },
    /** Efface les données de l'appareil (déconnexion, changement de compte). */
    reset() {
      state = emptyUserData();
      persist();
      emit();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    /** Recharge depuis le stockage (autre onglet). */
    reload() {
      state = load();
      emit();
    },
    /** Écrit immédiatement (avant fermeture de la page). */
    flush() {
      if (!timer) return;
      clearTimeout(timer);
      timer = null;
      try {
        storage()?.setItem(STORAGE_KEY, JSON.stringify(state));
        status = "saved";
      } catch {
        status = "error";
      }
      emit();
    },

    toggleFavorite(slug: string) {
      update((d) => {
        const mark = d.places[slug] ?? {};
        return { ...d, places: { ...d.places, [slug]: { ...mark, favorite: !mark.favorite } } };
      });
    },
    setVisited(slug: string, visited: boolean) {
      update((d) => {
        const mark = { ...(d.places[slug] ?? {}) };
        if (visited) mark.visitedAt = mark.visitedAt ?? stamp();
        else delete mark.visitedAt;
        return { ...d, places: { ...d.places, [slug]: mark } };
      });
    },
    setProgress(itemId: string, done: boolean) {
      update((d) => {
        const progress = { ...d.progress };
        if (done) progress[itemId] = progress[itemId] ?? stamp();
        else delete progress[itemId];
        return { ...d, progress };
      });
    },
    /** Ajoute un objectif personnel. Renvoie un message d'erreur, ou null si tout va bien. */
    addObjective(title: string): string | null {
      const parsed = objectiveTitleSchema.safeParse(title);
      if (!parsed.success) return parsed.error.issues[0]?.message ?? "Objectif invalide.";
      if (getState().objectives.length >= OBJECTIVE_MAX) return `Tu as atteint la limite de ${OBJECTIVE_MAX} objectifs.`;
      update((d) => ({
        ...d,
        objectives: [...d.objectives, { id: makeId(), title: parsed.data, done: false, createdAt: stamp() }],
      }));
      return null;
    },
    renameObjective(id: string, title: string): string | null {
      const parsed = objectiveTitleSchema.safeParse(title);
      if (!parsed.success) return parsed.error.issues[0]?.message ?? "Objectif invalide.";
      update((d) => ({ ...d, objectives: d.objectives.map((o) => (o.id === id ? { ...o, title: parsed.data } : o)) }));
      return null;
    },
    setObjectiveDone(id: string, done: boolean) {
      update((d) => ({ ...d, objectives: d.objectives.map((o) => (o.id === id ? { ...o, done } : o)) }));
    },
    removeObjective(id: string) {
      update((d) => ({ ...d, objectives: d.objectives.filter((o) => o.id !== id) }));
    },
    toggleGuideFavorite(slug: string) {
      update((d) => ({
        ...d,
        guideFavorites: d.guideFavorites.includes(slug)
          ? d.guideFavorites.filter((s) => s !== slug)
          : [...d.guideFavorites, slug],
      }));
    },
    toggleGuideStep(slug: string, index: number) {
      update((d) => {
        const done = new Set(d.guideSteps[slug] ?? []);
        if (done.has(index)) done.delete(index);
        else done.add(index);
        return { ...d, guideSteps: { ...d.guideSteps, [slug]: [...done].sort((a, b) => a - b) } };
      });
    },
  };
}

export type UserDataStore = ReturnType<typeof createUserDataStore>;
