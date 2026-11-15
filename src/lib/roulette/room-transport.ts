"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChallengeCategory } from "@/content/challenges";
import type { Difficulty } from "./demo-challenges";
import { filterChallenges, officialChallenges, pickChallenge, type Challenge } from "./engine";

export type RoomMember = { id: string; name: string; isHost: boolean; isMe: boolean };
export type RoomSpin = { id: string; challenge: Challenge; by: string; at: string };
export type RoomSnapshot = { code: string; name: string; members: RoomMember[]; spins: RoomSpin[]; customChallenges: Challenge[] };
export type SpinFilters = { difficulty: Difficulty | null; categories: ChallengeCategory[] };

export interface RoomTransport {
  readonly mode: "online" | "demo";
  join(): Promise<RoomSnapshot>;
  spin(filters: SpinFilters): Promise<void>;
  propose(challenge: Omit<Challenge, "id" | "isCustom">): Promise<void>;
  leave(): Promise<void>;
  subscribe(listener: (snapshot: RoomSnapshot) => void): () => void;
}

export class RoomError extends Error {}

/* ------------------------------------------------------------------ */
/* Mode démo : synchronisation entre les onglets de l'appareil          */
/* ------------------------------------------------------------------ */

type DemoState = { name: string; spins: RoomSpin[]; customChallenges: Challenge[]; lastSpinAt: number };

export class LocalRoomTransport implements RoomTransport {
  readonly mode = "demo" as const;
  private channel: BroadcastChannel | null = null;
  private listeners = new Set<(s: RoomSnapshot) => void>();
  private tabs = new Map<string, number>();
  private readonly me = `onglet-${Math.random().toString(36).slice(2, 7)}`;
  private heartbeat: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly code: string,
    private readonly storage: Pick<Storage, "getItem" | "setItem"> | null = typeof window !== "undefined" ? window.localStorage : null,
  ) {}

  private key = () => `vice-atlas:room:${this.code}`;

  private read(): DemoState {
    try {
      const raw = this.storage?.getItem(this.key());
      if (raw) return JSON.parse(raw) as DemoState;
    } catch {
      /* stockage indisponible */
    }
    return { name: `Salon ${this.code}`, spins: [], customChallenges: [], lastSpinAt: 0 };
  }

  private write(state: DemoState) {
    try {
      this.storage?.setItem(this.key(), JSON.stringify(state));
    } catch {
      /* ignoré : la diffusion entre onglets suffit */
    }
  }

  private snapshot(state = this.read()): RoomSnapshot {
    const now = Date.now();
    const others = [...this.tabs.entries()].filter(([, seen]) => now - seen < 6000).map(([id]) => id);
    const members: RoomMember[] = [
      { id: this.me, name: "Toi", isHost: true, isMe: true },
      ...others.map((id, i) => ({ id, name: `Autre onglet ${i + 1}`, isHost: false, isMe: false })),
    ];
    return { code: this.code, name: state.name, members, spins: state.spins, customChallenges: state.customChallenges };
  }

  private emit() {
    const s = this.snapshot();
    this.listeners.forEach((l) => l(s));
  }

  async join() {
    if (typeof BroadcastChannel !== "undefined") {
      this.channel = new BroadcastChannel(`vice-atlas-room-${this.code}`);
      this.channel.onmessage = (ev: MessageEvent<{ type: string; from: string }>) => {
        if (ev.data.from === this.me) return;
        if (ev.data.type === "hello") {
          const isNew = !this.tabs.has(ev.data.from);
          this.tabs.set(ev.data.from, Date.now());
          if (isNew) this.channel?.postMessage({ type: "hello", from: this.me });
        }
        if (ev.data.type === "bye") this.tabs.delete(ev.data.from);
        this.emit();
      };
      this.channel.postMessage({ type: "hello", from: this.me });
      this.heartbeat = setInterval(() => {
        this.channel?.postMessage({ type: "hello", from: this.me });
        this.emit();
      }, 3000);
    }
    return this.snapshot();
  }

  async spin(filters: SpinFilters) {
    const state = this.read();
    if (Date.now() - state.lastSpinAt < 4000) throw new RoomError("Patiente quelques secondes entre deux tirages.");
    const pool = filterChallenges([...officialChallenges, ...state.customChallenges], filters.difficulty, new Set(filters.categories));
    const challenge = pickChallenge(pool);
    if (!challenge) throw new RoomError("Aucun défi ne correspond à ces filtres.");
    const spin: RoomSpin = { id: `${Date.now()}`, challenge, by: "Toi", at: new Date().toISOString() };
    const next = { ...state, spins: [spin, ...state.spins].slice(0, 30), lastSpinAt: Date.now() };
    this.write(next);
    this.channel?.postMessage({ type: "update", from: this.me });
    this.emit();
  }

  async propose(c: Omit<Challenge, "id" | "isCustom">) {
    const state = this.read();
    const challenge: Challenge = { ...c, id: `perso-${Date.now()}`, isCustom: true };
    this.write({ ...state, customChallenges: [...state.customChallenges, challenge].slice(-50) });
    this.channel?.postMessage({ type: "update", from: this.me });
    this.emit();
  }

  async leave() {
    this.channel?.postMessage({ type: "bye", from: this.me });
    this.dispose();
  }

  subscribe(listener: (s: RoomSnapshot) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.dispose();
    };
  }

  private dispose() {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.channel?.close();
    this.channel = null;
  }
}

