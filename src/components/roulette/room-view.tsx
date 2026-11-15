"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Crown, Dices, History, LogIn, LogOut, Plus, Share2, Users, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { inputClass } from "@/components/forms/fields";
import { EmptyState } from "@/components/states/empty-state";
import { Spinner } from "@/components/states/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CHALLENGE_CATEGORIES, type ChallengeCategory } from "@/content/challenges";
import { DIFFICULTIES, type Difficulty } from "@/lib/roulette/demo-challenges";
import { customChallengeSchema, isValidRoomCode, segmentForCategory } from "@/lib/roulette/engine";
import { LocalRoomTransport, RoomError, SupabaseRoomTransport, type RoomSnapshot, type RoomTransport } from "@/lib/roulette/room-transport";
import { ChallengeCard } from "./challenge-card";
import { ChallengeWheel } from "./challenge-wheel";
import { RouletteFilters } from "./filters";

export default function RoomView({ code }: { code: string }) {
  const auth = useAuth();
  if (!isValidRoomCode(code)) {
    return <EmptyState icon={Users} title="Code de salon invalide" description="Un code fait 6 caractères (lettres et chiffres, sans 0, O, 1 ni I)." action={<Button asChild><Link href="/roulette#salons">Retour aux salons</Link></Button>} />;
  }
  if (auth.status === "loading") return <Spinner label="Connexion au salon…" />;
  if (auth.status === "anonymous") {
    return (
      <EmptyState
        icon={LogIn}
        title={`Rejoins le salon ${code}`}
        description="Connecte-toi pour participer aux tirages avec ta crew."
        action={
          <Button asChild>
            <Link href={`/connexion?suite=/roulette/session/${code}`}>Se connecter</Link>
          </Button>
        }
      />
    );
  }
  return <Room code={code} transportFactory={() => (auth.status === "authenticated" ? new SupabaseRoomTransport(auth.supabase, code, auth.user.id) : new LocalRoomTransport(code))} />;
}

