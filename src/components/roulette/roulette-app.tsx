"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useActionState, useCallback, useEffect, useState } from "react";
import { CalendarClock, Dices, History, Info, LogIn, Plus, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { FormMessage, SubmitButton, TextField, inputClass } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { CHALLENGE_CATEGORIES, type ChallengeCategory } from "@/content/challenges";
import type { FormState } from "@/lib/auth/schemas";
import { createRoomAction, proposeChallengeAction, submitWeeklyProofAction } from "@/lib/roulette/actions";
import { DIFFICULTIES, type Difficulty } from "@/lib/roulette/demo-challenges";
import {
  filterChallenges,
  generateRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
  pickChallenge,
  segmentForCategory,
  type Challenge,
} from "@/lib/roulette/engine";
import { formatParis, formatRemaining } from "@/lib/time/paris";
import { cn } from "@/lib/utils";
import { ChallengeCard } from "./challenge-card";
import { ChallengeWheel } from "./challenge-wheel";
import { RouletteFilters } from "./filters";

const HISTORY_KEY = "vice-atlas:roulette-history";
type HistoryItem = { challenge: Challenge; at: string };

function readHistory(): HistoryItem[] {
  try {
    return JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "[]") as HistoryItem[];
  } catch {
    return [];
  }
}

export type WeeklyInfo = { title: string; category: ChallengeCategory; difficulty: Difficulty; startsAt: string; endsAt: string; isDemo: boolean };