/* ------------------------------------------------------------------ */
/* Mode en ligne : Supabase (tirage par la base + temps réel)           */
/* ------------------------------------------------------------------ */

type ChallengeRow = { id: string; title: string; description: string | null; category: ChallengeCategory; difficulty: Difficulty; is_custom: boolean };
const toChallenge = (r: ChallengeRow): Challenge => ({ id: r.id, title: r.title, description: r.description, category: r.category, difficulty: r.difficulty, isCustom: r.is_custom });

const ERRORS: Record<string, string> = {
  P0429: "Patiente quelques secondes entre deux tirages.",
  P0002: "Salon introuvable, fermé, ou aucun défi ne correspond à ces filtres.",
  P0001: "Ce salon est complet ou fermé.",
  "42501": "Tu ne fais pas partie de ce salon.",
  "23514": "Ce défi ne respecte pas les règles (10 à 140 caractères, sans lien ni triche).",
};

export class SupabaseRoomTransport implements RoomTransport {
  readonly mode = "online" as const;
  private roomId: string | null = null;
  private state: RoomSnapshot | null = null;
  private listeners = new Set<(s: RoomSnapshot) => void>();
  private channel: ReturnType<SupabaseClient["channel"]> | null = null;

  constructor(
    private readonly sb: SupabaseClient,
    private readonly code: string,
    private readonly userId: string,
  ) {}

  private fail(error: { code?: string; message?: string } | null): never {
    throw new RoomError((error?.code && ERRORS[error.code]) || "Action impossible pour le moment.");
  }

  private async load(): Promise<RoomSnapshot> {
    const id = this.roomId!;
    const [{ data: room }, { data: members }, { data: spins }, { data: custom }] = await Promise.all([
      this.sb.from("rooms").select("name,host_id").eq("id", id).single(),
      this.sb.from("room_members").select("user_id,profiles(username)").eq("room_id", id).order("joined_at"),
      this.sb
        .from("room_spins")
        .select("id,created_at,profiles(username),challenges(id,title,description,category,difficulty,is_custom)")
        .eq("room_id", id)
        .order("created_at", { ascending: false })
        .limit(30),
      this.sb.from("challenges").select("id,title,description,category,difficulty,is_custom").eq("room_id", id),
    ]);
    return {
      code: this.code,
      name: room?.name ?? `Salon ${this.code}`,
      members: (members ?? []).map((m) => ({
        id: m.user_id,
        name: (m.profiles as unknown as { username: string } | null)?.username ?? "Joueur",
        isHost: m.user_id === room?.host_id,
        isMe: m.user_id === this.userId,
      })),
      spins: (spins ?? []).flatMap((s) => {
        const c = s.challenges as unknown as ChallengeRow | null;
        return c ? [{ id: String(s.id), challenge: toChallenge(c), by: (s.profiles as unknown as { username: string } | null)?.username ?? "Joueur", at: s.created_at }] : [];
      }),
      customChallenges: ((custom ?? []) as ChallengeRow[]).map(toChallenge),
    };
  }

  private async refresh() {
    this.state = await this.load();
    this.listeners.forEach((l) => l(this.state!));
  }

  async join() {
    const { data, error } = await this.sb.rpc("join_room", { p_code: this.code });
    if (error) this.fail(error);
    this.roomId = data as string;
    this.channel = this.sb
      .channel(`room-${this.roomId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_spins", filter: `room_id=eq.${this.roomId}` }, () => void this.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${this.roomId}` }, () => void this.refresh())
      .subscribe();
    this.state = await this.load();
    return this.state;
  }

  async spin(filters: SpinFilters) {
    const { error } = await this.sb.rpc("spin_room", { p_code: this.code, p_difficulty: filters.difficulty, p_categories: filters.categories.length ? filters.categories : null });
    if (error) this.fail(error);
    await this.refresh();
  }

  async propose(c: Omit<Challenge, "id" | "isCustom">) {
    const { error } = await this.sb.rpc("propose_challenge", {
      p_title: c.title,
      p_description: c.description ?? "",
      p_category: c.category,
      p_difficulty: c.difficulty,
      p_room_code: this.code,
    });
    if (error) this.fail(error);
    await this.refresh();
  }

  async leave() {
    await this.sb.rpc("leave_room", { p_code: this.code });
    this.dispose();
  }

  subscribe(listener: (s: RoomSnapshot) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.dispose();
    };
  }

  private dispose() {
    if (this.channel) void this.sb.removeChannel(this.channel);
    this.channel = null;
  }
}