function Room({ code, transportFactory }: { code: string; transportFactory: () => RoomTransport }) {
  const router = useRouter();
  const [transport] = useState(transportFactory);
  const [snap, setSnap] = useState<RoomSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [categories, setCategories] = useState<Set<ChallengeCategory>>(new Set());
  const [shownSpinId, setShownSpinId] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    let alive = true;
    const unsubscribe = transport.subscribe((s) => alive && setSnap(s));
    transport
      .join()
      .then((s) => {
        if (!alive) return;
        setSnap(s);
        setShownSpinId(s.spins[0]?.id ?? null);
      })
      .catch((e: unknown) => alive && setError(e instanceof RoomError ? e.message : "Connexion au salon impossible."));
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [transport]);

  const latest = snap?.spins[0] ?? null;
  // Un nouveau tirage (différent de celui affiché) fait tourner la roue pour tout le salon
  const target = useMemo(
    () => (latest && latest.id !== shownSpinId ? { key: latest.id, index: segmentForCategory(latest.challenge.category) } : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- la cible ne dépend que du dernier tirage
    [latest?.id],
  );
  const animating = Boolean(latest && latest.id !== shownSpinId);
  const shown = snap?.spins.find((s) => s.id === shownSpinId) ?? (animating ? null : latest);
  const onDone = useCallback(() => setShownSpinId(latest?.id ?? null), [latest]);

  const spin = async () => {
    if (spinning || animating) return;
    setSpinning(true);
    try {
      await transport.spin({ difficulty, categories: [...categories] });
    } catch (e) {
      toast.error(e instanceof RoomError ? e.message : "Tirage impossible.");
    } finally {
      setSpinning(false);
    }
  };

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/roulette/session/${code}` : "";
  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copié`);
    } catch {
      toast.error("Copie impossible", { description: text });
    }
  };

  if (error) return <EmptyState icon={Users} title="Impossible de rejoindre ce salon" description={error} action={<Button asChild><Link href="/roulette#salons">Retour aux salons</Link></Button>} />;
  if (!snap) return <Spinner label="Connexion au salon…" />;

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-cyan uppercase">
            {transport.mode === "online" ? <Wifi className="size-3.5" aria-hidden /> : <WifiOff className="size-3.5" aria-hidden />}
            {transport.mode === "online" ? "Salon en ligne" : "Salon de démonstration"}
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-5xl">{snap.name}</h1>
          {transport.mode === "demo" && <p className="mt-2 text-sm text-muted-foreground">Mode démo : ouvre ce salon dans un autre onglet pour voir la synchronisation.</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => copy(code, "Code")}
            className="cursor-pointer rounded-2xl border border-pink/40 bg-pink/10 px-4 py-2 font-mono text-2xl tracking-[0.35em] text-white transition hover:bg-pink/20"
            aria-label={`Copier le code ${code}`}
          >
            {code}
          </button>
          <Button variant="outline" size="icon" onClick={() => copy(shareUrl, "Lien")} aria-label="Copier le lien d'invitation">
            <Share2 />
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              await transport.leave();
              router.push("/roulette");
            }}
          >
            <LogOut /> Quitter
          </Button>
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <section aria-labelledby="members-title" className="glass rounded-3xl p-5">
            <h2 id="members-title" className="flex items-center gap-2 font-bold">
              <Users className="size-5 text-cyan" aria-hidden /> Participants ({snap.members.length}/12)
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {snap.members.map((m) => (
                <li key={m.id} className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1 text-sm">
                  {m.isHost && <Crown className="size-3.5 text-[#ffb36b]" aria-label="Hôte" />}
                  {m.name}
                  {m.isMe && <Badge variant="cyan">toi</Badge>}
                </li>
              ))}
            </ul>
          </section>
          <RouletteFilters
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            categories={categories}
            toggleCategory={(c) =>
              setCategories((s) => {
                const n = new Set(s);
                if (n.has(c)) n.delete(c);
                else n.add(c);
                return n;
              })
            }
          />
          <div aria-live="polite" className="min-h-36">
            <AnimatePresence mode="wait">
              {shown ? (
                <motion.div key={shown.id} initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}>
                  <ChallengeCard challenge={shown.challenge} by={shown.by} />
                </motion.div>
              ) : (
                <motion.p key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl border border-dashed border-white/12 p-5 text-muted-foreground">
                  {animating ? "La roue tourne pour tout le salon…" : "Aucun tirage pour l'instant. Lance la roue !"}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <Button size="lg" onClick={spin} disabled={spinning || animating}>
            <Dices className={spinning || animating ? "animate-spin" : ""} /> Lancer pour tout le salon
          </Button>
        </div>
        <ChallengeWheel target={target} onDone={onDone} onHubClick={spin} disabled={spinning || animating} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="room-history" className="glass rounded-3xl p-5">
          <h2 id="room-history" className="flex items-center gap-2 font-bold">
            <History className="size-5 text-cyan" aria-hidden /> Historique du salon
          </h2>
          {snap.spins.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Les tirages apparaîtront ici.</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {snap.spins.slice(0, 15).map((s) => (
                <li key={s.id} className="flex items-center gap-3 text-sm">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: CHALLENGE_CATEGORIES.find((c) => c.id === s.challenge.category)?.color }} aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{s.challenge.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{s.by}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
        <CustomChallengeForm transport={transport} count={snap.customChallenges.length} />
      </div>
    </div>
  );
}

function CustomChallengeForm({ transport, count }: { transport: RoomTransport; count: number }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ChallengeCategory>("style");
  const [difficulty, setDifficulty] = useState<Difficulty>("moyenne");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = customChallengeSchema.safeParse({ title, category, difficulty });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setBusy(true);
    try {
      await transport.propose({ title: parsed.data.title, description: parsed.data.description || null, category, difficulty });
      setTitle("");
      setError(null);
      toast.success("Défi ajouté à la roue du salon.");
    } catch (err) {
      setError(err instanceof RoomError ? err.message : "Ajout impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="custom-title" className="glass rounded-3xl p-5">
      <h2 id="custom-title" className="flex items-center gap-2 font-bold">
        <Plus className="size-5 text-pink" aria-hidden /> Défis du salon ({count})
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Ajoute tes propres défis : ils ne servent qu&apos;à ce salon et ne rapportent pas d&apos;XP.</p>
      <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
        <label htmlFor="custom-title-input" className="sr-only">
          Ton défi
        </label>
        <input id="custom-title-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} placeholder="Faire tout le trajet en marche arrière" className={inputClass(error ?? undefined)} aria-invalid={Boolean(error)} />
        <div className="grid grid-cols-2 gap-2">
          <select value={category} onChange={(e) => setCategory(e.target.value as ChallengeCategory)} className={inputClass()} aria-label="Catégorie">
            {CHALLENGE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className={inputClass()} aria-label="Difficulté">
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        {error && (
          <p role="alert" className="text-xs text-pink">
            {error}
          </p>
        )}
        <Button type="submit" variant="outline" disabled={busy}>
          Ajouter au salon
        </Button>
      </form>
    </section>
  );
}