export default function RouletteApp({ challenges, weekly }: { challenges: Challenge[]; weekly: WeeklyInfo }) {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [categories, setCategories] = useState<Set<ChallengeCategory>>(new Set());
  const [target, setTarget] = useState<{ key: string; index: number } | null>(null);
  const [, setPending] = useState<Challenge | null>(null);
  const [result, setResult] = useState<Challenge | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => (typeof window === "undefined" ? [] : readHistory()));

  const toggleCategory = (c: ChallengeCategory) =>
    setCategories((s) => {
      const n = new Set(s);
      if (n.has(c)) n.delete(c);
      else n.add(c);
      return n;
    });

  const spin = () => {
    if (spinning) return;
    const challenge = pickChallenge(filterChallenges(challenges, difficulty, categories));
    if (!challenge) return toast.error("Aucun défi ne correspond à ces filtres.");
    setSpinning(true);
    setResult(null);
    setPending(challenge);
    setTarget({ key: `${Date.now()}`, index: segmentForCategory(challenge.category) });
  };

  const onDone = useCallback(() => {
    setSpinning(false);
    setPending((p) => {
      if (p) {
        setResult(p);
        setHistory((h) => {
          const next = [{ challenge: p, at: new Date().toISOString() }, ...h].slice(0, 10);
          try {
            window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
          } catch {
            /* historique facultatif */
          }
          return next;
        });
      }
      return null;
    });
  }, []);

  return (
    <div className="space-y-16">
      {/* Mode solo */}
      <section aria-labelledby="solo-title" className="grid items-center gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <h2 id="solo-title" className="text-2xl font-bold">
            Tire un défi
          </h2>
          <RouletteFilters difficulty={difficulty} setDifficulty={setDifficulty} categories={categories} toggleCategory={toggleCategory} />
          <div aria-live="polite" className="min-h-36">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div key={result.id + (history[0]?.at ?? "")} initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}>
                  <ChallengeCard challenge={result} />
                </motion.div>
              ) : (
                <motion.p key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl border border-dashed border-white/12 p-5 text-muted-foreground">
                  {spinning ? "La roue tourne…" : "Choisis tes filtres puis lance la roue."}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <Button size="lg" onClick={spin} disabled={spinning}>
            <Dices className={cn(spinning && "animate-spin")} /> {spinning ? "Ça tourne…" : "Lancer la roue"}
          </Button>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Les défis entre amis sont invérifiables : ils ne rapportent pas d&apos;XP. Seul le défi de la semaine, prouvé en vidéo, rapporte +100 XP.
          </p>
        </div>
        <ChallengeWheel target={target} onDone={onDone} onHubClick={spin} disabled={spinning} />
      </section>

      {history.length > 0 && (
        <section aria-labelledby="history-title">
          <h2 id="history-title" className="flex items-center gap-2 text-xl font-bold">
            <History className="size-5 text-cyan" aria-hidden /> Tes derniers tirages
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {history.map((h) => (
              <li key={h.at} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: CHALLENGE_CATEGORIES.find((c) => c.id === h.challenge.category)?.color }} aria-hidden />
                <span className="min-w-0 flex-1 truncate">{h.challenge.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{h.challenge.difficulty}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <RoomsPanel />
      <WeeklyPanel weekly={weekly} />
      <ProposePanel />
    </div>
  );
}

function RoomsPanel() {
  const auth = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const online = auth.status !== "disabled";

  const create = async () => {
    if (!online) return router.push(`/roulette/session/${generateRoomCode()}`);
    if (auth.status !== "authenticated") return router.push("/connexion?suite=/roulette");
    setBusy(true);
    const res = await createRoomAction(name || "Soirée GTA Roulette");
    setBusy(false);
    if (res.ok && res.code) router.push(`/roulette/session/${res.code}`);
    else toast.error(res.message ?? "Création impossible.");
  };

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    const c = normalizeRoomCode(code);
    if (!isValidRoomCode(c)) return toast.error("Le code fait 6 caractères (lettres et chiffres, sans 0, O, 1 ni I).");
    router.push(`/roulette/session/${c}`);
  };

  return (
    <section id="salons" aria-labelledby="rooms-title" className="glass scroll-mt-28 rounded-3xl p-6 sm:p-8">
      <h2 id="rooms-title" className="flex items-center gap-2 text-2xl font-bold">
        <Users className="size-6 text-pink" aria-hidden /> Salons privés
      </h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Crée un salon, partage son code à tes amis : chaque tirage s&apos;affiche en même temps chez tout le monde.
        {!online && " Mode démo : la synchronisation fonctionne entre les onglets de cet appareil."}
      </p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <label htmlFor="room-name" className="text-sm font-semibold">
            Créer un salon
          </label>
          <input id="room-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Soirée du vendredi" className={inputClass()} />
          <Button onClick={create} disabled={busy}>
            {auth.status === "anonymous" ? <LogIn /> : <Plus />} {auth.status === "anonymous" ? "Se connecter pour créer" : "Créer le salon"}
          </Button>
        </div>
        <form onSubmit={join} className="space-y-3">
          <label htmlFor="room-code" className="text-sm font-semibold">
            Rejoindre avec un code
          </label>
          <input
            id="room-code"
            value={code}
            onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
            placeholder="ABC234"
            autoCapitalize="characters"
            autoComplete="off"
            className={cn(inputClass(), "font-mono text-lg tracking-[0.4em] uppercase")}
          />
          <Button type="submit" variant="outline">
            Rejoindre
          </Button>
        </form>
      </div>
    </section>
  );
}

function WeeklyPanel({ weekly }: { weekly: WeeklyInfo }) {
  const auth = useAuth();
  const [state, action] = useActionState<FormState, FormData>(submitWeeklyProofAction, { ok: false });
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  const end = new Date(weekly.endsAt);
  const cat = CHALLENGE_CATEGORIES.find((c) => c.id === weekly.category);
  return (
    <section id="defi-semaine" aria-labelledby="weekly-title" className="neon-border glass scroll-mt-28 rounded-3xl p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="weekly-title" className="flex items-center gap-2 text-2xl font-bold">
          <Trophy className="size-6 text-[#ffb36b]" aria-hidden /> Défi de la semaine
        </h2>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1 text-sm">
          <CalendarClock className="size-4 text-cyan" aria-hidden /> Fin dans {formatRemaining(end.getTime() - now)}
        </span>
      </div>
      <p className="mt-5 font-display text-2xl font-semibold sm:text-3xl">{weekly.title}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {cat?.label} · {DIFFICULTIES.find((d) => d.value === weekly.difficulty)?.label} · jusqu&apos;au {formatParis(end)}
      </p>
      <p className="mt-4 rounded-2xl border border-turquoise/30 bg-turquoise/10 p-4 text-sm">
        <strong>+100 XP</strong> une fois par semaine, après vérification de ta vidéo par un modérateur (YouTube, clip Twitch ou Streamable).
      </p>
      {weekly.isDemo ? (
        <p className="mt-4 text-sm text-muted-foreground">Mode démo : l&apos;envoi de preuve s&apos;active avec les comptes joueurs.</p>
      ) : auth.status === "authenticated" ? (
        state.ok ? (
          <div className="mt-4">
            <FormMessage ok message={state.message} />
          </div>
        ) : (
          <form action={action} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end" noValidate>
            <TextField name="url" type="url" label="Lien de ta vidéo" placeholder="https://youtu.be/…" error={state.fieldErrors?.url} />
            <SubmitButton className="sm:w-auto">Envoyer ma preuve</SubmitButton>
            <div className="sm:col-span-2">
              <FormMessage ok={false} message={state.message} />
            </div>
          </form>
        )
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Connecte-toi pour envoyer ta preuve.</p>
      )}
    </section>
  );
}

function ProposePanel() {
  const auth = useAuth();
  const [state, action] = useActionState<FormState, FormData>(proposeChallengeAction, { ok: false });
  if (auth.status !== "authenticated") return null;
  const e = state.fieldErrors ?? {};
  return (
    <section aria-labelledby="propose-title" className="glass rounded-3xl p-6 sm:p-8">
      <h2 id="propose-title" className="text-2xl font-bold">
        Propose un défi à la communauté
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">Il sera ajouté à la roue après vérification : pas de triche, pas de lien, pas d&apos;argent réel.</p>
      {state.ok ? (
        <div className="mt-4">
          <FormMessage ok message={state.message} />
        </div>
      ) : (
        <form action={action} className="mt-5 grid gap-4 sm:grid-cols-2" noValidate>
          <div className="sm:col-span-2">
            <TextField name="title" label="Ton défi" maxLength={140} required error={e.title} hint="10 à 140 caractères" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="pc-category" className="text-sm font-medium">
              Catégorie
            </label>
            <select id="pc-category" name="category" className={inputClass()}>
              {CHALLENGE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="pc-difficulty" className="text-sm font-medium">
              Difficulté
            </label>
            <select id="pc-difficulty" name="difficulty" className={inputClass()}>
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <FormMessage ok={false} message={state.message} />
          </div>
          <SubmitButton className="sm:w-auto">Proposer</SubmitButton>
        </form>
      )}
    </section>
  );
}

